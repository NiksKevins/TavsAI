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
    const text = buildBusinessInsight(
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
    expect(text).toContain("cenu");
    expect(text).toContain("sestdienas");
    expect(text).toContain("8");
    expect(text).toContain("5");
    expect(text).toContain("75%");
  });

  it("does not invent lead numbers", () => {
    const text = buildBusinessInsight(
      base({
        conversations: 4,
        leads: 0,
        topQuestions: [{ topic: "booking", count: 2 }],
      }),
      "en",
    );
    expect(text).toContain("booking");
    expect(text).not.toMatch(/lead/i);
  });
});
