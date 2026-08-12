import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { evaluateConversationForLead } from "@/services/leads/lead-service";

describe("evaluateConversationForLead integration", () => {
  const createdIds: string[] = [];

  afterAll(async () => {
    if (createdIds.length) {
      await prisma.lead.deleteMany({
        where: { conversationId: { in: createdIds } },
      });
      await prisma.conversationMessage.deleteMany({
        where: { conversationId: { in: createdIds } },
      });
      await prisma.conversation.deleteMany({
        where: { id: { in: createdIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("FAQ → no lead; purchase intent + phone → lead", async () => {
    const workspace = await prisma.workspace.findFirst();
    expect(workspace).toBeTruthy();

    const faq = await prisma.conversation.create({
      data: {
        workspaceId: workspace!.id,
        messages: {
          create: [
            {
              workspaceId: workspace!.id,
              role: "VISITOR",
              content: "Kāds ir darba laiks?",
            },
          ],
        },
      },
    });
    createdIds.push(faq.id);

    const faqResult = await evaluateConversationForLead({
      workspaceId: workspace!.id,
      conversationId: faq.id,
      locale: "lv",
    });
    expect(faqResult.created).toBe(false);

    const buy = await prisma.conversation.create({
      data: {
        workspaceId: workspace!.id,
        messages: {
          create: [
            {
              workspaceId: workspace!.id,
              role: "VISITOR",
              content:
                "I want to bring my BMW for diagnostics. Phone +371 25547113",
            },
          ],
        },
      },
    });
    createdIds.push(buy.id);

    const buyResult = await evaluateConversationForLead({
      workspaceId: workspace!.id,
      conversationId: buy.id,
      locale: "en",
      source: "test",
    });

    expect(buyResult.extraction.hasPurchaseIntent).toBe(true);
    expect(buyResult.created).toBe(true);
    expect(buyResult.leadId).toBeTruthy();

    const lead = await prisma.lead.findUnique({
      where: { id: buyResult.leadId! },
    });
    expect(lead?.phone).toContain("25547113");
  });
});
