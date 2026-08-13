import { NextResponse } from "next/server";

export function widgetCorsHeaders(origin: string | null, allowed: string[]) {
  const headers = new Headers();
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Access-Control-Max-Age", "86400");

  // No browser Origin → non-CORS clients (curl/server). Do not reflect *.
  if (!origin) {
    return headers;
  }

  // Empty allow-list must NOT mean "allow all" (default was open CORS — High risk).
  if (allowed.length === 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    if (appUrl) {
      try {
        if (origin === new URL(appUrl).origin) {
          headers.set("Access-Control-Allow-Origin", origin);
        }
      } catch {
        /* ignore */
      }
    }
    return headers;
  }

  if (allowed.includes("*") || allowed.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

/** True when a browser Origin was sent but is not allowed to read the response. */
export function isOriginDenied(
  origin: string | null,
  corsHeaders: Headers,
): boolean {
  return Boolean(origin && !corsHeaders.get("Access-Control-Allow-Origin"));
}

export function optionsResponse(origin: string | null, allowed: string[]) {
  return new NextResponse(null, {
    status: 204,
    headers: widgetCorsHeaders(origin, allowed),
  });
}

export const HANDOFF_PATTERNS = [
  /runāt ar cilvēku/i,
  /runat ar cilveku/i,
  /dzīvu konsultantu/i,
  /dzivu konsultantu/i,
  /human/i,
  /real person/i,
  /speak to (a )?human/i,
  /talk to (a )?(person|agent|human)/i,
];

export function isHandoffRequest(message: string): boolean {
  return HANDOFF_PATTERNS.some((pattern) => pattern.test(message));
}

/** Detect when a visitor is leaving contact info as a free-text message. */
export function extractContactHint(message: string): {
  name?: string;
  phone?: string;
  email?: string;
} | null {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 240) return null;

  const email =
    trimmed.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? undefined;
  const phoneMatch = trimmed.match(/(?:\+?\d[\d\s()-]{5,}\d)/);
  const phone = phoneMatch?.[0]?.trim() || undefined;

  // Pure email / phone only.
  if (email && trimmed === email) return { email };
  const digitsOnly = trimmed.replace(/[^\d+]/g, "");
  if (
    !email &&
    phone &&
    /^[+\d][\d\s()-]{5,}$/.test(trimmed) &&
    digitsOnly.replace(/\D/g, "").length >= 7 &&
    digitsOnly.replace(/\D/g, "").length <= 15
  ) {
    return { phone: trimmed };
  }

  // Combined dumps like: "Niks Kevins, niks@x.com, 25547113"
  if (!email && !phone) return null;

  let namePart = trimmed;
  if (email) namePart = namePart.replace(email, " ");
  if (phone) namePart = namePart.replace(phone, " ");
  namePart = namePart
    .replace(/[,;|/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Avoid treating full sentences as a name.
  const wordCount = namePart ? namePart.split(/\s+/).length : 0;
  const name =
    namePart.length >= 2 &&
    namePart.length <= 80 &&
    wordCount <= 6 &&
    /[a-zA-Zāčēģīķļņšūž]/i.test(namePart) &&
    !/\?$/.test(namePart)
      ? namePart
      : undefined;

  return {
    ...(name ? { name } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}
