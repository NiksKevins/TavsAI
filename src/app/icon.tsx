import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** App favicon — geometric chat mark on TavsWebs navy. */
export default function Icon() {
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
          borderRadius: 8,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 18,
            height: 13,
            borderRadius: 5,
            background: "#ffffff",
            marginTop: -2,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 6,
            left: 8,
            width: 6,
            height: 6,
            background: "#ffffff",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 5,
            width: 7,
            height: 7,
            borderRadius: 999,
            background: "#3b82f6",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
