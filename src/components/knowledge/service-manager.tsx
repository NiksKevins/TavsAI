"use client";

import { useActionState, useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import {
  deleteServiceAction,
  saveServiceAction,
  type KnowledgeActionResult,
} from "@/actions/knowledge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ServiceItem = {
  id: string;
  nameLv: string;
  descriptionLv: string | null;
  priceFrom: string;
  duration: string | null;
  category: string | null;
  notes: string | null;
  isActive: boolean;
};

export function ServiceManager({ services }: { services: ServiceItem[] }) {
  const t = useTranslations("knowledge.services");
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [state, action, pending] = useActionState<
    KnowledgeActionResult | null,
    FormData
  >(saveServiceAction, null);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <form
        action={action}
        className="space-y-3 rounded-xl border border-border bg-card p-5"
        key={editing?.id ?? "new"}
      >
        <h2 className="font-display text-lg font-semibold">
          {editing ? t("edit") : t("create")}
        </h2>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <div className="space-y-2">
          <Label htmlFor="nameLv">{t("fields.name")}</Label>
          <Input id="nameLv" name="nameLv" required defaultValue={editing?.nameLv ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descriptionLv">{t("fields.description")}</Label>
          <Textarea
            id="descriptionLv"
            name="descriptionLv"
            rows={3}
            defaultValue={editing?.descriptionLv ?? ""}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="priceFrom">{t("fields.price")}</Label>
            <Input
              id="priceFrom"
              name="priceFrom"
              placeholder={t("fields.priceOptional")}
              defaultValue={editing?.priceFrom ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">{t("fields.duration")}</Label>
            <Input
              id="duration"
              name="duration"
              placeholder="custom / 60 min"
              defaultValue={editing?.duration ?? ""}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">{t("fields.category")}</Label>
          <Input id="category" name="category" defaultValue={editing?.category ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">{t("fields.notes")}</Label>
          <Textarea id="notes" name="notes" rows={2} defaultValue={editing?.notes ?? ""} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={editing?.isActive ?? true}
          />
          {t("fields.available")}
        </label>
        {state && !state.ok ? (
          <p className="text-sm text-destructive">{t("error")}</p>
        ) : null}
        {state?.ok ? <p className="text-sm text-primary">{t("saved")}</p> : null}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {t("save")}
          </Button>
          {editing ? (
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              {t("cancel")}
            </Button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{service.nameLv}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {[service.category, service.duration, service.priceFrom ? `from €${service.priceFrom}` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>
                <Badge variant={service.isActive ? "success" : "secondary"}>
                  {service.isActive ? t("available") : t("unavailable")}
                </Badge>
              </div>
              <div className="mt-3 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setEditing(service)}>
                  {t("edit")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={deleting}
                  onClick={() =>
                    startDelete(async () => {
                      await deleteServiceAction(service.id);
                      window.location.reload();
                    })
                  }
                >
                  {t("delete")}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
