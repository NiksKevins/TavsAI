import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { requireUser } from "@/lib/authz";
import { userHasPartnerAccess } from "@/lib/partner/authz";
import { prisma } from "@/lib/db";

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const hasAccess = await userHasPartnerAccess(user.id);
  const t = await getTranslations("partner");
  const home = await getTranslations("home");

  const membership = hasAccess
    ? await prisma.partnerMember.findFirst({
        where: { userId: user.id, partner: { status: "ACTIVE" } },
        include: { partner: true },
        orderBy: { createdAt: "asc" },
      })
    : null;

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f7f6f3_0%,#eef2ee_100%)]">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href="/partner" className="font-display text-lg font-semibold">
              {membership?.partner.name ?? t("portal")}
            </Link>
            {membership ? (
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {t("portal")}
              </span>
            ) : null}
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {hasAccess ? (
              <>
                <Link
                  href="/partner"
                  className="text-ink-soft hover:text-foreground"
                >
                  {t("nav.overview")}
                </Link>
                <Link
                  href="/partner/customers"
                  className="text-ink-soft hover:text-foreground"
                >
                  {t("nav.customers")}
                </Link>
              </>
            ) : null}
            <Link
              href="/dashboard"
              className="text-ink-soft hover:text-foreground"
            >
              {home("brand")}
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
