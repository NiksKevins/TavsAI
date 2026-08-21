import { WidgetDashboard } from "@/components/widget/widget-dashboard";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

export default async function DashboardWidgetPage() {
  const { workspace } = await requireWorkspace();

  const widget =
    (await prisma.widgetConfiguration.findUnique({
      where: { workspaceId: workspace.id },
    })) ??
    (await prisma.widgetConfiguration.create({
      data: { workspaceId: workspace.id },
    }));

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:3001";

  return (
    <WidgetDashboard
      appUrl={appUrl}
      widget={{
        publicKey: widget.publicKey,
        primaryColor: widget.primaryColor,
        position: widget.position,
        theme: widget.theme,
        borderRadius: widget.borderRadius,
        launcherTextLv: widget.launcherTextLv,
        welcomeMessageLv: widget.welcomeMessageLv,
        logoUrl: widget.logoUrl,
        quickActions: widget.quickActions,
        leadFormEnabled: widget.leadFormEnabled,
        isActive: widget.isActive,
        lastLoadedAt: widget.lastLoadedAt?.toISOString() ?? null,
        allowedOrigins: widget.allowedOrigins,
      }}
    />
  );
}
