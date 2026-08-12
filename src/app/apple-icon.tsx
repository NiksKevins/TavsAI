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
          background: "#0a1220",
          borderRadius: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            width: 96,
            height: 96,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 88,
              height: 64,
              borderRadius: 22,
              background: "#ffffff",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: 18,
              width: 22,
              height: 22,
              background: "#ffffff",
              transform: "rotate(45deg)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 22,
              right: 10,
              width: 22,
              height: 22,
              borderRadius: 999,
              background: "#3b82f6",
              border: "4px solid #0a1220",
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
