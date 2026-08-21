import { getTranslations } from "next-intl/server";

import { BillingDashboard } from "@/components/billing/billing-dashboard";
import { hasMinimumRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getStripe, hasStripeSecret } from "@/lib/stripe";
import { getUsageSnapshot } from "@/services/billing/usage-service";

const ERROR_KEYS = new Set([
  "stripe_not_configured",
  "invalid_plan",
  "price_not_configured",
  "invalid_price_id",
  "no_subscription",
  "no_customer",
  "subscription_invalid",
  "checkout_failed",
]);

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("billing");
  const { workspace, membership } = await requireWorkspace();
  const params = await searchParams;
  const usage = await getUsageSnapshot(workspace.id);
  const subscription = await prisma.subscription.findUnique({
    where: { workspaceId: workspace.id },
  });

  const stripeConfigured = hasStripeSecret();
  let paymentMethods: {
    id: string;
    brand: string | null;
    last4: string | null;
    expMonth: number | null;
    expYear: number | null;
    isDefault: boolean;
  }[] = [];
  let invoices: {
    id: string;
    number: string | null;
    status: string | null;
    amountPaid: number;
    currency: string;
    created: number;
    hostedInvoiceUrl: string | null;
    invoicePdf: string | null;
  }[] = [];

  if (stripeConfigured && subscription?.stripeCustomerId) {
    try {
      const stripe = getStripe();
      const customerId = subscription.stripeCustomerId;
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });

      let defaultPmId: string | null = null;
      if (!customer.deleted) {
        const defaultPm = customer.invoice_settings?.default_payment_method;
        defaultPmId =
          typeof defaultPm === "string" ? defaultPm : (defaultPm?.id ?? null);
      }

      const listed = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
        limit: 20,
      });

      paymentMethods = listed.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand ?? null,
        last4: pm.card?.last4 ?? null,
        expMonth: pm.card?.exp_month ?? null,
        expYear: pm.card?.exp_year ?? null,
        isDefault: pm.id === defaultPmId,
      }));

      // Prefer default first
      paymentMethods.sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

      const list = await stripe.invoices.list({
        customer: customerId,
        limit: 12,
      });
      invoices = list.data
        .filter((invoice): invoice is typeof invoice & { id: string } =>
          Boolean(invoice.id),
        )
        .map((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          created: invoice.created,
          hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
          invoicePdf: invoice.invoice_pdf ?? null,
        }));
    } catch (error) {
      console.error("[billing/page] stripe fetch", error);
    }
  }

  const flash = first(params.success)
    ? "success"
    : first(params.updated)
      ? "updated"
      : first(params.card_added)
        ? "card_added"
        : first(params.canceled_pending)
          ? "canceled_pending"
          : first(params.canceled)
            ? "canceled"
            : first(params.resumed)
              ? "resumed"
              : null;

  const errorKey = first(params.error);
  const error =
    errorKey && ERROR_KEYS.has(errorKey)
      ? t(`errors.${errorKey}` as Parameters<typeof t>[0])
      : null;

  return (
    <BillingDashboard
      usage={usage}
      hasStripeCustomer={Boolean(subscription?.stripeCustomerId)}
      hasStripeSubscription={Boolean(subscription?.stripeSubscriptionId)}
      paymentMethods={paymentMethods}
      invoices={invoices}
      stripeConfigured={stripeConfigured}
      canManage={hasMinimumRole(membership.role, "ADMIN")}
      flash={flash}
      error={error}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        currentPlan: t("currentPlan"),
        usage: t("usage"),
        remaining: t("remaining"),
        ofLimit: t("ofLimit"),
        billingCycle: t("billingCycle"),
        price: t("price"),
        perMonth: t("perMonth"),
        paymentMethod: t("paymentMethod"),
        noPaymentMethod: t("noPaymentMethod"),
        paymentMethodHint: t("paymentMethodHint"),
        addCard: t("addCard"),
        manageCards: t("manageCards"),
        defaultCard: t("defaultCard"),
        invoices: t("invoices"),
        noInvoices: t("noInvoices"),
        changePlan: t("changePlan"),
        upgrade: t("upgrade"),
        downgrade: t("downgrade"),
        current: t("current"),
        manageBilling: t("manageBilling"),
        cancel: t("cancel"),
        resume: t("resume"),
        cancelHint: t("cancelHint"),
        pastDue: t("pastDue"),
        cancelPending: t("cancelPending"),
        stripeMissing: t("stripeMissing"),
        conversations: t("conversations"),
        conversationsPerMonth: t("conversationsPerMonth"),
        status: t("status"),
        download: t("download"),
        view: t("view"),
        flashSuccess: t("flash.success"),
        flashUpdated: t("flash.updated"),
        flashCanceled: t("flash.canceled"),
        flashCanceledPending: t("flash.canceledPending"),
        flashResumed: t("flash.resumed"),
        flashCardAdded: t("flash.cardAdded"),
      }}
    />
  );
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
