import { prisma } from "@/lib/db";
import { isParentOriginAllowed } from "@/lib/widget/security";
import { WidgetFrame } from "@/components/widget/widget-frame";

type Props = {
  searchParams: Promise<{ id?: string; parent?: string }>;
};

export default async function WidgetFramePage({ searchParams }: Props) {
  const params = await searchParams;
  const publicKey = params.id ?? "";
  const rawParent = params.parent?.trim() || "";

  let parentOrigin = "";
  if (rawParent && rawParent !== "*") {
    try {
      parentOrigin = new URL(rawParent).origin;
    } catch {
      parentOrigin = "";
    }
  }

  const widget = publicKey
    ? await prisma.widgetConfiguration.findUnique({
        where: { publicKey },
        select: { isActive: true, allowedOrigins: true },
      })
    : null;

  if (!widget?.isActive) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-4 text-sm text-slate-600">
        Widget unavailable
      </div>
    );
  }

  if (
    parentOrigin &&
    !isParentOriginAllowed(parentOrigin, widget.allowedOrigins)
  ) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-4 text-sm text-slate-600">
        Origin not allowed
      </div>
    );
  }

  // Prefer a concrete parent origin for postMessage; never default to "*".
  const safeParent =
    parentOrigin ||
    (typeof process.env.NEXT_PUBLIC_APP_URL === "string"
      ? (() => {
          try {
            return new URL(process.env.NEXT_PUBLIC_APP_URL).origin;
          } catch {
            return "";
          }
        })()
      : "");

  return (
    <div className="fixed inset-0 bg-transparent">
      <WidgetFrame publicKey={publicKey} parentOrigin={safeParent} />
    </div>
  );
}
