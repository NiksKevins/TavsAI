import { getLocale, getTranslations } from "next-intl/server";

import { DashboardOverviewView } from "@/components/dashboard/dashboard-overview";
import { requireWorkspace } from "@/lib/authz";
import { getDashboardOverview } from "@/services/dashboard/overview-service";

export default async function DashboardOverviewPage() {
  const t = await getTranslations("dashboard.overview");
  const tLeads = await getTranslations("leads.status");
  const locale = await getLocale();
  const { workspace, membership } = await requireWorkspace();
  const data = await getDashboardOverview(workspace.id);
  const setupDone = data.setupSteps.filter((s) => s.done).length;

  return (
    <DashboardOverviewView
      data={data}
      workspaceName={workspace.name}
      workspaceSlug={workspace.slug}
      membershipRole={membership.role}
      locale={locale}
      labels={{
        title: t("title"),
        subtitle: t("subtitle", { workspace: workspace.name }),
        last30Days: t("last30Days"),
        viewAll: t("viewAll"),
        viewAnalytics: t("viewAnalytics"),
        noData: t("noData"),
        metrics: {
          conversations: t("metrics.conversations"),
          leads: t("metrics.leads"),
          leadConversion: t("metrics.leadConversion"),
          unanswered: t("metrics.unanswered"),
          usage: t("metrics.usage"),
          knowledgeChunks: t("metrics.knowledgeChunks"),
          appointments: t("metrics.appointments"),
        },
        usageCard: {
          title: t("usageCard.title"),
          remaining: t("usageCard.remaining", { count: data.usage.remaining }),
          period: t("usageCard.period"),
          upgrade: t("usageCard.upgrade"),
        },
        setup: {
          title: t("setup.title"),
          subtitle: t("setup.subtitle", {
            done: setupDone,
            total: data.setupSteps.length,
          }),
          website: t("setup.website"),
          crawl: t("setup.crawl"),
          content: t("setup.content"),
          assistant: t("setup.assistant"),
          widget: t("setup.widget"),
          calendar: t("setup.calendar"),
        },
        system: {
          title: t("system.title"),
          widget: t("system.widget"),
          widgetLive: t("system.widgetLive"),
          widgetPending: t("system.widgetPending"),
          widgetInactive: t("system.widgetInactive"),
          assistant: t("system.assistant"),
          knowledge: t("system.knowledge"),
          knowledgeReady: t("system.knowledgeReady"),
          knowledgeEmpty: t("system.knowledgeEmpty"),
          calendar: t("system.calendar"),
          calendarConnected: t("system.calendarConnected"),
          calendarDisconnected: t("system.calendarDisconnected"),
        },
        charts: {
          conversations: t("charts.conversations"),
          leads: t("charts.leads"),
        },
        recentConversations: {
          title: t("recentConversations.title"),
          empty: t("recentConversations.empty"),
          visitor: t("recentConversations.visitor"),
          columns: {
            preview: t("recentConversations.columns.preview"),
            status: t("recentConversations.columns.status"),
            lead: t("recentConversations.columns.lead"),
            date: t("recentConversations.columns.date"),
          },
        },
        recentLeads: {
          title: t("recentLeads.title"),
          empty: t("recentLeads.empty"),
          columns: {
            contact: t("recentLeads.columns.contact"),
            service: t("recentLeads.columns.service"),
            status: t("recentLeads.columns.status"),
            date: t("recentLeads.columns.date"),
          },
        },
        knowledgeSummary: {
          title: t("knowledgeSummary.title"),
          website: t("knowledgeSummary.website"),
          pages: t("knowledgeSummary.pages"),
          faqs: t("knowledgeSummary.faqs"),
          services: t("knowledgeSummary.services"),
          documents: t("knowledgeSummary.documents"),
          chunks: t("knowledgeSummary.chunks"),
          crawlStatus: t("knowledgeSummary.crawlStatus"),
          noWebsite: t("knowledgeSummary.noWebsite"),
        },
        leadStatuses: {
          NEW: tLeads("NEW"),
          CONTACTED: tLeads("CONTACTED"),
          QUALIFIED: tLeads("QUALIFIED"),
          WON: tLeads("WON"),
          LOST: tLeads("LOST"),
          SPAM: tLeads("SPAM"),
        },
        conversationStatuses: {
          OPEN: t("conversationStatuses.OPEN"),
          QUALIFIED: t("conversationStatuses.QUALIFIED"),
          HANDED_OFF: t("conversationStatuses.HANDED_OFF"),
          CLOSED: t("conversationStatuses.CLOSED"),
        },
      }}
    />
  );
}
