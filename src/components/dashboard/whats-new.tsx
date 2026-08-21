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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CHANGELOG,
  LATEST_CHANGELOG_ID,
  WHATS_NEW_STORAGE_KEY,
  pickChangelogText,
  type ChangelogEntry,
} from "@/config/changelog";
import { cn } from "@/lib/utils";

type WhatsNewContextValue = {
  ready: boolean;
  hasUnread: boolean;
  logOpen: boolean;
  setLogOpen: (open: boolean) => void;
  dismiss: () => void;
  openLog: () => void;
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
  const [logOpen, setLogOpen] = useState(false);

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

  const openLog = useCallback(() => {
    setLogOpen(true);
    dismiss();
  }, [dismiss]);

  const value = useMemo(
    () => ({
      ready,
      hasUnread: ready && dismissedVersion !== LATEST_CHANGELOG_ID,
      logOpen,
      setLogOpen,
      dismiss,
      openLog,
    }),
    [ready, dismissedVersion, logOpen, dismiss, openLog],
  );

  return (
    <WhatsNewContext.Provider value={value}>
      {children}
      {logOpen ? (
        <WhatsNewDialog open={logOpen} onOpenChange={setLogOpen} />
      ) : null}
    </WhatsNewContext.Provider>
  );
}

function ChangelogList({
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

function WhatsNewDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard.whatsNew");
  const locale = useLocale();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("logTitle")}</DialogTitle>
          <DialogDescription>{t("logSubtitle")}</DialogDescription>
        </DialogHeader>
        <ChangelogList locale={locale} />
      </DialogContent>
    </Dialog>
  );
}

/** First-glance card on Pārskats — newest release only. */
export function WhatsNewBanner() {
  const t = useTranslations("dashboard.whatsNew");
  const locale = useLocale();
  const { ready, hasUnread, dismiss, openLog } = useWhatsNew();
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
        <Button type="button" size="sm" onClick={openLog}>
          {t("readAll")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={dismiss}>
          {t("dismiss")}
        </Button>
      </CardContent>
    </Card>
  );
}

/** Header control — reopen the full log anytime; badge when unread. */
export function WhatsNewHeaderButton({ className }: { className?: string }) {
  const t = useTranslations("dashboard.whatsNew");
  const { ready, hasUnread, openLog } = useWhatsNew();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("relative gap-1.5", className)}
      onClick={openLog}
      aria-label={t("button")}
    >
      <Megaphone className="size-3.5" />
      <span className="hidden sm:inline">{t("button")}</span>
      {ready && hasUnread ? (
        <span
          className="absolute -right-1 -top-1 size-2 rounded-full bg-primary"
          aria-hidden
        />
      ) : null}
    </Button>
  );
}
