import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import {
  MarketingBridgeCard,
  MarketingContainer,
  MarketingDemoStage,
  MarketingEyebrow,
  MarketingFinalCta,
  MarketingSection,
} from "@/components/marketing/marketing-ui";
import { HowStepsEditorial } from "@/components/marketing/how-steps";
import {
  EditorialDivider,
  FeatureIndex,
} from "@/components/marketing/marketing-visuals";
import {
  HeroProductVisual,
  ProductShowcaseRow,
} from "@/components/marketing/product-visuals";
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
      <ProductShowcaseRow dict={dict.visuals} />
      <HomeDemoStage dict={dict} />
      <HomeProblem dict={dict} />
      <HomeSolution dict={dict} />
      <HomeHow dict={dict} />
      <HomeBridge dict={dict} />
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

/** Left-aligned editorial hero — quiet, no template effects. */
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

          <p className="mt-4 max-w-lg text-pretty text-base leading-[1.65] text-ink-soft sm:text-lg">
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

/** Centered live demo — flows from hero scroll anchor. */
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

/** Magazine-style problem list — not a card grid. */
function HomeProblem({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingSection tone="plain">
      <MarketingContainer wide>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-12">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MarketingEyebrow>{dict.problem.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.problem.title}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {dict.problem.hint}
            </p>
          </div>

          <ol className="divide-y divide-border/80 sm:pl-2">
            {dict.problem.items.map((item, index) => (
              <li
                key={item}
                className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-5 first:pt-0 last:pb-0 sm:gap-x-5 sm:py-6"
              >
                <FeatureIndex n={index + 1} />
                <p className="min-w-0 self-center text-base leading-[1.75] text-ink-soft sm:text-lg sm:leading-[1.7]">
                  {item}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

/** Sticky title + scrolling feature stack. */
function HomeSolution({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingSection tone="cream">
      <MarketingContainer wide>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:gap-12">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MarketingEyebrow>{dict.solution.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.solution.title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-ink-soft">
              {dict.solution.subtitle}
            </p>
            <p className="mt-5 hidden max-w-xs text-sm leading-relaxed text-muted-foreground lg:block">
              {dict.solutionFootnote}
            </p>
          </div>

          <ul className="space-y-0 sm:pl-2">
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
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

/** Editorial step list — matches problem/solution rhythm, no timeline cliché. */
function HomeHow({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingSection tone="plain" className="border-y border-border/50">
      <MarketingContainer wide>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.36fr)_minmax(0,0.64fr)] lg:gap-12">
          <div className="lg:sticky lg:top-20 lg:self-start">
            <MarketingEyebrow>{dict.how.eyebrow}</MarketingEyebrow>
            <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.1] tracking-[-0.04em] sm:text-3xl">
              {dict.how.title}
            </h2>
            <Link
              href="/how"
              className="link-premium-primary mt-4 inline-flex items-center gap-1.5 text-sm font-medium"
            >
              {dict.bridge.linkLabel}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>

          <HowStepsEditorial steps={dict.how.steps} />
        </div>
      </MarketingContainer>
    </MarketingSection>
  );
}

function HomeBridge({ dict }: { dict: MarketingDict }) {
  return (
    <MarketingSection tone="cream">
      <MarketingContainer className="grid gap-4 sm:grid-cols-2">
        <MarketingBridgeCard
          href="/how"
          title={dict.bridge.howTitle}
          body={dict.bridge.howBody}
          linkLabel={dict.bridge.linkLabel}
          index={1}
        />
        <MarketingBridgeCard
          href="/pricing"
          title={dict.bridge.pricingTitle}
          body={dict.bridge.pricingBody}
          linkLabel={dict.bridge.linkLabel}
          index={2}
        />
      </MarketingContainer>
    </MarketingSection>
  );
}
