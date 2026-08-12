import { prisma } from "@/lib/db";

export async function getKnowledgeOverview(workspaceId: string) {
  const website = await prisma.website.findFirst({
    where: { workspaceId },
    orderBy: { createdAt: "asc" },
  });

  const latestJob = website
    ? await prisma.crawlJob.findFirst({
        where: { websiteId: website.id, workspaceId },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const [documentCount, chunkCount, documents] = await Promise.all([
    prisma.knowledgeDocument.count({
      where: { workspaceId, type: "WEBSITE_PAGE" },
    }),
    prisma.knowledgeChunk.count({ where: { workspaceId } }),
    prisma.knowledgeDocument.findMany({
      where: { workspaceId, type: "WEBSITE_PAGE" },
      orderBy: [{ updatedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        sourceUrl: true,
        status: true,
        updatedAt: true,
        metadata: true,
        _count: { select: { chunks: true } },
      },
    }),
  ]);

  return {
    website,
    latestJob,
    documentCount,
    chunkCount,
    documents,
  };
}

export function getDocumentCategory(metadata: unknown): string {
  if (
    metadata &&
    typeof metadata === "object" &&
    "category" in metadata &&
    typeof (metadata as { category: unknown }).category === "string"
  ) {
    return (metadata as { category: string }).category;
  }
  return "other";
}
