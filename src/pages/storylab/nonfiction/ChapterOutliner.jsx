// src/pages/storylab/nonfiction/ChapterOutliner.jsx
import React, { useState } from "react";
import { LayoutList, Plus, Trash2, Sparkles, GripVertical } from "lucide-react";
import { runAssistant } from "../../../lib/api";
import { usePersistedText } from "../../../hooks/usePersistedText";
import SendToManuscript from "../../../components/storylab/SendToManuscript";

const BRAND = { brown: "#78350f", amber: "#b45309", gold: "#d4af37", goldDark: "#b8960c" };

const EMPTY_CHAPTER = () => ({ id: Date.now(), title: "", purpose: "", keyPoints: "", transition: "" });

function usePersistedChapters() {
  const [raw, setRaw, clearRaw] = usePersistedText("chapter-outliner-data", "[]");
  const chapters = (() => { try { const p = JSON.parse(raw); return Array.isArray(p) && p.length ? p : null; } catch { return null; } })();
  const setChapters = (c) => setRaw(JSON.stringify(c));
  return [chapters || [EMPTY_CHAPTER(), EMPTY_CHAPTER()], setChapters, clearRaw];
}

export default function ChapterOutliner() {
  const [chapters, setChapters, clearChapters] = usePersistedChapters();
  const [bookNote, setBookNote, clearBookNote] = usePersistedText("chapter-outliner-booknote", "");
  const [feedback, setFeedback, clearFeedback] = usePersistedText("chapter-outliner-feedback", "");
  const [loading, setLoading]                  = useState(false);
  const [showSend, setShowSend]                = useState(false);

  function addChapter() { setChapters([...chapters, EMPTY_CHAPTER()]); }
  function removeChapter(id) { setChapters(chapters.filter(c => c.id !== id)); }
  function updateChapter(id, field, value) { setChapters(chapters.map(c => c.id === id ? { ...c, [field]: value } : c)); }

  async function analyze() {
    const filled = chapters.filter(c => c.title.trim());
    if (!filled.length) return;
    setLoading(true);
    setFeedback("");
    const formatted = filled.map((c, i) =>
      `Chapter ${i + 1}: ${c.title}\nPurpose: ${c.purpose}\nKey Points: ${c.keyPoints}\nTransition: ${c.transition}`
    ).join("\n\n");
    const instructions =
      "You are a nonfiction book editor. Review this chapter outline and advise on: " +
      "(1) whether each chapter has a clear purpose, (2) whether the arc builds effectively, " +
      "(3) any gaps or redundancies, (4) how transitions between chapters can be strengthened. Be specific.";
    const text = `Book notes: ${bookNote || "None."}\n\nOutline:\n${formatted}`;
    try {
      const res = await runAssistant(text, "clarify", instructions, "anthropic");
      setFeedback(res?.result || res?.text || "No response received.");
    } catch { setFeedback("Error connecting to AI. Please try again."); }
    setLoading(false);
  }

  const outlineText = chapters.filter(c => c.title.trim())
    .map((c, i) => `Chapter ${i + 1}: ${c.title}\nPurpose: ${c.purpose}\nKey Points: ${c.keyPoints}\nTransition: ${c.transition}`)
    .join("\n\n");

  return (
    <div className="max-w-2xl">
      <SendToManuscript isOpen={showSend} onClose={() => setShowSend(false)}
        writerText={outlineText} aiFeedback={feedback} sourceLabel="Chapter Outliner" />

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #374151, #6b7280)" }}>
          <LayoutList size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Chapter Outliner</h1>
          <p className="text-slate-500 text-sm mt-0.5">Purpose · Key points · Transitions · Arc</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {chapters.map((ch, i) => (
          <div key={ch.id} className="rounded-2xl p-5" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}25` }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-slate-300" />
                <span className="text-xs font-bold" style={{ color: BRAND.amber }}>Chapter {i + 1}</span>
              </div>
              <button onClick={() => removeChapter(ch.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            {[
              { field: "title",      label: "Chapter Title",   placeholder: "What is this chapter called?",                     rows: 1 },
              { field: "purpose",    label: "Chapter Purpose", placeholder: "What does this chapter accomplish for the reader?", rows: 2 },
              { field: "keyPoints",  label: "Key Points",      placeholder: "Main arguments, scenes, or ideas covered...",      rows: 2 },
              { field: "transition", label: "Transition Out",  placeholder: "How does this chapter lead into the next?",        rows: 1 },
            ].map(({ field, label, placeholder, rows }) => (
              <div key={field} className="mb-3">
                <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                <textarea value={ch[field]} onChange={e => updateChapter(ch.id, field, e.target.value)}
                  placeholder={placeholder} rows={rows}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-800 resize-none focus:outline-none"
                  style={{ background: "white", border: `1px solid ${BRAND.gold}20`, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "14px" }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}25` }}>
        <textarea value={bookNote} onChange={e => setBookNote(e.target.value)}
          placeholder="Notes about your book — thesis, audience, overall arc..."
          rows={3} className="w-full rounded-2xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none mb-4"
          style={{ background: "white", border: `1px solid ${BRAND.gold}18`, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "14px" }} />
        <div className="flex items-center flex-wrap gap-3">
          <button onClick={addChapter}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
            style={{ background: `${BRAND.amber}15`, color: BRAND.amber, border: `1px solid ${BRAND.amber}25` }}>
            <Plus size={14} /> Add Chapter
          </button>
          <button onClick={analyze} disabled={loading || !chapters.some(c => c.title.trim())}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
            <Sparkles size={14} /> {loading ? "Analyzing..." : "Get Outline Feedback"}
          </button>
          <button onClick={() => setShowSend(true)} disabled={!outlineText.trim() && !feedback.trim()}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #2d4a6f)", color: "#fff" }}>
            Send to Manuscript
          </button>
          {(outlineText || feedback) && (
            <button onClick={() => { clearChapters(); clearBookNote(); clearFeedback(); }}
              className="text-xs px-4 py-2.5 rounded-xl font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(120,53,15,0.07)", color: BRAND.brown, border: "1px solid rgba(120,53,15,0.15)" }}>
              Start Over
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.gold}20` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Outline Feedback</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", lineHeight: "1.8" }}>
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}
