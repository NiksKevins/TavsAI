import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { MarketingSiteChat } from "@/components/marketing/marketing-site-chat";

function resolveSiteUrl(): URL {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return new URL(configured.endsWith("/") ? configured : `${configured}/`);
  }
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) {
    return new URL(`https://${productionHost}`);
  }
  return new URL("https://bot.tavswebs.com");
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("meta");
  const siteUrl = resolveSiteUrl();
  const path = `/${locale}`;

  return {
    title: {
      default: t("title"),
      template: `%s · TavsWebs Bot`,
    },
    description: t("description"),
    alternates: {
      canonical: path,
      languages: {
        lv: "/lv",
        en: "/en",
        "x-default": "/lv",
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "en" ? "en_GB" : "lv_LV",
      alternateLocale: locale === "en" ? ["lv_LV"] : ["en_GB"],
      url: new URL(path, siteUrl),
      siteName: "TavsWebs Bot",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pt-[4.25rem] sm:pt-[4.5rem]">{children}</main>
      <SiteFooter />
      <MarketingSiteChat />
    </div>
  );
}
