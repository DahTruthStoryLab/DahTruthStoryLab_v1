import React from "react";

type AeroBannerProps = {
  title: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
  /** Optional right-side content (e.g., buttons) */
  action?: React.ReactNode;
  style?: React.CSSProperties;
};

export default function AeroBanner({
  title,
  subtitle,
  size = "md",
  action,
  style,
}: AeroBannerProps) {
  const pad = size === "lg" ? "28px 40px" : size === "sm" ? "14px 20px" : "20px 32px";
  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(10,37,64,.95), rgba(31,58,95,.85))",
        color: "white",
        padding: pad,
        borderRadius: "0 0 20px 20px",
        boxShadow: "0 8px 32px rgba(10, 37, 64, 0.30)",
        marginBottom: 20,
        ...style,
      }}
      role="region"
      aria-label="Page banner"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
            aria-hidden
          >
            📚
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{title}</h1>
            {subtitle ? (
              <p style={{ margin: 0, color: "#EAF2FB", fontSize: 14, opacity: 0.95 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
