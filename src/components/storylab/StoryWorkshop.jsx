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

// If you already have these, you can remove the inline versions below
import BackToLanding, { BackToLandingFab } from "./BackToLanding";

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
const HeroBanner = ({ quoteHtml }) => {
  const cleaned = useMemo(() => stripHtml(quoteHtml), [quoteHtml]);
  const quote = cleaned && cleaned !== "”" && cleaned !== "“" ? cleaned : "";

  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-8 text-center shadow overflow-hidden">
        {/* Subtle gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink">
            Welcome to your Story Journey
          </h1>
          <p className="mt-3 text-muted max-w-2xl mx-auto">
            Choose a path to begin. Each module is a step—prompts, roadmaps, priorities,
            and character views—designed to move your story forward with clarity and flow.
          </p>

          {/* Quote under the banner */}
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
  // If your quote comes from editor state, wire it in here.
  // For now, pass "" to avoid gibberish.
  const quoteHtml = "";

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* StoryLab-only header (centered), not the dashboard header */}
      <StoryLabHeader />

      {/* Optional global back to StoryLab landing (keep if you use it elsewhere) */}
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
        {/* New hero banner + quote */}
        <HeroBanner quoteHtml={quoteHtml} />

        {/* Modules */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Workshop Modules
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ModuleCard
              to="/story-lab/workshop/priorities"
              title="Priority Cards"
              description="Brainstorm and organize what matters most."
              Icon={ListChecks}
            />
            <ModuleCard
              to="/story-lab/workshop/roadmap"
              title="Character Roadmap"
              description="Map progression of your main characters."
              Icon={RouteIcon}
            />
            <ModuleCard
              to="/story-lab/workshop/clothesline"
              title="Clothesline"
              description="An org-style, visual cast-at-a-glance."
              Icon={Pin}
            />
            <ModuleCard
              to="/story-lab/workshop/hfl"
              title="Hopes • Fears • Legacy"
              description="Theme motivators by major characters."
              Icon={Layers}
            />
            {/* NEW: Narrative Arc module */}
            <ModuleCard
              to="/story-lab/narrative-arc"
              title="Narrative Arc"
              description="Map emotional beats and structure."
              Icon={Sparkles}
            />
          </div>
        </div>
      </div>

      {/* Mobile floating “Back to Landing” button (optional) */}
      <BackToLandingFab />
    </div>
  );
}
