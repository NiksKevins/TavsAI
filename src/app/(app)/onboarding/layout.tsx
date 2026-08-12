import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireWorkspace } from "@/lib/authz";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { workspace } = await requireWorkspace();
  const home = await getTranslations("home");

  if (workspace.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,#f7f6f3_0%,#eef2ee_100%)]">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold">
          {home("brand")}
        </Link>
        <p className="text-sm text-muted-foreground">{workspace.name}</p>
      </div>
      <main className="mx-auto w-full max-w-2xl px-4 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
