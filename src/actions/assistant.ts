"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  ASSISTANT_TONES,
  DEFAULT_HANDOFF_TRIGGERS,
  isSafeTone,
  temperatureForTone,
} from "@/config/assistant";
import { requireWorkspaceRole } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { hasOpenAIKey } from "@/services/ai/openai-client";
import { generateAssistantReply } from "@/services/ai/ai-service";
import { retrieveRelevantChunks } from "@/services/knowledge/retrieval-service";

export type AssistantActionResult =
  | { ok: true; version?: number; data?: unknown }
  | { ok: false; error: string };

const saveSchema = z.object({
  name: z.string().trim().min(2).max(80),
  greetingLv: z.string().trim().min(2).max(500),
  greetingEn: z.string().trim().min(2).max(500),
  fallbackLv: z.string().trim().min(2).max(800),
  fallbackEn: z.string().trim().min(2).max(800),
  tone: z.enum(ASSISTANT_TONES),
  languageMode: z.enum(["lv", "en", "auto"]),
  systemInstructions: z.string().trim().max(4000).optional().or(z.literal("")),
  restrictedTopicsText: z.string().max(2000).optional().or(z.literal("")),
  handoffEnabled: z.boolean(),
  handoffCreatesLead: z.boolean(),
  handoffMessageLv: z.string().trim().max(1000).optional().or(z.literal("")),
  handoffMessageEn: z.string().trim().max(1000).optional().or(z.literal("")),
  handoffCustomRules: z.string().trim().max(2000).optional().or(z.literal("")),
  customerAsksHuman: z.boolean(),
  cannotAnswer: z.boolean(),
  requestsQuote: z.boolean(),
  customRules: z.boolean(),
  collectLeads: z.boolean(),
  collectName: z.boolean(),
  collectPhone: z.boolean(),
  collectEmail: z.boolean(),
  customLeadFieldsText: z.string().max(2000).optional().or(z.literal("")),
  leadNotificationEmail: z.string().email().optional().or(z.literal("")),
  qualificationQsText: z.string().max(4000).optional().or(z.literal("")),
});

/**
 * Atomically snapshot previous config, then publish the new one.
 * Avoids corrupting the live assistant mid-write.
 */
export async function saveAssistantConfigAction(
  _prev: AssistantActionResult | null,
  formData: FormData,
): Promise<AssistantActionResult> {
  const { workspace, user } = await requireWorkspaceRole("ADMIN");

  const parsed = saveSchema.safeParse({
    name: formData.get("name"),
    greetingLv: formData.get("greetingLv"),
    greetingEn: formData.get("greetingEn"),
    fallbackLv: formData.get("fallbackLv"),
    fallbackEn: formData.get("fallbackEn"),
    tone: formData.get("tone"),
    languageMode: formData.get("languageMode"),
    systemInstructions: formData.get("systemInstructions") || "",
    restrictedTopicsText: formData.get("restrictedTopicsText") || "",
    handoffEnabled: formData.get("handoffEnabled") === "on",
    handoffCreatesLead: formData.get("handoffCreatesLead") === "on",
    handoffMessageLv: formData.get("handoffMessageLv") || "",
    handoffMessageEn: formData.get("handoffMessageEn") || "",
    handoffCustomRules: formData.get("handoffCustomRules") || "",
    customerAsksHuman: formData.get("customerAsksHuman") === "on",
    cannotAnswer: formData.get("cannotAnswer") === "on",
    requestsQuote: formData.get("requestsQuote") === "on",
    customRules: formData.get("customRules") === "on",
    collectLeads: formData.get("collectLeads") === "on",
    collectName: formData.get("collectName") === "on",
    collectPhone: formData.get("collectPhone") === "on",
    collectEmail: formData.get("collectEmail") === "on",
    customLeadFieldsText: formData.get("customLeadFieldsText") || "",
    leadNotificationEmail: formData.get("leadNotificationEmail") || "",
    qualificationQsText: formData.get("qualificationQsText") || "",
  });

  if (!parsed.success || !isSafeTone(parsed.data.tone)) {
    return { ok: false, error: "invalid_input" };
  }

  const restrictedTopics = (parsed.data.restrictedTopicsText || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);

  const customLeadFields = (parsed.data.customLeadFieldsText || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((label, index) => ({
      key: `custom_${index + 1}`,
      labelLv: label,
      labelEn: label,
      required: false,
    }));

  const leadFields = {
    collectName: parsed.data.collectName,
    collectPhone: parsed.data.collectPhone,
    collectEmail: parsed.data.collectEmail,
    custom: customLeadFields,
  };

  const qualificationQs = (parsed.data.qualificationQsText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((label, index) => ({
      key: `q_${index + 1}`,
      labelLv: label,
      labelEn: label,
      required: index < 2,
    }));

  const handoffTriggers = {
    customerAsksHuman: parsed.data.customerAsksHuman,
    cannotAnswer: parsed.data.cannotAnswer,
    requestsQuote: parsed.data.requestsQuote,
    customRules: parsed.data.customRules,
  };

  const temperature = temperatureForTone(parsed.data.tone);

  const nextVersion = await prisma.$transaction(async (tx) => {
    const existing = await tx.assistantConfiguration.findUnique({
      where: { workspaceId: workspace.id },
    });

    if (existing) {
      await tx.assistantConfigurationVersion.create({
        data: {
          workspaceId: workspace.id,
          assistantId: existing.id,
          version: existing.version,
          createdById: user.id,
          note: "auto-snapshot-before-publish",
          snapshot: {
            name: existing.name,
            greetingLv: existing.greetingLv,
            greetingEn: existing.greetingEn,
            fallbackLv: existing.fallbackLv,
            fallbackEn: existing.fallbackEn,
            tone: existing.tone,
            languageMode: existing.languageMode,
            systemInstructions: existing.systemInstructions,
            restrictedTopics: existing.restrictedTopics,
            leadFields: existing.leadFields,
            qualificationQs: existing.qualificationQs,
            minLeadCriteria: existing.minLeadCriteria,
            leadNotificationEmail: existing.leadNotificationEmail,
            collectLeads: existing.collectLeads,
            handoffEnabled: existing.handoffEnabled,
            handoffCreatesLead: existing.handoffCreatesLead,
            handoffTriggers: existing.handoffTriggers,
            handoffCustomRules: existing.handoffCustomRules,
            handoffMessageLv: existing.handoffMessageLv,
            handoffMessageEn: existing.handoffMessageEn,
            model: existing.model,
            temperature: existing.temperature,
            version: existing.version,
            publishedAt: existing.publishedAt,
          },
        },
      });

      const updated = await tx.assistantConfiguration.update({
        where: { id: existing.id },
        data: {
          name: parsed.data.name,
          greetingLv: parsed.data.greetingLv,
          greetingEn: parsed.data.greetingEn,
          fallbackLv: parsed.data.fallbackLv,
          fallbackEn: parsed.data.fallbackEn,
          tone: parsed.data.tone,
          languageMode: parsed.data.languageMode,
          systemInstructions: parsed.data.systemInstructions || null,
          restrictedTopics,
          leadFields,
          qualificationQs:
            qualificationQs.length > 0
              ? qualificationQs
              : existing.qualificationQs ?? undefined,
          leadNotificationEmail: parsed.data.leadNotificationEmail || null,
          collectLeads: parsed.data.collectLeads,
          handoffEnabled: parsed.data.handoffEnabled,
          handoffCreatesLead: parsed.data.handoffCreatesLead,
          handoffTriggers,
          handoffCustomRules: parsed.data.handoffCustomRules || null,
          handoffMessageLv: parsed.data.handoffMessageLv || null,
          handoffMessageEn: parsed.data.handoffMessageEn || null,
          temperature,
          version: existing.version + 1,
          publishedAt: new Date(),
        },
      });
      return updated.version;
    }

    const created = await tx.assistantConfiguration.create({
      data: {
        workspaceId: workspace.id,
        name: parsed.data.name,
        greetingLv: parsed.data.greetingLv,
        greetingEn: parsed.data.greetingEn,
        fallbackLv: parsed.data.fallbackLv,
        fallbackEn: parsed.data.fallbackEn,
        tone: parsed.data.tone,
        languageMode: parsed.data.languageMode,
        systemInstructions: parsed.data.systemInstructions || null,
        restrictedTopics,
        leadFields,
        qualificationQs,
        leadNotificationEmail: parsed.data.leadNotificationEmail || null,
        collectLeads: parsed.data.collectLeads,
        handoffEnabled: parsed.data.handoffEnabled,
        handoffCreatesLead: parsed.data.handoffCreatesLead,
        handoffTriggers: handoffTriggers ?? DEFAULT_HANDOFF_TRIGGERS,
        handoffCustomRules: parsed.data.handoffCustomRules || null,
        handoffMessageLv: parsed.data.handoffMessageLv || null,
        handoffMessageEn: parsed.data.handoffMessageEn || null,
        temperature,
        version: 1,
        publishedAt: new Date(),
      },
    });
    return created.version;
  });

  await prisma.auditLog.create({
    data: {
      workspaceId: workspace.id,
      userId: user.id,
      action: "SETTINGS",
      entityType: "AssistantConfiguration",
      entityId: workspace.id,
      metadata: { version: nextVersion },
    },
  });

  revalidatePath("/dashboard/assistant");
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/widget");
  return { ok: true, version: nextVersion };
}

export async function testAssistantAction(
  _prev: AssistantActionResult | null,
  formData: FormData,
): Promise<AssistantActionResult> {
  const { workspace } = await requireWorkspaceRole("MEMBER");
  const question = String(formData.get("question") || "").trim();
  if (!question || question.length > 500) {
    return { ok: false, error: "invalid_question" };
  }

  try {
    const sources = hasOpenAIKey()
      ? await retrieveRelevantChunks({
          workspaceId: workspace.id,
          query: question,
        }).catch(() => [])
      : [];

    if (!hasOpenAIKey()) {
      return {
        ok: true,
        data: {
          answer:
            "OPENAI_API_KEY nav iestatīts — rādām tikai atrastos zināšanu avotus.",
          sources: sources.map((s) => ({
            title: s.title,
            source: s.source,
            similarity: s.similarity,
            excerpt: s.content.slice(0, 240),
          })),
        },
      };
    }

    const result = await generateAssistantReply({
      workspaceId: workspace.id,
      message: question,
      locale: workspace.primaryLocale,
    });

    return {
      ok: true,
      data: {
        answer: result.answer,
        usedFallback: result.usedFallback,
        sources: sources.map((s) => ({
          title: s.title,
          source: s.source,
          similarity: s.similarity,
          excerpt: s.content.slice(0, 240),
        })),
      },
    };
  } catch (error) {
    console.error("[assistant/test]", error);
    return { ok: false, error: "test_failed" };
  }
}
