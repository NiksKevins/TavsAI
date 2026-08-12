import { Prisma } from "@prisma/client";

import { AI_CONFIG } from "@/config/ai";
import { sha256 } from "@/lib/crawl/hash";
import { prisma } from "@/lib/db";
import { getOpenAIClient } from "@/services/ai/openai-client";
import { recordAiUsage } from "@/services/ai/cost-service";

function toVectorLiteral(values: number[]): string {
  if (
    values.length !== AI_CONFIG.embeddingDimensions ||
    values.some((n) => !Number.isFinite(n))
  ) {
    throw new Error("invalid_embedding_vector");
  }
  return `[${values.join(",")}]`;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) return [];
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: AI_CONFIG.embeddingModel,
    input: texts,
  });

  const sorted = [...response.data].sort((a, b) => a.index - b.index);
  return sorted.map((row) => row.embedding);
}

/**
 * Embed chunks that are missing embeddings or whose contentHash changed.
 * Reuses embeddings when contentHash is unchanged.
 */
export async function embedChunksForDocument(params: {
  workspaceId: string;
  documentId: string;
}): Promise<{ embedded: number; skipped: number }> {
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      workspaceId: params.workspaceId,
      documentId: params.documentId,
    },
    orderBy: { chunkIndex: "asc" },
  });

  let embedded = 0;
  let skipped = 0;
  let inputTokens = 0;

  for (const chunk of chunks) {
    const hash = sha256(chunk.content);
    const existing = await prisma.$queryRaw<
      { has_embedding: boolean }[]
    >`
      SELECT (embedding IS NOT NULL) AS has_embedding
      FROM "KnowledgeChunk"
      WHERE id = ${chunk.id}::uuid
    `;

    if (
      chunk.contentHash === hash &&
      existing[0]?.has_embedding &&
      chunk.embeddedAt
    ) {
      skipped += 1;
      continue;
    }

    const [vector] = await embedTexts([chunk.content]);
    inputTokens += chunk.tokenCount ?? Math.ceil(chunk.content.length / 4);

    await prisma.$executeRaw`
      UPDATE "KnowledgeChunk"
      SET
        embedding = ${Prisma.raw(`'${toVectorLiteral(vector)}'::vector`)},
        "contentHash" = ${hash},
        "embeddedAt" = NOW(),
        "updatedAt" = NOW()
      WHERE id = ${chunk.id}::uuid
        AND "workspaceId" = ${params.workspaceId}::uuid
    `;
    embedded += 1;
  }

  if (inputTokens > 0) {
    await recordAiUsage({
      workspaceId: params.workspaceId,
      model: AI_CONFIG.embeddingModel,
      inputTokens,
      outputTokens: 0,
    });
  }

  return { embedded, skipped };
}

export async function embedChunksForWorkspaceDocuments(
  workspaceId: string,
  documentIds: string[],
) {
  let embedded = 0;
  let skipped = 0;
  for (const documentId of documentIds) {
    const result = await embedChunksForDocument({ workspaceId, documentId });
    embedded += result.embedded;
    skipped += result.skipped;
  }
  return { embedded, skipped };
}
