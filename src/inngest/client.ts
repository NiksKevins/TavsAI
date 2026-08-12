import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "bot-tavswebs",
  name: "TavsWebs Bot",
});

export const CRAWL_WEBSITE_EVENT = "crawl/website.requested" as const;

export type CrawlWebsiteEvent = {
  name: typeof CRAWL_WEBSITE_EVENT;
  data: {
    crawlJobId: string;
    workspaceId: string;
    websiteId: string;
  };
};
