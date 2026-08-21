import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import {
  isTurnstileConfigured,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";

describe("turnstile", () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY;
    } else {
      process.env.TURNSTILE_SECRET_KEY = originalSecret;
    }
  });

  it("skips verification when secret is not configured", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileConfigured()).toBe(false);
    await expect(verifyTurnstileToken({ token: null })).resolves.toEqual({
      ok: true,
    });
  });

  it("requires a token when secret is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    expect(isTurnstileConfigured()).toBe(true);
    await expect(verifyTurnstileToken({ token: "" })).resolves.toEqual({
      ok: false,
      error: "turnstile_required",
    });
  });

  it("accepts a successful siteverify response", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );

    await expect(
      verifyTurnstileToken({ token: "ok-token", remoteip: "1.2.3.4" }),
    ).resolves.toEqual({ ok: true });
  });
});
