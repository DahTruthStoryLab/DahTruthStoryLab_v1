// src/components/storylab/fiction/WorldBuilder.jsx
// World and atmosphere building module — sets the living environment of the story.
// UPDATED: Now syncs to S3 via storyData.js for cross-device persistence

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Globe, Save, RefreshCw } from "lucide-react";
import { ExpandableTextArea } from "./WritingPad";
import {
  getWorlds,
  loadWorldsFromCloud,
  saveWorlds,
  createEmptyWorld,
  upsertWorld,
  deleteWorld,
} from "../../../utils/storyData";

const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";

const BRAND = {
  navy:      "#1e3a5f",
  navyLight: "#2d4a6f",
  gold:      "#d4af37",
  goldDark:  "#b8960c",
  mauve:     "#b8a9c9",
  rose:      "#e8b4b8",
};

// ─── Field Components ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
    </label>
  );
}

function SectionLabel({ label }) {
  return (
    <div className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
      style={{ color: BRAND.gold }}>{label}</div>
  );
}

// ─── World Card ────────────────────────────────────────────────────────────────

function WorldCard({ world, isSelected, onClick }) {
  return (
    <button onClick={onClick}
      className="w-full text-left rounded-xl border transition-all duration-200 p-3 flex items-center gap-3"
      style={{
        background:  isSelected ? `linear-gradient(135deg, ${BRAND.navy}08, ${BRAND.gold}08)` : "white",
        borderColor: isSelected ? BRAND.gold : "#e2e8f0",
        boxShadow:   isSelected ? `0 0 0 1px ${BRAND.gold}40` : "none",
      }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0"
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`
            : `linear-gradient(135deg, ${BRAND.navyLight}, ${BRAND.mauve})`,
        }}>
        <Globe size={16} className="text-white" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: BRAND.navy }}>
          {world.name || "Untitled World"}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {world.timePeriod || "No time period set"}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function WorldBuilder() {
  const [projectId, setProjectId] = useState(() => {
  const params = new URLSearchParams(window.location.search);
  const pid = params.get("projectId") || localStorage.getItem("dahtruth-current-project-id") || "";
  if (pid) localStorage.setItem("dahtruth-current-project-id", pid);
  return pid;
});
  const [worlds, setWorlds]             = useState([]);
  const [selectedId, setSelectedId]     = useState("");
  const [form, setForm]                 = useState(createEmptyWorld());
  const [saveStatus, setSaveStatus]     = useState("idle");
  const [cloudLoading, setCloudLoading] = useState(true);

  useEffect(() => {
    const pid = localStorage.getItem(CURRENT_PROJECT_KEY) || "";
    setProjectId(pid);

    if (!pid) { setCloudLoading(false); return; }

    // Load local first (instant)
    const local = getWorlds(pid);
    if (local.length) {
      setWorlds(local);
      setSelectedId(local[0].id);
      setForm(local[0]);
    } else {
      const empty = createEmptyWorld();
      setSelectedId(empty.id);
      setForm(empty);
    }

    // Then sync from cloud
    loadWorldsFromCloud(pid).then((cloudData) => {
      if (cloudData && cloudData.length) {
        setWorlds(cloudData);
        setSelectedId((prev) => {
          const stillExists = cloudData.find((w) => w.id === prev);
          if (stillExists) { setForm(stillExists); return prev; }
          setForm(cloudData[0]);
          return cloudData[0].id;
        });
      }
      setCloudLoading(false);
    });
  }, []);

  useEffect(() => {
    function handleChange(e) {
      const pid = localStorage.getItem(CURRENT_PROJECT_KEY) || "";
      if (!pid) return;
      if (e.detail?.projectId && e.detail.projectId !== pid) return;
      const updated = getWorlds(pid);
      setWorlds(updated);
      if (selectedId) {
        const match = updated.find((w) => w.id === selectedId);
        if (match) setForm(match);
      }
    }
    window.addEventListener("worlds:change", handleChange);
    return () => window.removeEventListener("worlds:change", handleChange);
  }, [selectedId]);

  function handleCreateNew() {
    const empty = createEmptyWorld();
    setSelectedId(empty.id);
    setForm(empty);
    setSaveStatus("idle");
  }

  function handleSelect(world) {
    setSelectedId(world.id);
    setForm(world);
    setSaveStatus("idle");
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  }

  function handleSave() {
    if (!projectId) {
      alert("No project is open. Please open a project in Compose first.");
      return;
    }
    setSaveStatus("saving");
    const saved = upsertWorld(projectId, form);
    const updated = getWorlds(projectId);
    setWorlds(updated);
    setSelectedId(saved.id);
    setForm(saved);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function handleDelete() {
    if (!projectId || !selectedId) return;
    const label = form.name || "this world";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    deleteWorld(projectId, selectedId);
    const updated = getWorlds(projectId);
    setWorlds(updated);
    if (updated.length) {
      setSelectedId(updated[0].id);
      setForm(updated[0]);
    } else {
      const empty = createEmptyWorld();
      setSelectedId(empty.id);
      setForm(empty);
    }
    setSaveStatus("idle");
  }

  const isExisting = worlds.some((w) => w.id === selectedId);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #fefdfb 0%, #f1f5f9 100%)" }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero Banner */}
        <div className="rounded-3xl p-8 mb-8 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${BRAND.navyLight} 0%, #2a5298 40%, ${BRAND.mauve} 100%)` }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(80px)" }} />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.mauve}, #7c6fa0)` }}>
              <Globe size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                World Builder
              </h1>
              <p className="text-white/75 mt-1">Make your story's setting a living, breathing thing.</p>
            </div>
          </div>
          {cloudLoading && (
            <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/70"
              style={{ background: "rgba(255,255,255,0.1)" }}>
              <RefreshCw size={12} className="animate-spin" />
              Syncing from cloud...
            </div>
          )}
        </div>

        {/* No project warning */}
        {!projectId && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
            style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: BRAND.navy }}>
            <Globe size={16} style={{ color: BRAND.goldDark }} />
            No project is open. Open a project in <strong className="mx-1">Compose</strong> first so your world is linked to the correct manuscript.
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left: World List */}
          <aside className="col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100"
                style={{ background: `${BRAND.navy}04` }}>
                <h2 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                  Worlds / Settings ({worlds.length})
                </h2>
                <button onClick={handleCreateNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                  <Plus size={14} />
                  New
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {worlds.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">
                    <Globe size={32} className="mx-auto mb-2 opacity-30" />
                    No worlds yet.
                    <br />
                    Click New to build your first setting.
                  </div>
                ) : (
                  worlds.map((w) => (
                    <WorldCard key={w.id} world={w} isSelected={selectedId === w.id} onClick={() => handleSelect(w)} />
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl p-4 text-xs text-slate-600 border border-slate-200 bg-white/70">
              <div className="font-semibold mb-1" style={{ color: BRAND.navy }}>How World Builder works</div>
              A story's setting is not just a backdrop — it has a personality. Build the sensory details,
              social climate, and moral logic of your world here. Your writing will feel grounded and
              specific from the first sentence.
              <div className="mt-2 pt-2 border-t border-slate-100 text-slate-400">
                Worlds sync across all your devices automatically.
              </div>
            </div>
          </aside>

          {/* Right: Form */}
          <section className="col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
                style={{ background: `${BRAND.navy}04` }}>
                <div>
                  <h3 className="font-semibold" style={{ color: BRAND.navy }}>
                    {isExisting ? "Edit World" : "New World"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Fill in what you know. You can always return to add more.</p>
                </div>
                <div className="flex items-center gap-2">
                  {isExisting && (
                    <button onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                  <button onClick={handleSave} disabled={saveStatus === "saving"}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                    <Save size={13} />
                    {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : "Save World"}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* Location */}
                <div>
                  <SectionLabel label="Location" />
                  <div className="grid grid-cols-3 gap-4">
                    <Field label="World / Setting Name" value={form.name} onChange={(v) => handleChange("name", v)} placeholder="South Philadelphia, 1987" />
                    <Field label="Time Period" value={form.timePeriod} onChange={(v) => handleChange("timePeriod", v)} placeholder="Present day, post-war, etc." />
                    <Field label="Location Type" value={form.locationType} onChange={(v) => handleChange("locationType", v)} placeholder="Urban neighborhood, rural town..." />
                  </div>
                </div>

                {/* Sensory Details */}
                <div>
                  <SectionLabel label="Sensory Details" />
                  <p className="text-xs text-slate-400 mb-3">Readers experience place through the senses. Be specific.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <ExpandableTextArea label="What it looks like" value={form.sightDetails} onChange={(v) => handleChange("sightDetails", v)} placeholder="Row houses, broken streetlights, church steeples..." />
                    <ExpandableTextArea label="What it sounds like" value={form.soundDetails} onChange={(v) => handleChange("soundDetails", v)} placeholder="Gospel through open windows, traffic, voices..." />
                    <ExpandableTextArea label="What it smells like" value={form.smellDetails} onChange={(v) => handleChange("smellDetails", v)} placeholder="Frying fish, cut grass, summer heat on asphalt..." />
                    <ExpandableTextArea label="What it feels like" value={form.feelDetails} onChange={(v) => handleChange("feelDetails", v)} placeholder="Heavy air, cold linoleum, worn wooden pews..." />
                  </div>
                </div>

                {/* Social and Moral Climate */}
                <div>
                  <SectionLabel label="Social and Moral Climate" />
                  <div className="grid grid-cols-2 gap-4">
                    <ExpandableTextArea label="Social Environment" value={form.socialClimate} onChange={(v) => handleChange("socialClimate", v)} placeholder="Working class, deeply religious, politically charged..." />
                    <ExpandableTextArea label="Cultural Tone" value={form.culturalTone} onChange={(v) => handleChange("culturalTone", v)} placeholder="Hopeful but tired, tense, quietly grieving, rising..." />
                    <ExpandableTextArea label="What this world rewards" value={form.whatWorldRewards} onChange={(v) => handleChange("whatWorldRewards", v)} placeholder="Silence, loyalty, endurance, performance of faith..." />
                    <ExpandableTextArea label="What this world punishes" value={form.whatWorldPunishes} onChange={(v) => handleChange("whatWorldPunishes", v)} placeholder="Ambition, speaking truth, leaving, being different..." />
                  </div>
                </div>

                {/* Character and World */}
                <div>
                  <SectionLabel label="Character and World" />
                  <div className="grid grid-cols-2 gap-4">
                    <ExpandableTextArea label="How does this world treat your main character?" value={form.howWorldTreatsCharacter} onChange={(v) => handleChange("howWorldTreatsCharacter", v)} placeholder="It ignores her, traps him, welcomes and then betrays..." rows={4} />
                    <ExpandableTextArea label="Notes" value={form.notes} onChange={(v) => handleChange("notes", v)} placeholder="Anything else — history of the place, key landmarks, mood..." rows={4} />
                  </div>
                </div>

              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
