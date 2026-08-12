"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import { registerAction, type ActionResult } from "@/actions/auth";
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

export function RegisterForm() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const referralCode = (searchParams.get("ref") || "").toUpperCase();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(registerAction, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("register.title")}</CardTitle>
        <CardDescription>{t("register.subtitle")}</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {referralCode ? (
            <input type="hidden" name="referralCode" value={referralCode} />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="name">{t("fields.name")}</Label>
            <Input id="name" name="name" autoComplete="name" required minLength={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessName">{t("fields.businessName")}</Label>
            <Input
              id="businessName"
              name="businessName"
              required
              minLength={2}
            />
          </div>
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
          <div className="space-y-2">
            <Label htmlFor="password">{t("fields.password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.passwordHint")}
            </p>
          </div>
          {referralCode ? (
            <p className="text-xs text-muted-foreground">
              {t("register.referral", { code: referralCode })}
            </p>
          ) : null}
          {state && !state.ok ? (
            <p className="text-sm text-destructive" role="alert">
              {t(`errors.${state.error}`)}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("register.submitting") : t("register.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {t("register.hasAccount")}{" "}
            <Link href="/login" className="text-primary hover:underline">
              {t("register.loginLink")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
