// src/components/storylab/StoryLabLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, PenLine, LayoutGrid } from "lucide-react";

/* ============================================
   BRAND COLORS (keep aligned with WorkshopHub)
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  rose: "#e8b4b8",
  ink: "#0F172A",
};

const CURRENT_STORY_KEY = "currentStory";

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeGenre(genreRaw) {
  const g = String(genreRaw || "").toLowerCase();

  if (g.includes("poem") || g.includes("poetry")) return "Poetry";

  if (
    (g.includes("non") && g.includes("fiction")) ||
    g.includes("memoir") ||
    g.includes("essay") ||
    g.includes("biograph") ||
    g.includes("self help") ||
    g.includes("self-help") ||
    g.includes("history") ||
    g.includes("devotional") ||
    g.includes("christian living") ||
    g.includes("how to") ||
    g.includes("how-to")
  ) {
    return "Nonfiction";
  }

  return "Fiction";
}

export default function StoryLabLayout() {
  const { pathname } = useLocation();
  const [track, setTrack] = useState("Fiction");
  const [storyTitle, setStoryTitle] = useState("");

  useEffect(() => {
    const load = () => {
      const story = safeJsonParse(localStorage.getItem(CURRENT_STORY_KEY), {});
      const nextTrack = normalizeGenre(story?.primaryGenre || story?.genre);
      setTrack(nextTrack);
      setStoryTitle(story?.title || "");
    };

    load();

    const onProjectChange = () => load();
    window.addEventListener("project:change", onProjectChange);

    const onStorage = (e) => {
      if (e.key === CURRENT_STORY_KEY) load();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("project:change", onProjectChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const inHub =
    pathname === "/story-lab/hub" || pathname === "/story-lab/workshop";

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg,#f8fafc)]">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: Brand + context */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 55%, ${BRAND.rose} 100%)`,
              }}
              title="StoryLab"
            >
              <LayoutGrid size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-slate-800">StoryLab</span>
                <span className="text-slate-300">•</span>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(212,175,55,0.14)",
                    border: `1px solid rgba(212,175,55,0.25)`,
                    color: BRAND.goldDark,
                  }}
                >
                  {track}
                </span>
              </div>

              <div className="text-xs text-slate-500 truncate">
                {storyTitle ? storyTitle : "No project selected"}
              </div>
            </div>
          </div>

          {/* Right: quick nav */}
          <div className="flex items-center gap-2 shrink-0">
            {!inHub && (
              <Link
                to="/story-lab/hub"
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-slate-100 text-slate-700"
              >
                <BookOpen size={16} />
                Hub
              </Link>
            )}

            <Link
              to="/compose"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(30,58,95,0.10)",
                border: "1px solid rgba(30,58,95,0.18)",
                color: BRAND.navy,
              }}
            >
              <PenLine size={16} />
              Writer
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.20)",
                color: BRAND.goldDark,
              }}
            >
              <BookOpen size={16} />
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
