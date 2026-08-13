"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type LeadField = {
  key: string;
  labelLv?: string;
  labelEn?: string;
  required?: boolean;
};

type WidgetConfig = {
  publicKey: string;
  primaryColor: string;
  position: string;
  theme: string;
  borderRadius: number;
  logoUrl: string | null;
  launcherText: string;
  assistantName: string;
  businessName: string;
  welcomeMessage: string;
  quickActions: string[];
  leadFormEnabled: boolean;
  leadFields: LeadField[];
  handoffMessage: string;
  locale: "lv" | "en";
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type UiState = "idle" | "typing" | "streaming" | "error" | "offline";

const STORAGE_PREFIX = "tavswebs_bot_";

function storageKey(publicKey: string, suffix: string) {
  return `${STORAGE_PREFIX}${publicKey}_${suffix}`;
}

function getVisitorId(publicKey: string) {
  const key = storageKey(publicKey, "visitor");
  let id = localStorage.getItem(key);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `v_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function WidgetFrame({
  publicKey,
  parentOrigin,
}: {
  publicKey: string;
  parentOrigin: string;
}) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<UiState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showLead, setShowLead] = useState(false);
  const [leadHandoff, setLeadHandoff] = useState(false);
  const [leadForm, setLeadForm] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [leadError, setLeadError] = useState<string | null>(null);
  const [leadSent, setLeadSent] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [launcherExpanded, setLauncherExpanded] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const postParent = useCallback(
    (payload: Record<string, unknown>) => {
      if (typeof window === "undefined") return;
      window.parent.postMessage(
        { source: "tavswebs-bot", widgetId: publicKey, ...payload },
        parentOrigin || "*",
      );
    },
    [parentOrigin, publicKey],
  );

  useEffect(() => {
    postParent({
      type: "resize",
      open,
      launcherExpanded: !open && launcherExpanded,
    });
  }, [open, launcherExpanded, postParent]);

  useEffect(() => {
    if (!publicKey) {
      setState("error");
      setError("Missing widget id");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/widget/config?publicKey=${encodeURIComponent(publicKey)}`,
        );
        if (!res.ok) throw new Error("config_failed");
        const data = (await res.json()) as WidgetConfig;
        if (cancelled) return;
        setConfig(data);
        postParent({ type: "config", position: data.position });

        const savedConversation = localStorage.getItem(
          storageKey(publicKey, "conversation"),
        );
        if (savedConversation) setConversationId(savedConversation);

        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: data.welcomeMessage,
          },
        ]);
      } catch {
        if (!cancelled) {
          setState("offline");
          setError("Neizdevās ielādēt widget.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicKey, postParent]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, showLead, state]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const theme = useMemo(() => {
    const dark = config?.theme === "dark";
    return {
      bg: dark ? "#0f1412" : "#f7f6f3",
      panel: dark ? "#171c19" : "#fffcf8",
      text: dark ? "#f4faf7" : "#14201c",
      muted: dark ? "#9aada4" : "#5b6b64",
      border: dark ? "#2a3530" : "#d7dbd4",
      primary: config?.primaryColor || "#0F5C4C",
      radius: config?.borderRadius ?? 16,
    };
  }, [config]);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || !config || state === "streaming" || state === "typing") return;

    setError(null);
    setShowLead(false);
    setLeadSent(false);
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setState("typing");

    const assistantId = `a_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const visitorId = getVisitorId(publicKey);
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          message: text,
          conversationId,
          visitorId,
          locale: config.locale,
          stream: true,
        }),
      });

      if (res.status === 429) {
        throw new Error("rate_limited");
      }
      if (!res.ok || !res.body) throw new Error("chat_failed");

      setState("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assembled = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const line of lines) {
            if (line.startsWith("event:")) event = line.slice(6).trim();
            if (line.startsWith("data:")) dataLine += line.slice(5).trim();
          }
          if (!dataLine) continue;
          const data = JSON.parse(dataLine) as {
            token?: string;
            conversationId?: string;
            showLeadForm?: boolean;
            handoff?: boolean;
            usedFallback?: boolean;
            contactHint?: { phone?: string; email?: string };
            error?: string;
          };

          if (event === "token" && data.token) {
            assembled += data.token;
            const snapshot = assembled;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, content: snapshot } : m,
              ),
            );
          }
          if (event === "done") {
            if (data.conversationId) {
              setConversationId(data.conversationId);
              localStorage.setItem(
                storageKey(publicKey, "conversation"),
                data.conversationId,
              );
            }
            if (
              (data.showLeadForm || data.usedFallback) &&
              config.leadFormEnabled
            ) {
              if (data.contactHint?.phone || data.contactHint?.email) {
                setLeadForm((prev) => ({
                  ...prev,
                  phone: data.contactHint?.phone || prev.phone,
                  email: data.contactHint?.email || prev.email,
                }));
              }
              setShowLead(true);
              setLeadHandoff(Boolean(data.handoff));
            }
          }
          if (event === "error") {
            throw new Error(data.error || "stream_failed");
          }
        }
      }

      if (!assembled.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content:
                    config.locale === "lv"
                      ? "Atvainojiet, radās kļūda. Mēģiniet vēlreiz."
                      : "Sorry, something went wrong. Please try again.",
                }
              : m,
          ),
        );
      }

      setState("idle");
    } catch (err) {
      const message =
        err instanceof Error && err.message === "rate_limited"
          ? config.locale === "lv"
            ? "Pārāk daudz ziņu. Uzgaidiet brīdi."
            : "Too many messages. Please wait a moment."
          : config.locale === "lv"
            ? "Neizdevās saņemt atbildi. Pārbaudiet savienojumu."
            : "Could not get a reply. Check your connection.";
      setState("error");
      setError(message);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content
            ? { ...m, content: message }
            : m,
        ),
      );
    }
  }

  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;
    setLeadError(null);

    if (leadForm.name.trim().length < 2) {
      setLeadError(config.locale === "lv" ? "Ievadiet vārdu." : "Enter your name.");
      return;
    }
    if (!/^[+\d\s()-]{5,}$/.test(leadForm.phone.trim())) {
      setLeadError(
        config.locale === "lv" ? "Nederīgs tālrunis." : "Invalid phone.",
      );
      return;
    }
    if (
      leadForm.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadForm.email.trim())
    ) {
      setLeadError(
        config.locale === "lv" ? "Nederīgs e-pasts." : "Invalid email.",
      );
      return;
    }

    try {
      const res = await fetch("/api/widget/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicKey,
          conversationId,
          name: leadForm.name.trim(),
          phone: leadForm.phone.trim(),
          email: leadForm.email.trim(),
          handoff: leadHandoff,
        }),
      });
      if (!res.ok) throw new Error("lead_failed");
      setLeadSent(true);
      setShowLead(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `sys_${Date.now()}`,
          role: "system",
          content:
            config.locale === "lv"
              ? "Paldies! Komanda sazināsies ar jums."
              : "Thank you! The team will contact you.",
        },
      ]);
    } catch {
      setLeadError(
        config.locale === "lv"
          ? "Neizdevās nosūtīt. Mēģiniet vēlreiz."
          : "Could not send. Try again.",
      );
    }
  }

  if (!publicKey) {
    return null;
  }

  if (!config) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "end",
          padding: 8,
          boxSizing: "border-box",
          fontFamily:
            'var(--font-manrope), ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <LauncherButton
          label="Chat"
          primary="#0F5C4C"
          loading
        />
      </div>
    );
  }

  const pinLeft = (config.position || "").includes("left");

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: pinLeft ? "flex-start" : "flex-end",
        boxSizing: "border-box",
        padding: open ? 0 : 4,
        fontFamily:
          'var(--font-manrope), ui-sans-serif, system-ui, sans-serif',
        color: theme.text,
      }}
    >
      {open ? (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: isMobile ? 0 : theme.radius,
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(20,32,28,0.18)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderBottom: `1px solid ${theme.border}`,
              background: theme.bg,
              paddingTop: "max(14px, env(safe-area-inset-top))",
            }}
          >
            {config.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logoUrl}
                alt=""
                width={36}
                height={36}
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: theme.primary,
                  color: "#fff",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 600,
                }}
              >
                {config.assistantName.slice(0, 1)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>
                {config.assistantName}
              </div>
              <div style={{ fontSize: 12, color: theme.muted }}>
                {config.businessName}
              </div>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              style={{
                border: 0,
                background: "transparent",
                color: theme.muted,
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ×
            </button>
          </header>

          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              background: theme.bg,
              WebkitOverflowScrolling: "touch",
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: "flex",
                  justifyContent:
                    message.role === "user" ? "flex-end" : "flex-start",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    fontSize: 14,
                    lineHeight: 1.45,
                    whiteSpace: "pre-wrap",
                    background:
                      message.role === "user"
                        ? theme.primary
                        : message.role === "system"
                          ? "transparent"
                          : theme.panel,
                    color:
                      message.role === "user"
                        ? "#fff"
                        : message.role === "system"
                          ? theme.muted
                          : theme.text,
                    border:
                      message.role === "assistant"
                        ? `1px solid ${theme.border}`
                        : "none",
                    fontStyle: message.role === "system" ? "italic" : "normal",
                  }}
                >
                  {message.content ||
                    (state === "typing" || state === "streaming"
                      ? "…"
                      : "")}
                </div>
              </div>
            ))}

            {(state === "typing" || state === "streaming") &&
            messages[messages.length - 1]?.content === "" ? (
              <div style={{ fontSize: 12, color: theme.muted }}>typing...</div>
            ) : null}

            {showLead && !leadSent ? (
              <form
                onSubmit={submitLead}
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  background: theme.panel,
                }}
              >
                <div style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>
                  {leadHandoff
                    ? config.handoffMessage
                    : config.locale === "lv"
                      ? "Atstājiet kontaktus"
                      : "Leave your contact details"}
                </div>
                <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                  {config.locale === "lv" ? "Vārds" : "Name"}
                  <input
                    value={leadForm.name}
                    onChange={(e) =>
                      setLeadForm((s) => ({ ...s, name: e.target.value }))
                    }
                    required
                    style={inputStyle(theme)}
                  />
                </label>
                <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                  {config.locale === "lv" ? "Tālrunis" : "Phone"}
                  <input
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm((s) => ({ ...s, phone: e.target.value }))
                    }
                    required
                    style={inputStyle(theme)}
                  />
                </label>
                <label style={{ display: "block", fontSize: 12, marginBottom: 6 }}>
                  {config.locale === "lv" ? "E-pasts" : "Email"}
                  <input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm((s) => ({ ...s, email: e.target.value }))
                    }
                    style={inputStyle(theme)}
                  />
                </label>
                {leadError ? (
                  <div style={{ color: "#b42318", fontSize: 12, marginBottom: 8 }}>
                    {leadError}
                  </div>
                ) : null}
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    border: 0,
                    borderRadius: 10,
                    padding: "10px 12px",
                    background: theme.primary,
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {config.locale === "lv" ? "Nosūtīt" : "Send"}
                </button>
              </form>
            ) : null}

            {error && state === "error" ? (
              <div style={{ color: "#b42318", fontSize: 12, marginTop: 8 }}>
                {error}
              </div>
            ) : null}
          </div>

          {config.quickActions?.length &&
          messages.filter((m) => m.role === "user").length === 0 &&
          !showLead ? (
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                padding: "8px 12px",
                borderTop: `1px solid ${theme.border}`,
                background: theme.panel,
              }}
            >
              {config.quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => sendMessage(action)}
                  style={{
                    flex: "0 0 auto",
                    border: `1px solid ${theme.border}`,
                    background: theme.bg,
                    color: theme.text,
                    borderRadius: 999,
                    padding: "6px 10px",
                    fontSize: 12,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          ) : null}

          <footer
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              paddingBottom: "max(10px, env(safe-area-inset-bottom))",
              borderTop: `1px solid ${theme.border}`,
              background: theme.panel,
            }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              placeholder={
                config.locale === "lv" ? "Rakstiet ziņu…" : "Type a message…"
              }
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              style={{
                flex: 1,
                resize: "none",
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "10px 12px",
                fontSize: 14,
                fontFamily: "inherit",
                background: theme.bg,
                color: theme.text,
                outline: "none",
                maxHeight: 96,
              }}
            />
            <button
              type="button"
              onClick={() => void sendMessage(input)}
              disabled={!input.trim() || state === "streaming"}
              style={{
                border: 0,
                borderRadius: 12,
                padding: "0 14px",
                background: theme.primary,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                opacity: !input.trim() || state === "streaming" ? 0.6 : 1,
              }}
            >
              {config.locale === "lv" ? "Sūtīt" : "Send"}
            </button>
          </footer>
        </div>
      ) : (
        <LauncherButton
          label={config.launcherText}
          primary={theme.primary}
          onClick={() => setOpen(true)}
          onExpandChange={setLauncherExpanded}
        />
      )}
    </div>
  );
}

function ChatBubbleIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 4.25c-4.28 0-7.75 2.98-7.75 6.65 0 2.18 1.2 4.12 3.08 5.3-.12.72-.62 1.9-1.86 3.05 1.72-.12 3.05-.82 3.92-1.42.82.2 1.7.3 2.61.3 4.28 0 7.75-2.98 7.75-6.65S16.28 4.25 12 4.25Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 9.9h6.8M8.6 12.7h4.4"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LauncherButton({
  label,
  primary,
  onClick,
  loading,
  onExpandChange,
}: {
  label: string;
  primary: string;
  onClick?: () => void;
  loading?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const expanded = hovered && !loading;
  const shadow = expanded
    ? `0 14px 34px ${hexToRgba(primary, 0.38)}, 0 4px 10px rgba(20,32,28,0.12)`
    : `0 10px 28px ${hexToRgba(primary, 0.28)}, 0 2px 6px rgba(20,32,28,0.08)`;

  useEffect(() => {
    onExpandChange?.(expanded);
    return () => onExpandChange?.(false);
  }, [expanded, onExpandChange]);

  return (
    <button
      type="button"
      aria-label={label}
      disabled={loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: expanded ? "auto" : 60,
        minWidth: 60,
        height: 60,
        padding: expanded ? "0 18px" : 0,
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.18)",
        background: `linear-gradient(160deg, ${lighten(primary, 0.12)} 0%, ${primary} 55%, ${darken(primary, 0.08)} 100%)`,
        color: "#fff",
        boxShadow: shadow,
        cursor: loading ? "default" : "pointer",
        transform: expanded ? "translateY(-2px) scale(1.02)" : "none",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, width 200ms ease, padding 200ms ease",
        overflow: "visible",
        fontFamily: "inherit",
        lineHeight: 0,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: -3,
          borderRadius: 999,
          border: `1.5px solid ${hexToRgba(primary, expanded ? 0.35 : 0.2)}`,
          pointerEvents: "none",
          animation: loading ? undefined : "tavswebsPulse 2.4s ease-out infinite",
        }}
      />
      <style>{`
        @keyframes tavswebsPulse {
          0% { transform: scale(1); opacity: 0.45; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
      {loading ? (
        <span style={{ fontSize: 22, lineHeight: 1, opacity: 0.85 }}>…</span>
      ) : (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: expanded ? 10 : 0,
          }}
        >
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 24,
              height: 24,
              flexShrink: 0,
            }}
          >
            <ChatBubbleIcon size={22} />
          </span>
          {expanded ? (
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ) : null}
        </span>
      )}
    </button>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(15,92,76,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function mixHex(hex: string, toward: number, amount: number) {
  const cleaned = hex.replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  const mix = (channel: number) =>
    Math.round(channel + (toward - channel) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function lighten(hex: string, amount: number) {
  return mixHex(hex, 255, amount);
}

function darken(hex: string, amount: number) {
  return mixHex(hex, 0, amount);
}

function inputStyle(theme: {
  border: string;
  bg: string;
  text: string;
}): React.CSSProperties {
  return {
    display: "block",
    width: "100%",
    marginTop: 4,
    marginBottom: 8,
    boxSizing: "border-box",
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "8px 10px",
    background: theme.bg,
    color: theme.text,
    fontSize: 14,
    fontFamily: "inherit",
  };
}
