// src/components/storylab/fiction/StoryArchitecture.jsx
// Story Architecture module — defines how the story moves, breathes, and pulls forward.
// Includes chapter purpose, pacing, transition engine, and the Dostoevsky pull-forward effect.

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Layout, Save, ChevronDown, ChevronUp } from "lucide-react";

const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";
const ARCHITECTURE_KEY = (projectId) => `dahtruth_architecture_${projectId}`;

const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
};

const CHAPTER_ENDING_TYPES = [
  { value: "", label: "Select ending type..." },
  { value: "cliffhanger", label: "Cliffhanger — action or danger left unresolved" },
  { value: "revelation", label: "Revelation — something hidden comes to light" },
  { value: "emotional-shift", label: "Emotional Shift — the character's inner state changes" },
  { value: "question", label: "Question — the reader is left wondering" },
  { value: "decision", label: "Decision — the character commits to an action" },
  { value: "irony", label: "Ironic Turn — what happens is the opposite of what was hoped" },
  { value: "arrival", label: "Arrival — someone or something enters the story" },
  { value: "departure", label: "Departure — someone or something is lost" },
];

const PACING_OPTIONS = [
  { value: "", label: "Select pacing..." },
  { value: "slow-burn", label: "Slow burn — deliberate, atmospheric, building tension" },
  { value: "moderate", label: "Moderate — balanced movement and reflection" },
  { value: "propulsive", label: "Propulsive — fast, urgent, forward-driving" },
  { value: "fragmented", label: "Fragmented — discontinuous, memory-driven, layered" },
];

// ─── Storage Helpers ───────────────────────────────────────────────────────────

function getArchitecture(projectId) {
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(ARCHITECTURE_KEY(projectId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveArchitecture(projectId, data) {
  if (!projectId) return;
  localStorage.setItem(ARCHITECTURE_KEY(projectId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("architecture:change", { detail: { projectId } }));
}

function createEmptyChapterPlan() {
  return {
    id: `chplan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    chapterTitle: "",
    purpose: "",
    whatChanges: "",
    whoIsAffected: "",
    whatIsRevealed: "",
    endingType: "",
    bridgeToNext: "",
    pacingNote: "",
    notes: "",
  };
}

function createEmptyArchitecture() {
  return {
    storyStructure: "",
    povType: "",
    timelineType: "",
    overallPacing: "",
    centralTheme: "",
    openingImage: "",
    closingImage: "",
    chapterPlans: [],
    notes: "",
    updatedAt: Date.now(),
  };
}

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

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SectionLabel({ label }) {
  return (
    <div
      className="text-xs font-bold uppercase tracking-widest mb-3 pb-1 border-b border-slate-100"
      style={{ color: BRAND.gold }}
    >
      {label}
    </div>
  );
}

// ─── Chapter Plan Card ─────────────────────────────────────────────────────────

function ChapterPlanCard({ plan, index, onChange, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{ borderColor: expanded ? BRAND.gold + "40" : "#e2e8f0" }}
    >
      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: expanded ? `${BRAND.navy}04` : "white" }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}
          >
            {index + 1}
          </span>
          <div>
            <div className="font-semibold text-sm" style={{ color: BRAND.navy }}>
              {plan.chapterTitle || `Chapter ${index + 1}`}
            </div>
            {plan.endingType && (
              <div className="text-[11px] text-slate-400">
                Ends with: {CHAPTER_ENDING_TYPES.find((t) => t.value === plan.endingType)?.label?.split(" — ")[0] || plan.endingType}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete Chapter ${index + 1} plan?`)) onDelete();
            }}
            className="text-red-400 hover:text-red-600 p-1 rounded"
            title="Delete chapter plan"
          >
            <Trash2 size={13} />
          </button>
          {expanded ? (
            <ChevronUp size={16} className="text-slate-400" />
          ) : (
            <ChevronDown size={16} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 space-y-4 border-t border-slate-100">
          <Field
            label="Chapter Title"
            value={plan.chapterTitle}
            onChange={(v) => onChange("chapterTitle", v)}
            placeholder="The Wake of Daisy"
          />

          <div className="grid grid-cols-2 gap-4">
            <TextArea
              label="Purpose of this chapter"
              value={plan.purpose}
              onChange={(v) => onChange("purpose", v)}
              placeholder="What must this chapter accomplish in the story?"
            />
            <TextArea
              label="What changes by the end?"
              value={plan.whatChanges}
              onChange={(v) => onChange("whatChanges", v)}
              placeholder="Something must shift — in the world or in the character."
            />
            <TextArea
              label="Who is affected?"
              value={plan.whoIsAffected}
              onChange={(v) => onChange("whoIsAffected", v)}
              placeholder="Which characters carry the weight of this chapter?"
            />
            <TextArea
              label="What is revealed?"
              value={plan.whatIsRevealed}
              onChange={(v) => onChange("whatIsRevealed", v)}
              placeholder="Information, truth, or character the reader learns here."
            />
          </div>

          {/* Transition Engine — the Dostoevsky pull */}
          <div
            className="rounded-xl p-4 space-y-4"
            style={{ background: `${BRAND.navy}04`, border: `1px solid ${BRAND.navy}10` }}
          >
            <div>
              <div
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: BRAND.navy }}
              >
                Transition Engine
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Dostoevsky ended chapters by pulling the reader into the next moment before
                they could stop. Define how this chapter ends and what it opens.
              </p>
            </div>

            <SelectField
              label="How does this chapter end?"
              value={plan.endingType}
              onChange={(v) => onChange("endingType", v)}
              options={CHAPTER_ENDING_TYPES}
            />

            <TextArea
              label="What pulls the reader into the next chapter?"
              value={plan.bridgeToNext}
              onChange={(v) => onChange("bridgeToNext", v)}
              placeholder="The last image, question, or action that makes stopping impossible."
              rows={3}
            />

            <SelectField
              label="Pacing of this chapter"
              value={plan.pacingNote}
              onChange={(v) => onChange("pacingNote", v)}
              options={PACING_OPTIONS}
            />
          </div>

          <TextArea
            label="Notes"
            value={plan.notes}
            onChange={(v) => onChange("notes", v)}
            placeholder="Anything else — images, symbols, lines you want to land here."
          />
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StoryArchitecture() {
  const [projectId, setProjectId] = useState("");
  const [arch, setArch] = useState(createEmptyArchitecture());
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    const pid = localStorage.getItem(CURRENT_PROJECT_KEY) || "";
    setProjectId(pid);
    if (pid) {
      const existing = getArchitecture(pid);
      if (existing) setArch(existing);
    }
  }, []);

  function handleChange(field, value) {
    setArch((prev) => ({ ...prev, [field]: value }));
    setSaveStatus("idle");
  }

  function handleSave() {
    if (!projectId) return;
    setSaveStatus("saving");
    saveArchitecture(projectId, { ...arch, updatedAt: Date.now() });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function addChapterPlan() {
    const newPlan = createEmptyChapterPlan();
    setArch((prev) => ({
      ...prev,
      chapterPlans: [...(prev.chapterPlans || []), newPlan],
    }));
    setSaveStatus("idle");
  }

  function updateChapterPlan(index, field, value) {
    setArch((prev) => {
      const plans = [...(prev.chapterPlans || [])];
      plans[index] = { ...plans[index], [field]: value };
      return { ...prev, chapterPlans: plans };
    });
    setSaveStatus("idle");
  }

  function deleteChapterPlan(index) {
    setArch((prev) => {
      const plans = [...(prev.chapterPlans || [])];
      plans.splice(index, 1);
      return { ...prev, chapterPlans: plans };
    });
    setSaveStatus("idle");
  }

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
            background: `linear-gradient(135deg, #1a1a2e 0%, ${BRAND.navy} 40%, #6b4c8a 100%)`,
          }}
        >
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.rose, filter: "blur(80px)" }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #6b4c8a, #4c3a6b)" }}
            >
              <Layout size={28} className="text-white" />
            </div>
            <div>
              <h1
                className="text-3xl font-bold text-white"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                Story Architecture
              </h1>
              <p className="text-white/75 mt-1">
                Define how your story moves, breathes, and pulls the reader forward.
              </p>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
          >
            <Save size={15} />
            {saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "saved"
              ? "Saved ✓"
              : "Save Architecture"}
          </button>
        </div>

        <div className="space-y-6">

          {/* Story Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <SectionLabel label="Story Flow" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Story Structure
                </div>
                <select
                  value={arch.storyStructure || ""}
                  onChange={(e) => handleChange("storyStructure", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  <option value="">Select structure...</option>
                  <option value="linear">Linear — events unfold in order</option>
                  <option value="nonlinear">Nonlinear — time shifts, memory-driven</option>
                  <option value="circular">Circular — ends where it began</option>
                  <option value="parallel">Parallel — multiple storylines running together</option>
                  <option value="braided">Braided — timelines that intersect</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Point of View
                </div>
                <select
                  value={arch.povType || ""}
                  onChange={(e) => handleChange("povType", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  <option value="">Select POV...</option>
                  <option value="first-single">First person — single narrator</option>
                  <option value="first-multiple">First person — multiple narrators</option>
                  <option value="third-limited">Third person limited — one character's interior</option>
                  <option value="third-omniscient">Third person omniscient — all-knowing narrator</option>
                  <option value="second">Second person — you</option>
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Timeline
                </div>
                <select
                  value={arch.timelineType || ""}
                  onChange={(e) => handleChange("timelineType", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                >
                  <option value="">Select timeline...</option>
                  <option value="single">Single continuous timeline</option>
                  <option value="flashbacks">Present with flashbacks</option>
                  <option value="dual">Dual timeline — past and present alternating</option>
                  <option value="fragmented">Fragmented — non-sequential scenes</option>
                </select>
              </div>

              <SelectField
                label="Overall Pacing"
                value={arch.overallPacing}
                onChange={(v) => handleChange("overallPacing", v)}
                options={PACING_OPTIONS}
              />
            </div>
          </div>

          {/* Thematic Architecture */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <SectionLabel label="Thematic Architecture" />
            <div className="grid grid-cols-2 gap-4">
              <TextArea
                label="Central Theme"
                value={arch.centralTheme}
                onChange={(v) => handleChange("centralTheme", v)}
                placeholder="The one truth this story is telling."
                rows={3}
              />
              <TextArea
                label="Opening Image"
                value={arch.openingImage}
                onChange={(v) => handleChange("openingImage", v)}
                placeholder="The first image or moment that sets the world's tone."
                rows={3}
              />
              <TextArea
                label="Closing Image"
                value={arch.closingImage}
                onChange={(v) => handleChange("closingImage", v)}
                placeholder="The final image — how has the world changed?"
                rows={3}
              />
              <TextArea
                label="Architecture Notes"
                value={arch.notes}
                onChange={(v) => handleChange("notes", v)}
                placeholder="Anything else about how this story is built."
                rows={3}
              />
            </div>
          </div>

          {/* Chapter Plan Engine */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <SectionLabel label="Chapter Architecture — Transition Engine" />
            </div>

            <div
              className="rounded-xl p-4 mb-5 text-xs text-slate-600 border"
              style={{ background: `${BRAND.navy}03`, borderColor: `${BRAND.navy}10` }}
            >
              <span className="font-semibold" style={{ color: BRAND.navy }}>
                The Dostoevsky Principle.
              </span>{" "}
              Dostoevsky ended his chapters not with resolution but with pull — a question, a
              revelation, a moment of decision that made stopping impossible. Plan each chapter's
              ending and its bridge into the next. This is where readers are made or lost.
            </div>

            <div className="space-y-3">
              {(arch.chapterPlans || []).map((plan, index) => (
                <ChapterPlanCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  onChange={(field, value) => updateChapterPlan(index, field, value)}
                  onDelete={() => deleteChapterPlan(index)}
                />
              ))}
            </div>

            <button
              onClick={addChapterPlan}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border-2 border-dashed transition-all hover:border-amber-300 hover:bg-amber-50"
              style={{ borderColor: "#e2e8f0", color: BRAND.navy }}
            >
              <Plus size={16} />
              Add Chapter Plan
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
