"use client";

import { useEffect } from "react";

/**
 * Loads widget.js on the client. Inline <script> tags from RSC do not run
 * after hydration, so embed demos must inject the loader in useEffect.
 */
export function WidgetEmbedLoader({
  publicKey,
  scriptSrc = "/widget.js",
}: {
  publicKey: string;
  scriptSrc?: string;
}) {
  useEffect(() => {
    if (!publicKey) return;

    const existing = document.querySelector(
      `script[data-widget-id="${publicKey}"]`,
    );
    if (existing) return;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.dataset.widgetId = publicKey;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const hostId = `tavswebs-bot-host-${publicKey.replace(/[^a-zA-Z0-9_-]/g, "")}`;
      document.getElementById(hostId)?.remove();
    };
  }, [publicKey, scriptSrc]);

  return null;
}
