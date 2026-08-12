"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import {
  updateBusinessInformationAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Values = {
  displayName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  websiteUrl: string;
  openingHours: string;
  socialLinks: string;
  languages: string;
  policies: string;
};

export function BusinessInfoForm({ values }: { values: Values }) {
  const t = useTranslations("knowledge.business");
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(updateBusinessInformationAction, null);

  return (
    <form action={action} className="space-y-4 rounded-xl border border-border bg-card p-6">
      <Field label={t("fields.name")} htmlFor="displayName">
        <Input id="displayName" name="displayName" defaultValue={values.displayName} />
      </Field>
      <Field label={t("fields.description")} htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={values.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fields.phone")} htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={values.phone} />
        </Field>
        <Field label={t("fields.email")} htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={values.email} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("fields.address")} htmlFor="address">
          <Input id="address" name="address" defaultValue={values.address} />
        </Field>
        <Field label={t("fields.city")} htmlFor="city">
          <Input id="city" name="city" defaultValue={values.city} />
        </Field>
      </div>
      <Field label={t("fields.website")} htmlFor="websiteUrl">
        <Input id="websiteUrl" name="websiteUrl" defaultValue={values.websiteUrl} />
      </Field>
      <Field label={t("fields.hours")} htmlFor="openingHours" hint={t("fields.hoursHint")}>
        <Textarea id="openingHours" name="openingHours" rows={3} defaultValue={values.openingHours} />
      </Field>
      <Field label={t("fields.social")} htmlFor="socialLinks" hint={t("fields.socialHint")}>
        <Textarea id="socialLinks" name="socialLinks" rows={3} defaultValue={values.socialLinks} />
      </Field>
      <Field label={t("fields.languages")} htmlFor="languages" hint={t("fields.languagesHint")}>
        <Input id="languages" name="languages" defaultValue={values.languages} />
      </Field>
      <Field label={t("fields.policies")} htmlFor="policies">
        <Textarea id="policies" name="policies" rows={4} defaultValue={values.policies} />
      </Field>
      {state && !state.ok ? <p className="text-sm text-destructive">{t("error")}</p> : null}
      {state?.ok ? <p className="text-sm text-primary">{t("saved")}</p> : null}
      <Button type="submit" disabled={pending}>{t("save")}</Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}
