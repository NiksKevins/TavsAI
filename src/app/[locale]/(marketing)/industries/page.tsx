import { MarketingIndustriesSection } from "@/components/marketing/marketing-sections";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function IndustriesPage() {
  const dict = await getMarketingDict();

  return <MarketingIndustriesSection dict={dict} />;
}
