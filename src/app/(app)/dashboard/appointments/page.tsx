import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { cancelAppointmentAction } from "@/actions/appointments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

type View = "today" | "upcoming" | "past" | "cancelled";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const t = await getTranslations("appointments");
  const { workspace } = await requireWorkspace();
  const params = await searchParams;
  const view = (["today", "upcoming", "past", "cancelled"].includes(
    params.view ?? "",
  )
    ? params.view
    : "upcoming") as View;

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const where =
    view === "cancelled"
      ? { workspaceId: workspace.id, status: "CANCELLED" as const }
      : view === "today"
        ? {
            workspaceId: workspace.id,
            status: { not: "CANCELLED" as const },
            startTime: { gte: startOfDay, lt: endOfDay },
          }
        : view === "past"
          ? {
              workspaceId: workspace.id,
              status: { not: "CANCELLED" as const },
              startTime: { lt: startOfDay },
            }
          : {
              workspaceId: workspace.id,
              status: { notIn: ["CANCELLED", "FAILED"] as ("CANCELLED" | "FAILED")[] },
              OR: [
                { startTime: { gte: endOfDay } },
                { startTime: null, createdAt: { gte: startOfDay } },
              ],
            };

  const appointments = await prisma.appointment.findMany({
    where,
    orderBy: [{ startTime: view === "past" ? "desc" : "asc" }, { createdAt: "desc" }],
    take: 100,
  });

  const views: { key: View; label: string }[] = [
    { key: "today", label: t("views.today") },
    { key: "upcoming", label: t("views.upcoming") },
    { key: "past", label: t("views.past") },
    { key: "cancelled", label: t("views.cancelled") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/integrations">{t("manageCalendar")}</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {views.map((v) => (
          <Link
            key={v.key}
            href={`/dashboard/appointments?view=${v.key}`}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              view === v.key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground"
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      {appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => (
            <Card key={appt.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">
                    {appt.service || appt.title || t("untitled")}
                  </CardTitle>
                  <CardDescription>
                    {appt.startTime
                      ? appt.startTime.toLocaleString()
                      : t("noTime")}
                    {appt.customerName ? ` · ${appt.customerName}` : ""}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    appt.status === "CONFIRMED"
                      ? "success"
                      : appt.status === "FAILED"
                        ? "warning"
                        : "secondary"
                  }
                >
                  {t(`status.${appt.status}`)}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="text-muted-foreground">
                  {[appt.customerPhone, appt.customerEmail, appt.provider]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
                {appt.status !== "CANCELLED" && appt.status !== "COMPLETED" ? (
                  <form action={cancelAppointmentAction}>
                    <input type="hidden" name="id" value={appt.id} />
                    <Button type="submit" size="sm" variant="outline">
                      {t("cancel")}
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
