import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getRequestId, logInfo } from "@/lib/logging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const started = Date.now();

  let db: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = "error";
  }

  const body = {
    status: db === "ok" ? "ok" : "degraded",
    db,
    uptimeSec: Math.floor(process.uptime()),
    requestId,
    timestamp: new Date().toISOString(),
  };

  logInfo("health.check", { requestId, db, ms: Date.now() - started });

  return NextResponse.json(body, {
    status: db === "ok" ? 200 : 503,
    headers: {
      "x-request-id": requestId,
      "Cache-Control": "no-store",
    },
  });
}
