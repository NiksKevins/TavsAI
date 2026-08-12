import { getTranslations } from "next-intl/server";

import { KnowledgeTestPanel } from "@/components/knowledge/knowledge-test-panel";

export default async function KnowledgeTestPage() {
  const t = await getTranslations("knowledge.test");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <KnowledgeTestPanel />
    </div>
  );
}
