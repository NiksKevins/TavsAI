"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Megaphone, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CHANGELOG,
  LATEST_CHANGELOG_ID,
  WHATS_NEW_STORAGE_KEY,
  pickChangelogText,
  type ChangelogEntry,
} from "@/config/changelog";
import { cn } from "@/lib/utils";

const WHATS_NEW_HREF = "/dashboard/whats-new";

type WhatsNewContextValue = {
  ready: boolean;
  hasUnread: boolean;
  dismiss: () => void;
};

const WhatsNewContext = createContext<WhatsNewContextValue | null>(null);

function useWhatsNew() {
  const ctx = useContext(WhatsNewContext);
  if (!ctx) {
    throw new Error("WhatsNew components must be used within WhatsNewProvider");
  }
  return ctx;
}

export function WhatsNewProvider({ children }: { children: ReactNode }) {
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setDismissedVersion(localStorage.getItem(WHATS_NEW_STORAGE_KEY));
    } catch {
      setDismissedVersion(null);
    }
    setReady(true);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(WHATS_NEW_STORAGE_KEY, LATEST_CHANGELOG_ID);
    } catch {
      /* ignore quota / private mode */
    }
    setDismissedVersion(LATEST_CHANGELOG_ID);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      hasUnread: ready && dismissedVersion !== LATEST_CHANGELOG_ID,
      dismiss,
    }),
    [ready, dismissedVersion, dismiss],
  );

  return (
    <WhatsNewContext.Provider value={value}>
      {children}
      <WhatsNewPopup />
    </WhatsNewContext.Provider>
  );
}

/** Marks the latest changelog as read when the Jaunumi page mounts. */
export function WhatsNewMarkRead() {
  const { dismiss } = useWhatsNew();

  useEffect(() => {
    dismiss();
  }, [dismiss]);

  return null;
}

export function ChangelogList({
  locale,
  entries = CHANGELOG,
}: {
  locale: string;
  entries?: ChangelogEntry[];
}) {
  return (
    <ol className="space-y-6">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="border-b border-border pb-6 last:border-0 last:pb-0"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-base font-semibold">
              {pickChangelogText(entry.title, locale)}
            </h3>
            <time
              dateTime={entry.date}
              className="text-xs text-muted-foreground tabular-nums"
            >
              {entry.date}
            </time>
          </div>
          <ul className="mt-3 space-y-2">
            {entry.items.map((item, i) => (
              <li
                key={`${entry.id}-${i}`}
                className="flex gap-2 text-sm text-muted-foreground"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{pickChangelogText(item, locale)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

/** Bottom-right preview when there is an unread release. */
function WhatsNewPopup() {
  const t = useTranslations("dashboard.whatsNew");
  const locale = useLocale();
  const pathname = usePathname();
  const { ready, hasUnread, dismiss } = useWhatsNew();
  const [visible, setVisible] = useState(false);
  const latest = CHANGELOG[0];

  const onWhatsNewPage = pathname?.includes("/whats-new") ?? false;

  useEffect(() => {
    if (!ready || !hasUnread || !latest || onWhatsNewPage) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), 450);
    return () => window.clearTimeout(id);
  }, [ready, hasUnread, latest, onWhatsNewPage]);

  if (!ready || !hasUnread || !latest || onWhatsNewPage || !visible) {
    return null;
  }

  const previewItems = latest.items.slice(0, 3);

  return (
    <aside
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-4 right-4 z-50 w-[min(100vw-2rem,22rem)]",
        "animate-in fade-in slide-in-from-bottom-4 duration-300",
      )}
    >
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_48px_-12px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-3 border-b border-border/80 bg-primary/[0.04] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Megaphone className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold leading-none">{t("badge")}</p>
                <Badge variant="secondary" className="font-normal">
                  {latest.date}
                </Badge>
              </div>
              <p className="mt-1.5 truncate text-sm text-foreground">
                {pickChangelogText(latest.title, locale)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={dismiss}
            aria-label={t("dismiss")}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-3 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {pickChangelogText(latest.summary, locale)}
          </p>
          <ul className="space-y-2">
            {previewItems.map((item, i) => (
              <li
                key={`${latest.id}-preview-${i}`}
                className="flex gap-2 text-sm text-foreground/85"
              >
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{pickChangelogText(item, locale)}</span>
              </li>
            ))}
          </ul>
          {latest.items.length > previewItems.length ? (
            <p className="text-xs text-muted-foreground">
              {t("moreCount", {
                count: latest.items.length - previewItems.length,
              })}
            </p>
          ) : null}
        </div>

        <div className="flex gap-2 border-t border-border/80 px-4 py-3">
          <Button type="button" size="sm" className="flex-1" asChild>
            <Link href={WHATS_NEW_HREF} onClick={dismiss}>
              {t("readAll")}
            </Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={dismiss}
          >
            {t("dismiss")}
          </Button>
        </div>
      </div>
    </aside>
  );
}

/** Header control — opens the full Jaunumi page; badge when unread. */
export function WhatsNewHeaderButton({ className }: { className?: string }) {
  const t = useTranslations("dashboard.whatsNew");
  const { ready, hasUnread } = useWhatsNew();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("relative gap-1.5", className)}
      asChild
    >
      <Link
        href={WHATS_NEW_HREF}
        aria-label={t("button")}
        className="relative"
      >
        <Megaphone className="size-3.5" />
        <span className="hidden sm:inline">{t("button")}</span>
        {ready && hasUnread ? (
          <span
            className="absolute -right-1 -top-1 size-2 rounded-full bg-primary"
            aria-hidden
          />
        ) : null}
      </Link>
    </Button>
  );
}
