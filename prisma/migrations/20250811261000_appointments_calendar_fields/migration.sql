-- Rename legacy appointment columns
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Appointment' AND column_name = 'startsAt'
  ) THEN
    ALTER TABLE "Appointment" RENAME COLUMN "startsAt" TO "startTime";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Appointment' AND column_name = 'endsAt'
  ) THEN
    ALTER TABLE "Appointment" RENAME COLUMN "endsAt" TO "endTime";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Appointment' AND column_name = 'externalId'
  ) THEN
    ALTER TABLE "Appointment" RENAME COLUMN "externalId" TO "externalEventId";
  END IF;
END $$;

ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "service" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerName" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerEmail" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Appointment" ADD COLUMN IF NOT EXISTS "failureReason" TEXT;

UPDATE "Appointment" SET status = 'PENDING' WHERE status::text = 'REQUESTED';
UPDATE "Appointment" SET status = 'CANCELLED' WHERE status::text = 'CANCELED';
ALTER TABLE "Appointment" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP INDEX IF EXISTS "Appointment_workspaceId_startsAt_idx";
CREATE INDEX IF NOT EXISTS "Appointment_workspaceId_startTime_idx" ON "Appointment"("workspaceId", "startTime");

ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "accessTokenEnc" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "refreshTokenEnc" TEXT;
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Integration" ADD COLUMN IF NOT EXISTS "externalAccountEmail" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Integration_workspaceId_type_provider_key"
  ON "Integration"("workspaceId", "type", "provider");
