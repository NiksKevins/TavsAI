import { CRAWL_WEBSITE_EVENT, inngest } from "@/inngest/client";
import { runCrawlJob } from "@/lib/crawl/run-crawl-job";
import { retentionPurgeFunction } from "@/inngest/functions/retention-purge";

export const crawlWebsiteFunction = inngest.createFunction(
  {
    id: "crawl-website",
    name: "Crawl website",
    retries: 1,
    concurrency: {
      limit: 2,
      key: "event.data.workspaceId",
    },
    cancelOn: [
      {
        event: "crawl/website.canceled",
        match: "data.crawlJobId",
      },
    ],
    triggers: [{ event: CRAWL_WEBSITE_EVENT }],
  },
  async ({ event, step }) => {
    await step.run("crawl-and-chunk", async () => {
      await runCrawlJob(event.data.crawlJobId as string);
    });

    return { crawlJobId: event.data.crawlJobId, ok: true };
  },
);

export const inngestFunctions = [crawlWebsiteFunction, retentionPurgeFunction];
