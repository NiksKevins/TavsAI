import { getTranslations } from "next-intl/server";

import {
  deleteAccountAction,
  deleteWorkspaceAction,
  exportWorkspaceDataAction,
  runRetentionNowAction,
  updateRetentionAction,
} from "@/actions/privacy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hasMinimumRole } from "@/lib/roles";
import { requireWorkspace } from "@/lib/authz";
import { ExportDataButton } from "@/components/settings/export-data-button";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {flash ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {t(`flash.${flash}` as "flash.retention")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {t(`errors.${error}` as "errors.confirm_slug")}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t("workspace.title")}</CardTitle>
          <CardDescription>{workspace.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            {t("workspace.slug")}: <Badge variant="secondary">{workspace.slug}</Badge>
          </p>
          <p>
            {t("workspace.role")}: {membership.role}
          </p>
        </CardContent>
      </Card>

      {isOwner ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{t("retention.title")}</CardTitle>
              <CardDescription>{t("retention.hint")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form action={updateRetentionAction} className="flex flex-wrap items-end gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dataRetentionDays">{t("retention.days")}</Label>
                  <Input
                    id="dataRetentionDays"
                    name="dataRetentionDays"
                    type="number"
                    min={0}
                    max={3650}
                    defaultValue={workspace.dataRetentionDays}
                    className="w-40"
                  />
                </div>
                <Button type="submit">{t("retention.save")}</Button>
              </form>
              <p className="text-xs text-muted-foreground">{t("retention.zero")}</p>
              <form action={runRetentionNowAction}>
                <Button type="submit" variant="outline">
                  {t("retention.runNow")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("export.title")}</CardTitle>
              <CardDescription>{t("export.hint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ExportDataButton
                action={exportWorkspaceDataAction}
                label={t("export.action")}
                filename={`tavswebs-export-${workspace.slug}.json`}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("danger.workspaceTitle")}</CardTitle>
              <CardDescription>{t("danger.workspaceHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={deleteWorkspaceAction} className="space-y-3">
                <Label htmlFor="confirm">{t("danger.confirmSlug")}</Label>
                <Input id="confirm" name="confirm" placeholder={workspace.slug} />
                <Button type="submit" variant="outline">
                  {t("danger.deleteWorkspace")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("danger.accountTitle")}</CardTitle>
              <CardDescription>{t("danger.accountHint")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={deleteAccountAction} className="space-y-3">
                <Label htmlFor="confirmEmail">{t("danger.confirmEmail")}</Label>
                <Input
                  id="confirmEmail"
                  name="confirm"
                  placeholder={user.email}
                />
                <Button type="submit" variant="outline">
                  {t("danger.deleteAccount")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("ownerOnly")}</p>
      )}
    </div>
  );
}
