import { prisma } from "@/lib/db";
import {
  clampCommissionBps,
  commissionCentsFromInvoice,
  DEFAULT_PARTNER_COMMISSION_BPS,
} from "@/config/partner";

/**
 * Ensure the default TavsWebs agency partner exists (idempotent).
 * Does not modify Workspace tenancy.
 */
export async function ensureTavsWebsPartner(params?: {
  ownerUserId?: string;
}) {
  const slug = "tavswebs";
  let partner = await prisma.partner.findUnique({ where: { slug } });
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        name: "TavsWebs",
        slug,
        defaultCommissionBps: DEFAULT_PARTNER_COMMISSION_BPS,
        branding: {
          displayName: "TavsWebs",
          primaryColor: "#0F5C4C",
        },
        notes: "Primary agency partner — sells website + AI Website Employee.",
        referrals: {
          create: {
            code: "TAVSWEBS",
            label: "Default TavsWebs referral",
          },
        },
      },
    });
  }

  if (params?.ownerUserId) {
    await prisma.partnerMember.upsert({
      where: {
        partnerId_userId: {
          partnerId: partner.id,
          userId: params.ownerUserId,
        },
      },
      create: {
        partnerId: partner.id,
        userId: params.ownerUserId,
        role: "OWNER",
      },
      update: {},
    });
  }

  return partner;
}

export async function resolveReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return prisma.referral.findFirst({
    where: { code: normalized, isActive: true, partner: { status: "ACTIVE" } },
    include: { partner: true },
  });
}

/**
 * Attach an existing workspace to a partner via referral code.
 * No-op if already linked. Core Workspace row is unchanged except via join table.
 */
export async function attachWorkspaceViaReferral(params: {
  workspaceId: string;
  referralCode: string;
}) {
  const referral = await resolveReferralCode(params.referralCode);
  if (!referral) return { ok: false as const, error: "invalid_referral" };

  const existing = await prisma.partnerWorkspace.findUnique({
    where: { workspaceId: params.workspaceId },
  });
  if (existing) {
    return { ok: true as const, partnerWorkspaceId: existing.id, alreadyLinked: true };
  }

  const link = await prisma.partnerWorkspace.create({
    data: {
      partnerId: referral.partnerId,
      workspaceId: params.workspaceId,
      referralId: referral.id,
      source: "referral",
      status: "INVITED",
    },
  });

  await prisma.referral.update({
    where: { id: referral.id },
    data: { conversions: { increment: 1 } },
  });

  return { ok: true as const, partnerWorkspaceId: link.id, alreadyLinked: false };
}

/** Partner manually links a customer workspace (agency sale). */
export async function linkWorkspaceToPartner(params: {
  partnerId: string;
  workspaceId: string;
  source?: string;
  commissionBpsOverride?: number | null;
}) {
  const workspace = await prisma.workspace.findFirst({
    where: { id: params.workspaceId, deletedAt: null },
  });
  if (!workspace) return { ok: false as const, error: "workspace_not_found" };

  const existing = await prisma.partnerWorkspace.findUnique({
    where: { workspaceId: params.workspaceId },
  });
  if (existing && existing.partnerId !== params.partnerId) {
    return { ok: false as const, error: "workspace_linked_elsewhere" };
  }
  if (existing) {
    return { ok: true as const, partnerWorkspaceId: existing.id };
  }

  const link = await prisma.partnerWorkspace.create({
    data: {
      partnerId: params.partnerId,
      workspaceId: params.workspaceId,
      source: params.source ?? "agency_sale",
      status: "INVITED",
      commissionBpsOverride:
        params.commissionBpsOverride == null
          ? null
          : clampCommissionBps(params.commissionBpsOverride),
    },
  });

  return { ok: true as const, partnerWorkspaceId: link.id };
}

/** Mark partner customer as activated when onboarding completes. */
export async function markPartnerWorkspaceActivated(workspaceId: string) {
  const link = await prisma.partnerWorkspace.findUnique({
    where: { workspaceId },
  });
  if (!link) return;
  if (link.status === "ACTIVE" && link.activatedAt) return;

  await prisma.partnerWorkspace.update({
    where: { id: link.id },
    data: {
      status: "ACTIVE",
      activatedAt: link.activatedAt ?? new Date(),
    },
  });
}

export async function updatePartnerCommissionBps(params: {
  partnerId: string;
  defaultCommissionBps: number;
}) {
  return prisma.partner.update({
    where: { id: params.partnerId },
    data: {
      defaultCommissionBps: clampCommissionBps(params.defaultCommissionBps),
    },
  });
}

/**
 * Create a customer workspace under a partner (agency provisions the account shell).
 * Customer still owns Workspace via membership; partner link is join-table only.
 */
export async function provisionPartnerCustomerWorkspace(params: {
  partnerId: string;
  ownerUserId: string;
  businessName: string;
  ownerEmail: string;
}) {
  const { createWorkspaceForUser } = await import("@/lib/authz");

  const ctx = await createWorkspaceForUser({
    userId: params.ownerUserId,
    name: params.businessName,
    email: params.ownerEmail,
    locale: "lv",
  });

  await linkWorkspaceToPartner({
    partnerId: params.partnerId,
    workspaceId: ctx.id,
    source: "agency_provision",
  });

  return ctx;
}
