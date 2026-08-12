import { rm } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

/** Soft-delete workspace and scrub customer + knowledge data. */
export async function softDeleteWorkspace(params: {
  workspaceId: string;
  userId: string;
}) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: params.workspaceId, deletedAt: null },
  });
  if (!workspace) throw new Error("not_found");

  await writeAuditLog({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DELETE",
    entityType: "Workspace",
    entityId: params.workspaceId,
    metadata: { event: "workspace_soft_delete" },
  });

  await prisma.$transaction([
    prisma.conversationMessage.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.conversation.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.leadField.deleteMany({
      where: { lead: { workspaceId: params.workspaceId } },
    }),
    prisma.lead.deleteMany({ where: { workspaceId: params.workspaceId } }),
    prisma.appointment.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.integration.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.knowledgeChunk.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.knowledgeDocument.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.fAQ.deleteMany({ where: { workspaceId: params.workspaceId } }),
    prisma.service.deleteMany({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.workspace.update({
      where: { id: params.workspaceId },
      data: {
        deletedAt: new Date(),
        name: `deleted-${workspace.slug}-${Date.now()}`,
      },
    }),
  ]);

  const uploadDir = path.join(
    process.cwd(),
    "storage",
    "uploads",
    params.workspaceId,
  );
  await rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
}

export async function deleteConversationForWorkspace(params: {
  workspaceId: string;
  conversationId: string;
  userId: string;
}) {
  const conversation = await prisma.conversation.findFirst({
    where: { id: params.conversationId, workspaceId: params.workspaceId },
  });
  if (!conversation) throw new Error("not_found");

  await prisma.conversationMessage.deleteMany({
    where: { conversationId: conversation.id, workspaceId: params.workspaceId },
  });
  await prisma.conversation.delete({ where: { id: conversation.id } });
  await writeAuditLog({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DELETE",
    entityType: "Conversation",
    entityId: conversation.id,
  });
}

export async function deleteLeadForWorkspace(params: {
  workspaceId: string;
  leadId: string;
  userId: string;
}) {
  const lead = await prisma.lead.findFirst({
    where: { id: params.leadId, workspaceId: params.workspaceId },
  });
  if (!lead) throw new Error("not_found");
  await prisma.lead.delete({ where: { id: lead.id } });
  await writeAuditLog({
    workspaceId: params.workspaceId,
    userId: params.userId,
    action: "DELETE",
    entityType: "Lead",
    entityId: lead.id,
  });
}

/**
 * Export architecture: structured JSON of workspace customer data.
 * Tokens and secrets are never included.
 */
export async function exportWorkspaceData(workspaceId: string) {
  const [workspace, conversations, leads, appointments, faqs, documents] =
    await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          id: true,
          name: true,
          slug: true,
          industry: true,
          primaryLocale: true,
          dataRetentionDays: true,
          createdAt: true,
        },
      }),
      prisma.conversation.findMany({
        where: { workspaceId },
        select: {
          id: true,
          status: true,
          visitorLocale: true,
          startedAt: true,
          lastMessageAt: true,
          messages: {
            select: {
              role: true,
              content: true,
              createdAt: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
        take: 5000,
      }),
      prisma.lead.findMany({
        where: { workspaceId },
        select: {
          id: true,
          status: true,
          name: true,
          email: true,
          phone: true,
          service: true,
          summary: true,
          source: true,
          createdAt: true,
        },
        take: 5000,
      }),
      prisma.appointment.findMany({
        where: { workspaceId },
        select: {
          id: true,
          status: true,
          service: true,
          startTime: true,
          endTime: true,
          customerName: true,
          customerEmail: true,
          customerPhone: true,
          createdAt: true,
        },
        take: 5000,
      }),
      prisma.fAQ.findMany({
        where: { workspaceId },
        select: {
          questionLv: true,
          answerLv: true,
          category: true,
          isActive: true,
        },
      }),
      prisma.knowledgeDocument.findMany({
        where: { workspaceId },
        select: {
          id: true,
          type: true,
          title: true,
          sourceUrl: true,
          createdAt: true,
        },
        take: 5000,
      }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    workspace,
    conversations,
    leads,
    appointments,
    faqs,
    documents,
  };
}

/** Purge conversations older than retention window. */
export async function applyConversationRetention(workspaceId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { dataRetentionDays: true },
  });
  if (!workspace || workspace.dataRetentionDays <= 0) {
    return { deleted: 0 };
  }
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - workspace.dataRetentionDays);

  const old = await prisma.conversation.findMany({
    where: {
      workspaceId,
      lastMessageAt: { lt: cutoff },
    },
    select: { id: true },
    take: 500,
  });
  if (!old.length) return { deleted: 0 };

  const ids = old.map((c) => c.id);
  await prisma.conversationMessage.deleteMany({
    where: { conversationId: { in: ids }, workspaceId },
  });
  await prisma.conversation.deleteMany({
    where: { id: { in: ids }, workspaceId },
  });
  return { deleted: ids.length };
}

/** Nightly retention across all active workspaces. */
export async function applyRetentionForAllWorkspaces() {
  const workspaces = await prisma.workspace.findMany({
    where: { deletedAt: null, dataRetentionDays: { gt: 0 } },
    select: { id: true },
    take: 2000,
  });
  let total = 0;
  for (const ws of workspaces) {
    const result = await applyConversationRetention(ws.id);
    total += result.deleted;
  }
  return { workspaces: workspaces.length, deleted: total };
}
