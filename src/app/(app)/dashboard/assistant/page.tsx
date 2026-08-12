import { getTranslations } from "next-intl/server";

import {
  AssistantConfigurator,
  type AssistantFormValues,
} from "@/components/assistant/assistant-configurator";
import {
  DEFAULT_HANDOFF_TRIGGERS,
  DEFAULT_LEAD_FIELD_FLAGS,
  isSafeTone,
  parseHandoffTriggers,
  type AssistantTone,
} from "@/config/assistant";
import { qualificationForIndustry } from "@/config/leads";
import { DEFAULT_ASSISTANT, requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export default async function AssistantPage() {
  const t = await getTranslations("assistantAdmin");
  const { workspace } = await requireWorkspace();

  const assistant =
    (await prisma.assistantConfiguration.findUnique({
      where: { workspaceId: workspace.id },
    })) ??
    (await prisma.assistantConfiguration.create({
      data: {
        workspaceId: workspace.id,
        name: "Laura",
        greetingLv: "Labdien! Kā varu palīdzēt?",
        greetingEn: DEFAULT_ASSISTANT.greetingEn,
        fallbackLv: DEFAULT_ASSISTANT.fallbackLv,
        fallbackEn: DEFAULT_ASSISTANT.fallbackEn,
        languageMode: "auto",
        handoffTriggers: DEFAULT_HANDOFF_TRIGGERS,
      },
    }));

  const industryQs = qualificationForIndustry(workspace.industry);
  const qualificationText = Array.isArray(assistant.qualificationQs)
    ? (assistant.qualificationQs as { labelLv?: string }[])
        .map((q) => q.labelLv)
        .filter(Boolean)
        .join("\n")
    : industryQs.map((q) => q.labelLv).join("\n");

  const leadFields = parseLeadFields(assistant.leadFields);
  const tone: AssistantTone = isSafeTone(assistant.tone)
    ? assistant.tone
    : "professional";

  const languageMode =
    assistant.languageMode === "lv" ||
    assistant.languageMode === "en" ||
    assistant.languageMode === "auto"
      ? assistant.languageMode
      : "auto";

  const initial: AssistantFormValues = {
    name: assistant.name,
    businessName: workspace.name,
    greetingLv: assistant.greetingLv,
    greetingEn: assistant.greetingEn,
    fallbackLv: assistant.fallbackLv,
    fallbackEn: assistant.fallbackEn,
    tone,
    languageMode,
    systemInstructions: assistant.systemInstructions ?? "",
    restrictedTopics: assistant.restrictedTopics ?? [],
    handoffEnabled: assistant.handoffEnabled,
    handoffCreatesLead: assistant.handoffCreatesLead,
    handoffMessageLv: assistant.handoffMessageLv ?? "",
    handoffMessageEn: assistant.handoffMessageEn ?? "",
    handoffCustomRules: assistant.handoffCustomRules ?? "",
    handoffTriggers: parseHandoffTriggers(assistant.handoffTriggers),
    collectLeads: assistant.collectLeads,
    collectName: leadFields.collectName,
    collectPhone: leadFields.collectPhone,
    collectEmail: leadFields.collectEmail,
    customLeadFieldsText: leadFields.customText,
    leadNotificationEmail: assistant.leadNotificationEmail ?? "",
    qualificationQsText: qualificationText,
    version: assistant.version,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      <AssistantConfigurator initial={initial} />
    </div>
  );
}

function parseLeadFields(raw: unknown): {
  collectName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  customText: string;
} {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_LEAD_FIELD_FLAGS, customText: "" };
  }
  const o = raw as Record<string, unknown>;
  const custom = Array.isArray(o.custom)
    ? (o.custom as { labelLv?: string }[])
        .map((c) => c.labelLv)
        .filter(Boolean)
        .join("\n")
    : "";
  return {
    collectName:
      typeof o.collectName === "boolean"
        ? o.collectName
        : DEFAULT_LEAD_FIELD_FLAGS.collectName,
    collectPhone:
      typeof o.collectPhone === "boolean"
        ? o.collectPhone
        : DEFAULT_LEAD_FIELD_FLAGS.collectPhone,
    collectEmail:
      typeof o.collectEmail === "boolean"
        ? o.collectEmail
        : DEFAULT_LEAD_FIELD_FLAGS.collectEmail,
    customText: custom,
  };
}
