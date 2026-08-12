-- WidgetConfiguration Phase 4 fields
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "theme" TEXT NOT NULL DEFAULT 'light';
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "borderRadius" INTEGER NOT NULL DEFAULT 16;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "welcomeMessageLv" TEXT;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "welcomeMessageEn" TEXT;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "quickActions" TEXT[] DEFAULT ARRAY['Cenas','Pakalpojumi','Darba laiks','Kontakti','Vēlos pieteikt vizīti']::TEXT[];
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "leadFormEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "leadFields" JSONB;
ALTER TABLE "WidgetConfiguration" ADD COLUMN IF NOT EXISTS "lastLoadedAt" TIMESTAMP(3);

-- Soft-update default primary color only where still old default
UPDATE "WidgetConfiguration" SET "primaryColor" = '#0F5C4C' WHERE "primaryColor" = '#0F766E';
