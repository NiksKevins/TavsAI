import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";

import { defaultLocale, isAppLocale, type AppLocale } from "./config";
import { routing } from "./routing";

/** Fallback for routes outside `/[locale]` (dashboard, auth, widget). */
async function resolveAppLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
  if (cookieLocale && isAppLocale(cookieLocale)) {
    return cookieLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  if (acceptLanguage.toLowerCase().includes("lv")) return "lv";
  if (acceptLanguage.toLowerCase().includes("en")) return "en";
  return defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && isAppLocale(requested)
      ? requested
      : await resolveAppLocale();

  if (!routing.locales.includes(locale)) {
    return {
      locale: defaultLocale,
      messages: (await import(`../../messages/${defaultLocale}.json`)).default,
    };
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
