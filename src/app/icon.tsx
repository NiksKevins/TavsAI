import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** App favicon — chat mark + live pulse on TavsWebs navy. */
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
          background: "#0A1220",
          borderRadius: 9,
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 16,
            height: 12,
            borderRadius: 5,
            background: "#FFFFFF",
            marginTop: -3,
            marginLeft: -1,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 5,
            left: 7,
            width: 6,
            height: 6,
            background: "#FFFFFF",
            transform: "rotate(45deg)",
            borderRadius: 1,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "#0A1220",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background: "#3B82F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 2.5,
                height: 2.5,
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
