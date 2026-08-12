import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Neon Marketplace on Vercel often prefixes vars (`storage_*`).
 * Prefer a real remote URL over a leftover localhost DATABASE_URL.
 */
function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.storage_POSTGRES_PRISMA_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.storage_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.storage_POSTGRES_URL,
    process.env.storage_DATABASE_URL_UNPOOLED,
    process.env.storage_POSTGRES_URL_NON_POOLING,
  ];

  const remote = candidates.find(
    (url) =>
      Boolean(url) &&
      url !== "[SENSITIVE]" &&
      !/localhost|127\.0\.0\.1/i.test(url!),
  );
  if (remote) return remote;

  // Local docker / dev fallback
  return candidates.find((url) => Boolean(url) && url !== "[SENSITIVE]");
}

const resolved = resolveDatabaseUrl();
if (resolved) {
  process.env.DATABASE_URL = resolved;
}

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
}

/**
 * After `prisma generate`, a long-lived Next.js process can keep an old
 * PrismaClient on globalThis that is missing newly added delegates.
 */
function isStaleClient(client: PrismaClient): boolean {
  const c = client as unknown as Record<string, { count?: unknown } | undefined>;
  return (
    typeof c.assistantConfigurationVersion?.count !== "function" ||
    typeof c.processedStripeEvent?.count !== "function" ||
    typeof c.partnerMember?.count !== "function" ||
    typeof c.partnerWorkspace?.count !== "function" ||
    typeof c.commission?.count !== "function"
  );
}

const existing = globalForPrisma.prisma;
if (existing && isStaleClient(existing)) {
  void existing.$disconnect().catch(() => undefined);
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
