// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

/** Simple centered splash used for smoke testing */
function SmokeHome() {
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

/** Health endpoint for quick checks */
function Health() {
  return (
    <div style={{ padding: 24, color: "#fff", background: "#0b1220", minHeight: "100vh" }}>
      OK
    </div>
  );
}

/** 404 fallback */
function NotFound() {
  return (
    <div style={{ padding: 24, color: "#fff", background: "#0b1220", minHeight: "100vh" }}>
      Not Found
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SmokeHome />} />
      <Route path="/__health" element={<Health />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
