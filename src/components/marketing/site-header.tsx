import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link as LocaleLink } from "@/i18n/navigation";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const home = await getTranslations("home");

  const links = [
    { href: "/demo", label: t("demo") },
    { href: "/how", label: t("how") },
    { href: "/pricing", label: t("pricing") },
    { href: "/faq", label: t("faq") },
  ] as const;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6">
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center justify-between gap-3 rounded-full border border-border/60 bg-background/85 px-3 pl-5 shadow-[0_8px_32px_-8px_rgba(18,31,27,0.12)] backdrop-blur-xl sm:h-14 sm:px-4 sm:pl-6">
        <LocaleLink
          href="/"
          className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground sm:text-base"
        >
          {home("brand")}
        </LocaleLink>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {links.map((link) => (
            <LocaleLink
              key={link.href}
              href={link.href}
              className="hidden rounded-full px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground md:inline"
            >
              {link.label}
            </LocaleLink>
          ))}
          <div className="mx-1 hidden h-3.5 w-px bg-border/80 lg:block" aria-hidden />
          <LocaleSwitcher />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full text-[13px] sm:inline-flex"
          >
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full px-4 text-[13px] shadow-sm"
          >
            <Link href="/register">{t("register")}</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
