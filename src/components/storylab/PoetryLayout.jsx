// src/components/storylab/PoetryLayout.jsx
import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import PoetryModule from "./PoetryModule";
import { Feather, ArrowLeft } from "lucide-react";

const BRAND = {
  purple: "#4c1d95",
  purpleLight: "#7c3aed",
  gold: "#d4af37",
  goldDark: "#b8960c",
  ink: "#0F172A",
};

const TOOL_TITLES = {
  "/story-lab/poetry/craft": "Craft Lab",
  "/story-lab/poetry/revision": "Revision Lab",
  "/story-lab/poetry/voice": "Voice & Identity",
  "/story-lab/poetry/sequence": "Sequence Builder",
  "/story-lab/poetry/remix": "Remix Lab",
};

export default function PoetryLayout() {
  const { pathname } = useLocation();
  const currentTitle = TOOL_TITLES[pathname] || "Poetry Workshop";

  return (
    <div className="flex min-h-screen" style={{ background: "#f5f3ff" }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-y-auto"
        style={{
          background: `linear-gradient(175deg, ${BRAND.purple} 0%, #2e1065 55%, ${BRAND.ink} 100%)`,
          minHeight: "100vh",
          borderRight: "1px solid rgba(124,58,237,0.25)",
          boxShadow: "4px 0 24px rgba(76,29,149,0.18)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              <Feather size={19} className="text-white" />
            </div>
            <div>
              <h2
                className="text-white font-bold text-base leading-tight"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", letterSpacing: "0.06em" }}
              >
                Poetry Workshop
              </h2>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px", marginTop: "2px" }}>
                Select a tool below
              </p>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div className="flex-1 px-3 py-5">
          <PoetryModule />
        </div>

        {/* Footer back link */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/story-lab/poetry"
            className="flex items-center gap-2 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.85)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          >
            <ArrowLeft size={13} />
            Back to Poetry Hub
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Breadcrumb bar */}
        <div
          className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
          style={{
            background: "rgba(245,243,255,0.96)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(124,58,237,0.12)",
          }}
        >
          <div
            className="w-1 h-7 rounded-full"
            style={{ background: `linear-gradient(180deg, ${BRAND.purpleLight}, ${BRAND.gold})` }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "rgba(76,29,149,0.5)", fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Poetry Workshop
          </span>
          <span style={{ color: "rgba(76,29,149,0.25)", fontSize: "12px" }}>›</span>
          <h1
            className="font-bold"
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              color: BRAND.purple,
              fontSize: "18px",
              letterSpacing: "0.03em",
            }}
          >
            {currentTitle}
          </h1>
        </div>

        <div className="flex-1 px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

