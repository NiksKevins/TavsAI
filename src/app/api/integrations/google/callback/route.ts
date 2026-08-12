import { verifyOAuthState } from "@/lib/oauth-state";
import { prisma } from "@/lib/db";
import { getAppUrl } from "@/lib/stripe";
import { upsertGoogleCalendarIntegration } from "@/services/calendar/connection-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=oauth_denied`,
    );
  }
  if (!code || !state) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=oauth_invalid`,
    );
  }

  const verified = verifyOAuthState(state);
  if (!verified) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=oauth_state`,
    );
  }

  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: verified.workspaceId,
      userId: verified.userId,
      role: { in: ["OWNER", "ADMIN"] },
      workspace: { deletedAt: null },
    },
  });
  if (!membership) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=oauth_state`,
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=google_not_configured`,
    );
  }

  const redirectUri = `${getAppUrl()}/api/integrations/google/callback`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    console.error("[google/oauth]", await tokenRes.text());
    return Response.redirect(
      `${getAppUrl()}/dashboard/integrations?error=token_exchange`,
    );
  }

  const tokens = (await tokenRes.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  let email: string | null = null;
  try {
    const me = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (me.ok) {
      const profile = (await me.json()) as { email?: string };
      email = profile.email ?? null;
    }
  } catch {
    // optional
  }

  await upsertGoogleCalendarIntegration({
    workspaceId: verified.workspaceId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null,
    email,
    scopes: tokens.scope?.split(/\s+/).filter(Boolean) ?? [],
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: verified.workspaceId,
      userId: verified.userId,
      action: "SETTINGS",
      entityType: "Integration",
      entityId: verified.workspaceId,
      metadata: { provider: "google", event: "calendar_connected" },
    },
  });

  return Response.redirect(
    `${getAppUrl()}/dashboard/integrations?connected=google`,
  );
}
