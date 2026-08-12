import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const home = await getTranslations("home");

  return (
    <div className="relative flex min-h-dvh flex-col bg-[radial-gradient(ellipse_at_top,var(--hero-spot),transparent_50%),linear-gradient(180deg,#f7f6f3,#eef2ee)]">
      <div className="mx-auto flex w-full max-w-6xl items-center px-4 py-6 sm:px-6">
        <Link
          href="/lv"
          className="font-display text-lg font-semibold text-foreground"
        >
          {home("brand")}
        </Link>
      </div>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 sm:px-6">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
