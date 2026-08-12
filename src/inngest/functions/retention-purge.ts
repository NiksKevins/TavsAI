import { inngest } from "@/inngest/client";
import { applyRetentionForAllWorkspaces } from "@/services/privacy/privacy-service";

export const retentionPurgeFunction = inngest.createFunction(
  {
    id: "privacy-retention-purge",
    name: "Privacy retention purge",
    retries: 1,
    triggers: [{ cron: "0 3 * * *" }],
  },
  async ({ step }) => {
    const result = await step.run("purge-old-conversations", async () => {
      return applyRetentionForAllWorkspaces();
    });
    return result;
  },
);
