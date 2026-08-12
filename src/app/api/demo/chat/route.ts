import { z } from "zod";

import { getDemoIndustry } from "@/config/demo-industries";
import { getRequestId, logError, logInfo } from "@/lib/logging";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { runDemoChat } from "@/services/demo/demo-chat-service";

export const runtime = "nodejs";

const schema = z.object({
  industryId: z.enum(["beauty", "auto", "construction", "tavswebs"]),
  message: z.string().trim().min(1).max(800),
  locale: z.enum(["lv", "en"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      }),
    )
    .max(12)
    .optional(),
});

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const ip = clientIp(request);

  const rl = checkRateLimit({
    key: `demo-chat:${ip}`,
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec, requestId },
      {
        status: 429,
        headers: {
          "Retry-After": String(rl.retryAfterSec),
          "x-request-id": requestId,
        },
      },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json(
      { error: "invalid_json", requestId },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success || !getDemoIndustry(parsed.data.industryId)) {
    return Response.json(
      { error: "invalid_input", requestId },
      { status: 400, headers: { "x-request-id": requestId } },
    );
  }

  try {
    const result = await runDemoChat({
      industryId: parsed.data.industryId,
      message: parsed.data.message,
      locale: parsed.data.locale,
      history: parsed.data.history,
    });
    logInfo("demo.chat", {
      requestId,
      industryId: parsed.data.industryId,
      usedAi: result.usedAi,
    });
    return Response.json(
      { ...result, requestId },
      { headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    logError("demo.chat_failed", {
      requestId,
      message: error instanceof Error ? error.message : "unknown",
    });
    return Response.json(
      { error: "demo_failed", requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
