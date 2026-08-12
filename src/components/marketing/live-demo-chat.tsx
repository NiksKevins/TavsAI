"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  DEMO_INDUSTRIES,
  type DemoIndustryId,
} from "@/config/demo-industries";
import { FormattedChatMessage } from "@/components/chat/formatted-chat-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

const INDUSTRY_ORDER: DemoIndustryId[] = ["beauty", "auto", "construction"];

const INDUSTRY_THEME: Record<
  DemoIndustryId,
  { siteBg: string; siteAccent: string; chip: string; chipActive: string }
> = {
  beauty: {
    siteBg: "from-[#fce8ef] via-[#faf5f2] to-[#f3efe8]",
    siteAccent: "#be4d6a",
    chip: "border-[#e8c4d0] bg-[#fdf5f8] text-[#7a3d52]",
    chipActive: "border-[#be4d6a] bg-[#be4d6a] text-white",
  },
  auto: {
    siteBg: "from-[#e3edf5] via-[#f4f6f8] to-[#eef1f4]",
    siteAccent: "#2a5f8f",
    chip: "border-[#c5d9ea] bg-[#f0f6fb] text-[#2a5f8f]",
    chipActive: "border-[#2a5f8f] bg-[#2a5f8f] text-white",
  },
  construction: {
    siteBg: "from-[#f5ebe0] via-[#faf6f1] to-[#f0ece4]",
    siteAccent: "#a65f2a",
    chip: "border-[#e8d4bc] bg-[#fdf8f2] text-[#8a4f22]",
    chipActive: "border-[#a65f2a] bg-[#a65f2a] text-white",
  },
  tavswebs: {
    siteBg: "from-[#eff6ff] via-[#f8fafc] to-[#f1f5f9]",
    siteAccent: "#3b82f6",
    chip: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
    chipActive: "border-[#3b82f6] bg-[#3b82f6] text-white",
  },
};

export function LiveDemoChat({
  variant = "page",
  className,
  industryId: controlledIndustryId,
  onIndustryChange,
  hideIndustryPicker = false,
}: {
  variant?: "page" | "embed" | "stage" | "showcase" | "widget";
  className?: string;
  industryId?: DemoIndustryId;
  onIndustryChange?: (id: DemoIndustryId) => void;
  hideIndustryPicker?: boolean;
}) {
  const t = useTranslations("marketing.demo");
  const locale = useLocale() === "en" ? "en" : "lv";
  const [internalIndustryId, setInternalIndustryId] =
    useState<DemoIndustryId>(
      controlledIndustryId === "tavswebs" ? "tavswebs" : "auto",
    );
  const industryId = controlledIndustryId ?? internalIndustryId;
  const setIndustryId = onIndustryChange ?? setInternalIndustryId;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [showLead, setShowLead] = useState(false);
  const [leadDone, setLeadDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [leadPending, startLead] = useTransition();
  const scroller = useRef<HTMLDivElement>(null);
  const industry = DEMO_INDUSTRIES[industryId];
  const theme = INDUSTRY_THEME[industryId];

  useEffect(() => {
    const greeting = locale === "en" ? industry.greetingEn : industry.greetingLv;
    setMessages([{ role: "assistant", content: greeting }]);
    setShowLead(false);
    setLeadDone(false);
    setError(null);
    setInput("");
  }, [industryId, industry.greetingEn, industry.greetingLv, locale]);

  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showLead]);

  function send(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setError(null);
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");

    startTransition(async () => {
      try {
        const res = await fetch("/api/demo/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industryId,
            message,
            locale,
            history,
          }),
        });
        const data = (await res.json()) as {
          answer?: string;
          showLeadForm?: boolean;
          error?: string;
        };
        if (!res.ok || !data.answer) {
          setError(
            data.error === "rate_limited" ? t("rateLimited") : t("error"),
          );
          return;
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.answer! },
        ]);
        if (data.showLeadForm) setShowLead(true);
      } catch {
        setError(t("error"));
      }
    });
  }

  function submitLead(formData: FormData) {
    startLead(async () => {
      setError(null);
      try {
        const res = await fetch("/api/demo/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            industryId,
            name: String(formData.get("name") || ""),
            phone: String(formData.get("phone") || ""),
            email: String(formData.get("email") || ""),
            note: String(formData.get("note") || ""),
          }),
        });
        if (!res.ok) {
          setError(t("leadError"));
          return;
        }
        setLeadDone(true);
        setShowLead(false);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: t("leadThanks", { business: industry.businessName }),
          },
        ]);
      } catch {
        setError(t("leadError"));
      }
    });
  }

  const suggestions =
    locale === "en" ? industry.suggestionsEn : industry.suggestionsLv;

  const isCompact =
    variant === "embed" ||
    variant === "stage" ||
    variant === "showcase" ||
    variant === "widget";
  const showPicker = !hideIndustryPicker && variant !== "widget";

  const industryPicker = (
    <div
      className={cn(
        "flex flex-wrap gap-2",
        variant === "page" ? "flex-col" : "justify-center",
      )}
      role="tablist"
      aria-label={t("choose")}
    >
      {INDUSTRY_ORDER.map((id) => {
        const item = DEMO_INDUSTRIES[id];
        const active = id === industryId;
        const itemTheme = INDUSTRY_THEME[id];
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setIndustryId(id)}
            className={cn(
              "cursor-pointer rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors sm:text-[13px]",
              variant === "page" && "rounded-none px-4 py-3",
              variant === "stage" &&
                (active
                  ? "border-white bg-white text-surface-dark"
                  : "border-white/20 bg-white/8 text-white/75 hover:border-white/35 hover:bg-white/12"),
              variant === "showcase" &&
                (active
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/80 bg-white/90 text-ink-soft shadow-sm hover:border-primary/30 hover:bg-accent/80"),
              variant === "embed" &&
                (active ? itemTheme.chipActive : itemTheme.chip),
              variant === "page" &&
                (active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card/60 text-foreground hover:border-primary/40"),
            )}
          >
            {variant === "page" ? (
              <>
                <span className="block font-semibold">
                  {locale === "en" ? item.labelEn : item.labelLv}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-sm",
                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {item.businessName}
                </span>
              </>
            ) : (
              locale === "en" ? item.labelEn : item.labelLv
            )}
          </button>
        );
      })}
    </div>
  );

  const chatPanel = (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        isCompact
          ? cn(
              "rounded-2xl border",
              variant === "stage"
                ? "border-white/10 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.55)]"
                : variant === "showcase" || variant === "widget"
                  ? "border-border/60 shadow-[0_20px_50px_-12px_rgba(18,31,27,0.18)] ring-1 ring-black/[0.04]"
                  : "border-border/70 shadow-sm",
            )
          : "rounded-2xl border border-border/80 shadow-[0_16px_40px_-20px_rgba(15,36,31,0.2)]",
      )}
    >
      <div
        className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3"
        style={{ borderTopColor: theme.siteAccent, borderTopWidth: 3 }}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {industry.assistantName}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {industry.businessName}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {t("online")}
        </span>
      </div>

      <div
        ref={scroller}
        className={cn(
          "flex flex-col gap-2.5 overflow-y-auto bg-[#faf8f5] px-3 py-3",
          variant === "stage"
            ? "h-[300px] sm:h-[360px]"
            : variant === "showcase" || variant === "widget"
              ? "h-[320px] sm:h-[380px]"
              : variant === "embed"
                ? "h-[260px] sm:h-[280px]"
                : "h-[min(420px,55vh)]",
        )}
      >
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={cn(
              "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
              m.role === "user"
                ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                : "rounded-bl-md border border-border/50 bg-white text-foreground shadow-sm",
            )}
          >
            {m.role === "assistant" ? (
              <FormattedChatMessage content={m.content} />
            ) : (
              m.content
            )}
          </div>
        ))}
        {pending ? (
          <div className="max-w-[70%] rounded-2xl rounded-bl-md border border-border/60 bg-white px-3.5 py-2.5 text-sm text-muted-foreground">
            {t("typing")}
          </div>
        ) : null}
      </div>

      {!showLead && !leadDone ? (
        <div className="flex flex-wrap gap-1.5 border-t border-border/70 bg-white px-3 py-2.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => send(s)}
              className="cursor-pointer rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-ink-soft transition-colors hover:border-primary/25 hover:bg-accent sm:text-xs"
            >
              {s}
            </button>
          ))}
        </div>
      ) : null}

      {showLead ? (
        <form
          className="space-y-3 border-t border-border/80 bg-[#f7f6f3] px-3 py-3"
          action={(fd) => submitLead(fd)}
        >
          <p className="text-sm font-medium text-foreground">{t("leadTitle")}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="demo-name" className="text-xs">
                {t("name")}
              </Label>
              <Input id="demo-name" name="name" required minLength={2} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="demo-phone" className="text-xs">
                {t("phone")}
              </Label>
              <Input id="demo-phone" name="phone" required />
            </div>
          </div>
          <Input id="demo-email" name="email" type="email" placeholder={t("email")} />
          <Button type="submit" disabled={leadPending} size="sm">
            {leadPending ? t("sending") : t("submitLead")}
          </Button>
        </form>
      ) : (
        <form
          className="flex gap-2 border-t border-border/80 bg-white px-3 py-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("placeholder")}
            disabled={pending}
            className="h-9 text-sm"
          />
          <Button type="submit" disabled={pending || !input.trim()} size="sm" className="h-9 shrink-0">
            {t("send")}
          </Button>
        </form>
      )}

      {error ? (
        <p className="border-t border-border/80 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );

  if (variant === "embed" || variant === "stage" || variant === "showcase" || variant === "widget") {
    return (
      <div className={cn("space-y-4", className)}>
        {showPicker ? industryPicker : null}
        {chatPanel}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start",
        className,
      )}
    >
      <div className="space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {t("eyebrow")}
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h2>
        <p className="max-w-md text-base leading-relaxed text-ink-soft">
          {t("subtitle")}
        </p>
        {showPicker ? industryPicker : null}
      </div>
      {chatPanel}
    </div>
  );
}

export { INDUSTRY_ORDER, INDUSTRY_THEME };
export type { DemoIndustryId };
export { DEMO_INDUSTRIES };
