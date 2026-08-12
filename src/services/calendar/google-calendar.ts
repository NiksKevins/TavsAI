import type {
  CalendarConnectionConfig,
  CalendarIntegration,
  CreateCalendarEventInput,
  CreateCalendarEventResult,
  ListSlotsInput,
  TimeSlot,
} from "@/services/calendar/types";

type GoogleTokens = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
};

/**
 * Google Calendar adapter. Slots come only from FreeBusy ∩ working hours.
 */
export class GoogleCalendarIntegration implements CalendarIntegration {
  readonly provider = "google" as const;

  constructor(
    private tokens: GoogleTokens,
    private config: CalendarConnectionConfig,
    private onTokensRefreshed?: (tokens: GoogleTokens) => Promise<void>,
  ) {}

  async listAvailableSlots(input: ListSlotsInput): Promise<TimeSlot[]> {
    const accessToken = await this.getAccessToken();
    const duration = input.durationMinutes || this.config.slotDurationMinutes;
    const limit = input.limit ?? 8;

    const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        timeMin: input.from.toISOString(),
        timeMax: input.to.toISOString(),
        timeZone: input.timezone || this.config.timezone,
        items: [{ id: this.config.calendarId || "primary" }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`google_freebusy_failed:${res.status}:${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      calendars?: Record<string, { busy?: { start: string; end: string }[] }>;
    };
    const busy =
      data.calendars?.[this.config.calendarId || "primary"]?.busy ??
      data.calendars?.[Object.keys(data.calendars ?? {})[0] ?? ""]?.busy ??
      [];

    const busyRanges = busy.map((b) => ({
      start: new Date(b.start).getTime(),
      end: new Date(b.end).getTime(),
    }));

    const candidates = generateWorkingHourSlots({
      from: input.from,
      to: input.to,
      durationMinutes: duration,
      timezone: input.timezone || this.config.timezone,
      workingHours: this.config.workingHours,
    });

    const free = candidates.filter((slot) => {
      const s = slot.start.getTime();
      const e = slot.end.getTime();
      if (s < Date.now() + 5 * 60_000) return false;
      return !busyRanges.some((b) => s < b.end && e > b.start);
    });

    return free.slice(0, limit);
  }

  async createEvent(
    input: CreateCalendarEventInput,
  ): Promise<CreateCalendarEventResult> {
    const accessToken = await this.getAccessToken();
    const calendarId = encodeURIComponent(this.config.calendarId || "primary");
    const body: Record<string, unknown> = {
      summary: input.title,
      description: input.description ?? undefined,
      start: {
        dateTime: input.start.toISOString(),
        timeZone: input.timezone,
      },
      end: {
        dateTime: input.end.toISOString(),
        timeZone: input.timezone,
      },
    };
    if (input.attendeeEmail) {
      body.attendees = [
        {
          email: input.attendeeEmail,
          displayName: input.attendeeName ?? undefined,
        },
      ];
    }

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`google_create_event_failed:${res.status}:${text.slice(0, 200)}`);
    }

    const event = (await res.json()) as { id?: string; htmlLink?: string };
    if (!event.id) {
      throw new Error("google_create_event_missing_id");
    }
    return { externalEventId: event.id, htmlLink: event.htmlLink ?? null };
  }

  async cancelEvent(externalEventId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    const calendarId = encodeURIComponent(this.config.calendarId || "primary");
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(externalEventId)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok && res.status !== 404 && res.status !== 410) {
      const text = await res.text();
      throw new Error(`google_cancel_failed:${res.status}:${text.slice(0, 200)}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (
      this.tokens.expiresAt &&
      this.tokens.expiresAt.getTime() > Date.now() + 60_000
    ) {
      return this.tokens.accessToken;
    }
    if (!this.tokens.refreshToken) {
      return this.tokens.accessToken;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      throw new Error("google_oauth_not_configured");
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: this.tokens.refreshToken,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) {
      throw new Error(`google_refresh_failed:${res.status}`);
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in?: number;
    };
    this.tokens = {
      ...this.tokens,
      accessToken: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    };
    if (this.onTokensRefreshed) {
      await this.onTokensRefreshed(this.tokens);
    }
    return this.tokens.accessToken;
  }
}

function generateWorkingHourSlots(params: {
  from: Date;
  to: Date;
  durationMinutes: number;
  timezone: string;
  workingHours: CalendarConnectionConfig["workingHours"];
}): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const cursor = new Date(params.from);
  cursor.setUTCMinutes(0, 0, 0);

  while (cursor < params.to && slots.length < 200) {
    const local = getZonedParts(cursor, params.timezone);
    const dayKey = weekdayKey(local.weekday);
    const hours = dayKey ? params.workingHours[dayKey] : undefined;
    if (hours) {
      const startMin = parseHm(hours.start);
      const endMin = parseHm(hours.end);
      for (let m = startMin; m + params.durationMinutes <= endMin; m += params.durationMinutes) {
        const start = zonedLocalToUtc(
          {
            year: local.year,
            month: local.month,
            day: local.day,
            hour: Math.floor(m / 60),
            minute: m % 60,
          },
          params.timezone,
        );
        const end = new Date(start.getTime() + params.durationMinutes * 60_000);
        if (start >= params.from && end <= params.to) {
          slots.push({ start, end });
        }
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return slots;
}

function parseHm(value: string): number {
  const [h, m] = value.split(":").map((x) => Number(x));
  return (h || 0) * 60 + (m || 0);
}

function weekdayKey(
  weekday: string,
): keyof CalendarConnectionConfig["workingHours"] | null {
  const map: Record<string, keyof CalendarConnectionConfig["workingHours"]> = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[weekday] ?? null;
}

function getZonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value]),
  );
  return {
    weekday: parts.weekday,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

/** Approximate local→UTC using iterative offset (good enough for slot generation). */
function zonedLocalToUtc(
  local: { year: number; month: number; day: number; hour: number; minute: number },
  timeZone: string,
): Date {
  const guess = new Date(
    Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute),
  );
  const parts = getZonedParts(guess, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  const desired = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
  );
  return new Date(guess.getTime() + (desired - asUtc));
}
