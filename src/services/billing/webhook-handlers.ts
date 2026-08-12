import type Stripe from "stripe";

import { planFromStripePriceId } from "@/config/plans";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";
import {
  markSubscriptionPastDue,
  syncSubscriptionFromStripe,
} from "@/services/billing/subscription-service";

/**
 * Claim the event id first (unique PK). Duplicates are no-ops.
 * On handler failure, the claim is deleted so Stripe can retry.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<{
  ok: boolean;
  duplicate?: boolean;
}> {
  try {
    await prisma.processedStripeEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: { livemode: event.livemode },
      },
    });
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { ok: true, duplicate: true };
    }
    throw error;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await onCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscriptionFromStripe(
          event.data.object as Stripe.Subscription,
          workspaceIdFromMetadata(
            (event.data.object as Stripe.Subscription).metadata,
          ),
        );
        break;
      case "customer.subscription.deleted":
        await onSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await onInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case "invoice.paid":
        await onInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (error) {
    await prisma.processedStripeEvent
      .delete({ where: { id: event.id } })
      .catch(() => undefined);
    throw error;
  }

  return { ok: true };
}

function workspaceIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | undefined {
  const id = metadata?.workspaceId;
  return id && /^[0-9a-f-]{36}$/i.test(id) ? id : undefined;
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session) {
  const workspaceId = workspaceIdFromMetadata(session.metadata);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;
  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (workspaceId && customerId) {
    await prisma.subscription.update({
      where: { workspaceId },
      data: {
        stripeCustomerId: customerId,
        ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
      },
    });
  }

  if (subscriptionId) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionFromStripe(sub, workspaceId);
  }

  if (workspaceId) {
    await prisma.auditLog.create({
      data: {
        workspaceId,
        action: "BILLING",
        entityType: "Subscription",
        entityId: workspaceId,
        metadata: {
          event: "checkout.session.completed",
          sessionId: session.id,
          planHint: session.metadata?.planId ?? null,
        },
      },
    });
  }
}

async function onSubscriptionDeleted(sub: Stripe.Subscription) {
  const customerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const existing =
    (await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: sub.id },
    })) ||
    (await prisma.subscription.findFirst({
      where: { stripeCustomerId: customerId },
    }));

  if (!existing) return;

  await prisma.subscription.update({
    where: { id: existing.id },
    data: {
      plan: "FREE",
      status: "CANCELED",
      stripeSubscriptionId: null,
      stripePriceId: null,
      cancelAtPeriodEnd: false,
      currentPeriodStart: null,
      currentPeriodEnd: null,
    },
  });

  await prisma.notification.create({
    data: {
      workspaceId: existing.workspaceId,
      channel: "IN_APP",
      title: "Subscription canceled",
      body: "Your paid plan ended. The workspace is now on Free.",
      payload: { stripeSubscriptionId: sub.id },
      sentAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: existing.workspaceId,
      action: "BILLING",
      entityType: "Subscription",
      entityId: existing.workspaceId,
      metadata: { event: "customer.subscription.deleted" },
    },
  });
}

async function onInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const updated = await markSubscriptionPastDue(customerId);
  if (!updated) return;

  await prisma.notification.create({
    data: {
      workspaceId: updated.workspaceId,
      channel: "IN_APP",
      title: "Payment failed",
      body: "We could not charge your card. Update payment details in Billing to avoid interruption.",
      payload: { invoiceId: invoice.id },
      sentAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: updated.workspaceId,
      action: "BILLING",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { event: "invoice.payment_failed" },
    },
  });
}

async function onInvoicePaid(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const existing = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });
  if (!existing) return;

  const inv = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
  };
  const subscriptionId =
    typeof inv.subscription === "string"
      ? inv.subscription
      : inv.subscription && typeof inv.subscription === "object"
        ? inv.subscription.id
        : existing.stripeSubscriptionId;

  if (subscriptionId) {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(subscriptionId);
    await syncSubscriptionFromStripe(sub, existing.workspaceId);
  } else if (existing.status === "PAST_DUE") {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
  }

  const priceId = (() => {
    const line = invoice.lines?.data?.[0] as
      | { price?: { id?: string } | string | null; pricing?: unknown }
      | undefined;
    if (!line) return null;
    if (typeof line.price === "string") return line.price;
    if (line.price && typeof line.price === "object" && line.price.id) {
      return line.price.id;
    }
    return null;
  })();
  if (priceId) {
    const plan = planFromStripePriceId(priceId);
    if (plan !== "FREE") {
      await prisma.subscription.update({
        where: { id: existing.id },
        data: { plan, stripePriceId: priceId, status: "ACTIVE" },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: existing.workspaceId,
      action: "BILLING",
      entityType: "Invoice",
      entityId: invoice.id,
      metadata: { event: "invoice.paid" },
    },
  });

  // Partner commissions — isolated side-effect; never blocks core billing sync.
  try {
    const { recordPartnerCommissionFromInvoice } = await import(
      "@/services/partner/commission-service"
    );
    await recordPartnerCommissionFromInvoice({
      workspaceId: existing.workspaceId,
      invoice,
    });
  } catch (error) {
    console.error("[partner/commission]", error);
  }
}
