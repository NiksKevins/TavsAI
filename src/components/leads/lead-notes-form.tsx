"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  updateLeadNotesAction,
  type LeadActionResult,
} from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LeadNotesForm({
  leadId,
  notes,
}: {
  leadId: string;
  notes: string;
}) {
  const t = useTranslations("leads.detail");
  const [state, action, pending] = useActionState<
    LeadActionResult | null,
    FormData
  >(updateLeadNotesAction, null);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="leadId" value={leadId} />
      <Textarea name="notes" defaultValue={notes} rows={5} />
      <Button type="submit" disabled={pending} size="sm">
        {t("saveNotes")}
      </Button>
      {state?.ok ? (
        <p className="text-xs text-primary">{t("notesSaved")}</p>
      ) : null}
    </form>
  );
}
