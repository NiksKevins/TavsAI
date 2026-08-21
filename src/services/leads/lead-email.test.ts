import { describe, expect, it } from "vitest";

import { buildNewLeadEmail } from "@/services/leads/lead-email";
import type { Lead } from "@prisma/client";

function fakeLead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    workspaceId: "22222222-2222-2222-2222-222222222222",
    conversationId: "33333333-3333-3333-3333-333333333333",
    status: "NEW",
    name: "Jānis Bērziņš",
    email: "janis@example.com",
    phone: "25547113",
    service: "Mājaslapa",
    summary: "Interesējas par cenām un vēlas zvanu.",
    intent: "Cenas / piedāvājums",
    notes: null,
    score: null,
    source: "widget_lead_form",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("buildNewLeadEmail", () => {
  it("renders branded html with lead details and cta", () => {
    const { subject, html, text } = buildNewLeadEmail({
      lead: fakeLead(),
      businessName: "TavsWebs",
      dashboardUrl: "https://bot.tavswebs.com/dashboard/leads/1",
      conversationUrl: "https://bot.tavswebs.com/dashboard/conversations/1",
      locale: "lv",
    });

    expect(subject).toContain("Jānis");
    expect(html).toContain("Saņēmāt jaunu leadu");
    expect(html).toContain("Jānis Bērziņš");
    expect(html).toContain("25547113");
    expect(html).toContain("Atvērt panelī");
    expect(html).toContain("#3b82f6");
    expect(text).toContain("Klients: Jānis Bērziņš");
  });
});
