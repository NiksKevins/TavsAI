import type { IndustryTemplate } from "@prisma/client";

import {
  DEFAULT_LEAD_FIELDS,
  qualificationForIndustry,
  type LeadFieldDef,
  type QualificationQuestion,
} from "@/config/leads";
import { ASSISTANT_TONES, type AssistantTone } from "@/config/assistant";

export const ONBOARDING_INDUSTRY_CARDS: IndustryTemplate[] = [
  "AUTOMOTIVE",
  "BEAUTY_SALON",
  "CONSTRUCTION",
  "REAL_ESTATE",
  "RESTAURANT",
  "OTHER",
];

export const ONBOARDING_TOTAL_STEPS = 7;

export type OnboardingAssistantDraft = {
  name: string;
  greetingLv: string;
  greetingEn: string;
  tone: AssistantTone;
  suggestedQuestions: string[];
  leadFields: LeadFieldDef[];
  qualificationQs: QualificationQuestion[];
};

type IndustrySeed = {
  assistantName: (businessName: string) => string;
  tone: AssistantTone;
  greetingLv: (businessName: string, assistantName: string) => string;
  greetingEn: (businessName: string, assistantName: string) => string;
  suggestedQuestions: string[];
};

const SEEDS: Record<IndustryTemplate, IndustrySeed> = {
  AUTOMOTIVE: {
    assistantName: () => "Nords",
    tone: "professional",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Varu palīdzēt ar cenām, diagnostiku un vizītes pieteikumu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with prices, diagnostics, and booking a visit.`,
    suggestedQuestions: [
      "Cik maksā diagnostika?",
      "Kāds ir darba laiks?",
      "Vēlos pieteikt vizīti",
    ],
  },
  BEAUTY_SALON: {
    assistantName: () => "Aura",
    tone: "friendly",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Palīdzēšu ar cenām, pakalpojumiem un pierakstu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with prices, services, and bookings.`,
    suggestedQuestions: [
      "Cik maksā matu griezums?",
      "Kāds ir darba laiks?",
      "Vēlos pierakstīties",
    ],
  },
  BARBER: {
    assistantName: () => "Rūdis",
    tone: "friendly",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Varu palīdzēt ar cenām un pierakstu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with prices and bookings.`,
    suggestedQuestions: [
      "Cik maksā matu griezums?",
      "Vai ir brīvi šodien?",
      "Vēlos pierakstīties",
    ],
  },
  CONSTRUCTION: {
    assistantName: () => "Baiba",
    tone: "professional",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Palīdzēšu ar pakalpojumiem un tāmes pieprasījumu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with services and quote requests.`,
    suggestedQuestions: [
      "Cik maksā renovācija?",
      "Vai strādājat Pierīgā?",
      "Vēlos saņemt tāmi",
    ],
  },
  REAL_ESTATE: {
    assistantName: () => "Līna",
    tone: "professional",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Palīdzēšu atrast īpašumu un sazināties ar aģentu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help find a property and connect you with an agent.`,
    suggestedQuestions: [
      "Kādi dzīvokļi ir pieejami?",
      "Vai varu apskatīt objektu?",
      "Vēlos runāt ar aģentu",
    ],
  },
  RESTAURANT: {
    assistantName: () => "Marta",
    tone: "friendly",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Varu palīdzēt ar ēdienkarti, darba laiku un galdiņa rezervāciju.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with the menu, hours, and table reservations.`,
    suggestedQuestions: [
      "Kāds ir darba laiks?",
      "Vai var rezervēt galdiņu?",
      "Kādi ir šodienas piedāvājumi?",
    ],
  },
  DENTAL_CLINIC: {
    assistantName: () => "Ieva",
    tone: "warm",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Palīdzēšu ar pakalpojumiem un pierakstu pie speciālista.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can help with services and booking an appointment.`,
    suggestedQuestions: [
      "Cik maksā konsultācija?",
      "Kāds ir darba laiks?",
      "Vēlos pierakstīties",
    ],
  },
  PROFESSIONAL_SERVICES: {
    assistantName: () => "Toms",
    tone: "professional",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Varu īsi pastāstīt par pakalpojumiem un savākt jūsu kontaktu.`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. I can briefly explain our services and take your contact details.`,
    suggestedQuestions: [
      "Kādi pakalpojumi jums ir?",
      "Cik maksā konsultācija?",
      "Vēlos sazināties",
    ],
  },
  OTHER: {
    assistantName: (businessName) => {
      const first = businessName.trim().split(/\s+/)[0] || "AI";
      return first.length > 12 ? "AI" : first;
    },
    tone: "professional",
    greetingLv: (b, a) =>
      `Sveiki! Esmu ${a} no ${b}. Kā varu palīdzēt?`,
    greetingEn: (b, a) =>
      `Hello! I’m ${a} from ${b}. How can I help?`,
    suggestedQuestions: [
      "Cik maksā jūsu pakalpojumi?",
      "Kāds ir darba laiks?",
      "Vēlos atstāt kontaktu",
    ],
  },
};

export function buildOnboardingAssistantDraft(params: {
  industry: IndustryTemplate;
  businessName: string;
}): OnboardingAssistantDraft {
  const seed = SEEDS[params.industry] ?? SEEDS.OTHER;
  const businessName = params.businessName.trim() || "uzņēmums";
  const name = seed.assistantName(businessName);
  const tone = ASSISTANT_TONES.includes(seed.tone)
    ? seed.tone
    : "professional";

  return {
    name,
    greetingLv: seed.greetingLv(businessName, name),
    greetingEn: seed.greetingEn(businessName, name),
    tone,
    suggestedQuestions: seed.suggestedQuestions,
    leadFields: DEFAULT_LEAD_FIELDS,
    qualificationQs: qualificationForIndustry(params.industry),
  };
}
