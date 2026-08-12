"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  updateLeadSettingsAction,
  type LeadActionResult,
} from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Values = {
  collectLeads: boolean;
  handoffEnabled: boolean;
  handoffCreatesLead: boolean;
  leadNotificationEmail: string;
  qualificationQsText: string;
  handoffMessageLv: string;
  requireIntent: boolean;
  requireContact: boolean;
  requireName: boolean;
  requireService: boolean;
};

export function LeadSettingsForm({ values }: { values: Values }) {
  const t = useTranslations("assistantAdmin");
  const [state, action, pending] = useActionState<
    LeadActionResult | null,
    FormData
  >(updateLeadSettingsAction, null);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="leadNotificationEmail">{t("leads.email")}</Label>
        <p className="text-xs text-muted-foreground">{t("leads.emailHint")}</p>
        <Input
          id="leadNotificationEmail"
          name="leadNotificationEmail"
          type="email"
          defaultValue={values.leadNotificationEmail}
          placeholder="leads@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="qualificationQsText">{t("leads.questions")}</Label>
        <p className="text-xs text-muted-foreground">
          {t("leads.questionsHint")}
        </p>
        <Textarea
          id="qualificationQsText"
          name="qualificationQsText"
          rows={6}
          defaultValue={values.qualificationQsText}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="handoffMessageLv">{t("leads.handoffMessage")}</Label>
        <Textarea
          id="handoffMessageLv"
          name="handoffMessageLv"
          rows={3}
          defaultValue={values.handoffMessageLv}
        />
      </div>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium">
          {t("leads.criteria")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("leads.criteriaHint")}</p>
        <Toggle
          name="requireIntent"
          label={t("leads.requireIntent")}
          defaultChecked={values.requireIntent}
        />
        <Toggle
          name="requireContact"
          label={t("leads.requireContact")}
          defaultChecked={values.requireContact}
        />
        <Toggle
          name="requireName"
          label={t("leads.requireName")}
          defaultChecked={values.requireName}
        />
        <Toggle
          name="requireService"
          label={t("leads.requireService")}
          defaultChecked={values.requireService}
        />
      </fieldset>

      <fieldset className="space-y-3 rounded-xl border border-border p-4">
        <legend className="px-1 text-sm font-medium">
          {t("leads.behavior")}
        </legend>
        <Toggle
          name="collectLeads"
          label={t("leads.collectLeads")}
          defaultChecked={values.collectLeads}
        />
        <Toggle
          name="handoffEnabled"
          label={t("leads.handoffEnabled")}
          defaultChecked={values.handoffEnabled}
        />
        <Toggle
          name="handoffCreatesLead"
          label={t("leads.handoffCreatesLead")}
          defaultChecked={values.handoffCreatesLead}
        />
      </fieldset>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{t("leads.error")}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-primary">{t("leads.saved")}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {t("leads.save")}
      </Button>
    </form>
  );
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}
