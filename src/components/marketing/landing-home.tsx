import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown } from "lucide-react";

import {
  MarketingContainer,
  MarketingDemoStage,
  MarketingEyebrow,
  MarketingFinalCta,
  MarketingSection,
} from "@/components/marketing/marketing-ui";
import { HowStepsEditorial } from "@/components/marketing/how-steps";
import { HeroProductVisual } from "@/components/marketing/product-visuals";
import { Button } from "@/components/ui/button";
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
      <HomeHow dict={dict} />
      <MarketingFinalCta
        eyebrow={dict.finalCta.eyebrow}
        title={dict.finalCta.title}
        cta={dict.finalCta.cta}
        secondaryHref="/register"
        secondaryLabel={dict.ctaPrimary}
      />
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

function HomeHow({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingSection tone="plain" className="border-y border-border/50">
      <MarketingContainer wide>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-12">
          <div className="lg:self-start">
            <MarketingEyebrow>{dict.how.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.how.title}
            </h2>
          </div>
          <HowStepsEditorial steps={dict.how.steps} />
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}
