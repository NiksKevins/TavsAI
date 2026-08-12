import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/authz";
import {
  listUnansweredQuestions,
  resolveAnalyticsRange,
} from "@/services/analytics/analytics-service";

export default async function UnansweredAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const t = await getTranslations("analytics.unanswered");
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const range = resolveAnalyticsRange(params.range);
  const items = await listUnansweredQuestions(workspace.id, range);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href={`/dashboard/analytics?range=${range}`} className="underline-offset-2 hover:underline">
              {t("back")}
            </Link>
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {([7, 30, 90] as const).map((r) => (
            <Link
              key={r}
              href={`/dashboard/analytics/unanswered?range=${r}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                range === r
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {r}d
            </Link>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const faqParams = new URLSearchParams({
              prefillQuestion: item.question.slice(0, 400),
              prefillAnswer: item.answer.slice(0, 5000),
              from: "analytics",
            });
            return (
              <Card key={item.messageId}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-snug">
                      {item.question}
                    </CardTitle>
                    <CardDescription>
                      {item.createdAt.toLocaleString()} ·{" "}
                      <Link
                        href={`/dashboard/conversations/${item.conversationId}`}
                        className="underline-offset-2 hover:underline"
                      >
                        {t("viewConversation")}
                      </Link>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    {item.reason === "both"
                      ? t("reasonBoth")
                      : item.reason === "handoff"
                        ? t("reasonHandoff")
                        : t("reasonFallback")}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    {item.answer}
                  </p>
                  <Button asChild>
                    <Link href={`/dashboard/knowledge/faqs?${faqParams.toString()}`}>
                      {t("createFaq")}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
