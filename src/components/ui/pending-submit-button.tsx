"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type PendingSubmitButtonProps = ButtonProps & {
  pendingLabel?: string;
  idleLabel: string;
};

/**
 * Submit button that disables itself while the parent form action is pending.
 * Prevents double-clicks on server actions.
 */
export function PendingSubmitButton({
  idleLabel,
  pendingLabel,
  disabled,
  children,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const label = pending ? pendingLabel || idleLabel : idleLabel;

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children ?? label}
    </Button>
  );
}
