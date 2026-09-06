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
import { SETUP_FEE_EUR } from "@/config/plans";
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

export function LandingHome({ dict }: { dict: MarketingDict }) {
  return (
    <div>
      <HomeHero dict={dict} />
      <HomeDemoStage dict={dict} />
      <MarketingProblemSection dict={dict} />
      <MarketingSolutionSection dict={dict} />
      <MarketingDetailsSection dict={dict} />
      <MarketingHowSection dict={dict} withFinalCta={false} />
      <MarketingIndustriesSection dict={dict} withFinalCta={false} />
      <HomePricingTeaser dict={dict} />
      <MarketingFaqSection dict={dict} withFinalCta={false} />
      <MarketingFinalCtaSection dict={dict} />
    </div>
  );
}

function HomeHero({ dict }: { dict: MarketingDict }) {
  return (
    <section className="marketing-hero-bg relative border-b border-border/60">
      <div aria-hidden className="marketing-hero-accent pointer-events-none absolute inset-0" />

      <MarketingContainer className="relative grid items-center gap-8 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
        <div className="max-w-xl lg:max-w-none">
          <MarketingEyebrow>{dict.brand}</MarketingEyebrow>

          <h1 className="mt-3 font-display text-[2.25rem] font-semibold leading-[1.06] tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[3rem]">
            {dict.headline}
          </h1>

          <p className="mt-4 max-w-md text-pretty text-base leading-[1.6] text-ink-soft sm:text-lg">
            {dict.subhead}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-11 rounded-md px-6">
              <Link href="/register">{dict.ctaPrimary}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-md px-6">
              <Link href="#demo" className="inline-flex items-center gap-2">
                {dict.ctaSecondary}
                <ArrowDown className="size-4 opacity-50" aria-hidden />
              </Link>
            </Button>
          </div>

          <p className="mt-5 text-[13px] leading-relaxed text-muted-foreground">
            {dict.heroTrust}
          </p>
        </div>

        <HeroProductVisual dict={dict.visuals} className="lg:justify-self-end" />
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
  return (
    <MarketingSection tone="plain" className="border-y border-border/50">
      <MarketingContainer>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <MarketingEyebrow>{dict.pricing.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.bridge.pricingTitle}
            </h2>
            <p className="mt-3 text-base leading-[1.65] text-ink-soft">
              {dict.bridge.pricingBody}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {dict.pricing.setupPrice} {dict.pricing.setupOnce} (€{SETUP_FEE_EUR}) ·{" "}
              {dict.pricing.monthlyTitle.toLowerCase()}
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-6">
            <Link href="/pricing" className="inline-flex items-center gap-2">
              {dict.bridge.linkLabel}
              <ArrowRight className="size-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
