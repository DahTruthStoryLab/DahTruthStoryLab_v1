/// src/components/storylab/StoryWorkshop.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Layers,
  Pin,
  Map as RouteIcon, // alias Map -> RouteIcon
  ListChecks,
} from "lucide-react";

import BackToLanding, { BackToLandingFab } from "./BackToLanding";

/* ---------------------------------------------------------
   PageBanner (light/glass, brand tokens)
--------------------------------------------------------- */
const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
        {/* Content */}
        <div className="relative z-10">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-4 py-1.5">
            <BookOpen size={14} className="mr-2 text-muted" />
            <span className="text-xs font-semibold tracking-wide text-muted">
              DahTruth · StoryLab
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">
            Modules &amp; Sessions
          </h1>
          <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
            Clear, colorful entry points into everything you'll use during the workshop.
          </p>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------
   Small module card
--------------------------------------------------------- */
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

/* ---------------------------------------------------------
   Workshop Hub (launcher for separate modules)
--------------------------------------------------------- */
export default function StoryWorkshop() {
  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to StoryLab Landing */}
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
        <PageBanner />

        {/* Workshop Modules */}
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
          </div>
        </div>
      </div>

      {/* Mobile floating “Back to Landing” button */}
      <BackToLandingFab />
    </div>
  );
}
