import { getLocale, getTranslations } from "next-intl/server";

import {
  ChangelogList,
  WhatsNewMarkRead,
} from "@/components/dashboard/whats-new";
import { requireWorkspace } from "@/lib/authz";

export default async function WhatsNewPage() {
  await requireWorkspace();
  const t = await getTranslations("dashboard.whatsNew");
  const locale = await getLocale();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <WhatsNewMarkRead />
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("logTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("logSubtitle")}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-6">
        <ChangelogList locale={locale} />
      </div>
    </div>
  );
}
