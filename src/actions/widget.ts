"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { writeAuditLog } from "@/lib/audit";
import { requireWorkspaceRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { originFromUrl } from "@/lib/widget/security";

export type WidgetActionResult =
  | { ok: true }
  | { ok: false; error: string };

const updateSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  position: z.enum(["bottom-right", "bottom-left"]),
  theme: z.enum(["light", "dark"]),
  borderRadius: z.coerce.number().min(0).max(28),
  launcherTextLv: z.string().max(40).optional(),
  welcomeMessageLv: z.string().max(500).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  quickActions: z.string().max(500).optional(),
  allowedOrigins: z.string().max(2000).optional(),
  leadFormEnabled: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function updateWidgetConfigAction(
  _prev: WidgetActionResult | null,
  formData: FormData,
): Promise<WidgetActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");

  const parsed = updateSchema.safeParse({
    primaryColor: formData.get("primaryColor"),
    position: formData.get("position"),
    theme: formData.get("theme"),
    borderRadius: formData.get("borderRadius"),
    launcherTextLv: formData.get("launcherTextLv") || undefined,
    welcomeMessageLv: formData.get("welcomeMessageLv") || undefined,
    logoUrl: formData.get("logoUrl") || "",
    quickActions: formData.get("quickActions") || undefined,
    allowedOrigins: formData.get("allowedOrigins") || undefined,
    leadFormEnabled: formData.get("leadFormEnabled") === "on",
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const quickActions = (parsed.data.quickActions || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);

  const allowedOrigins = (parsed.data.allowedOrigins || "")
    .split(/[\n,]+/)
    .map((s) => originFromUrl(s.trim()))
    .filter((o): o is string => Boolean(o))
    .slice(0, 20);

  await prisma.widgetConfiguration.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      primaryColor: parsed.data.primaryColor,
      position: parsed.data.position,
      theme: parsed.data.theme,
      borderRadius: parsed.data.borderRadius,
      launcherTextLv: parsed.data.launcherTextLv,
      welcomeMessageLv: parsed.data.welcomeMessageLv,
      logoUrl: parsed.data.logoUrl || null,
      quickActions:
        quickActions.length > 0
          ? quickActions
          : ["Cenas", "Pakalpojumi", "Darba laiks", "Kontakti"],
      allowedOrigins,
      leadFormEnabled: parsed.data.leadFormEnabled ?? true,
      isActive: parsed.data.isActive ?? true,
    },
    update: {
      primaryColor: parsed.data.primaryColor,
      position: parsed.data.position,
      theme: parsed.data.theme,
      borderRadius: parsed.data.borderRadius,
      launcherTextLv: parsed.data.launcherTextLv,
      welcomeMessageLv: parsed.data.welcomeMessageLv,
      logoUrl: parsed.data.logoUrl || null,
      quickActions:
        quickActions.length > 0
          ? quickActions
          : undefined,
      allowedOrigins,
      leadFormEnabled: parsed.data.leadFormEnabled ?? true,
      isActive: parsed.data.isActive ?? true,
    },
  });

  await writeAuditLog({
    workspaceId: workspace.id,
    userId: user.id,
    action: "SETTINGS",
    entityType: "WidgetConfiguration",
    entityId: workspace.id,
  });

  revalidatePath("/dashboard/widget");
  return { ok: true };
}
