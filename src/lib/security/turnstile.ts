/**
 * Cloudflare Turnstile — bot protection for auth forms.
 * Set NEXT_PUBLIC_TURNSTILE_SITE_KEY + TURNSTILE_SECRET_KEY to enable.
 * When the secret is unset (local dev), verification is skipped.
 */

export function isTurnstileConfigured(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export function turnstileSiteKey(): string | null {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || null;
}

export async function verifyTurnstileToken(params: {
  token: string | null | undefined;
  remoteip?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: true };
  }

  const token = params.token?.trim();
  if (!token) {
    return { ok: false, error: "turnstile_required" };
  }

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
    });
    if (params.remoteip) {
      body.set("remoteip", params.remoteip);
    }

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!res.ok || !data.success) {
      console.warn("[turnstile] verify failed", data["error-codes"]);
      return { ok: false, error: "turnstile_failed" };
    }
    return { ok: true };
  } catch (error) {
    console.error("[turnstile] verify exception", error);
    return { ok: false, error: "turnstile_failed" };
  }
}

/** Prefer Cloudflare's real client IP when the site is proxied. */
export function cloudflareClientIp(headerStore: Headers): string {
  const cf = headerStore.get("cf-connecting-ip")?.trim();
  if (cf) return cf;
  const forwarded = headerStore.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerStore.get("x-real-ip") || "unknown";
}
