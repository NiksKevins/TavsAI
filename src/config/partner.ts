/** Partner commission helpers. Amounts in basis points (2000 = 20%). */

export const DEFAULT_PARTNER_COMMISSION_BPS = 2000;

export function clampCommissionBps(bps: number): number {
  if (!Number.isFinite(bps)) return DEFAULT_PARTNER_COMMISSION_BPS;
  return Math.min(10_000, Math.max(0, Math.floor(bps)));
}

export function commissionCentsFromInvoice(
  invoiceAmountCents: number,
  commissionBps: number,
): number {
  if (invoiceAmountCents <= 0) return 0;
  return Math.floor((invoiceAmountCents * clampCommissionBps(commissionBps)) / 10_000);
}

export function formatEurFromCents(cents: number): string {
  return new Intl.NumberFormat("lv-LV", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** Reserved white-label shape — stored on Partner.branding, not applied yet. */
export type PartnerBrandingStub = {
  logoUrl?: string | null;
  primaryColor?: string | null;
  displayName?: string | null;
  supportEmail?: string | null;
};
