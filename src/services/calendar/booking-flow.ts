import type { Locale, Prisma } from "@prisma/client";

import { extractContactHint } from "@/lib/widget/security";
import { prisma } from "@/lib/db";
import { getActiveCalendarIntegration } from "@/services/calendar/connection-service";
import {
  BOOKING_CONFIRMED_MESSAGE_EN,
  BOOKING_CONFIRMED_MESSAGE_LV,
  BOOKING_FAILURE_MESSAGE_EN,
  BOOKING_FAILURE_MESSAGE_LV,
  type TimeSlot,
} from "@/services/calendar/types";
import {
  appendMessage,
  getOrCreateConversation,
} from "@/services/conversation/conversation-service";

export type BookingStep =
  | "idle"
  | "ask_service"
  | "ask_time"
  | "offer_slots"
  | "collect_details"
  | "creating"
  | "done";

export type BookingState = {
  step: BookingStep;
  service?: string;
  preferredHint?: string;
  offeredSlots?: { start: string; end: string }[];
  selectedSlot?: { start: string; end: string };
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  appointmentId?: string;
};

export type BookingTurnResult = {
  handled: boolean;
  conversationId: string;
  answer: string;
  showLeadForm?: boolean;
  appointmentId?: string;
  status?: string;
};

const BOOKING_INTENT =
  /(pierakst|pieteikt|vizīt|rezervēt|book(ing)?|appointment|schedule)/i;

export function isBookingIntent(message: string): boolean {
  return BOOKING_INTENT.test(message);
}

function readBookingState(meta: unknown): BookingState {
  if (!meta || typeof meta !== "object") return { step: "idle" };
  const booking = (meta as { booking?: BookingState }).booking;
  if (!booking || typeof booking !== "object") return { step: "idle" };
  return { ...booking, step: booking.step ?? "idle" };
}

async function writeBookingState(
  conversationId: string,
  existingMeta: unknown,
  booking: BookingState | null,
) {
  const base =
    existingMeta && typeof existingMeta === "object"
      ? { ...(existingMeta as Record<string, unknown>) }
      : {};
  if (booking) base.booking = booking;
  else delete base.booking;
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { visitorMetadata: base as Prisma.InputJsonValue },
  });
}

function formatSlot(slot: TimeSlot, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "lv-LV", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(slot.start);
}

function parseDayHint(message: string, now = new Date()): { from: Date; to: Date } | null {
  const lower = message.toLowerCase();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const addDays = (n: number) => {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() + n);
    return d;
  };

  if (/šodien|today/i.test(lower)) {
    return { from: addDays(0), to: addDays(1) };
  }
  if (/rīt|tomorrow/i.test(lower)) {
    return { from: addDays(1), to: addDays(2) };
  }
  if (/piektdien|friday/i.test(lower)) {
    return windowForWeekday(now, 5);
  }
  if (/pirmdien|monday/i.test(lower)) return windowForWeekday(now, 1);
  if (/otrdien|tuesday/i.test(lower)) return windowForWeekday(now, 2);
  if (/trešdien|wednesday/i.test(lower)) return windowForWeekday(now, 3);
  if (/ceturtdien|thursday/i.test(lower)) return windowForWeekday(now, 4);
  if (/sestdien|saturday/i.test(lower)) return windowForWeekday(now, 6);
  if (/svētdien|sunday/i.test(lower)) return windowForWeekday(now, 0);
  if (/nākam|next\s+week/i.test(lower)) {
    return { from: addDays(7), to: addDays(14) };
  }
  // ISO-ish date
  const iso = message.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) {
    const d = new Date(`${iso[1]}T00:00:00`);
    if (!Number.isNaN(d.getTime())) {
      const end = new Date(d);
      end.setDate(end.getDate() + 1);
      return { from: d, to: end };
    }
  }
  return null;
}

function windowForWeekday(now: Date, target: number) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  let delta = (target - day + 7) % 7;
  if (delta === 0) delta = 7; // next occurrence if today
  const from = new Date(start);
  from.setDate(from.getDate() + delta);
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

function extractService(message: string): string | null {
  const m = message.match(
    /(?:pakalpojums|service|uz|for)\s*[:\-]?\s*(.{2,80})/i,
  );
  if (m?.[1]) return m[1].trim();
  // If message is short and not pure booking phrase, treat as service name
  if (
    message.trim().length >= 2 &&
    message.trim().length <= 80 &&
    !isBookingIntent(message) &&
    !/\d{1,2}[:.]\d{2}/.test(message)
  ) {
    return message.trim();
  }
  return null;
}

function matchOfferedSlot(
  message: string,
  offered: { start: string; end: string }[],
  timeZone: string,
  locale: Locale,
): { start: string; end: string } | null {
  if (!offered.length) return null;
  if (/^1\b|pirmo|first/i.test(message.trim())) return offered[0] ?? null;
  if (/^2\b|otro|second/i.test(message.trim())) return offered[1] ?? null;
  if (/^3\b|trešo|third/i.test(message.trim())) return offered[2] ?? null;

  const timeMatch = message.match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/);
  if (timeMatch) {
    const hhmm = `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    const hit = offered.find((s) => {
      const label = formatSlot(
        { start: new Date(s.start), end: new Date(s.end) },
        locale,
        timeZone,
      );
      return label.includes(hhmm) || s.start.includes(`T${hhmm}`);
    });
    if (hit) return hit;
  }

  // Exact ISO paste
  const iso = offered.find((s) => message.includes(s.start));
  return iso ?? null;
}

/**
 * Deterministic booking turn. Returns handled=false when AI should answer normally.
 * Never invents availability — slots come only from CalendarIntegration.
 */
export async function maybeHandleBookingTurn(params: {
  workspaceId: string;
  message: string;
  conversationId?: string | null;
  visitorId?: string | null;
  locale?: Locale;
}): Promise<BookingTurnResult | null> {
  const locale = params.locale ?? "lv";
  const calendar = await getActiveCalendarIntegration(params.workspaceId);

  const conversation = await getOrCreateConversation({
    workspaceId: params.workspaceId,
    conversationId: params.conversationId,
    visitorId: params.visitorId,
    locale,
  });

  let state = readBookingState(conversation.visitorMetadata);
  const intent = isBookingIntent(params.message);
  const inFlow = state.step !== "idle" && state.step !== "done";

  if (!intent && !inFlow) return null;

  await appendMessage({
    workspaceId: params.workspaceId,
    conversationId: conversation.id,
    role: "VISITOR",
    content: params.message,
  });

  const failMsg =
    locale === "en" ? BOOKING_FAILURE_MESSAGE_EN : BOOKING_FAILURE_MESSAGE_LV;
  const confirmMsg =
    locale === "en"
      ? BOOKING_CONFIRMED_MESSAGE_EN
      : BOOKING_CONFIRMED_MESSAGE_LV;

  if (!calendar) {
    const answer =
      locale === "en"
        ? "Online booking is not connected yet. I can collect your details so the team can confirm a time — would you like to leave your contact information?"
        : "Tiešsaistes pieraksts vēl nav pieslēgts. Varu saglabāt jūsu kontaktus, lai komanda apstiprinātu laiku — vai vēlaties atstāt kontaktinformāciju?";
    await appendMessage({
      workspaceId: params.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { booking: true, reason: "no_calendar" },
    });
    return {
      handled: true,
      conversationId: conversation.id,
      answer,
      showLeadForm: true,
    };
  }

  const { adapter, config, provider } = calendar;
  const tz = config.timezone;

  // Restart
  if (intent && (state.step === "idle" || state.step === "done")) {
    state = { step: "ask_service" };
  }

  let answer = "";

  if (state.step === "ask_service") {
    const service =
      extractService(params.message) ||
      (intent ? null : params.message.trim()) ||
      null;
    // First turn often only has booking intent + day — ask service unless clear
    if (!service || isBookingIntent(service)) {
      // maybe day was mentioned on first message
      const day = parseDayHint(params.message);
      if (day) state.preferredHint = params.message;
      answer =
        locale === "en"
          ? "Which service would you like to book?"
          : "Kādu pakalpojumu vēlaties pieteikt?";
      state.step = "ask_service";
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return { handled: true, conversationId: conversation.id, answer };
    }
    state.service = service;
    state.step = "ask_time";
    if (!state.preferredHint) {
      const day = parseDayHint(params.message);
      if (day) state.preferredHint = params.message;
    }
  }

  if (state.step === "ask_time") {
    const day =
      parseDayHint(params.message) ||
      (state.preferredHint ? parseDayHint(state.preferredHint) : null);
    if (!day) {
      answer =
        locale === "en"
          ? "What day works for you? (e.g. Friday, tomorrow, or 2026-08-15)"
          : "Kura diena jums der? (piem., piektdien, rīt, vai 2026-08-15)";
      state.step = "ask_time";
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return { handled: true, conversationId: conversation.id, answer };
    }

    state.preferredHint = params.message;
    try {
      const slots = await adapter.listAvailableSlots({
        from: day.from,
        to: day.to,
        durationMinutes: config.slotDurationMinutes,
        timezone: tz,
        limit: 5,
      });
      if (!slots.length) {
        answer =
          locale === "en"
            ? "I checked the calendar — there are no open slots that day. Want to try another day?"
            : "Pārbaudīju kalendāru — tajā dienā nav brīvu laiku. Vai izmēģināsim citu dienu?";
        state.step = "ask_time";
        state.offeredSlots = [];
        await writeBookingState(conversation.id, conversation.visitorMetadata, state);
        await appendAssistant(params.workspaceId, conversation.id, answer, state);
        return { handled: true, conversationId: conversation.id, answer };
      }
      state.offeredSlots = slots.map((s) => ({
        start: s.start.toISOString(),
        end: s.end.toISOString(),
      }));
      state.step = "offer_slots";
      const lines = slots.map(
        (s, i) => `${i + 1}) ${formatSlot(s, locale, tz)}`,
      );
      answer =
        locale === "en"
          ? `Available times from the calendar:\n${lines.join("\n")}\nReply with a number (1-${slots.length}) or the time.`
          : `Pieejamie laiki no kalendāra:\n${lines.join("\n")}\nAtbildiet ar numuru (1-${slots.length}) vai laiku.`;
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return { handled: true, conversationId: conversation.id, answer };
    } catch (error) {
      console.error("[booking/slots]", error);
      answer = failMsg;
      state = { step: "idle" };
      await writeBookingState(conversation.id, conversation.visitorMetadata, null);
      await appendAssistant(params.workspaceId, conversation.id, answer, {
        step: "idle",
      });
      return {
        handled: true,
        conversationId: conversation.id,
        answer,
        showLeadForm: true,
      };
    }
  }

  if (state.step === "offer_slots") {
    const selected = matchOfferedSlot(
      params.message,
      state.offeredSlots ?? [],
      tz,
      locale,
    );
    if (!selected) {
      answer =
        locale === "en"
          ? "Please choose one of the listed times (e.g. 1 or 10:30)."
          : "Lūdzu, izvēlieties kādu no piedāvātajiem laikiem (piem., 1 vai 10:30).";
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return { handled: true, conversationId: conversation.id, answer };
    }
    state.selectedSlot = selected;
    state.step = "collect_details";
  }

  if (state.step === "collect_details") {
    const hint = extractContactHint(params.message);
    if (hint?.email) state.customerEmail = hint.email;
    if (hint?.phone) state.customerPhone = hint.phone;
    if (hint?.name) state.customerName = hint.name;
    const nameMatch = params.message.match(
      /(?:mani sauc|my name is|vārds)\s*[:\-]?\s*([A-Za-zĀ-žā-ž][A-Za-zĀ-žā-ž\s'-]{1,60})/i,
    );
    if (!state.customerName && nameMatch?.[1]) {
      state.customerName = nameMatch[1].trim();
    } else if (
      !state.customerName &&
      !hint?.email &&
      !hint?.phone &&
      params.message.trim().split(/\s+/).length <= 4 &&
      !/\d/.test(params.message)
    ) {
      state.customerName = params.message.trim();
    }

    const missing: string[] = [];
    if (!state.customerName) missing.push(locale === "en" ? "name" : "vārdu");
    if (!state.customerPhone && !state.customerEmail) {
      missing.push(locale === "en" ? "phone or email" : "telefonu vai e-pastu");
    }
    if (missing.length) {
      answer =
        locale === "en"
          ? `To confirm the booking I need your ${missing.join(" and ")}.`
          : `Lai apstiprinātu pierakstu, lūdzu, norādiet ${missing.join(" un ")}.`;
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return { handled: true, conversationId: conversation.id, answer };
    }

    // Create PENDING then confirm via provider
    const start = new Date(state.selectedSlot!.start);
    const end = new Date(state.selectedSlot!.end);
    const appointment = await prisma.appointment.create({
      data: {
        workspaceId: params.workspaceId,
        conversationId: conversation.id,
        status: "PENDING",
        service: state.service,
        startTime: start,
        endTime: end,
        customerName: state.customerName,
        customerEmail: state.customerEmail,
        customerPhone: state.customerPhone,
        title: state.service
          ? `${state.service} — ${state.customerName}`
          : `Appointment — ${state.customerName}`,
        provider,
      },
    });

    try {
      const created = await adapter.createEvent({
        title: appointment.title || "Appointment",
        description: [
          state.service ? `Service: ${state.service}` : null,
          state.customerPhone ? `Phone: ${state.customerPhone}` : null,
          `Conversation: ${conversation.id}`,
        ]
          .filter(Boolean)
          .join("\n"),
        start,
        end,
        attendeeEmail: state.customerEmail,
        attendeeName: state.customerName,
        timezone: tz,
      });

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "CONFIRMED",
          externalEventId: created.externalEventId,
        },
      });

      state.step = "done";
      state.appointmentId = appointment.id;
      await writeBookingState(conversation.id, conversation.visitorMetadata, state);
      answer = `${confirmMsg}\n${formatSlot({ start, end }, locale, tz)}${
        state.service ? ` · ${state.service}` : ""
      }`;
      await appendAssistant(params.workspaceId, conversation.id, answer, state);
      return {
        handled: true,
        conversationId: conversation.id,
        answer,
        appointmentId: appointment.id,
        status: "CONFIRMED",
      };
    } catch (error) {
      console.error("[booking/create]", error);
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          status: "FAILED",
          failureReason:
            error instanceof Error ? error.message.slice(0, 500) : "unknown",
        },
      });
      state = { step: "idle" };
      await writeBookingState(conversation.id, conversation.visitorMetadata, null);
      await appendAssistant(params.workspaceId, conversation.id, failMsg, {
        step: "idle",
      });
      return {
        handled: true,
        conversationId: conversation.id,
        answer: failMsg,
        showLeadForm: true,
        appointmentId: appointment.id,
        status: "FAILED",
      };
    }
  }

  // Fallback: continue asking service
  answer =
    locale === "en"
      ? "Which service would you like to book?"
      : "Kādu pakalpojumu vēlaties pieteikt?";
  state.step = "ask_service";
  await writeBookingState(conversation.id, conversation.visitorMetadata, state);
  await appendAssistant(params.workspaceId, conversation.id, answer, state);
  return { handled: true, conversationId: conversation.id, answer };
}

async function appendAssistant(
  workspaceId: string,
  conversationId: string,
  content: string,
  state: BookingState,
) {
  await appendMessage({
    workspaceId,
    conversationId,
    role: "ASSISTANT",
    content,
    metadata: { booking: true, step: state.step },
  });
}
