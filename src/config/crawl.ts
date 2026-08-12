import type { SubscriptionPlan } from "@prisma/client";

import { PLANS, type PlanId } from "@/config/plans";

/** Max pages crawled per website scan, by plan. Server-side only. */
export const CRAWL_PAGE_LIMITS: Record<PlanId, number> = {
  FREE: 10,
  STARTER: 50,
  BUSINESS: 200,
  PRO: 500,
};

export const CRAWL_CONFIG = {
  maxDepth: 3,
  requestTimeoutMs: 15_000,
  maxRedirects: 5,
  maxResponseBytes: 2_000_000, // 2 MB HTML
  maxRetries: 2,
  retryBackoffMs: 500,
  userAgent: "TavsWebsBot/1.0 (+https://bot.tavswebs.com; crawl)",
  concurrency: 3,
  /** Target chunk size in approximate tokens (4 chars ≈ 1 token). */
  targetChunkTokens: 450,
  maxChunkTokens: 700,
  minChunkTokens: 80,
} as const;

export function getCrawlPageLimit(plan: SubscriptionPlan | PlanId): number {
  const id = plan as PlanId;
  return CRAWL_PAGE_LIMITS[id] ?? CRAWL_PAGE_LIMITS.FREE;
}

export function assertPlanId(plan: string): PlanId {
  if (plan in PLANS) return plan as PlanId;
  return "FREE";
}
