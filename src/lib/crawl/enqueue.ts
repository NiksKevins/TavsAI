import { after } from "next/server";

import { CRAWL_WEBSITE_EVENT, inngest } from "@/inngest/client";
import { runCrawlJob } from "@/lib/crawl/run-crawl-job";

function appBaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit && !/localhost|127\.0\.0\.1/i.test(explicit)) return explicit;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return explicit ?? null;
}

async function runCrawlInline(crawlJobId: string) {
  const base = appBaseUrl();
  const secret = process.env.CRAWL_WORKER_SECRET || process.env.AUTH_SECRET;

  // Prefer a dedicated long-running route (maxDuration 300) so crawls are not
  // cut off by the short server-action timeout.
  if (base && secret) {
    try {
      const res = await fetch(`${base}/api/crawl/run`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${secret}`,
        },
        body: JSON.stringify({ crawlJobId }),
      });
      if (res.ok) return;
      console.warn("[crawl] worker route failed", res.status, await res.text());
    } catch (error) {
      console.warn("[crawl] worker route unreachable, running in-process", error);
    }
  }

  await runCrawlJob(crawlJobId);
}

/**
 * Schedule a crawl to run.
 *
 * Always schedules work via Next.js `after()` so indexing works even when the
 * Inngest app is not synced. Optionally notifies Inngest when configured —
 * `runCrawlJob` claims QUEUED jobs atomically so a double-start is a no-op.
 */
export async function enqueueCrawlJob(input: {
  crawlJobId: string;
  workspaceId: string;
  websiteId: string;
}) {
  const { crawlJobId, workspaceId, websiteId } = input;

  after(async () => {
    try {
      await runCrawlInline(crawlJobId);
    } catch (error) {
      console.error("[crawl] job failed", { crawlJobId, error });
    }
  });

  if (!process.env.INNGEST_EVENT_KEY) {
    return;
  }

  try {
    await inngest.send({
      name: CRAWL_WEBSITE_EVENT,
      data: { crawlJobId, workspaceId, websiteId },
    });
  } catch (error) {
    console.warn(
      "[crawl] Inngest notify failed (inline after() already scheduled)",
      error,
    );
  }
}
