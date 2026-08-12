import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { EditorialDivider, FeatureIndex } from "@/components/marketing/marketing-visuals";

type HowStep = { title: string; body: string };

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
              <h3 className="font-sans text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-[1.75] text-ink-soft sm:text-base sm:leading-[1.7]">
                {step.body}
              </p>
              {index === steps.length - 1 && linkHref && linkLabel ? (
                <Link
                  href={linkHref}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  {linkLabel}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}
