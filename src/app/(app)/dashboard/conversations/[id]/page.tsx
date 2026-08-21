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
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ConversationDetailPage({ params }: Props) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const t = await getTranslations("conversations");
  const { workspace } = await requireWorkspace();

  let conversation;
  try {
    conversation = await prisma.conversation.findFirst({
      where: { id, workspaceId: workspace.id },
      select: {
        id: true,
        status: true,
        visitorId: true,
        createdAt: true,
        lastMessageAt: true,
        lead: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 300,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[conversations/detail]", error);
    notFound();
  }

  if (!conversation) notFound();

  const roleLabel = (role: string) => {
    switch (role) {
      case "VISITOR":
        return t("roles.visitor");
      case "ASSISTANT":
        return t("roles.assistant");
      case "SYSTEM":
        return t("roles.system");
      case "HUMAN_AGENT":
        return t("roles.human");
      default:
        return role;
    }
  };

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
            <Link
              href={`/dashboard/leads/${conversation.lead.id}`}
              className="inline-flex"
            >
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
          {conversation.messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("detail.noMessages")}</p>
          ) : (
            conversation.messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-wide">
                    {roleLabel(message.role)}
                  </span>
                  <span>
                    {message.createdAt.toLocaleString("lv-LV", {
                      timeZone: "Europe/Riga",
                    })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap break-words">
                  {sanitizeMessageContent(message.content)}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <form action={deleteConversationAction} className="pt-2">
        <input type="hidden" name="id" value={conversation.id} />
        <PendingSubmitButton
          idleLabel={t("detail.delete")}
          pendingLabel={t("detail.delete")}
          variant="outline"
        />
      </form>
    </div>
  );
}

/** Strip null bytes / unpaired surrogates that can break RSC hydration. */
function sanitizeMessageContent(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replace(/\u0000/g, "")
    .replace(/[\uD800-\uDFFF]/g, "\uFFFD");
}
