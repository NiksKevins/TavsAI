"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/knowledge/website", key: "website" },
  { href: "/dashboard/knowledge/services", key: "services" },
  { href: "/dashboard/knowledge/faqs", key: "faqs" },
  { href: "/dashboard/knowledge/documents", key: "documents" },
  { href: "/dashboard/knowledge/business", key: "business" },
  { href: "/dashboard/knowledge/test", key: "test" },
] as const;

export function KnowledgeTabs() {
  const t = useTranslations("knowledge.tabs");
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {TABS.map((tab) => {
        const active =
          pathname === tab.href ||
          (tab.key === "website" && pathname === "/dashboard/knowledge");
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
