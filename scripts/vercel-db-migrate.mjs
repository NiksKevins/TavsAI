#!/usr/bin/env node
/**
 * On Vercel builds, map Neon Marketplace `storage_*` URLs onto DATABASE_URL
 * and apply pending Prisma migrations. Sensitive values are only available
 * in the Vercel build environment (not via `vercel env pull` / `env run`).
 */
import { spawnSync } from "node:child_process";

function resolveDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.storage_DATABASE_URL_UNPOOLED,
    process.env.storage_POSTGRES_URL_NON_POOLING,
    process.env.storage_POSTGRES_PRISMA_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.storage_DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.storage_POSTGRES_URL,
  ];

  const remote = candidates.find(
    (url) =>
      Boolean(url) &&
      url !== "[SENSITIVE]" &&
      !/localhost|127\.0\.0\.1/i.test(url),
  );
  if (remote) return remote;

  return candidates.find((url) => Boolean(url) && url !== "[SENSITIVE]");
}

if (!process.env.VERCEL) {
  process.exit(0);
}

const resolved = resolveDatabaseUrl();
if (!resolved) {
  console.error(
    "[vercel-db-migrate] No DATABASE_URL / storage_* Postgres URL found.",
  );
  process.exit(1);
}

if (/localhost|127\.0\.0\.1/i.test(resolved)) {
  console.error(
    "[vercel-db-migrate] Refusing to migrate against localhost on Vercel.",
  );
  process.exit(1);
}

process.env.DATABASE_URL = resolved;

console.log("[vercel-db-migrate] Running prisma migrate deploy…");
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
