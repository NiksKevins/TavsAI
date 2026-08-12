import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";

import { Toaster } from "@/components/ui/toast";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["400", "500", "600", "700"],
  preload: true,
  adjustFontFallback: true,
});

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  variable: "--font-syne",
  display: "swap",
  weight: ["500", "600", "700", "800"],
  preload: true,
  adjustFontFallback: true,
});

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
  const t = await getTranslations({ locale: "lv", namespace: "meta" });
  const siteUrl = resolveSiteUrl();

  return {
    metadataBase: siteUrl,
    title: {
      default: t("title"),
      template: `%s · TavsWebs Bot`,
    },
    description: t("description"),
    applicationName: "TavsWebs Bot",
    authors: [{ name: "TavsWebs", url: "https://tavswebs.com" }],
    creator: "TavsWebs",
    publisher: "TavsWebs",
    keywords: t("keywords")
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    alternates: {
      canonical: "/lv",
      languages: {
        lv: "/lv",
        en: "/en",
        "x-default": "/lv",
      },
    },
    openGraph: {
      type: "website",
      locale: "lv_LV",
      alternateLocale: ["en_GB"],
      url: new URL("/lv", siteUrl),
      siteName: "TavsWebs Bot",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    icons: {
      icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
      apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "technology",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${manrope.variable} ${syne.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster position="top-right" />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
