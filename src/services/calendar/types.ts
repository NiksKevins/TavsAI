export type CalendarProvider =
  | "google"
  | "outlook"
  | "calendly"
  | "custom";

export type TimeSlot = {
  start: Date;
  end: Date;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  attendeeEmail?: string | null;
  attendeeName?: string | null;
  timezone: string;
};

export type CreateCalendarEventResult = {
  externalEventId: string;
  htmlLink?: string | null;
};

export type ListSlotsInput = {
  from: Date;
  to: Date;
  durationMinutes: number;
  timezone: string;
  /** Max slots to return (never invent — only from freebusy + working hours). */
  limit?: number;
};

/**
 * Calendar provider adapter. Implementations must return only real availability.
 * Never fabricate free slots.
 */
export interface CalendarIntegration {
  readonly provider: CalendarProvider;
  listAvailableSlots(input: ListSlotsInput): Promise<TimeSlot[]>;
  createEvent(input: CreateCalendarEventInput): Promise<CreateCalendarEventResult>;
  cancelEvent(externalEventId: string): Promise<void>;
}

export type CalendarConnectionConfig = {
  calendarId: string;
  timezone: string;
  slotDurationMinutes: number;
  /** Working hours local to timezone, 24h "HH:MM". */
  workingHours: Partial<
    Record<
      "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun",
      { start: string; end: string }
    >
  >;
};

export const DEFAULT_CALENDAR_CONFIG: CalendarConnectionConfig = {
  calendarId: "primary",
  timezone: "Europe/Riga",
  slotDurationMinutes: 30,
  workingHours: {
    mon: { start: "09:00", end: "17:00" },
    tue: { start: "09:00", end: "17:00" },
    wed: { start: "09:00", end: "17:00" },
    thu: { start: "09:00", end: "17:00" },
    fri: { start: "09:00", end: "17:00" },
  },
};

export const BOOKING_FAILURE_MESSAGE_LV =
  "Atvainojiet, rezervāciju šobrīd neizdevās apstiprināt. Vai vēlaties atstāt savu kontaktinformāciju?";

export const BOOKING_FAILURE_MESSAGE_EN =
  "Sorry, we could not confirm the booking right now. Would you like to leave your contact details?";

export const BOOKING_CONFIRMED_MESSAGE_LV =
  "Jūsu vizīte ir apstiprināta.";

export const BOOKING_CONFIRMED_MESSAGE_EN =
  "Your appointment is confirmed.";
