export const ASSISTANT_TONES = [
  "professional",
  "friendly",
  "concise",
  "warm",
] as const;

export type AssistantTone = (typeof ASSISTANT_TONES)[number];

export const TONE_GUIDANCE: Record<AssistantTone, string> = {
  professional:
    "Speak clearly and politely. Be competent and calm. Avoid slang and over-familiarity.",
  friendly:
    "Be approachable and helpful. Use a natural conversational tone while staying respectful.",
  concise:
    "Keep answers short and direct. Prefer 1–3 sentences unless detail is necessary.",
  warm:
    "Be empathetic and reassuring. Acknowledge the customer’s situation before answering.",
};

export const LANGUAGE_MODES = ["lv", "en", "auto"] as const;
export type LanguageMode = (typeof LANGUAGE_MODES)[number];

export const RESTRICTED_TOPIC_PRESETS = [
  { key: "legal", labelLv: "Juridiski padomi", labelEn: "Legal advice" },
  {
    key: "medical",
    labelLv: "Medicīniska diagnostika",
    labelEn: "Medical diagnosis",
  },
  {
    key: "financial",
    labelLv: "Finanšu padomi",
    labelEn: "Financial advice",
  },
  {
    key: "politics",
    labelLv: "Politika",
    labelEn: "Politics",
  },
] as const;

export type HandoffTriggers = {
  customerAsksHuman: boolean;
  cannotAnswer: boolean;
  requestsQuote: boolean;
  customRules: boolean;
};

export const DEFAULT_HANDOFF_TRIGGERS: HandoffTriggers = {
  customerAsksHuman: true,
  cannotAnswer: true,
  requestsQuote: false,
  customRules: false,
};

export const DEFAULT_LEAD_FIELD_FLAGS = {
  collectName: true,
  collectPhone: true,
  collectEmail: false,
};

export function parseHandoffTriggers(raw: unknown): HandoffTriggers {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_HANDOFF_TRIGGERS };
  const o = raw as Record<string, unknown>;
  return {
    customerAsksHuman:
      typeof o.customerAsksHuman === "boolean"
        ? o.customerAsksHuman
        : DEFAULT_HANDOFF_TRIGGERS.customerAsksHuman,
    cannotAnswer:
      typeof o.cannotAnswer === "boolean"
        ? o.cannotAnswer
        : DEFAULT_HANDOFF_TRIGGERS.cannotAnswer,
    requestsQuote:
      typeof o.requestsQuote === "boolean"
        ? o.requestsQuote
        : DEFAULT_HANDOFF_TRIGGERS.requestsQuote,
    customRules:
      typeof o.customRules === "boolean"
        ? o.customRules
        : DEFAULT_HANDOFF_TRIGGERS.customRules,
  };
}

export function isSafeTone(value: string): value is AssistantTone {
  return (ASSISTANT_TONES as readonly string[]).includes(value);
}

/** Soft temperature caps per tone — prevents unsafe “creative” behavior. */
export function temperatureForTone(tone: string): number {
  switch (tone) {
    case "concise":
      return 0.2;
    case "professional":
      return 0.25;
    case "warm":
      return 0.35;
    case "friendly":
      return 0.4;
    default:
      return 0.3;
  }
}

export const QUOTE_REQUEST_PATTERNS = [
  /tām[eiē]/i,
  /cenas\s+piedāvāj/i,
  /cik\s+izmaksā/i,
  /cik\s+maksā/i,
  /request\s+(a\s+)?quote/i,
  /get\s+(a\s+)?quote/i,
  /price\s+estimate/i,
  /how\s+much\s+would/i,
];

export function isQuoteRequest(message: string): boolean {
  return QUOTE_REQUEST_PATTERNS.some((p) => p.test(message));
}

export function matchesCustomHandoffRules(
  message: string,
  rules: string | null | undefined,
): boolean {
  if (!rules?.trim()) return false;
  const lines = rules
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);
  return lines.some((line) => {
    try {
      if (line.startsWith("/") && line.lastIndexOf("/") > 0) {
        const last = line.lastIndexOf("/");
        const body = line.slice(1, last);
        const flags = line.slice(last + 1);
        return new RegExp(body, flags || "i").test(message);
      }
    } catch {
      return false;
    }
    return message.toLowerCase().includes(line.toLowerCase());
  });
}

export function isRestrictedTopic(
  message: string,
  restrictedTopics: string[],
): boolean {
  if (!restrictedTopics.length) return false;
  const lower = message.toLowerCase();
  return restrictedTopics.some((topic) => {
    const t = topic.toLowerCase().trim();
    if (!t) return false;
    if (lower.includes(t)) return true;
    // map preset keys
    if (t === "legal" || t.includes("juridisk") || t.includes("legal")) {
      return /lawyer|attorney|juridisk|tiesisk|sue|lawsuit/i.test(message);
    }
    if (t === "medical" || t.includes("medicīn") || t.includes("medical")) {
      return /diagnos|symptom|prescription|ārst|slimīb|medicīn/i.test(message);
    }
    if (t === "financial" || t.includes("finan") || t.includes("invest")) {
      return /invest|stock|crypto|loan advice|finanšu padom/i.test(message);
    }
    if (t === "politics" || t.includes("polit")) {
      return /election|party politics|politisk/i.test(message);
    }
    return false;
  });
}
