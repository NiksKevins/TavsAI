import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TavsWebs Bot",
  robots: { index: false, follow: false },
};

/**
 * Widget iframe shell — transparent so only the floating UI shows on host pages.
 */
export default function WidgetRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          overflow: hidden;
          min-height: 100%;
          height: 100%;
        }
        [data-sonner-toaster] { display: none !important; }
      `}</style>
      {children}
    </>
  );
}
