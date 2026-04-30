// src/components/storylab/PoetryLayout.jsx
// Internal sidebar removed — global AppSidebar handles all navigation
// Project-aware: reads projectId from URL and stores it for all child modules

import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { Feather, ArrowLeft } from "lucide-react";
import { useStudioProject } from "../../hooks/useStudioProject";

const BRAND = {
  purple:      "#4c1d95",
  purpleLight: "#7c3aed",
  gold:        "#d4af37",
  goldDark:    "#b8960c",
};

const TOOL_TITLES = {
  "/story-lab/poetry/craft":    "Craft Lab",
  "/story-lab/poetry/revision": "Revision Lab",
  "/story-lab/poetry/voice":    "Voice & Identity",
  "/story-lab/poetry/sequence": "Sequence Builder",
  "/story-lab/poetry/remix":    "Remix Lab",
};

export default function PoetryLayout() {
  const { pathname } = useLocation();
  const { projectId, projectTitle } = useStudioProject();
  const currentTitle = TOOL_TITLES[pathname] || "Poetry Workshop";

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "#f5f3ff" }}>

      {/* ── Breadcrumb bar ── */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center gap-3"
        style={{ background: "rgba(245,243,255,0.96)", backdropFilter: "blur(14px)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>

        <Link to="/story-lab/poetry"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80 mr-2"
          style={{ color: "rgba(76,29,149,0.6)" }}>
          <ArrowLeft size={13} />
          Poetry
        </Link>

        <div className="w-1 h-7 rounded-full"
          style={{ background: `linear-gradient(180deg, ${BRAND.purpleLight}, ${BRAND.gold})` }} />

        <span className="text-xs font-medium"
          style={{ color: "rgba(76,29,149,0.5)", fontFamily: "'EB Garamond', Georgia, serif" }}>
          Poetry Workshop
        </span>

        <span style={{ color: "rgba(76,29,149,0.25)", fontSize: "12px" }}>›</span>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.purpleLight})` }}>
            <Feather size={13} className="text-white" />
          </div>
          <h1 className="font-bold"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.purple, fontSize: "18px" }}>
            {currentTitle}
          </h1>
        </div>

        {/* Project indicator */}
        {projectTitle && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs"
            style={{ background: "rgba(76,29,149,0.06)", color: BRAND.purple, border: "1px solid rgba(76,29,149,0.15)" }}>
            <Feather size={11} />
            {projectTitle}
          </div>
        )}
      </div>

      {/* ── Tool nav pills ── */}
      <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto flex-wrap"
        style={{ borderBottom: "1px solid rgba(124,58,237,0.1)", background: "#faf8ff" }}>
        {Object.entries(TOOL_TITLES).map(([path, title]) => {
          const active = pathname === path;
          // Preserve projectId in nav links
          const to = projectId ? `${path}?projectId=${projectId}` : path;
          return (
            <Link key={path} to={to}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap"
              style={active
                ? { background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.purpleLight})`, color: "#fff" }
                : { background: "rgba(76,29,149,0.07)", color: BRAND.purple, border: `1px solid rgba(76,29,149,0.15)` }}>
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
