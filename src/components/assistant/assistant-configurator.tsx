"use client";

import { useActionState, useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import {
  saveAssistantConfigAction,
  testAssistantAction,
  type AssistantActionResult,
} from "@/actions/assistant";
import {
  ASSISTANT_TONES,
  RESTRICTED_TOPIC_PRESETS,
  type AssistantTone,
  type HandoffTriggers,
  type LanguageMode,
} from "@/config/assistant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type AssistantFormValues = {
  name: string;
  businessName: string;
  greetingLv: string;
  greetingEn: string;
  fallbackLv: string;
  fallbackEn: string;
  tone: AssistantTone;
  languageMode: LanguageMode;
  systemInstructions: string;
  restrictedTopics: string[];
  handoffEnabled: boolean;
  handoffCreatesLead: boolean;
  handoffMessageLv: string;
  handoffMessageEn: string;
  handoffCustomRules: string;
  handoffTriggers: HandoffTriggers;
  collectLeads: boolean;
  collectName: boolean;
  collectPhone: boolean;
  collectEmail: boolean;
  customLeadFieldsText: string;
  leadNotificationEmail: string;
  qualificationQsText: string;
  version: number;
};

export function AssistantConfigurator({
  initial,
}: {
  initial: AssistantFormValues;
}) {
  const t = useTranslations("assistantAdmin");
  const [draft, setDraft] = useState(initial);
  const [saveState, saveAction, saving] = useActionState<
    AssistantActionResult | null,
    FormData
  >(saveAssistantConfigAction, null);
  const [testState, testAction, testing] = useActionState<
    AssistantActionResult | null,
    FormData
  >(testAssistantAction, null);

  useEffect(() => {
    if (saveState?.ok && saveState.version) {
      setDraft((prev) =>
        prev.version === saveState.version
          ? prev
          : { ...prev, version: saveState.version! },
      );
    }
  }, [saveState]);

  const greeting =
    draft.languageMode === "en" ? draft.greetingEn : draft.greetingLv;

  const restrictedText = useMemo(
    () => draft.restrictedTopics.join("\n"),
    [draft.restrictedTopics],
  );

  function toggleRestricted(label: string) {
    setDraft((prev) => {
      const exists = prev.restrictedTopics.includes(label);
      return {
        ...prev,
        restrictedTopics: exists
          ? prev.restrictedTopics.filter((x) => x !== label)
          : [...prev.restrictedTopics, label],
      };
    });
  }

  const testData =
    testState?.ok && testState.data && typeof testState.data === "object"
      ? (testState.data as {
          answer: string;
          usedFallback?: boolean;
          sources: {
            title: string | null;
            source: string;
            similarity: number;
            excerpt: string;
          }[];
        })
      : null;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <form action={saveAction} className="space-y-6">
        <input type="hidden" name="restrictedTopicsText" value={restrictedText} />
        <input type="hidden" name="tone" value={draft.tone} />
        <input type="hidden" name="languageMode" value={draft.languageMode} />
        {draft.handoffEnabled ? (
          <input type="hidden" name="handoffEnabled" value="on" />
        ) : null}
        {draft.handoffCreatesLead ? (
          <input type="hidden" name="handoffCreatesLead" value="on" />
        ) : null}
        {draft.handoffTriggers.customerAsksHuman ? (
          <input type="hidden" name="customerAsksHuman" value="on" />
        ) : null}
        {draft.handoffTriggers.cannotAnswer ? (
          <input type="hidden" name="cannotAnswer" value="on" />
        ) : null}
        {draft.handoffTriggers.requestsQuote ? (
          <input type="hidden" name="requestsQuote" value="on" />
        ) : null}
        {draft.handoffTriggers.customRules ? (
          <input type="hidden" name="customRules" value="on" />
        ) : null}
        {draft.collectLeads ? (
          <input type="hidden" name="collectLeads" value="on" />
        ) : null}
        {draft.collectName ? (
          <input type="hidden" name="collectName" value="on" />
        ) : null}
        {draft.collectPhone ? (
          <input type="hidden" name="collectPhone" value="on" />
        ) : null}
        {draft.collectEmail ? (
          <input type="hidden" name="collectEmail" value="on" />
        ) : null}

        <Section title={t("identity.title")} hint={t("identity.hint")}>
          <Field label={t("identity.name")}>
            <Input
              name="name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              required
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            {t("identity.business")}: <strong>{draft.businessName}</strong>
          </p>
          <Field label={t("identity.greetingLv")}>
            <Textarea
              name="greetingLv"
              rows={2}
              value={draft.greetingLv}
              onChange={(e) =>
                setDraft({ ...draft, greetingLv: e.target.value })
              }
              required
            />
          </Field>
          <Field label={t("identity.greetingEn")}>
            <Textarea
              name="greetingEn"
              rows={2}
              value={draft.greetingEn}
              onChange={(e) =>
                setDraft({ ...draft, greetingEn: e.target.value })
              }
              required
            />
          </Field>
        </Section>

        <Section title={t("language.title")} hint={t("language.hint")}>
          <div className="grid grid-cols-3 gap-2">
            {(["lv", "en", "auto"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setDraft({ ...draft, languageMode: mode })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium",
                  draft.languageMode === mode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {t(`language.${mode}`)}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("tone.title")} hint={t("tone.hint")}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {ASSISTANT_TONES.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setDraft({ ...draft, tone })}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium capitalize",
                  draft.tone === tone
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {t(`tone.${tone}`)}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t("instructions.title")} hint={t("instructions.hint")}>
          <Textarea
            name="systemInstructions"
            rows={5}
            value={draft.systemInstructions}
            onChange={(e) =>
              setDraft({ ...draft, systemInstructions: e.target.value })
            }
            placeholder={t("instructions.placeholder")}
          />
        </Section>

        <Section title={t("restrictions.title")} hint={t("restrictions.hint")}>
          <div className="flex flex-wrap gap-2">
            {RESTRICTED_TOPIC_PRESETS.map((preset) => {
              const label = preset.labelLv;
              const active = draft.restrictedTopics.includes(label);
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => toggleRestricted(label)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <Field label={t("restrictions.custom")}>
            <Textarea
              rows={3}
              value={restrictedText}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  restrictedTopics: e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder={t("restrictions.customHint")}
            />
          </Field>
          <Field label={t("restrictions.fallbackLv")}>
            <Textarea
              name="fallbackLv"
              rows={2}
              value={draft.fallbackLv}
              onChange={(e) =>
                setDraft({ ...draft, fallbackLv: e.target.value })
              }
              required
            />
          </Field>
          <Field label={t("restrictions.fallbackEn")}>
            <Textarea
              name="fallbackEn"
              rows={2}
              value={draft.fallbackEn}
              onChange={(e) =>
                setDraft({ ...draft, fallbackEn: e.target.value })
              }
              required
            />
          </Field>
        </Section>

        <Section title={t("handoff.title")} hint={t("handoff.hint")}>
          <Toggle
            checked={draft.handoffEnabled}
            onChange={(v) => setDraft({ ...draft, handoffEnabled: v })}
            label={t("handoff.enabled")}
          />
          <Toggle
            checked={draft.handoffTriggers.customerAsksHuman}
            onChange={(v) =>
              setDraft({
                ...draft,
                handoffTriggers: {
                  ...draft.handoffTriggers,
                  customerAsksHuman: v,
                },
              })
            }
            label={t("handoff.customerAsksHuman")}
          />
          <Toggle
            checked={draft.handoffTriggers.cannotAnswer}
            onChange={(v) =>
              setDraft({
                ...draft,
                handoffTriggers: { ...draft.handoffTriggers, cannotAnswer: v },
              })
            }
            label={t("handoff.cannotAnswer")}
          />
          <Toggle
            checked={draft.handoffTriggers.requestsQuote}
            onChange={(v) =>
              setDraft({
                ...draft,
                handoffTriggers: { ...draft.handoffTriggers, requestsQuote: v },
              })
            }
            label={t("handoff.requestsQuote")}
          />
          <Toggle
            checked={draft.handoffTriggers.customRules}
            onChange={(v) =>
              setDraft({
                ...draft,
                handoffTriggers: { ...draft.handoffTriggers, customRules: v },
              })
            }
            label={t("handoff.customRules")}
          />
          <Field label={t("handoff.customRulesText")}>
            <Textarea
              name="handoffCustomRules"
              rows={3}
              value={draft.handoffCustomRules}
              onChange={(e) =>
                setDraft({ ...draft, handoffCustomRules: e.target.value })
              }
              placeholder={t("handoff.customRulesHint")}
            />
          </Field>
          <Field label={t("handoff.messageLv")}>
            <Textarea
              name="handoffMessageLv"
              rows={2}
              value={draft.handoffMessageLv}
              onChange={(e) =>
                setDraft({ ...draft, handoffMessageLv: e.target.value })
              }
            />
          </Field>
          <Field label={t("handoff.messageEn")}>
            <Textarea
              name="handoffMessageEn"
              rows={2}
              value={draft.handoffMessageEn}
              onChange={(e) =>
                setDraft({ ...draft, handoffMessageEn: e.target.value })
              }
            />
          </Field>
          <Toggle
            checked={draft.handoffCreatesLead}
            onChange={(v) => setDraft({ ...draft, handoffCreatesLead: v })}
            label={t("handoff.createsLead")}
          />
        </Section>

        <Section title={t("leadsPanel.title")} hint={t("leadsPanel.hint")}>
          <Toggle
            checked={draft.collectLeads}
            onChange={(v) => setDraft({ ...draft, collectLeads: v })}
            label={t("leadsPanel.collectLeads")}
          />
          <Toggle
            checked={draft.collectName}
            onChange={(v) => setDraft({ ...draft, collectName: v })}
            label={t("leadsPanel.collectName")}
          />
          <Toggle
            checked={draft.collectPhone}
            onChange={(v) => setDraft({ ...draft, collectPhone: v })}
            label={t("leadsPanel.collectPhone")}
          />
          <Toggle
            checked={draft.collectEmail}
            onChange={(v) => setDraft({ ...draft, collectEmail: v })}
            label={t("leadsPanel.collectEmail")}
          />
          <Field label={t("leadsPanel.customFields")}>
            <Textarea
              name="customLeadFieldsText"
              rows={3}
              value={draft.customLeadFieldsText}
              onChange={(e) =>
                setDraft({ ...draft, customLeadFieldsText: e.target.value })
              }
              placeholder={t("leadsPanel.customFieldsHint")}
            />
          </Field>
          <Field label={t("leadsPanel.questions")}>
            <Textarea
              name="qualificationQsText"
              rows={4}
              value={draft.qualificationQsText}
              onChange={(e) =>
                setDraft({ ...draft, qualificationQsText: e.target.value })
              }
            />
          </Field>
          <Field label={t("leadsPanel.email")}>
            <Input
              name="leadNotificationEmail"
              type="email"
              value={draft.leadNotificationEmail}
              onChange={(e) =>
                setDraft({ ...draft, leadNotificationEmail: e.target.value })
              }
            />
          </Field>
        </Section>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? t("save.saving") : t("save.action")}
          </Button>
          <Badge variant="secondary">
            {t("save.version", {
              version: saveState?.ok && saveState.version
                ? saveState.version
                : draft.version,
            })}
          </Badge>
          {saveState?.ok ? (
            <p className="text-sm text-primary">{t("save.saved")}</p>
          ) : null}
          {saveState && !saveState.ok ? (
            <p className="text-sm text-destructive">{t("save.error")}</p>
          ) : null}
          <p className="w-full text-xs text-muted-foreground">
            {t("save.hint")}
          </p>
        </div>
      </form>

      <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <Tabs defaultValue="preview">
          <TabsList className="w-full">
            <TabsTrigger value="preview" className="flex-1">
              {t("preview.tab")}
            </TabsTrigger>
            <TabsTrigger value="test" className="flex-1">
              {t("test.tab")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="preview">
            <div className="overflow-hidden rounded-2xl border border-border bg-[linear-gradient(180deg,#eef2ee,#f7f6f3)] shadow-sm">
              <div className="flex items-center gap-3 border-b border-border/70 bg-card px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                  {draft.name.slice(0, 1) || "A"}
                </div>
                <div>
                  <div className="text-sm font-semibold">{draft.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {draft.businessName}
                  </div>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  {t(`tone.${draft.tone}`)}
                </Badge>
              </div>
              <div className="space-y-3 p-4">
                <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3 py-2 text-sm">
                  {greeting}
                </div>
                <div className="ml-auto max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">
                  {t("preview.sampleUser")}
                </div>
                <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                  {t("preview.sampleReply", { tone: t(`tone.${draft.tone}`) })}
                </div>
              </div>
              <div className="border-t border-border/70 bg-card px-4 py-3 text-xs text-muted-foreground">
                {t("preview.liveHint")}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="test">
            <form action={testAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">{t("test.hint")}</p>
              <Textarea
                name="question"
                rows={3}
                required
                placeholder={t("test.placeholder")}
              />
              <Button type="submit" disabled={testing}>
                {testing ? t("test.running") : t("test.ask")}
              </Button>
              {testState && !testState.ok ? (
                <p className="text-sm text-destructive">{t("test.error")}</p>
              ) : null}
              {testData ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("test.answer")}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {testData.answer}
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {t("test.sources")}
                    </div>
                    {testData.sources.length === 0 ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("test.noSources")}
                      </p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {testData.sources.map((source, i) => (
                          <div
                            key={`${source.source}-${i}`}
                            className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs"
                          >
                            <div className="flex gap-2">
                              <Badge variant="secondary">{source.source}</Badge>
                              <span className="font-medium">
                                {source.title || "—"}
                              </span>
                            </div>
                            <p className="mt-1 text-muted-foreground">
                              {source.excerpt}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-left text-sm"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}
