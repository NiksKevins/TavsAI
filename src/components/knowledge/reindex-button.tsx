"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

import { reindexKnowledgeAction } from "@/actions/knowledge";
import { Button } from "@/components/ui/button";

export function ReindexButton() {
  const t = useTranslations("knowledge.reindex");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      {message ? (
        <span className="text-xs text-muted-foreground">{message}</span>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            const result = await reindexKnowledgeAction();
            if (result.ok && result.data && typeof result.data === "object") {
              const data = result.data as {
                embedded?: number;
                skipped?: number;
              };
              setMessage(
                t("done", {
                  embedded: data.embedded ?? 0,
                  skipped: data.skipped ?? 0,
                }),
              );
            } else {
              setMessage(t("error"));
            }
          });
        }}
      >
        {pending ? t("running") : t("action")}
      </Button>
    </div>
  );
}
