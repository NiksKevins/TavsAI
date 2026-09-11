import { cn } from "@/lib/utils";

/** Shared decorative helpers — keep list indexes identical site-wide. */

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

/** Single index style for every marketing list (problem / features / how / FAQ). */
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
        "mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-background font-display text-[12px] font-semibold tabular-nums tracking-tight text-primary",
        className,
      )}
      aria-hidden
    >
      {String(n).padStart(2, "0")}
    </span>
  );
}

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
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <li
          key={item}
          className="text-[13px] font-medium tracking-wide text-muted-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
