"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  const t = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: AppLocale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  const dark = tone === "dark";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border p-0.5",
        dark
          ? "border-white/15 bg-white/5"
          : "border-border/80 bg-card/80",
        className,
      )}
      aria-label={t("language")}
    >
      <Button
        type="button"
        size="sm"
        variant={locale === "lv" ? "secondary" : "ghost"}
        disabled={pending || locale === "lv"}
        onClick={() => setLocale("lv")}
        className={cn(
          "h-8 px-2.5",
          dark &&
            (locale === "lv"
              ? "bg-white text-[#0b1220] hover:bg-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"),
        )}
      >
        LV
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "secondary" : "ghost"}
        disabled={pending || locale === "en"}
        onClick={() => setLocale("en")}
        className={cn(
          "h-8 px-2.5",
          dark &&
            (locale === "en"
              ? "bg-white text-[#0b1220] hover:bg-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"),
        )}
      >
        EN
      </Button>
    </div>
  );
}
