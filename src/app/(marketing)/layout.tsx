import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { MarketingSiteChat } from "@/components/marketing/marketing-site-chat";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1 pt-[4.25rem] sm:pt-[4.5rem]">{children}</main>
      <SiteFooter />
      <MarketingSiteChat />
    </div>
  );
}
