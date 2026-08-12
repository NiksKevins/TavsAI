import { isSafeTone } from "@/config/assistant";
import { buildOnboardingAssistantDraft } from "@/config/onboarding-templates";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";
import type { OnboardingCrawlStatus } from "@/actions/onboarding";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default async function OnboardingPage() {
  const { workspace } = await requireWorkspace();

  const [business, assistant, website, widget, crawlJob, documentCount, chunkCount] =
    await Promise.all([
      prisma.businessInformation.findUnique({
        where: { workspaceId: workspace.id },
      }),
      prisma.assistantConfiguration.findUnique({
        where: { workspaceId: workspace.id },
      }),
      prisma.website.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "asc" },
      }),
      prisma.widgetConfiguration.upsert({
        where: { workspaceId: workspace.id },
        create: { workspaceId: workspace.id },
        update: {},
      }),
      prisma.crawlJob.findFirst({
        where: { workspaceId: workspace.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.knowledgeDocument.count({
        where: { workspaceId: workspace.id, status: "READY" },
      }),
      prisma.knowledgeChunk.count({ where: { workspaceId: workspace.id } }),
    ]);

  const draft = buildOnboardingAssistantDraft({
    industry: workspace.industry,
    businessName: business?.displayName ?? workspace.name,
  });

  const assistantDraft = {
    name: assistant?.name && assistant.name !== "AI darbinieks"
      ? assistant.name
      : draft.name,
    greetingLv: assistant?.greetingLv || draft.greetingLv,
    greetingEn: assistant?.greetingEn || draft.greetingEn,
    tone: isSafeTone(assistant?.tone ?? "") ? assistant!.tone as typeof draft.tone : draft.tone,
    suggestedQuestions:
      widget.quickActions?.length > 0
        ? widget.quickActions
        : draft.suggestedQuestions,
    leadFields: draft.leadFields,
    qualificationQs: draft.qualificationQs,
  };

  const initialCrawl: OnboardingCrawlStatus = crawlJob
    ? {
        status: crawlJob.status,
        pagesDiscovered: crawlJob.pagesDiscovered,
        pagesProcessed: crawlJob.pagesProcessed,
        pageLimit: crawlJob.pageLimit,
        knowledgeReady: documentCount > 0 || chunkCount > 0,
        chunkCount,
        documentCount,
        errorMessage: crawlJob.errorMessage,
        done: ["COMPLETED", "FAILED", "CANCELED"].includes(crawlJob.status),
      }
    : {
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

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001"
  ).replace(/\/$/, "");

  return (
    <OnboardingWizard
      initialStep={workspace.onboardingStep}
      defaults={{
        businessName: business?.displayName ?? workspace.name,
        websiteUrl: business?.websiteUrl ?? website?.url ?? "",
        industry: workspace.industry,
        assistant: assistantDraft,
      }}
      widgetPublicKey={widget.publicKey}
      appUrl={appUrl}
      initialCrawl={initialCrawl}
    />
  );
}
