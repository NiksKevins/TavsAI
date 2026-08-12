import type { MetadataRoute } from "next";

const base =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
  "https://bot.tavswebs.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/demo",
    "/how",
    "/pricing",
    "/faq",
    "/industries",
    "/login",
    "/register",
  ];

  const now = new Date();

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" || path === "/demo" ? 0.9 : 0.7,
  }));
}
