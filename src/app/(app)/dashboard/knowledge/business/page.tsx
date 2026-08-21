import { getTranslations } from "next-intl/server";

import { BusinessInfoForm } from "@/components/knowledge/business-info-form";
import {
  parseOpeningHours,
  parseSocialLinks,
} from "@/config/business-profile";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export default async function KnowledgeBusinessPage() {
  const t = await getTranslations("knowledge.business");
  const { workspace } = await requireWorkspace();

  const business =
    (await prisma.businessInformation.findUnique({
      where: { workspaceId: workspace.id },
    })) ??
    (await prisma.businessInformation.create({
      data: {
        workspaceId: workspace.id,
        displayName: workspace.name,
      },
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>
      <BusinessInfoForm
        values={{
          displayName: business.displayName ?? "",
          description: business.description ?? "",
          phone: business.phone ?? "",
          email: business.email ?? "",
          address: business.address ?? "",
          city: business.city ?? "",
          websiteUrl: business.websiteUrl ?? "",
          openingHours: parseOpeningHours(business.openingHours),
          socialLinks: parseSocialLinks(business.socialLinks),
          languages: business.languages?.length ? business.languages : ["lv"],
          policies: business.policies ?? "",
        }}
      />
    </div>
  );
}
