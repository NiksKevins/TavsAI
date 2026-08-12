import { describe, expect, it } from "vitest";

import { conversationLimitForPlan, isPaidPlanId, PLANS } from "@/config/plans";
import { resolveBillingPeriod } from "@/services/billing/usage-service";

describe("plans", () => {
  it("matches Phase 8 conversation limits", () => {
    expect(PLANS.FREE.conversationLimit).toBe(100);
    expect(PLANS.STARTER.conversationLimit).toBe(500);
    expect(PLANS.BUSINESS.conversationLimit).toBe(2000);
    expect(PLANS.PRO.conversationLimit).toBe(10000);
    expect(conversationLimitForPlan("STARTER")).toBe(500);
    expect(isPaidPlanId("FREE")).toBe(false);
    expect(isPaidPlanId("PRO")).toBe(true);
  });
});

describe("billing period", () => {
  it("uses subscription period when present", () => {
    const start = new Date("2026-08-01T00:00:00.000Z");
    const end = new Date("2026-09-01T00:00:00.000Z");
    const period = resolveBillingPeriod({
      currentPeriodStart: start,
      currentPeriodEnd: end,
    });
    expect(period.start).toEqual(start);
    expect(period.end).toEqual(end);
  });

  it("falls back to UTC calendar month", () => {
    const now = new Date("2026-08-15T12:00:00.000Z");
    const period = resolveBillingPeriod(null, now);
    expect(period.start.toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(period.end.toISOString()).toBe("2026-09-01T00:00:00.000Z");
  });
});
