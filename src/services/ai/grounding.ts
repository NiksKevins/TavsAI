import type { PromptBusiness } from "@/services/ai/prompt-builder";

/** Quick-action / short intent chips that often miss pure vector similarity. */
const CONTACT_RE =
  /\b(kontakti?|kontaktinformācij|tālrun|talrun|telefons?|e-?pasts?|adrese?|email|phone|contact|where\s+are\s+you|kur\s+jūs)\b/i;
const HOURS_RE =
  /\b(darba\s+laiks|working\s+hours|opening\s+hours|hours|kad\s+esat\s+atv[eē]rti|open(?:ing)?)\b/i;
const PRICE_RE =
  /\b(cenas?|cen[aā]|price|pricing|cost|cik\s+maks[aā]|maksa)\b/i;
const SERVICE_RE =
  /\b(pakalpojum[ui]?|services?|ko\s+jūs\s+pied[aā]v[aā]jat|what\s+do\s+you\s+offer)\b/i;

export function isContactIntent(message: string): boolean {
  return CONTACT_RE.test(message.trim());
}

export function isHoursIntent(message: string): boolean {
  return HOURS_RE.test(message.trim());
}

export function isPriceIntent(message: string): boolean {
  return PRICE_RE.test(message.trim());
}

export function isServiceIntent(message: string): boolean {
  return SERVICE_RE.test(message.trim());
}

/** Expand short chip queries so embeddings align with synced knowledge text. */
export function expandRetrievalQuery(query: string): string {
  const q = query.trim();
  if (!q) return q;

  const extras: string[] = [];
  if (isContactIntent(q) || /^kontakti$/i.test(q)) {
    extras.push(
      "kontakti contact phone tālrunis telefons email e-pasts address adrese",
    );
  }
  if (isHoursIntent(q) || /^darba\s+laiks$/i.test(q)) {
    extras.push("darba laiks opening hours working hours open");
  }
  if (isPriceIntent(q) || /^cenas?$/i.test(q)) {
    extras.push("cenas price pricing cost pakalpojumi services");
  }
  if (isServiceIntent(q) || /^pakalpojumi$/i.test(q)) {
    extras.push("pakalpojumi services piedāvājums offer description");
  }

  if (extras.length === 0) return q;
  return `${q}\n${extras.join(" ")}`;
}

export function businessHasGroundedFacts(business: PromptBusiness): boolean {
  return Boolean(
    business.phone ||
      business.email ||
      business.address ||
      business.city ||
      business.websiteUrl ||
      business.openingHours ||
      (business.services && business.services.length > 0),
  );
}

/** True when empty RAG should still run the LLM using profile / services. */
export function canAnswerWithoutRetrieval(
  message: string,
  business: PromptBusiness,
): boolean {
  if (!businessHasGroundedFacts(business)) return false;
  const q = message.trim();
  if (q.split(/\s+/).length <= 4) return true;
  return (
    isContactIntent(q) ||
    isHoursIntent(q) ||
    isPriceIntent(q) ||
    isServiceIntent(q)
  );
}
