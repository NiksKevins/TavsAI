import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { defaultLocale, isAppLocale, type AppLocale } from "./config";

/** Link-preview bots usually send English Accept-Language and no cookies. */
function isLinkPreviewBot(userAgent: string): boolean {
  return /whatsapp|facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|skypeuripreview|embedly|quora link preview|pinterest|redditbot|applebot|bingpreview/i.test(
    userAgent,
  );
}

async function resolveLocale(): Promise<AppLocale> {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent") ?? "";
  if (isLinkPreviewBot(userAgent)) {
    return defaultLocale;
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = headerStore.get("accept-language") ?? "";
  if (acceptLanguage.toLowerCase().includes("lv")) {
    return "lv";
  }
  if (acceptLanguage.toLowerCase().includes("en")) {
    return "en";
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
