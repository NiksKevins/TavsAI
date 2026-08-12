import Link from "next/link";
import { Check } from "lucide-react";

import dynamic from "next/dynamic";

import {
  MarketingContainer,
  MarketingDemoStage,
  MarketingFinalCta,
  MarketingPageHero,
  MarketingSection,
} from "@/components/marketing/marketing-ui";
import { HowStepsEditorial } from "@/components/marketing/how-steps";
import {
  EditorialDivider,
  FeatureIndex,
} from "@/components/marketing/marketing-visuals";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config/plans";
import type { MarketingDict } from "@/lib/marketing/get-marketing-dict";

const LiveDemoChat = dynamic(
  () =>
    import("@/components/marketing/live-demo-chat").then((m) => m.LiveDemoChat),
  {
    loading: () => (
      <div className="min-h-[400px] rounded-2xl border border-border/80 bg-muted/40" />
    ),
  },
);

export function MarketingDemoSection({ dict }: { dict: MarketingDict }) {
  return (
    <>
      <MarketingDemoStage
        eyebrow={dict.heroProof}
        title={dict.demoTitle}
        hint={dict.demoSubtitle}
        chooseLabel={dict.demoChoose}
      >
        <LiveDemoChat variant="showcase" />
      </MarketingDemoStage>
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/register"
        secondaryLabel={dict.ctaPrimary}
      />
    </>
  );
}

export function MarketingProblemSection({ dict }: { dict: MarketingDict }) {
  return (
    <>
      <MarketingPageHero
        eyebrow={dict.problem.eyebrow}
        title={dict.problem.title}
        subtitle={dict.problem.hint}
      />
      <MarketingSection tone="plain" className="pt-0">
        <MarketingContainer narrow>
          <ol className="divide-y divide-border/80">
            {dict.problem.items.map((item, index) => (
              <li
                key={item}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-5 sm:gap-x-5 sm:py-6"
              >
                <FeatureIndex n={index + 1} />
                <p className="min-w-0 self-center text-base leading-[1.75] text-ink-soft">{item}</p>
              </li>
            ))}
          </ol>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}

export function MarketingSolutionSection({ dict }: { dict: MarketingDict }) {
  return (
    <>
      <MarketingPageHero
        eyebrow={dict.solution.eyebrow}
        title={dict.solution.title}
        subtitle={dict.solution.subtitle}
      />
      <MarketingSection tone="cream" className="pt-0">
        <MarketingContainer>
          <ul>
            {dict.solution.items.map((item, index) => (
              <li key={item.title}>
                {index > 0 ? <EditorialDivider /> : null}
                <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-5 sm:gap-x-5 sm:py-6">
                  <FeatureIndex n={index + 1} />
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-[1.7] text-ink-soft sm:text-lg sm:leading-[1.65]">
                      {item.body}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">{dict.solutionFootnote}</p>
        </MarketingContainer>
      </MarketingSection>
    </>
  );
}

export function MarketingHowSection({ dict }: { dict: MarketingDict }) {
  return (
    <>
      <MarketingPageHero eyebrow={dict.how.eyebrow} title={dict.how.title} />
      <MarketingSection tone="cream" className="pt-0">
        <MarketingContainer narrow>
          <HowStepsEditorial steps={dict.how.steps} />
        </MarketingContainer>
      </MarketingSection>
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/demo"
        secondaryLabel={dict.ctaSecondary}
      />
    </>
  );
}

export function MarketingIndustriesSection({ dict }: { dict: MarketingDict }) {
  return (
    <>
      <MarketingPageHero
        eyebrow={dict.industries.eyebrow}
        title={dict.industries.title}
        subtitle={dict.industries.subtitle}
      />
      <MarketingSection tone="cream" className="pt-0">
        <MarketingContainer>
          <ul className="grid gap-px overflow-hidden rounded-2xl border border-border/80 bg-border/80 sm:grid-cols-2 lg:grid-cols-4">
            {dict.industries.items.map((name) => (
              <li
                key={name}
                className="flex min-h-[72px] items-center bg-card px-5 py-4 font-medium tracking-tight text-foreground transition-colors hover:bg-secondary"
              >
                {name}
              </li>
            ))}
          </ul>
        </MarketingContainer>
      </MarketingSection>
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/demo"
        secondaryLabel={dict.ctaSecondary}
      />
    </>
  );
}

export function MarketingPricingSection({
  dict,
  note,
}: {
  dict: MarketingDict;
  note?: string;
}) {
  const plans = Object.values(PLANS);
  const featured = plans.find((p) => p.id === "BUSINESS")!;
  const others = plans.filter((p) => p.id !== "BUSINESS");

  return (
    <>
      <MarketingPageHero
        eyebrow={dict.pricing.eyebrow}
        title={dict.pricing.title}
        subtitle={dict.pricing.subtitle}
      />
      <MarketingSection tone="plain" className="pt-0">
        <MarketingContainer wide>
          {/* Featured plan — elevated center stage */}
          <FeaturedPlanCard dict={dict} plan={featured} />

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {others.map((plan) => (
              <PlanCard key={plan.id} dict={dict} plan={plan} />
            ))}
          </div>

          {note ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">{note}</p>
          ) : null}
        </MarketingContainer>
      </MarketingSection>
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/demo"
        secondaryLabel={dict.ctaSecondary}
      />
    </>
  );
}

function FeaturedPlanCard({
  dict,
  plan,
}: {
  dict: MarketingDict;
  plan: (typeof PLANS)[keyof typeof PLANS];
}) {
  const features = dict.pricing.features[plan.id] ?? [];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-[0_16px_48px_-16px_rgba(59,130,246,0.35)] sm:p-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-2xl"
      />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <span className="rounded-full bg-accent-cyan px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-surface-dark">
            {dict.pricing.recommended}
          </span>
          <h3 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">{plan.name}</h3>
          <p className="mt-2 text-sm text-primary-foreground/80">
            {dict.pricing.conversations.replace(
              "{count}",
              plan.conversationLimit.toLocaleString(
                dict.locale === "en" ? "en-GB" : "lv-LV",
              ),
            )}
          </p>
          <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
            {features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 opacity-80" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col items-start gap-4 lg:items-end">
          <p className="font-display text-5xl font-semibold tracking-tight">
            €{plan.priceMonthlyEur}
            <span className="text-base font-normal text-primary-foreground/70">
              {dict.pricing.perMonth}
            </span>
          </p>
          <Button asChild size="lg" variant="secondary" className="rounded-full px-8">
            <Link href="/register">{dict.pricing.cta}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  dict,
  plan,
}: {
  dict: MarketingDict;
  plan: (typeof PLANS)[keyof typeof PLANS];
}) {
  const features = dict.pricing.features[plan.id] ?? [];

  return (
    <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
      <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
        {plan.priceMonthlyEur === 0 ? "€0" : `€${plan.priceMonthlyEur}`}
        <span className="text-sm font-normal text-muted-foreground">
          {dict.pricing.perMonth}
        </span>
      </p>
      <p className="mt-1 text-sm text-ink-soft">
        {dict.pricing.conversations.replace(
          "{count}",
          plan.conversationLimit.toLocaleString(
            dict.locale === "en" ? "en-GB" : "lv-LV",
          ),
        )}
      </p>
      <ul className="mt-5 flex-1 space-y-2 text-sm text-ink-soft">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            {f}
          </li>
        ))}
      </ul>
      <Button asChild variant="outline" className="mt-6 w-full rounded-full">
        <Link href="/register">{dict.pricing.cta}</Link>
      </Button>
    </div>
  );
}

export function MarketingFaqSection({ dict }: { dict: MarketingDict }) {
  const mid = Math.ceil(dict.faq.items.length / 2);
  const colA = dict.faq.items.slice(0, mid);
  const colB = dict.faq.items.slice(mid);

  return (
    <>
      <MarketingPageHero eyebrow={dict.faq.eyebrow} title={dict.faq.title} />
      <MarketingSection tone="cream" className="pt-0">
        <MarketingContainer wide>
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            {[colA, colB].map((col, ci) => (
              <div key={ci} className="space-y-0">
                {col.map((item, index) => (
                  <details
                    key={item.q}
                    className="group border-b border-border/80 py-4 first:pt-0"
                  >
                    <summary className="cursor-pointer list-none font-display text-lg font-semibold tracking-tight marker:content-none [&::-webkit-details-marker]:hidden">
                      <span className="flex items-start justify-between gap-4">
                        <span>
                          <span className="mr-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                            {String(index + 1 + ci * mid).padStart(2, "0")}
                          </span>
                          {item.q}
                        </span>
                        <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45">
                          +
                        </span>
                      </span>
                    </summary>
                    <p className="mt-4 pl-8 text-sm leading-[1.8] text-ink-soft">{item.a}</p>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </MarketingContainer>
      </MarketingSection>
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/register"
        secondaryLabel={dict.ctaPrimary}
      />
    </>
  );
}

export function MarketingFinalCtaSection({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingFinalCta
      eyebrow={dict.finalCta.eyebrow}
      title={dict.finalCta.title}
      cta={dict.finalCta.cta}
      secondaryHref="/demo"
      secondaryLabel={dict.ctaSecondary}
    />
  );
}
