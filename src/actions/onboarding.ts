"use server";

import { IndustryTemplate } from "@prisma/client";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";

import { isSafeTone, temperatureForTone } from "@/config/assistant";
import { getCrawlPageLimit } from "@/config/crawl";
import {
  buildOnboardingAssistantDraft,
  ONBOARDING_INDUSTRY_CARDS,
  ONBOARDING_TOTAL_STEPS,
} from "@/config/onboarding-templates";
import { CRAWL_WEBSITE_EVENT, inngest } from "@/inngest/client";
import { requireWorkspace } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import {
  assertSafePublicUrl,
  normalizeWebsiteUrl,
  UnsafeUrlError,
} from "@/lib/crawl/url-safety";
import { runCrawlJob } from "@/lib/crawl/run-crawl-job";
import { prisma } from "@/lib/db";
import { uniqueWorkspaceSlug } from "@/lib/slug";
import { generateAssistantReply } from "@/services/ai/ai-service";
import { hasOpenAIKey } from "@/services/ai/openai-client";

export type OnboardingResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

export type OnboardingCrawlStatus = {
  status:
    | "idle"
    | "QUEUED"
    | "CRAWLING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELED";
  pagesDiscovered: number;
  pagesProcessed: number;
  pageLimit: number;
  knowledgeReady: boolean;
  chunkCount: number;
  documentCount: number;
  errorMessage: string | null;
  done: boolean;
};

async function enqueueCrawl(
  crawlJobId: string,
  workspaceId: string,
  websiteId: string,
) {
  try {
    await inngest.send({
      name: CRAWL_WEBSITE_EVENT,
      data: { crawlJobId, workspaceId, websiteId },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[onboarding/crawl] Inngest send failed — after() fallback",
        error,
      );
      after(async () => {
        try {
          await runCrawlJob(crawlJobId);
        } catch (err) {
          console.error("[onboarding/crawl] fallback failed", err);
        }
      });
      return;
    }
    throw error;
  }
}

export async function saveOnboardingStep(
  step: number,
  formData: FormData,
): Promise<OnboardingResult> {
  const { workspace, user } = await requireWorkspace();

  if (workspace.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  if (step > workspace.onboardingStep) {
    return { ok: false, error: "invalid_step" };
  }

  switch (step) {
    case 1: {
      const name = String(formData.get("businessName") ?? "").trim();
      if (name.length < 2) return { ok: false, error: "invalid_name" };

      const slug = await uniqueWorkspaceSlug(name, async (candidate) => {
        const existing = await prisma.workspace.findFirst({
          where: { slug: candidate, NOT: { id: workspace.id } },
          select: { id: true },
        });
        return Boolean(existing);
      });

      await prisma.$transaction([
        prisma.workspace.update({
          where: { id: workspace.id },
          data: {
            name,
            slug,
            onboardingStep: Math.max(workspace.onboardingStep, 2),
          },
        }),
        prisma.businessInformation.update({
          where: { workspaceId: workspace.id },
          data: { displayName: name },
        }),
      ]);
      break;
    }
    case 2: {
      const websiteUrl = String(formData.get("websiteUrl") ?? "");
      let normalized: string;
      try {
        await assertSafePublicUrl(websiteUrl);
        normalized = normalizeWebsiteUrl(websiteUrl);
      } catch (error) {
        if (error instanceof UnsafeUrlError) {
          return { ok: false, error: "invalid_url" };
        }
        return { ok: false, error: "invalid_url" };
      }

      await prisma.$transaction(async (tx) => {
        await tx.businessInformation.update({
          where: { workspaceId: workspace.id },
          data: { websiteUrl: normalized },
        });

        const existing = await tx.website.findFirst({
          where: { workspaceId: workspace.id },
          orderBy: { createdAt: "asc" },
        });

        if (existing) {
          await tx.website.update({
            where: { id: existing.id },
            data: {
              url: normalized,
              normalizedUrl: normalized.toLowerCase(),
            },
          });
        } else {
          await tx.website.create({
            data: {
              workspaceId: workspace.id,
              url: normalized,
              normalizedUrl: normalized.toLowerCase(),
            },
          });
        }

        await tx.workspace.update({
          where: { id: workspace.id },
          data: { onboardingStep: Math.max(workspace.onboardingStep, 3) },
        });
      });
      break;
    }
    case 3: {
      const industryRaw = String(formData.get("industry") ?? "");
      const industry = z.nativeEnum(IndustryTemplate).safeParse(industryRaw);
      if (
        !industry.success ||
        !ONBOARDING_INDUSTRY_CARDS.includes(industry.data)
      ) {
        return { ok: false, error: "invalid_industry" };
      }

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          industry: industry.data,
          onboardingStep: Math.max(workspace.onboardingStep, 4),
        },
      });

      // Auto-start crawl for step 4
      const crawl = await startOnboardingCrawlInternal(workspace.id);
      return { ok: true, data: { crawlJobId: crawl.crawlJobId } };
    }
    case 5: {
      const name = String(formData.get("assistantName") ?? "").trim();
      const greetingLv = String(formData.get("greetingLv") ?? "").trim();
      const greetingEn = String(formData.get("greetingEn") ?? "").trim();
      const toneRaw = String(formData.get("tone") ?? "professional");
      const suggestedRaw = String(formData.get("suggestedQuestions") ?? "");

      if (name.length < 2) return { ok: false, error: "invalid_assistant_name" };
      if (greetingLv.length < 2) return { ok: false, error: "invalid_greeting" };
      if (!isSafeTone(toneRaw)) return { ok: false, error: "invalid_tone" };

      const suggestedQuestions = suggestedRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 8);

      const draft = buildOnboardingAssistantDraft({
        industry: workspace.industry,
        businessName: workspace.name,
      });

      await prisma.assistantConfiguration.update({
        where: { workspaceId: workspace.id },
        data: {
          name,
          greetingLv,
          greetingEn: greetingEn || draft.greetingEn,
          tone: toneRaw,
          temperature: temperatureForTone(toneRaw),
          leadFields: draft.leadFields,
          qualificationQs: draft.qualificationQs,
          collectLeads: true,
          languageMode: "auto",
          systemInstructions:
            suggestedQuestions.length > 0
              ? `Suggested quick questions visitors may ask:\n${suggestedQuestions
                  .map((q) => `- ${q}`)
                  .join("\n")}`
              : null,
        },
      });

      // Persist suggested questions on widget as quick actions
      await prisma.widgetConfiguration.upsert({
        where: { workspaceId: workspace.id },
        create: {
          workspaceId: workspace.id,
          quickActions: suggestedQuestions.length
            ? suggestedQuestions
            : draft.suggestedQuestions,
        },
        update: {
          quickActions: suggestedQuestions.length
            ? suggestedQuestions
            : draft.suggestedQuestions,
        },
      });

      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { onboardingStep: Math.max(workspace.onboardingStep, 6) },
      });
      break;
    }
    case 6: {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: { onboardingStep: Math.max(workspace.onboardingStep, 7) },
      });
      break;
    }
    case 7: {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          onboardingStep: ONBOARDING_TOTAL_STEPS,
          onboardingCompletedAt: new Date(),
        },
      });

      await writeAuditLog({
        workspaceId: workspace.id,
        userId: user.id,
        action: "UPDATE",
        entityType: "Workspace",
        entityId: workspace.id,
        metadata: { event: "onboarding_completed" },
      });

      try {
        const { markPartnerWorkspaceActivated } = await import(
          "@/services/partner/partner-service"
        );
        await markPartnerWorkspaceActivated(workspace.id);
      } catch (error) {
        console.error("[partner/activate]", error);
      }

      redirect("/dashboard");
    }
    default:
      return { ok: false, error: "invalid_step" };
  }

  return { ok: true };
}

async function startOnboardingCrawlInternal(workspaceId: string) {
  const website = await prisma.website.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });
  if (!website) {
    return { crawlJobId: null as string | null };
  }

  const active = await prisma.crawlJob.findFirst({
    where: {
      workspaceId,
      status: { in: ["QUEUED", "CRAWLING", "PROCESSING"] },
    },
  });
  if (active) {
    return { crawlJobId: active.id };
  }

  // Already completed recently — reuse status; don't force re-crawl
  const latest = await prisma.crawlJob.findFirst({
    where: { workspaceId, websiteId: website.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest?.status === "COMPLETED") {
    return { crawlJobId: latest.id };
  }

  try {
    await assertSafePublicUrl(website.url);
  } catch {
    return { crawlJobId: null };
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  const pageLimit = getCrawlPageLimit(subscription?.plan ?? "FREE");

  const crawlJob = await prisma.$transaction(async (tx) => {
    await tx.website.update({
      where: { id: website.id },
      data: { status: "QUEUED" },
    });
    return tx.crawlJob.create({
      data: {
        workspaceId,
        websiteId: website.id,
        status: "QUEUED",
        pageLimit,
      },
    });
  });

  await enqueueCrawl(crawlJob.id, workspaceId, website.id);
  return { crawlJobId: crawlJob.id };
}

/** Poll crawl + knowledge progress (real DB numbers only). */
export async function getOnboardingCrawlStatus(): Promise<OnboardingCrawlStatus> {
  const { workspace } = await requireWorkspace();

  const [job, documentCount, chunkCount] = await Promise.all([
    prisma.crawlJob.findFirst({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.knowledgeDocument.count({
      where: { workspaceId: workspace.id, status: "READY" },
    }),
    prisma.knowledgeChunk.count({ where: { workspaceId: workspace.id } }),
  ]);

  if (!job) {
    return {
      status: "idle",
      pagesDiscovered: 0,
      pagesProcessed: 0,
      pageLimit: 0,
      knowledgeReady: false,
      chunkCount: 0,
      documentCount: 0,
      errorMessage: null,
      done: false,
    };
  }

  const terminal = ["COMPLETED", "FAILED", "CANCELED"].includes(job.status);
  const knowledgeReady = documentCount > 0 || chunkCount > 0;

  return {
    status: job.status,
    pagesDiscovered: job.pagesDiscovered,
    pagesProcessed: job.pagesProcessed,
    pageLimit: job.pageLimit,
    knowledgeReady,
    chunkCount,
    documentCount,
    errorMessage: job.errorMessage,
    done: terminal,
  };
}

/** After crawl finishes — apply industry template and advance to customize step. */
export async function generateOnboardingAssistantAction(): Promise<OnboardingResult> {
  const { workspace } = await requireWorkspace();
  if (workspace.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  const draft = buildOnboardingAssistantDraft({
    industry: workspace.industry,
    businessName: workspace.name,
  });

  await prisma.assistantConfiguration.update({
    where: { workspaceId: workspace.id },
    data: {
      name: draft.name,
      greetingLv: draft.greetingLv,
      greetingEn: draft.greetingEn,
      tone: draft.tone,
      temperature: temperatureForTone(draft.tone),
      leadFields: draft.leadFields,
      qualificationQs: draft.qualificationQs,
      collectLeads: true,
      languageMode: "auto",
      systemInstructions: `Suggested quick questions visitors may ask:\n${draft.suggestedQuestions
        .map((q) => `- ${q}`)
        .join("\n")}`,
    },
  });

  await prisma.widgetConfiguration.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      quickActions: draft.suggestedQuestions,
    },
    update: {
      quickActions: draft.suggestedQuestions,
    },
  });

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { onboardingStep: Math.max(workspace.onboardingStep, 5) },
  });

  return {
    ok: true,
    data: draft,
  };
}

export async function skipOnboardingCrawlAction(): Promise<OnboardingResult> {
  const { workspace } = await requireWorkspace();
  await generateOnboardingAssistantAction();
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { onboardingStep: Math.max(workspace.onboardingStep, 5) },
  });
  return { ok: true };
}

export async function onboardingPreviewChatAction(
  message: string,
): Promise<OnboardingResult> {
  const { workspace } = await requireWorkspace();
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 500) {
    return { ok: false, error: "invalid_question" };
  }

  try {
    if (!hasOpenAIKey()) {
      return {
        ok: true,
        data: {
          answer:
            "OPENAI_API_KEY nav iestatīts. Pievienojiet atslēgu, lai redzētu dzīvas atbildes — konfigurācija jau ir saglabāta.",
          usedAi: false,
        },
      };
    }

    const result = await generateAssistantReply({
      workspaceId: workspace.id,
      message: trimmed,
      visitorId: `onboarding-${workspace.id}`,
      locale: workspace.primaryLocale,
    });

    return {
      ok: true,
      data: {
        answer: result.answer,
        usedAi: true,
        conversationId: result.conversationId,
      },
    };
  } catch (error) {
    console.error("[onboarding/preview]", error);
    return { ok: false, error: "preview_failed" };
  }
}

export async function restartOnboardingCrawlAction(): Promise<OnboardingResult> {
  const { workspace } = await requireWorkspace();
  const result = await startOnboardingCrawlInternal(workspace.id);
  if (!result.crawlJobId) {
    return { ok: false, error: "crawl_start_failed" };
  }
  return { ok: true, data: result };
}
