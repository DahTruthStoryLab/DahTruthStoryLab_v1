// src/components/storylab/StoryLabLayout.jsx
// Nav links removed from header — AppSidebar handles all navigation now.
// Header retains track badge + project title for in-context awareness.

import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutGrid } from "lucide-react";

const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  rose: "#e8b4b8",
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
      const storyGenre = normalizeGenre(story?.primaryGenre || story?.genre);

      let nextTrack = storyGenre;
      if (pathname.startsWith("/story-lab/poetry")) nextTrack = "Poetry";
      else if (pathname.startsWith("/story-lab/nonfiction")) nextTrack = "Nonfiction";
      else if (pathname.startsWith("/story-lab/fiction")) nextTrack = "Fiction";

      setTrack(nextTrack);
      setStoryTitle(story?.title || "");
    };

    load();

    const onProjectChange = () => load();
    window.addEventListener("project:change", onProjectChange);
    const onStorage = (e) => { if (e.key === CURRENT_STORY_KEY) load(); };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("project:change", onProjectChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg,#f8fafc)]">
      {/* Slim context header — track + project only, no nav links */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="px-6 py-3 flex items-center gap-3">
          {/* StoryLab icon */}
          <Link
            to="/story-lab"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm hover:opacity-90 transition flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 55%, ${BRAND.rose} 100%)`,
            }}
            title="Story Lab Studio"
          >
            <LayoutGrid size={15} />
          </Link>

          {/* Studio label */}
          <span
            className="text-sm font-semibold text-slate-700"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Story Lab Studio
          </span>

          <span className="text-slate-300 text-sm">·</span>

          {/* Track badge */}
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
            style={{
              background: "rgba(212,175,55,0.14)",
              border: `1px solid rgba(212,175,55,0.25)`,
              color: BRAND.goldDark,
            }}
          >
            {track}
          </span>

          {/* Current project */}
          {storyTitle && (
            <>
              <span className="text-slate-300 text-sm hidden sm:inline">·</span>
              <span className="text-xs text-slate-400 truncate hidden sm:inline">
                {storyTitle}
              </span>
            </>
          )}

          {!storyTitle && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              No project selected
            </span>
          )}
        </div>
      </div>

      {/* Page content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

