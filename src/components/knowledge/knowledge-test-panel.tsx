"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  testKnowledgeAiAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type TestData = {
  answer: string;
  usedFallback?: boolean;
  sources: {
    title: string | null;
    source: string;
    similarity: number;
    excerpt: string;
  }[];
};

export function KnowledgeTestPanel() {
  const t = useTranslations("knowledge.test");
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(testKnowledgeAiAction, null);

  const data =
    state?.ok && state.data && typeof state.data === "object"
      ? (state.data as TestData)
      : null;

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-3 rounded-xl border border-border bg-card p-5">
        <Textarea
          name="question"
          rows={3}
          required
          placeholder={t("placeholder")}
        />
        {state && !state.ok ? (
          <p className="text-sm text-destructive">{t("error")}</p>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? t("running") : t("ask")}
        </Button>
      </form>

      {data ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">{t("answer")}</h2>
            {data.usedFallback ? (
              <Badge className="mt-2" variant="warning">
                {t("fallback")}
              </Badge>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {data.answer}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-lg font-semibold">{t("sources")}</h2>
            {data.sources.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{t("noSources")}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {data.sources.map((source, index) => (
                  <div
                    key={`${source.source}-${index}`}
                    className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{source.source}</Badge>
                      <span className="font-medium">{source.title || "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        {(source.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mt-2 text-muted-foreground">{source.excerpt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
