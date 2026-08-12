import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireWorkspace } from "@/lib/authz";
import { userHasPartnerAccess } from "@/lib/partner/authz";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspace, membership } = await requireWorkspace();

  if (!workspace.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  const showPartnerPortal = await userHasPartnerAccess(user.id);

  return (
    <DashboardShell
      user={{
        name: user.name,
        email: user.email,
      }}
      workspace={{
        name: workspace.name,
        slug: workspace.slug,
      }}
      role={membership.role}
      showPartnerPortal={showPartnerPortal}
    >
      {children}
    </DashboardShell>
  );
}
