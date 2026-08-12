"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  deleteFaqAction,
  saveFaqAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FaqItem = {
  id: string;
  questionLv: string;
  answerLv: string;
  category: string | null;
  isActive: boolean;
};

export function FaqManager({
  faqs,
  initialQuery,
  prefillQuestion = "",
  prefillAnswer = "",
  fromAnalytics = false,
}: {
  faqs: FaqItem[];
  initialQuery: string;
  prefillQuestion?: string;
  prefillAnswer?: string;
  fromAnalytics?: boolean;
}) {
  const t = useTranslations("knowledge.faqs");
  const router = useRouter();
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(saveFaqAction, null);
  const [deleting, startDelete] = useTransition();
  const formKey = editing?.id ?? (prefillQuestion ? `prefill-${prefillQuestion.slice(0, 24)}` : "new");

  return (
    <div className="space-y-6">
      {fromAnalytics && prefillQuestion ? (
        <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {t("fromAnalytics")}
        </p>
      ) : null}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams();
          if (query.trim()) params.set("q", query.trim());
          router.push(`/dashboard/knowledge/faqs?${params.toString()}`);
        }}
      >
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="max-w-md"
        />
        <Button type="submit" variant="outline">
          {t("searchAction")}
        </Button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          action={action}
          className="space-y-3 rounded-xl border border-border bg-card p-5"
          key={formKey}
        >
          <h2 className="font-display text-lg font-semibold">
            {editing ? t("edit") : t("create")}
          </h2>
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="questionLv">{t("fields.question")}</Label>
            <Input
              id="questionLv"
              name="questionLv"
              required
              defaultValue={editing?.questionLv ?? prefillQuestion}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="answerLv">{t("fields.answer")}</Label>
            <Textarea
              id="answerLv"
              name="answerLv"
              required
              rows={5}
              defaultValue={editing?.answerLv ?? prefillAnswer}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">{t("fields.category")}</Label>
            <Input
              id="category"
              name="category"
              defaultValue={editing?.category ?? ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={editing?.isActive ?? true}
            />
            {t("fields.published")}
          </label>
          {state && !state.ok ? (
            <p className="text-sm text-destructive">{t("error")}</p>
          ) : null}
          {state?.ok ? <p className="text-sm text-primary">{t("saved")}</p> : null}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {t("save")}
            </Button>
            {editing ? (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t("cancel")}
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            faqs.map((faq) => (
              <div key={faq.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{faq.questionLv}</div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {faq.answerLv}
                    </p>
                  </div>
                  <Badge variant={faq.isActive ? "success" : "secondary"}>
                    {faq.isActive ? t("published") : t("draft")}
                  </Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditing(faq)}>
                    {t("edit")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={deleting}
                    onClick={() =>
                      startDelete(async () => {
                        await deleteFaqAction(faq.id);
                        router.refresh();
                      })
                    }
                  >
                    {t("delete")}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
