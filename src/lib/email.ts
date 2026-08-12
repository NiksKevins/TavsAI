import { Resend } from "resend";

let client: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export function emailFromAddress() {
  return process.env.EMAIL_FROM?.trim() || "Bot <bot@tavswebs.com>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ ok: boolean; id?: string; skipped?: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email] RESEND_API_KEY missing — skipping send", {
        to: params.to,
        subject: params.subject,
      });
    }
    return { ok: true, skipped: true };
  }

  try {
    const result = await resend.emails.send({
      from: emailFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
    if (result.error) {
      console.error("[email] send failed", result.error);
      return { ok: false, error: result.error.message };
    }
    return { ok: true, id: result.data?.id };
  } catch (error) {
    console.error("[email] send exception", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "send_failed",
    };
  }
}
