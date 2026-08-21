"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Link as LocaleLink } from "@/i18n/navigation";

const STORAGE_KEY = "tavsai.cookieNotice.v1";

export function CookieNotice() {
  const t = useTranslations("legal");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t("bannerTitle")}
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-lg rounded-xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-4 sm:bottom-4"
    >
      <p className="text-sm font-medium text-foreground">{t("bannerTitle")}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {t("bannerBody")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => {
            try {
              localStorage.setItem(STORAGE_KEY, "1");
            } catch {
              /* ignore */
            }
            setVisible(false);
          }}
        >
          {t("bannerAccept")}
        </Button>
        <Button asChild type="button" size="sm" variant="outline">
          <LocaleLink href="/privacy">{t("bannerPrivacy")}</LocaleLink>
        </Button>
      </div>
    </div>
  );
}
