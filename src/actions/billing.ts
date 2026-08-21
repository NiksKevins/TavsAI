"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  isPaidPlanId,
  isStripePriceIdMisconfigured,
  stripePriceIdForPlan,
  type PaidPlanId,
} from "@/config/plans";
import { requireWorkspaceRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getAppUrl, getStripe, hasStripeSecret } from "@/lib/stripe";
import { ensureStripeCustomerId } from "@/services/billing/subscription-service";

export type BillingActionResult =
  | { ok: true; url?: string }
  | { ok: false; error: string };

const planSchema = z.object({
  planId: z.enum(["STARTER", "BUSINESS", "PRO"]),
});

export async function startCheckoutAction(
  formData: FormData,
): Promise<void> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  if (!hasStripeSecret()) {
    redirect("/dashboard/billing?error=stripe_not_configured");
  }

  const parsed = planSchema.safeParse({ planId: formData.get("planId") });
  if (!parsed.success) {
    redirect("/dashboard/billing?error=invalid_plan");
  }

  const planId = parsed.data.planId as PaidPlanId;
  if (isStripePriceIdMisconfigured(planId)) {
    redirect("/dashboard/billing?error=invalid_price_id");
  }
  const priceId = stripePriceIdForPlan(planId);
  if (!priceId) {
    redirect("/dashboard/billing?error=price_not_configured");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (!subscription) {
    redirect("/dashboard/billing?error=no_subscription");
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomerId({
    workspaceId: workspace.id,
    email: user.email,
    name: workspace.name,
    stripeCustomerId: subscription.stripeCustomerId,
  });

  // Existing paid subscription → update price (upgrade / downgrade) with proration
  if (subscription.stripeSubscriptionId && subscription.plan !== "FREE") {
    const sub = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId,
    );
    const itemId = sub.items.data[0]?.id;
    if (!itemId) {
      redirect("/dashboard/billing?error=subscription_invalid");
    }

    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      items: [{ id: itemId, price: priceId }],
      proration_behavior: "create_prorations",
      metadata: {
        workspaceId: workspace.id,
        planId,
      },
      cancel_at_period_end: false,
    });

    await prisma.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        action: "BILLING",
        entityType: "Subscription",
        entityId: workspace.id,
        metadata: {
          action: "plan_change",
          from: subscription.plan,
          to: planId,
        },
      },
    });

    redirect("/dashboard/billing?updated=1");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/dashboard/billing?success=1`,
    cancel_url: `${getAppUrl()}/dashboard/billing?canceled=1`,
    client_reference_id: workspace.id,
    metadata: {
      workspaceId: workspace.id,
      planId,
    },
    subscription_data: {
      metadata: {
        workspaceId: workspace.id,
        planId,
      },
    },
    allow_promotion_codes: true,
  });

  if (!session.url) {
    redirect("/dashboard/billing?error=checkout_failed");
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "BILLING",
      entityType: "CheckoutSession",
      entityId: session.id,
      metadata: { planId },
    },
  });

  redirect(session.url);
}

export async function openBillingPortalAction(): Promise<void> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  if (!hasStripeSecret()) {
    redirect("/dashboard/billing?error=stripe_not_configured");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (!subscription) {
    redirect("/dashboard/billing?error=no_subscription");
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomerId({
    workspaceId: workspace.id,
    email: user.email,
    name: workspace.name,
    stripeCustomerId: subscription.stripeCustomerId,
  });

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${getAppUrl()}/dashboard/billing`,
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "BILLING",
      entityType: "BillingPortal",
      entityId: portal.id,
    },
  });

  redirect(portal.url);
}

/** Collect a card without changing plan (Stripe Checkout setup mode). */
export async function startAddPaymentMethodAction(): Promise<void> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  if (!hasStripeSecret()) {
    redirect("/dashboard/billing?error=stripe_not_configured");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (!subscription) {
    redirect("/dashboard/billing?error=no_subscription");
  }

  const stripe = getStripe();
  const customerId = await ensureStripeCustomerId({
    workspaceId: workspace.id,
    email: user.email,
    name: workspace.name,
    stripeCustomerId: subscription.stripeCustomerId,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "setup",
    customer: customerId,
    currency: "eur",
    payment_method_types: ["card"],
    success_url: `${getAppUrl()}/dashboard/billing?card_added=1`,
    cancel_url: `${getAppUrl()}/dashboard/billing`,
    client_reference_id: workspace.id,
    metadata: {
      workspaceId: workspace.id,
      purpose: "add_payment_method",
    },
  });

  if (!session.url) {
    redirect("/dashboard/billing?error=checkout_failed");
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "BILLING",
      entityType: "CheckoutSession",
      entityId: session.id,
      metadata: { purpose: "add_payment_method" },
    },
  });

  redirect(session.url);
}

export async function cancelSubscriptionAction(): Promise<void> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  if (!hasStripeSecret()) {
    redirect("/dashboard/billing?error=stripe_not_configured");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (!subscription?.stripeSubscriptionId) {
    redirect("/dashboard/billing?error=no_subscription");
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: true },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "BILLING",
      entityType: "Subscription",
      entityId: workspace.id,
      metadata: { action: "cancel_at_period_end" },
    },
  });

  redirect("/dashboard/billing?canceled_pending=1");
}

export async function resumeSubscriptionAction(): Promise<void> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  if (!hasStripeSecret()) {
    redirect("/dashboard/billing?error=stripe_not_configured");
  }

  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });
  if (!subscription?.stripeSubscriptionId) {
    redirect("/dashboard/billing?error=no_subscription");
  }

  const stripe = getStripe();
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { cancelAtPeriodEnd: false },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "BILLING",
      entityType: "Subscription",
      entityId: workspace.id,
      metadata: { action: "resume" },
    },
  });

  redirect("/dashboard/billing?resumed=1");
}

/** Validate plan id without leaking to client bundle via re-export. */
export async function assertPaidPlan(planId: string): Promise<PaidPlanId | null> {
  return isPaidPlanId(planId) ? planId : null;
}
