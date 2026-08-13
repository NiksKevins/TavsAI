import type { ComponentType } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  Circle,
  Code2,
  Globe,
  MessageSquare,
  Plug,
  Users,
} from "lucide-react";

import { TimeSeriesChart } from "@/components/analytics/charts";
import { WhatsNewBanner } from "@/components/dashboard/whats-new";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLANS, type PlanId } from "@/config/plans";
import { cn } from "@/lib/utils";
import type { DashboardOverview } from "@/services/dashboard/overview-service";

type Labels = {
  title: string;
  subtitle: string;
  last30Days: string;
  viewAll: string;
  viewAnalytics: string;
  noData: string;
  metrics: {
    conversations: string;
    leads: string;
    leadConversion: string;
    unanswered: string;
    usage: string;
    knowledgeChunks: string;
    appointments: string;
  };
  usageCard: {
    title: string;
    remaining: string;
    period: string;
    upgrade: string;
  };
  setup: {
    title: string;
    subtitle: string;
    website: string;
    crawl: string;
    content: string;
    assistant: string;
    widget: string;
    calendar: string;
  };
  system: {
    title: string;
    widget: string;
    widgetLive: string;
    widgetPending: string;
    widgetInactive: string;
    assistant: string;
    knowledge: string;
    knowledgeReady: string;
    knowledgeEmpty: string;
    calendar: string;
    calendarConnected: string;
    calendarDisconnected: string;
  };
  charts: {
    conversations: string;
    leads: string;
  };
  recentConversations: {
    title: string;
    empty: string;
    visitor: string;
    columns: {
      preview: string;
      status: string;
      lead: string;
      date: string;
    };
  };
  recentLeads: {
    title: string;
    empty: string;
    columns: {
      contact: string;
      service: string;
      status: string;
      date: string;
    };
  };
  knowledgeSummary: {
    title: string;
    website: string;
    pages: string;
    faqs: string;
    services: string;
    documents: string;
    chunks: string;
    crawlStatus: string;
    noWebsite: string;
  };
  leadStatuses: Record<string, string>;
  conversationStatuses: Record<string, string>;
};

const SETUP_ICONS = {
  website: Globe,
  crawl: Globe,
  content: BookOpen,
  assistant: Bot,
  widget: Code2,
  calendar: Plug,
} as const;

function formatDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "lv-LV", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatShortDate(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "lv-LV", {
    day: "numeric",
    month: "short",
  }).format(value);
}

function pct(value: number | null) {
  return value == null ? "—" : `${Math.round(value * 100)}%`;
}

function MetricCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  href?: string;
}) {
  const content = (
    <Card className={cn(href && "transition-colors hover:border-primary/30")}>
      <CardContent className="space-y-1 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-2xl font-semibold tracking-tight">{value}</div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}

export function DashboardOverviewView({
  data,
  workspaceName,
  membershipRole,
  workspaceSlug,
  locale,
  labels,
}: {
  data: DashboardOverview;
  workspaceName: string;
  membershipRole: string;
  workspaceSlug: string;
  locale: string;
  labels: Labels;
}) {
  const plan = PLANS[data.usage.plan as PlanId] ?? PLANS.FREE;
  const usagePct =
    data.usage.limit > 0
      ? Math.min(100, Math.round((data.usage.used / data.usage.limit) * 100))
      : 0;
  const setupLabels: Record<string, string> = {
    website: labels.setup.website,
    crawl: labels.setup.crawl,
    content: labels.setup.content,
    assistant: labels.setup.assistant,
    widget: labels.setup.widget,
    calendar: labels.setup.calendar,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {labels.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{labels.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/analytics">
              {labels.viewAnalytics}
              <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/dashboard/widget">{labels.setup.widget}</Link>
          </Button>
        </div>
      </div>

      <WhatsNewBanner />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <MetricCard
          label={labels.metrics.conversations}
          value={String(data.analytics.conversations)}
          hint={labels.last30Days}
          href="/dashboard/conversations"
        />
        <MetricCard
          label={labels.metrics.leads}
          value={String(data.analytics.leads)}
          hint={labels.last30Days}
          href="/dashboard/leads"
        />
        <MetricCard
          label={labels.metrics.leadConversion}
          value={pct(data.analytics.leadConversionRate)}
          hint={labels.last30Days}
          href="/dashboard/analytics"
        />
        <MetricCard
          label={labels.metrics.unanswered}
          value={String(data.analytics.unansweredCount)}
          hint={labels.last30Days}
          href="/dashboard/analytics/unanswered"
        />
        <MetricCard
          label={labels.metrics.usage}
          value={`${data.usage.used}/${data.usage.limit}`}
          hint={plan.name}
          href="/dashboard/billing"
        />
        <MetricCard
          label={labels.metrics.knowledgeChunks}
          value={String(data.knowledge.chunkCount)}
          href="/dashboard/knowledge"
        />
        <MetricCard
          label={labels.metrics.appointments}
          value={String(data.counts.appointmentsUpcoming)}
          href="/dashboard/appointments"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{labels.charts.conversations}</CardTitle>
                <CardDescription>{labels.last30Days}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/conversations">{labels.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.analytics.conversations === 0 ? (
                <EmptyChart text={labels.noData} />
              ) : (
                <TimeSeriesChart data={data.analytics.conversationsOverTime} color="#3b82f6" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
              <div>
                <CardTitle className="text-base">{labels.charts.leads}</CardTitle>
                <CardDescription>{labels.last30Days}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/leads">{labels.viewAll}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {data.analytics.leads === 0 ? (
                <EmptyChart text={labels.noData} />
              ) : (
                <TimeSeriesChart data={data.analytics.leadsOverTime} color="#2563eb" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.usageCard.title}</CardTitle>
              <CardDescription>
                {workspaceName} · <span className="font-mono text-xs">{workspaceSlug}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {labels.usageCard.remaining}
                  </p>
                </div>
                <Badge variant="secondary">{membershipRole}</Badge>
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                  <span>
                    {data.usage.used}/{data.usage.limit}
                  </span>
                  <span>{usagePct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      usagePct >= 90 ? "bg-amber-500" : "bg-primary",
                    )}
                    style={{ width: `${usagePct}%` }}
                  />
                </div>
              </div>
              {data.usage.currentPeriodEnd ? (
                <p className="text-xs text-muted-foreground">
                  {labels.usageCard.period}:{" "}
                  {formatShortDate(data.usage.currentPeriodEnd, locale)}
                </p>
              ) : null}
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/dashboard/billing">{labels.usageCard.upgrade}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.setup.title}</CardTitle>
              <CardDescription>{labels.setup.subtitle}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.setupSteps.map((step) => {
                const Icon = SETUP_ICONS[step.key as keyof typeof SETUP_ICONS] ?? Circle;
                return (
                  <Link
                    key={step.key}
                    href={step.href}
                    className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-sm transition-colors hover:border-primary/25 hover:bg-secondary/40"
                  >
                    {step.done ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <Icon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">{setupLabels[step.key]}</span>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{labels.system.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <StatusRow
                icon={Code2}
                label={labels.system.widget}
                value={
                  !data.widget
                    ? labels.system.widgetPending
                    : !data.widget.isActive
                      ? labels.system.widgetInactive
                      : data.widget.lastLoadedAt
                        ? labels.system.widgetLive
                        : labels.system.widgetPending
                }
                ok={Boolean(data.widget?.lastLoadedAt && data.widget.isActive)}
              />
              <StatusRow
                icon={Bot}
                label={labels.system.assistant}
                value={data.assistant?.name ?? "—"}
                ok={Boolean(data.assistant)}
              />
              <StatusRow
                icon={BookOpen}
                label={labels.system.knowledge}
                value={
                  data.knowledge.chunkCount > 0
                    ? labels.system.knowledgeReady
                    : labels.system.knowledgeEmpty
                }
                ok={data.knowledge.chunkCount > 0}
              />
              <StatusRow
                icon={Calendar}
                label={labels.system.calendar}
                value={
                  data.googleConnected
                    ? labels.system.calendarConnected
                    : labels.system.calendarDisconnected
                }
                ok={data.googleConnected}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{labels.knowledgeSummary.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryItem
              label={labels.knowledgeSummary.website}
              value={data.knowledge.website?.url ?? labels.knowledgeSummary.noWebsite}
            />
            <SummaryItem
              label={labels.knowledgeSummary.pages}
              value={String(data.knowledge.documentCount)}
            />
            <SummaryItem
              label={labels.knowledgeSummary.faqs}
              value={String(data.counts.faqs)}
            />
            <SummaryItem
              label={labels.knowledgeSummary.services}
              value={String(data.counts.services)}
            />
            <SummaryItem
              label={labels.knowledgeSummary.documents}
              value={String(data.counts.uploadedDocs)}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {labels.knowledgeSummary.chunks}: {data.knowledge.chunkCount}
            {data.knowledge.website?.status
              ? ` · ${labels.knowledgeSummary.crawlStatus}: ${data.knowledge.website.status}`
              : ""}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              <CardTitle className="text-base">{labels.recentConversations.title}</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/conversations">{labels.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentConversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">{labels.recentConversations.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentConversations.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/conversations/${item.id}`}
                      className="flex flex-col gap-1 py-3 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {item.leadName ?? labels.recentConversations.visitor}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          {item.preview ?? "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {labels.conversationStatuses[item.status] ?? item.status}
                        </Badge>
                        <span>{formatDate(item.lastMessageAt, locale)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <CardTitle className="text-base">{labels.recentLeads.title}</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/leads">{labels.viewAll}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">{labels.recentLeads.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="flex flex-col gap-1 py-3 transition-colors hover:text-primary sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium">{lead.name ?? "—"}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {[lead.phone, lead.email].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-xs">
                        {lead.service ? (
                          <span className="text-muted-foreground">{lead.service}</span>
                        ) : null}
                        <Badge variant="secondary">
                          {labels.leadStatuses[lead.status] ?? lead.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {formatShortDate(lead.createdAt, locale)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
  ok,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <Badge variant={ok ? "success" : "secondary"}>{value}</Badge>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-secondary/20 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-medium">{value}</p>
    </div>
  );
}
