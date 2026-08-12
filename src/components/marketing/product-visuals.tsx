import { BookOpen, Globe, LayoutDashboard, MessageCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ProductVisualsDict = {
  siteUrl: string;
  siteHeadline: string;
  siteNav: string[];
  chatAssistant: string;
  chatBusiness: string;
  chatUserMsg: string;
  chatBotMsg: string;
  badge247: string;
  badgeLead: string;
  showcaseTitle: string;
  showcaseSubtitle: string;
  cardWidgetTitle: string;
  cardWidgetBody: string;
  cardKnowledgeTitle: string;
  cardKnowledgeBody: string;
  cardLeadsTitle: string;
  cardLeadsBody: string;
  leadName: string;
  leadPhone: string;
  leadStatus: string;
  knowledgeWebsite: string;
  knowledgeFaq: string;
  knowledgeDocs: string;
};

function BrowserDots() {
  return (
    <div className="flex gap-1.5" aria-hidden>
      <span className="size-2 rounded-full bg-[#ff5f57]" />
      <span className="size-2 rounded-full bg-[#febc2e]" />
      <span className="size-2 rounded-full bg-[#28c840]" />
    </div>
  );
}

/** Hero — website with chat widget open; the core “what we sell” visual. */
export function HeroProductVisual({
  dict,
  className,
}: {
  dict: ProductVisualsDict;
  className?: string;
}) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[480px]", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/10 via-transparent to-accent-cyan/10 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-white shadow-[0_24px_60px_-20px_rgba(15,23,42,0.22)]">
        <div className="flex items-center gap-3 border-b border-border/70 bg-[#f8fafc] px-3 py-2.5">
          <BrowserDots />
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border/60 bg-white px-2.5 py-1">
            <Globe className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-[11px] text-muted-foreground">{dict.siteUrl}</span>
          </div>
        </div>

        <div className="relative bg-gradient-to-br from-[#e8f0fe] via-[#f8fafc] to-white px-5 pb-16 pt-5 sm:px-6 sm:pb-20">
          <div className="flex items-center justify-between gap-2">
            <div className="h-2 w-16 rounded-full bg-slate-300/80" />
            <div className="flex gap-2">
              {dict.siteNav.map((item) => (
                <span
                  key={item}
                  className="hidden rounded-full bg-white/80 px-2 py-0.5 text-[9px] font-medium text-slate-500 sm:inline"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <p className="mt-5 max-w-[14rem] font-display text-base font-semibold leading-tight tracking-tight text-slate-800 sm:text-lg">
            {dict.siteHeadline}
          </p>
          <div className="mt-3 h-2 w-full max-w-[200px] rounded-full bg-slate-200/80" />
          <div className="mt-1.5 h-2 w-4/5 max-w-[160px] rounded-full bg-slate-200/60" />
          <div className="mt-4 inline-flex rounded-md bg-slate-800 px-3 py-1.5 text-[10px] font-medium text-white">
            Book now
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="aspect-[4/3] rounded-lg border border-white/80 bg-white/60 shadow-sm"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-2 right-0 w-[78%] max-w-[280px] sm:-bottom-4 sm:right-2">
        <MiniChatWidget dict={dict} size="hero" />
      </div>

      <div className="absolute -left-1 top-[38%] rounded-full border border-border/70 bg-white px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-md sm:left-0 sm:px-3 sm:text-[11px]">
        <span className="text-primary">●</span> {dict.badge247}
      </div>

      <div className="absolute -right-1 top-6 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-800 shadow-md sm:right-0 sm:px-3 sm:text-[11px]">
        ✓ {dict.badgeLead}
      </div>
    </div>
  );
}

function MiniChatWidget({
  dict,
  size = "card",
}: {
  dict: ProductVisualsDict;
  size?: "hero" | "card";
}) {
  const compact = size === "card";

  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.2)]",
        compact ? "text-[9px]" : "text-[10px] sm:text-[11px]",
      )}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-border/70 px-3 py-2"
        style={{ borderTop: "3px solid #3b82f6" }}
      >
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{dict.chatAssistant}</p>
          <p className="truncate text-muted-foreground">{dict.chatBusiness}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-wide text-emerald-700">
          <span className="size-1 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>

      <div className={cn("space-y-2 bg-[#faf8f5] px-2.5", compact ? "py-2" : "py-3")}>
        <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-primary px-2.5 py-1.5 text-primary-foreground">
          {dict.chatUserMsg}
        </div>
        <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-border/50 bg-white px-2.5 py-1.5 text-foreground shadow-sm">
          {dict.chatBotMsg}
        </div>
      </div>

      <div className="border-t border-border/70 bg-white px-2.5 py-2">
        <div className="h-6 rounded-full border border-border/60 bg-secondary/50" />
      </div>
    </div>
  );
}

function WidgetCardVisual({ dict }: { dict: ProductVisualsDict }) {
  return (
    <div className="relative mx-auto mt-4 h-[140px] w-full max-w-[220px]">
      <div className="absolute inset-x-4 top-0 h-[100px] overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-slate-100 to-white shadow-sm">
        <div className="border-b border-border/50 bg-slate-50 px-2 py-1">
          <div className="h-1.5 w-12 rounded-full bg-slate-200" />
        </div>
        <div className="p-2">
          <div className="h-1.5 w-16 rounded-full bg-slate-200" />
          <div className="mt-1 h-1 w-20 rounded-full bg-slate-100" />
        </div>
      </div>
      <div className="absolute bottom-0 right-2 w-[62%]">
        <MiniChatWidget dict={dict} size="card" />
      </div>
      <div className="absolute bottom-1 left-6 flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-lg">
        <MessageCircle className="size-4" aria-hidden />
      </div>
    </div>
  );
}

function KnowledgeCardVisual({ dict }: { dict: ProductVisualsDict }) {
  const items = [
    { icon: Globe, label: dict.knowledgeWebsite, done: true },
    { icon: BookOpen, label: dict.knowledgeFaq, done: true },
    { icon: BookOpen, label: dict.knowledgeDocs, done: false },
  ];

  return (
    <div className="mx-auto mt-4 w-full max-w-[220px] space-y-2 rounded-xl border border-border/70 bg-white p-3 shadow-sm">
      {items.map(({ icon: Icon, label, done }) => (
        <div
          key={label}
          className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-2"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" aria-hidden />
          </div>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-foreground">
            {label}
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold",
              done ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {done ? "✓" : "…"}
          </span>
        </div>
      ))}
    </div>
  );
}

function LeadsCardVisual({ dict }: { dict: ProductVisualsDict }) {
  return (
    <div className="mx-auto mt-4 w-full max-w-[220px] overflow-hidden rounded-xl border border-border/70 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-border/60 bg-[#f8fafc] px-3 py-2">
        <LayoutDashboard className="size-3.5 text-primary" aria-hidden />
        <span className="text-[11px] font-semibold text-foreground">Leads</span>
      </div>
      <div className="divide-y divide-border/50 p-2">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/5 px-2 py-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-foreground">{dict.leadName}</p>
            <p className="truncate text-[10px] text-muted-foreground">{dict.leadPhone}</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
            {dict.leadStatus}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 px-2 py-2 opacity-60">
          <div className="min-w-0">
            <p className="h-2 w-16 rounded-full bg-slate-200" />
            <p className="mt-1.5 h-1.5 w-20 rounded-full bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Three-card strip — widget, knowledge, leads at a glance. */
export function ProductShowcaseRow({
  dict,
  className,
}: {
  dict: ProductVisualsDict;
  className?: string;
}) {
  const cards = [
    {
      title: dict.cardWidgetTitle,
      body: dict.cardWidgetBody,
      visual: <WidgetCardVisual dict={dict} />,
    },
    {
      title: dict.cardKnowledgeTitle,
      body: dict.cardKnowledgeBody,
      visual: <KnowledgeCardVisual dict={dict} />,
    },
    {
      title: dict.cardLeadsTitle,
      body: dict.cardLeadsBody,
      visual: <LeadsCardVisual dict={dict} />,
    },
  ];

  return (
    <section className={cn("border-b border-border/60 bg-background", className)}>
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {dict.showcaseTitle}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft sm:text-base">
            {dict.showcaseSubtitle}
          </p>
        </div>

        <ul className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {cards.map((card) => (
            <li
              key={card.title}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card"
            >
              <div className="flex min-h-[180px] items-end justify-center bg-gradient-to-b from-[#f1f5f9] to-background px-4 pb-0 pt-5">
                {card.visual}
              </div>
              <div className="border-t border-border/60 p-4 sm:p-5">
                <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{card.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
