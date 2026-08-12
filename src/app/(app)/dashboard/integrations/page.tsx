import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { disconnectGoogleCalendarAction } from "@/actions/appointments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasMinimumRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/authz";
import { hasTokenEncryptionKey } from "@/lib/crypto/token-vault";
import { prisma } from "@/lib/db";

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("integrations");
  const { workspace, membership } = await requireWorkspace();
  const params = await searchParams;
  const canManage = hasMinimumRole(membership.role, "ADMIN");

  const google = await prisma.integration.findFirst({
    where: {
      workspaceId: workspace.id,
      type: "CALENDAR",
      provider: "google",
    },
    select: {
      isActive: true,
      externalAccountEmail: true,
      updatedAt: true,
      accessTokenEnc: true,
    },
  });

  const connected = Boolean(google?.isActive && google.accessTokenEnc);
  const ERRORS = new Set([
    "google_not_configured",
    "encryption_missing",
    "oauth_denied",
    "oauth_invalid",
    "oauth_state",
    "token_exchange",
  ]);
  const flash = first(params.connected);
  const errorKey = first(params.error);
  const error =
    errorKey && ERRORS.has(errorKey)
      ? t(`errors.${errorKey}` as Parameters<typeof t>[0])
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {flash === "google" ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {t("flash.connected")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>{t("google.hint")}</CardDescription>
          </div>
          <Badge variant={connected ? "success" : "secondary"}>
            {connected ? t("connected") : t("disconnected")}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {connected ? (
            <p className="text-sm text-muted-foreground">
              {google?.externalAccountEmail ?? t("google.connectedNoEmail")}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("google.notConnected")}
            </p>
          )}
          {!hasTokenEncryptionKey() ? (
            <p className="text-sm text-destructive">{t("errors.encryption_missing")}</p>
          ) : null}
          {canManage ? (
            <div className="flex flex-wrap gap-2">
              {!connected ? (
                <Button asChild>
                  <Link href="/api/integrations/google/connect">
                    {t("google.connect")}
                  </Link>
                </Button>
              ) : (
                <form action={disconnectGoogleCalendarAction}>
                  <Button type="submit" variant="outline">
                    {t("google.disconnect")}
                  </Button>
                </form>
              )}
              <Button asChild variant="outline">
                <Link href="/dashboard/appointments">{t("google.viewAppointments")}</Link>
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("comingSoon.title")}</CardTitle>
          <CardDescription>{t("comingSoon.hint")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">Microsoft Outlook</Badge>
          <Badge variant="outline">Calendly</Badge>
          <Badge variant="outline">Custom booking</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
