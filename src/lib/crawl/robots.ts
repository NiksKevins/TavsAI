import http from "node:http";
import https from "node:https";
import robotsParser from "robots-parser";

import { CRAWL_CONFIG } from "@/config/crawl";
import { assertSafePublicUrl } from "@/lib/crawl/url-safety";

export type RobotsGate = {
  isAllowed: (url: string) => boolean;
  crawlDelayMs: number;
};

export async function loadRobotsTxt(originUrl: URL): Promise<RobotsGate> {
  const robotsUrl = new URL("/robots.txt", originUrl.origin).toString();

  try {
    const resolved = await assertSafePublicUrl(robotsUrl);
    const ip = resolved.addresses[0];
    if (!ip) return allowAll();
    const url = resolved.url;
    const body = await pinnedTextGet(url, ip);
    if (body.length > 200_000) return allowAll();

    const robots = robotsParser(robotsUrl, body);
    const delaySec = robots.getCrawlDelay?.(CRAWL_CONFIG.userAgent) ?? 0;
    return {
      isAllowed: (target: string) =>
        robots.isAllowed(target, CRAWL_CONFIG.userAgent) !== false,
      crawlDelayMs: Math.min(Math.max(0, Number(delaySec) * 1000), 5_000),
    };
  } catch {
    return allowAll();
  }
}

function pinnedTextGet(url: URL, ip: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        host: ip,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: {
          Host: url.host,
          "User-Agent": CRAWL_CONFIG.userAgent,
        },
        servername: url.hostname,
        lookup: (_h, _o, cb) => cb(null, ip, ip.includes(":") ? 6 : 4),
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );
    req.setTimeout(CRAWL_CONFIG.requestTimeoutMs, () => {
      req.destroy();
      reject(new Error("timeout"));
    });
    req.on("error", reject);
    req.end();
  });
}

function allowAll(): RobotsGate {
  return { isAllowed: () => true, crawlDelayMs: 0 };
}
