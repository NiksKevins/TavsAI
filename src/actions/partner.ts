"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clampCommissionBps } from "@/config/partner";
import { requirePartner } from "@/lib/partner/authz";
import { prisma } from "@/lib/db";
import {
  ensureTavsWebsPartner,
  linkWorkspaceToPartner,
  updatePartnerCommissionBps,
} from "@/services/partner/partner-service";

export async function updateCommissionRateAction(
  formData: FormData,
): Promise<void> {
  const { partner, membership } = await requirePartner();
  if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
    redirect("/partner?error=forbidden");
  }

  const percent = Number(formData.get("commissionPercent"));
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
    redirect("/partner?error=invalid_rate");
  }

  await updatePartnerCommissionBps({
    partnerId: partner.id,
    defaultCommissionBps: clampCommissionBps(Math.round(percent * 100)),
  });

  revalidatePath("/partner");
  redirect("/partner?saved=commission");
}

export async function createReferralCodeAction(
  formData: FormData,
): Promise<void> {
  const { partner, membership } = await requirePartner();
  if (membership.role === "VIEWER") {
    redirect("/partner?error=forbidden");
  }

  const code = String(formData.get("code") || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "");
  const label = String(formData.get("label") || "").trim().slice(0, 80);

  if (code.length < 3 || code.length > 32) {
    redirect("/partner?error=invalid_code");
  }

  try {
    await prisma.referral.create({
      data: {
        partnerId: partner.id,
        code,
        label: label || null,
      },
    });
  } catch {
    redirect("/partner?error=code_taken");
  }

  revalidatePath("/partner");
  redirect("/partner?saved=referral");
}

export async function linkCustomerWorkspaceAction(
  formData: FormData,
): Promise<void> {
  const { partner, membership } = await requirePartner();
  if (membership.role === "VIEWER") {
    redirect("/partner/customers?error=forbidden");
  }

  const workspaceId = String(formData.get("workspaceId") || "").trim();
  const parsed = z.string().uuid().safeParse(workspaceId);
  if (!parsed.success) {
    redirect("/partner/customers?error=invalid_workspace");
  }

  const result = await linkWorkspaceToPartner({
    partnerId: partner.id,
    workspaceId: parsed.data,
    source: "manual_link",
  });

  if (!result.ok) {
    redirect(`/partner/customers?error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/partner/customers");
  redirect("/partner/customers?saved=1");
}

/** Bootstrap TavsWebs partner + attach current user as OWNER (dev / first admin). */
export async function bootstrapTavsWebsPartnerAction(): Promise<void> {
  const { requireUser } = await import("@/lib/authz");
  const user = await requireUser();
  await ensureTavsWebsPartner({ ownerUserId: user.id });
  revalidatePath("/partner");
  redirect("/partner");
}
