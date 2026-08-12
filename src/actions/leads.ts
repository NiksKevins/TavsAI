"use server";

import type { LeadStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireWorkspaceRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

export type LeadActionResult =
  | { ok: true }
  | { ok: false; error: string };

const statusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST",
  "SPAM",
]);

export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus,
): Promise<LeadActionResult> {
  const { workspace } = await requireWorkspaceRole("MEMBER");
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "invalid_status" };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: workspace.id },
  });
  if (!lead) return { ok: false, error: "not_found" };

  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      action: "UPDATE",
      entityType: "Lead",
      entityId: lead.id,
      metadata: { status: parsed.data },
    },
  });

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${lead.id}`);
  return { ok: true };
}

export async function updateLeadNotesAction(
  _prev: LeadActionResult | null,
  formData: FormData,
): Promise<LeadActionResult> {
  const { workspace } = await requireWorkspaceRole("MEMBER");
  const leadId = String(formData.get("leadId") || "");
  const notes = String(formData.get("notes") || "").slice(0, 5000);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId: workspace.id },
  });
  if (!lead) return { ok: false, error: "not_found" };

  await prisma.lead.update({
    where: { id: lead.id },
    data: { notes },
  });

  revalidatePath(`/dashboard/leads/${lead.id}`);
  return { ok: true };
}

const assistantLeadSchema = z.object({
  collectLeads: z.boolean(),
  handoffEnabled: z.boolean(),
  handoffCreatesLead: z.boolean(),
  leadNotificationEmail: z.string().email().optional().or(z.literal("")),
  qualificationQsText: z.string().max(4000),
  requireIntent: z.boolean(),
  requireContact: z.boolean(),
  requireName: z.boolean(),
  requireService: z.boolean(),
  handoffMessageLv: z.string().max(1000).optional(),
});

export async function updateLeadSettingsAction(
  _prev: LeadActionResult | null,
  formData: FormData,
): Promise<LeadActionResult> {
  const { workspace } = await requireWorkspaceRole("ADMIN");

  const parsed = assistantLeadSchema.safeParse({
    collectLeads: formData.get("collectLeads") === "on",
    handoffEnabled: formData.get("handoffEnabled") === "on",
    handoffCreatesLead: formData.get("handoffCreatesLead") === "on",
    leadNotificationEmail: formData.get("leadNotificationEmail") || "",
    qualificationQsText: String(formData.get("qualificationQsText") || ""),
    requireIntent: formData.get("requireIntent") === "on",
    requireContact: formData.get("requireContact") === "on",
    requireName: formData.get("requireName") === "on",
    requireService: formData.get("requireService") === "on",
    handoffMessageLv: String(formData.get("handoffMessageLv") || "") || undefined,
  });

  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const qualificationQs = parsed.data.qualificationQsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((label, index) => ({
      key: `q_${index + 1}`,
      labelLv: label,
      labelEn: label,
      required: index < 2,
    }));

  await prisma.assistantConfiguration.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      greetingLv: "Sveiki!",
      greetingEn: "Hello!",
      fallbackLv: "Nevaru apstiprināt.",
      fallbackEn: "I cannot confirm.",
      collectLeads: parsed.data.collectLeads,
      handoffEnabled: parsed.data.handoffEnabled,
      handoffCreatesLead: parsed.data.handoffCreatesLead,
      leadNotificationEmail: parsed.data.leadNotificationEmail || null,
      qualificationQs,
      minLeadCriteria: {
        requireIntent: parsed.data.requireIntent,
        requireContact: parsed.data.requireContact,
        requireName: parsed.data.requireName,
        requireService: parsed.data.requireService,
      },
      handoffMessageLv: parsed.data.handoffMessageLv,
    },
    update: {
      collectLeads: parsed.data.collectLeads,
      handoffEnabled: parsed.data.handoffEnabled,
      handoffCreatesLead: parsed.data.handoffCreatesLead,
      leadNotificationEmail: parsed.data.leadNotificationEmail || null,
      qualificationQs,
      minLeadCriteria: {
        requireIntent: parsed.data.requireIntent,
        requireContact: parsed.data.requireContact,
        requireName: parsed.data.requireName,
        requireService: parsed.data.requireService,
      },
      handoffMessageLv: parsed.data.handoffMessageLv,
    },
  });

  revalidatePath("/dashboard/assistant");
  revalidatePath("/dashboard/leads");
  return { ok: true };
}
