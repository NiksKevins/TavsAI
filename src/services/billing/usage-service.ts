import type { Subscription, SubscriptionStatus } from "@prisma/client";

import {
  USAGE_METRIC_CONVERSATIONS,
  type PlanId,
} from "@/config/plans";
import { conversationLimitForWorkspace } from "@/lib/billing/founder-entitlements";
import { prisma } from "@/lib/db";

export type BillingPeriod = {
  start: Date;
  end: Date;
};

export type UsageSnapshot = {
  plan: PlanId;
  status: SubscriptionStatus;
  used: number;
  limit: number;
  remaining: number;
  period: BillingPeriod;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

export function resolveBillingPeriod(
  subscription: Pick<
    Subscription,
    "currentPeriodStart" | "currentPeriodEnd"
  > | null,
  now = new Date(),
): BillingPeriod {
  if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
    return {
      start: subscription.currentPeriodStart,
      end: subscription.currentPeriodEnd,
    };
  }
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0),
  );
  return { start, end };
}

export async function getUsageSnapshot(
  workspaceId: string,
): Promise<UsageSnapshot> {
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId },
  });
  const plan = (subscription?.plan ?? "FREE") as PlanId;
  const period = resolveBillingPeriod(subscription);
  const record = await prisma.usageRecord.findUnique({
    where: {
      workspaceId_metric_periodStart_periodEnd: {
        workspaceId,
        metric: USAGE_METRIC_CONVERSATIONS,
        periodStart: period.start,
        periodEnd: period.end,
      },
    },
  });
  const used = record?.quantity ?? 0;
  const limit = await conversationLimitForWorkspace(workspaceId, plan);
  return {
    plan,
    status: subscription?.status ?? "ACTIVE",
    used,
    limit,
    remaining: Math.max(0, limit - used),
    period,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodStart: subscription?.currentPeriodStart ?? null,
    currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
  };
}

export type QuotaDecision = {
  allowed: boolean;
  reason?: "limit_exceeded" | "subscription_inactive";
  isNewConversation: boolean;
  snapshot: UsageSnapshot;
};

/**
 * Gate + optional increment for a new conversation in one transaction.
 * Existing conversations stay allowed until the period limit is exceeded.
 */
export async function gateConversationUsage(params: {
  workspaceId: string;
  conversationId?: string | null;
}): Promise<QuotaDecision> {
  let isNewConversation = true;
  let quotaBlocked = false;
  if (params.conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        workspaceId: params.workspaceId,
      },
      select: { id: true, visitorMetadata: true },
    });
    isNewConversation = !existing;
    if (existing?.visitorMetadata && typeof existing.visitorMetadata === "object") {
      const meta = existing.visitorMetadata as Record<string, unknown>;
      quotaBlocked = meta.quotaBlocked === true;
    }
  }

  if (quotaBlocked) {
    const subscription = await prisma.subscription.findUnique({
      where: { workspaceId: params.workspaceId },
    });
    const plan = (subscription?.plan ?? "FREE") as PlanId;
    const period = resolveBillingPeriod(subscription);
    const limit = await conversationLimitForWorkspace(
      params.workspaceId,
      plan,
    );
    const record = await prisma.usageRecord.findUnique({
      where: {
        workspaceId_metric_periodStart_periodEnd: {
          workspaceId: params.workspaceId,
          metric: USAGE_METRIC_CONVERSATIONS,
          periodStart: period.start,
          periodEnd: period.end,
        },
      },
    });
    const used = record?.quantity ?? 0;
    return {
      allowed: false,
      reason: "limit_exceeded",
      isNewConversation: false,
      snapshot: {
        plan,
        status: subscription?.status ?? "ACTIVE",
        used,
        limit,
        remaining: Math.max(0, limit - used),
        period,
        cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
        currentPeriodStart: subscription?.currentPeriodStart ?? null,
        currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      },
    };
  }

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { workspaceId: params.workspaceId },
    });
    const plan = (subscription?.plan ?? "FREE") as PlanId;
    const status = subscription?.status ?? "ACTIVE";
    const period = resolveBillingPeriod(subscription);
    const limit = await conversationLimitForWorkspace(
      params.workspaceId,
      plan,
    );

    if (status === "INCOMPLETE" || status === "CANCELED") {
      // Canceled/incomplete workspaces fall back to FREE limits for the period.
      // If Stripe set plan to FREE on delete, this already applies.
    }

    const record = await tx.usageRecord.findUnique({
      where: {
        workspaceId_metric_periodStart_periodEnd: {
          workspaceId: params.workspaceId,
          metric: USAGE_METRIC_CONVERSATIONS,
          periodStart: period.start,
          periodEnd: period.end,
        },
      },
    });
    const used = record?.quantity ?? 0;
    const snapshot: UsageSnapshot = {
      plan,
      status,
      used,
      limit,
      remaining: Math.max(0, limit - used),
      period,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
    };

    if (isNewConversation) {
      if (used >= limit) {
        return {
          allowed: false,
          reason: "limit_exceeded" as const,
          isNewConversation,
          snapshot,
        };
      }
      await tx.usageRecord.upsert({
        where: {
          workspaceId_metric_periodStart_periodEnd: {
            workspaceId: params.workspaceId,
            metric: USAGE_METRIC_CONVERSATIONS,
            periodStart: period.start,
            periodEnd: period.end,
          },
        },
        create: {
          workspaceId: params.workspaceId,
          metric: USAGE_METRIC_CONVERSATIONS,
          quantity: 1,
          periodStart: period.start,
          periodEnd: period.end,
        },
        update: { quantity: { increment: 1 } },
      });
      return {
        allowed: true,
        isNewConversation,
        snapshot: {
          ...snapshot,
          used: used + 1,
          remaining: Math.max(0, limit - used - 1),
        },
      };
    }

    // Continuing an existing conversation: block only if already over the cap.
    if (used > limit) {
      return {
        allowed: false,
        reason: "limit_exceeded" as const,
        isNewConversation,
        snapshot,
      };
    }

    return { allowed: true, isNewConversation, snapshot };
  });
}

export function upgradeRequiredMessage(
  locale: "lv" | "en",
  snapshot: UsageSnapshot,
): string {
  if (locale === "en") {
    return `This workspace has reached its ${snapshot.plan} plan limit of ${snapshot.limit} conversations this billing period (${snapshot.used}/${snapshot.limit}). Please upgrade at /dashboard/billing to continue.`;
  }
  return `Šī darba vieta ir sasniegusi ${snapshot.plan} plāna limitu — ${snapshot.limit} sarunas šajā norēķinu periodā (${snapshot.used}/${snapshot.limit}). Lai turpinātu, jauniniet plānu: /dashboard/billing.`;
}
