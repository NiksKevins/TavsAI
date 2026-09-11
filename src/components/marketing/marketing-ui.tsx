import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function MarketingContainer({
  className,
  children,
  narrow,
  wide,
}: {
  className?: string;
  children: React.ReactNode;
  narrow?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8",
        narrow ? "max-w-3xl" : wide ? "max-w-7xl" : "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MarketingEyebrow({
  children,
  className,
  light,
}: {
  children: React.ReactNode;
  className?: string;
  light?: boolean;
}) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold uppercase tracking-[0.22em]",
        light ? "text-text-muted-on-dark" : "text-primary",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Shared section title block — used on home (embedded) and as subpage hero content. */
export function MarketingSectionIntro({
  eyebrow,
  title,
  subtitle,
  align = "left",
  as = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
  className?: string;
}) {
  const TitleTag = as;
  return (
    <div
      className={cn(
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <MarketingEyebrow className={align === "center" ? "mx-auto" : undefined}>
          {eyebrow}
        </MarketingEyebrow>
      ) : null}
      <TitleTag
        className={cn(
          "mt-3 font-display font-semibold tracking-[-0.04em] text-foreground",
          as === "h1"
            ? "text-[2.5rem] leading-[1.05] sm:text-4xl lg:text-[3rem]"
            : "text-[1.85rem] leading-[1.1] sm:text-3xl lg:text-[2.35rem]",
          align === "center" ? "mx-auto max-w-3xl" : "max-w-3xl",
        )}
      >
        {title}
      </TitleTag>
      {subtitle ? (
        <p
          className={cn(
            "mt-4 text-base leading-[1.7] text-ink-soft sm:text-lg",
            align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

/** Subpage intro — full-bleed band once per route. */
export function MarketingPageHero({
  eyebrow,
  title,
  subtitle,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="marketing-hero-bg relative overflow-hidden border-b border-border/50">
      <MarketingContainer
        className={cn(
          "relative py-12 sm:py-16",
          align === "center" && "text-center",
        )}
      >
        <MarketingSectionIntro
          eyebrow={eyebrow}
          title={title}
          subtitle={subtitle}
          align={align}
          as="h1"
        />
        {children}
      </MarketingContainer>
    </section>
  );
}

export function MarketingSection({
  children,
  className,
  id,
  tone = "plain",
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  tone?: "plain" | "cream" | "dark";
}) {
  const tones = {
    plain: "bg-background text-foreground",
    cream: "bg-[#f4f7fb] text-foreground",
    dark: "marketing-stage-bg text-[#dce8e2]",
  };

  return (
    <section
      id={id}
      className={cn(
        "relative py-14 sm:py-20 [content-visibility:auto]",
        tones[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MarketingBridgeCard({
  href,
  title,
  body,
  linkLabel,
  index,
}: {
  href: "/how" | "/pricing" | "/demo" | "/faq" | "/industries" | "/";
  title: string;
  body: string;
  linkLabel: string;
  index: number;
}) {
  return (
    <LocaleLink
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-colors duration-300 hover:border-primary/25 sm:p-6"
    >
      <span className="font-display text-5xl font-semibold leading-none text-primary/[0.1]">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h3>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
        <span className="border-b border-primary/25 pb-px transition-colors group-hover:border-primary">
          {linkLabel}
        </span>
        <ArrowUpRight
          className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </LocaleLink>
  );
}

export function MarketingFinalCta({
  eyebrow,
  title,
  cta,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  cta: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden border-t border-primary/15 bg-surface-dark">
      <div aria-hidden className="marketing-stage-bg absolute inset-0" />
      <div
        aria-hidden
        className="marketing-noise pointer-events-none absolute inset-0"
      />
      <MarketingContainer className="relative grid gap-8 py-14 sm:grid-cols-[1.2fr_0.8fr] sm:items-end sm:py-20">
        <div>
          <MarketingEyebrow light>{eyebrow}</MarketingEyebrow>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-[1.08] tracking-[-0.04em] text-text-on-dark sm:text-4xl">
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-4 sm:items-start sm:pb-2">
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-md bg-white px-8 text-base text-surface-dark shadow-lg hover:bg-slate-50 sm:w-auto"
          >
            <Link href="/register">{cta}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="link-premium text-center text-sm text-text-muted-on-dark hover:text-text-on-dark sm:text-left"
            >
              {secondaryLabel} →
            </Link>
          ) : null}
        </div>
      </MarketingContainer>
    </section>
  );
}

/** Centered product showcase — intro + widget stack. */
export function MarketingDemoStage({
  eyebrow,
  title,
  hint,
  chooseLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  hint?: string;
  chooseLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id="demo"
      className="relative overflow-hidden border-y border-border/60 bg-gradient-to-b from-[#eef3f9] via-[#f7f9fc] to-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(59,130,246,0.08),transparent_60%)]"
      />
      <MarketingContainer className="relative py-14 sm:py-20">
        <MarketingSectionIntro
          eyebrow={eyebrow}
          title={title}
          subtitle={hint}
          align="center"
        />

        <div className="mx-auto mt-8 w-full max-w-[440px] sm:mt-10">
          {chooseLabel ? (
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {chooseLabel}
            </p>
          ) : null}
          {children}
        </div>
      </MarketingContainer>
    </section>
  );
}
