import type { Lead } from "@prisma/client";

const BRAND = {
  blue: "#3b82f6",
  blueDark: "#2563eb",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
  white: "#ffffff",
  soft: "#eff6ff",
};

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function dash(value: string | null | undefined) {
  const v = value?.trim();
  return v ? escapeHtml(v) : "—";
}

function row(label: string, valueHtml: string) {
  return `
    <tr>
      <td style="padding:10px 0;width:132px;vertical-align:top;font-size:13px;color:${BRAND.muted};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:10px 0;vertical-align:top;font-size:14px;color:${BRAND.ink};font-family:Segoe UI,Helvetica,Arial,sans-serif;font-weight:600;line-height:1.45;">
        ${valueHtml}
      </td>
    </tr>`;
}

function sourceLabel(source: string | null | undefined) {
  switch (source) {
    case "widget_lead_form":
      return "Widget forma";
    case "widget_handoff":
      return "Widget handoff";
    case "contact_hint":
      return "Kontakti čatā";
    case "handoff":
    case "handoff_fallback":
      return "Handoff";
    case "ai_intent":
      return "AI nodoms";
    default:
      return source?.trim() || "Čats";
  }
}

export function buildNewLeadEmail(params: {
  lead: Lead;
  businessName: string;
  dashboardUrl: string;
  conversationUrl?: string | null;
  extraFields?: { key: string; value: string }[];
  locale?: "lv" | "en";
}): { subject: string; html: string; text: string } {
  const locale = params.locale ?? "lv";
  const lead = params.lead;
  const name = lead.name?.trim() || (locale === "en" ? "Unnamed lead" : "Bez vārda");
  const contact = [lead.phone, lead.email].filter(Boolean).join(" · ") || "—";
  const copy =
    locale === "en"
      ? {
          subject: `New lead — ${name}`,
          eyebrow: "New lead",
          title: "You received a new lead",
          intro: `A potential customer reached out via your ${params.businessName} assistant.`,
          customer: "Customer",
          contact: "Contact",
          service: "Service",
          intent: "Intent",
          summary: "Summary",
          source: "Source",
          open: "Open in dashboard",
          conversation: "View conversation",
          footer: "Sent by TavsWebs Bot · Lead notifications",
        }
      : {
          subject: `Jauns leads — ${name}`,
          eyebrow: "Jauns leads",
          title: "Saņēmāt jaunu leadu",
          intro: `Potenciālais klients sazinājās caur ${params.businessName} asistentu.`,
          customer: "Klients",
          contact: "Kontakti",
          service: "Pakalpojums",
          intent: "Nodoms",
          summary: "Kopsavilkums",
          source: "Avots",
          open: "Atvērt panelī",
          conversation: "Skatīt sarunu",
          footer: "Nosūtīja TavsWebs Bot · Lead paziņojumi",
        };

  const extraRows = (params.extraFields ?? [])
    .filter((f) => f.value.trim())
    .map((f) => row(f.key, dash(f.value)))
    .join("");

  const summaryBlock = lead.summary?.trim()
    ? `
      <tr>
        <td colspan="2" style="padding-top:8px;">
          <div style="margin-top:4px;padding:14px 16px;border-radius:12px;background:${BRAND.bg};border:1px solid ${BRAND.border};font-size:14px;line-height:1.55;color:${BRAND.ink};font-family:Segoe UI,Helvetica,Arial,sans-serif;font-weight:400;">
            ${escapeHtml(lead.summary.trim())}
          </div>
        </td>
      </tr>`
    : "";

  const conversationCta = params.conversationUrl
    ? `
      <a href="${escapeHtml(params.conversationUrl)}"
         style="display:inline-block;margin-left:8px;padding:12px 18px;border-radius:10px;border:1px solid ${BRAND.border};background:${BRAND.white};color:${BRAND.ink};text-decoration:none;font-size:14px;font-weight:600;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
        ${escapeHtml(copy.conversation)}
      </a>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${BRAND.white};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.blue} 0%,${BRAND.blueDark} 100%);padding:22px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <div style="display:inline-block;width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);text-align:center;line-height:36px;color:#fff;font-weight:700;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;">
                      T
                    </div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600;">
                      ${escapeHtml(copy.eyebrow)}
                    </div>
                    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:18px;color:#fff;font-weight:700;margin-top:2px;">
                      TavsWebs Bot
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 8px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:22px;line-height:1.25;color:${BRAND.ink};font-weight:700;">
                ${escapeHtml(copy.title)}
              </h1>
              <p style="margin:0 0 22px;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:${BRAND.muted};">
                ${escapeHtml(copy.intro)}
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BRAND.border};border-radius:14px;background:${BRAND.soft};">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.blueDark};font-weight:700;margin-bottom:6px;">
                      ${escapeHtml(copy.customer)}
                    </div>
                    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:20px;color:${BRAND.ink};font-weight:700;margin-bottom:4px;">
                      ${escapeHtml(name)}
                    </div>
                    <div style="font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:${BRAND.muted};">
                      ${escapeHtml(contact)}
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-collapse:collapse;">
                ${row(copy.service, dash(lead.service))}
                ${row(copy.intent, dash(lead.intent))}
                ${row(copy.source, escapeHtml(sourceLabel(lead.source)))}
                ${extraRows}
                <tr>
                  <td style="padding:14px 0 6px;font-size:13px;color:${BRAND.muted};font-family:Segoe UI,Helvetica,Arial,sans-serif;" colspan="2">
                    ${escapeHtml(copy.summary)}
                  </td>
                </tr>
                ${summaryBlock}
              </table>

              <div style="margin-top:26px;">
                <a href="${escapeHtml(params.dashboardUrl)}"
                   style="display:inline-block;padding:12px 18px;border-radius:10px;background:${BRAND.blue};color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;font-family:Segoe UI,Helvetica,Arial,sans-serif;">
                  ${escapeHtml(copy.open)}
                </a>
                ${conversationCta}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 22px;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;font-family:Segoe UI,Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};">
                ${escapeHtml(copy.footer)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    copy.title,
    "",
    `${copy.customer}: ${name}`,
    `${copy.contact}: ${contact}`,
    `${copy.service}: ${lead.service || "—"}`,
    `${copy.intent}: ${lead.intent || "—"}`,
    `${copy.source}: ${sourceLabel(lead.source)}`,
    `${copy.summary}: ${lead.summary || "—"}`,
    "",
    `${copy.open}: ${params.dashboardUrl}`,
    params.conversationUrl
      ? `${copy.conversation}: ${params.conversationUrl}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: copy.subject, html, text };
}
