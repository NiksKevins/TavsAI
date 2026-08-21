import type { ReactNode } from "react";
import {
  Building2,
  Download,
  Shield,
  Timer,
  Trash2,
  UserRoundX,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import {
  deleteAccountAction,
  deleteWorkspaceAction,
  exportWorkspaceDataAction,
  runRetentionNowAction,
  updateRetentionAction,
} from "@/actions/privacy";
import { ExportDataButton } from "@/components/settings/export-data-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { hasMinimumRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/authz";
import { cn } from "@/lib/utils";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const t = await getTranslations("settings");
  const { workspace, membership, user } = await requireWorkspace();
  const params = await searchParams;
  const isOwner = hasMinimumRole(membership.role, "OWNER");
  const flash = Array.isArray(params.saved) ? params.saved[0] : params.saved;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const initial = workspace.name.trim().charAt(0).toUpperCase() || "W";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t("subtitle")}</p>
      </div>

      {flash ? (
        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {t(`flash.${flash}` as "flash.retention")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t(`errors.${error}` as "errors.confirm_slug")}
        </p>
      ) : null}

      <Card className="overflow-hidden rounded-2xl">
        <div className="border-b border-border bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent">
          <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-6">
            <div
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-sm"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("workspace.title")}
              </p>
              <CardTitle className="mt-1 truncate text-2xl">
                {workspace.name}
              </CardTitle>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {workspace.slug}
                </Badge>
                <Badge variant="outline">{membership.role}</Badge>
              </div>
            </div>
            <Building2 className="hidden size-5 text-muted-foreground/50 sm:block" />
          </CardHeader>
        </div>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
          <MetaTile label={t("workspace.slug")} value={workspace.slug} mono />
          <MetaTile label={t("workspace.role")} value={membership.role} />
        </CardContent>
      </Card>

      {isOwner ? (
        <>
          <section className="space-y-3">
            <SectionLabel
              icon={<Shield className="size-3.5" />}
              title={t("sections.data")}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="rounded-2xl">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
                    <Timer className="size-5 text-foreground/70" />
                  </div>
                  <CardTitle className="text-lg">{t("retention.title")}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t("retention.hint")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form
                    action={updateRetentionAction}
                    className="flex flex-wrap items-end gap-3"
                  >
                    <div className="min-w-[10rem] flex-1 space-y-2">
                      <Label htmlFor="dataRetentionDays">
                        {t("retention.days")}
                      </Label>
                      <Input
                        id="dataRetentionDays"
                        name="dataRetentionDays"
                        type="number"
                        min={0}
                        max={3650}
                        defaultValue={workspace.dataRetentionDays}
                      />
                    </div>
                    <PendingSubmitButton
                      idleLabel={t("retention.save")}
                      pendingLabel={t("retention.save")}
                    />
                  </form>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t("retention.zero")}
                  </p>
                  <form action={runRetentionNowAction}>
                    <PendingSubmitButton
                      idleLabel={t("retention.runNow")}
                      pendingLabel={t("retention.runNow")}
                      variant="outline"
                    />
                  </form>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
                    <Download className="size-5 text-foreground/70" />
                  </div>
                  <CardTitle className="text-lg">{t("export.title")}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {t("export.hint")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExportDataButton
                    action={exportWorkspaceDataAction}
                    label={t("export.action")}
                    pendingLabel={t("export.pending")}
                    filename={`tavswebs-export-${workspace.slug}.json`}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-3">
            <SectionLabel
              icon={<Trash2 className="size-3.5" />}
              title={t("sections.danger")}
              tone="danger"
            />
            <div className="overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/[0.03]">
              <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-destructive/15">
                <DangerPanel
                  icon={<Trash2 className="size-5" />}
                  title={t("danger.workspaceTitle")}
                  hint={t("danger.workspaceHint")}
                >
                  <form action={deleteWorkspaceAction} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="confirm">{t("danger.confirmSlug")}</Label>
                      <Input
                        id="confirm"
                        name="confirm"
                        placeholder={workspace.slug}
                        autoComplete="off"
                      />
                    </div>
                    <PendingSubmitButton
                      idleLabel={t("danger.deleteWorkspace")}
                      pendingLabel={t("danger.deleteWorkspace")}
                      variant="destructive"
                    />
                  </form>
                </DangerPanel>

                <DangerPanel
                  icon={<UserRoundX className="size-5" />}
                  title={t("danger.accountTitle")}
                  hint={t("danger.accountHint")}
                  className="border-t border-destructive/15 lg:border-t-0"
                >
                  <form action={deleteAccountAction} className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="confirmEmail">
                        {t("danger.confirmEmail")}
                      </Label>
                      <Input
                        id="confirmEmail"
                        name="confirm"
                        placeholder={user.email}
                        autoComplete="off"
                      />
                    </div>
                    <PendingSubmitButton
                      idleLabel={t("danger.deleteAccount")}
                      pendingLabel={t("danger.deleteAccount")}
                      variant="destructive"
                    />
                  </form>
                </DangerPanel>
              </div>
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {t("ownerOnly")}
        </p>
      )}
    </div>
  );
}

function SectionLabel({
  icon,
  title,
  tone = "default",
}: {
  icon: ReactNode;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide",
        tone === "danger" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {icon}
      <span>{title}</span>
    </div>
  );
}

function MetaTile({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-medium",
          mono && "font-mono text-[13px]",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DangerPanel({
  icon,
  title,
  hint,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4 p-6", className)}>
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          {icon}
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {hint}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}
