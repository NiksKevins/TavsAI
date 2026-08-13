import { getTranslations } from "next-intl/server";

import { ServiceManager } from "@/components/knowledge/service-manager";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export const maxDuration = 300;

export default async function KnowledgeServicesPage() {
  const t = await getTranslations("knowledge.services");
  const { workspace } = await requireWorkspace();
  const services = await prisma.service.findMany({
    where: { workspaceId: workspace.id },
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
      <ServiceManager
        services={services.map((s) => ({
          id: s.id,
          nameLv: s.nameLv,
          descriptionLv: s.descriptionLv,
          priceFrom: s.priceFrom?.toString() ?? "",
          duration: s.duration,
          category: s.category,
          notes: s.notes,
          isActive: s.isActive,
        }))}
      />
    </div>
  );
}
