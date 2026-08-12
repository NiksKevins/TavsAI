import type { SubscriptionStatus } from "@prisma/client";
import type Stripe from "stripe";

import { planFromStripePriceId, type PlanId } from "@/config/plans";
import { prisma } from "@/lib/db";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "trialing":
      return "TRIALING";
    case "active":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    case "canceled":
    case "unpaid":
      return "CANCELED";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    case "paused":
      return "PAST_DUE";
    default:
      return "ACTIVE";
  }
}

function periodFromSubscription(sub: Stripe.Subscription): {
  start: Date | null;
  end: Date | null;
} {
  const item = sub.items.data[0];
  const startUnix =
    item && "current_period_start" in item
      ? (item.current_period_start as number | undefined)
      : undefined;
  const endUnix =
    item && "current_period_end" in item
      ? (item.current_period_end as number | undefined)
      : undefined;
  // Fallback to subscription-level fields used by older API shapes
  const subAny = sub as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const start = startUnix ?? subAny.current_period_start;
  const end = endUnix ?? subAny.current_period_end;
  return {
    start: start ? new Date(start * 1000) : null,
    end: end ? new Date(end * 1000) : null,
  };
}

function priceIdFromSubscription(sub: Stripe.Subscription): string | null {
  return sub.items.data[0]?.price?.id ?? null;
}

export async function findSubscriptionByStripeCustomer(
  customerId: string,
) {
  return prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
}

export async function findSubscriptionByStripeSubscription(
  subscriptionId: string,
) {
  return prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
}

export async function syncSubscriptionFromStripe(
  stripeSub: Stripe.Subscription,
  workspaceIdHint?: string,
) {
  const priceId = priceIdFromSubscription(stripeSub);
  const plan = planFromStripePriceId(priceId) as PlanId;
  const period = periodFromSubscription(stripeSub);
  const customerId =
    typeof stripeSub.customer === "string"
      ? stripeSub.customer
      : stripeSub.customer.id;

  const existing =
    (await findSubscriptionByStripeSubscription(stripeSub.id)) ||
    (await findSubscriptionByStripeCustomer(customerId)) ||
    (workspaceIdHint
      ? await prisma.subscription.findUnique({
          where: { workspaceId: workspaceIdHint },
        })
      : null);

  if (!existing) {
    console.warn("[billing] No local subscription for Stripe sub", stripeSub.id);
    return null;
  }

  return prisma.subscription.update({
    where: { id: existing.id },
    data: {
      plan: stripeSub.status === "canceled" ? "FREE" : plan === "FREE" ? existing.plan : plan,
      status: mapStripeStatus(stripeSub.status),
      stripeCustomerId: customerId,
      stripeSubscriptionId:
        stripeSub.status === "canceled" ? null : stripeSub.id,
      stripePriceId: stripeSub.status === "canceled" ? null : priceId,
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
    },
  });
}

export async function markSubscriptionPastDue(customerId: string) {
  const existing = await findSubscriptionByStripeCustomer(customerId);
  if (!existing) return null;
  return prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "PAST_DUE" },
  });
}

export async function ensureStripeCustomerId(params: {
  workspaceId: string;
  email: string;
  name: string;
  stripeCustomerId?: string | null;
}): Promise<string> {
  if (params.stripeCustomerId) return params.stripeCustomerId;

  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: { workspaceId: params.workspaceId },
  });

  await prisma.subscription.update({
    where: { workspaceId: params.workspaceId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
