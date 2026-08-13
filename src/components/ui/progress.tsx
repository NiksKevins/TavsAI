import * as React from "react";

import { cn } from "@/lib/utils";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  /** 0–100. Ignored when `indeterminate` is true. */
  value?: number;
  /** Sliding animation for queued / unknown progress. */
  indeterminate?: boolean;
};

function Progress({
  className,
  value = 0,
  indeterminate = false,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      aria-valuetext={indeterminate ? "in progress" : undefined}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    >
      {indeterminate ? (
        <div className="absolute inset-y-0 w-1/3 animate-[crawl-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-primary" />
      ) : (
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      )}
    </div>
  );
}

export { Progress };
