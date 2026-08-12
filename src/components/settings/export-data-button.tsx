"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { PrivacyActionResult } from "@/actions/privacy";

export function ExportDataButton({
  action,
  label,
  filename,
}: {
  action: () => Promise<PrivacyActionResult>;
  label: string;
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
        {pending ? "…" : label}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
