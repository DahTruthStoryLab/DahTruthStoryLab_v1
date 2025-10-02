// src/components/storylab/HopesFearsLegacy.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields } from "../../lib/storylab/projectStore";
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
          <Heart size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Hopes • Fears • Legacy</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          Clarify the inner engine of your main cast. Auto-saves as you type.
        </p>
      </div>
    </div>
  </div>
);

/* ---------------------------
   Small “Saving…” indicator
---------------------------- */
function SavingBadge({ state }) {
  const map = {
    idle: { text: "Saved", cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    saving: { text: "Saving…", cls: "text-primary bg-white border-border" },
  };
  const m = map[state] || map.idle;
  return (
    <span className={`text-xs px-2 py-1 rounded-md border ${m.cls}`}>{m.text}</span>
  );
}

/* ------------------------------------------------
   HopesFearsLegacy (single export — no duplicates)
------------------------------------------------- */
export default function HopesFearsLegacy() {
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));

  const DEFAULT = {
    mc: { hopes: "", fears: "", legacy: "" },
    protagonist: { hopes: "", fears: "", legacy: "" },
    antagonist: { hopes: "", fears: "", legacy: "" },
  };

  // Local working copy
  const [hfl, setHfl] = useState(() => ({ ...DEFAULT, ...(project.hfl || {}) }));
  const [saving, setSaving] = useState("idle"); // "idle" | "saving"

  // Helper to persist to shared store
  const commit = (next) => {
    const copy = JSON.parse(JSON.stringify(project));
    copy.hfl = next;
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try { window.dispatchEvent(new Event("project:change")); } catch {}
  };

  // Debounced auto-save
  useEffect(() => {
    setSaving("saving");
    const id = setTimeout(() => {
      commit(hfl);
      setSaving("idle");
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hfl]);

  // Field change
  const edit = (role, field, value) =>
    setHfl((prev) => ({ ...prev, [role]: { ...prev[role], [field]: value } }));

  // Manual save (optional)
  const saveNow = () => {
    setSaving("saving");
    commit(hfl);
    setSaving("idle");
  };

  const RoleCard = ({ roleKey, label }) => {
    const data = hfl[roleKey] || { hopes: "", fears: "", legacy: "" };
    return (
      <div className="rounded-2xl border border-border bg-white/80 backdrop-blur-xl p-4 shadow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-ink">{label}</h3>
          <SavingBadge state={saving} />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col">
            <label className="text-xs text-muted mb-1">Hopes</label>
            <textarea
              value={data.hopes}
              onChange={(e) => edit(roleKey, "hopes", e.target.value)}
              placeholder="What are they reaching for — in this chapter, and in life?"
              className="min-h-[120px] rounded-lg border border-border bg-white p-3 text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted mb-1">Fears</label>
            <textarea
              value={data.fears}
              onChange={(e) => edit(roleKey, "fears", e.target.value)}
              placeholder="What would they avoid at any cost? What’s the wound?"
              className="min-h-[120px] rounded-lg border border-border bg-white p-3 text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-muted mb-1">Legacy</label>
            <textarea
              value={data.legacy}
              onChange={(e) => edit(roleKey, "legacy", e.target.value)}
              placeholder="If they win (or fail), what is left behind in the world of the story?"
              className="min-h-[120px] rounded-lg border border-border bg-white p-3 text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to Workshop Hub */}
      <BackToLanding
        title="Hopes • Fears • Legacy"
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

        {/* Roles grid */}
        <div className="space-y-6">
          <RoleCard roleKey="mc" label="Main Character (MC)" />
          <RoleCard roleKey="protagonist" label="Protagonist" />
          <RoleCard roleKey="antagonist" label="Antagonist" />
        </div>

        {/* Actions row */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted">
            Tip: keep these short and concrete. They’ll power prompts and the Character Roadmap.
          </p>
          <button
            onClick={saveNow}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium bg-white/70 border border-border hover:bg-white"
          >
            Save now
          </button>
        </div>
      </div>

      {/* Mobile “Back to Landing” button */}
      <BackToLandingFab />
    </div>
  );
}
