import { z } from "zod";

import { getDemoIndustry } from "@/config/demo-industries";
import { getRequestId, logInfo } from "@/lib/logging";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  industryId: z.enum(["beauty", "auto", "construction"]),
  name: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .min(5)
    .max(40)
    .regex(/^[+\d\s()-]+$/),
  email: z.string().trim().email().optional().or(z.literal("")),
  note: z.string().trim().max(400).optional(),
});

/**
 * Marketing demo lead capture — validated + rate-limited.
 * Does not write to customer workspaces (demo-only acknowledgment).
 */
export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const rl = checkRateLimit({
    key: `demo-lead:${clientIp(request)}`,
    limit: 8,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec, requestId },
      { status: 429, headers: { "x-request-id": requestId } },
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

  logInfo("demo.lead", {
    requestId,
    industryId: parsed.data.industryId,
    // Do not log PII beyond hashed length signals
    nameLen: parsed.data.name.length,
    phoneLen: parsed.data.phone.length,
  });

  return Response.json(
    {
      ok: true,
      requestId,
      message: "lead_received",
    },
    { headers: { "x-request-id": requestId } },
  );
}
