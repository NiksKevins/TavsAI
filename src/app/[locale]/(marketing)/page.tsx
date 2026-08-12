import { LandingHome } from "@/components/marketing/landing-home";
import { getMarketingDict } from "@/lib/marketing/get-marketing-dict";

export default async function HomePage() {
  const dict = await getMarketingDict();
  return <LandingHome dict={dict} />;
}
