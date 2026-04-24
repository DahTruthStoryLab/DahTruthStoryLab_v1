// src/components/storylab/SendToManuscript.jsx
// Shared modal — lets writers send module content to their manuscript (Compose page)
// Used by Essay Builder, Craft Lab, Memoir Scene Map, and any other module
//
// Usage:
//   <SendToManuscript
//     isOpen={showSend}
//     onClose={() => setShowSend(false)}
//     writerText="the text they typed"
//     aiFeedback="the AI response"
//     sourceLabel="Essay Builder"
//   />

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, BookOpen, Plus, ArrowRight, Check, X, FileText, Sparkles, Layers } from "lucide-react";
import { storage } from "../../lib/storage";
import { getSelectedProjectId } from "../../lib/projectsSync";

const BRAND = {
  navy:     "#1e3a5f",
  gold:     "#d4af37",
  goldDark: "#b8960c",
  mauve:    "#b8a9c9",
};

// ── Read current project chapters from localStorage ───
function loadCurrentChapters() {
  try {
    const projectId = getSelectedProjectId() || "unknown";
    const keys = [
      `dahtruth-story-lab-toc-v3-${projectId}`,
      `dahtruth-story-lab-toc-v3`,
    ];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.chapters || [];
      }
    }
  } catch { }
  return [];
}

// ── Save a new chapter to localStorage ───────────────
function saveNewChapter({ title, content }) {
  try {
    const projectId = getSelectedProjectId() || "unknown";
    const storageKey = `dahtruth-story-lab-toc-v3-${projectId}`;
    const fallbackKey = `dahtruth-story-lab-toc-v3`;

    let raw = storage.getItem(storageKey) || storage.getItem(fallbackKey);
    let data = raw ? JSON.parse(raw) : { chapters: [] };
    if (!Array.isArray(data.chapters)) data.chapters = [];

    const newChapter = {
      id:        `ch_${Date.now()}`,
      title:     title || "Untitled",
      content:   `<p>${content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`,
      preview:   content.slice(0, 80) + (content.length > 80 ? "..." : ""),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.chapters.push(newChapter);
    storage.setItem(storageKey, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (err) {
    console.error("[SendToManuscript] Failed to save chapter:", err);
    return false;
  }
}

// ── Append content to an existing chapter ────────────
function appendToChapter({ chapterId, content }) {
  try {
    const projectId = getSelectedProjectId() || "unknown";
    const storageKey = `dahtruth-story-lab-toc-v3-${projectId}`;
    const fallbackKey = `dahtruth-story-lab-toc-v3`;

    let raw = storage.getItem(storageKey) || storage.getItem(fallbackKey);
    if (!raw) return false;

    let data = JSON.parse(raw);
    if (!Array.isArray(data.chapters)) return false;

    const appendHtml = `<p><br/></p><p><strong>— From StoryLab —</strong></p><p>${
      content.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")
    }</p>`;

    data.chapters = data.chapters.map(ch =>
      ch.id === chapterId
        ? { ...ch, content: (ch.content || "") + appendHtml, updatedAt: new Date().toISOString() }
        : ch
    );

    storage.setItem(storageKey, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (err) {
    console.error("[SendToManuscript] Failed to append to chapter:", err);
    return false;
  }
}

// ── Step indicators ───────────────────────────────────
function StepDot({ n, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: done ? BRAND.gold : active ? BRAND.navy : "rgba(30,58,95,0.1)",
          color: done || active ? "#fff" : "#94a3b8",
        }}>
        {done ? <Check size={12} /> : n}
      </div>
    </div>
  );
}

// ── Main modal ────────────────────────────────────────
export default function SendToManuscript({
  isOpen,
  onClose,
  writerText = "",
  aiFeedback = "",
  sourceLabel = "StoryLab",
}) {
  const navigate = useNavigate();

  const [step, setStep]             = useState(1); // 1 = what to send, 2 = how to add
  const [whatToSend, setWhatToSend] = useState(null); // "writer" | "ai" | "both"
  const [howToAdd, setHowToAdd]     = useState(null);  // "new" | "append"
  const [chapters, setChapters]     = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [chapterTitle, setChapterTitle]           = useState("");
  const [done, setDone]             = useState(false);
  const [saving, setSaving]         = useState(false);

  const hasWriter = !!writerText?.trim();
  const hasFeedback = !!aiFeedback?.trim();

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setWhatToSend(null);
      setHowToAdd(null);
      setSelectedChapterId("");
      setChapterTitle(`${sourceLabel} — ${new Date().toLocaleDateString()}`);
      setDone(false);
      setSaving(false);
      setChapters(loadCurrentChapters());
    }
  }, [isOpen, sourceLabel]);

  if (!isOpen) return null;

  // ── Build the content to send ─────────────────────
  function buildContent() {
    const parts = [];
    if (whatToSend === "writer" || whatToSend === "both") {
      parts.push(`=== My Work (from ${sourceLabel}) ===\n\n${writerText.trim()}`);
    }
    if (whatToSend === "ai" || whatToSend === "both") {
      parts.push(`=== AI Feedback (from ${sourceLabel}) ===\n\n${aiFeedback.trim()}`);
    }
    return parts.join("\n\n---\n\n");
  }

  // ── Save handler ──────────────────────────────────
  async function handleSave() {
    setSaving(true);
    const content = buildContent();
    let success = false;

    if (howToAdd === "new") {
      success = saveNewChapter({ title: chapterTitle, content });
    } else if (howToAdd === "append" && selectedChapterId) {
      success = appendToChapter({ chapterId: selectedChapterId, content });
    }

    setSaving(false);
    if (success) setDone(true);
    else alert("Something went wrong saving to your manuscript. Please try again.");
  }

  // ── Option button ─────────────────────────────────
  function OptionButton({ value, current, onClick, icon: Icon, label, sub, disabled }) {
    const selected = current === value;
    return (
      <button
        type="button"
        onClick={() => !disabled && onClick(value)}
        disabled={disabled}
        className="w-full text-left p-4 rounded-xl transition-all"
        style={{
          background: selected ? `rgba(30,58,95,0.06)` : "white",
          border: selected ? `2px solid ${BRAND.navy}` : "1px solid #e2e8f0",
          opacity: disabled ? 0.4 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: selected ? BRAND.navy : "rgba(30,58,95,0.07)" }}>
            <Icon size={18} style={{ color: selected ? "#fff" : BRAND.navy }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>{label}</p>
            {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
          </div>
          {selected && <Check size={16} style={{ color: BRAND.navy, flexShrink: 0 }} />}
        </div>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}08, ${BRAND.gold}08)`, borderBottom: "1px solid #f1f5f9" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #2d4a6f)` }}>
              <Send size={17} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-sm" style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>
                Send to Manuscript
              </h2>
              <p className="text-xs text-slate-500">From {sourceLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        {/* Step indicators */}
        {!done && (
          <div className="px-6 py-3 flex items-center gap-2"
            style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
            <StepDot n={1} active={step === 1} done={step > 1} />
            <span className="text-xs font-medium" style={{ color: step === 1 ? BRAND.navy : "#94a3b8" }}>
              What to send
            </span>
            <div className="flex-1 h-px bg-slate-200 mx-2" />
            <StepDot n={2} active={step === 2} done={done} />
            <span className="text-xs font-medium" style={{ color: step === 2 ? BRAND.navy : "#94a3b8" }}>
              How to add it
            </span>
          </div>
        )}

        <div className="px-6 py-5">

          {/* ── DONE STATE ── */}
          {done && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <Check size={28} className="text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1" style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
                Saved to Manuscript!
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Your content has been {howToAdd === "new" ? "added as a new chapter" : "appended to the chapter"}.
              </p>
              <div className="flex gap-3 justify-center">
                <button onClick={onClose}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  Stay Here
                </button>
                <button onClick={() => { onClose(); navigate("/writer"); }}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #2d4a6f)` }}>
                  Open Compose <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 1: What to send ── */}
          {!done && step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                What would you like to send to your manuscript?
              </p>

              <OptionButton
                value="writer"
                current={whatToSend}
                onClick={setWhatToSend}
                icon={FileText}
                label="My work"
                sub="The text you typed or pasted"
                disabled={!hasWriter}
              />
              <OptionButton
                value="ai"
                current={whatToSend}
                onClick={setWhatToSend}
                icon={Sparkles}
                label="AI feedback"
                sub="The analysis and suggestions"
                disabled={!hasFeedback}
              />
              <OptionButton
                value="both"
                current={whatToSend}
                onClick={setWhatToSend}
                icon={Layers}
                label="Both together"
                sub="Your work + AI feedback combined"
                disabled={!hasWriter && !hasFeedback}
              />

              <button
                onClick={() => setStep(2)}
                disabled={!whatToSend}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #2d4a6f)` }}>
                Next →
              </button>
            </div>
          )}

          {/* ── STEP 2: How to add ── */}
          {!done && step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 mb-4">
                How would you like to add it?
              </p>

              <OptionButton
                value="new"
                current={howToAdd}
                onClick={setHowToAdd}
                icon={Plus}
                label="Create new chapter"
                sub="Adds a fresh chapter to your manuscript"
              />

              <OptionButton
                value="append"
                current={howToAdd}
                onClick={setHowToAdd}
                icon={BookOpen}
                label="Append to existing chapter"
                sub="Adds to the end of a chapter you choose"
                disabled={chapters.length === 0}
              />

              {/* Chapter title input (for new chapter) */}
              {howToAdd === "new" && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Chapter title
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={e => setChapterTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
                  />
                </div>
              )}

              {/* Chapter selector (for append) */}
              {howToAdd === "append" && chapters.length > 0 && (
                <div className="mt-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Choose chapter
                  </label>
                  <select
                    value={selectedChapterId}
                    onChange={e => setSelectedChapterId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm border border-slate-200 focus:outline-none focus:border-amber-300 bg-white"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                    <option value="">Select a chapter...</option>
                    {chapters.map(ch => (
                      <option key={ch.id} value={ch.id}>
                        {ch.title || "Untitled Chapter"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                  ← Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    !howToAdd ||
                    (howToAdd === "new" && !chapterTitle.trim()) ||
                    (howToAdd === "append" && !selectedChapterId)
                  }
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                  {saving ? "Saving..." : "Save to Manuscript"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
