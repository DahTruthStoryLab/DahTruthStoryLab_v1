// src/components/storylab/PoetryLayout.jsx
import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import PoetryModule from "./PoetryModule";
import { Feather, ArrowLeft } from "lucide-react";

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
      <aside
        className="w-72 shrink-0 flex flex-col overflow-y-auto"
        style={{
          background: "linear-gradient(175deg, #4c1d95 0%, #2e1065 55%, #0F172A 100%)",
          minHeight: "100vh",
          borderRight: "1px solid rgba(124,58,237,0.25)",
        }}
      >
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)" }}>
              <Feather size={19} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Poetry Workshop
              </h2>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px" }}>Select a tool below</p>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 py-5">
          <PoetryModule />
        </div>

        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/story-lab/poetry"
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-xs"
          >
            <ArrowLeft size={13} />
            Back to Poetry Hub
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div
          className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
          style={{ background: "rgba(245,243,255,0.96)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}
        >
          <div className="w-1 h-7 rounded-full" style={{ background: "linear-gradient(180deg, #7c3aed, #d4af37)" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(76,29,149,0.5)", fontFamily: "'EB Garamond', Georgia, serif" }}>
            Poetry Workshop
          </span>
          <span style={{ color: "rgba(76,29,149,0.25)", fontSize: "12px" }}>›</span>
          <h1 className="font-bold" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#4c1d95", fontSize: "18px" }}>
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
