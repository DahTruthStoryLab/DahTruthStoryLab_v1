/// src/components/storylab/StoryWorkshop.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Layers,
  Pin,
  Map as RouteIcon, // ✅ Lucide has no "Route" icon; alias Map -> RouteIcon
  ListChecks,
  ArrowLeft,
} from "lucide-react";

import BackToLanding, { BackToLandingFab } from "./BackToLanding";

export default function StoryWorkshop() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <BackToLanding title="Workshop Hub" />
      {/* existing content */}
      <BackToLandingFab />
    </div>
  );
}


/* ---------------------------------------------------------
   PageBanner (enhanced aesthetic)
--------------------------------------------------------- */
const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.12)] overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        {/* Content */}
        <div className="relative z-10">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5 shadow-sm">
            <BookOpen size={14} className="mr-2 text-ink/70" />
            <span className="text-xs font-semibold tracking-wide text-ink/80">
              DahTruth · StoryLab
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">
            Modules &amp; Sessions
          </h1>
          <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">
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
    className="rounded-2xl border border-white/50 bg-white/70 backdrop-blur-xl p-5 hover:bg-white/90 transition shadow-sm hover:shadow"
  >
    <div className="flex items-start gap-3">
      <div className="rounded-xl border border-white/60 bg-white/60 p-3">
        <Icon className="h-6 w-6 text-ink/80" />
      </div>
      <div>
        <div className="text-lg font-semibold text-ink">{title}</div>
        <div className="text-sm text-ink/70">{description}</div>
      </div>
    </div>
  </Link>
);

/* ---------------------------------------------------------
   Workshop Hub (launcher for separate modules)
--------------------------------------------------------- */
export default function StoryWorkshop() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Back to StoryLab */}
        <button
          onClick={() => navigate("/story-lab")}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to StoryLab
        </button>

        <PageBanner />

        {/* Workshop Modules */}
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink/60 mb-2">
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
    </div>
  );
}
