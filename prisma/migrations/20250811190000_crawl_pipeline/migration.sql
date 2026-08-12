-- AlterEnum CrawlJobStatus
ALTER TYPE "CrawlJobStatus" RENAME TO "CrawlJobStatus_old";
CREATE TYPE "CrawlJobStatus" AS ENUM ('QUEUED', 'CRAWLING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELED');

ALTER TABLE "CrawlJob" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CrawlJob"
  ALTER COLUMN "status" TYPE "CrawlJobStatus"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'QUEUED'::"CrawlJobStatus"
      WHEN 'RUNNING' THEN 'CRAWLING'::"CrawlJobStatus"
      WHEN 'COMPLETED' THEN 'COMPLETED'::"CrawlJobStatus"
      WHEN 'FAILED' THEN 'FAILED'::"CrawlJobStatus"
      WHEN 'CANCELED' THEN 'CANCELED'::"CrawlJobStatus"
      ELSE 'QUEUED'::"CrawlJobStatus"
    END
  );
ALTER TABLE "CrawlJob" ALTER COLUMN "status" SET DEFAULT 'QUEUED'::"CrawlJobStatus";
DROP TYPE "CrawlJobStatus_old";

-- CreateEnum WebsiteStatus
CREATE TYPE "WebsiteStatus" AS ENUM ('PENDING', 'QUEUED', 'CRAWLING', 'READY', 'FAILED');

-- AlterTable Website
ALTER TABLE "Website" ADD COLUMN "status" "WebsiteStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable CrawlJob: rename counters + completedAt + extras
ALTER TABLE "CrawlJob" RENAME COLUMN "pagesFound" TO "pagesDiscovered";
ALTER TABLE "CrawlJob" RENAME COLUMN "pagesCrawled" TO "pagesProcessed";
ALTER TABLE "CrawlJob" RENAME COLUMN "finishedAt" TO "completedAt";
ALTER TABLE "CrawlJob" ADD COLUMN "pageLimit" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "CrawlJob" ADD COLUMN "failureLog" JSONB;

-- AlterTable KnowledgeDocument
ALTER TABLE "KnowledgeDocument" ADD COLUMN "websiteId" UUID;

CREATE INDEX "Website_workspaceId_status_idx" ON "Website"("workspaceId", "status");
CREATE INDEX "KnowledgeDocument_websiteId_idx" ON "KnowledgeDocument"("websiteId");
CREATE INDEX "KnowledgeDocument_workspaceId_sourceUrl_idx" ON "KnowledgeDocument"("workspaceId", "sourceUrl");

ALTER TABLE "KnowledgeDocument"
  ADD CONSTRAINT "KnowledgeDocument_websiteId_fkey"
  FOREIGN KEY ("websiteId") REFERENCES "Website"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
