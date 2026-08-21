import type { Locale } from "@prisma/client";

import {
  isRestrictedTopic,
  isSafeTone,
  TONE_GUIDANCE,
  type AssistantTone,
} from "@/config/assistant";
import {
  AI_CONFIG,
  DEFAULT_FALLBACK_EN,
  DEFAULT_FALLBACK_LV,
} from "@/config/ai";
import { prisma } from "@/lib/db";
import { recordAiUsage } from "@/services/ai/cost-service";
import { getOpenAIClient, hasOpenAIKey } from "@/services/ai/openai-client";
import {
  buildChatMessages,
  buildSystemPrompt,
} from "@/services/ai/prompt-builder";
import {
  gateConversationUsage,
  upgradeRequiredMessage,
} from "@/services/billing/usage-service";
import {
  appendMessage,
  buildConversationContext,
  getOrCreateConversation,
} from "@/services/conversation/conversation-service";
import { retrieveRelevantChunks } from "@/services/knowledge/retrieval-service";
import { canAnswerWithoutRetrieval } from "@/services/ai/grounding";

export type ChatRequest = {
  workspaceId: string;
  message: string;
  conversationId?: string | null;
  visitorId?: string | null;
  locale?: Locale;
};

export type ChatResult = {
  conversationId: string;
  answer: string;
  usedFallback: boolean;
  retrievedCount: number;
  upgradeRequired?: boolean;
  usage?: {
    used: number;
    limit: number;
    plan: string;
  };
};

function resolveLocale(
  message: string,
  preferred?: Locale,
  languageMode?: string | null,
): Locale {
  if (languageMode === "lv" || languageMode === "en") return languageMode;
  // auto
  if (/[āčēģīķļņšūžĀČĒĢĪĶĻŅŠŪŽ]/.test(message)) return "lv";
  if (/\b(the|and|how|what|please|price|cost|hello|hi)\b/i.test(message)) {
    return "en";
  }
  return preferred ?? "lv";
}

async function loadAssistantContext(workspaceId: string, locale: Locale) {
  const [workspace, business, assistant, services] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    prisma.businessInformation.findUnique({ where: { workspaceId } }),
    prisma.assistantConfiguration.findUnique({ where: { workspaceId } }),
    prisma.service.findMany({
      where: { workspaceId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameLv: "asc" }],
      take: 40,
      select: {
        nameLv: true,
        nameEn: true,
        descriptionLv: true,
        descriptionEn: true,
        priceFrom: true,
        priceTo: true,
        currency: true,
      },
    }),
  ]);

  if (!assistant) {
    throw new Error("assistant_not_configured");
  }

  const fallback =
    locale === "lv"
      ? assistant.fallbackLv || DEFAULT_FALLBACK_LV
      : assistant.fallbackEn || DEFAULT_FALLBACK_EN;

  const handoff =
    locale === "lv" ? assistant.handoffMessageLv : assistant.handoffMessageEn;

  const { parseQualificationQuestions } = await import(
    "@/services/leads/lead-detection"
  );
  const questions = parseQualificationQuestions(
    assistant.qualificationQs,
    workspace.industry,
  );

  const tone = isSafeTone(assistant.tone)
    ? assistant.tone
    : ("professional" as AssistantTone);

  const { formatOpeningHoursForKnowledge, parseOpeningHours } = await import(
    "@/config/business-profile"
  );
  const openingHours = business
    ? formatOpeningHoursForKnowledge(
        parseOpeningHours(business.openingHours),
        locale,
      )
    : null;

  return {
    workspace,
    rawAssistant: assistant,
    business: {
      businessName: business?.displayName || workspace.name,
      description: business?.description,
      phone: business?.phone,
      email: business?.email,
      address: business?.address,
      city: business?.city,
      websiteUrl: business?.websiteUrl,
      languages: business?.languages,
      policies: business?.policies,
      openingHours: openingHours || null,
      services: services.map((s) => ({
        name:
          locale === "en" && s.nameEn
            ? s.nameEn
            : s.nameLv || s.nameEn || "Service",
        description:
          locale === "en"
            ? s.descriptionEn || s.descriptionLv
            : s.descriptionLv || s.descriptionEn,
        priceFrom: s.priceFrom != null ? Number(s.priceFrom) : null,
        priceTo: s.priceTo != null ? Number(s.priceTo) : null,
        currency: s.currency,
      })),
    },
    assistant: {
      name: assistant.name,
      tone,
      language: locale,
      languageMode: assistant.languageMode,
      toneGuidance: TONE_GUIDANCE[tone],
      customInstructions: assistant.systemInstructions,
      allowedTopics: assistant.allowedTopics,
      restrictedTopics: assistant.restrictedTopics,
      fallbackMessage: fallback,
      handoffMessage: handoff,
      collectLeads: assistant.collectLeads,
      qualificationQuestions: questions.map((q) =>
        locale === "en" ? q.labelEn : q.labelLv,
      ),
      model: assistant.model || AI_CONFIG.defaultChatModel,
      temperature: assistant.temperature,
    },
  };
}

export async function generateAssistantReply(
  request: ChatRequest,
): Promise<ChatResult> {
  const pre = await prisma.assistantConfiguration.findUnique({
    where: { workspaceId: request.workspaceId },
  });
  const locale = resolveLocale(
    request.message,
    request.locale,
    pre?.languageMode,
  );

  const gate = await gateConversationUsage({
    workspaceId: request.workspaceId,
    conversationId: request.conversationId,
  });

  if (!gate.allowed) {
    const conversation = await getOrCreateConversation({
      workspaceId: request.workspaceId,
      conversationId: request.conversationId,
      visitorId: request.visitorId,
      locale,
      visitorMetadata: { quotaBlocked: true },
    });
    const answer = upgradeRequiredMessage(locale, gate.snapshot);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "USER",
      content: request.message,
    });
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: {
        upgradeRequired: true,
        used: gate.snapshot.used,
        limit: gate.snapshot.limit,
        plan: gate.snapshot.plan,
      },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: 0,
      upgradeRequired: true,
      usage: {
        used: gate.snapshot.used,
        limit: gate.snapshot.limit,
        plan: gate.snapshot.plan,
      },
    };
  }

  const conversation = await getOrCreateConversation({
    workspaceId: request.workspaceId,
    conversationId: request.conversationId,
    visitorId: request.visitorId,
    locale,
  });

  await appendMessage({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
    role: "USER",
    content: request.message,
  });

  const ctx = await loadAssistantContext(request.workspaceId, locale);

  if (isRestrictedTopic(request.message, ctx.assistant.restrictedTopics)) {
    const answer = ctx.assistant.fallbackMessage;
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { usedFallback: true, reason: "restricted_topic" },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: 0,
    };
  }

  const knowledge = await retrieveRelevantChunks({
    workspaceId: request.workspaceId,
    query: request.message,
  }).catch(() => []);

  const profileCanAnswer = canAnswerWithoutRetrieval(
    request.message,
    ctx.business,
  );

  if (knowledge.length === 0 && !profileCanAnswer) {
    const answer = ctx.assistant.fallbackMessage;
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { usedFallback: true, retrievedCount: 0 },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: 0,
    };
  }

  if (!hasOpenAIKey()) {
    const answer = ctx.assistant.fallbackMessage;
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { usedFallback: true, reason: "missing_openai_key" },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: knowledge.length,
    };
  }

  const { history, summary } = await buildConversationContext({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
  });

  const systemPrompt = buildSystemPrompt({
    business: ctx.business,
    assistant: ctx.assistant,
    knowledge,
    conversationSummary: summary,
  });

  const messages = buildChatMessages({
    systemPrompt,
    history: history.slice(0, -1), // exclude the just-saved user message duplicate
    customerMessage: request.message,
  });

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: ctx.assistant.model,
    temperature: ctx.assistant.temperature,
    max_tokens: AI_CONFIG.maxOutputTokens,
    messages,
  });

  const answer =
    completion.choices[0]?.message?.content?.trim() ||
    ctx.assistant.fallbackMessage;

  await appendMessage({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
    role: "ASSISTANT",
    content: answer,
    metadata: {
      usedFallback: false,
      retrievedCount: knowledge.length,
      model: ctx.assistant.model,
    },
  });

  await recordAiUsage({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
    model: ctx.assistant.model,
    inputTokens: completion.usage?.prompt_tokens ?? 0,
    outputTokens: completion.usage?.completion_tokens ?? 0,
  });

  return {
    conversationId: conversation.id,
    answer,
    usedFallback: false,
    retrievedCount: knowledge.length,
  };
}

/**
 * Streaming chat: yields tokens, then persists the final assistant message.
 */
export async function streamAssistantReply(
  request: ChatRequest,
  onToken: (token: string) => void,
): Promise<ChatResult> {
  const pre = await prisma.assistantConfiguration.findUnique({
    where: { workspaceId: request.workspaceId },
  });
  const locale = resolveLocale(
    request.message,
    request.locale,
    pre?.languageMode,
  );

  const gate = await gateConversationUsage({
    workspaceId: request.workspaceId,
    conversationId: request.conversationId,
  });

  if (!gate.allowed) {
    const conversation = await getOrCreateConversation({
      workspaceId: request.workspaceId,
      conversationId: request.conversationId,
      visitorId: request.visitorId,
      locale,
      visitorMetadata: { quotaBlocked: true },
    });
    const answer = upgradeRequiredMessage(locale, gate.snapshot);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "USER",
      content: request.message,
    });
    onToken(answer);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: {
        upgradeRequired: true,
        used: gate.snapshot.used,
        limit: gate.snapshot.limit,
        plan: gate.snapshot.plan,
      },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: 0,
      upgradeRequired: true,
      usage: {
        used: gate.snapshot.used,
        limit: gate.snapshot.limit,
        plan: gate.snapshot.plan,
      },
    };
  }

  const conversation = await getOrCreateConversation({
    workspaceId: request.workspaceId,
    conversationId: request.conversationId,
    visitorId: request.visitorId,
    locale,
  });

  await appendMessage({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
    role: "USER",
    content: request.message,
  });

  const ctx = await loadAssistantContext(request.workspaceId, locale);

  if (isRestrictedTopic(request.message, ctx.assistant.restrictedTopics)) {
    const answer = ctx.assistant.fallbackMessage;
    onToken(answer);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { usedFallback: true, reason: "restricted_topic" },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: 0,
    };
  }

  const knowledge = await retrieveRelevantChunks({
    workspaceId: request.workspaceId,
    query: request.message,
  }).catch(() => []);

  const profileCanAnswer = canAnswerWithoutRetrieval(
    request.message,
    ctx.business,
  );

  if ((knowledge.length === 0 && !profileCanAnswer) || !hasOpenAIKey()) {
    const answer = ctx.assistant.fallbackMessage;
    onToken(answer);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: {
        usedFallback: true,
        retrievedCount: knowledge.length,
      },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: knowledge.length,
    };
  }

  const { history, summary } = await buildConversationContext({
    workspaceId: request.workspaceId,
    conversationId: conversation.id,
  });

  const systemPrompt = buildSystemPrompt({
    business: ctx.business,
    assistant: ctx.assistant,
    knowledge,
    conversationSummary: summary,
  });

  const messages = buildChatMessages({
    systemPrompt,
    history: history.slice(0, -1),
    customerMessage: request.message,
  });

  try {
    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: ctx.assistant.model,
      temperature: ctx.assistant.temperature,
      max_tokens: AI_CONFIG.maxOutputTokens,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    let answer = "";
    let inputTokens = 0;
    let outputTokens = 0;

    for await (const part of stream) {
      const token = part.choices[0]?.delta?.content ?? "";
      if (token) {
        answer += token;
        onToken(token);
      }
      if (part.usage) {
        inputTokens = part.usage.prompt_tokens ?? inputTokens;
        outputTokens = part.usage.completion_tokens ?? outputTokens;
      }
    }

    if (!answer.trim()) {
      answer = ctx.assistant.fallbackMessage;
      onToken(answer);
    }

    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: {
        usedFallback: false,
        retrievedCount: knowledge.length,
        streamed: true,
        model: ctx.assistant.model,
      },
    });

    await recordAiUsage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      model: ctx.assistant.model,
      inputTokens,
      outputTokens,
    });

    return {
      conversationId: conversation.id,
      answer,
      usedFallback: false,
      retrievedCount: knowledge.length,
    };
  } catch {
    const answer = ctx.assistant.fallbackMessage;
    onToken(answer);
    await appendMessage({
      workspaceId: request.workspaceId,
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: answer,
      metadata: { usedFallback: true, reason: "stream_failed" },
    });
    return {
      conversationId: conversation.id,
      answer,
      usedFallback: true,
      retrievedCount: knowledge.length,
    };
  }
}
