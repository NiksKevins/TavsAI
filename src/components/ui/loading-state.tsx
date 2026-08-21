import { Loader2 } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  rows?: number;
};

/** Skeleton placeholders for content areas. */
export function LoadingState({ className, rows = 4 }: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  );
}

/** Full-page / route loading screen with spinner. */
export function PageLoading({
  label = "Ielādē…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-16",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Compact inline spinner for buttons / small areas. */
export function Spinner({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      {label ? <span className="text-sm">{label}</span> : null}
      <span className="sr-only">{label || "Loading"}</span>
    </span>
  );
}
