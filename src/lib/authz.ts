import {
  IndustryTemplate,
  Locale,
  type User,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceRole,
} from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasMinimumRole } from "@/lib/roles";

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type WorkspaceContext = {
  user: User;
  workspace: Workspace;
  membership: WorkspaceMember;
};

export async function requireUser(): Promise<User> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    redirect("/login");
  }

  const { ensureFounderEntitlements } = await import(
    "@/lib/billing/founder-entitlements"
  );
  await ensureFounderEntitlements(user);

  return user;
}

export async function getOptionalUser(): Promise<User | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

/**
 * Resolves the active workspace from the authenticated user's membership.
 * Never trusts a client-supplied workspaceId for authorization.
 */
export async function requireWorkspace(
  preferredWorkspaceId?: string,
): Promise<WorkspaceContext> {
  const user = await requireUser();

  const memberships = await prisma.workspaceMember.findMany({
    where: {
      userId: user.id,
      workspace: { deletedAt: null },
    },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const selected =
    (preferredWorkspaceId
      ? memberships.find((m) => m.workspaceId === preferredWorkspaceId)
      : undefined) ?? memberships[0];

  return {
    user,
    workspace: selected.workspace,
    membership: selected,
  };
}

export async function requireWorkspaceRole(
  minimumRole: WorkspaceRole,
  preferredWorkspaceId?: string,
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace(preferredWorkspaceId);

  if (!hasMinimumRole(ctx.membership.role, minimumRole)) {
    throw new ForbiddenError(
      `Requires ${minimumRole} role (have ${ctx.membership.role})`,
    );
  }

  return ctx;
}

export const DEFAULT_ASSISTANT = {
  greetingLv:
    "Sveiki! Esmu jūsu AI asistents. Kā varu palīdzēt?",
  greetingEn: "Hello! I am your AI assistant. How can I help?",
  fallbackLv:
    "Šo informāciju es šobrīd nevaru droši apstiprināt. Ja vēlaties, varu palīdzēt sazināties ar uzņēmuma komandu.",
  fallbackEn:
    "I cannot reliably confirm that information right now. If you like, I can help you get in touch with the team.",
} as const;

export async function createWorkspaceForUser(params: {
  userId: string;
  name: string;
  email: string;
  locale?: Locale;
}) {
  const { uniqueWorkspaceSlug } = await import("@/lib/slug");
  const { isFounderEmail } = await import("@/lib/billing/founder");

  const slug = await uniqueWorkspaceSlug(params.name, async (candidate) => {
    const existing = await prisma.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    return Boolean(existing);
  });

  const founder = isFounderEmail(params.email);
  const now = new Date();
  const farFuture = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: params.name,
        slug,
        primaryLocale: params.locale ?? Locale.lv,
        onboardingStep: 1,
        members: {
          create: {
            userId: params.userId,
            role: "OWNER",
          },
        },
        subscription: {
          create: {
            plan: founder ? "PRO" : "FREE",
            status: "ACTIVE",
            ...(founder
              ? {
                  currentPeriodStart: now,
                  currentPeriodEnd: farFuture,
                }
              : {}),
          },
        },
        businessInformation: {
          create: {
            displayName: params.name,
            email: params.email,
            country: "LV",
          },
        },
        assistantConfiguration: {
          create: {
            name: "AI darbinieks",
            greetingLv: DEFAULT_ASSISTANT.greetingLv,
            greetingEn: DEFAULT_ASSISTANT.greetingEn,
            fallbackLv: DEFAULT_ASSISTANT.fallbackLv,
            fallbackEn: DEFAULT_ASSISTANT.fallbackEn,
          },
        },
        widgetConfiguration: {
          create: {},
        },
      },
    });

    await tx.auditLog.create({
      data: {
        workspaceId: workspace.id,
        userId: params.userId,
        action: "CREATE",
        entityType: "Workspace",
        entityId: workspace.id,
        metadata: { source: "registration" },
      },
    });

    return workspace;
  });
}

export { IndustryTemplate, Locale };
