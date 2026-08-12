import { z } from "zod";

import { prisma } from "@/lib/db";
import { clientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  isOriginDenied,
  optionsResponse,
  widgetCorsHeaders,
} from "@/lib/widget/security";
import { upsertLead } from "@/services/leads/lead-service";

const schema = z.object({
  publicKey: z.string().uuid(),
  conversationId: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^[+\d\s()-]+$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  extra: z.record(z.string()).optional(),
  handoff: z.boolean().optional(),
  service: z.string().trim().max(200).optional(),
  summary: z.string().trim().max(1000).optional(),
});

export async function OPTIONS(request: Request) {
  return optionsResponse(request.headers.get("origin"), []);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json" },
      { status: 400, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const widget = await prisma.widgetConfiguration.findUnique({
    where: { publicKey: parsed.data.publicKey },
  });
  if (!widget?.isActive) {
    return Response.json(
      { error: "widget_not_found" },
      { status: 404, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const cors = widgetCorsHeaders(origin, widget.allowedOrigins);
  if (isOriginDenied(origin, cors)) {
    return Response.json(
      { error: "origin_not_allowed" },
      { status: 403, headers: cors },
    );
  }

  const rl = checkRateLimit({
    key: `widget-lead:${clientIp(request)}:${widget.publicKey}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      {
        status: 429,
        headers: {
          ...Object.fromEntries(cors.entries()),
          "Retry-After": String(rl.retryAfterSec),
        },
      },
    );
  }

  const { lead } = await upsertLead({
    workspaceId: widget.workspaceId,
    conversationId: parsed.data.conversationId || null,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    service: parsed.data.service || null,
    summary: parsed.data.summary || null,
    source: parsed.data.handoff ? "widget_handoff" : "widget_lead_form",
    status: parsed.data.handoff ? "QUALIFIED" : "NEW",
    fields: parsed.data.extra,
    notify: true,
  });

  if (parsed.data.handoff && parsed.data.conversationId) {
    await prisma.conversation.updateMany({
      where: {
        id: parsed.data.conversationId,
        workspaceId: widget.workspaceId,
      },
      data: { status: "HANDED_OFF" },
    });
  }

  return Response.json({ ok: true, leadId: lead.id }, { headers: cors });
}
