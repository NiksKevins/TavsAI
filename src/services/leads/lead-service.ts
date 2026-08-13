import type { Lead, LeadStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import {
  meetsLeadCriteria,
  parseMinCriteria,
  parseQualificationQuestions,
  type LeadExtraction,
} from "@/services/leads/lead-detection";

export type UpsertLeadInput = {
  workspaceId: string;
  conversationId?: string | null;
  source: string;
  status?: LeadStatus;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  service?: string | null;
  summary?: string | null;
  intent?: string | null;
  notes?: string | null;
  fields?: Record<string, string>;
  notify?: boolean;
};

export async function upsertLead(
  input: UpsertLeadInput,
): Promise<{ lead: Lead; created: boolean }> {
  const existing = input.conversationId
    ? await prisma.lead.findFirst({
        where: {
          workspaceId: input.workspaceId,
          conversationId: input.conversationId,
        },
      })
    : null;

  const data = {
    name: input.name ?? existing?.name ?? null,
    email: input.email ?? existing?.email ?? null,
    phone: input.phone ?? existing?.phone ?? null,
    service: input.service ?? existing?.service ?? null,
    summary: input.summary ?? existing?.summary ?? null,
    intent: input.intent ?? existing?.intent ?? null,
    notes: input.notes ?? existing?.notes ?? null,
    source: input.source || existing?.source || "chat",
    status: input.status ?? existing?.status ?? "NEW",
  };

  let lead: Lead;
  let created = false;

  if (existing) {
    lead = await prisma.lead.update({
      where: { id: existing.id },
      data,
    });
  } else {
    let conversationId = input.conversationId || null;
    if (conversationId) {
      const owned = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          workspaceId: input.workspaceId,
        },
        select: { id: true },
      });
      if (!owned) {
        conversationId = null;
      }
    }
    lead = await prisma.lead.create({
      data: {
        workspaceId: input.workspaceId,
        conversationId,
        ...data,
      },
    });
    created = true;
  }

  if (input.fields && Object.keys(input.fields).length > 0) {
    for (const [key, value] of Object.entries(input.fields)) {
      if (!value?.trim()) continue;
      await prisma.leadField.upsert({
        where: {
          leadId_key: { leadId: lead.id, key },
        },
        create: { leadId: lead.id, key, value: value.trim() },
        update: { value: value.trim() },
      });
    }
  }

  if (input.conversationId) {
    await prisma.conversation.updateMany({
      where: {
        id: input.conversationId,
        workspaceId: input.workspaceId,
        status: "OPEN",
      },
      data: { status: "QUALIFIED" },
    });
  }

  if (created) {
    await prisma.notification.create({
      data: {
        workspaceId: input.workspaceId,
        channel: "IN_APP",
        title: "Jauns leads",
        body:
          [lead.name, lead.phone, lead.service].filter(Boolean).join(" · ") ||
          lead.summary?.slice(0, 120) ||
          "Jauns potenciālais klients",
        payload: { leadId: lead.id, created } as Prisma.InputJsonValue,
      },
    });
  }

  if (created && input.notify !== false) {
    await notifyNewLead(lead);
  }

  await prisma.auditLog.create({
    data: {
      workspaceId: input.workspaceId,
      action: created ? "CREATE" : "UPDATE",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { source: lead.source },
    },
  });

  return { lead, created };
}

export async function notifyNewLead(lead: Lead) {
  const [assistant, business, workspace] = await Promise.all([
    prisma.assistantConfiguration.findUnique({
      where: { workspaceId: lead.workspaceId },
    }),
    prisma.businessInformation.findUnique({
      where: { workspaceId: lead.workspaceId },
    }),
    prisma.workspace.findUnique({ where: { id: lead.workspaceId } }),
  ]);

  const to =
    assistant?.leadNotificationEmail?.trim() ||
    business?.email?.trim() ||
    null;
  if (!to) return;

  const businessName =
    business?.displayName || workspace?.name || "TavsWebs Bot";
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://bot.tavswebs.com";
  const link = `${appUrl}/dashboard/leads/${lead.id}`;

  const subject = `Jauns potenciālais klients — ${businessName}`;
  const text = [
    `Klients: ${lead.name || "—"}`,
    `Kontakti: ${[lead.phone, lead.email].filter(Boolean).join(" · ") || "—"}`,
    `Pakalpojums: ${lead.service || "—"}`,
    `Kopsavilkums: ${lead.summary || "—"}`,
    `Panelis: ${link}`,
  ].join("\n");

  const html = `
    <div style="font-family:IBM Plex Sans,Segoe UI,sans-serif;line-height:1.5;color:#14201c">
      <h2 style="margin:0 0 12px">Jauns potenciālais klients</h2>
      <p style="margin:0 0 8px"><strong>Uzņēmums:</strong> ${escapeHtml(businessName)}</p>
      <p style="margin:0 0 8px"><strong>Klients:</strong> ${escapeHtml(lead.name || "—")}</p>
      <p style="margin:0 0 8px"><strong>Kontakti:</strong> ${escapeHtml(
        [lead.phone, lead.email].filter(Boolean).join(" · ") || "—",
      )}</p>
      <p style="margin:0 0 8px"><strong>Pakalpojums:</strong> ${escapeHtml(
        lead.service || "—",
      )}</p>
      <p style="margin:0 0 16px"><strong>Kopsavilkums:</strong> ${escapeHtml(
        lead.summary || "—",
      )}</p>
      <p><a href="${link}" style="color:#0F5C4C">Atvērt panelī</a></p>
    </div>
  `;

  const result = await sendEmail({ to, subject, html, text });
  if (result.ok) {
    await prisma.notification.create({
      data: {
        workspaceId: lead.workspaceId,
        channel: "EMAIL",
        title: subject,
        body: text,
        payload: { leadId: lead.id, to, skipped: result.skipped ?? false },
        sentAt: new Date(),
      },
    });
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function evaluateConversationForLead(params: {
  workspaceId: string;
  conversationId: string;
  locale?: "lv" | "en";
  source?: string;
  forceHandoff?: boolean;
  contactOverride?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  };
}): Promise<{
  created: boolean;
  leadId?: string;
  extraction: LeadExtraction;
  shouldAskFollowUp: boolean;
  followUpQuestion: string | null;
}> {
  const [assistant, workspace, messages, existingLead] = await Promise.all([
    prisma.assistantConfiguration.findUnique({
      where: { workspaceId: params.workspaceId },
    }),
    prisma.workspace.findUnique({ where: { id: params.workspaceId } }),
    prisma.conversationMessage.findMany({
      where: {
        conversationId: params.conversationId,
        workspaceId: params.workspaceId,
      },
      orderBy: { createdAt: "asc" },
      take: 40,
    }),
    prisma.lead.findFirst({
      where: {
        workspaceId: params.workspaceId,
        conversationId: params.conversationId,
      },
    }),
  ]);

  if (!assistant?.collectLeads) {
    return {
      created: false,
      extraction: {
        hasPurchaseIntent: false,
        isSpam: false,
        intent: null,
        service: null,
        summary: null,
        name: null,
        email: null,
        phone: null,
        fields: {},
        missingQuestions: [],
        confidence: 0,
      },
      shouldAskFollowUp: false,
      followUpQuestion: null,
    };
  }

  const locale = params.locale ?? "lv";
  const questions = parseQualificationQuestions(
    assistant.qualificationQs,
    workspace?.industry,
  );
  const criteria = parseMinCriteria(assistant.minLeadCriteria);

  const { extractLeadFromConversation } = await import(
    "@/services/leads/lead-detection"
  );

  const extraction = await extractLeadFromConversation({
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    questions,
    locale,
    industry: workspace?.industry,
  });

  if (params.contactOverride) {
    const o = params.contactOverride;
    if (o.name?.trim()) extraction.name = o.name.trim();
    if (o.email?.trim()) extraction.email = o.email.trim();
    if (o.phone?.trim()) extraction.phone = o.phone.trim();
    if (o.email?.trim() || o.phone?.trim()) {
      extraction.hasPurchaseIntent = true;
      if (!extraction.intent) {
        extraction.intent =
          locale === "en" ? "Contact shared in chat" : "Kontakti no čata";
      }
    }
  }

  if (params.forceHandoff && assistant.handoffCreatesLead) {
    extraction.hasPurchaseIntent = true;
    if (!extraction.intent) {
      extraction.intent =
        locale === "en" ? "Human handoff" : "Cilvēka handoff";
    }
  }

  const shouldAskFollowUp =
    extraction.hasPurchaseIntent &&
    !extraction.isSpam &&
    extraction.missingQuestions.length > 0 &&
    !meetsLeadCriteria(extraction, {
      ...criteria,
      // While gathering answers, still ask even if contact missing.
      requireContact: false,
      requireName: false,
    });

  const followUpQuestion =
    shouldAskFollowUp && extraction.missingQuestions[0]
      ? extraction.missingQuestions[0]
      : null;

  const ready =
    meetsLeadCriteria(extraction, criteria) ||
    (Boolean(params.forceHandoff) &&
      assistant.handoffCreatesLead &&
      !extraction.isSpam);

  if (!ready) {
    return {
      created: false,
      leadId: existingLead?.id,
      extraction,
      shouldAskFollowUp,
      followUpQuestion,
    };
  }

  const { lead, created } = await upsertLead({
    workspaceId: params.workspaceId,
    conversationId: params.conversationId,
    source: params.source || (params.forceHandoff ? "handoff" : "ai_intent"),
    status: params.forceHandoff
      ? "QUALIFIED"
      : existingLead?.status ?? "NEW",
    name: extraction.name,
    email: extraction.email,
    phone: extraction.phone,
    service: extraction.service,
    summary: extraction.summary,
    intent: extraction.intent,
    fields: extraction.fields,
    notify: !existingLead,
  });

  return {
    created,
    leadId: lead.id,
    extraction,
    shouldAskFollowUp: false,
    followUpQuestion: null,
  };
}
