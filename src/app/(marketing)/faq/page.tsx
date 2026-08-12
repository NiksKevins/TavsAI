import { MarketingFaqSection } from "@/components/marketing/marketing-sections";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function FaqPage() {
  const dict = await getMarketingDict();
  return <MarketingFaqSection dict={dict} />;
}
