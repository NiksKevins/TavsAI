import Link from "next/link";
import { getTranslations } from "next-intl/server";

import {
  bootstrapTavsWebsPartnerAction,
  createReferralCodeAction,
  updateCommissionRateAction,
} from "@/actions/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEurFromCents } from "@/config/partner";
import { requirePartner, userHasPartnerAccess } from "@/lib/partner/authz";
import { requireUser } from "@/lib/authz";
import { getPartnerDashboardStats } from "@/services/partner/commission-service";
import { ensureTavsWebsPartner } from "@/services/partner/partner-service";
import { prisma } from "@/lib/db";

export default async function PartnerOverviewPage() {
  const user = await requireUser();
  const hasAccess = await userHasPartnerAccess(user.id);

  if (!hasAccess) {
    const t = await getTranslations("partner");
    return (
      <div className="mx-auto max-w-lg space-y-6 py-16">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("bootstrap.title")}
        </h1>
        <p className="text-ink-soft">{t("bootstrap.hint")}</p>
        <form action={bootstrapTavsWebsPartnerAction}>
          <Button type="submit">{t("bootstrap.action")}</Button>
        </form>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard" className="text-primary hover:underline">
            {t("backToDashboard")}
          </Link>
        </p>
      </div>
    );
  }

  // Ensure default referral exists for TavsWebs slug partners
  const { partner, membership } = await requirePartner();
  if (partner.slug === "tavswebs") {
    await ensureTavsWebsPartner();
  }

  const t = await getTranslations("partner");
  const stats = await getPartnerDashboardStats(partner.id);
  const recentCommissions = await prisma.commission.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3001"
  ).replace(/\/$/, "");

  const canManage = membership.role === "OWNER" || membership.role === "ADMIN";

  return (
    <div className="space-y-10">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-primary">
          {t("portal")}
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {partner.name}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-soft">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("stats.customers")} value={String(stats.customers)} />
        <Stat
          label={t("stats.activeAssistants")}
          value={String(stats.activeAssistants)}
        />
        <Stat
          label={t("stats.mrr")}
          value={formatEurFromCents(stats.mrrInvoiceCents)}
        />
        <Stat
          label={t("stats.commissionMonth")}
          value={formatEurFromCents(stats.commissionMonthCents)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t("stats.commissionPending")}
          value={formatEurFromCents(stats.commissionPendingCents)}
        />
        <Stat
          label={t("stats.commissionPaid")}
          value={formatEurFromCents(stats.commissionPaidCents)}
        />
        <Stat
          label={t("stats.conversions")}
          value={`${stats.referralConversions} / ${stats.referralClicks}`}
        />
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="border border-border bg-card/70 p-5">
          <h2 className="font-display text-lg font-semibold">
            {t("commission.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("commission.hint", {
              rate: (partner.defaultCommissionBps / 100).toFixed(0),
            })}
          </p>
          {canManage ? (
            <form action={updateCommissionRateAction} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="commissionPercent">{t("commission.percent")}</Label>
                <Input
                  id="commissionPercent"
                  name="commissionPercent"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  defaultValue={(partner.defaultCommissionBps / 100).toFixed(0)}
                  className="w-28"
                />
              </div>
              <Button type="submit" variant="outline">
                {t("commission.save")}
              </Button>
            </form>
          ) : null}
        </div>

        <div className="border border-border bg-card/70 p-5">
          <h2 className="font-display text-lg font-semibold">
            {t("referrals.title")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("referrals.hint")}
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {stats.referrals.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center justify-between gap-2">
                <code className="text-foreground">{r.code}</code>
                <a
                  className="text-primary hover:underline"
                  href={`${appUrl}/register?ref=${encodeURIComponent(r.code)}`}
                >
                  {t("referrals.link")}
                </a>
              </li>
            ))}
            {stats.referrals.length === 0 ? (
              <li className="text-muted-foreground">{t("referrals.empty")}</li>
            ) : null}
          </ul>
          {canManage ? (
            <form action={createReferralCodeAction} className="mt-4 flex flex-wrap gap-2">
              <Input
                name="code"
                placeholder="CODE"
                className="w-36 uppercase"
                required
                minLength={3}
              />
              <Input name="label" placeholder={t("referrals.label")} className="w-40" />
              <Button type="submit" variant="outline">
                {t("referrals.create")}
              </Button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="border border-border bg-card/70 p-5">
        <h2 className="font-display text-lg font-semibold">
          {t("commissionsRecent")}
        </h2>
        {recentCommissions.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">{t("commissionsEmpty")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t("table.invoice")}</th>
                  <th className="py-2 pr-4 font-medium">{t("table.amount")}</th>
                  <th className="py-2 pr-4 font-medium">{t("table.commission")}</th>
                  <th className="py-2 font-medium">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody>
                {recentCommissions.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-2 pr-4 font-mono text-xs">{c.stripeInvoiceId}</td>
                    <td className="py-2 pr-4">
                      {formatEurFromCents(c.invoiceAmountCents)}
                    </td>
                    <td className="py-2 pr-4">
                      {formatEurFromCents(c.commissionAmountCents)}{" "}
                      <span className="text-muted-foreground">
                        ({(c.commissionBps / 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="py-2">{c.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">{t("whitelabelNote")}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card/70 px-4 py-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}
