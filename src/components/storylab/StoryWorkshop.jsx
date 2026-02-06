// src/components/storylab/StoryWorkshop.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Layers,
  Pin,
  Map as RouteIcon,
  ListChecks,
  Sparkles,
} from "lucide-react";

import BackToLanding, { BackToLandingFab } from "./BackToLanding";

// ✅ Add these imports
import { ensureSelectedProject, getSelectedProjectId } from "../../lib/projectsSync";
import { WORKSHOP_CARDS_BY_GENRE, normalizeGenre } from "../../lib/storyWorkshopCards";

/* --------------------------------------------
   Simple Dark Toggle (use your app's if you have one)
--------------------------------------------- */
function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("theme-dark")
  );
  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="px-3 py-2 rounded-lg bg-white/60 border border-border hover:bg-white"
      title="Toggle dark mode"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}

/* --------------------------------------------
   Utilities for the top “quote” block
--------------------------------------------- */
const stripHtml = (g) =>
  (g || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

/* --------------------------------------------
   New top “hero” banner + quote (centered)
--------------------------------------------- */
const HeroBanner = ({ quoteHtml, genreLabel }) => {
  const cleaned = useMemo(() => stripHtml(quoteHtml), [quoteHtml]);
  const quote = cleaned && cleaned !== "”" && cleaned !== "“" ? cleaned : "";

  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-8 text-center shadow overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink">
            Welcome to your Story Journey
          </h1>
          <p className="mt-3 text-muted max-w-2xl mx-auto">
            Your workshop modules adapt to your manuscript’s genre so you always see the right tools at the right time.
          </p>

          <div className="mt-4 text-sm text-muted">
            <span className="font-semibold text-ink">Current Track:</span>{" "}
            {genreLabel}
          </div>

          <div className="mt-6 glass-panel px-4 py-4 rounded-2xl">
            <div className="text-sm font-semibold text-muted mb-1">Featured Line</div>
            {quote ? (
              <blockquote className="text-lg md:text-xl text-ink italic">
                “{quote}”
              </blockquote>
            ) : (
              <p className="text-muted">Add your first scene or quote to see it featured here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------
   Small module card
--------------------------------------------- */
const ModuleCard = ({ to, title, description, Icon }) => (
  <Link
    to={to}
    className="rounded-2xl border border-border bg-white/80 backdrop-blur-xl p-5 hover:bg-white transition shadow-sm hover:shadow"
  >
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-border bg-white/70 p-3">
        <Icon className="h-6 w-6 text-ink/80" />
      </div>
      <div>
        <div className="text-lg font-semibold text-ink">{title}</div>
        <div className="text-sm text-muted">{description}</div>
      </div>
    </div>
  </Link>
);

/* --------------------------------------------
   StoryLab Header (centered title, right controls)
--------------------------------------------- */
function StoryLabHeader() {
  const navigate = useNavigate();
  return (
    <header className="border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex-1" />
        <h1 className="text-xl font-semibold text-ink text-center flex-1">
          StoryLab
        </h1>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-2 rounded-lg bg-brand-gold text-white hover:opacity-90"
            title="Back to Dashboard"
          >
            ← Dashboard
          </button>
          <button
            onClick={() => alert("Open StoryLab settings…")}
            className="px-3 py-2 rounded-lg bg-white/60 border border-border hover:bg-white"
            title="Settings"
          >
            Settings
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </header>
  );
}

/* --------------------------------------------
   Workshop Hub (StoryLab launcher)
--------------------------------------------- */
export default function StoryWorkshop() {
  const quoteHtml = "";

  const [projectId, setProjectId] = useState("");
  const [genre, setGenre] = useState("General");

  // ✅ Read selected project + listen for changes
  useEffect(() => {
    const sync = () => {
      try {
        const p = ensureSelectedProject();
        const id = p?.id || getSelectedProjectId() || "";
        setProjectId(id);
        setGenre(normalizeGenre(p?.genre));
      } catch {
        setProjectId("");
        setGenre("General");
      }
    };

    sync();
    const onChange = () => sync();
    window.addEventListener("project:change", onChange);
    return () => window.removeEventListener("project:change", onChange);
  }, []);

  // ✅ Icon mapping (string -> component)
  const iconMap = useMemo(
    () => ({
      BookOpen,
      Layers,
      Pin,
      RouteIcon,
      ListChecks,
      Sparkles,
    }),
    []
  );

  const cards = useMemo(() => {
    const common = WORKSHOP_CARDS_BY_GENRE.common || [];
    const byGenre = WORKSHOP_CARDS_BY_GENRE[genre] || WORKSHOP_CARDS_BY_GENRE.General || [];
    // Combine common + genre, remove dupes by key
    const merged = [...common, ...byGenre];
    const seen = new Set();
    return merged.filter((c) => {
      if (seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }, [genre]);

  const genreLabel = projectId ? genre : "General (no project selected)";

  return (
    <div className="min-h-screen bg-base text-ink">
      <StoryLabHeader />

      <BackToLanding
        title="Workshop Hub"
        rightSlot={
          <Link
            to="/story-lab"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-border hover:bg-white"
            title="Open StoryLab Landing"
          >
            StoryLab Landing
          </Link>
        }
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        <HeroBanner quoteHtml={quoteHtml} genreLabel={genreLabel} />

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Workshop Modules
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = iconMap[c.iconName] || BookOpen;
              return (
                <ModuleCard
                  key={c.key}
                  to={c.to}
                  title={c.title}
                  description={c.description}
                  Icon={Icon}
                />
              );
            })}
          </div>

          <div className="mt-4 text-xs text-muted">
            {projectId ? (
              <>Active Project: <span className="text-ink font-semibold">{projectId}</span></>
            ) : (
              <>Tip: Select a project/genre to unlock the right track.</>
            )}
          </div>
        </div>
      </div>

      <BackToLandingFab />
    </div>
  );
}
