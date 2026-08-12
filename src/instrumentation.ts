/**
 * Optional Sentry wiring. Loads only when SENTRY_DSN is set.
 * Install `@sentry/nextjs` in production to enable.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;

  try {
    // Dynamic string avoids a hard compile dependency when the package is absent.
    const sentryPackage = ["@sentry", "nextjs"].join("/");
    const Sentry = (await import(/* webpackIgnore: true */ sentryPackage)) as {
      init: (opts: Record<string, unknown>) => void;
    };
    Sentry.init({
      dsn,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "sentry.init_failed",
        message: error instanceof Error ? error.message : "unknown",
      }),
    );
  }
}
