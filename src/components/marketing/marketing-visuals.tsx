import { cn } from "@/lib/utils";

/** Decorative SVG + layout helpers for marketing pages. */

export function HeroOrb({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="200" cy="200" r="180" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="200" cy="200" r="120" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
      <circle cx="200" cy="200" r="60" fill="currentColor" fillOpacity="0.04" />
    </svg>
  );
}

export function TrustPills({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-border/70 bg-white/60 px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-muted-foreground backdrop-blur-sm sm:text-[13px]"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

export function EditorialDivider({ label }: { label?: string }) {
  return (
    <div className="marketing-rule relative my-0">
      {label ? (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}

export function FeatureIndex({
  n,
  className,
}: {
  n: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block w-12 shrink-0 text-right font-display text-[2.75rem] font-semibold leading-none tracking-tighter text-primary/[0.12] sm:w-16 sm:text-[3.25rem] lg:text-[3.75rem]",
        className,
      )}
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}
