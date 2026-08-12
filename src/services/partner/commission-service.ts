import type Stripe from "stripe";

import {
  clampCommissionBps,
  commissionCentsFromInvoice,
} from "@/config/partner";
import { prisma } from "@/lib/db";
import { logInfo, logError } from "@/lib/logging";

/**
 * Record recurring partner commission from a paid Stripe invoice.
 * Safe to call for all invoices — no-ops when workspace has no partner link.
 * Idempotent on stripeInvoiceId.
 */
export async function recordPartnerCommissionFromInvoice(params: {
  workspaceId: string;
  invoice: Stripe.Invoice;
}): Promise<{ created: boolean; commissionId?: string }> {
  const link = await prisma.partnerWorkspace.findUnique({
    where: { workspaceId: params.workspaceId },
    include: { partner: true },
  });
  if (!link || link.partner.status !== "ACTIVE") {
    return { created: false };
  }

  const amountPaid =
    typeof params.invoice.amount_paid === "number"
      ? params.invoice.amount_paid
      : 0;
  if (amountPaid <= 0) {
    return { created: false };
  }

  const bps = clampCommissionBps(
    link.commissionBpsOverride ?? link.partner.defaultCommissionBps,
  );
  const commissionAmountCents = commissionCentsFromInvoice(amountPaid, bps);
  if (commissionAmountCents <= 0) {
    return { created: false };
  }

  const periodStart = params.invoice.period_start
    ? new Date(params.invoice.period_start * 1000)
    : null;
  const periodEnd = params.invoice.period_end
    ? new Date(params.invoice.period_end * 1000)
    : null;

  const stripeInvoiceId = params.invoice.id;
  if (!stripeInvoiceId) {
    return { created: false };
  }

  try {
    const created = await prisma.commission.create({
      data: {
        partnerId: link.partnerId,
        workspaceId: params.workspaceId,
        partnerWorkspaceId: link.id,
        stripeInvoiceId,
        currency: (params.invoice.currency || "eur").toLowerCase(),
        invoiceAmountCents: amountPaid,
        commissionBps: bps,
        commissionAmountCents,
        status: "PENDING",
        periodStart,
        periodEnd,
      },
    });

    // Paying customers with an active subscription → mark partner link ACTIVE
    if (link.status !== "ACTIVE") {
      await prisma.partnerWorkspace.update({
        where: { id: link.id },
        data: {
          status: "ACTIVE",
          activatedAt: link.activatedAt ?? new Date(),
        },
      });
    }

    logInfo("partner.commission_recorded", {
      partnerId: link.partnerId,
      workspaceId: params.workspaceId,
      invoiceId: params.invoice.id,
      commissionAmountCents,
      bps,
    });

    return { created: true, commissionId: created.id };
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";
    if (code === "P2002") {
      return { created: false };
    }
    logError("partner.commission_failed", {
      workspaceId: params.workspaceId,
      invoiceId: params.invoice.id,
      message: error instanceof Error ? error.message : "unknown",
    });
    throw error;
  }
}

export async function getPartnerDashboardStats(partnerId: string) {
  const [
    customers,
    activeAssistants,
    commissions,
    referrals,
    conversionSum,
  ] = await Promise.all([
    prisma.partnerWorkspace.count({ where: { partnerId } }),
    prisma.partnerWorkspace.count({
      where: { partnerId, status: "ACTIVE", activatedAt: { not: null } },
    }),
    prisma.commission.findMany({
      where: { partnerId, status: { in: ["PENDING", "APPROVED", "PAID"] } },
      select: {
        invoiceAmountCents: true,
        commissionAmountCents: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.referral.findMany({
      where: { partnerId },
      select: { clicks: true, conversions: true, code: true, isActive: true },
    }),
    prisma.referral.aggregate({
      where: { partnerId },
      _sum: { conversions: true, clicks: true },
    }),
  ]);

  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  let mrrInvoiceCents = 0;
  let commissionPendingCents = 0;
  let commissionPaidCents = 0;
  let commissionMonthCents = 0;

  for (const c of commissions) {
    if (c.status === "PENDING" || c.status === "APPROVED") {
      commissionPendingCents += c.commissionAmountCents;
      // Approximate MRR from recent pending invoice amounts (paid recurring)
      if (c.createdAt >= monthStart) {
        mrrInvoiceCents += c.invoiceAmountCents;
        commissionMonthCents += c.commissionAmountCents;
      }
    }
    if (c.status === "PAID") {
      commissionPaidCents += c.commissionAmountCents;
    }
  }

  return {
    customers,
    activeAssistants,
    mrrInvoiceCents,
    commissionPendingCents,
    commissionPaidCents,
    commissionMonthCents,
    referralClicks: conversionSum._sum.clicks ?? 0,
    referralConversions: conversionSum._sum.conversions ?? 0,
    referrals,
  };
}
