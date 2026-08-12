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

/** Detect when a visitor is leaving contact info as a short free-text message. */
export function extractContactHint(message: string): {
  phone?: string;
  email?: string;
} | null {
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 80) return null;

  const emailMatch = trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
  if (emailMatch) return { email: emailMatch[0] };

  const digits = trimmed.replace(/[^\d+]/g, "");
  const phoneLike =
    /^[+\d][\d\s()-]{5,}$/.test(trimmed) &&
    digits.replace(/\D/g, "").length >= 7 &&
    digits.replace(/\D/g, "").length <= 15;

  if (phoneLike) return { phone: trimmed };

  return null;
}
