// src/components/storylab/Clothesline.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Pin, Users } from "lucide-react";
import { loadProject, ensureWorkshopFields } from "../../lib/storylab/projectStore";

import BackToLanding, { BackToLandingFab } from "./BackToLanding";

/* ---------------------------
   Page banner (light/glass)
---------------------------- */
const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-4 py-1.5">
          <Pin size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Clothesline</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          Characters as pegged cards along a line — relationships at a glance.
        </p>
      </div>
    </div>
  </div>
);

/* ---------------------------
   Character card
---------------------------- */
function CharacterCard({ c }) {
  return (
    <div className="rounded-xl border border-border bg-white/80 p-3 shadow-sm min-w-[220px]">
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-border bg-white/70 p-1.5">
          <Users className="h-4 w-4 text-muted" />
        </div>
        <div className="font-semibold text-ink">{c.name}</div>
        <span className="ml-auto text-[10px] rounded-full px-2 py-0.5 border border-border bg-white">
          {c.role || "Role"}
        </span>
      </div>
      {c.rel && <div className="text-xs text-muted mt-1">{c.rel}</div>}
      <div className="flex flex-wrap gap-1 mt-2">
        {(c.traits || []).map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-white">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------
   Clothesline (single export — no duplicates)
------------------------------------------------- */
export default function Clothesline() {
  const [project] = useState(() => ensureWorkshopFields(loadProject()));
  const characters = Array.isArray(project.characters) ? project.characters : [];

  // simple demo geometry
  const width = 1000;
  const height = 160;
  const pathD = `M 20 ${height / 2} C ${width / 3} ${height / 2 - 40}, ${(2 * width) / 3} ${height / 2 + 40}, ${width - 20} ${height / 2}`;

  // positions for first 6 chars (fallback to 4 points)
  const anchors = [0.08, 0.28, 0.45, 0.62, 0.78, 0.88];

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to Workshop Hub */}
      <BackToLanding
        title="Clothesline"
        rightSlot={
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-border hover:bg-white"
            title="Open Workshop Hub"
          >
            Workshop Hub
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageBanner />

        <div
          className="rounded-2xl border border-border bg-white/70 backdrop-blur-xl p-4 overflow-x-auto"
          style={{ background: "linear-gradient(180deg, rgba(79,70,229,0.06), rgba(212,175,55,0.05))" }}
        >
          <div style={{ width }} className="relative">
            <svg width={width} height={height} className="block">
              <path d={pathD} fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" />
              {[0.15, 0.38, 0.62, 0.85].map((t, i) => {
                const x = 20 + t * (width - 40);
                const y = height / 2 + Math.sin(t * Math.PI * 2) * 18;
                return <circle key={i} cx={x} cy={y} r={4} fill="#D4AF37" />;
              })}
            </svg>

            <div className="absolute inset-0 pointer-events-none">
              {characters.slice(0, anchors.length).map((c, i) => (
                <div
                  key={c.id || `${c.name}-${i}`}
                  className="absolute pointer-events-auto"
                  style={{ left: `${anchors[i] * 100}%`, top: i % 2 ? "55%" : "12%" }}
                >
                  <CharacterCard c={c} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-sm text-muted mt-3">
          (This view reads from your shared <code>project.characters</code>.)
        </div>
      </div>

      {/* Mobile “Back to Landing” button */}
      <BackToLandingFab />
    </div>
  );
}
