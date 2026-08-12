"use server";

import { revalidatePath } from "next/cache";

import { requireWorkspaceRole } from "@/lib/authz";
import { prisma } from "@/lib/db";

export async function disconnectGoogleCalendarAction() {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  await prisma.integration.updateMany({
    where: {
      workspaceId: workspace.id,
      type: "CALENDAR",
      provider: "google",
    },
    data: {
      isActive: false,
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
    },
  });
  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "SETTINGS",
      entityType: "Integration",
      entityId: workspace.id,
      metadata: { provider: "google", event: "calendar_disconnected" },
    },
  });
  revalidatePath("/dashboard/integrations");
  revalidatePath("/dashboard/appointments");
}

export async function cancelAppointmentAction(formData: FormData) {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");
  const id = String(formData.get("id") || "");
  if (!id) return;

  const appointment = await prisma.appointment.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!appointment) return;

  if (appointment.externalEventId && appointment.provider === "google") {
    try {
      const { getActiveCalendarIntegration } = await import(
        "@/services/calendar/connection-service"
      );
      const calendar = await getActiveCalendarIntegration(workspace.id);
      if (calendar) {
        await calendar.adapter.cancelEvent(appointment.externalEventId);
      }
    } catch (error) {
      console.error("[appointments/cancel]", error);
    }
  }

  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: "CANCELLED" },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "UPDATE",
      entityType: "Appointment",
      entityId: appointment.id,
      metadata: { status: "CANCELLED" },
    },
  });

  revalidatePath("/dashboard/appointments");
}
