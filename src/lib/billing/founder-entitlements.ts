import type { SubscriptionPlan } from "@prisma/client";

import { getCrawlPageLimit } from "@/config/crawl";
import { conversationLimitForPlan, type PlanId } from "@/config/plans";
import {
  FOUNDER_CONVERSATION_LIMIT,
  FOUNDER_CRAWL_PAGE_LIMIT,
  isFounderEmail,
} from "@/lib/billing/founder";
import { prisma } from "@/lib/db";

export {
  FOUNDER_CONVERSATION_LIMIT,
  FOUNDER_CRAWL_PAGE_LIMIT,
  isFounderEmail,
};

/** Upgrade every workspace this founder owns to unpaid PRO (10y period). */
export async function ensureFounderEntitlements(user: {
  id: string;
  email: string;
}): Promise<void> {
  if (!isFounderEmail(user.email)) return;

  const owned = await prisma.workspaceMember.findMany({
    where: { userId: user.id, role: "OWNER" },
    select: { workspaceId: true },
  });
  if (owned.length === 0) return;

  const now = new Date();
  const farFuture = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

  await prisma.subscription.updateMany({
    where: {
      workspaceId: { in: owned.map((m) => m.workspaceId) },
      OR: [
        { plan: { not: "PRO" } },
        { status: { not: "ACTIVE" } },
        { cancelAtPeriodEnd: true },
      ],
    },
    data: {
      plan: "PRO",
      status: "ACTIVE",
      cancelAtPeriodEnd: false,
      currentPeriodStart: now,
      currentPeriodEnd: farFuture,
    },
  });
}

export function crawlPageLimitForEmail(
  plan: SubscriptionPlan | PlanId | string,
  email: string,
): number {
  if (isFounderEmail(email)) return FOUNDER_CRAWL_PAGE_LIMIT;
  return getCrawlPageLimit(plan as SubscriptionPlan);
}

export async function conversationLimitForWorkspace(
  workspaceId: string,
  plan: SubscriptionPlan | PlanId | string,
): Promise<number> {
  const owner = await prisma.workspaceMember.findFirst({
    where: { workspaceId, role: "OWNER" },
    include: { user: { select: { email: true } } },
  });
  if (isFounderEmail(owner?.user.email)) return FOUNDER_CONVERSATION_LIMIT;
  return conversationLimitForPlan(plan as PlanId);
}
