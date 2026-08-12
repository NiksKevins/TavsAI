import { requireWorkspaceRole } from "@/lib/authz";
import { hasTokenEncryptionKey } from "@/lib/crypto/token-vault";
import { signOAuthState } from "@/lib/oauth-state";
import { getAppUrl } from "@/lib/stripe";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
].join(" ");

export async function GET() {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  if (!clientId) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=google_not_configured`,
    );
  }
  if (!hasTokenEncryptionKey()) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=encryption_missing`,
    );
  }

  const state = signOAuthState({
    workspaceId: workspace.id,
    userId: user.id,
    ts: Date.now(),
  });
  const redirectUri = `${getAppUrl()}/api/integrations/google/callback`;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_SCOPES);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return Response.redirect(url.toString());
}
