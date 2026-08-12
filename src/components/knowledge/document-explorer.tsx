import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getDocumentCategory } from "@/lib/knowledge/queries";

type Doc = {
  id: string;
  title: string;
  sourceUrl: string | null;
  status: string;
  updatedAt: Date;
  metadata: unknown;
  _count: { chunks: number };
};

const CATEGORY_ORDER = [
  "home",
  "services",
  "about",
  "contact",
  "faq",
  "other",
] as const;

export async function DocumentExplorer({ documents }: { documents: Doc[] }) {
  const t = await getTranslations("knowledge");

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: documents.filter(
      (doc) => getDocumentCategory(doc.metadata) === category,
    ),
  })).filter((group) => group.items.length > 0);

  if (!documents.length) {
    return (
      <p className="text-sm text-muted-foreground">{t("explorer.empty")}</p>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.category} className="space-y-3">
          <h3 className="font-display text-lg font-semibold">
            {t(`categories.${group.category}`)}
          </h3>
          <div className="border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("explorer.title")}</TableHead>
                  <TableHead>{t("explorer.url")}</TableHead>
                  <TableHead>{t("explorer.status")}</TableHead>
                  <TableHead>{t("explorer.chunks")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.items.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/knowledge/documents/${doc.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate text-muted-foreground">
                      {doc.sourceUrl}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.status}</Badge>
                    </TableCell>
                    <TableCell>{doc._count.chunks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      ))}
    </div>
  );
}
