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
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export default async function ConversationsPage() {
  const t = await getTranslations("conversations");
  const { workspace } = await requireWorkspace();

  const conversations = await prisma.conversation.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: {
      lead: {
        select: {
          id: true,
          status: true,
          intent: true,
          name: true,
          service: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <p className="font-medium">{t("empty.title")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("empty.subtitle")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.customer")}</TableHead>
                <TableHead>{t("columns.lastMessage")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.lead")}</TableHead>
                <TableHead>{t("columns.intent")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversations.map((conversation) => {
                const last = conversation.messages[0];
                return (
                  <TableRow key={conversation.id}>
                    <TableCell>
                      <Link
                        href={`/dashboard/conversations/${conversation.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {conversation.lead?.name ||
                          conversation.visitorId?.slice(0, 8) ||
                          t("visitor")}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {last?.content || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{conversation.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {conversation.lead ? (
                        <Link
                          href={`/dashboard/leads/${conversation.lead.id}`}
                          className="text-primary hover:underline"
                        >
                          {conversation.lead.status}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {conversation.lead?.intent ||
                        conversation.lead?.service ||
                        "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {(
                        conversation.lastMessageAt || conversation.createdAt
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
