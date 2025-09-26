// src/App.jsx
import React from "react";

export default function App() {
  console.log("[SMOKE] App mounted");
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>
          ✅ App mounted (smoke test)
        </div>
        <div style={{ opacity: 0.8, marginTop: 8 }}>
          If you can see this, React is rendering.
        </div>
      </div>
    </div>
  );
}
