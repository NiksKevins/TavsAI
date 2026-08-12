import type { LeadStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getKnowledgeOverview } from "@/lib/knowledge/queries";
import { getAnalyticsSnapshot } from "@/services/analytics/analytics-service";
import { getUsageSnapshot } from "@/services/billing/usage-service";

export type SetupStep = {
  key: string;
  done: boolean;
  href: string;
};

export type DashboardOverview = {
  analytics: Awaited<ReturnType<typeof getAnalyticsSnapshot>>;
  usage: Awaited<ReturnType<typeof getUsageSnapshot>>;
  knowledge: Awaited<ReturnType<typeof getKnowledgeOverview>>;
  counts: {
    faqs: number;
    services: number;
    uploadedDocs: number;
    appointmentsUpcoming: number;
  };
  widget: {
    isActive: boolean;
    lastLoadedAt: Date | null;
    publicKey: string | null;
  } | null;
  assistant: {
    name: string;
    collectLeads: boolean;
    handoffEnabled: boolean;
  } | null;
  googleConnected: boolean;
  recentConversations: {
    id: string;
    status: string;
    lastMessageAt: Date;
    preview: string | null;
    leadName: string | null;
    leadStatus: LeadStatus | null;
  }[];
  recentLeads: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
    status: LeadStatus;
    service: string | null;
    createdAt: Date;
  }[];
  setupSteps: SetupStep[];
};

export async function getDashboardOverview(
  workspaceId: string,
): Promise<DashboardOverview> {
  const [
    analytics,
    usage,
    knowledge,
    faqs,
    services,
    uploadedDocs,
    appointmentsUpcoming,
    widget,
    assistant,
    googleIntegration,
    recentConversations,
    recentLeads,
  ] = await Promise.all([
    getAnalyticsSnapshot(workspaceId, 30),
    getUsageSnapshot(workspaceId),
    getKnowledgeOverview(workspaceId),
    prisma.fAQ.count({ where: { workspaceId } }),
    prisma.service.count({ where: { workspaceId } }),
    prisma.knowledgeDocument.count({
      where: { workspaceId, type: { not: "WEBSITE_PAGE" } },
    }),
    prisma.appointment.count({
      where: {
        workspaceId,
        startTime: { gte: new Date() },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    }),
    prisma.widgetConfiguration.findUnique({
      where: { workspaceId },
      select: {
        isActive: true,
        lastLoadedAt: true,
        publicKey: true,
      },
    }),
    prisma.assistantConfiguration.findUnique({
      where: { workspaceId },
      select: {
        name: true,
        collectLeads: true,
        handoffEnabled: true,
      },
    }),
    prisma.integration.findFirst({
      where: {
        workspaceId,
        type: "CALENDAR",
        provider: "google",
        isActive: true,
        accessTokenEnc: { not: null },
      },
      select: { id: true },
    }),
    prisma.conversation.findMany({
      where: { workspaceId },
      orderBy: { lastMessageAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        lead: { select: { name: true, status: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { content: true },
        },
      },
    }),
    prisma.lead.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        status: true,
        service: true,
        createdAt: true,
      },
    }),
  ]);

  const websiteCrawled =
    knowledge.website?.status === "READY" && knowledge.documentCount > 0;
  const widgetLive = Boolean(widget?.lastLoadedAt);

  const setupSteps: SetupStep[] = [
    {
      key: "website",
      done: Boolean(knowledge.website?.url),
      href: "/dashboard/knowledge/website",
    },
    {
      key: "crawl",
      done: websiteCrawled,
      href: "/dashboard/knowledge/website",
    },
    {
      key: "content",
      done: faqs > 0 || services > 0 || uploadedDocs > 0,
      href: "/dashboard/knowledge/faqs",
    },
    {
      key: "assistant",
      done: Boolean(assistant),
      href: "/dashboard/assistant",
    },
    {
      key: "widget",
      done: widgetLive,
      href: "/dashboard/widget",
    },
    {
      key: "calendar",
      done: Boolean(googleIntegration),
      href: "/dashboard/integrations",
    },
  ];

  return {
    analytics,
    usage,
    knowledge,
    counts: {
      faqs,
      services,
      uploadedDocs,
      appointmentsUpcoming,
    },
    widget: widget
      ? {
          isActive: widget.isActive,
          lastLoadedAt: widget.lastLoadedAt,
          publicKey: widget.publicKey,
        }
      : null,
    assistant,
    googleConnected: Boolean(googleIntegration),
    recentConversations: recentConversations.map((c) => ({
      id: c.id,
      status: c.status,
      lastMessageAt: c.lastMessageAt,
      preview: c.messages[0]?.content ?? null,
      leadName: c.lead?.name ?? null,
      leadStatus: c.lead?.status ?? null,
    })),
    recentLeads,
    setupSteps,
  };
}
