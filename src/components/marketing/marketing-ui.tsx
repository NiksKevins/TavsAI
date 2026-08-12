import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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
        "text-[11px] font-semibold uppercase tracking-[0.24em]",
        light ? "text-text-muted-on-dark" : "text-primary",
        className,
      )}
    >
      {children}
    </p>
  );
}

/** Subpage intro — left-aligned editorial, generous vertical rhythm. */
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
          "relative py-10 sm:py-12",
          align === "center" && "text-center",
        )}
      >
        {eyebrow ? (
          <MarketingEyebrow className={align === "center" ? "mx-auto" : undefined}>
            {eyebrow}
          </MarketingEyebrow>
        ) : null}
        <h1
          className={cn(
            "mt-3 font-display text-[2.75rem] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-4xl lg:text-[3rem]",
            align === "center" ? "mx-auto max-w-4xl" : "max-w-3xl",
          )}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            className={cn(
              "mt-4 text-base leading-[1.65] text-ink-soft sm:text-lg",
              align === "center" ? "mx-auto max-w-2xl" : "max-w-xl",
            )}
          >
            {subtitle}
          </p>
        ) : null}
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
    cream: "bg-[#f8fafc] text-foreground",
    dark: "marketing-stage-bg text-[#dce8e2]",
  };

  return (
    <section
      id={id}
      className={cn(
        "relative py-10 sm:py-14 [content-visibility:auto]",
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
  href: string;
  title: string;
  body: string;
  linkLabel: string;
  index: number;
}) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_12px_40px_-20px_rgba(18,31,27,0.15)] sm:p-6"
    >
      <span className="font-display text-6xl font-semibold leading-none text-primary/[0.08]">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h3 className="font-display text-2xl font-semibold tracking-tight">{title}</h3>
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
    </Link>
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
      <MarketingContainer className="relative grid gap-8 py-12 sm:grid-cols-[1.2fr_0.8fr] sm:items-end sm:py-16">
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
            className="h-12 w-full rounded-full bg-white px-8 text-base text-surface-dark shadow-xl hover:bg-slate-50 sm:w-auto"
          >
            <Link href="/register">{cta}</Link>
          </Button>
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="text-center text-sm text-text-muted-on-dark transition-colors hover:text-text-on-dark sm:text-left"
            >
              {secondaryLabel} →
            </Link>
          ) : null}
        </div>
      </MarketingContainer>
    </section>
  );
}

/** Centered product showcase — intro + widget stack, no awkward split columns. */
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
      className="relative overflow-hidden border-y border-border/70 bg-gradient-to-b from-[#f1f5f9] via-[#f8fafc] to-background"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(59,130,246,0.1),transparent_60%)]"
      />
      <MarketingContainer className="relative py-10 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <MarketingEyebrow>{eyebrow}</MarketingEyebrow>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-[1.12] tracking-[-0.04em] text-foreground sm:text-3xl">
            {title}
          </h2>
          {hint ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft sm:text-base">{hint}</p>
          ) : null}
        </div>

        <div className="mx-auto mt-6 w-full max-w-[440px] sm:mt-8">
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
