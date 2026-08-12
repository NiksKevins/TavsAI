import { getTranslations } from "next-intl/server";

import { FaqManager } from "@/components/knowledge/faq-manager";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{
    q?: string;
    prefillQuestion?: string;
    prefillAnswer?: string;
    from?: string;
  }>;
};

export default async function KnowledgeFaqsPage({ searchParams }: Props) {
  const t = await getTranslations("knowledge.faqs");
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const q = params.q?.trim();

  const faqs = await prisma.fAQ.findMany({
    where: {
      workspaceId: workspace.id,
      ...(q
        ? {
            OR: [
              { questionLv: { contains: q, mode: "insensitive" } },
              { answerLv: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <FaqManager
        initialQuery={q ?? ""}
        prefillQuestion={params.prefillQuestion?.slice(0, 400) ?? ""}
        prefillAnswer={params.prefillAnswer?.slice(0, 5000) ?? ""}
        fromAnalytics={params.from === "analytics"}
        faqs={faqs.map((f) => ({
          id: f.id,
          questionLv: f.questionLv,
          answerLv: f.answerLv,
          category: f.category,
          isActive: f.isActive,
        }))}
      />
    </div>
  );
}
