import { getTranslations } from "next-intl/server";

import { CrawlControls } from "@/components/knowledge/crawl-controls";
import { DocumentExplorer } from "@/components/knowledge/document-explorer";
import { requireWorkspace } from "@/lib/authz";
import { getKnowledgeOverview } from "@/lib/knowledge/queries";

export default async function KnowledgeWebsitePage() {
  const t = await getTranslations("knowledge");
  const { workspace } = await requireWorkspace();
  const data = await getKnowledgeOverview(workspace.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("websitePage.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("websitePage.subtitle")}</p>
      </div>

      <CrawlControls
        websiteUrl={data.website?.url ?? null}
        websiteStatus={data.website?.status ?? null}
        job={
          data.latestJob
            ? {
                id: data.latestJob.id,
                status: data.latestJob.status,
                pagesDiscovered: data.latestJob.pagesDiscovered,
                pagesProcessed: data.latestJob.pagesProcessed,
                pageLimit: data.latestJob.pageLimit,
                errorMessage: data.latestJob.errorMessage,
                startedAt: data.latestJob.startedAt?.toISOString() ?? null,
                completedAt: data.latestJob.completedAt?.toISOString() ?? null,
              }
            : null
        }
      />

      <DocumentExplorer documents={data.documents} />
    </div>
  );
}
