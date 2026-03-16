// src/components/storylab/NonfictionLayout.jsx
import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import NonfictionModule from "./NonFictionModule";
import { FileText, ArrowLeft } from "lucide-react";

const TOOL_TITLES = {
  "/story-lab/nonfiction/essay": "Essay Builder",
  "/story-lab/nonfiction/memoir": "Memoir Scene Map",
  "/story-lab/nonfiction/research": "Research Notes",
  "/story-lab/nonfiction/argument": "Argument & Thesis",
  "/story-lab/nonfiction/chapter": "Chapter Outliner",
};

export default function NonfictionLayout() {
  const { pathname } = useLocation();
  const currentTitle = TOOL_TITLES[pathname] || "Nonfiction Workshop";

  return (
    <div className="flex min-h-screen" style={{ background: "#fffbeb" }}>

      {/* Sidebar */}
      <aside
        className="w-72 shrink-0 flex flex-col overflow-y-auto"
        style={{
          background: "linear-gradient(175deg, #78350f 0%, #92400e 40%, #0F172A 100%)",
          minHeight: "100vh",
          borderRight: "1px solid rgba(212,175,55,0.2)",
          boxShadow: "4px 0 24px rgba(120,53,15,0.15)",
        }}
      >
        {/* Header */}
        <div className="px-5 py-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #d4af37, #b8960c)" }}>
              <FileText size={19} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", letterSpacing: "0.06em" }}>
                Nonfiction Workshop
              </h2>
              <p style={{ color: "rgba(255,255,255,0.38)", fontSize: "11px", marginTop: "2px" }}>
                Select a tool below
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-5">
          <NonfictionModule />
        </div>

        {/* Footer */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <Link
            to="/story-lab/nonfiction"
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-xs"
          >
            <ArrowLeft size={13} />
            Back to Nonfiction Hub
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Breadcrumb bar */}
        <div
          className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
          style={{
            background: "rgba(255,251,235,0.96)",
            backdropFilter: "blur(14px)",
            borderBottom: "1px solid rgba(212,175,55,0.2)",
          }}
        >
          <div className="w-1 h-7 rounded-full"
            style={{ background: "linear-gradient(180deg, #d97706, #d4af37)" }} />
          <span className="text-xs font-medium"
            style={{ color: "rgba(120,53,15,0.5)", fontFamily: "'EB Garamond', Georgia, serif" }}>
            Nonfiction Workshop
          </span>
          <span style={{ color: "rgba(120,53,15,0.25)", fontSize: "12px" }}>›</span>
          <h1 className="font-bold"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#78350f", fontSize: "18px" }}>
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

