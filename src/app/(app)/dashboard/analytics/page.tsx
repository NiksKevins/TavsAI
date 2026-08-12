import { getLocale, getTranslations } from "next-intl/server";

import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { requireWorkspace } from "@/lib/authz";
import {
  getAnalyticsSnapshot,
  resolveAnalyticsRange,
} from "@/services/analytics/analytics-service";
import { buildBusinessInsight } from "@/services/analytics/insights";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const t = await getTranslations("analytics");
  const locale = (await getLocale()) === "en" ? "en" : "lv";
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const range = resolveAnalyticsRange(params.range);
  const snapshot = await getAnalyticsSnapshot(workspace.id, range);
  const insight = buildBusinessInsight(snapshot, locale);

  return (
    <AnalyticsDashboard
      snapshot={snapshot}
      insight={insight}
      locale={locale}
      labels={{
        title: t("title"),
        subtitle: t("subtitle"),
        insight: t("insight"),
        insightEmpty: t("insightEmpty"),
        range7: t("ranges.d7"),
        range30: t("ranges.d30"),
        range90: t("ranges.d90"),
        conversations: t("metrics.conversations"),
        leads: t("metrics.leads"),
        qualified: t("metrics.qualified"),
        won: t("metrics.won"),
        handoffs: t("metrics.handoffs"),
        aiResolution: t("metrics.aiResolution"),
        leadConversion: t("metrics.leadConversion"),
        conversationsOverTime: t("charts.conversations"),
        leadsOverTime: t("charts.leads"),
        leadConversionChart: t("charts.conversion"),
        outcomes: t("charts.outcomes"),
        topQuestions: t("topQuestions.title"),
        topQuestionsEmpty: t("topQuestions.empty"),
        unanswered: t("unanswered.card"),
        unansweredLink: t("unanswered.open"),
        noData: t("noData"),
        topics: {
          price: t("topics.price"),
          hours: t("topics.hours"),
          booking: t("topics.booking"),
          location: t("topics.location"),
          services: t("topics.services"),
          other: t("topics.other"),
        },
      }}
    />
  );
}
