import { ImageResponse } from "next/og";

import { loadOgFonts } from "@/lib/brand/og-fonts";
import { isAppLocale } from "@/i18n/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "TavsWebs Bot";

const COPY = {
  lv: {
    headline: "Beidz zaudēt klientus pēc darba laika.",
    sub: "Sistēma, kas atbild, apkopo leadus un palīdz pieteikties — dienu un nakti.",
    chips: ["Vienmēr online", "Bez zaudētiem leadiem", "Tavā mājaslapā"],
    siteLabel: "Auto serviss & riepu maiņa",
    assistant: "AI asistents",
    online: "TIEŠSAISTĒ",
    userMsg: "Cik maksā eļļas maiņa?",
    botMsg: "No 45 € ar filtru. Vai pierakstīties?",
  },
  en: {
    headline: "Stop losing customers after hours.",
    sub: "A system that answers, captures leads, and helps people book — day and night.",
    chips: ["Always on", "No lost leads", "On your website"],
    siteLabel: "Auto service & tyre fitting",
    assistant: "AI assistant",
    online: "LIVE",
    userMsg: "How much is an oil change?",
    botMsg: "From €45 incl. filter. Want to book a time?",
  },
} as const;

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isAppLocale(raw) ? raw : "lv";
  const copy = COPY[locale];
  const fonts = await loadOgFonts();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#05070c",
          color: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* Blue wash — top right */}
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -160,
            width: 640,
            height: 480,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(59,130,246,0.35) 0%, rgba(59,130,246,0) 70%)",
          }}
        />
        {/* Soft cyan wash — bottom left */}
        <div
          style={{
            position: "absolute",
            left: -80,
            bottom: -120,
            width: 420,
            height: 320,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(94,234,212,0.12) 0%, rgba(94,234,212,0) 70%)",
          }}
        />

        {/* Fine grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.07,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            padding: "56px 64px",
            position: "relative",
            gap: 40,
          }}
        >
          {/* Copy column */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              width: 620,
              height: "100%",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#0a1220",
                    border: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 12,
                      borderRadius: 4,
                      background: "#fff",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: "Syne",
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                  }}
                >
                  TavsWebs Bot
                </div>
              </div>

              <div
                style={{
                  fontFamily: "Syne",
                  fontSize: 52,
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: "-0.045em",
                  maxWidth: 580,
                }}
              >
                {copy.headline}
              </div>

              <div
                style={{
                  fontFamily: "Manrope",
                  fontSize: 22,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  color: "#94a3b8",
                  maxWidth: 520,
                }}
              >
                {copy.sub}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                {copy.chips.map(
                  (label) => (
                    <div
                      key={label}
                      style={{
                        fontFamily: "Manrope",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#cbd5e1",
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "1px solid rgba(148,163,184,0.25)",
                        background: "rgba(15,23,42,0.5)",
                      }}
                    >
                      {label}
                    </div>
                  ),
                )}
              </div>
            </div>

            <div
              style={{
                fontFamily: "Manrope",
                fontSize: 18,
                fontWeight: 600,
                color: "#60a5fa",
                letterSpacing: "0.02em",
              }}
            >
              bot.tavswebs.com
            </div>
          </div>

          {/* Product stage */}
          <div
            style={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              position: "relative",
            }}
          >
            {/* Browser chrome */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 420,
                borderRadius: 16,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "#0f172a",
                boxShadow: "0 40px 80px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 16px",
                  background: "#111827",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "#ff5f57" }} />
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "#febc2e" }} />
                <div style={{ width: 8, height: 8, borderRadius: 999, background: "#28c840" }} />
                <div
                  style={{
                    marginLeft: 10,
                    flex: 1,
                    height: 22,
                    borderRadius: 6,
                    background: "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 10,
                    fontFamily: "Manrope",
                    fontSize: 12,
                    color: "#64748b",
                  }}
                >
                  autoserviss.lv
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: 20,
                  gap: 14,
                  background: "linear-gradient(160deg, #1e3a5f 0%, #0f172a 55%, #0b1220 100%)",
                  minHeight: 280,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontFamily: "Syne",
                    fontSize: 22,
                    fontWeight: 700,
                    letterSpacing: "-0.03em",
                    color: "#e2e8f0",
                    maxWidth: 220,
                  }}
                >
                  {copy.siteLabel}
                </div>
                <div
                  style={{
                    width: 88,
                    height: 28,
                    borderRadius: 6,
                    background: "#e2e8f0",
                  }}
                />

                {/* Chat card */}
                <div
                  style={{
                    position: "absolute",
                    right: 16,
                    bottom: 16,
                    width: 230,
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#ffffff",
                    border: "1px solid rgba(15,23,42,0.08)",
                    boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderTop: "3px solid #3b82f6",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div
                        style={{
                          fontFamily: "Manrope",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {copy.assistant}
                      </div>
                      <div
                        style={{
                          fontFamily: "Manrope",
                          fontSize: 11,
                          color: "#64748b",
                        }}
                      >
                        AutoServiss
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "Manrope",
                        fontSize: 9,
                        fontWeight: 600,
                        color: "#047857",
                        background: "#ecfdf5",
                        padding: "3px 7px",
                        borderRadius: 999,
                      }}
                    >
                      {copy.online}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      padding: 12,
                      background: "#f8fafc",
                    }}
                  >
                    <div
                      style={{
                        alignSelf: "flex-end",
                        background: "#3b82f6",
                        color: "#fff",
                        fontFamily: "Manrope",
                        fontSize: 12,
                        padding: "8px 10px",
                        borderRadius: 12,
                        maxWidth: 170,
                      }}
                    >
                      {copy.userMsg}
                    </div>
                    <div
                      style={{
                        alignSelf: "flex-start",
                        background: "#fff",
                        color: "#0f172a",
                        fontFamily: "Manrope",
                        fontSize: 12,
                        padding: "8px 10px",
                        borderRadius: 12,
                        maxWidth: 180,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      {copy.botMsg}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
    },
  );
}
