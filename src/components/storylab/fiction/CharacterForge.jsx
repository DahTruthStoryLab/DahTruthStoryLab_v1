// src/components/storylab/fiction/CharacterForge.jsx
// Character creation module — the source of truth for all characters in a project.
// Writers build characters here first; the writing studio then references them.

import React, { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, User, Save, ChevronLeft } from "lucide-react";
import {
  createEmptyCharacter,
  getCharacters,
  upsertCharacter,
  deleteCharacter,
} from "../../../utils/storyCharacters";

const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";

const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
};

// ─── Field Components ──────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
      />
    </label>
  );
}

function TextArea({ label, value, onChange, placeholder = "", rows = 3 }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none"
      />
    </label>
  );
}

// ─── Character Card ────────────────────────────────────────────────────────────

function CharacterCard({ character, isSelected, onClick }) {
  const initials = (character.name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border transition-all duration-200 p-3 flex items-center gap-3"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${BRAND.navy}08, ${BRAND.gold}08)`
          : "white",
        borderColor: isSelected ? BRAND.gold : "#e2e8f0",
        boxShadow: isSelected ? `0 0 0 1px ${BRAND.gold}40` : "none",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{
          background: isSelected
            ? `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`
            : `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})`,
        }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-sm truncate" style={{ color: BRAND.navy }}>
          {character.name || "Untitled Character"}
        </div>
        <div className="text-xs text-slate-400 truncate">
          {character.role || "No role set"}
        </div>
      </div>
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CharacterForge() {
  const [projectId, setProjectId] = useState("");
  const [characters, setCharacters] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [form, setForm] = useState(createEmptyCharacter());
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved

  // Load project and characters on mount
  useEffect(() => {
    const pid = localStorage.getItem(CURRENT_PROJECT_KEY) || "";
    setProjectId(pid);
    if (pid) {
      const existing = getCharacters(pid);
      setCharacters(existing);
      if (existing.length) {
        setSelectedId(existing[0].id);
        setForm(existing[0]);
      } else {
        const empty = createEmptyCharacter();
        setSelectedId(empty.id);
        setForm(empty);
      }
    }
  }, []);

  // Listen for character changes from other modules
  useEffect(() => {
    function handleChange(e) {
      const pid = localStorage.getItem(CURRENT_PROJECT_KEY) || "";
      if (!pid) return;
      if (e.detail?.projectId && e.detail.projectId !== pid) return;
      const updated = getCharacters(pid);
      setCharacters(updated);
      if (selectedId) {
        const match = updated.find((c) => c.id === selectedId);
        if (match) setForm(match);
      }
    }
    window.addEventListener("characters:change", handleChange);
    return () => window.removeEventListener("characters:change", handleChange);
  }, [selectedId]);

  const selectedCharacter = useMemo(
    () => characters.find((c) => c.id === selectedId) || null,
    [characters, selectedId]
  );

  function handleCreateNew() {
    const empty = createEmptyCharacter();
    setSelectedId(empty.id);
    setForm(empty);
  }

  function handleSelect(character) {
    setSelectedId(character.id);
    setForm(character);
    setSaveStatus("idle");
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  }

  function handleSave() {
    if (!projectId) return;
    setSaveStatus("saving");
    const saved = upsertCharacter(projectId, form);
    const updated = getCharacters(projectId);
    setCharacters(updated);
    setSelectedId(saved.id);
    setForm(saved);
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function handleDelete() {
    if (!projectId || !selectedId) return;
    const label = form.name || "this character";
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;

    deleteCharacter(projectId, selectedId);
    const updated = getCharacters(projectId);
    setCharacters(updated);

    if (updated.length) {
      setSelectedId(updated[0].id);
      setForm(updated[0]);
    } else {
      const empty = createEmptyCharacter();
      setSelectedId(empty.id);
      setForm(empty);
    }
    setSaveStatus("idle");
  }

  const isExisting = characters.some((c) => c.id === selectedId);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(180deg, #fefdfb 0%, #f1f5f9 100%)" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero Banner */}
        <div
          className="rounded-3xl p-8 mb-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
          }}
        >
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(80px)" }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              <User size={28} className="text-white" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Character Forge
              </h1>
              <p className="text-white/75 mt-1">
                Build your characters here. Every other module reads from this.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">

          {/* Left: Character List */}
          <aside className="col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div
                className="px-4 py-3 flex items-center justify-between border-b border-slate-100"
                style={{ background: `${BRAND.navy}04` }}
              >
                <h2 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                  Characters ({characters.length})
                </h2>
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
                  title="Create a new character"
                >
                  <Plus size={14} />
                  New
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
                {characters.length === 0 ? (
                  <div className="text-center py-8 text-sm text-slate-400">
                    <User size={32} className="mx-auto mb-2 opacity-30" />
                    No characters yet.
                    <br />
                    Click New to create your first.
                  </div>
                ) : (
                  characters.map((c) => (
                    <CharacterCard
                      key={c.id}
                      character={c}
                      isSelected={selectedId === c.id}
                      onClick={() => handleSelect(c)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Tip */}
            <div
              className="mt-4 rounded-xl p-4 text-xs text-slate-600 border border-slate-200 bg-white/70"
            >
              <div className="font-semibold mb-1" style={{ color: BRAND.navy }}>
                How Character Forge works
              </div>
              Build each character fully here. Once saved, your characters become available
              in the Writing Studio, Hopes and Fears, Priority Cards, and the Character Roadmap.
              You never need to enter a name twice.
            </div>
          </aside>

          {/* Right: Form */}
          <section className="col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div
                className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
                style={{ background: `${BRAND.navy}04` }}
              >
                <div>
                  <h3 className="font-semibold" style={{ color: BRAND.navy }}>
                    {isExisting ? "Edit Character" : "New Character"}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isExisting
                      ? "Changes are not saved until you click Save Character."
                      : "Fill in what you know. You can always return to add more."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isExisting && (
                    <button
                      onClick={handleDelete}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete this character"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saveStatus === "saving"}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
                  >
                    <Save size={13} />
                    {saveStatus === "saving"
                      ? "Saving..."
                      : saveStatus === "saved"
                      ? "Saved ✓"
                      : "Save Character"}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Row 1: Identity */}
                <div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
                    style={{ color: BRAND.gold }}
                  >
                    Identity
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Field
                      label="Name"
                      value={form.name}
                      onChange={(v) => handleChange("name", v)}
                      placeholder="Daisy Knox"
                    />
                    <Field
                      label="Role in Story"
                      value={form.role}
                      onChange={(v) => handleChange("role", v)}
                      placeholder="Protagonist"
                    />
                    <Field
                      label="Age"
                      value={form.age}
                      onChange={(v) => handleChange("age", v)}
                      placeholder="34"
                    />
                  </div>
                </div>

                {/* Row 2: Presence */}
                <div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
                    style={{ color: BRAND.gold }}
                  >
                    Presence
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextArea
                      label="Physical Presence"
                      value={form.physicalPresence}
                      onChange={(v) => handleChange("physicalPresence", v)}
                      placeholder="How they enter a room. What people notice first."
                    />
                    <TextArea
                      label="Voice"
                      value={form.voice}
                      onChange={(v) => handleChange("voice", v)}
                      placeholder="How they speak — tone, pace, word choices."
                    />
                  </div>
                </div>

                {/* Row 3: Interior */}
                <div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
                    style={{ color: BRAND.gold }}
                  >
                    Interior Life
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextArea
                      label="Background"
                      value={form.background}
                      onChange={(v) => handleChange("background", v)}
                      placeholder="Where they come from. What shaped them."
                    />
                    <TextArea
                      label="Core Wound"
                      value={form.coreWound}
                      onChange={(v) => handleChange("coreWound", v)}
                      placeholder="The pain at the center of who they are."
                    />
                    <TextArea
                      label="Desire"
                      value={form.desire}
                      onChange={(v) => handleChange("desire", v)}
                      placeholder="What they want at the start of the story."
                    />
                    <TextArea
                      label="Lie They Believe"
                      value={form.lieTheyBelieve}
                      onChange={(v) => handleChange("lieTheyBelieve", v)}
                      placeholder="The false belief driving their choices."
                    />
                  </div>
                </div>

                {/* Row 4: Contradiction + Notes */}
                <div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
                    style={{ color: BRAND.gold }}
                  >
                    Complexity
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <TextArea
                      label="Internal Contradiction"
                      value={form.internalContradiction}
                      onChange={(v) => handleChange("internalContradiction", v)}
                      placeholder="The tension inside them that makes them real."
                    />
                    <TextArea
                      label="Notes"
                      value={form.notes}
                      onChange={(v) => handleChange("notes", v)}
                      placeholder="Anything else — quirks, symbols, relationships."
                    />
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
