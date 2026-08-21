import { Prisma } from "@prisma/client";

import {
  KNOWLEDGE_SOURCE_PRIORITY,
  sourceLabel,
} from "@/config/knowledge";
import { AI_CONFIG } from "@/config/ai";
import { prisma } from "@/lib/db";
import { embedTexts } from "@/services/knowledge/embedding-service";
import { expandRetrievalQuery } from "@/services/ai/grounding";
import type { KnowledgeDocumentType } from "@prisma/client";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  sourceUrl: string | null;
  title: string | null;
  sourceType: KnowledgeDocumentType;
  source: string;
  priority: number;
};

/**
 * Workspace-scoped semantic retrieval with source priority re-ranking.
 * Higher-priority sources win when similarity is close.
 */
export async function retrieveRelevantChunks(params: {
  workspaceId: string;
  query: string;
  topK?: number;
  relevanceThreshold?: number;
}): Promise<RetrievedChunk[]> {
  const topK = params.topK ?? AI_CONFIG.topK;
  const query = expandRetrievalQuery(params.query);
  const shortQuery = params.query.trim().split(/\s+/).filter(Boolean).length <= 2;
  const threshold =
    params.relevanceThreshold ??
    (shortQuery
      ? Math.min(AI_CONFIG.relevanceThreshold, 0.22)
      : AI_CONFIG.relevanceThreshold);

  const [queryEmbedding] = await embedTexts([query]);
  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  const fetchLimit = Math.max(topK * 4, 20);

  const rows = await prisma.$queryRaw<
    {
      id: string;
      documentId: string;
      content: string;
      similarity: number;
      sourceUrl: string | null;
      title: string | null;
      type: KnowledgeDocumentType;
    }[]
  >(Prisma.sql`
    SELECT
      c.id,
      c."documentId",
      c.content,
      (1 - (c.embedding <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}))::float8 AS similarity,
      d."sourceUrl" AS "sourceUrl",
      d.title AS title,
      d.type AS type
    FROM "KnowledgeChunk" c
    INNER JOIN "KnowledgeDocument" d ON d.id = c."documentId"
    WHERE c."workspaceId" = ${params.workspaceId}::uuid
      AND d."workspaceId" = ${params.workspaceId}::uuid
      AND c.embedding IS NOT NULL
      AND d.status = 'READY'
    ORDER BY c.embedding <=> ${Prisma.raw(`'${vectorLiteral}'::vector`)}
    LIMIT ${fetchLimit}
  `);

  const scored = rows
    .filter((row) => Number(row.similarity) >= threshold)
    .map((row) => {
      const priority = KNOWLEDGE_SOURCE_PRIORITY[row.type] ?? 100;
      // Prefer higher priority when similarity is within ~0.05
      const adjusted = Number(row.similarity) + (100 - priority) * 0.0008;
      return {
        id: row.id,
        documentId: row.documentId,
        content: row.content,
        similarity: Number(row.similarity),
        sourceUrl: row.sourceUrl,
        title: row.title,
        sourceType: row.type,
        source: sourceLabel(row.type),
        priority,
        adjusted,
      };
    })
    .sort((a, b) => b.adjusted - a.adjusted || a.priority - b.priority)
    .slice(0, topK)
    .map((row) => ({
      id: row.id,
      documentId: row.documentId,
      content: row.content,
      similarity: row.similarity,
      sourceUrl: row.sourceUrl,
      title: row.title,
      sourceType: row.sourceType,
      source: row.source,
      priority: row.priority,
    }));

  return scored;
}

export async function assertTenantIsolation(
  workspaceId: string,
  chunkIds: string[],
): Promise<boolean> {
  if (!chunkIds.length) return true;
  const foreign = await prisma.knowledgeChunk.count({
    where: {
      id: { in: chunkIds },
      NOT: { workspaceId },
    },
  });
  return foreign === 0;
}
