import Link from "next/link";
import { Check } from "lucide-react";
import dynamic from "next/dynamic";

import {
  MarketingContainer,
  MarketingDemoStage,
  MarketingFinalCta,
  MarketingPageHero,
  MarketingSection,
  MarketingSectionIntro,
} from "@/components/marketing/marketing-ui";
import { HowStepsEditorial } from "@/components/marketing/how-steps";
import {
  EditorialDivider,
  FeatureIndex,
} from "@/components/marketing/marketing-visuals";
import { Button } from "@/components/ui/button";
import { PLANS, SETUP_FEE_EUR } from "@/config/plans";
import type { MarketingDict } from "@/lib/marketing/get-marketing-dict";
import { cn } from "@/lib/utils";

const LiveDemoChat = dynamic(
  () =>
    import("@/components/marketing/live-demo-chat").then((m) => m.LiveDemoChat),
  {
    loading: () => (
      <div className="min-h-[400px] rounded-xl border border-border/80 bg-muted/40" />
    ),
  },
);

type SectionMode = {
  embedded?: boolean;
  withFinalCta?: boolean;
};

function SectionShell({
  embedded,
  eyebrow,
  title,
  subtitle,
  tone = "plain",
  children,
  id,
}: {
  embedded?: boolean;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  tone?: "plain" | "cream";
  children: React.ReactNode;
  id?: string;
}) {
  if (embedded) {
    return (
      <MarketingSection id={id} tone={tone}>
        <MarketingContainer>
          <MarketingSectionIntro
            eyebrow={eyebrow}
            title={title}
            subtitle={subtitle}
          />
          <div className="mt-10 sm:mt-12">{children}</div>
        </MarketingContainer>
      </MarketingSection>
    );
  }

  return (
    <>
      <MarketingPageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <MarketingSection tone={tone} className="pt-10 sm:pt-12" id={id}>
        <MarketingContainer>{children}</MarketingContainer>
      </MarketingSection>
    </>
  );
}

/** Single list language for titled feature rows. */
function FeatureRows({
  items,
  columns = 1,
}: {
  items: { title: string; body: string }[];
  columns?: 1 | 2;
}) {
  if (columns === 2) {
    return (
      <ul className="grid gap-x-10 gap-y-0 sm:grid-cols-2">
        {items.map((item, index) => (
          <li key={item.title} className="border-t border-border/70">
            <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-6 sm:gap-x-5 sm:py-7">
              <FeatureIndex n={index + 1} />
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-[1.7] text-ink-soft sm:text-base sm:leading-[1.7]">
                  {item.body}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="max-w-3xl">
      {items.map((item, index) => (
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
  );
}

function PlainNumberedList({ items }: { items: string[] }) {
  return (
    <ol className="max-w-3xl divide-y divide-border/70">
      {items.map((item, index) => (
        <li
          key={item}
          className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-5 sm:gap-x-5 sm:py-6"
        >
          <FeatureIndex n={index + 1} />
          <p className="min-w-0 self-center text-base leading-[1.75] text-ink-soft">
            {item}
          </p>
        </li>
      ))}
    </ol>
  );
}

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

export function MarketingProblemSection({
  dict,
  embedded = false,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <SectionShell
      embedded={embedded}
      eyebrow={dict.problem.eyebrow}
      title={dict.problem.title}
      subtitle={dict.problem.hint}
      tone="plain"
    >
      <PlainNumberedList items={dict.problem.items} />
    </SectionShell>
  );
}

export function MarketingSolutionSection({
  dict,
  embedded = false,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <SectionShell
      embedded={embedded}
      eyebrow={dict.solution.eyebrow}
      title={dict.solution.title}
      subtitle={dict.solution.subtitle}
      tone="cream"
    >
      <FeatureRows items={dict.solution.items} />
      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
        {dict.solutionFootnote}
      </p>
    </SectionShell>
  );
}

export function MarketingDetailsSection({
  dict,
  embedded = false,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <SectionShell
      embedded={embedded}
      eyebrow={dict.details.eyebrow}
      title={dict.details.title}
      subtitle={dict.details.subtitle}
      tone="plain"
    >
      <FeatureRows items={dict.details.items} columns={2} />
    </SectionShell>
  );
}

export function MarketingHowSection({
  dict,
  embedded = false,
  withFinalCta = true,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <>
      <SectionShell
        embedded={embedded}
        eyebrow={dict.how.eyebrow}
        title={dict.how.title}
        tone="cream"
      >
        <div className="max-w-3xl">
          <HowStepsEditorial steps={dict.how.steps} />
        </div>
      </SectionShell>
      {withFinalCta && !embedded ? (
        <MarketingFinalCta
          eyebrow={dict.finalCta.eyebrow}
          title={dict.finalCta.title}
          cta={dict.finalCta.cta}
          secondaryHref="/demo"
          secondaryLabel={dict.ctaSecondary}
        />
      ) : null}
    </>
  );
}

export function MarketingIndustriesSection({
  dict,
  embedded = false,
  withFinalCta = true,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <>
      <SectionShell
        embedded={embedded}
        eyebrow={dict.industries.eyebrow}
        title={dict.industries.title}
        subtitle={dict.industries.subtitle}
        tone="plain"
      >
        <ul className="grid gap-px overflow-hidden rounded-xl border border-border/80 bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
          {dict.industries.items.map((name, index) => (
            <li
              key={name}
              className="flex min-h-[88px] items-start gap-3 bg-card px-5 py-5"
            >
              <FeatureIndex n={index + 1} className="mt-0" />
              <span className="pt-1 font-medium leading-snug tracking-tight text-foreground">
                {name}
              </span>
            </li>
          ))}
        </ul>
      </SectionShell>
      {withFinalCta && !embedded ? (
        <MarketingFinalCta
          eyebrow={dict.finalCta.eyebrow}
          title={dict.finalCta.title}
          cta={dict.finalCta.cta}
          secondaryHref="/demo"
          secondaryLabel={dict.ctaSecondary}
        />
      ) : null}
    </>
  );
}

export function MarketingPricingSection({
  dict,
  note,
  withFinalCta = true,
  embedded = false,
}: {
  dict: MarketingDict;
  note?: string;
} & SectionMode) {
  const plans = Object.values(PLANS);

  return (
    <>
      <SectionShell
        embedded={embedded}
        eyebrow={dict.pricing.eyebrow}
        title={dict.pricing.title}
        subtitle={dict.pricing.subtitle}
        tone="cream"
      >
        <SetupFeeBanner dict={dict} />

        <h3 className="mt-12 font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {dict.pricing.monthlyTitle}
        </h3>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              dict={dict}
              plan={plan}
              highlighted={plan.id === "BUSINESS"}
            />
          ))}
        </div>

        {note ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{note}</p>
        ) : null}
      </SectionShell>
      {withFinalCta && !embedded ? (
        <MarketingFinalCta
          eyebrow={dict.finalCta.eyebrow}
          title={dict.finalCta.title}
          cta={dict.finalCta.cta}
          secondaryHref="/demo"
          secondaryLabel={dict.ctaSecondary}
        />
      ) : null}
    </>
  );
}

function SetupFeeBanner({ dict }: { dict: MarketingDict }) {
  return (
    <div className="grid overflow-hidden rounded-xl border border-border/80 bg-card lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)]">
      <div className="border-b border-border/70 p-6 sm:p-8 lg:border-b-0 lg:border-r">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
          {dict.pricing.setupOnce}
        </p>
        <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {dict.pricing.setupTitle}
        </h3>
        <p className="mt-3 max-w-xl text-base leading-[1.7] text-ink-soft">
          {dict.pricing.setupBody}
        </p>
        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {dict.pricing.setupIncludes.map((item) => (
            <li key={item} className="flex gap-2.5 text-sm text-ink-soft">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">
          {dict.pricing.setupNote}
        </p>
      </div>
      <div className="flex flex-col items-start justify-center bg-[#f8fafc] px-6 py-8 sm:px-8 lg:items-center lg:text-center">
        <p className="font-display text-5xl font-semibold tracking-tight sm:text-6xl">
          €{SETUP_FEE_EUR}
        </p>
        <p className="mt-2 text-sm font-medium text-ink-soft">
          {dict.pricing.setupOnce}
        </p>
        <Button asChild size="lg" className="mt-6 rounded-md px-8">
          <Link href="/register">{dict.pricing.cta}</Link>
        </Button>
      </div>
    </div>
  );
}

function PlanCard({
  dict,
  plan,
  highlighted,
}: {
  dict: MarketingDict;
  plan: (typeof PLANS)[keyof typeof PLANS];
  highlighted?: boolean;
}) {
  const features = dict.pricing.features[plan.id] ?? [];
  const isFree = plan.priceMonthlyEur === 0;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card p-6",
        highlighted
          ? "border-primary/40 shadow-[0_0_0_1px_rgba(59,130,246,0.12)]"
          : "border-border/80",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {plan.name}
        </h3>
        {highlighted ? (
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            {dict.pricing.recommended}
          </span>
        ) : null}
      </div>

      <p className="mt-4 font-display text-3xl font-semibold tracking-tight">
        {isFree ? "€0" : `€${plan.priceMonthlyEur}`}
        <span className="text-sm font-normal text-muted-foreground">
          {dict.pricing.perMonth}
        </span>
      </p>

      {!isFree ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          + {dict.pricing.setupPrice} {dict.pricing.setupOnce}
        </p>
      ) : null}

      <p className="mt-3 text-sm text-ink-soft">
        {dict.pricing.conversations.replace(
          "{count}",
          plan.conversationLimit.toLocaleString(
            dict.locale === "en" ? "en-GB" : "lv-LV",
          ),
        )}
      </p>

      <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-soft">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <Check
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden
            />
            {f}
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={highlighted ? "default" : "outline"}
        className="mt-6 w-full rounded-md"
      >
        <Link href="/register">{dict.pricing.cta}</Link>
      </Button>
    </div>
  );
}

export function MarketingFaqSection({
  dict,
  embedded = false,
  withFinalCta = true,
}: { dict: MarketingDict } & SectionMode) {
  return (
    <>
      <SectionShell
        embedded={embedded}
        eyebrow={dict.faq.eyebrow}
        title={dict.faq.title}
        tone="cream"
      >
        <div className="max-w-3xl">
          {dict.faq.items.map((item, index) => (
            <details
              key={item.q}
              className="group border-b border-border/70 py-5 first:pt-0"
            >
              <summary className="cursor-pointer list-none marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-4">
                  <FeatureIndex n={index + 1} />
                  <span className="pt-1 font-display text-lg font-semibold tracking-tight sm:text-xl">
                    {item.q}
                  </span>
                  <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 pl-12 text-sm leading-[1.8] text-ink-soft">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </SectionShell>
      {withFinalCta && !embedded ? (
        <MarketingFinalCta
          eyebrow={dict.finalCta.eyebrow}
          title={dict.finalCta.title}
          cta={dict.finalCta.cta}
          secondaryHref="/register"
          secondaryLabel={dict.ctaPrimary}
        />
      ) : null}
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
