import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Apple touch icon — same mark, larger canvas. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A1220",
          borderRadius: 42,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 88,
            height: 64,
            borderRadius: 22,
            background: "#FFFFFF",
            marginTop: -14,
            marginLeft: -6,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 38,
            left: 48,
            width: 28,
            height: 28,
            background: "#FFFFFF",
            transform: "rotate(45deg)",
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            width: 48,
            height: 48,
            borderRadius: 999,
            background: "#0A1220",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#FFFFFF",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
