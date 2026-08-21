import { cn } from "@/lib/utils";

/** TavsWebs Bot mark — chat bubble + live AI pulse on navy. */
export function BrandMark({
  className,
  title = "TavsWebs Bot",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("size-8 shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="9" fill="#0A1220" />
      <path
        fill="#FFFFFF"
        d="M8 10c0-1.657 1.343-3 3-3h10c1.657 0 3 1.343 3 3v7.5c0 1.657-1.343 3-3 3h-4.85L11.2 24.2c-.45.35-1.1.03-1.1-.5V20.5H11c-1.657 0-3-1.343-3-3V10z"
      />
      <circle cx="23" cy="9" r="5" fill="#0A1220" />
      <circle cx="23" cy="9" r="3.6" fill="#3B82F6" />
      <circle cx="23" cy="9" r="1.35" fill="#FFFFFF" />
    </svg>
  );
}

type BrandLockupProps = {
  className?: string;
  title?: string;
  subtitle?: string;
  markClassName?: string;
};

/** Mark + wordmark for sidebar / headers. */
export function BrandLockup({
  className,
  title = "TavsWebs Bot",
  subtitle,
  markClassName,
}: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className={cn("size-8", markClassName)} title={title} />
      <div className="min-w-0">
        <p className="truncate font-display text-sm font-semibold leading-none tracking-tight">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
