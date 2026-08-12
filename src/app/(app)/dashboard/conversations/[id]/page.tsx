import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { deleteConversationAction } from "@/actions/privacy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("conversations");
  const { workspace } = await requireWorkspace();

  const conversation = await prisma.conversation.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      lead: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) notFound();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/dashboard/conversations" className="hover:underline">
            {t("title")}
          </Link>
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          {conversation.lead?.name || t("visitor")}
        </h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{conversation.status}</Badge>
          {conversation.lead ? (
            <Link href={`/dashboard/leads/${conversation.lead.id}`}>
              <Badge>{t("linkedLead")}</Badge>
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.messages")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {conversation.messages.map((message) => (
            <div
              key={message.id}
              className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span className="font-medium uppercase tracking-wide">
                  {message.role}
                </span>
                <span>{message.createdAt.toLocaleString()}</span>
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      <form action={deleteConversationAction} className="pt-2">
        <input type="hidden" name="id" value={conversation.id} />
        <Button type="submit" variant="outline">
          {t("detail.delete")}
        </Button>
      </form>
    </div>
  );
}
