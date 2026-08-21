import {
  cancelSubscriptionAction,
  openBillingPortalAction,
  resumeSubscriptionAction,
  startAddPaymentMethodAction,
  startCheckoutAction,
} from "@/actions/billing";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { PAID_PLANS, PLANS, planRank, type PlanId } from "@/config/plans";
import type { UsageSnapshot } from "@/services/billing/usage-service";

export type BillingInvoice = {
  id: string;
  number: string | null;
  status: string | null;
  amountPaid: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export type BillingPaymentMethod = {
  id: string;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  isDefault: boolean;
};

export type BillingLabels = {
  title: string;
  subtitle: string;
  currentPlan: string;
  usage: string;
  remaining: string;
  ofLimit: string;
  billingCycle: string;
  price: string;
  perMonth: string;
  paymentMethod: string;
  noPaymentMethod: string;
  paymentMethodHint: string;
  addCard: string;
  manageCards: string;
  defaultCard: string;
  invoices: string;
  noInvoices: string;
  changePlan: string;
  upgrade: string;
  downgrade: string;
  current: string;
  manageBilling: string;
  cancel: string;
  resume: string;
  cancelHint: string;
  pastDue: string;
  cancelPending: string;
  stripeMissing: string;
  conversations: string;
  conversationsPerMonth: string;
  status: string;
  download: string;
  view: string;
  flashSuccess: string;
  flashUpdated: string;
  flashCanceled: string;
  flashCanceledPending: string;
  flashResumed: string;
  flashCardAdded: string;
};

export function BillingDashboard(props: {
  usage: UsageSnapshot;
  hasStripeCustomer: boolean;
  hasStripeSubscription: boolean;
  paymentMethods: BillingPaymentMethod[];
  invoices: BillingInvoice[];
  stripeConfigured: boolean;
  canManage: boolean;
  flash?: string | null;
  error?: string | null;
  labels: BillingLabels;
}) {
  const { usage, labels } = props;
  const pct = Math.min(
    100,
    Math.round((usage.used / Math.max(1, usage.limit)) * 100),
  );
  const periodLabel = formatPeriod(
    usage.currentPeriodStart ?? usage.period.start,
    usage.currentPeriodEnd ?? usage.period.end,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {labels.title}
        </h1>
        <p className="mt-2 text-muted-foreground">{labels.subtitle}</p>
      </div>

      {props.flash ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {flashMessage(props.flash, labels)}
        </p>
      ) : null}
      {props.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {props.error}
        </p>
      ) : null}

      {!props.stripeConfigured ? (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {labels.stripeMissing}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div>
              <CardTitle>{labels.currentPlan}</CardTitle>
              <CardDescription>
                {PLANS[usage.plan].name} · {labels.status}: {usage.status}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {usage.cancelAtPeriodEnd ? (
                <Badge variant="secondary">{labels.cancelPending}</Badge>
              ) : null}
              {usage.status === "PAST_DUE" ? (
                <Badge variant="warning">{labels.pastDue}</Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat
                label={labels.price}
                value={
                  PLANS[usage.plan].priceMonthlyEur === 0
                    ? "€0"
                    : `€${PLANS[usage.plan].priceMonthlyEur}${labels.perMonth}`
                }
              />
              <Stat label={labels.billingCycle} value={periodLabel} />
              <div className="space-y-2 sm:col-span-1">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.paymentMethod}
                </div>
                {props.paymentMethods.length === 0 ? (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{labels.noPaymentMethod}</p>
                    <p className="text-xs text-muted-foreground">
                      {labels.paymentMethodHint}
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {props.paymentMethods.map((pm) => (
                      <li
                        key={pm.id}
                        className="flex flex-wrap items-center gap-2 text-sm font-medium"
                      >
                        <span>
                          {formatCardBrand(pm.brand)} ···· {pm.last4}
                          {pm.expMonth && pm.expYear
                            ? ` · ${String(pm.expMonth).padStart(2, "0")}/${String(pm.expYear).slice(-2)}`
                            : ""}
                        </span>
                        {pm.isDefault ? (
                          <Badge variant="secondary" className="font-normal">
                            {labels.defaultCard}
                          </Badge>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                {props.canManage && props.stripeConfigured ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <form action={startAddPaymentMethodAction}>
                      <PendingSubmitButton
                        idleLabel={labels.addCard}
                        pendingLabel={labels.addCard}
                        variant="outline"
                        size="sm"
                      />
                    </form>
                    <form action={openBillingPortalAction}>
                      <PendingSubmitButton
                        idleLabel={labels.manageCards}
                        pendingLabel={labels.manageCards}
                        variant="ghost"
                        size="sm"
                      />
                    </form>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-end justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{labels.usage}</div>
                  <div className="text-muted-foreground">
                    {labels.conversations}: {usage.used} / {usage.limit}
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {labels.remaining}: {usage.remaining}
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {labels.ofLimit}
              </p>
            </div>

            {props.canManage && props.stripeConfigured ? (
              <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                {props.hasStripeSubscription && !usage.cancelAtPeriodEnd ? (
                  <form action={cancelSubscriptionAction}>
                    <PendingSubmitButton
                      idleLabel={labels.cancel}
                      pendingLabel={labels.cancel}
                      variant="outline"
                    />
                  </form>
                ) : null}
                {usage.cancelAtPeriodEnd && props.hasStripeSubscription ? (
                  <form action={resumeSubscriptionAction}>
                    <PendingSubmitButton
                      idleLabel={labels.resume}
                      pendingLabel={labels.resume}
                    />
                  </form>
                ) : null}
              </div>
            ) : null}
            {usage.cancelAtPeriodEnd ? (
              <p className="text-xs text-muted-foreground">{labels.cancelHint}</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{labels.changePlan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(PLANS) as PlanId[]).map((planId) => {
              const plan = PLANS[planId];
              const isCurrent = planId === usage.plan;
              const isPaid = (PAID_PLANS as readonly string[]).includes(planId);
              const isUpgrade = planRank(planId) > planRank(usage.plan);
              const actionLabel = isUpgrade ? labels.upgrade : labels.downgrade;
              return (
                <div
                  key={planId}
                  className="rounded-lg border border-border px-3 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        €{plan.priceMonthlyEur}
                        {labels.perMonth} ·{" "}
                        {plan.conversationLimit.toLocaleString()}{" "}
                        {labels.conversationsPerMonth}
                      </div>
                    </div>
                    {isCurrent ? (
                      <Badge variant="secondary">{labels.current}</Badge>
                    ) : props.canManage && props.stripeConfigured && isPaid ? (
                      <form action={startCheckoutAction}>
                        <input type="hidden" name="planId" value={planId} />
                        <PendingSubmitButton
                          idleLabel={actionLabel}
                          pendingLabel={actionLabel}
                          size="sm"
                          variant={isUpgrade ? "default" : "outline"}
                        />
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{labels.invoices}</CardTitle>
        </CardHeader>
        <CardContent>
          {props.invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{labels.noInvoices}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 pr-3 font-medium">#</th>
                    <th className="py-2 pr-3 font-medium">{labels.status}</th>
                    <th className="py-2 pr-3 font-medium">{labels.price}</th>
                    <th className="py-2 pr-3 font-medium">
                      {labels.billingCycle}
                    </th>
                    <th className="py-2 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {props.invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border/70">
                      <td className="py-2 pr-3">
                        {invoice.number ?? invoice.id}
                      </td>
                      <td className="py-2 pr-3">{invoice.status}</td>
                      <td className="py-2 pr-3">
                        {(invoice.amountPaid / 100).toFixed(2)}{" "}
                        {invoice.currency.toUpperCase()}
                      </td>
                      <td className="py-2 pr-3">
                        {new Date(invoice.created * 1000).toLocaleDateString()}
                      </td>
                      <td className="py-2 text-right">
                        {invoice.hostedInvoiceUrl ? (
                          <a
                            className="text-primary underline-offset-2 hover:underline"
                            href={invoice.hostedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {labels.view}
                          </a>
                        ) : null}
                        {invoice.invoicePdf ? (
                          <>
                            {" · "}
                            <a
                              className="text-primary underline-offset-2 hover:underline"
                              href={invoice.invoicePdf}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {labels.download}
                            </a>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function formatPeriod(start: Date, end: Date) {
  const opts: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

function formatCardBrand(brand: string | null) {
  if (!brand) return "Card";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function flashMessage(flash: string, labels: BillingLabels) {
  switch (flash) {
    case "success":
      return labels.flashSuccess;
    case "updated":
      return labels.flashUpdated;
    case "canceled":
      return labels.flashCanceled;
    case "canceled_pending":
      return labels.flashCanceledPending;
    case "resumed":
      return labels.flashResumed;
    case "card_added":
      return labels.flashCardAdded;
    default:
      return flash;
  }
}
