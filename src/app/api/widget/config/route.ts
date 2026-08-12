import { prisma } from "@/lib/db";
import { clientIp, checkRateLimit } from "@/lib/rate-limit";
import {
  isOriginDenied,
  optionsResponse,
  widgetCorsHeaders,
} from "@/lib/widget/security";

export async function OPTIONS(request: Request) {
  return optionsResponse(request.headers.get("origin"), []);
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const publicKey = new URL(request.url).searchParams.get("publicKey");

  if (!publicKey) {
    return Response.json(
      { error: "missing_public_key" },
      { status: 400, headers: widgetCorsHeaders(origin, []) },
    );
  }

  const rl = checkRateLimit({
    key: `widget-config:${clientIp(request)}:${publicKey}`,
    limit: 60,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      {
        status: 429,
        headers: {
          ...Object.fromEntries(widgetCorsHeaders(origin, []).entries()),
          "Retry-After": String(rl.retryAfterSec),
        },
      },
    );
  }

  const widget = await prisma.widgetConfiguration.findUnique({
    where: { publicKey },
    include: {
      workspace: {
        select: {
          name: true,
          primaryLocale: true,
          assistantConfiguration: {
            select: {
              name: true,
              greetingLv: true,
              greetingEn: true,
              handoffMessageLv: true,
              handoffMessageEn: true,
              collectLeads: true,
            },
          },
          businessInformation: {
            select: { displayName: true },
          },
        },
      },
    },
  });

  if (!widget || !widget.isActive) {
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

  await prisma.widgetConfiguration.update({
    where: { id: widget.id },
    data: { lastLoadedAt: new Date() },
  });

  const assistant = widget.workspace.assistantConfiguration;
  const locale = widget.workspace.primaryLocale;

  return Response.json(
    {
      publicKey: widget.publicKey,
      isActive: widget.isActive,
      primaryColor: widget.primaryColor,
      position: widget.position,
      theme: widget.theme,
      borderRadius: widget.borderRadius,
      logoUrl: widget.logoUrl || widget.avatarUrl,
      launcherText:
        locale === "en"
          ? widget.launcherTextEn || widget.launcherTextLv || "Chat"
          : widget.launcherTextLv || widget.launcherTextEn || "Sarakste",
      assistantName: assistant?.name || "AI darbinieks",
      businessName:
        widget.workspace.businessInformation?.displayName ||
        widget.workspace.name,
      welcomeMessage:
        locale === "en"
          ? widget.welcomeMessageEn ||
            assistant?.greetingEn ||
            "Hello! How can I help?"
          : widget.welcomeMessageLv ||
            assistant?.greetingLv ||
            "Sveiki! Kā varu palīdzēt?",
      quickActions: widget.quickActions,
      leadFormEnabled: widget.leadFormEnabled && (assistant?.collectLeads ?? true),
      leadFields: widget.leadFields ?? [
        { key: "name", labelLv: "Vārds", labelEn: "Name", required: true },
        { key: "phone", labelLv: "Tālrunis", labelEn: "Phone", required: true },
        { key: "email", labelLv: "E-pasts", labelEn: "Email", required: false },
      ],
      handoffMessage:
        locale === "en"
          ? assistant?.handoffMessageEn ||
            "I can connect you with the team. Please leave your contact details."
          : assistant?.handoffMessageLv ||
            "Varu savienot jūs ar komandu. Lūdzu, atstājiet kontaktus.",
      locale,
    },
    { headers: cors },
  );
}
