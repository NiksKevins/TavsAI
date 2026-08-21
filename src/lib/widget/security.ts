import { NextResponse } from "next/server";

/** Normalize a URL or origin string to `https://host` form, or null. */
export function originFromUrl(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(value.trim())
      ? value.trim()
      : `https://${value.trim()}`;
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/**
 * Combine explicit widget allow-list with the business website origin so
 * the primary site works without a second copy-paste step.
 */
export function resolveWidgetAllowedOrigins(
  allowed: string[],
  websiteUrl?: string | null,
  publicKey?: string | null,
): string[] {
  const fromList = allowed
    .map((o) => originFromUrl(o))
    .filter((o): o is string => Boolean(o));
  const fromSite = originFromUrl(websiteUrl);
  const fromFirstParty =
    publicKey && FIRST_PARTY_WIDGET_ORIGINS[publicKey]
      ? FIRST_PARTY_WIDGET_ORIGINS[publicKey]
      : [];
  return Array.from(
    new Set([
      ...fromList,
      ...(fromSite ? [fromSite] : []),
      ...fromFirstParty,
    ]),
  );
}

/** First-party marketing embeds (TavsWebs.com ↔ this bot workspace). */
const FIRST_PARTY_WIDGET_ORIGINS: Record<string, string[]> = {
  "78080731-2def-414c-aed5-497531cd06d5": [
    "https://tavswebs.com",
    "https://www.tavswebs.com",
  ],
};

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

  // Never treat "*" as reflect-any-origin (open CORS).
  if (allowed.includes(origin)) {
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

/** Validate widget parent page origin against workspace allow-list. */
export function isParentOriginAllowed(
  parentOrigin: string | null | undefined,
  allowed: string[],
): boolean {
  if (!parentOrigin || parentOrigin === "*") return false;
  let origin: string;
  try {
    origin = new URL(parentOrigin).origin;
  } catch {
    return false;
  }

  const concrete = allowed.filter((o) => o && o !== "*");
  if (concrete.length === 0) {
    // Allow-list not configured yet — permit embed (operators should set origins).
    return true;
  }
  return concrete.includes(origin);
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
  if (!email && !phone) {
    // Name-only intros: "Mani sauc Jānis" / "My name is Jane"
    const intro = trimmed.match(
      /^(?:mani\s+sauc|man\s+vārds(?:\s+ir)?|es\s+esmu|my\s+name\s+is|i'?m)\s+(.+)$/i,
    );
    if (intro?.[1]) {
      const name = intro[1].replace(/[,.!?;:].*$/, "").trim();
      if (
        name.length >= 2 &&
        name.length <= 80 &&
        name.split(/\s+/).length <= 6 &&
        /[a-zA-Zāčēģīķļņšūž]/i.test(name)
      ) {
        return { name };
      }
    }
    return null;
  }

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
