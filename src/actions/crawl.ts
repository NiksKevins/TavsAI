"use server";

import { revalidatePath } from "next/cache";

import { requireWorkspaceRole } from "@/lib/authz";
import { crawlPageLimitForEmail } from "@/lib/billing/founder-entitlements";
import { enqueueCrawlJob } from "@/lib/crawl/enqueue";
import {
  assertSafePublicUrl,
  normalizeWebsiteUrl,
  UnsafeUrlError,
} from "@/lib/crawl/url-safety";
import { prisma } from "@/lib/db";

export type CrawlActionResult =
  | { ok: true; crawlJobId?: string; websiteId?: string }
  | { ok: false; error: string };

/** Fail stale queued jobs so a dead Inngest event cannot block retries forever. */
async function clearStaleQueuedJobs(workspaceId: string, websiteId?: string) {
  const cutoff = new Date(Date.now() - 45 * 1000);
  await prisma.crawlJob.updateMany({
    where: {
      workspaceId,
      ...(websiteId ? { websiteId } : {}),
      status: "QUEUED",
      createdAt: { lt: cutoff },
    },
    data: {
      status: "FAILED",
      completedAt: new Date(),
      errorMessage: "stale_queued_timeout",
    },
  });
}

export async function saveWebsiteAndCrawlAction(
  _prev: CrawlActionResult | null,
  formData: FormData,
): Promise<CrawlActionResult> {
  const { workspace, membership, user } = await requireWorkspaceRole("ADMIN");
  void membership;

  const rawUrl = String(formData.get("websiteUrl") ?? "");

  let normalized: string;
  try {
    await assertSafePublicUrl(rawUrl);
    normalized = normalizeWebsiteUrl(rawUrl);
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "invalid_url" };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  const pageLimit = crawlPageLimitForEmail(
    subscription?.plan ?? "FREE",
    user.email,
  );

  await clearStaleQueuedJobs(workspace.id);

  const active = await prisma.crawlJob.findFirst({
    where: {
      workspaceId: workspace.id,
      status: { in: ["QUEUED", "CRAWLING", "PROCESSING"] },
    },
  });
  if (active) {
    return { ok: false, error: "crawl_in_progress" };
  }

  const website = await prisma.$transaction(async (tx) => {
    const existing = await tx.website.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "asc" },
    });

    const record = existing
      ? await tx.website.update({
          where: { id: existing.id },
          data: {
            url: normalized,
            normalizedUrl: normalized.toLowerCase(),
            status: "QUEUED",
          },
        })
      : await tx.website.create({
          data: {
            workspaceId: workspace.id,
            url: normalized,
            normalizedUrl: normalized.toLowerCase(),
            status: "QUEUED",
          },
        });

    await tx.businessInformation.update({
      where: { workspaceId: workspace.id },
      data: { websiteUrl: normalized },
    });

    return record;
  });

  const crawlJob = await prisma.crawlJob.create({
    data: {
      workspaceId: workspace.id,
      websiteId: website.id,
      status: "QUEUED",
      pageLimit,
    },
  });

  await enqueueCrawlJob({
    crawlJobId: crawlJob.id,
    workspaceId: workspace.id,
    websiteId: website.id,
  });

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/knowledge/website");

  return { ok: true, crawlJobId: crawlJob.id, websiteId: website.id };
}

export async function startCrawlAction(
  websiteId?: string,
): Promise<CrawlActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");

  const website = websiteId
    ? await prisma.website.findFirst({
        where: { id: websiteId, workspaceId: workspace.id },
      })
    : await prisma.website.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      });

  if (!website) {
    return { ok: false, error: "website_missing" };
  }

  try {
    await assertSafePublicUrl(website.url);
  } catch (error) {
    if (error instanceof UnsafeUrlError) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: "invalid_url" };
  }

  await clearStaleQueuedJobs(workspace.id, website.id);

  const active = await prisma.crawlJob.findFirst({
    where: {
      workspaceId: workspace.id,
      websiteId: website.id,
      status: { in: ["QUEUED", "CRAWLING", "PROCESSING"] },
    },
  });
  if (active) {
    return { ok: false, error: "crawl_in_progress" };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  const pageLimit = crawlPageLimitForEmail(
    subscription?.plan ?? "FREE",
    user.email,
  );

  const crawlJob = await prisma.$transaction(async (tx) => {
    await tx.website.update({
      where: { id: website.id },
      data: { status: "QUEUED" },
    });
    return tx.crawlJob.create({
      data: {
        workspaceId: workspace.id,
        websiteId: website.id,
        status: "QUEUED",
        pageLimit,
      },
    });
  });

  await enqueueCrawlJob({
    crawlJobId: crawlJob.id,
    workspaceId: workspace.id,
    websiteId: website.id,
  });

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/knowledge/website");

  return { ok: true, crawlJobId: crawlJob.id, websiteId: website.id };
}

export async function cancelCrawlAction(
  crawlJobId: string,
): Promise<CrawlActionResult> {
  const { workspace } = await requireWorkspaceRole("ADMIN");

  const job = await prisma.crawlJob.findFirst({
    where: {
      id: crawlJobId,
      workspaceId: workspace.id,
      status: { in: ["QUEUED", "CRAWLING", "PROCESSING"] },
    },
  });

  if (!job) {
    return { ok: false, error: "crawl_not_active" };
  }

  await prisma.crawlJob.update({
    where: { id: job.id },
    data: {
      status: "CANCELED",
      completedAt: new Date(),
      errorMessage: "canceled_by_user",
    },
  });

  await prisma.website.update({
    where: { id: job.websiteId },
    data: { status: "READY" },
  });

  if (process.env.INNGEST_EVENT_KEY) {
    try {
      const { inngest } = await import("@/inngest/client");
      await inngest.send({
        name: "crawl/website.canceled",
        data: { crawlJobId: job.id },
      });
    } catch {
      // Cancellation is already persisted; Inngest cancel is best-effort.
    }
  }

  revalidatePath("/dashboard/knowledge");
  revalidatePath("/dashboard/knowledge/website");

  return { ok: true, crawlJobId: job.id };
}
