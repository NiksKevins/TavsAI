"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ConversationDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[conversations/detail]", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Neizdevās ielādēt sarunu
      </h1>
      <p className="text-sm text-muted-foreground">
        Kaut kas nogāja greizi. Mēģiniet vēlreiz vai atgriezieties pie saraksta.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={reset}>
          Mēģināt vēlreiz
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/conversations">Uz sarunām</Link>
        </Button>
      </div>
    </div>
  );
}
