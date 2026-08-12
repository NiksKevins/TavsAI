import type { PartnerMemberRole } from "@prisma/client";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/authz";
import { prisma } from "@/lib/db";

export class PartnerForbiddenError extends Error {
  constructor(message = "Partner access required") {
    super(message);
    this.name = "PartnerForbiddenError";
  }
}

export type PartnerContext = {
  user: Awaited<ReturnType<typeof requireUser>>;
  partner: NonNullable<
    Awaited<ReturnType<typeof prisma.partner.findFirst>>
  >;
  membership: {
    id: string;
    role: PartnerMemberRole;
    partnerId: string;
    userId: string;
  };
};

/**
 * Resolve partner portal context. Independent of Workspace membership.
 */
export async function requirePartner(
  preferredPartnerId?: string,
): Promise<PartnerContext> {
  const user = await requireUser();

  const memberships = await prisma.partnerMember.findMany({
    where: {
      userId: user.id,
      partner: { status: "ACTIVE" },
    },
    include: { partner: true },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/dashboard");
  }

  const selected =
    (preferredPartnerId
      ? memberships.find((m) => m.partnerId === preferredPartnerId)
      : undefined) ?? memberships[0];

  return {
    user,
    partner: selected.partner,
    membership: {
      id: selected.id,
      role: selected.role,
      partnerId: selected.partnerId,
      userId: selected.userId,
    },
  };
}

export async function userHasPartnerAccess(userId: string): Promise<boolean> {
  // Guard against a stale PrismaClient (pre-partner generate) so dashboard
  // layout never crashes while the process still holds an old global instance.
  if (typeof prisma.partnerMember?.count !== "function") {
    return false;
  }
  const count = await prisma.partnerMember.count({
    where: { userId, partner: { status: "ACTIVE" } },
  });
  return count > 0;
}
