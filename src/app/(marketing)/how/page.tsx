import { MarketingHowSection } from "@/components/marketing/marketing-sections";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function HowPage() {
  const dict = await getMarketingDict();

  return <MarketingHowSection dict={dict} />;
}
