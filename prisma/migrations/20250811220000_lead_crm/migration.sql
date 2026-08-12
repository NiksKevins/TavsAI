-- Phase 5: Lead CRM fields + assistant lead configuration
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "service" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "summary" TEXT;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "intent" TEXT;

CREATE INDEX IF NOT EXISTS "Lead_workspaceId_service_idx" ON "Lead"("workspaceId", "service");

ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "minLeadCriteria" JSONB;
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "leadNotificationEmail" TEXT;
ALTER TABLE "AssistantConfiguration" ADD COLUMN IF NOT EXISTS "handoffCreatesLead" BOOLEAN NOT NULL DEFAULT true;
