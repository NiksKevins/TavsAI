import { AI_CONFIG, DEFAULT_FALLBACK_LV, DEFAULT_FALLBACK_EN } from "@/config/ai";
import {
  demoLocale,
  getDemoIndustry,
  type DemoIndustryId,
} from "@/config/demo-industries";
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

const LEAD_INTENT =
  /pieteikt|pierakst|vizīt|tām[ei]|vēlos|jā[,.]?\s*vēl|book|appoint|quote|yes[,.]?\s*i('d| would)? like|sākt|start free|try for free|reģistr|register|bez maksas/i;

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

function wantsLead(
  message: string,
  history: PromptHistoryItem[],
): boolean {
  if (LEAD_INTENT.test(message)) return true;
  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === "assistant");
  if (
    lastAssistant &&
    /pieteikt|pierakst|vizīt|tāmi|book|appoint/i.test(lastAssistant.content) &&
    /^(jā|ja|yes|ok|labi|vēlos)\b/i.test(message.trim())
  ) {
    return true;
  }
  return false;
}

/** Lightweight keyword fallback when OpenAI is not configured. */
function offlineAnswer(
  industryId: DemoIndustryId,
  message: string,
  locale: "lv" | "en",
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
    const offer =
      locale === "en"
        ? " If you’d like, I can help you book a visit — just share your name and phone."
        : " Ja vēlaties, varu palīdzēt pieteikt vizīti — atstājiet vārdu un tālruni.";
    const firstSentence = hit.content.split(". ")[0] + ".";
    return firstSentence + offer;
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
  const showLeadForm = wantsLead(params.message, history);
  const knowledge = knowledgeAsChunks(params.industryId);

  if (!hasOpenAIKey()) {
    return {
      answer: offlineAnswer(params.industryId, params.message, locale),
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
        ? "This is the TavsWebs Bot marketing site demo. You ARE the product assistant for TavsWebs Bot — not a third-party salon or garage. Explain what the visitor gets, pricing, and how to start. When they want to start, ask for name and phone so the team can follow up, and mention they can also register free at /register. Prefer concrete numbers from knowledge. Format replies for easy scanning: short intro sentence, then lists. For how-it-works / steps ALWAYS use a numbered list with each step on its own line as '1. ' '2. ' '3. ' (never a single paragraph). For pricing use '- ' bullets. Use **bold** for plan names and prices. After collecting name/phone, reply in 2–3 short paragraphs separated by blank lines: (1) confirm you’ll pass details to the team (2) put https://bot.tavswebs.com/register alone on its own line for self-serve signup (3) ask if they need anything else."
        : "This is a public marketing demo. Stay in character for the selected business. Prefer concrete prices from knowledge. When the customer wants to book or get a quote, ask for name and phone (or show that a lead form will appear). Format replies for easy scanning: short paragraphs; for steps use numbered '1. ' '2. ' lines; for prices/options use '- ' bullets; **bold** key prices or service names.",
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

  return { answer, showLeadForm, usedAi: true };
}
