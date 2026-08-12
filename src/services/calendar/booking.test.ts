import { describe, expect, it } from "vitest";

import { decryptSecret, encryptSecret } from "@/lib/crypto/token-vault";
import { isBookingIntent } from "@/services/calendar/booking-flow";

describe("token vault", () => {
  it("round-trips secrets", () => {
    process.env.TOKEN_ENCRYPTION_KEY = "a".repeat(64);
    const enc = encryptSecret("super-secret-token");
    expect(enc.startsWith("v1:")).toBe(true);
    expect(decryptSecret(enc)).toBe("super-secret-token");
  });
});

describe("booking intent", () => {
  it("detects lv/en booking phrases", () => {
    expect(isBookingIntent("Vai varu pierakstīties piektdien?")).toBe(true);
    expect(isBookingIntent("I'd like to book an appointment")).toBe(true);
    expect(isBookingIntent("Cik maksā eļļas maiņa?")).toBe(false);
  });
});
