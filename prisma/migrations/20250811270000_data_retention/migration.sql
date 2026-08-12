-- Configurable conversation retention (days). 0 = disable auto-purge.
ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "dataRetentionDays" INTEGER NOT NULL DEFAULT 365;
