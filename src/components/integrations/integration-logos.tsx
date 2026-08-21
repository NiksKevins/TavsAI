import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Brand-colored marks for integration cards (not official trademark assets). */
export function GoogleCalendarLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-10", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id="gcalTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#1A73E8" />
        </linearGradient>
      </defs>
      <rect x="5" y="8" width="38" height="34" rx="6" fill="#fff" stroke="#E8EAED" />
      <path
        d="M5 14c0-3.3 2.7-6 6-6h26c3.3 0 6 2.7 6 6v6H5v-6z"
        fill="url(#gcalTop)"
      />
      <rect x="14" y="5" width="3.5" height="8" rx="1.75" fill="#4285F4" />
      <rect x="30.5" y="5" width="3.5" height="8" rx="1.75" fill="#4285F4" />
      <circle cx="16" cy="28" r="2.2" fill="#EA4335" />
      <circle cx="24" cy="28" r="2.2" fill="#FBBC04" />
      <circle cx="32" cy="28" r="2.2" fill="#34A853" />
      <circle cx="16" cy="36" r="2.2" fill="#4285F4" />
      <circle cx="24" cy="36" r="2.2" fill="#EA4335" />
      <circle cx="32" cy="36" r="2.2" fill="#FBBC04" />
    </svg>
  );
}

export function OutlookLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-10", className)}
      aria-hidden
    >
      <rect x="16" y="7" width="26" height="34" rx="3" fill="#0078D4" />
      <path
        fill="#fff"
        d="M21 15h16v2.8H21zm0 7h13v2.5H21zm0 6.5h10v2.5H21z"
        opacity="0.95"
      />
      <path
        d="M6 15.5c0-1.4 1.1-2.5 2.5-2.5H22v22H8.5C7.1 35 6 33.9 6 32.5v-17z"
        fill="#0A5AA8"
      />
      <ellipse cx="14" cy="24.5" rx="5.2" ry="6.2" fill="#fff" />
      <ellipse cx="14" cy="24.5" rx="3.2" ry="4" fill="#0A5AA8" />
    </svg>
  );
}

export function CalendlyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-10", className)}
      aria-hidden
    >
      <rect x="4" y="4" width="40" height="40" rx="10" fill="#006BFF" />
      <path
        fill="#fff"
        d="M24 12c6.6 0 12 5.4 12 12h-6.2A5.8 5.8 0 1 0 24 18.2V12z"
      />
      <circle cx="31.5" cy="16.5" r="3.2" fill="#fff" />
    </svg>
  );
}

export function CustomBookingLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("size-10", className)}
      aria-hidden
    >
      <rect x="5" y="8" width="38" height="32" rx="8" fill="#0F766E" />
      <path
        d="M14 19h20M14 25h14M14 31h17"
        stroke="#99F6E4"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="34" cy="31" r="6" fill="#5EEAD4" />
      <path
        d="M34 28.2v5.6M31.2 31h5.6"
        stroke="#0F766E"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IntegrationLogoMark({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border/80 bg-white shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}
