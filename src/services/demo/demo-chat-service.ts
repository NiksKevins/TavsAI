import { AI_CONFIG, DEFAULT_FALLBACK_LV, DEFAULT_FALLBACK_EN } from "@/config/ai";
import {
  demoLocale,
  getDemoIndustry,
  type DemoIndustryId,
} from "@/config/demo-industries";
import { shouldShowLeadForm } from "@/lib/chat/lead-form-intent";
import {
  buildChatMessages,
  buildSystemPrompt,
  type PromptHistoryItem,
} from "@/services/ai/prompt-builder";
import { getOpenAIClient, hasOpenAIKey } from "@/services/ai/openai-client";
import type { RetrievedChunk } from "@/services/knowledge/retrieval-service";

export type DemoChatResult = {
  answer: string;
  showLeadForm: boolean;
  usedAi: boolean;
};

function knowledgeAsChunks(
  industryId: DemoIndustryId,
): RetrievedChunk[] {
  const industry = getDemoIndustry(industryId)!;
  return industry.knowledge.map((k, index) => ({
    id: `${industryId}-${index}`,
    documentId: `${industryId}-doc`,
    content: k.content,
    title: k.title,
    sourceUrl: industry.websiteUrl,
    source: k.source,
    sourceType: "FAQ" as const,
    priority: k.priority,
    similarity: 0.92 - index * 0.02,
  }));
}

/** Lightweight keyword fallback when OpenAI is not configured. */
function offlineAnswer(
  industryId: DemoIndustryId,
  message: string,
  locale: "lv" | "en",
  showLeadForm: boolean,
): string {
  const industry = getDemoIndustry(industryId)!;
  const lower = message.toLowerCase();
  const hit = industry.knowledge.find((k) =>
    k.content
      .toLowerCase()
      .split(/\W+/)
      .some((w) => w.length > 4 && lower.includes(w)),
  );
  if (hit) {
    const offer = showLeadForm
      ? locale === "en"
        ? " Fill in the short form below with your name and phone — we’ll follow up."
        : " Aizpildiet īso formu zemāk ar vārdu un tālruni — sazināsimies."
      : locale === "en"
        ? " If you’d like, I can help you book a visit."
        : " Ja vēlaties, varu palīdzēt pieteikt vizīti.";
    const firstSentence = hit.content.split(". ")[0] + ".";
    return firstSentence + offer;
  }
  if (showLeadForm) {
    return locale === "en"
      ? "Please fill in the form below with your name, email, and phone — that way it’s easier than typing in chat."
      : "Lūdzu, aizpildiet formu zemāk ar vārdu, e-pastu un tālruni — tā ir ērtāk nekā rakstīt čatā.";
  }
  return locale === "en" ? DEFAULT_FALLBACK_EN : DEFAULT_FALLBACK_LV;
}

export async function runDemoChat(params: {
  industryId: DemoIndustryId;
  message: string;
  locale?: string;
  history?: PromptHistoryItem[];
}): Promise<DemoChatResult> {
  const industry = getDemoIndustry(params.industryId);
  if (!industry) {
    throw new Error("invalid_industry");
  }

  const locale = demoLocale(params.locale);
  const history = (params.history ?? []).slice(-8);
  let showLeadForm = shouldShowLeadForm({
    message: params.message,
    history,
  });
  const knowledge = knowledgeAsChunks(params.industryId);

  if (!hasOpenAIKey()) {
    return {
      answer: offlineAnswer(
        params.industryId,
        params.message,
        locale,
        showLeadForm,
      ),
      showLeadForm,
      usedAi: false,
    };
  }

  const isProduct = params.industryId === "tavswebs";

  const systemPrompt = buildSystemPrompt({
    business: {
      businessName: industry.businessName,
      description: industry.description,
      phone: industry.phone,
      email: industry.email,
      city: industry.city,
      websiteUrl: industry.websiteUrl,
      languages: ["lv", "en"],
    },
    assistant: {
      name: industry.assistantName,
      tone: "professional",
      language: locale,
      languageMode: "auto",
      toneGuidance: isProduct
        ? "Clear, confident, benefit-first. Talk about outcomes (keep customers, always-on answers, captured leads). Avoid jargon."
        : "Friendly, concise, Latvian-business tone. Offer booking when intent is clear.",
      customInstructions: isProduct
        ? "This is the TavsWebs Bot marketing site demo. You ARE the product assistant for TavsWebs Bot — not a third-party salon or garage. Explain what the visitor gets, pricing, and how to start. CONTACT CAPTURE: when you need name/email/phone, write ONE short sentence telling them to fill the form below — never ask them to type those fields in chat, never list the fields as a question. A contact form UI will appear automatically. Prefer concrete numbers from knowledge. CRITICAL formatting rules: never put lists in one paragraph. Use real line breaks. Structure as: (1) one short intro sentence (2) blank line (3) numbered steps as separate lines '1. ' '2. ' OR pricing as separate lines '- **Plan**: price' (4) blank line (5) optional follow-up. Section labels like 'Cenas:' or 'Kā sākt:' must be on their own line before the list. After a lead is submitted: short paragraphs + https://bot.tavswebs.com/register alone on its own line."
        : "This is a public marketing demo. Stay in character for the selected business. Prefer concrete prices from knowledge. CONTACT CAPTURE: when booking/quote needs contacts, write ONE short sentence to fill the form below — do not ask them to type name/phone/email in the chat. A form UI appears automatically. CRITICAL formatting: never one dense paragraph. Use line breaks; steps as '1. ' '2. ' lines; prices as '- **Name**: price' lines; **bold** key prices.",
      allowedTopics: isProduct
        ? ["pricing", "how it works", "features", "onboarding", "languages", "leads"]
        : ["services", "prices", "hours", "booking", "quotes"],
      restrictedTopics: ["competitors", "politics"],
      fallbackMessage: locale === "en" ? DEFAULT_FALLBACK_EN : DEFAULT_FALLBACK_LV,
      handoffMessage:
        locale === "en"
          ? "I can pass your details to the team."
          : "Varu nodot jūsu datus komandai.",
      collectLeads: true,
      qualificationQuestions: isProduct
        ? locale === "en"
          ? ["What kind of business do you run?", "Do you already have a website?"]
          : ["Kāds ir jūsu bizness?", "Vai jums jau ir mājaslapa?"]
        : locale === "en"
          ? ["What service do you need?", "When would you like to visit?"]
          : ["Kādu pakalpojumu vēlaties?", "Kad jums būtu ērti ierasties?"],
    },
    knowledge,
  });

  const messages = buildChatMessages({
    systemPrompt,
    history,
    customerMessage: params.message,
  });

  const client = getOpenAIClient();
  const completion = await client.chat.completions.create({
    model: AI_CONFIG.defaultChatModel,
    temperature: 0.4,
    max_tokens: 500,
    messages,
  });

  const answer =
    completion.choices[0]?.message?.content?.trim() ||
    (locale === "en" ? DEFAULT_FALLBACK_EN : DEFAULT_FALLBACK_LV);

  showLeadForm = shouldShowLeadForm({
    message: params.message,
    history,
    answer,
  });

  return { answer, showLeadForm, usedAi: true };
}
