"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";

import {
  cancelCrawlAction,
  saveWebsiteAndCrawlAction,
  startCrawlAction,
  type CrawlActionResult,
} from "@/actions/crawl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Props = {
  websiteUrl: string | null;
  websiteStatus: string | null;
  job: {
    id: string;
    status: string;
    pagesDiscovered: number;
    pagesProcessed: number;
    pageLimit: number;
    errorMessage: string | null;
    startedAt: string | null;
    completedAt: string | null;
  } | null;
};

const ACTIVE_STATUSES = new Set(["QUEUED", "CRAWLING", "PROCESSING"]);

function crawlProgressPercent(job: NonNullable<Props["job"]>): number {
  if (job.status === "COMPLETED") return 100;
  const limit = Math.max(job.pageLimit, 1);
  const discoveredShare =
    job.pagesDiscovered > 0
      ? Math.min(job.pagesDiscovered, limit) / limit
      : 0;
  const processedShare = Math.min(job.pagesProcessed, limit) / limit;
  // Discovery moves the bar early; processing finishes it.
  return Math.round(Math.min(99, Math.max(discoveredShare * 35, processedShare * 100)));
}

export function CrawlControls({ websiteUrl, websiteStatus, job }: Props) {
  const t = useTranslations("knowledge");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [elapsedSec, setElapsedSec] = useState(0);
  const [saveState, saveAction, savePending] = useActionState<
    CrawlActionResult | null,
    FormData
  >(saveWebsiteAndCrawlAction, null);

  const active = Boolean(job && ACTIVE_STATUSES.has(job.status));
  const indeterminate = Boolean(
    active && job && job.pagesDiscovered === 0 && job.pagesProcessed === 0,
  );
  const percent = useMemo(
    () => (job ? crawlProgressPercent(job) : 0),
    [job],
  );

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      router.refresh();
    }, 2500);
    return () => clearInterval(timer);
  }, [active, router]);

  useEffect(() => {
    if (!active) {
      setElapsedSec(0);
      return;
    }
    const started = job?.startedAt ? Date.parse(job.startedAt) : Date.now();
    const tick = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - started) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active, job?.startedAt, job?.id]);

  useEffect(() => {
    if (saveState?.ok) router.refresh();
  }, [saveState, router]);

  const phaseKey =
    job?.status === "QUEUED"
      ? "phaseQueued"
      : job?.status === "CRAWLING"
        ? "phaseCrawling"
        : job?.status === "PROCESSING"
          ? "phaseProcessing"
          : job?.status === "COMPLETED"
            ? "phaseCompleted"
            : job?.status === "FAILED"
              ? "phaseFailed"
              : job?.status === "CANCELED"
                ? "phaseCanceled"
                : null;

  const statusLabel = (raw: string) => {
    const key = `jobStatus.${raw}` as const;
    return t.has(key) ? t(key) : raw;
  };

  return (
    <div className="space-y-6">
      <form action={saveAction} className="space-y-3 border border-border bg-card p-5">
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">{t("fields.websiteUrl")}</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            defaultValue={websiteUrl ?? ""}
            placeholder="https://example.lv"
            required
            disabled={Boolean(active) || savePending}
          />
        </div>
        {saveState && !saveState.ok ? (
          <p className="text-sm text-destructive" role="alert">
            {t(`errors.${saveState.error}`)}
          </p>
        ) : null}
        <Button type="submit" disabled={Boolean(active) || savePending}>
          {websiteUrl ? t("actions.rescan") : t("actions.scan")}
        </Button>
      </form>

      <div className="border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">
              {t("status.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {websiteUrl ?? t("status.noWebsite")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {websiteStatus ? (
              <Badge variant="secondary">{statusLabel(websiteStatus)}</Badge>
            ) : null}
            {job ? <Badge>{statusLabel(job.status)}</Badge> : null}
          </div>
        </div>

        {job ? (
          <div className="mt-5 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <p className="font-medium text-foreground">
                {phaseKey ? t(`status.${phaseKey}`) : statusLabel(job.status)}
              </p>
              <p className="tabular-nums text-muted-foreground">
                {indeterminate
                  ? t("status.progressWaiting")
                  : t("status.progressPercent", { percent })}
                {active ? (
                  <span className="ml-2">
                    · {t("status.elapsed", { seconds: elapsedSec })}
                  </span>
                ) : null}
              </p>
            </div>
            <Progress
              value={percent}
              indeterminate={indeterminate}
              className="h-2.5"
            />
          </div>
        ) : null}

        {job ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("status.discovered")}</dt>
              <dd className="font-medium">{job.pagesDiscovered}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("status.processed")}</dt>
              <dd className="font-medium">
                {job.pagesProcessed} / {job.pageLimit}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("status.limit")}</dt>
              <dd className="font-medium">{job.pageLimit}</dd>
            </div>
          </dl>
        ) : null}

        {job?.errorMessage ? (
          <p className="mt-4 text-sm text-destructive">{job.errorMessage}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(active) || pending || !websiteUrl}
            onClick={() =>
              startTransition(async () => {
                await startCrawlAction();
                router.refresh();
              })
            }
          >
            {t("actions.rescan")}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!active || pending}
            onClick={() =>
              startTransition(async () => {
                if (!job) return;
                await cancelCrawlAction(job.id);
                router.refresh();
              })
            }
          >
            {t("actions.cancel")}
          </Button>
        </div>
      </div>
    </div>
  );
}
