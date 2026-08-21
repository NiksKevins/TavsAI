import { describe, expect, it } from "vitest";

import type { AnalyticsSnapshot } from "@/services/analytics/analytics-service";
import { buildBusinessInsight } from "@/services/analytics/insights";

function base(partial: Partial<AnalyticsSnapshot>): AnalyticsSnapshot {
  return {
    range: 7,
    from: new Date("2026-08-01"),
    to: new Date("2026-08-07"),
    conversations: 0,
    leads: 0,
    qualifiedLeads: 0,
    wonLeads: 0,
    humanHandoffs: 0,
    aiResolutionRate: null,
    leadConversionRate: null,
    conversationsOverTime: [],
    leadsOverTime: [],
    outcomes: [],
    leadStatusBreakdown: [],
    topQuestions: [],
    unansweredCount: 0,
    fallbackCount: 0,
    ...partial,
  };
}

describe("buildBusinessInsight", () => {
  it("returns null with no data", () => {
    expect(buildBusinessInsight(base({}), "lv")).toBeNull();
  });

  it("mentions real top topics from counts", () => {
    const insight = buildBusinessInsight(
      base({
        conversations: 12,
        topQuestions: [
          { topic: "price", count: 8 },
          { topic: "hours", count: 5 },
        ],
        aiResolutionRate: 0.75,
      }),
      "lv",
    );
    expect(insight?.summary).toMatch(/cenu/i);
    expect(insight?.summary).toMatch(/darba laiku/i);
    const topics = insight?.highlights.find((h) =>
      h.label.includes("jautājumi"),
    );
    expect(topics?.value).toContain("8");
    expect(topics?.value).toContain("5");
    expect(
      insight?.highlights.some((h) => h.value.includes("75%")),
    ).toBe(true);
  });

  it("does not invent lead numbers", () => {
    const insight = buildBusinessInsight(
      base({
        conversations: 4,
        leads: 0,
        topQuestions: [{ topic: "booking", count: 2 }],
      }),
      "en",
    );
    expect(insight?.summary.toLowerCase()).toContain("booking");
    expect(insight?.highlights.some((h) => /lead/i.test(h.label))).toBe(
      false,
    );
  });
});
