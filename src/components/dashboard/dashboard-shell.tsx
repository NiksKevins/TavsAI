"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  Calendar,
  ChevronDown,
  Code2,
  CreditCard,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Plug,
  Settings,
  Users,
  BookOpen,
  X,
  type LucideIcon,
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import {
  WhatsNewHeaderButton,
  WhatsNewProvider,
} from "@/components/dashboard/whats-new";
import { Button } from "@/components/ui/button";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { Spinner } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  key: string;
  icon: LucideIcon;
};

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "work",
    items: [
      { href: "/dashboard", key: "overview", icon: LayoutDashboard },
      {
        href: "/dashboard/conversations",
        key: "conversations",
        icon: MessageSquare,
      },
      { href: "/dashboard/leads", key: "leads", icon: Users },
      { href: "/dashboard/appointments", key: "appointments", icon: Calendar },
      { href: "/dashboard/analytics", key: "analytics", icon: BarChart3 },
    ],
  },
  {
    labelKey: "bot",
    items: [
      { href: "/dashboard/knowledge", key: "knowledge", icon: BookOpen },
      { href: "/dashboard/assistant", key: "assistant", icon: Bot },
      { href: "/dashboard/widget", key: "widget", icon: Code2 },
      { href: "/dashboard/integrations", key: "integrations", icon: Plug },
    ],
  },
  {
    labelKey: "account",
    items: [
      { href: "/dashboard/billing", key: "billing", icon: CreditCard },
      { href: "/dashboard/settings", key: "settings", icon: Settings },
    ],
  },
];

const NAV_COLLAPSE_KEY = "tavsai.navGroupsCollapsed";

function itemIsActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupContainsPath(group: NavGroup, pathname: string) {
  return group.items.some((item) => itemIsActive(pathname, item.href));
}

type DashboardShellProps = {
  children: ReactNode;
  user: { name?: string | null; email: string };
  workspace: { name: string; slug: string };
  role: string;
  showPartnerPortal?: boolean;
};

export function DashboardShell({
  children,
  user,
  workspace,
  role,
  showPartnerPortal,
}: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [collapseReady, setCollapseReady] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(NAV_COLLAPSE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, boolean>;
        if (parsed && typeof parsed === "object") setCollapsed(parsed);
      }
    } catch {
      /* ignore */
    }
    setCollapseReady(true);
  }, []);

  useEffect(() => {
    if (!collapseReady) return;
    // Keep the section that owns the current page open.
    setCollapsed((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of NAV_GROUPS) {
        if (groupContainsPath(group, pathname) && next[group.labelKey]) {
          next[group.labelKey] = false;
          changed = true;
        }
      }
      if (changed) {
        try {
          localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
      return changed ? next : prev;
    });
  }, [pathname, collapseReady]);

  const toggleGroup = (labelKey: string) => {
    const group = NAV_GROUPS.find((g) => g.labelKey === labelKey);
    // Keep the section with the current page open.
    if (group && groupContainsPath(group, pathname)) return;

    setCollapsed((prev) => {
      const next = { ...prev, [labelKey]: !prev[labelKey] };
      try {
        localStorage.setItem(NAV_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const onNavClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isActive: boolean,
  ) => {
    if (isNavigating) {
      event.preventDefault();
      return;
    }
    if (isActive) return;
    setIsNavigating(true);
    setOpen(false);
  };

  const openGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => {
      const hasActive = groupContainsPath(group, pathname);
      const isCollapsed = collapseReady
        ? Boolean(collapsed[group.labelKey]) && !hasActive
        : false;
      return { group, hasActive, isCollapsed };
    });
  }, [collapsed, collapseReady, pathname]);

  return (
    <WhatsNewProvider>
      <div className="relative min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
        {isNavigating ? (
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-primary/15"
            aria-hidden
          >
            <div className="h-full w-1/3 animate-[nav-indeterminate_1.1s_ease-in-out_infinite] bg-primary" />
          </div>
        ) : null}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card transition-transform lg:static lg:w-auto lg:translate-x-0",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
            <div>
              <p className="font-display text-sm font-semibold leading-none">
                TavsWebs Bot
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {workspace.name}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-3" aria-busy={isNavigating}>
            <div className="space-y-2">
              {openGroups.map(({ group, hasActive, isCollapsed }) => (
                <div key={group.labelKey} className="rounded-lg">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.labelKey)}
                    aria-expanded={!isCollapsed}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors",
                      hasActive
                        ? "text-foreground"
                        : "text-muted-foreground/80 hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <span>{t(`navGroups.${group.labelKey}`)}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 shrink-0 transition-transform duration-200",
                        isCollapsed && "-rotate-90",
                      )}
                      aria-hidden
                    />
                  </button>
                  <div
                    className={cn(
                      "grid transition-[grid-template-rows] duration-200 ease-out",
                      isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-0.5 pb-1 pt-0.5">
                        {group.items.map((item) => {
                          const active = itemIsActive(pathname, item.href);
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={(e) => onNavClick(e, item.href, active)}
                              aria-disabled={isNavigating}
                              className={cn(
                                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                                active
                                  ? "bg-accent text-accent-foreground"
                                  : "text-ink-soft hover:bg-muted hover:text-foreground",
                                isNavigating && "pointer-events-none opacity-70",
                              )}
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              {t(`nav.${item.key}`)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {showPartnerPortal ? (
              <Link
                href="/partner"
                onClick={(e) =>
                  onNavClick(e, "/partner", pathname.startsWith("/partner"))
                }
                className={cn(
                  "mt-5 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-ink-soft hover:bg-muted hover:text-foreground",
                  isNavigating && "pointer-events-none opacity-70",
                )}
              >
                {t("nav.partner")}
              </Link>
            ) : null}
          </nav>
        </aside>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-foreground/30 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
        ) : null}

        <div className="relative flex min-w-0 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="ml-auto flex items-center gap-3">
              <WhatsNewHeaderButton />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-none">
                  {user.name ?? user.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {user.email} · {role}
                </p>
              </div>
              <form action={logoutAction}>
                <PendingSubmitButton
                  idleLabel={t("logout")}
                  pendingLabel={t("logout")}
                  variant="outline"
                  size="sm"
                />
              </form>
            </div>
          </header>
          <main className="relative flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
            {isNavigating ? (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-[1px]"
                role="status"
                aria-live="polite"
              >
                <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                  <Spinner label={t("loading")} />
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </WhatsNewProvider>
  );
}
