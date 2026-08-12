import { getTranslations } from "next-intl/server";

import { MarketingPricingSection } from "@/components/marketing/marketing-sections";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function PricingPage() {
  const dict = await getMarketingDict();
  const t = await getTranslations("pricing");

  return <MarketingPricingSection dict={dict} note={t("note")} />;
}
