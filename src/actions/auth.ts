"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { signIn, signOut } from "@/auth";
import { writeAuditLog } from "@/lib/audit";
import { createWorkspaceForUser } from "@/lib/authz";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  cloudflareClientIp,
  verifyTurnstileToken,
} from "@/lib/security/turnstile";
import { generateToken, hashToken } from "@/lib/tokens";

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function clientKey(suffix: string) {
  const h = await headers();
  return `auth:${suffix}:${cloudflareClientIp(h)}`;
}

async function requireHuman(formData: FormData): Promise<ActionResult | null> {
  const h = await headers();
  const verified = await verifyTurnstileToken({
    token: String(formData.get("cf-turnstile-response") || ""),
    remoteip: cloudflareClientIp(h),
  });
  if (!verified.ok) {
    return { ok: false, error: verified.error };
  }
  return null;
}

function rateLimitedResult(): ActionResult {
  return { ok: false, error: "rate_limited" };
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  businessName: z.string().trim().min(2).max(120),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = checkRateLimit({
    key: await clientKey("register"),
    limit: 8,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) return rateLimitedResult();

  const botCheck = await requireHuman(formData);
  if (botCheck) return botCheck;

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    businessName: formData.get("businessName"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { ok: false, error: "email_taken" };
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
        locale: "lv",
      },
    });

    const created = await createWorkspaceForUser({
      userId: user.id,
      name: parsed.data.businessName,
      email,
      locale: "lv",
    });

    const referralCode = String(formData.get("referralCode") || "")
      .trim()
      .toUpperCase();
    if (referralCode) {
      try {
        const { attachWorkspaceViaReferral } = await import(
          "@/services/partner/partner-service"
        );
        await attachWorkspaceViaReferral({
          workspaceId: created.id,
          referralCode,
        });
      } catch (error) {
        console.error("[partner/referral]", error);
      }
    }

    try {
      await signIn("credentials", {
        email,
        password: parsed.data.password,
        redirect: false,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return { ok: false, error: "signin_failed" };
      }
      throw error;
    }
  } catch (error) {
    console.error("[auth/register]", error);
    return { ok: false, error: "service_unavailable" };
  }

  redirect("/onboarding");
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = checkRateLimit({
    key: await clientKey("login"),
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) return rateLimitedResult();

  const botCheck = await requireHuman(formData);
  if (botCheck) return botCheck;

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_credentials" };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase().trim(),
      password: parsed.data.password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "invalid_credentials" };
    }
    throw error;
  }

  const email = parsed.data.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  });

  if (user) {
    await writeAuditLog({
      userId: user.id,
      workspaceId: user.memberships[0]?.workspaceId,
      action: "LOGIN",
      entityType: "User",
      entityId: user.id,
    });
  }

  const workspace = user?.memberships[0]?.workspace;
  if (workspace && !workspace.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (session?.user?.id) {
    await writeAuditLog({
      userId: session.user.id,
      action: "LOGOUT",
      entityType: "User",
      entityId: session.user.id,
    });
  }

  await signOut({ redirectTo: "/" });
}

export async function requestPasswordResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = checkRateLimit({
    key: await clientKey("forgot"),
    limit: 5,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) return rateLimitedResult();

  const botCheck = await requireHuman(formData);
  if (botCheck) return botCheck;

  const emailRaw = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const emailParsed = z.string().email().safeParse(emailRaw);

  // Always return success to avoid email enumeration
  if (!emailParsed.success) {
    return { ok: true, message: "reset_sent" };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailParsed.data },
  });

  if (user) {
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      "https://bot.tavswebs.com";
    const resetUrl = `${base}/reset-password/${token}`;

    await sendEmail({
      to: user.email,
      subject: "Atiestatīt paroli / Reset password — TavsWebs Bot",
      text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>Atiestatīt paroli / Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Saite derīga 1 stundu / Link expires in 1 hour.</p>`,
    });
  }

  return { ok: true, message: "reset_sent" };
}

const resetSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export async function resetPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const rl = checkRateLimit({
    key: await clientKey("reset"),
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) return rateLimitedResult();

  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: "invalid_input" };
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false, error: "invalid_token" };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect("/login");
}
