import { getLocale, getTranslations } from "next-intl/server";

import {
  ChangelogMasterDetail,
  WhatsNewMarkRead,
} from "@/components/dashboard/whats-new";
import { requireWorkspace } from "@/lib/authz";

export default async function WhatsNewPage() {
  await requireWorkspace();
  const t = await getTranslations("dashboard.whatsNew");
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <WhatsNewMarkRead />
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {t("logTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("logSubtitle")}</p>
      </div>
      <ChangelogMasterDetail locale={locale} />
    </div>
  );
}
