/**
 * Founder / operator accounts — full PRO entitlements without Stripe.
 * Set FOUNDER_EMAILS=you@example.com,other@example.com on Vercel to extend.
 */
const BUILTIN_FOUNDER_EMAILS = ["nikskevinsm@gmail.com"] as const;

export function founderEmails(): Set<string> {
  const raw =
    process.env.FOUNDER_EMAILS ?? process.env.UNLIMITED_ACCOUNT_EMAILS ?? "";
  const set = new Set<string>(BUILTIN_FOUNDER_EMAILS);
  for (const part of raw.split(",")) {
    const email = part.trim().toLowerCase();
    if (email) set.add(email);
  }
  return set;
}

export function isFounderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return founderEmails().has(email.trim().toLowerCase());
}

/** Effectively unlimited for operator use. */
export const FOUNDER_CRAWL_PAGE_LIMIT = 10_000;
export const FOUNDER_CONVERSATION_LIMIT = 1_000_000;
