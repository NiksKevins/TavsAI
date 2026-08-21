import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MarketingContainer } from "@/components/marketing/marketing-ui";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("marketing.footer");
  const nav = await getTranslations("nav");
  const home = await getTranslations("home");

  const marketingLinks = [
    {
      title: t("demo"),
      links: [
        { href: "/demo" as const, label: t("demo") },
        { href: "/how" as const, label: nav("how") },
        { href: "/industries" as const, label: nav("industries") },
      ],
    },
    {
      title: nav("pricing"),
      links: [
        { href: "/pricing" as const, label: t("pricing") },
        { href: "/faq" as const, label: nav("faq") },
        { href: "/privacy" as const, label: t("privacy") },
        { href: "/cookies" as const, label: t("cookies") },
      ],
    },
  ] as const;

  const authLinks = [
    { href: "/register", label: t("start") },
    { href: "/login", label: t("login") },
  ] as const;

  return (
    <footer className="border-t border-white/10 bg-surface-dark text-text-muted-on-dark">
      <MarketingContainer wide className="grid gap-8 py-10 sm:grid-cols-[1.2fr_1fr_1fr] sm:py-12">
        <div>
          <LocaleLink
            href="/"
            className="font-display text-xl font-semibold text-text-on-dark transition-opacity hover:opacity-90"
          >
            {home("brand")}
          </LocaleLink>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">{t("tagline")}</p>
          <p className="mt-4">
            <a
              href="https://tavswebs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="link-premium text-sm text-slate-400 hover:text-text-on-dark"
            >
              tavswebs.com
            </a>
          </p>
        </div>
        {marketingLinks.map((col) => (
          <div key={col.title}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((link) => (
                <li key={link.href}>
                  <LocaleLink
                    href={link.href}
                    className="link-premium text-text-muted-on-dark hover:text-text-on-dark"
                  >
                    {link.label}
                  </LocaleLink>
                </li>
              ))}
              {col.title === nav("pricing")
                ? authLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="link-premium text-text-muted-on-dark hover:text-text-on-dark"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))
                : null}
            </ul>
          </div>
        ))}
      </MarketingContainer>
      <div className="border-t border-white/10">
        <MarketingContainer className="flex flex-col gap-2 py-4 text-xs text-slate-500 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} TavsWebs</span>
          <LocaleLink
            href="/"
            className="link-premium text-slate-500 hover:text-slate-300"
          >
            bot.tavswebs.com
          </LocaleLink>
        </MarketingContainer>
      </div>
    </footer>
  );
}
