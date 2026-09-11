import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

import {
  MarketingContainer,
  MarketingDemoStage,
  MarketingEyebrow,
  MarketingSection,
} from "@/components/marketing/marketing-ui";
import {
  MarketingDetailsSection,
  MarketingFaqSection,
  MarketingFinalCtaSection,
  MarketingHowSection,
  MarketingIndustriesSection,
  MarketingProblemSection,
  MarketingSolutionSection,
} from "@/components/marketing/marketing-sections";
import { HeroProductVisual } from "@/components/marketing/product-visuals";
import { Button } from "@/components/ui/button";
import { PLANS, SETUP_FEE_EUR } from "@/config/plans";
import type { MarketingDict } from "@/lib/marketing/get-marketing-dict";

const LiveDemoChat = dynamic(
  () =>
    import("@/components/marketing/live-demo-chat").then((m) => m.LiveDemoChat),
  {
    loading: () => (
      <div className="min-h-[400px] rounded-xl border border-border/80 bg-muted/40" />
    ),
  },
);

export function LandingHome({ dict }: { dict: MarketingDict }) {
  return (
    <div>
      <HomeHero dict={dict} />
      <HomeDemoStage dict={dict} />
      <MarketingProblemSection dict={dict} embedded />
      <MarketingSolutionSection dict={dict} embedded />
      <MarketingDetailsSection dict={dict} embedded />
      <MarketingHowSection dict={dict} embedded withFinalCta={false} />
      <MarketingIndustriesSection dict={dict} embedded withFinalCta={false} />
      <HomePricingTeaser dict={dict} />
      <MarketingFaqSection dict={dict} embedded withFinalCta={false} />
      <MarketingFinalCtaSection dict={dict} />
    </div>
  );
}

function HomeHero({ dict }: { dict: MarketingDict }) {
  return (
    <section className="marketing-hero-bg relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="marketing-hero-accent pointer-events-none absolute inset-0"
      />

      <MarketingContainer className="relative grid items-center gap-10 py-14 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-20">
        <div className="max-w-xl">
          <p className="font-display text-sm font-semibold tracking-[0.08em] text-primary sm:text-base">
            {dict.brand}
          </p>

          <h1 className="mt-4 font-display text-[2.5rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[3.25rem]">
            {dict.headline}
          </h1>

          <p className="mt-5 max-w-md text-pretty text-base leading-[1.65] text-ink-soft sm:text-lg">
            {dict.subhead}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 rounded-md px-7">
              <Link href="/register">{dict.ctaPrimary}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-11 rounded-md px-7"
            >
              <Link href="#demo" className="inline-flex items-center gap-2">
                {dict.ctaSecondary}
                <ArrowDown className="size-4 opacity-50" aria-hidden />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-[13px] leading-relaxed text-muted-foreground">
            {dict.heroTrust}
          </p>
        </div>

        <HeroProductVisual
          dict={dict.visuals}
          className="lg:justify-self-end"
        />
      </MarketingContainer>
    </section>
  );
}

function HomeDemoStage({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingDemoStage
      eyebrow={dict.heroProof}
      title={dict.demoTitle}
      hint={dict.demoSubtitle}
      chooseLabel={dict.demoChoose}
    >
      <LiveDemoChat variant="showcase" />
    </MarketingDemoStage>
  );
}

function HomePricingTeaser({ dict }: { dict: MarketingDict }) {
  const fromLabel = dict.locale === "lv" ? "no" : "from";
  const monthlyFrom = PLANS.STARTER.priceMonthlyEur;

  return (
    <MarketingSection tone="cream" className="border-y border-border/40">
      <MarketingContainer>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <MarketingEyebrow>{dict.pricing.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.pricing.title}
            </h2>
            <p className="mt-4 max-w-xl text-base leading-[1.7] text-ink-soft">
              {dict.pricing.subtitle}
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0 rounded-md px-7">
            <Link href="/pricing" className="inline-flex items-center gap-2">
              {dict.bridge.linkLabel}
              <ArrowRight className="size-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border/80 bg-border/70 sm:grid-cols-2">
          <div className="bg-card px-6 py-7 sm:px-8 sm:py-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {dict.pricing.setupTitle}
            </p>
            <p className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              €{SETUP_FEE_EUR}
            </p>
            <p className="mt-2 text-sm text-ink-soft">{dict.pricing.setupOnce}</p>
          </div>
          <div className="bg-card px-6 py-7 sm:px-8 sm:py-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              {dict.pricing.monthlyTitle}
            </p>
            <p className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
              {fromLabel} €{monthlyFrom}
            </p>
            <p className="mt-2 text-sm text-ink-soft">{dict.pricing.perMonth.trim()}</p>
          </div>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
