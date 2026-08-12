"use client";

import { useRouter } from "next/navigation";
import { useActionState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  deleteUploadDocumentAction,
  uploadKnowledgeDocumentAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DocItem = {
  id: string;
  title: string;
  status: string;
  mimeType: string | null;
  chunkCount: number;
  createdAt: string;
};

export function DocumentUploadManager({ documents }: { documents: DocItem[] }) {
  const t = useTranslations("knowledge.documents");
  const router = useRouter();
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(uploadKnowledgeDocumentAction, null);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="space-y-6">
      <form
        action={action}
        className="space-y-3 rounded-xl border border-border bg-card p-5"
      >
        <h2 className="font-display text-lg font-semibold">{t("upload")}</h2>
        <p className="text-sm text-muted-foreground">{t("uploadHint")}</p>
        <Input name="file" type="file" accept=".pdf,.txt,.docx,.doc" required />
        {state && !state.ok ? (
          <p className="text-sm text-destructive">{t(`errors.${state.error}`)}</p>
        ) : null}
        {state?.ok ? <p className="text-sm text-primary">{t("uploaded")}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? t("uploading") : t("uploadAction")}
        </Button>
      </form>

      <div className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <div className="font-medium">{doc.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {doc.mimeType || "file"} · {doc.chunkCount} chunks ·{" "}
                  {new Date(doc.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{doc.status}</Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={deleting}
                  onClick={() =>
                    startDelete(async () => {
                      await deleteUploadDocumentAction(doc.id);
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
  );
}
