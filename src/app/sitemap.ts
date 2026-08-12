import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://bot.tavswebs.com";

const locales = ["lv", "en"] as const;

const marketingPaths = [
  "",
  "/demo",
  "/how",
  "/pricing",
  "/faq",
  "/industries",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of marketingPaths) {
      const urlPath = `/${locale}${path}`;
      entries.push({
        url: `${base}${urlPath}`,
        lastModified: now,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority:
          path === "" ? 1 : path === "/pricing" || path === "/demo" ? 0.9 : 0.7,
        alternates: {
          languages: {
            lv: `${base}/lv${path}`,
            en: `${base}/en${path}`,
            "x-default": `${base}/lv${path}`,
          },
        },
      });
    }
  }

  for (const path of ["/login", "/register"] as const) {
    entries.push({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
