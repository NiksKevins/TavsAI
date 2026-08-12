import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://bot.tavswebs.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/onboarding", "/partner", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
