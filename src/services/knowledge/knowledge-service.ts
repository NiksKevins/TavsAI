import { prisma } from "@/lib/db";
import { embedChunksForDocument } from "@/services/knowledge/embedding-service";

export async function getWorkspaceKnowledgeStats(workspaceId: string) {
  const [documents, chunks, embedded] = await Promise.all([
    prisma.knowledgeDocument.count({
      where: { workspaceId, status: "READY" },
    }),
    prisma.knowledgeChunk.count({ where: { workspaceId } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "KnowledgeChunk"
      WHERE "workspaceId" = ${workspaceId}::uuid
        AND embedding IS NOT NULL
    `,
  ]);

  return {
    documents,
    chunks,
    embeddedChunks: Number(embedded[0]?.count ?? 0),
  };
}

export async function ensureDocumentEmbeddings(params: {
  workspaceId: string;
  documentId: string;
}) {
  const doc = await prisma.knowledgeDocument.findFirst({
    where: { id: params.documentId, workspaceId: params.workspaceId },
    select: { id: true },
  });
  if (!doc) {
    throw new Error("document_not_found");
  }
  return embedChunksForDocument(params);
}
