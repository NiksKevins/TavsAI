import { getLocale } from "next-intl/server";

import { PageLoading } from "@/components/ui/loading-state";

export default async function OnboardingLoading() {
  const locale = await getLocale();
  return (
    <PageLoading
      label={locale === "en" ? "Loading setup…" : "Ielādē uzstādīšanu…"}
    />
  );
}
