"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { requireWorkspaceRole, requireUser } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import {
  applyConversationRetention,
  deleteConversationForWorkspace,
  deleteLeadForWorkspace,
  exportWorkspaceData,
  softDeleteWorkspace,
} from "@/services/privacy/privacy-service";

export type PrivacyActionResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

export async function updateRetentionAction(formData: FormData) {
  const { workspace, user } = await requireWorkspaceRole("OWNER");
  const days = Number(formData.get("dataRetentionDays"));
  if (!Number.isFinite(days) || days < 0 || days > 3650) {
    redirect("/dashboard/settings?error=invalid_retention");
  }
  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { dataRetentionDays: Math.floor(days) },
  });
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "SETTINGS",
    entityType: "Workspace",
    entityId: workspace.id,
    metadata: { dataRetentionDays: Math.floor(days) },
  });
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=retention");
}

export async function exportWorkspaceDataAction(): Promise<PrivacyActionResult> {
  const { workspace, user } = await requireWorkspaceRole("OWNER");
  const data = await exportWorkspaceData(workspace.id);
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "EXPORT",
    entityType: "Workspace",
    entityId: workspace.id,
    metadata: { event: "data_export" },
  });
  return { ok: true, data };
}

export async function deleteConversationAction(formData: FormData) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteConversationForWorkspace({
    workspaceId: workspace.id,
    conversationId: id,
    userId: user.id,
  });
  revalidatePath("/dashboard/conversations");
  revalidatePath("/dashboard/analytics");
  redirect("/dashboard/conversations");
}

export async function deleteLeadAction(formData: FormData) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;
  await deleteLeadForWorkspace({
    workspaceId: workspace.id,
    leadId: id,
    userId: user.id,
  });
  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function runRetentionNowAction() {
  const { workspace, user } = await requireWorkspaceRole("OWNER");
  const result = await applyConversationRetention(workspace.id);
  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "DELETE",
    entityType: "Conversation",
    entityId: workspace.id,
    metadata: { event: "retention_purge", ...result },
  });
  revalidatePath("/dashboard/settings");
  redirect("/dashboard/settings?saved=retention_run");
}

export async function deleteWorkspaceAction(formData: FormData) {
  const { workspace, user } = await requireWorkspaceRole("OWNER");
  const confirm = String(formData.get("confirm") || "");
  if (confirm !== workspace.slug) {
    redirect("/dashboard/settings?error=confirm_slug");
  }
  await softDeleteWorkspace({
    workspaceId: workspace.id,
    userId: user.id,
  });
  redirect("/login");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const confirm = String(formData.get("confirm") || "");
  if (confirm !== user.email) {
    redirect("/dashboard/settings?error=confirm_email");
  }

  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: user.id, role: "OWNER" },
    select: { workspaceId: true },
  });
  for (const m of memberships) {
    await softDeleteWorkspace({
      workspaceId: m.workspaceId,
      userId: user.id,
    });
  }

  await writeAuditLog({
    userId: user.id,
    action: "DELETE",
    entityType: "User",
    entityId: user.id,
    metadata: { event: "account_delete" },
  });

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.account.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await signOut({ redirect: false });
  redirect("/login");
}
