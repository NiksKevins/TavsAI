import { NextResponse } from "next/server";
import { z } from "zod";

import { runCrawlJob } from "@/lib/crawl/run-crawl-job";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  crawlJobId: z.string().uuid(),
});

/**
 * Internal crawl worker. Invoked from `enqueueCrawlJob` so website indexing
 * can run longer than a typical server-action timeout.
 */
export async function POST(request: Request) {
  const secret = process.env.CRAWL_WORKER_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "misconfigured" }, { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    await runCrawlJob(parsed.data.crawlJobId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/crawl/run]", error);
    return NextResponse.json({ error: "crawl_failed" }, { status: 500 });
  }
}
