import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

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
          background: "#09090b",
          borderRadius: "36px",
          border: "2px solid rgba(255, 255, 255, 0.12)",
        }}
      >
        <svg
          width="110"
          height="128"
          viewBox="0 0 24 28"
          fill="none"
          stroke="#f97316"
          strokeWidth="2.0"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Left standing spine line */}
          <line x1="6" y1="5.5" x2="6" y2="21.5" />
          
          {/* Back open cover (slender portrait depth) */}
          <polyline points="6,5.5 13.5,3 13.5,19 6,21.5" />
          
          {/* Front open cover with bottom-right fold tail */}
          <polyline points="6,5.5 18.5,8 18.5,25 14,22.5 6,21.5" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
