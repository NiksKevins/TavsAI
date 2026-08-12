import { describe, expect, it } from "vitest";

import {
  clampCommissionBps,
  commissionCentsFromInvoice,
  DEFAULT_PARTNER_COMMISSION_BPS,
} from "@/config/partner";

describe("partner commission math", () => {
  it("defaults to 20%", () => {
    expect(DEFAULT_PARTNER_COMMISSION_BPS).toBe(2000);
  });

  it("computes 20% of a €39 invoice", () => {
    expect(commissionCentsFromInvoice(3900, 2000)).toBe(780);
  });

  it("clamps invalid bps", () => {
    expect(clampCommissionBps(-10)).toBe(0);
    expect(clampCommissionBps(15000)).toBe(10_000);
  });
});
