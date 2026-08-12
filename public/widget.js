/**
 * TavsWebs Bot embeddable loader.
 * Public snippet:
 * <script src="https://bot.tavswebs.com/widget.js" data-widget-id="PUBLIC_KEY" async></script>
 *
 * Uses an iframe for CSS/JS isolation. No secrets in this file.
 */
(function () {
  "use strict";

  var SCRIPT =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();

  if (!SCRIPT) return;

  var widgetId =
    SCRIPT.getAttribute("data-widget-id") ||
    SCRIPT.getAttribute("data-public-key");
  if (!widgetId) {
    console.warn("[TavsWebs Bot] Missing data-widget-id");
    return;
  }

  var src = SCRIPT.getAttribute("src") || "";
  var origin;
  try {
    origin = new URL(src, window.location.href).origin;
  } catch {
    origin = window.location.origin;
  }

  var POSITION = "bottom-right";
  var HOST_ID = "tavswebs-bot-host-" + widgetId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (document.getElementById(HOST_ID)) return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function applyClosedPosition(host) {
    host.style.top = "auto";
    host.style.bottom = "20px";
    // 60px button + 8px padding + pulse ring — 72px clipped the launcher icon.
    host.style.width = "88px";
    host.style.height = "88px";
    if (POSITION.indexOf("left") >= 0) {
      host.style.left = "20px";
      host.style.right = "auto";
    } else {
      host.style.right = "20px";
      host.style.left = "auto";
    }
  }

  function applyOpenPosition(host) {
    if (window.matchMedia("(max-width: 640px)").matches) {
      host.style.top = "0";
      host.style.left = "0";
      host.style.right = "0";
      host.style.bottom = "0";
      host.style.width = "100vw";
      host.style.height = "100dvh";
      return;
    }

    host.style.top = "auto";
    host.style.bottom = "16px";
    host.style.width = "min(100vw, 400px)";
    host.style.height = "min(100vh, 680px)";
    if (POSITION.indexOf("left") >= 0) {
      host.style.left = "16px";
      host.style.right = "auto";
    } else {
      host.style.right = "16px";
      host.style.left = "auto";
    }
  }

  function createHost() {
    var host = document.createElement("div");
    host.id = HOST_ID;
    host.setAttribute("data-tavswebs-bot", "1");
    host.style.cssText = [
      "all: initial",
      "position: fixed",
      "z-index: 2147483000",
      "pointer-events: none",
    ].join(";");
    applyClosedPosition(host);

    var iframe = document.createElement("iframe");
    iframe.title = "TavsWebs Bot";
    iframe.setAttribute("allow", "clipboard-write");
    iframe.setAttribute(
      "sandbox",
      "allow-scripts allow-same-origin allow-forms allow-popups",
    );
    iframe.src =
      origin +
      "/widget/frame?id=" +
      encodeURIComponent(widgetId) +
      "&parent=" +
      encodeURIComponent(window.location.origin);
    iframe.style.cssText = [
      "all: initial",
      "border: 0",
      "position: absolute",
      "inset: 0",
      "width: 100%",
      "height: 100%",
      "pointer-events: auto",
      "background: transparent",
      "color-scheme: normal",
    ].join(";");

    host.appendChild(iframe);
    document.body.appendChild(host);

    window.addEventListener("message", function (event) {
      if (event.origin !== origin) return;
      var data = event.data;
      if (!data || data.source !== "tavswebs-bot") return;
      if (data.widgetId !== widgetId) return;

      if (data.type === "config" && data.position) {
        POSITION = data.position;
        applyClosedPosition(host);
      }

      if (data.type === "resize") {
        if (data.open) applyOpenPosition(host);
        else applyClosedPosition(host);
      }
    });
  }

  try {
    ready(createHost);
  } catch (err) {
    console.warn("[TavsWebs Bot] failed to initialize", err);
  }
})();
