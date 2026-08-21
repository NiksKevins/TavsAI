"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import {
  requestPasswordResetAction,
  type ActionResult,
} from "@/actions/auth";
import { TurnstileField } from "@/components/auth/turnstile-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    requestPasswordResetAction,
    null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("forgot.title")}</CardTitle>
        <CardDescription>{t("forgot.subtitle")}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("fields.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <TurnstileField />
          {state?.ok ? (
            <p className="text-sm text-primary" role="status">
              {t("forgot.sent")}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("forgot.submitting") : t("forgot.submit")}
          </Button>
          <Link
            href="/login"
            className="text-center text-sm text-primary hover:underline"
          >
            {t("forgot.back")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
