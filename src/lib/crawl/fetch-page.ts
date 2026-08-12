import http from "node:http";
import https from "node:https";

import { CRAWL_CONFIG } from "@/config/crawl";
import {
  assertSafePublicUrl,
  isPrivateOrReservedIp,
  UnsafeUrlError,
} from "@/lib/crawl/url-safety";

export type FetchedPage = {
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
};

export class FetchPageError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "timeout"
      | "too_large"
      | "unsafe_redirect"
      | "http_error"
      | "network"
      | "unsupported_type",
  ) {
    super(message);
    this.name = "FetchPageError";
  }
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch a single page with SSRF checks on every redirect hop,
 * DNS IP pinning (anti-rebinding), size limits, and timeouts.
 */
export async function fetchPage(url: string): Promise<FetchedPage> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= CRAWL_CONFIG.maxRetries) {
    try {
      return await fetchOnce(url);
    } catch (error) {
      lastError = error;
      const retryable =
        error instanceof FetchPageError &&
        (error.code === "timeout" ||
          error.code === "network" ||
          error.code === "http_error");
      if (!retryable || attempt === CRAWL_CONFIG.maxRetries) break;
      await sleep(CRAWL_CONFIG.retryBackoffMs * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new FetchPageError("fetch_failed", "network");
}

async function fetchOnce(startUrl: string): Promise<FetchedPage> {
  let resolved = await assertSafePublicUrl(startUrl);
  let current = resolved.url.toString();
  let addresses = resolved.addresses;
  let redirects = 0;

  while (redirects <= CRAWL_CONFIG.maxRedirects) {
    const response = await pinnedRequest(current, addresses);

    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers["location"];
      const loc = Array.isArray(location) ? location[0] : location;
      if (!loc) {
        throw new FetchPageError("redirect_missing_location", "unsafe_redirect");
      }
      let next: URL;
      try {
        next = new URL(loc, current);
      } catch {
        throw new FetchPageError("bad_redirect", "unsafe_redirect");
      }
      try {
        resolved = await assertSafePublicUrl(next.toString());
        current = resolved.url.toString();
        addresses = resolved.addresses;
      } catch (error) {
        if (error instanceof UnsafeUrlError) {
          throw new FetchPageError(error.message, "unsafe_redirect");
        }
        throw error;
      }
      redirects += 1;
      continue;
    }

    if (response.status >= 500) {
      throw new FetchPageError(`http_${response.status}`, "http_error");
    }
    if (response.status >= 400) {
      throw new FetchPageError(`http_${response.status}`, "http_error");
    }

    const contentType = String(response.headers["content-type"] ?? "");
    if (
      contentType &&
      !/text\/html|application\/xhtml\+xml/i.test(contentType)
    ) {
      throw new FetchPageError("unsupported_type", "unsupported_type");
    }

    const lengthHeader = response.headers["content-length"];
    const length = Array.isArray(lengthHeader)
      ? Number(lengthHeader[0])
      : Number(lengthHeader);
    if (length && length > CRAWL_CONFIG.maxResponseBytes) {
      throw new FetchPageError("too_large", "too_large");
    }

    if (response.body.length > CRAWL_CONFIG.maxResponseBytes) {
      throw new FetchPageError("too_large", "too_large");
    }

    return {
      finalUrl: current,
      status: response.status,
      contentType,
      html: response.body.toString("utf8"),
    };
  }

  throw new FetchPageError("too_many_redirects", "unsafe_redirect");
}

type PinnedResponse = {
  status: number;
  headers: http.IncomingHttpHeaders;
  body: Buffer;
};

/**
 * Connect to a pre-resolved public IP while presenting the original Host/SNI.
 * Prevents DNS rebinding between validation and TCP connect.
 */
function pinnedRequest(
  urlString: string,
  addresses: string[],
): Promise<PinnedResponse> {
  const url = new URL(urlString);
  const ip = addresses.find((a) => !isPrivateOrReservedIp(a));
  if (!ip) {
    return Promise.reject(new FetchPageError("no_safe_ip", "network"));
  }

  const isHttps = url.protocol === "https:";
  const port = url.port
    ? Number(url.port)
    : isHttps
      ? 443
      : 80;
  const path = `${url.pathname}${url.search}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      req.destroy(new Error("timeout"));
    }, CRAWL_CONFIG.requestTimeoutMs);

    const options: https.RequestOptions = {
      host: ip,
      port,
      path,
      method: "GET",
      headers: {
        Host: url.host,
        "User-Agent": CRAWL_CONFIG.userAgent,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "lv,en;q=0.8",
        Connection: "close",
      },
      servername: url.hostname,
      agent: false,
      lookup: (_hostname, _opts, cb) => {
        // Force the pinned address — never re-resolve.
        const family = ip.includes(":") ? 6 : 4;
        cb(null, ip, family);
      },
    };

    const lib = isHttps ? https : http;
    const req = lib.request(options, (res) => {
      const chunks: Buffer[] = [];
      let total = 0;
      res.on("data", (chunk: Buffer) => {
        total += chunk.length;
        if (total > CRAWL_CONFIG.maxResponseBytes) {
          clearTimeout(timer);
          req.destroy();
          reject(new FetchPageError("too_large", "too_large"));
          return;
        }
        chunks.push(chunk);
      });
      res.on("end", () => {
        clearTimeout(timer);
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    });

    req.on("error", (error) => {
      clearTimeout(timer);
      if ((error as Error).message === "timeout") {
        reject(new FetchPageError("timeout", "timeout"));
      } else {
        reject(new FetchPageError("network", "network"));
      }
    });

    req.end();
  });
}
