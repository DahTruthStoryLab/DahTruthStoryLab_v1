// src/components/storylab/StoryWorkshop.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import { storage } from "../../lib/storage";

// ✅ Cards + genre mapping live here
import {
  normalizeGenre,
  WORKSHOP_CARDS_BY_GENRE,
} from "../../lib/storyWorkshopCards";

/* --------------------------------------------
   Simple Dark Toggle (keep yours if you want)
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
        <div className="relative z-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink">
            Workshop Hub
          </h1>
          <p className="mt-3 text-muted max-w-2xl mx-auto">
            Your modules adjust based on your project genre.
          </p>

          <div className="mt-6 glass-panel px-4 py-4 rounded-2xl">
            <div className="text-sm font-semibold text-muted mb-1">
              Featured Line
            </div>
            {quote ? (
              <blockquote className="text-lg md:text-xl text-ink italic">
                “{quote}”
              </blockquote>
            ) : (
              <p className="text-muted">
                Add your first scene or quote to see it featured here.
              </p>
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
   StoryLab Header
--------------------------------------------- */
function StoryLabHeader({ trackLabel }) {
  const navigate = useNavigate();
  return (
    <header className="border-b bg-white/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex-1" />
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold text-ink">StoryLab</h1>
          <div className="text-xs text-muted mt-0.5">
            Track: <span className="font-semibold">{trackLabel}</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end gap-2">
          <button
            onClick={() => navigate("/")}
            className="px-3 py-2 rounded-lg bg-brand-gold text-white hover:opacity-90"
            title="Back to Dashboard"
          >
            ← Dashboard
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
  const [track, setTrack] = useState("General");

  // If your quote comes from editor state, wire it in here.
  const quoteHtml = "";

  // ✅ ICON MAP — must include every iconName used in storyWorkshopCards.js
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

  // ✅ Sync track from storage/current project
  useEffect(() => {
    const sync = () => {
      try {
        // 1) Prefer currentStory.primaryGenre (fastest + most reliable)
        const csRaw = storage.getItem("currentStory");
        if (csRaw) {
          const cs = JSON.parse(csRaw);
          const g = cs?.primaryGenre || cs?.genre || "";
          setTrack(normalizeGenre(g));
          return;
        }

        // 2) Fallback: read current project id and its stored project data
        const projectId = storage.getItem("dahtruth-current-project-id");
        if (projectId) {
          const raw = storage.getItem(`dahtruth-project-${projectId}`);
          if (raw) {
            const data = JSON.parse(raw);
            const g = data?.primaryGenre || data?.genre || "";
            setTrack(normalizeGenre(g));
            return;
          }
        }

        // 3) Default
        setTrack("General");
      } catch (e) {
        console.error("[StoryWorkshop] Failed to sync track:", e);
        setTrack("General");
      }
    };

    sync();

    // ✅ This is the part most people miss: re-sync when project/genre changes
    window.addEventListener("project:change", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // ✅ Step 4 goes right here: common + track-specific
  const cards = useMemo(() => {
    return [
      ...(WORKSHOP_CARDS_BY_GENRE.common || []),
      ...(WORKSHOP_CARDS_BY_GENRE[track] || []),
    ];
  }, [track]);

  return (
    <div className="min-h-screen bg-base text-ink">
      <StoryLabHeader trackLabel={track} />

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
        <HeroBanner quoteHtml={quoteHtml} />

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">
            Workshop Modules
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c) => {
              const Icon = iconMap[c.iconName] || BookOpen; // safe fallback
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
        </div>
      </div>

      <BackToLandingFab />
    </div>
  );
}
