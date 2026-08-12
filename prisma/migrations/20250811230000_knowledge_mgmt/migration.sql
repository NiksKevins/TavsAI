-- Phase 6: knowledge management fields
ALTER TYPE "KnowledgeDocumentType" ADD VALUE IF NOT EXISTS 'BUSINESS_INFORMATION';

ALTER TABLE "BusinessInformation" ADD COLUMN IF NOT EXISTS "languages" TEXT[] DEFAULT ARRAY['lv']::TEXT[];
ALTER TABLE "BusinessInformation" ADD COLUMN IF NOT EXISTS "policies" TEXT;

ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "duration" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "notes" TEXT;
CREATE INDEX IF NOT EXISTS "Service_workspaceId_category_idx" ON "Service"("workspaceId", "category");

ALTER TABLE "FAQ" ADD COLUMN IF NOT EXISTS "category" TEXT;
CREATE INDEX IF NOT EXISTS "FAQ_workspaceId_category_idx" ON "FAQ"("workspaceId", "category");
