import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { EditorialDivider, FeatureIndex } from "@/components/marketing/marketing-visuals";
import { Link as LocaleLink } from "@/i18n/navigation";

type HowStep = { title: string; body: string };
type LocaleHref = "/how" | "/pricing" | "/demo" | "/faq" | "/industries" | "/";

function isLocaleHref(href: string): href is LocaleHref {
  return ["/", "/how", "/pricing", "/demo", "/faq", "/industries"].includes(href);
}

export function HowStepsEditorial({
  steps,
  linkHref,
  linkLabel,
}: {
  steps: HowStep[];
  linkHref?: string;
  linkLabel?: string;
}) {
  return (
    <ol>
      {steps.map((step, index) => (
        <li key={step.title}>
          {index > 0 ? <EditorialDivider /> : null}
          <article className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 py-5 sm:gap-x-5 sm:py-6">
            <FeatureIndex n={index + 1} />
            <div className="min-w-0">
              <h3 className="font-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-[1.7] text-ink-soft sm:text-lg sm:leading-[1.65]">
                {step.body}
              </p>
              {index === steps.length - 1 && linkHref && linkLabel ? (
                isLocaleHref(linkHref) ? (
                  <LocaleLink
                    href={linkHref}
                    className="link-premium-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    {linkLabel}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </LocaleLink>
                ) : (
                  <Link
                    href={linkHref}
                    className="link-premium-primary mt-3 inline-flex items-center gap-1.5 text-sm font-medium"
                  >
                    {linkLabel}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </Link>
                )
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
