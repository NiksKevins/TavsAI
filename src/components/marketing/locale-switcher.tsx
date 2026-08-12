"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(next: AppLocale) {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-full border border-border/80 bg-card/80 p-0.5"
      aria-label={t("language")}
    >
      <Button
        type="button"
        size="sm"
        variant={locale === "lv" ? "secondary" : "ghost"}
        disabled={pending || locale === "lv"}
        onClick={() => setLocale("lv")}
        className="h-8 px-2.5"
      >
        LV
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "secondary" : "ghost"}
        disabled={pending || locale === "en"}
        onClick={() => setLocale("en")}
        className="h-8 px-2.5"
      >
        EN
      </Button>
    </div>
  );
}
