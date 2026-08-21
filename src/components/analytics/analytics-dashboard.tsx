import Link from "next/link";
import {
  Bot,
  HelpCircle,
  MessageSquareWarning,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";

import {
  ConversionBarChart,
  OutcomesPieChart,
  TimeSeriesChart,
} from "@/components/analytics/charts";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AnalyticsSnapshot } from "@/services/analytics/analytics-service";
import type { BusinessInsight } from "@/services/analytics/insights";
import { cn } from "@/lib/utils";

export function AnalyticsDashboard(props: {
  snapshot: AnalyticsSnapshot;
  insight: BusinessInsight | null;
  locale: "lv" | "en";
  labels: {
    title: string;
    subtitle: string;
    insight: string;
    insightEmpty: string;
    range7: string;
    range30: string;
    range90: string;
    conversations: string;
    leads: string;
    qualified: string;
    won: string;
    handoffs: string;
    aiResolution: string;
    leadConversion: string;
    conversationsOverTime: string;
    leadsOverTime: string;
    leadConversionChart: string;
    outcomes: string;
    topQuestions: string;
    topQuestionsEmpty: string;
    unanswered: string;
    unansweredLink: string;
    noData: string;
    topics: Record<string, string>;
  };
}) {
  const { snapshot: s, labels, insight } = props;
  const pct = (value: number | null) =>
    value == null ? "—" : `${Math.round(value * 100)}%`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {labels.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{labels.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((range) => (
            <Link
              key={range}
              href={`/dashboard/analytics?range=${range}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                s.range === range
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {range === 7
                ? labels.range7
                : range === 30
                  ? labels.range30
                  : labels.range90}
            </Link>
          ))}
        </div>
      </div>

      <BusinessInsightCard
        title={labels.insight}
        empty={labels.insightEmpty}
        insight={insight}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Metric label={labels.conversations} value={String(s.conversations)} />
        <Metric label={labels.leads} value={String(s.leads)} />
        <Metric label={labels.qualified} value={String(s.qualifiedLeads)} />
        <Metric label={labels.won} value={String(s.wonLeads)} />
        <Metric label={labels.handoffs} value={String(s.humanHandoffs)} />
        <Metric label={labels.aiResolution} value={pct(s.aiResolutionRate)} />
        <Metric
          label={labels.leadConversion}
          value={pct(s.leadConversionRate)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {labels.conversationsOverTime}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {s.conversations === 0 ? (
              <Empty text={labels.noData} />
            ) : (
              <TimeSeriesChart data={s.conversationsOverTime} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{labels.leadsOverTime}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.leads === 0 ? (
              <Empty text={labels.noData} />
            ) : (
              <TimeSeriesChart data={s.leadsOverTime} color="#C4A35A" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {labels.leadConversionChart}
            </CardTitle>
            <CardDescription>
              {labels.leads} / {labels.conversations}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {s.leadStatusBreakdown.length === 0 ? (
              <Empty text={labels.noData} />
            ) : (
              <ConversionBarChart data={s.leadStatusBreakdown} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{labels.outcomes}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.outcomes.every((o) => o.count === 0) ? (
              <Empty text={labels.noData} />
            ) : (
              <OutcomesPieChart data={s.outcomes} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{labels.topQuestions}</CardTitle>
          </CardHeader>
          <CardContent>
            {s.topQuestions.filter((t) => t.topic !== "other").length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {labels.topQuestionsEmpty}
              </p>
            ) : (
              <ol className="space-y-2">
                {s.topQuestions
                  .filter((t) => t.topic !== "other")
                  .map((item, index) => (
                    <li
                      key={item.topic}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        <span className="mr-2 text-muted-foreground">
                          {index + 1}.
                        </span>
                        {labels.topics[item.topic] ?? item.topic}
                      </span>
                      <Badge variant="secondary">{item.count}</Badge>
                    </li>
                  ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{labels.unanswered}</CardTitle>
            <CardDescription>
              {s.unansweredCount} · fallback {s.fallbackCount}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ButtonLink
              href={`/dashboard/analytics/unanswered?range=${s.range}`}
              label={labels.unansweredLink}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BusinessInsightCard({
  title,
  empty,
  insight,
}: {
  title: string;
  empty: string;
  insight: BusinessInsight | null;
}) {
  if (!insight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{empty}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-card">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
          <Badge variant="secondary" className="font-normal">
            {insight.period}
          </Badge>
        </div>
        <CardDescription className="mt-2 text-sm leading-relaxed text-foreground/85">
          {insight.summary}
        </CardDescription>
      </CardHeader>
      {insight.highlights.length > 0 ? (
        <CardContent className="pt-0">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {insight.highlights.map((item) => (
              <li
                key={`${item.label}-${item.value}`}
                className="flex gap-3 rounded-lg border border-border/70 bg-background/80 px-3 py-2.5"
              >
                <InsightIcon label={item.label} />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">
                    {item.value}
                  </p>
                  {item.hint ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.hint}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}

function InsightIcon({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const Icon =
    lower.includes("jautāj") || lower.includes("question")
      ? HelpCircle
      : lower.includes("lead")
        ? Target
        : lower.includes("kvalific") ||
            lower.includes("qualified") ||
            lower.includes("won") ||
            lower.includes("uzvar")
          ? TrendingUp
          : lower.includes("nodoš") || lower.includes("handoff")
            ? UserRound
            : lower.includes("neatbild") || lower.includes("unanswer")
              ? MessageSquareWarning
              : Bot;

  return (
    <div
      className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground",
      )}
    >
      <Icon className="size-3.5" />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
    >
      {label}
    </Link>
  );
}
