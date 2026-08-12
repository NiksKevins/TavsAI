import Link from "next/link";

import { WidgetEmbedLoader } from "@/components/widget/widget-embed-loader";
import { requireWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/db";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function WidgetDemoPage({ searchParams }: Props) {
  const params = await searchParams;
  const { workspace } = await requireWorkspace();

  const widget = params.id
    ? await prisma.widgetConfiguration.findFirst({
        where: {
          publicKey: params.id,
          workspaceId: workspace.id,
        },
      })
    : await prisma.widgetConfiguration.findUnique({
        where: { workspaceId: workspace.id },
      });

  if (!widget) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <h1 className="font-display text-2xl font-semibold">Widget demo</h1>
        <p className="mt-2 text-muted-foreground">
          No widget configuration found for this workspace.
        </p>
      </div>
    );
  }

  const businessInfo = await prisma.businessInformation.findUnique({
    where: { workspaceId: workspace.id },
    select: { displayName: true },
  });

  const businessName = businessInfo?.displayName ?? workspace.name;

  return (
    <div className="relative min-h-dvh bg-[linear-gradient(180deg,#eef2ee,#f7f6f3)]">
      <header className="border-b border-border/60 bg-[#fffcf8]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-display text-lg font-semibold tracking-tight">
            {businessName}
          </span>
          <nav className="hidden gap-6 text-sm text-muted-foreground sm:flex">
            <span>Pakalpojumi</span>
            <span>Cenas</span>
            <span>Kontakti</span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-sm font-medium text-primary">Widget preview</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
          {businessName}
        </h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          This page simulates how the AI assistant appears on a customer website.
          Open the chat button in the corner to test streaming, quick actions,
          lead capture, and handoff.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-card/70 p-5">
            <h2 className="font-display text-lg font-semibold">Try asking</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>“Cik maksā?”</li>
              <li>“Kāds ir darba laiks?”</li>
              <li>“Es vēlos runāt ar cilvēku.”</li>
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-card/70 p-5 text-sm text-muted-foreground">
            <p>
              Public key:{" "}
              <code className="text-foreground">{widget.publicKey}</code>
            </p>
            <p className="mt-2">
              Color:{" "}
              <code className="text-foreground">{widget.primaryColor}</code>
            </p>
            <p className="mt-3">
              <Link
                href={`/widget-demo.html?id=${widget.publicKey}`}
                className="text-primary underline"
              >
                Plain HTML embed test
              </Link>
              {" · "}
              <Link href="/dashboard/widget" className="text-primary underline">
                Widget settings
              </Link>
            </p>
          </div>
        </div>
      </main>

      <WidgetEmbedLoader publicKey={widget.publicKey} />
    </div>
  );
}
