import type { IndustryTemplate, Locale } from "@prisma/client";
import { z } from "zod";

import {
  DEFAULT_MIN_LEAD_CRITERIA,
  qualificationForIndustry,
  type MinLeadCriteria,
  type QualificationQuestion,
} from "@/config/leads";
import { AI_CONFIG } from "@/config/ai";
import { getOpenAIClient, hasOpenAIKey } from "@/services/ai/openai-client";

export type LeadExtraction = {
  hasPurchaseIntent: boolean;
  isSpam: boolean;
  intent: string | null;
  service: string | null;
  summary: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  fields: Record<string, string>;
  missingQuestions: string[];
  confidence: number;
};

const INTENT_PATTERNS = [
  /vajag\s+(jaunu\s+)?(mājaslapu|saiti|web)/i,
  /need\s+(a\s+)?(new\s+)?website/i,
  /want\s+to\s+book/i,
  /vēlos\s+(pieteikt|pierakstīt|rezervēt)/i,
  /gribu\s+(pierakstīties|pieteikt)/i,
  /book\s+a\s+(haircut|appointment|visit)/i,
  /how much.*(renovat|cost|price)/i,
  /cik\s+(maksā|izmaksā)/i,
  /renovat/i,
  /diagnostics?/i,
  /diagnostik/i,
  /bring\s+my\s+\w+/i,
  /atvest\s+(savu\s+)?/i,
  /bmw|audi|mercedes|toyota|volkswagen/i,
  /suspension|bremz|eļļ|riep/i,
  /haircut|frizūr|manikīr|masāž/i,
  /remont|būvniec|vannasistab/i,
  /interested\s+in/i,
  /interesē\s+(par|iespēja)/i,
  /quote|tāme|estimate/i,
];

const FAQ_PATTERNS = [
  /darba\s+laiks/i,
  /opening\s+hours/i,
  /kur\s+jūs\s+atrod/i,
  /where\s+are\s+you/i,
  /adrese/i,
  /address/i,
  /e-?pasts/i,
  /phone\s+number/i,
  /kontakti?/i,
];

const SPAM_PATTERNS = [
  /(.)\1{8,}/,
  /https?:\/\/\S+/i,
  /\b(viagra|crypto\s*pump|seo\s*backlink)\b/i,
];

const extractionSchema = z.object({
  hasPurchaseIntent: z.boolean(),
  isSpam: z.boolean().default(false),
  intent: z.string().nullable(),
  service: z.string().nullable(),
  summary: z.string().nullable(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fields: z.record(z.string()).default({}),
  missingQuestions: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
});

export function heuristicIntent(text: string): boolean {
  if (FAQ_PATTERNS.some((p) => p.test(text)) && !INTENT_PATTERNS.some((p) => p.test(text))) {
    return false;
  }
  return INTENT_PATTERNS.some((p) => p.test(text));
}

export function heuristicSpam(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (SPAM_PATTERNS.some((p) => p.test(trimmed))) return true;
  const letters = trimmed.replace(/[^a-zA-ZāčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/g, "");
  if (letters.length >= 12 && new Set(letters.toLowerCase()).size <= 3) return true;
  return false;
}

export function parseMinCriteria(raw: unknown): MinLeadCriteria {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_MIN_LEAD_CRITERIA };
  const o = raw as Record<string, unknown>;
  return {
    requireIntent:
      typeof o.requireIntent === "boolean"
        ? o.requireIntent
        : DEFAULT_MIN_LEAD_CRITERIA.requireIntent,
    requireContact:
      typeof o.requireContact === "boolean"
        ? o.requireContact
        : DEFAULT_MIN_LEAD_CRITERIA.requireContact,
    requireName:
      typeof o.requireName === "boolean"
        ? o.requireName
        : DEFAULT_MIN_LEAD_CRITERIA.requireName,
    requireService:
      typeof o.requireService === "boolean"
        ? o.requireService
        : DEFAULT_MIN_LEAD_CRITERIA.requireService,
  };
}

export function parseQualificationQuestions(
  raw: unknown,
  industry?: IndustryTemplate | null,
): QualificationQuestion[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const o = item as Record<string, unknown>;
        if (typeof o.key !== "string") return null;
        return {
          key: o.key,
          labelLv: typeof o.labelLv === "string" ? o.labelLv : o.key,
          labelEn: typeof o.labelEn === "string" ? o.labelEn : o.key,
          required: Boolean(o.required),
        } satisfies QualificationQuestion;
      })
      .filter(Boolean) as QualificationQuestion[];
  }
  return qualificationForIndustry(industry);
}

export function meetsLeadCriteria(
  extraction: LeadExtraction,
  criteria: MinLeadCriteria,
): boolean {
  if (extraction.isSpam) return false;
  if (criteria.requireIntent && !extraction.hasPurchaseIntent) return false;
  if (criteria.requireName && !extraction.name?.trim()) return false;
  if (criteria.requireService && !extraction.service?.trim()) return false;
  if (criteria.requireContact) {
    const phone = extraction.phone?.trim();
    const email = extraction.email?.trim();
    if (!phone && !email) return false;
  }
  return true;
}

function extractContactFromText(text: string): {
  name: string | null;
  email: string | null;
  phone: string | null;
} {
  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phoneMatch = text.match(/(?:\+?\d[\d\s()-]{5,}\d)/);
  const phone = phoneMatch?.[0]?.trim() ?? null;

  let name: string | null = null;
  const introName =
    text.match(
      /(?:mani\s+sauc|man\s+vārds(?:\s+ir)?|es\s+esmu|my\s+name\s+is|i'?m|i\s+am)\s+([A-ZĀČĒĢĪĶĻŅŠŪŽa-zāčēģīķļņšūž][A-ZĀČĒĢĪĶĻŅŠŪŽa-zāčēģīķļņšūž' -]{1,60})/i,
    )?.[1]
      ?.replace(/[,.!?;:].*$/, "")
      .trim() ?? null;
  if (
    introName &&
    introName.split(/\s+/).length <= 6 &&
    !/^(jā|ja|yes|ok|labi)\b/i.test(introName)
  ) {
    name = introName;
  }

  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const candidates = [...lines].reverse();
  for (const line of candidates) {
    if (name) break;
    if (!email && !phone) break;
    if (email && line === email) continue;
    if (phone && line.replace(/\s/g, "") === phone.replace(/\s/g, "")) continue;

    let part = line;
    if (email) part = part.replace(email, " ");
    if (phone) part = part.replace(phone, " ");
    part = part.replace(/[,;|/]+/g, " ").replace(/\s+/g, " ").trim();
    const words = part ? part.split(/\s+/).length : 0;
    if (
      part.length >= 2 &&
      part.length <= 80 &&
      words >= 1 &&
      words <= 6 &&
      /[a-zA-Zāčēģīķļņšūž]/i.test(part) &&
      !/\?$/.test(part) &&
      !/^(jā|ja|yes|ok|labi|sveiki|hello)\b/i.test(part)
    ) {
      name = part;
      break;
    }
  }

  return { name, email, phone };
}

export function heuristicExtract(params: {
  messages: { role: string; content: string }[];
  questions: QualificationQuestion[];
  locale: Locale;
}): LeadExtraction {
  const visitorText = params.messages
    .filter((m) => m.role === "user" || m.role === "VISITOR" || m.role === "USER")
    .map((m) => m.content)
    .join("\n");

  const isSpam = heuristicSpam(visitorText);
  const hasPurchaseIntent = !isSpam && heuristicIntent(visitorText);
  const { email, phone, name } = extractContactFromText(visitorText);
  // Providing contacts after a sales conversation is enough intent signal.
  const contactProvided = Boolean(email || phone);
  const intent =
    hasPurchaseIntent || (!isSpam && contactProvided && visitorText.length > 0);

  const fields: Record<string, string> = {};
  for (const q of params.questions) {
    // Only fill when explicitly present as "key: value" style — never invent.
    const re = new RegExp(`${q.key}\\s*[:=-]\\s*(.+)`, "i");
    const match = visitorText.match(re);
    if (match?.[1]) fields[q.key] = match[1].trim().slice(0, 200);
  }

  // Light structured pulls for common automotive phrases without hallucinating.
  const year = visitorText.match(/\b(19|20)\d{2}\b/)?.[0];
  const bmw = visitorText.match(/\bBMW\s+[A-Za-z0-9]+/i)?.[0];
  if (year && !fields.year) fields.year = year;
  if (bmw && !fields.car_model) fields.car_model = bmw;

  const missingQuestions = params.questions
    .filter((q) => q.required && !fields[q.key])
    .map((q) => (params.locale === "en" ? q.labelEn : q.labelLv));

  let service: string | null = null;
  if (fields.service) service = fields.service;
  else if (/suspension|amortizator|piekare/i.test(visitorText)) {
    service =
      params.locale === "en" ? "Suspension diagnostics" : "Piekabes diagnostika";
  } else if (/haircut|frizūr/i.test(visitorText)) {
    service = params.locale === "en" ? "Haircut" : "Frizūra";
  } else if (/website|mājaslap/i.test(visitorText)) {
    service = params.locale === "en" ? "Website" : "Mājaslapa";
  }

  return {
    hasPurchaseIntent: intent,
    isSpam,
    intent: intent
      ? params.locale === "en"
        ? "Purchase / booking intent"
        : "Pirkuma / pieraksta nodoms"
      : null,
    service,
    summary: intent
      ? visitorText.split("\n").filter(Boolean).slice(-3).join(" ").slice(0, 400)
      : null,
    name,
    email,
    phone,
    fields,
    missingQuestions,
    confidence: intent ? 0.55 : 0.2,
  };
}

export async function extractLeadFromConversation(params: {
  messages: { role: string; content: string }[];
  questions: QualificationQuestion[];
  locale: Locale;
  industry?: IndustryTemplate | null;
}): Promise<LeadExtraction> {
  const fallback = heuristicExtract(params);
  if (!hasOpenAIKey() || params.messages.length === 0) return fallback;

  const transcript = params.messages
    .slice(-16)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const questionList = params.questions
    .map((q) => `- ${q.key}: ${params.locale === "en" ? q.labelEn : q.labelLv}`)
    .join("\n");

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.defaultChatModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Extract lead signals from a customer conversation.",
            "Return JSON only.",
            "Do NOT invent missing facts. Use null for unknown scalars and omit unknown field keys.",
            "hasPurchaseIntent=true only for clear buying/booking/service request intent.",
            "FAQ-only chats (hours, address, general info) must be hasPurchaseIntent=false.",
            "isSpam=true for gibberish, ads, or abuse.",
            "missingQuestions should list unanswered required qualification questions in the business language.",
            `Qualification keys:\n${questionList}`,
          ].join("\n"),
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return fallback;
    const parsed = extractionSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return fallback;

    return {
      ...parsed.data,
      // Prefer model output but keep contacts if model missed them.
      name: parsed.data.name || fallback.name,
      email: parsed.data.email || fallback.email,
      phone: parsed.data.phone || fallback.phone,
      hasPurchaseIntent:
        parsed.data.hasPurchaseIntent || fallback.hasPurchaseIntent,
      fields: { ...fallback.fields, ...parsed.data.fields },
    };
  } catch (error) {
    console.error("[lead/extract]", error);
    return fallback;
  }
}
