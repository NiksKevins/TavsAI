"use client";

import type { LeadStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { updateLeadStatusAction } from "@/actions/leads";
import { deleteLeadAction } from "@/actions/privacy";
import { Button } from "@/components/ui/button";

const ACTIONS: { status: LeadStatus; key: string }[] = [
  { status: "CONTACTED", key: "contacted" },
  { status: "QUALIFIED", key: "qualified" },
  { status: "WON", key: "won" },
  { status: "LOST", key: "lost" },
];

export function LeadDetailActions({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const t = useTranslations("leads.actions");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <Button
          key={action.status}
          type="button"
          size="sm"
          variant={status === action.status ? "default" : "outline"}
          disabled={pending || status === action.status}
          onClick={() => {
            startTransition(async () => {
              await updateLeadStatusAction(leadId, action.status);
              router.refresh();
            });
          }}
        >
          {t(action.key)}
        </Button>
      ))}
      <form action={deleteLeadAction}>
        <input type="hidden" name="id" value={leadId} />
        <Button type="submit" size="sm" variant="outline" disabled={pending}>
          {t("delete")}
        </Button>
      </form>
    </div>
  );
}
