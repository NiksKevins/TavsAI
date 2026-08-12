-- CreateEnum value USER for MessageRole
DO $$ BEGIN
  ALTER TYPE "MessageRole" ADD VALUE 'USER';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Assistant topics
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "allowedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "restrictedTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- KnowledgeChunk embedding metadata
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "contentHash" TEXT;
ALTER TABLE "KnowledgeChunk" ADD COLUMN IF NOT EXISTS "embeddedAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_contentHash_idx" ON "KnowledgeChunk"("contentHash");

-- Conversation summary
ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- AiUsageEvent
CREATE TABLE IF NOT EXISTS "AiUsageEvent" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "conversationId" UUID,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DECIMAL(12,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiUsageEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AiUsageEvent_workspaceId_createdAt_idx" ON "AiUsageEvent"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "AiUsageEvent_conversationId_idx" ON "AiUsageEvent"("conversationId");

DO $$ BEGIN
  ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AiUsageEvent" ADD CONSTRAINT "AiUsageEvent_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Vector index for semantic search (cosine distance)
CREATE INDEX IF NOT EXISTS "KnowledgeChunk_embedding_hnsw_idx"
  ON "KnowledgeChunk"
  USING hnsw (embedding vector_cosine_ops);
