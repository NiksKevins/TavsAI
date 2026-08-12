-- Phase 7: assistant configuration + versioning
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "languageMode" TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "handoffTriggers" JSONB;
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "handoffCustomRules" TEXT;
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "AssistantConfigurationVersion" (
  "id" UUID NOT NULL,
  "workspaceId" UUID NOT NULL,
  "assistantId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "snapshot" JSONB NOT NULL,
  "createdById" UUID,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssistantConfigurationVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AssistantConfigurationVersion_assistantId_version_key"
  ON "AssistantConfigurationVersion"("assistantId", "version");
CREATE INDEX IF NOT EXISTS "AssistantConfigurationVersion_workspaceId_createdAt_idx"
  ON "AssistantConfigurationVersion"("workspaceId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "AssistantConfigurationVersion"
    ADD CONSTRAINT "AssistantConfigurationVersion_assistantId_fkey"
    FOREIGN KEY ("assistantId") REFERENCES "AssistantConfiguration"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "AssistantConfigurationVersion"
    ADD CONSTRAINT "AssistantConfigurationVersion_workspaceId_fkey"
    FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
