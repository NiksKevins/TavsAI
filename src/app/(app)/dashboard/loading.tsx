import { getLocale } from "next-intl/server";

import { PageLoading } from "@/components/ui/loading-state";

export default async function DashboardLoading() {
  const locale = await getLocale();
  return (
    <PageLoading
      label={locale === "en" ? "Loading dashboard…" : "Ielādē paneli…"}
    />
  );
}
