import { randomUUID } from "crypto";

export function getRequestId(request?: Request): string {
  const fromHeader = request?.headers.get("x-request-id")?.trim();
  if (fromHeader && fromHeader.length <= 80) return fromHeader;
  return randomUUID();
}

export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      level: "info",
      event,
      ts: new Date().toISOString(),
      ...fields,
    }),
  );
}

export function logError(event: string, fields: Record<string, unknown> = {}) {
  console.error(
    JSON.stringify({
      level: "error",
      event,
      ts: new Date().toISOString(),
      ...fields,
    }),
  );
}
