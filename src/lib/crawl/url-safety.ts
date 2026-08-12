import { lookup } from "dns/promises";
import { isIP } from "net";

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "localhost.localdomain",
  "metadata.google.internal",
  "metadata",
  "metadata.google",
]);

/** Cloud metadata / link-local targets that must never be crawled. */
const BLOCKED_EXACT_IPS = new Set([
  "169.254.169.254",
  "169.254.170.2",
  "fd00:ec2::254",
]);

export function isPrivateOrReservedIp(ip: string): boolean {
  if (BLOCKED_EXACT_IPS.has(ip.toLowerCase())) return true;

  const v4 = ip.includes(".") && !ip.includes(":");

  if (v4) {
    const parts = ip.split(".").map((p) => Number(p));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
    const [a, b] = parts;
    if (a === 0) return true; // 0.0.0.0/8
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 127) return true; // loopback
    if (a === 169 && b === 254) return true; // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast / reserved
    return false;
  }

  const normalized = ip.toLowerCase();
  if (normalized === "::1" || normalized === "::") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
  if (normalized.startsWith("fe80")) return true; // link-local
  if (normalized.startsWith("ff")) return true; // multicast
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateOrReservedIp(mapped[1]);
  return false;
}

export function normalizeWebsiteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new UnsafeUrlError("empty_url");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    throw new UnsafeUrlError("invalid_url");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("unsupported_protocol");
  }

  url.hash = "";
  url.username = "";
  url.password = "";
  url.hostname = url.hostname.toLowerCase();

  if (
    (url.protocol === "http:" && url.port === "80") ||
    (url.protocol === "https:" && url.port === "443")
  ) {
    url.port = "";
  }

  let pathname = url.pathname;
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  url.pathname = pathname || "/";

  return url.toString().replace(/\/$/, "") || url.origin;
}

export function getRegistrableHost(url: URL): string {
  return url.hostname.toLowerCase();
}

export type SafeUrlResolution = {
  url: URL;
  /** Public A/AAAA addresses resolved at validation time (for IP pinning). */
  addresses: string[];
};

/**
 * Validate URL + SSRF checks. Returns resolved public IPs for pinned fetch
 * (mitigates DNS rebinding TOCTOU).
 */
export async function assertSafePublicUrl(raw: string): Promise<SafeUrlResolution> {
  const normalized = normalizeWebsiteUrl(raw);
  const url = new URL(normalized);

  if (!url.hostname || !url.hostname.includes(".")) {
    if (BLOCKED_HOSTNAMES.has(url.hostname)) {
      throw new UnsafeUrlError("blocked_hostname");
    }
    throw new UnsafeUrlError("invalid_hostname");
  }

  if (BLOCKED_HOSTNAMES.has(url.hostname)) {
    throw new UnsafeUrlError("blocked_hostname");
  }

  if (url.hostname.endsWith(".local") || url.hostname.endsWith(".internal")) {
    throw new UnsafeUrlError("blocked_hostname");
  }

  if (isIP(url.hostname)) {
    if (isPrivateOrReservedIp(url.hostname)) {
      throw new UnsafeUrlError("private_ip");
    }
    return { url, addresses: [url.hostname] };
  }

  let records: { address: string; family: number }[];
  try {
    records = await lookup(url.hostname, { all: true, verbatim: true });
  } catch {
    throw new UnsafeUrlError("dns_failed");
  }

  if (!records.length) {
    throw new UnsafeUrlError("dns_failed");
  }

  const addresses: string[] = [];
  for (const record of records) {
    if (isPrivateOrReservedIp(record.address)) {
      throw new UnsafeUrlError("private_ip");
    }
    addresses.push(record.address);
  }

  return { url, addresses };
}

export function isSameHost(a: URL, b: URL): boolean {
  return getRegistrableHost(a) === getRegistrableHost(b);
}

export function normalizeCrawlUrl(href: string, base: URL): string | null {
  try {
    const url = new URL(href, base);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!isSameHost(url, base)) return null;
    url.hash = "";
    url.username = "";
    url.password = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach(
      (p) => url.searchParams.delete(p),
    );
    let path = url.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    url.pathname = path || "/";
    return url.toString().replace(/\/$/, "") || url.origin;
  } catch {
    return null;
  }
}
