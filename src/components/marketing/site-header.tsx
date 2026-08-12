import { getTranslations } from "next-intl/server";

import {
  SiteHeaderClient,
  type HeaderLink,
} from "@/components/marketing/site-header-client";

export async function SiteHeader() {
  const t = await getTranslations("nav");
  const home = await getTranslations("home");
  const common = await getTranslations("common");

  const links: HeaderLink[] = [
    { href: "/demo", label: t("demo") },
    { href: "/how", label: t("how") },
    { href: "/pricing", label: t("pricing") },
    { href: "/faq", label: t("faq") },
  ];

  return (
    <SiteHeaderClient
      links={links}
      labels={{
        brand: home("brand"),
        login: t("login"),
        register: t("register"),
        menuOpen: t("menuOpen"),
        menuClose: t("menuClose"),
        menuTitle: t("menuTitle"),
        language: common("language"),
      }}
    />
  );
}
