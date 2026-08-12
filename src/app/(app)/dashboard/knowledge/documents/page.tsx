import { getTranslations } from "next-intl/server";

import { DocumentUploadManager } from "@/components/knowledge/document-upload-manager";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export default async function KnowledgeDocumentsPage() {
  const t = await getTranslations("knowledge.documents");
  const { workspace } = await requireWorkspace();

  const documents = await prisma.knowledgeDocument.findMany({
    where: { workspaceId: workspace.id, type: "UPLOAD" },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chunks: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <DocumentUploadManager
        documents={documents.map((d) => ({
          id: d.id,
          title: d.title,
          status: d.status,
          mimeType: d.mimeType,
          chunkCount: d._count.chunks,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
