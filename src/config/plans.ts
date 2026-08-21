/**
 * Server-side plan limits. Never trust client-side plan checks.
 * Stripe Price IDs come from env — never hardcode live secrets.
 */
import type { SubscriptionPlan } from "@prisma/client";

export const PLANS = {
  FREE: {
    id: "FREE" as const,
    name: "Free",
    priceMonthlyEur: 0,
    conversationLimit: 100,
  },
  STARTER: {
    id: "STARTER" as const,
    name: "Starter",
    priceMonthlyEur: 19,
    conversationLimit: 500,
  },
  BUSINESS: {
    id: "BUSINESS" as const,
    name: "Business",
    priceMonthlyEur: 39,
    conversationLimit: 2000,
  },
  PRO: {
    id: "PRO" as const,
    name: "Pro",
    priceMonthlyEur: 79,
    conversationLimit: 10000,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const PAID_PLANS = ["STARTER", "BUSINESS", "PRO"] as const;
export type PaidPlanId = (typeof PAID_PLANS)[number];

/** Higher = more capable plan. Used for upgrade vs downgrade CTAs. */
export const PLAN_RANK: Record<PlanId, number> = {
  FREE: 0,
  STARTER: 1,
  BUSINESS: 2,
  PRO: 3,
};

export function planRank(plan: PlanId | string): number {
  return PLAN_RANK[plan as PlanId] ?? 0;
}

export function isPlanId(value: string): value is PlanId {
  return value in PLANS;
}

export function isPaidPlanId(value: string): value is PaidPlanId {
  return (PAID_PLANS as readonly string[]).includes(value);
}

export function conversationLimitForPlan(plan: SubscriptionPlan | PlanId): number {
  return PLANS[plan]?.conversationLimit ?? PLANS.FREE.conversationLimit;
}

/** Map Stripe price id → plan. Missing/invalid env = that plan cannot be purchased. */
export function stripePriceIdForPlan(plan: PaidPlanId): string | null {
  const map: Record<PaidPlanId, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
    PRO: process.env.STRIPE_PRICE_PRO,
  };
  const id = map[plan]?.trim();
  if (!id) return null;
  // Checkout requires Price IDs (price_…), not Product IDs (prod_…).
  if (!id.startsWith("price_")) return null;
  return id;
}

export function isStripePriceIdMisconfigured(plan: PaidPlanId): boolean {
  const map: Record<PaidPlanId, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
    PRO: process.env.STRIPE_PRICE_PRO,
  };
  const id = map[plan]?.trim();
  return Boolean(id && !id.startsWith("price_"));
}

export function planFromStripePriceId(priceId: string | null | undefined): PlanId {
  if (!priceId) return "FREE";
  for (const plan of PAID_PLANS) {
    if (stripePriceIdForPlan(plan) === priceId) return plan;
  }
  return "FREE";
}

export const USAGE_METRIC_CONVERSATIONS = "conversations";
