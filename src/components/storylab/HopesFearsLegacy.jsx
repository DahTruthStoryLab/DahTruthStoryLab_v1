// src/components/storylab/HopesFearsLegacy.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Heart } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields } from "../../lib/storylab/projectStore";

import BackToLanding, { BackToLandingFab } from "./BackToLanding";

export default function HopesFearsLegacy() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <BackToLanding title="Hopes • Fears • Legacy" />
      {/* existing content */}
      <BackToLandingFab />
    </div>
  );
}

const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5">
          <Heart size={14} className="mr-2 text-ink/70" />
          <span className="text-xs font-semibold tracking-wide text-ink/80">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Hopes · Fears · Legacy</h1>
        <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">
          Focused view for your Main Character, Protagonist, and Antagonist.
        </p>
      </div>
    </div>
  </div>
);

export default function HopesFearsLegacy() {
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));
  const names = project.hfl.names;
  const notes = project.hfl.notes;

  const commit = (mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
  };

  const PersonBlock = ({ label, value, onChange }) => (
    <div className="rounded-xl border border-white/60 bg-white p-3">
      <div className="text-xs text-ink/60 mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-ink/70" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-b border-white/60 focus:border-violet-400 outline-none text-sm"
          placeholder={label}
        />
      </div>
    </div>
  );

  const Column = ({ title, value, onChange }) => (
    <div className="rounded-xl border border-white/60 bg-white/80 p-4">
      <div className="text-sm font-semibold mb-2">{title}</div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-28 rounded-lg border border-white/60 p-3 bg-white text-sm"
        placeholder={`Notes for ${title.toLowerCase()}…`}
      />
    </div>
  );

  const Trio = ({ whoKey, whoName }) => (
    <div className="rounded-2xl border border-white/60 bg-white/70 p-4">
      <div className="font-semibold mb-3">{whoName}</div>
      <div className="grid gap-3 md:grid-cols-3">
        <Column
          title="Hopes"
          value={notes[whoKey].hopes}
          onChange={(v) => commit(p => { p.hfl.notes[whoKey].hopes = v; })}
        />
        <Column
          title="Fears"
          value={notes[whoKey].fears}
          onChange={(v) => commit(p => { p.hfl.notes[whoKey].fears = v; })}
        />
        <Column
          title="Legacy"
          value={notes[whoKey].legacy}
          onChange={(v) => commit(p => { p.hfl.notes[whoKey].legacy = v; })}
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4">
          <Link to="/story-lab/workshop" className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm hover:bg-white backdrop-blur">
            <ArrowLeft className="h-4 w-4" /> Back to Workshop
          </Link>
        </div>

        <PageBanner />

        {/* Names row */}
        <div className="grid gap-3 md:grid-cols-3 mb-6">
          <PersonBlock
            label="Main Character"
            value={names.mainCharacter}
            onChange={(v) => commit(p => { p.hfl.names.mainCharacter = v; })}
          />
          <PersonBlock
            label="Protagonist"
            value={names.protagonist}
            onChange={(v) => commit(p => { p.hfl.names.protagonist = v; })}
          />
          <PersonBlock
            label="Antagonist"
            value={names.antagonist}
            onChange={(v) => commit(p => { p.hfl.names.antagonist = v; })}
          />
        </div>

        {/* H · F · L sections */}
        <div className="space-y-4">
          <Trio whoKey="main"        whoName={names.mainCharacter} />
          <Trio whoKey="protagonist" whoName={names.protagonist} />
          <Trio whoKey="antagonist"  whoName={names.antagonist} />
        </div>
      </div>
    </div>
  );
}
