import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { getDocumentCategory } from "@/lib/knowledge/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function KnowledgeDocumentPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("knowledge");
  const { workspace } = await requireWorkspace();

  const document = await prisma.knowledgeDocument.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      chunks: { orderBy: { chunkIndex: "asc" }, take: 50 },
    },
  });

  if (!document) notFound();

  const category = getDocumentCategory(document.metadata);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/knowledge"
          className="text-sm text-primary hover:underline"
        >
          ← {t("title")}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          {document.title}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="secondary">{document.status}</Badge>
          <Badge variant="outline">{t(`categories.${category}`)}</Badge>
          {document.sourceUrl ? (
            <a
              href={document.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {document.sourceUrl}
            </a>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("document.updated")}: {document.updatedAt.toLocaleString()}
        </p>
      </div>

      {document.errorMessage ? (
        <p className="border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {document.errorMessage}
        </p>
      ) : null}

      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">
          {t("document.content")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("document.untrusted")}
        </p>
        <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
          {document.rawText || "—"}
        </pre>
      </section>

      <section className="border border-border bg-card p-5">
        <h2 className="font-display text-lg font-semibold">
          {t("document.chunks")} ({document.chunks.length})
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("document.chunksNote")}
        </p>
        <ul className="mt-4 space-y-3">
          {document.chunks.map((chunk) => (
            <li
              key={chunk.id}
              className="border border-border/70 bg-background p-3 text-sm"
            >
              <div className="mb-2 flex gap-2 text-xs text-muted-foreground">
                <span>#{chunk.chunkIndex}</span>
                <span>{chunk.tokenCount ?? "?"} tokens</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed">
                {chunk.content}
              </pre>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
