import { decryptSecret, encryptSecret } from "@/lib/crypto/token-vault";
import { prisma } from "@/lib/db";
import { GoogleCalendarIntegration } from "@/services/calendar/google-calendar";
import {
  DEFAULT_CALENDAR_CONFIG,
  type CalendarConnectionConfig,
  type CalendarIntegration,
  type CalendarProvider,
} from "@/services/calendar/types";

export function parseCalendarConfig(raw: unknown): CalendarConnectionConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_CALENDAR_CONFIG };
  const o = raw as Record<string, unknown>;
  return {
    calendarId:
      typeof o.calendarId === "string" && o.calendarId
        ? o.calendarId
        : DEFAULT_CALENDAR_CONFIG.calendarId,
    timezone:
      typeof o.timezone === "string" && o.timezone
        ? o.timezone
        : DEFAULT_CALENDAR_CONFIG.timezone,
    slotDurationMinutes:
      typeof o.slotDurationMinutes === "number" && o.slotDurationMinutes > 0
        ? o.slotDurationMinutes
        : DEFAULT_CALENDAR_CONFIG.slotDurationMinutes,
    workingHours:
      o.workingHours && typeof o.workingHours === "object"
        ? (o.workingHours as CalendarConnectionConfig["workingHours"])
        : DEFAULT_CALENDAR_CONFIG.workingHours,
  };
}

export async function getActiveCalendarIntegration(
  workspaceId: string,
): Promise<{
  integrationId: string;
  provider: CalendarProvider;
  adapter: CalendarIntegration;
  config: CalendarConnectionConfig;
} | null> {
  const row = await prisma.integration.findFirst({
    where: {
      workspaceId,
      type: "CALENDAR",
      isActive: true,
      provider: { not: null },
    },
  });
  if (!row?.provider || !row.accessTokenEnc) return null;

  const config = parseCalendarConfig(row.config);
  const accessToken = decryptSecret(row.accessTokenEnc);
  const refreshToken = row.refreshTokenEnc
    ? decryptSecret(row.refreshTokenEnc)
    : null;

  if (row.provider === "google") {
    const adapter = new GoogleCalendarIntegration(
      {
        accessToken,
        refreshToken,
        expiresAt: row.tokenExpiresAt,
      },
      config,
      async (tokens) => {
        await prisma.integration.update({
          where: { id: row.id },
          data: {
            accessTokenEnc: encryptSecret(tokens.accessToken),
            tokenExpiresAt: tokens.expiresAt ?? null,
          },
        });
      },
    );
    return {
      integrationId: row.id,
      provider: "google",
      adapter,
      config,
    };
  }

  // Future: outlook, calendly, custom
  return null;
}

export async function upsertGoogleCalendarIntegration(params: {
  workspaceId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  email?: string | null;
  scopes?: string[];
  config?: Partial<CalendarConnectionConfig>;
}) {
  const config: CalendarConnectionConfig = {
    ...DEFAULT_CALENDAR_CONFIG,
    ...params.config,
  };

  return prisma.integration.upsert({
    where: {
      workspaceId_type_provider: {
        workspaceId: params.workspaceId,
        type: "CALENDAR",
        provider: "google",
      },
    },
    create: {
      workspaceId: params.workspaceId,
      type: "CALENDAR",
      provider: "google",
      name: "Google Calendar",
      config,
      accessTokenEnc: encryptSecret(params.accessToken),
      refreshTokenEnc: params.refreshToken
        ? encryptSecret(params.refreshToken)
        : null,
      tokenExpiresAt: params.expiresAt ?? null,
      scopes: params.scopes ?? [],
      externalAccountEmail: params.email ?? null,
      isActive: true,
    },
    update: {
      accessTokenEnc: encryptSecret(params.accessToken),
      refreshTokenEnc: params.refreshToken
        ? encryptSecret(params.refreshToken)
        : undefined,
      tokenExpiresAt: params.expiresAt ?? null,
      scopes: params.scopes ?? [],
      externalAccountEmail: params.email ?? null,
      isActive: true,
      config,
      name: "Google Calendar",
    },
  });
}
