import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import BrandLogo from "../BrandLogo"; // adjust if your BrandLogo path differs

/**
 * Sticky top bar with a Back → /story-lab and optional title.
 * Also exports a small-screen floating FAB.
 */
export default function BackToLanding({ title, rightSlot = null }) {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/story-lab")}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-ink hover:shadow"
            aria-label="Back to StoryLab"
          >
            <ChevronLeft className="size-4" />
            Landing
          </button>

        {/* Brand + crumb */}
          <Link to="/story-lab" className="hidden sm:flex items-center gap-2 ml-1">
            <BrandLogo className="h-5 w-auto" />
            <span className="font-semibold tracking-wide">
              <span className="text-primary">DahTruth</span> • StoryLab
            </span>
          </Link>

          {title && <span className="hidden sm:inline mx-2 text-muted">/</span>}
          {title && <h1 className="hidden sm:inline font-semibold text-ink">{title}</h1>}
        </div>

        <div className="flex items-center gap-2">{rightSlot}</div>
      </div>
    </div>
  );
}

export function BackToLandingFab() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/story-lab")}
      className="fixed bottom-4 left-4 md:hidden inline-flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-sm font-medium text-ink shadow"
      aria-label="Back to StoryLab"
    >
      <ChevronLeft className="size-4" />
      Landing
    </button>
  );
}
