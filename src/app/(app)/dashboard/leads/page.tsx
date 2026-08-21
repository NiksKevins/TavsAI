import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PendingSubmitButton } from "@/components/ui/pending-submit-button";
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
import type { LeadStatus, Prisma } from "@prisma/client";

const STATUSES: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "WON",
  "LOST",
];

type Props = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    service?: string;
    sort?: string;
  }>;
};

export default async function LeadsPage({ searchParams }: Props) {
  const t = await getTranslations("leads");
  const { workspace } = await requireWorkspace();
  const params = await searchParams;

  const where: Prisma.LeadWhereInput = {
    workspaceId: workspace.id,
  };

  if (params.status && STATUSES.includes(params.status as LeadStatus)) {
    where.status = params.status as LeadStatus;
  }

  if (params.service?.trim()) {
    where.service = { contains: params.service.trim(), mode: "insensitive" };
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { service: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ];
  }

  const sort = params.sort === "oldest" ? "asc" : "desc";

  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: sort },
    take: 100,
    include: {
      conversation: { select: { id: true, status: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/assistant">{t("configure")}</Link>
        </Button>
      </div>

      <form className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
        <Input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder={t("filters.search")}
        />
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">{t("filters.allStatuses")}</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status.${status}`)}
            </option>
          ))}
        </select>
        <Input
          name="service"
          defaultValue={params.service ?? ""}
          placeholder={t("filters.service")}
        />
        <PendingSubmitButton
          idleLabel={t("filters.apply")}
          pendingLabel={t("filters.apply")}
        />
      </form>

      {leads.length === 0 ? (
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
                <TableHead>{t("columns.service")}</TableHead>
                <TableHead>{t("columns.status")}</TableHead>
                <TableHead>{t("columns.source")}</TableHead>
                <TableHead>{t("columns.date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link
                      href={`/dashboard/leads/${lead.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {lead.name || lead.phone || lead.email || t("unnamed")}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {[lead.phone, lead.email].filter(Boolean).join(" · ")}
                    </div>
                  </TableCell>
                  <TableCell>{lead.service || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(lead.status)}>
                      {t(`status.${lead.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.createdAt.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function statusVariant(status: LeadStatus) {
  switch (status) {
    case "WON":
      return "success" as const;
    case "LOST":
    case "SPAM":
      return "warning" as const;
    case "QUALIFIED":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}
