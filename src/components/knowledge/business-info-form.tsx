"use client";

import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Clock3, Globe2, Languages, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  updateBusinessInformationAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { SocialPlatformIcon } from "@/components/knowledge/social-platform-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUSINESS_LANGUAGES,
  SOCIAL_PLATFORMS,
  WEEKDAY_KEYS,
  type OpeningHoursMap,
  type SocialLinksMap,
  type WeekdayKey,
} from "@/config/business-profile";
import { cn } from "@/lib/utils";

type Values = {
  displayName: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  websiteUrl: string;
  openingHours: OpeningHoursMap;
  socialLinks: SocialLinksMap;
  languages: string[];
  policies: string;
};

export function BusinessInfoForm({ values }: { values: Values }) {
  const t = useTranslations("knowledge.business");
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(updateBusinessInformationAction, null);

  return (
    <form action={action} className="space-y-6">
      <Section
        title={t("sections.profile")}
        description={t("sections.profileHint")}
      >
        <Field label={t("fields.name")} htmlFor="displayName">
          <Input
            id="displayName"
            name="displayName"
            defaultValue={values.displayName}
          />
        </Field>
        <Field label={t("fields.description")} htmlFor="description">
          <Textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={values.description}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("fields.phone")} htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={values.phone} />
          </Field>
          <Field label={t("fields.email")} htmlFor="email">
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={values.email}
            />
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
          <Input
            id="websiteUrl"
            name="websiteUrl"
            defaultValue={values.websiteUrl}
            placeholder="https://"
          />
        </Field>
      </Section>

      <Section
        icon={<Clock3 className="size-4" />}
        title={t("sections.hours")}
        description={t("sections.hoursHint")}
      >
        <div className="space-y-2">
          {WEEKDAY_KEYS.map((day) => (
            <HoursRow
              key={day}
              day={day}
              label={t(`days.${day}`)}
              closedLabel={t("fields.closed")}
              placeholder={t("fields.hoursPlaceholder")}
              value={values.openingHours[day] ?? ""}
            />
          ))}
        </div>
      </Section>

      <Section
        icon={<Share2 className="size-4" />}
        title={t("sections.social")}
        description={t("sections.socialHint")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_PLATFORMS.map((platform) => (
            <div
              key={platform.key}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: platform.color }}
                aria-hidden
              >
                <SocialPlatformIcon platform={platform.key} />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <Label
                  htmlFor={`social_${platform.key}`}
                  className="text-xs text-muted-foreground"
                >
                  {platform.label}
                </Label>
                <Input
                  id={`social_${platform.key}`}
                  name={`social_${platform.key}`}
                  defaultValue={values.socialLinks[platform.key] ?? ""}
                  placeholder={platform.placeholder}
                  className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        icon={<Languages className="size-4" />}
        title={t("sections.languages")}
        description={t("sections.languagesHint")}
      >
        <div className="flex flex-wrap gap-2">
          {BUSINESS_LANGUAGES.map((lang) => {
            const checked = values.languages.includes(lang.key);
            return (
              <label
                key={lang.key}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  checked
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                <input
                  type="checkbox"
                  name="languages"
                  value={lang.key}
                  defaultChecked={checked}
                  className="size-3.5 accent-[var(--primary)]"
                />
                {t(`langs.${lang.key}`)}
              </label>
            );
          })}
        </div>
      </Section>

      <Section
        icon={<Globe2 className="size-4" />}
        title={t("sections.policies")}
        description={t("sections.policiesHint")}
      >
        <Field label={t("fields.policies")} htmlFor="policies">
          <Textarea
            id="policies"
            name="policies"
            rows={4}
            defaultValue={values.policies}
          />
        </Field>
      </Section>

      {state && !state.ok ? (
        <p className="text-sm text-destructive">{t("error")}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-sm text-primary">{t("saved")}</p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? t("saving") : t("save")}
      </Button>
    </form>
  );
}

function HoursRow({
  day,
  label,
  closedLabel,
  placeholder,
  value,
}: {
  day: WeekdayKey;
  label: string;
  closedLabel: string;
  placeholder: string;
  value: string;
}) {
  const initiallyClosed = value.trim().toLowerCase() === "closed";
  const [closed, setClosed] = useState(initiallyClosed);

  return (
    <div className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 rounded-xl border border-border/80 bg-background px-3 py-2">
      <span className="text-sm font-medium">{label}</span>
      <Input
        name={`hours_${day}`}
        defaultValue={initiallyClosed ? "" : value}
        placeholder={placeholder}
        disabled={closed}
        className="h-9"
      />
      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          name={`hours_${day}_closed`}
          checked={closed}
          onChange={(e) => setClosed(e.currentTarget.checked)}
          className="size-3.5 accent-[var(--primary)]"
        />
        {closedLabel}
      </label>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70">
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
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
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}
