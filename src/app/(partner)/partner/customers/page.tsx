import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { linkCustomerWorkspaceAction } from "@/actions/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatEurFromCents } from "@/config/partner";
import { requirePartner } from "@/lib/partner/authz";
import { prisma } from "@/lib/db";
import { PLANS } from "@/config/plans";

export default async function PartnerCustomersPage() {
  const { partner, membership } = await requirePartner();
  const t = await getTranslations("partner");

  const customers = await prisma.partnerWorkspace.findMany({
    where: { partnerId: partner.id },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          onboardingCompletedAt: true,
          subscription: { select: { plan: true, status: true } },
          assistantConfiguration: { select: { name: true } },
        },
      },
      commissions: {
        where: { status: { in: ["PENDING", "APPROVED", "PAID"] } },
        select: { commissionAmountCents: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const canManage = membership.role !== "VIEWER";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("customers.title")}
        </h1>
        <p className="mt-2 text-ink-soft">{t("customers.subtitle")}</p>
      </div>

      {canManage ? (
        <form
          action={linkCustomerWorkspaceAction}
          className="flex flex-wrap items-end gap-3 border border-border bg-card/70 p-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="workspaceId">{t("customers.linkLabel")}</Label>
            <Input
              id="workspaceId"
              name="workspaceId"
              placeholder="workspace UUID"
              className="w-80 font-mono text-xs"
              required
            />
          </div>
          <Button type="submit" variant="outline">
            {t("customers.link")}
          </Button>
        </form>
      ) : null}

      {customers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("customers.empty")}</p>
      ) : (
        <div className="overflow-x-auto border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">{t("customers.col.name")}</th>
                <th className="px-4 py-3 font-medium">{t("customers.col.status")}</th>
                <th className="px-4 py-3 font-medium">{t("customers.col.plan")}</th>
                <th className="px-4 py-3 font-medium">{t("customers.col.assistant")}</th>
                <th className="px-4 py-3 font-medium">{t("customers.col.commission")}</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((row) => {
                const earned = row.commissions.reduce(
                  (sum, c) => sum + c.commissionAmountCents,
                  0,
                );
                const plan = row.workspace.subscription?.plan ?? "FREE";
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.workspace.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.workspace.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3">{row.status}</td>
                    <td className="px-4 py-3">
                      {PLANS[plan]?.name ?? plan}
                    </td>
                    <td className="px-4 py-3">
                      {row.activatedAt || row.workspace.onboardingCompletedAt
                        ? row.workspace.assistantConfiguration?.name ?? "—"
                        : t("customers.notActivated")}
                    </td>
                    <td className="px-4 py-3">{formatEurFromCents(earned)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm">
        <Link href="/partner" className="text-primary hover:underline">
          {t("nav.overview")}
        </Link>
      </p>
    </div>
  );
}
