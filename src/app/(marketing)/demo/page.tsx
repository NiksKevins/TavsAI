import { MarketingDemoSection } from "@/components/marketing/marketing-sections";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function DemoPage() {
  const dict = await getMarketingDict();
  return <MarketingDemoSection dict={dict} />;
}
