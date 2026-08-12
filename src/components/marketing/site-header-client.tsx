"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { LocaleSwitcher } from "@/components/marketing/locale-switcher";
import { Button } from "@/components/ui/button";
import { Link as LocaleLink } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type HeaderLink = {
  href: "/demo" | "/how" | "/pricing" | "/faq" | "/industries";
  label: string;
};

type Labels = {
  brand: string;
  login: string;
  register: string;
  menuOpen: string;
  menuClose: string;
  menuTitle: string;
  language: string;
};

export function SiteHeaderClient({
  links,
  labels,
}: {
  links: HeaderLink[];
  labels: Labels;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (window.matchMedia("(min-width: 768px)").matches) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-3.5">
      <div
        className={cn(
          "mx-auto flex h-12 w-full max-w-5xl items-center justify-between gap-2",
          "rounded-full border border-border/60 bg-background/85 pl-4 pr-2",
          "shadow-[0_8px_32px_-8px_rgba(18,31,27,0.12)] backdrop-blur-xl",
          "sm:h-14 sm:gap-3 sm:pl-6 sm:pr-3",
        )}
      >
        <LocaleLink
          href="/"
          className="min-w-0 shrink font-display text-[14px] font-semibold tracking-[-0.02em] text-foreground sm:text-[15px] md:text-base"
          onClick={() => setOpen(false)}
        >
          <span className="truncate">{labels.brand}</span>
        </LocaleLink>

        {/* Desktop / tablet nav */}
        <nav
          className="hidden items-center gap-0.5 md:flex md:gap-1"
          aria-label={labels.menuTitle}
        >
          {links.map((link) => (
            <LocaleLink
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {link.label}
            </LocaleLink>
          ))}
          <div
            className="mx-1 hidden h-3.5 w-px bg-border/80 lg:block"
            aria-hidden
          />
          <LocaleSwitcher />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden h-8 rounded-full text-[13px] lg:inline-flex"
          >
            <Link href="/login">{labels.login}</Link>
          </Button>
          <Button
            asChild
            size="sm"
            className="h-8 rounded-full px-4 text-[13px] shadow-sm"
          >
            <Link href="/register">{labels.register}</Link>
          </Button>
        </nav>

        {/* Mobile: brand + menu only — CTA lives in the panel */}
        <div className="flex items-center md:hidden">
          <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
            <DialogPrimitive.Trigger asChild>
              <button
                type="button"
                className={cn(
                  "relative inline-flex size-10 cursor-pointer items-center justify-center rounded-full",
                  "border border-border/70 bg-card/90 text-foreground shadow-sm",
                  "transition-colors hover:bg-secondary/80",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                aria-label={open ? labels.menuClose : labels.menuOpen}
                aria-expanded={open}
              >
                <span className="sr-only">
                  {open ? labels.menuClose : labels.menuOpen}
                </span>
                <span className="relative block h-3.5 w-[18px]" aria-hidden>
                  <span
                    className={cn(
                      "absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "top-[6px] rotate-45" : "top-0.5 rotate-0",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 top-[6px] block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
                    )}
                  />
                  <span
                    className={cn(
                      "absolute left-0 block h-[1.5px] w-full rounded-full bg-current transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      open ? "top-[6px] -rotate-45" : "top-[11px] rotate-0",
                    )}
                  />
                </span>
              </button>
            </DialogPrimitive.Trigger>

            <DialogPrimitive.Portal>
              <DialogPrimitive.Overlay
                className={cn(
                  "fixed inset-0 z-[60] bg-[#0b1220]/45 backdrop-blur-[2px]",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                )}
              />
              <DialogPrimitive.Content
                className={cn(
                  "fixed inset-y-0 right-0 z-[70] flex w-[min(100vw,24rem)] flex-col",
                  "border-l border-white/10 bg-[#0b1220] text-white outline-none",
                  "shadow-[-24px_0_80px_-20px_rgba(0,0,0,0.55)]",
                  "data-[state=open]:animate-in data-[state=closed]:animate-out",
                  "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
                  "duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                )}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_100%_0%,rgba(59,130,246,0.22),transparent_55%)]"
                />

                <div className="relative flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <DialogPrimitive.Title className="font-display text-lg font-semibold tracking-tight text-white">
                      {labels.brand}
                    </DialogPrimitive.Title>
                    <DialogPrimitive.Description className="mt-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {labels.menuTitle}
                    </DialogPrimitive.Description>
                  </div>
                  <DialogPrimitive.Close
                    className={cn(
                      "inline-flex size-10 cursor-pointer items-center justify-center rounded-full",
                      "border border-white/15 bg-white/5 text-white",
                      "transition-colors hover:bg-white/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                    )}
                    aria-label={labels.menuClose}
                  >
                    <span className="relative block h-3.5 w-[18px]" aria-hidden>
                      <span className="absolute left-0 top-[6px] block h-[1.5px] w-full rotate-45 rounded-full bg-current" />
                      <span className="absolute left-0 top-[6px] block h-[1.5px] w-full -rotate-45 rounded-full bg-current" />
                    </span>
                  </DialogPrimitive.Close>
                </div>

                <nav className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-5">
                  {links.map((link) => (
                    <LocaleLink
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group flex items-center justify-between rounded-2xl px-4 py-3.5",
                        "text-left transition-colors hover:bg-white/6",
                      )}
                    >
                      <span className="font-display text-[1.35rem] font-semibold tracking-[-0.03em] text-white">
                        {link.label}
                      </span>
                      <span
                        className="text-sm text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300"
                        aria-hidden
                      >
                        →
                      </span>
                    </LocaleLink>
                  ))}
                </nav>

                <div className="relative space-y-4 border-t border-white/10 px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {labels.language}
                    </p>
                    <LocaleSwitcher tone="dark" />
                  </div>

                  <div className="grid gap-2.5">
                    <Button
                      asChild
                      size="lg"
                      className="h-12 w-full rounded-full bg-white text-base font-semibold text-[#0b1220] hover:bg-slate-100"
                    >
                      <Link href="/register" onClick={() => setOpen(false)}>
                        {labels.register}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="ghost"
                      className="h-11 w-full rounded-full border border-white/15 bg-transparent text-white hover:bg-white/8 hover:text-white"
                    >
                      <Link href="/login" onClick={() => setOpen(false)}>
                        {labels.login}
                      </Link>
                    </Button>
                  </div>
                </div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        </div>
      </div>
    </header>
  );
}
