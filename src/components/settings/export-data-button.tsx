"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";

import type { PrivacyActionResult } from "@/actions/privacy";
import { Button } from "@/components/ui/button";

export function ExportDataButton({
  action,
  label,
  pendingLabel,
  filename,
}: {
  action: () => Promise<PrivacyActionResult>;
  label: string;
  pendingLabel?: string;
  filename: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await action();
            if (!result.ok || !result.data) {
              setError("export_failed");
              return;
            }
            const blob = new Blob([JSON.stringify(result.data, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
          })
        }
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : null}
        {pending ? pendingLabel || label : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
