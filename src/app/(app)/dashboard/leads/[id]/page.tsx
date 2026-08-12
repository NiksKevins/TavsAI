import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { LeadNotesForm } from "@/components/leads/lead-notes-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("leads");
  const { workspace } = await requireWorkspace();

  const lead = await prisma.lead.findFirst({
    where: { id, workspaceId: workspace.id },
    include: {
      fields: { orderBy: { key: "asc" } },
      conversation: {
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 80,
          },
        },
      },
    },
  });

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/dashboard/leads" className="hover:underline">
              {t("title")}
            </Link>
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {lead.name || lead.phone || t("unnamed")}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge>{t(`status.${lead.status}`)}</Badge>
            <span className="text-sm text-muted-foreground">
              {lead.createdAt.toLocaleString()}
            </span>
          </div>
        </div>
        <LeadDetailActions leadId={lead.id} status={lead.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("detail.customer")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label={t("detail.name")} value={lead.name} />
            <Row label={t("detail.phone")} value={lead.phone} />
            <Row label={t("detail.email")} value={lead.email} />
            <Row label={t("detail.service")} value={lead.service} />
            <Row label={t("detail.intent")} value={lead.intent} />
            <Row label={t("detail.source")} value={lead.source} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.summary")}</CardTitle>
            <CardDescription>{t("detail.summaryHint")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-ink-soft">
            {lead.summary || t("detail.noSummary")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.fields")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {lead.fields.length === 0 ? (
              <p className="text-muted-foreground">{t("detail.noFields")}</p>
            ) : (
              lead.fields.map((field) => (
                <Row key={field.id} label={field.key} value={field.value} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("detail.notes")}</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadNotesForm leadId={lead.id} notes={lead.notes ?? ""} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.conversation")}</CardTitle>
          {lead.conversationId ? (
            <CardDescription>
              <Link
                href={`/dashboard/conversations/${lead.conversationId}`}
                className="text-primary hover:underline"
              >
                {t("detail.openConversation")}
              </Link>
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {!lead.conversation?.messages.length ? (
            <p className="text-sm text-muted-foreground">
              {t("detail.noConversation")}
            </p>
          ) : (
            lead.conversation.messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {message.role}
                </div>
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}
