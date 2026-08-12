"use client";

import dynamic from "next/dynamic";
import { MessageCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const LiveDemoChat = dynamic(
  () =>
    import("@/components/marketing/live-demo-chat").then((m) => m.LiveDemoChat),
  {
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
        …
      </div>
    ),
    ssr: false,
  },
);

/**
 * Floating product chatbot on marketing pages — visitors try TavsWebs Bot
 * itself (not an industry mock), same UX as a real site widget.
 */
export function MarketingSiteChat() {
  const t = useTranslations("marketing.siteChat");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-end p-4 sm:p-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div
            className={cn(
              "relative w-[min(100vw-2rem,380px)]",
              "animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200",
            )}
            role="dialog"
            aria-label={t("title")}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -right-1 -top-1 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-border bg-white text-foreground shadow-md transition-colors hover:bg-secondary"
              aria-label={t("close")}
            >
              <X className="size-4" />
            </button>
            <LiveDemoChat
              variant="widget"
              industryId="tavswebs"
              hideIndustryPicker
            />
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              {t("hint")}
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-14 cursor-pointer items-center gap-2.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_12px_32px_-8px_rgba(59,130,246,0.55)] transition-transform hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98]",
          )}
          aria-expanded={open}
        >
          {open ? (
            <>
              <X className="size-5" />
              <span>{t("close")}</span>
            </>
          ) : (
            <>
              <MessageCircle className="size-5" />
              <span>{t("launcher")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
