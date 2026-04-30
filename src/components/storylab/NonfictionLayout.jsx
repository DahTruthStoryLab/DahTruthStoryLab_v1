// src/components/storylab/NonfictionLayout.jsx
// Internal sidebar removed — global AppSidebar handles all navigation
// Project-aware: reads projectId from URL and stores it for all child modules

import React, { useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import { useStudioProject } from "../../hooks/useStudioProject";

const BRAND = {
  brown:    "#78350f",
  amber:    "#b45309",
  gold:     "#d4af37",
  goldDark: "#b8960c",
};

const TOOL_TITLES = {
  "/story-lab/nonfiction/essay":    "Essay Builder",
  "/story-lab/nonfiction/memoir":   "Memoir Scene Map",
  "/story-lab/nonfiction/research": "Research Notes",
  "/story-lab/nonfiction/argument": "Argument & Thesis",
  "/story-lab/nonfiction/chapter":  "Chapter Outliner",
};

export default function NonfictionLayout() {
  const { pathname } = useLocation();
  const { projectId, projectTitle } = useStudioProject();
  const currentTitle = TOOL_TITLES[pathname] || "Nonfiction Workshop";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#fffbeb" }}>

      {/* ── Breadcrumb bar ── */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
        style={{ background: "rgba(255,251,235,0.96)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(212,175,55,0.2)" }}>

        <Link to="/story-lab/nonfiction"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80 mr-2"
          style={{ color: "rgba(120,53,15,0.6)" }}>
          <ArrowLeft size={13} />
          Nonfiction
        </Link>

        <div className="w-1 h-7 rounded-full"
          style={{ background: `linear-gradient(180deg, ${BRAND.amber}, ${BRAND.gold})` }} />

        <span className="text-xs font-medium"
          style={{ color: "rgba(120,53,15,0.5)", fontFamily: "'EB Garamond', Georgia, serif" }}>
          Nonfiction Workshop
        </span>

        <span style={{ color: "rgba(120,53,15,0.25)", fontSize: "12px" }}>›</span>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
            <FileText size={13} className="text-white" />
          </div>
          <h1 className="font-bold"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.brown, fontSize: "18px" }}>
            {currentTitle}
          </h1>
        </div>

        {/* Project indicator */}
        {projectTitle && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "rgba(120,53,15,0.06)", color: BRAND.brown, border: "1px solid rgba(120,53,15,0.15)" }}>
            <FileText size={11} />
            {projectTitle}
          </div>
        )}
      </div>

      {/* ── Tool nav pills ── */}
      <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto flex-wrap"
        style={{ borderBottom: "1px solid rgba(212,175,55,0.15)", background: "#fffdf5" }}>
        {Object.entries(TOOL_TITLES).map(([path, title]) => {
          const active = pathname === path;
          // Preserve projectId in nav links
          const to = projectId ? `${path}?projectId=${projectId}` : path;
          return (
            <Link key={path} to={to}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap"
              style={active
                ? { background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})`, color: "#fff" }
                : { background: "rgba(120,53,15,0.07)", color: BRAND.brown, border: `1px solid rgba(120,53,15,0.15)` }}>
              {title}
            </Link>
          );
        })}
      </div>

      {/* ── Page content ── */}
      <main className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
