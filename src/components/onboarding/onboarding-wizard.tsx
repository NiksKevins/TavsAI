"use client";

import type { IndustryTemplate } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  generateOnboardingAssistantAction,
  getOnboardingCrawlStatus,
  onboardingPreviewChatAction,
  restartOnboardingCrawlAction,
  saveOnboardingStep,
  skipOnboardingCrawlAction,
  type OnboardingCrawlStatus,
} from "@/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ONBOARDING_INDUSTRY_CARDS,
  ONBOARDING_TOTAL_STEPS,
  type OnboardingAssistantDraft,
} from "@/config/onboarding-templates";
import { ASSISTANT_TONES } from "@/config/assistant";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

type Props = {
  initialStep: number;
  defaults: {
    businessName: string;
    websiteUrl: string;
    industry: IndustryTemplate;
    assistant: OnboardingAssistantDraft;
  };
  widgetPublicKey: string;
  appUrl: string;
  initialCrawl: OnboardingCrawlStatus;
};

export function OnboardingWizard({
  initialStep,
  defaults,
  widgetPublicKey,
  appUrl,
  initialCrawl,
}: Props) {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const router = useRouter();
  const [step, setStep] = useState(
    Math.min(Math.max(initialStep, 1), ONBOARDING_TOTAL_STEPS),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [businessName, setBusinessName] = useState(defaults.businessName);
  const [websiteUrl, setWebsiteUrl] = useState(defaults.websiteUrl);
  const [industry, setIndustry] = useState<IndustryTemplate>(
    defaults.industry === "OTHER" ||
      ONBOARDING_INDUSTRY_CARDS.includes(defaults.industry)
      ? defaults.industry
      : "OTHER",
  );

  const [assistantName, setAssistantName] = useState(defaults.assistant.name);
  const [greetingLv, setGreetingLv] = useState(defaults.assistant.greetingLv);
  const [greetingEn, setGreetingEn] = useState(defaults.assistant.greetingEn);
  const [tone, setTone] = useState(defaults.assistant.tone);
  const [suggestedQuestions, setSuggestedQuestions] = useState(
    defaults.assistant.suggestedQuestions.join("\n"),
  );

  const [crawl, setCrawl] = useState<OnboardingCrawlStatus>(initialCrawl);
  const [generated, setGenerated] = useState(false);

  const [previewMessages, setPreviewMessages] = useState<Msg[]>([]);
  const [previewInput, setPreviewInput] = useState("");
  const [copied, setCopied] = useState(false);

  const installSnippet = `<script\n  src="${appUrl}/widget.js"\n  data-widget-id="${widgetPublicKey}"\n  async\n></script>`;

  const runStep = useCallback(
    (current: number, formData: FormData) => {
      setError(null);
      startTransition(async () => {
        const result = await saveOnboardingStep(current, formData);
        if (!result.ok) {
          setError(t(`errors.${result.error}` as "errors.invalid_step"));
          return;
        }
        if (current < ONBOARDING_TOTAL_STEPS) {
          setStep(current + 1);
          router.refresh();
        }
      });
    },
    [router, t],
  );

  // Poll crawl on step 4
  useEffect(() => {
    if (step !== 4) return;
    let cancelled = false;

    async function tick() {
      let status = await getOnboardingCrawlStatus();
      if (cancelled) return;

      if (status.status === "idle") {
        await restartOnboardingCrawlAction();
        status = await getOnboardingCrawlStatus();
        if (cancelled) return;
      }

      setCrawl(status);

      if (status.done && !generated) {
        setGenerated(true);
        const gen = await generateOnboardingAssistantAction();
        if (gen.ok && gen.data && typeof gen.data === "object") {
          const draft = gen.data as OnboardingAssistantDraft;
          setAssistantName(draft.name);
          setGreetingLv(draft.greetingLv);
          setGreetingEn(draft.greetingEn);
          setTone(draft.tone);
          setSuggestedQuestions(draft.suggestedQuestions.join("\n"));
        }
      }
    }

    tick();
    const id = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [step, generated]);

  useEffect(() => {
    if (step === 6 && previewMessages.length === 0) {
      setPreviewMessages([
        {
          role: "assistant",
          content: greetingLv || defaults.assistant.greetingLv,
        },
      ]);
    }
  }, [step, greetingLv, defaults.assistant.greetingLv, previewMessages.length]);

  function sendPreview(text: string) {
    const message = text.trim();
    if (!message || pending) return;
    setPreviewMessages((prev) => [...prev, { role: "user", content: message }]);
    setPreviewInput("");
    startTransition(async () => {
      const result = await onboardingPreviewChatAction(message);
      if (!result.ok || !result.data) {
        setError(t("errors.preview_failed"));
        return;
      }
      const data = result.data as { answer: string };
      setPreviewMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    });
  }

  async function copyInstall() {
    try {
      await navigator.clipboard.writeText(installSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("errors.copy_failed"));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-primary">
          {t("progress", { step, total: ONBOARDING_TOTAL_STEPS })}
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(step / ONBOARDING_TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="border border-border bg-card/80 p-6 sm:p-8">
        {step === 1 ? (
          <form
            className="space-y-6"
            action={(fd) => {
              fd.set("businessName", businessName);
              runStep(1, fd);
            }}
          >
            <StepHeader
              title={t("steps.business.title")}
              subtitle={t("steps.business.subtitle")}
            />
            <div>
              <Label htmlFor="businessName">{t("fields.businessName")}</Label>
              <Input
                id="businessName"
                className="mt-2"
                autoFocus
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={pending}>
                {t("continue")}
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <form
            className="space-y-6"
            action={(fd) => {
              fd.set("websiteUrl", websiteUrl);
              runStep(2, fd);
            }}
          >
            <StepHeader
              title={t("steps.website.title")}
              subtitle={t("steps.website.subtitle")}
            />
            <div>
              <Label htmlFor="websiteUrl">{t("fields.websiteUrl")}</Label>
              <Input
                id="websiteUrl"
                className="mt-2"
                autoFocus
                placeholder="https://example.lv"
                value={websiteUrl}
                onChange={(e) => {
                  setWebsiteUrl(e.target.value);
                  setError(null);
                }}
                onBlur={() => {
                  const raw = websiteUrl.trim();
                  if (!raw) return;
                  try {
                    const withProto = /^https?:\/\//i.test(raw)
                      ? raw
                      : `https://${raw}`;
                    const u = new URL(withProto);
                    if (u.protocol !== "http:" && u.protocol !== "https:") {
                      setError(t("errors.invalid_url"));
                      return;
                    }
                    if (
                      u.hostname === "localhost" ||
                      u.hostname === "127.0.0.1"
                    ) {
                      setError(t("errors.invalid_url"));
                    }
                  } catch {
                    setError(t("errors.invalid_url"));
                  }
                }}
                required
              />
              <p className="mt-2 text-xs text-muted-foreground">
                {t("steps.website.note")}
              </p>
            </div>
            <FooterNav
              onBack={() => setStep(1)}
              pending={pending}
              continueLabel={t("continue")}
              backLabel={t("back")}
            />
          </form>
        ) : null}

        {step === 3 ? (
          <form
            className="space-y-6"
            action={(fd) => {
              fd.set("industry", industry);
              runStep(3, fd);
            }}
          >
            <StepHeader
              title={t("steps.industry.title")}
              subtitle={t("steps.industry.subtitle")}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {ONBOARDING_INDUSTRY_CARDS.map((id) => {
                const active = industry === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIndustry(id)}
                    className={cn(
                      "border px-4 py-4 text-left transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary/40",
                    )}
                  >
                    <span className="font-display text-base font-semibold">
                      {t(`industries.${id}`)}
                    </span>
                  </button>
                );
              })}
            </div>
            <FooterNav
              onBack={() => setStep(2)}
              pending={pending}
              continueLabel={t("continue")}
              backLabel={t("back")}
            />
          </form>
        ) : null}

        {step === 4 ? (
          <div className="space-y-6">
            <StepHeader
              title={t("steps.crawl.title")}
              subtitle={t("steps.crawl.subtitle")}
            />

            <div className="space-y-3 text-sm">
              <p className="font-medium text-foreground">
                {!crawl.done
                  ? t("steps.crawl.analyzing")
                  : crawl.status === "COMPLETED"
                    ? t("steps.crawl.done")
                    : t("steps.crawl.finishedWithIssues")}
              </p>

              {(() => {
                const limit = Math.max(crawl.pageLimit || 10, 1);
                const indeterminate =
                  !crawl.done &&
                  crawl.pagesDiscovered === 0 &&
                  crawl.pagesProcessed === 0;
                const percent = crawl.done
                  ? 100
                  : Math.round(
                      Math.min(
                        99,
                        Math.max(
                          (Math.min(crawl.pagesDiscovered, limit) / limit) * 35,
                          (Math.min(crawl.pagesProcessed, limit) / limit) * 100,
                        ),
                      ),
                    );
                return (
                  <div className="space-y-2 rounded-md border border-border bg-card p-3">
                    <div className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
                      <span>
                        {crawl.pagesProcessed} / {limit}
                      </span>
                      <span className="tabular-nums">
                        {indeterminate ? "…" : `${percent}%`}
                      </span>
                    </div>
                    <Progress
                      value={percent}
                      indeterminate={indeterminate}
                      className="h-2"
                    />
                  </div>
                );
              })()}

              <ProgressLine
                done={crawl.pagesDiscovered > 0 || crawl.done}
                active={
                  !crawl.done &&
                  (crawl.status === "QUEUED" || crawl.status === "CRAWLING")
                }
                label={
                  crawl.pagesDiscovered > 0
                    ? t("steps.crawl.found", { count: crawl.pagesDiscovered })
                    : t("steps.crawl.finding")
                }
              />
              <ProgressLine
                done={crawl.pagesProcessed > 0 && crawl.done}
                active={
                  !crawl.done &&
                  (crawl.status === "CRAWLING" || crawl.status === "PROCESSING")
                }
                label={
                  crawl.pagesProcessed > 0
                    ? t("steps.crawl.processed", { count: crawl.pagesProcessed })
                    : t("steps.crawl.processing")
                }
              />
              <ProgressLine
                done={crawl.knowledgeReady}
                active={
                  !crawl.done &&
                  crawl.pagesProcessed > 0 &&
                  !crawl.knowledgeReady
                }
                label={
                  crawl.knowledgeReady
                    ? t("steps.crawl.knowledgeReady", {
                        docs: crawl.documentCount,
                        chunks: crawl.chunkCount,
                      })
                    : t("steps.crawl.knowledgePending")
                }
              />
            </div>

            {crawl.errorMessage && crawl.done ? (
              <p className="text-sm text-destructive">{crawl.errorMessage}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(3)}>
                {t("back")}
              </Button>
              <div className="flex flex-wrap gap-2">
                {crawl.done && crawl.status !== "COMPLETED" ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        setGenerated(false);
                        await restartOnboardingCrawlAction();
                      })
                    }
                  >
                    {t("steps.crawl.retry")}
                  </Button>
                ) : null}
                {!crawl.done ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await skipOnboardingCrawlAction();
                        setStep(5);
                        router.refresh();
                      })
                    }
                  >
                    {t("steps.crawl.skip")}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={pending || !generated}
                    onClick={() => setStep(5)}
                  >
                    {t("continue")}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <form
            className="space-y-6"
            action={(fd) => {
              fd.set("assistantName", assistantName);
              fd.set("greetingLv", greetingLv);
              fd.set("greetingEn", greetingEn);
              fd.set("tone", tone);
              fd.set("suggestedQuestions", suggestedQuestions);
              runStep(5, fd);
            }}
          >
            <StepHeader
              title={t("steps.customize.title")}
              subtitle={t("steps.customize.subtitle")}
            />
            <div className="grid gap-4">
              <div>
                <Label htmlFor="assistantName">{t("fields.assistantName")}</Label>
                <Input
                  id="assistantName"
                  className="mt-2"
                  value={assistantName}
                  onChange={(e) => setAssistantName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="greetingLv">{t("fields.greeting")}</Label>
                <textarea
                  id="greetingLv"
                  className="mt-2 min-h-[88px] w-full border border-input bg-background px-3 py-2 text-sm"
                  value={greetingLv}
                  onChange={(e) => setGreetingLv(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label>{t("fields.tone")}</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ASSISTANT_TONES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setTone(item)}
                      className={cn(
                        "border px-3 py-1.5 text-sm capitalize",
                        tone === item
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/40",
                      )}
                    >
                      {t(`tones.${item}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="suggested">
                  {t("fields.suggestedQuestions")}
                </Label>
                <textarea
                  id="suggested"
                  className="mt-2 min-h-[100px] w-full border border-input bg-background px-3 py-2 text-sm"
                  value={suggestedQuestions}
                  onChange={(e) => setSuggestedQuestions(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("fields.suggestedHint")}
                </p>
              </div>
              <div className="border border-border bg-muted/30 px-4 py-3 text-sm text-ink-soft">
                <p className="font-medium text-foreground">
                  {t("fields.leadFields")}
                </p>
                <p className="mt-1">
                  {defaults.assistant.leadFields
                    .map((f) => (locale === "en" ? f.labelEn : f.labelLv))
                    .join(" · ")}
                </p>
              </div>
            </div>
            <FooterNav
              onBack={() => setStep(4)}
              pending={pending}
              continueLabel={t("continue")}
              backLabel={t("back")}
            />
          </form>
        ) : null}

        {step === 6 ? (
          <div className="space-y-6">
            <StepHeader
              title={t("steps.preview.title")}
              subtitle={t("steps.preview.subtitle")}
            />
            <div className="overflow-hidden rounded-2xl border border-border bg-white text-foreground shadow-sm">
              <div className="flex items-center gap-3 border-b border-border bg-[linear-gradient(180deg,#fbfaf8_0%,#f4f6f4_100%)] px-4 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {(assistantName || "AI").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-semibold text-foreground">
                    {assistantName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {businessName}
                  </p>
                </div>
              </div>
              <div className="flex max-h-[320px] flex-col gap-2.5 overflow-y-auto bg-[#f7f6f3] px-4 py-4">
                {previewMessages.map((m, i) => (
                  <div
                    key={`${i}-${m.role}`}
                    className={cn(
                      "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "ml-auto rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/80 bg-white text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-border bg-white px-4 py-3">
                {(
                  suggestedQuestions.split("\n").filter(Boolean).slice(0, 3) ||
                  []
                ).map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
                    onClick={() => sendPreview(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2 border-t border-border bg-white px-4 py-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPreview(previewInput);
                }}
              >
                <Input
                  value={previewInput}
                  onChange={(e) => setPreviewInput(e.target.value)}
                  placeholder={t("steps.preview.placeholder")}
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground"
                />
                <Button type="submit" disabled={pending}>
                  {t("steps.preview.send")}
                </Button>
              </form>
            </div>
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(5)}>
                {t("back")}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => runStep(6, new FormData())}
              >
                {t("continue")}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 7 ? (
          <div className="space-y-6">
            <StepHeader
              title={t("steps.install.title")}
              subtitle={t("steps.install.subtitle")}
            />
            <pre className="overflow-x-auto rounded-xl border border-border bg-[#f7f6f3] p-4 text-xs leading-relaxed text-foreground">
              {installSnippet}
            </pre>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={copyInstall}>
                {copied ? t("steps.install.copied") : t("steps.install.copy")}
              </Button>
              <Button asChild variant="outline">
                <a
                  href={`/demo/widget?id=${widgetPublicKey}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("steps.install.test")}
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("steps.install.hint")}
            </p>
            <div className="flex justify-between">
              <Button type="button" variant="ghost" onClick={() => setStep(6)}>
                {t("back")}
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => runStep(7, new FormData())}
              >
                {t("finish")}
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function StepHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-ink-soft">{subtitle}</p>
    </div>
  );
}

function FooterNav({
  onBack,
  pending,
  continueLabel,
  backLabel,
}: {
  onBack: () => void;
  pending: boolean;
  continueLabel: string;
  backLabel: string;
}) {
  return (
    <div className="flex justify-between">
      <Button type="button" variant="ghost" onClick={onBack}>
        {backLabel}
      </Button>
      <Button type="submit" disabled={pending}>
        {continueLabel}
      </Button>
    </div>
  );
}

function ProgressLine({
  done,
  active,
  label,
}: {
  done: boolean;
  active: boolean;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center border text-xs",
          done
            ? "border-primary bg-primary text-primary-foreground"
            : active
              ? "border-primary/50 text-primary"
              : "border-border text-muted-foreground",
        )}
      >
        {done ? "✓" : active ? "…" : ""}
      </span>
      <span
        className={cn(
          "leading-relaxed",
          done ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}
