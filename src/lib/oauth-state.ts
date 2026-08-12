import { createHmac, timingSafeEqual } from "crypto";

function oauthStateSecret(): string {
  const key =
    process.env.TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!key) {
    throw new Error("oauth_state_secret_missing");
  }
  return key;
}

export function signOAuthState(payload: {
  workspaceId: string;
  userId: string;
  ts: number;
}): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", oauthStateSecret())
    .update(body)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifyOAuthState(state: string): {
  workspaceId: string;
  userId: string;
} | null {
  const [body, sig] = state.split(".");
  if (!body || !sig) return null;
  let expected: string;
  try {
    expected = createHmac("sha256", oauthStateSecret())
      .update(body)
      .digest("base64url");
  } catch {
    return null;
  }
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as { workspaceId?: string; userId?: string; ts?: number };
    if (!parsed.workspaceId || !parsed.userId || !parsed.ts) return null;
    if (Date.now() - parsed.ts > 15 * 60_000) return null;
    return { workspaceId: parsed.workspaceId, userId: parsed.userId };
  } catch {
    return null;
  }
}
