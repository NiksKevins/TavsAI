"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  BarChart3,
  Bot,
  Calendar,
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
} from "lucide-react";

import { logoutAction } from "@/actions/auth";
import {
  WhatsNewHeaderButton,
  WhatsNewProvider,
} from "@/components/dashboard/whats-new";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", key: "overview", icon: LayoutDashboard },
  { href: "/dashboard/conversations", key: "conversations", icon: MessageSquare },
  { href: "/dashboard/leads", key: "leads", icon: Users },
  { href: "/dashboard/knowledge", key: "knowledge", icon: BookOpen },
  { href: "/dashboard/assistant", key: "assistant", icon: Bot },
  { href: "/dashboard/widget", key: "widget", icon: Code2 },
  { href: "/dashboard/analytics", key: "analytics", icon: BarChart3 },
  { href: "/dashboard/appointments", key: "appointments", icon: Calendar },
  { href: "/dashboard/integrations", key: "integrations", icon: Plug },
  { href: "/dashboard/billing", key: "billing", icon: CreditCard },
  { href: "/dashboard/settings", key: "settings", icon: Settings },
] as const;

type DashboardShellProps = {
  children: React.ReactNode;
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

  return (
    <WhatsNewProvider>
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_1fr]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform lg:static lg:w-auto lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
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
        <nav className="flex flex-col gap-0.5 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-ink-soft hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
          {showPartnerPortal ? (
            <Link
              href="/partner"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-ink-soft hover:bg-muted hover:text-foreground"
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

      <div className="flex min-w-0 flex-col">
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
              <Button type="submit" variant="outline" size="sm">
                {t("logout")}
              </Button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
    </WhatsNewProvider>
  );
}
