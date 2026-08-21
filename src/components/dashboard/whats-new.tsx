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
import { Megaphone, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <WhatsNewContext.Provider value={value}>{children}</WhatsNewContext.Provider>
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

/** First-glance card on Pārskats — newest release only. */
export function WhatsNewBanner() {
  const t = useTranslations("dashboard.whatsNew");
  const locale = useLocale();
  const { ready, hasUnread, dismiss } = useWhatsNew();
  const latest = CHANGELOG[0];

  if (!ready || !hasUnread || !latest) return null;

  return (
    <Card className="border-primary/25 bg-primary/[0.04]">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{t("badge")}</CardTitle>
              <Badge variant="secondary" className="font-normal">
                {latest.date}
              </Badge>
            </div>
            <CardDescription className="mt-1.5 text-sm text-foreground/80">
              {pickChangelogText(latest.summary, locale)}
            </CardDescription>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={dismiss}
          aria-label={t("dismiss")}
        >
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pt-0">
        <Button type="button" size="sm" asChild>
          <Link href={WHATS_NEW_HREF}>{t("readAll")}</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={dismiss}>
          {t("dismiss")}
        </Button>
      </CardContent>
    </Card>
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
