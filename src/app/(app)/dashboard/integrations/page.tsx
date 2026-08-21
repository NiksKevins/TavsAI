import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Lock } from "lucide-react";

import { disconnectGoogleCalendarAction } from "@/actions/appointments";
import {
  CalendlyLogo,
  CustomBookingLogo,
  GoogleCalendarLogo,
  IntegrationLogoMark,
  OutlookLogo,
} from "@/components/integrations/integration-logos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { hasMinimumRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/authz";
import { hasTokenEncryptionKey } from "@/lib/crypto/token-vault";
import { prisma } from "@/lib/db";
import { cn } from "@/lib/utils";

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

  const comingSoon = [
    {
      id: "outlook",
      name: t("providers.outlook.name"),
      hint: t("providers.outlook.hint"),
      logo: <OutlookLogo />,
    },
    {
      id: "calendly",
      name: t("providers.calendly.name"),
      hint: t("providers.calendly.hint"),
      logo: <CalendlyLogo />,
    },
    {
      id: "custom",
      name: t("providers.custom.name"),
      hint: t("providers.custom.hint"),
      logo: <CustomBookingLogo />,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
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

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t("sections.available")}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Card
            className={cn(
              "overflow-hidden transition-shadow hover:shadow-md",
              connected && "border-primary/30",
            )}
          >
            <CardHeader className="space-y-4 pb-3">
              <div className="flex items-start justify-between gap-3">
                <IntegrationLogoMark>
                  <GoogleCalendarLogo />
                </IntegrationLogoMark>
                <Badge variant={connected ? "success" : "secondary"}>
                  {connected ? t("connected") : t("disconnected")}
                </Badge>
              </div>
              <div>
                <CardTitle className="text-lg">Google Calendar</CardTitle>
                <CardDescription className="mt-1.5 leading-relaxed">
                  {t("google.hint")}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {connected ? (
                <p className="truncate rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  {google?.externalAccountEmail ?? t("google.connectedNoEmail")}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {t("google.notConnected")}
                </p>
              )}
              {!hasTokenEncryptionKey() ? (
                <p className="flex items-start gap-2 text-sm text-destructive">
                  <Lock className="mt-0.5 size-3.5 shrink-0" />
                  {t("errors.encryption_missing")}
                </p>
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
                      <PendingSubmitButton
                        idleLabel={t("google.disconnect")}
                        pendingLabel={t("google.disconnect")}
                        variant="outline"
                      />
                    </form>
                  )}
                  <Button asChild variant="outline">
                    <Link href="/dashboard/appointments">
                      {t("google.viewAppointments")}
                    </Link>
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("comingSoon.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("comingSoon.hint")}</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {comingSoon.map((item) => (
            <Card
              key={item.id}
              className="relative overflow-hidden opacity-90"
            >
              <CardHeader className="space-y-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <IntegrationLogoMark>
                    {item.logo}
                  </IntegrationLogoMark>
                  <Badge variant="outline">{t("comingSoon.badge")}</Badge>
                </div>
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="mt-1.5 leading-relaxed">
                    {item.hint}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
                  {t("comingSoon.cta")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}
