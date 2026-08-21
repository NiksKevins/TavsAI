import { getLocale } from "next-intl/server";

import { PageLoading } from "@/components/ui/loading-state";

export default async function AuthLoading() {
  const locale = await getLocale();
  return (
    <PageLoading label={locale === "en" ? "Loading…" : "Ielādē…"} />
  );
}
