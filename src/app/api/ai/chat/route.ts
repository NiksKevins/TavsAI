import { z } from "zod";

import { auth } from "@/auth";
import {
  isQuoteRequest,
  matchesCustomHandoffRules,
  parseHandoffTriggers,
} from "@/config/assistant";
import { assistantAnswerRequestsContact } from "@/lib/chat/lead-form-intent";
import { prisma } from "@/lib/db";
import { getRequestId, logInfo } from "@/lib/logging";
import { clientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  extractContactHint,
  isHandoffRequest,
  isOriginDenied,
  optionsResponse,
  widgetCorsHeaders,
} from "@/lib/widget/security";
import {
  generateAssistantReply,
  streamAssistantReply,
} from "@/services/ai/ai-service";
import { maybeHandleBookingTurn } from "@/services/calendar/booking-flow";
import { maybeProcessLeadAfterChat } from "@/services/leads/after-chat";

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  conversationId: z.string().uuid().optional().nullable(),
  visitorId: z.string().max(120).optional().nullable(),
  locale: z.enum(["lv", "en"]).optional(),
  stream: z.boolean().optional().default(true),
  publicKey: z.string().uuid().optional(),
});

async function resolveWorkspace(input: {
  publicKey?: string;
}): Promise<{ workspaceId: string; allowedOrigins: string[] } | null> {
  if (input.publicKey) {
    const widget = await prisma.widgetConfiguration.findUnique({
      where: { publicKey: input.publicKey },
      select: {
        workspaceId: true,
        isActive: true,
        allowedOrigins: true,
      },
    });
    if (!widget?.isActive) return null;
    return {
      workspaceId: widget.workspaceId,
      allowedOrigins: widget.allowedOrigins,
    };
  }

  const session = await auth();
  if (!session?.user?.id) return null;

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, workspace: { deletedAt: null } },
    orderBy: { createdAt: "asc" },
    select: { workspaceId: true },
  });
  if (!membership) return null;
  return { workspaceId: membership.workspaceId, allowedOrigins: [] };
}

export async function OPTIONS(request: Request) {
  return optionsResponse(request.headers.get("origin"), []);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestId = getRequestId(request);
  logInfo("chat.request", { requestId, hasOrigin: Boolean(origin) });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json", requestId },
      {
        status: 400,
        headers: {
          ...Object.fromEntries(widgetCorsHeaders(origin, []).entries()),
          "x-request-id": requestId,
        },
      },
    );
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_input" },
      { status: 400, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const resolved = await resolveWorkspace({
    publicKey: parsed.data.publicKey,
  });
  if (!resolved) {
    return Response.json(
      { error: "unauthorized" },
      { status: 401, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const cors = widgetCorsHeaders(origin, resolved.allowedOrigins);
  if (parsed.data.publicKey && isOriginDenied(origin, cors)) {
    return Response.json(
      { error: "origin_not_allowed" },
      { status: 403, headers: cors },
    );
  }

  const rl = checkRateLimit({
    key: `widget-chat:${clientIp(request)}:${parsed.data.publicKey ?? resolved.workspaceId}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec, requestId },
      {
        status: 429,
        headers: {
          ...Object.fromEntries(cors.entries()),
          "Retry-After": String(rl.retryAfterSec),
          "x-request-id": requestId,
        },
      },
    );
  }

  const assistant = await prisma.assistantConfiguration.findUnique({
    where: { workspaceId: resolved.workspaceId },
  });
  const triggers = parseHandoffTriggers(assistant?.handoffTriggers);
  const handoffEnabled = assistant?.handoffEnabled !== false;

  // Appointment booking (deterministic; never invents slots)
  try {
    const booking = await maybeHandleBookingTurn({
      workspaceId: resolved.workspaceId,
      message: parsed.data.message,
      conversationId: parsed.data.conversationId,
      visitorId: parsed.data.visitorId,
      locale: parsed.data.locale,
    });
    if (booking?.handled) {
      const body = {
        conversationId: booking.conversationId,
        answer: booking.answer,
        usedFallback: false,
        retrievedCount: 0,
        handoff: false,
        showLeadForm: Boolean(booking.showLeadForm),
        booking: true,
        appointmentId: booking.appointmentId,
        appointmentStatus: booking.status,
      };
      if (!parsed.data.stream) {
        return Response.json(body, { headers: cors });
      }
      return sseReply(cors, {
        handoff: false,
        answer: booking.answer,
        conversationId: booking.conversationId,
        showLeadForm: Boolean(booking.showLeadForm),
      });
    }
  } catch (error) {
    console.error("[ai/chat/booking]", error);
  }

  const handoff =
    handoffEnabled &&
    ((triggers.customerAsksHuman && isHandoffRequest(parsed.data.message)) ||
      (triggers.requestsQuote && isQuoteRequest(parsed.data.message)) ||
      (triggers.customRules &&
        matchesCustomHandoffRules(
          parsed.data.message,
          assistant?.handoffCustomRules,
        )));

  const contactHint = extractContactHint(parsed.data.message);
  const payload = {
    workspaceId: resolved.workspaceId,
    message: parsed.data.message,
    conversationId: parsed.data.conversationId,
    visitorId: parsed.data.visitorId,
    locale: parsed.data.locale,
  };

  if (contactHint && !handoff) {
    try {
      const hasContact =
        Boolean(contactHint.email) || Boolean(contactHint.phone);
      const result = await handleContactCaptureReply({
        ...payload,
        contactHint,
      });
      await maybeProcessLeadAfterChat({
        workspaceId: resolved.workspaceId,
        conversationId: result.conversationId,
        locale: payload.locale,
        source: "contact_hint",
        contactOverride: contactHint,
      });
      // Ask for the form only when we still need confirmation / missing fields.
      const showLeadForm = !hasContact || !contactHint.name;
      const body = {
        ...result,
        handoff: false,
        showLeadForm,
        contactHint,
      };
      if (!parsed.data.stream) {
        return Response.json(body, { headers: cors });
      }
      return sseReply(cors, {
        handoff: false,
        answer: result.answer,
        conversationId: result.conversationId,
        showLeadForm,
        contactHint,
      });
    } catch (error) {
      console.error("[ai/chat/contact]", error);
      return Response.json(
        { error: "chat_failed" },
        { status: 500, headers: cors },
      );
    }
  }

  if (handoff) {
    try {
      const result = await handleHandoffReply(payload);
      await maybeProcessLeadAfterChat({
        workspaceId: resolved.workspaceId,
        conversationId: result.conversationId,
        locale: payload.locale,
        forceHandoff: true,
        source: "handoff",
      });
      if (!parsed.data.stream) {
        return Response.json(
          {
            ...result,
            handoff: true,
            showLeadForm: true,
          },
          { headers: cors },
        );
      }

      return sseReply(cors, {
        handoff: true,
        answer: result.answer,
        conversationId: result.conversationId,
        showLeadForm: true,
      });
    } catch (error) {
      console.error("[ai/chat/handoff]", error);
      return Response.json(
        { error: "chat_failed" },
        { status: 500, headers: cors },
      );
    }
  }

  if (!parsed.data.stream) {
    try {
      const result = await generateAssistantReply(payload);
      if (result.upgradeRequired) {
        return Response.json(
          {
            ...result,
            handoff: false,
            showLeadForm: false,
            upgradeRequired: true,
          },
          { status: 402, headers: cors },
        );
      }
      const shouldHandoffFallback =
        handoffEnabled &&
        triggers.cannotAnswer &&
        result.usedFallback &&
        !result.upgradeRequired;
      if (shouldHandoffFallback) {
        await prisma.conversation.update({
          where: { id: result.conversationId },
          data: { status: "HANDED_OFF" },
        });
      }
      const leadResult = await maybeProcessLeadAfterChat({
        workspaceId: resolved.workspaceId,
        conversationId: result.conversationId,
        locale: payload.locale,
        source: shouldHandoffFallback ? "handoff_fallback" : "ai_intent",
        forceHandoff: shouldHandoffFallback,
      });
      return Response.json(
        {
          ...result,
          handoff: shouldHandoffFallback,
          showLeadForm:
            Boolean(result.usedFallback) ||
            Boolean(leadResult?.extraction.hasPurchaseIntent) ||
            shouldHandoffFallback ||
            assistantAnswerRequestsContact(result.answer),
          leadId: leadResult?.leadId,
        },
        { headers: cors },
      );
    } catch (error) {
      console.error("[ai/chat]", error);
      return Response.json(
        { error: "chat_failed" },
        { status: 500, headers: cors },
      );
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      try {
        send("start", { ok: true, handoff: false });
        const result = await streamAssistantReply(payload, (token) => {
          send("token", { token });
        });
        if (result.upgradeRequired) {
          send("done", {
            conversationId: result.conversationId,
            answer: result.answer,
            usedFallback: true,
            retrievedCount: 0,
            handoff: false,
            showLeadForm: false,
            upgradeRequired: true,
            usage: result.usage,
          });
          return;
        }
        const shouldHandoffFallback =
          handoffEnabled && triggers.cannotAnswer && result.usedFallback;
        if (shouldHandoffFallback) {
          await prisma.conversation.update({
            where: { id: result.conversationId },
            data: { status: "HANDED_OFF" },
          });
        }
        const leadResult = await maybeProcessLeadAfterChat({
          workspaceId: resolved.workspaceId,
          conversationId: result.conversationId,
          locale: payload.locale,
          source: shouldHandoffFallback ? "handoff_fallback" : "ai_intent",
          forceHandoff: shouldHandoffFallback,
        });
        send("done", {
          conversationId: result.conversationId,
          answer: result.answer,
          usedFallback: result.usedFallback,
          retrievedCount: result.retrievedCount,
          handoff: shouldHandoffFallback,
          showLeadForm:
            Boolean(result.usedFallback) ||
            Boolean(leadResult?.extraction.hasPurchaseIntent) ||
            shouldHandoffFallback ||
            assistantAnswerRequestsContact(result.answer),
          leadId: leadResult?.leadId,
        });
      } catch (error) {
        console.error("[ai/chat/stream]", error);
        send("error", { error: "stream_failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...Object.fromEntries(cors.entries()),
    },
  });
}

function sseReply(
  cors: Headers,
  data: {
    handoff: boolean;
    answer: string;
    conversationId: string;
    showLeadForm: boolean;
    contactHint?: { name?: string; phone?: string; email?: string };
  },
) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, payload: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
      };
      send("start", { ok: true, handoff: data.handoff });
      send("token", { token: data.answer });
      send("done", {
        conversationId: data.conversationId,
        answer: data.answer,
        usedFallback: false,
        retrievedCount: 0,
        handoff: data.handoff,
        showLeadForm: data.showLeadForm,
        contactHint: data.contactHint,
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      ...Object.fromEntries(cors.entries()),
    },
  });
}

async function handleContactCaptureReply(payload: {
  workspaceId: string;
  message: string;
  conversationId?: string | null;
  visitorId?: string | null;
  locale?: "lv" | "en";
  contactHint?: { name?: string; phone?: string; email?: string };
}) {
  const { getOrCreateConversation, appendMessage } = await import(
    "@/services/conversation/conversation-service"
  );

  const locale = payload.locale ?? "lv";
  const hint = payload.contactHint;
  const hasContact = Boolean(hint?.email || hint?.phone);
  const firstName = hint?.name?.trim().split(/\s+/)[0];

  let answer: string;
  if (hasContact && hint?.name) {
    answer =
      locale === "en"
        ? `Thanks${firstName ? `, ${firstName}` : ""}! We'll be in touch soon to go over the details.`
        : `Paldies${firstName ? `, ${firstName}` : ""}! Drīzumā sazināsimies, lai precizētu detaļas.`;
  } else if (hasContact) {
    answer =
      locale === "en"
        ? "Thanks — please confirm your name below so the team can get back to you."
        : "Paldies — lūdzu, apstipriniet vārdu zemāk, un komanda sazināsies ar jums.";
  } else {
    answer =
      locale === "en"
        ? "Thanks — please confirm your details below and the team will get back to you."
        : "Paldies — lūdzu, apstipriniet kontaktus zemāk, un komanda sazināsies ar jums.";
  }

  const conversation = await getOrCreateConversation({
    workspaceId: payload.workspaceId,
    conversationId: payload.conversationId,
    visitorId: payload.visitorId,
    locale,
  });

  await appendMessage({
    workspaceId: payload.workspaceId,
    conversationId: conversation.id,
    role: "VISITOR",
    content: payload.message,
  });
  await appendMessage({
    workspaceId: payload.workspaceId,
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: answer,
    metadata: { contactCapture: true },
  });

  return {
    conversationId: conversation.id,
    answer,
    usedFallback: false,
    retrievedCount: 0,
  };
}

async function handleHandoffReply(payload: {
  workspaceId: string;
  message: string;
  conversationId?: string | null;
  visitorId?: string | null;
  locale?: "lv" | "en";
}) {
  const { getOrCreateConversation, appendMessage } = await import(
    "@/services/conversation/conversation-service"
  );

  const locale = payload.locale ?? "lv";
  const assistant = await prisma.assistantConfiguration.findUnique({
    where: { workspaceId: payload.workspaceId },
  });

  const answer =
    locale === "en"
      ? assistant?.handoffMessageEn ||
        "I can connect you with the team. Please leave your contact details."
      : assistant?.handoffMessageLv ||
        "Varu savienot jūs ar komandu. Lūdzu, atstājiet kontaktus.";

  const conversation = await getOrCreateConversation({
    workspaceId: payload.workspaceId,
    conversationId: payload.conversationId,
    visitorId: payload.visitorId,
    locale,
  });

  await appendMessage({
    workspaceId: payload.workspaceId,
    conversationId: conversation.id,
    role: "VISITOR",
    content: payload.message,
  });
  await appendMessage({
    workspaceId: payload.workspaceId,
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: answer,
    metadata: { handoff: true },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { status: "HANDED_OFF" },
  });

  await prisma.notification.create({
    data: {
      workspaceId: payload.workspaceId,
      channel: "IN_APP",
      title: "Handoff pieprasījums",
      body: payload.message.slice(0, 200),
      payload: { conversationId: conversation.id, type: "handoff" },
    },
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: payload.workspaceId,
      action: "UPDATE",
      entityType: "Conversation",
      entityId: conversation.id,
      metadata: { event: "handoff_requested" },
    },
  });

  return {
    conversationId: conversation.id,
    answer,
    usedFallback: false,
    retrievedCount: 0,
  };
}
