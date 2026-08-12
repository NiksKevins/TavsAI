import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
