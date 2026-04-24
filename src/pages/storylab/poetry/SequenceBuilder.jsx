// src/pages/storylab/poetry/SequenceBuilder.jsx
import React, { useState } from "react";
import { Layers, Plus, Trash2, Sparkles, GripVertical } from "lucide-react";
import { runAssistant } from "../../../lib/api";
import { usePersistedText } from "../../../hooks/usePersistedText";
import SendToManuscript from "../../../components/storylab/SendToManuscript";

const BRAND = { purple: "#4c1d95", purpleLight: "#7c3aed", gold: "#d4af37", goldDark: "#b8960c" };
const ROLES = ["opening", "early", "middle", "hinge", "late", "closer"];
const ROLE_COLORS = { opening: "#a78bfa", early: "#c4b5fd", middle: "#d4af37", hinge: "#f9a8d4", late: "#67e8f9", closer: "#6ee7b7" };

const DEFAULT_POEMS = [
  { id: 1, title: "", role: "opening" },
  { id: 2, title: "", role: "middle" },
  { id: 3, title: "", role: "closer" },
];

function usePersistedPoems() {
  const [raw, setRaw, clearRaw] = usePersistedText("sequence-builder-poems", "[]");
  const poems = (() => { try { const p = JSON.parse(raw); return Array.isArray(p) && p.length ? p : null; } catch { return null; } })();
  const setPoems = (p) => setRaw(JSON.stringify(p));
  return [poems || DEFAULT_POEMS, setPoems, clearRaw];
}

export default function SequenceBuilder() {
  const [poems, setPoems, clearPoems]                  = usePersistedPoems();
  const [collectionNote, setCollectionNote, clearNote] = usePersistedText("sequence-builder-note", "");
  const [advice, setAdvice, clearAdvice]               = usePersistedText("sequence-builder-advice", "");
  const [loading, setLoading]                          = useState(false);
  const [showSend, setShowSend]                        = useState(false);

  function addPoem() { setPoems([...poems, { id: Date.now(), title: "", role: "middle" }]); }
  function removePoem(id) { setPoems(poems.filter(p => p.id !== id)); }
  function updatePoem(id, field, value) { setPoems(poems.map(p => p.id === id ? { ...p, [field]: value } : p)); }

  async function getAdvice() {
    const titled = poems.filter(p => p.title.trim());
    if (titled.length < 2) return;
    setLoading(true);
    setAdvice("");

    const list = titled.map((p, i) => `${i + 1}. "${p.title}" (${p.role})`).join("\n");
    const instructions =
      "You are a poetry editor helping sequence a collection. " +
      "Advise on: (1) whether this sequence builds an effective arc, " +
      "(2) which poems should move and why, (3) what's missing — opening, hinge, closer. Be specific.";
    const text = `Current sequence:\n\n${list}\n\nCollection notes: ${collectionNote || "None."}`;

    try {
      const res = await runAssistant(text, "clarify", instructions, "anthropic");
      setAdvice(res?.result || res?.text || "No response received.");
    } catch {
      setAdvice("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  // Build plain text for SendToManuscript
  const sequenceText = poems
    .filter(p => p.title.trim())
    .map((p, i) => `${i + 1}. "${p.title}" (${p.role})`)
    .join("\n");

  function handleStartOver() { clearPoems(); clearNote(); clearAdvice(); }

  return (
    <div className="max-w-2xl">
      <SendToManuscript isOpen={showSend} onClose={() => setShowSend(false)}
        writerText={sequenceText} aiFeedback={advice} sourceLabel="Sequence Builder" />

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}>
          <Layers size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Sequence Builder</h1>
          <p className="text-slate-500 text-sm mt-0.5">Arrange poems into an arc · Openings · Hinges · Closers</p>
        </div>
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: "#faf8ff", border: `1px solid ${BRAND.purpleLight}18` }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Your Sequence</h2>
          <button onClick={addPoem}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all hover:opacity-80"
            style={{ background: `${BRAND.purpleLight}15`, color: BRAND.purpleLight, border: `1px solid ${BRAND.purpleLight}25` }}>
            <Plus size={13} /> Add Poem
          </button>
        </div>

        <div className="space-y-2 mb-5">
          {poems.map((poem, i) => (
            <div key={poem.id} className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: "white", border: `1px solid ${poem.title ? BRAND.purpleLight + "20" : "#e8e0ff"}` }}>
              <GripVertical size={14} className="text-slate-200 shrink-0" />
              <span className="text-xs font-bold w-5 shrink-0" style={{ color: BRAND.purpleLight }}>{i + 1}</span>
              <input value={poem.title} onChange={e => updatePoem(poem.id, "title", e.target.value)}
                placeholder="Poem title..." className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px" }} />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: ROLE_COLORS[poem.role] || "#e2e8f0" }} />
                <select value={poem.role} onChange={e => updatePoem(poem.id, "role", e.target.value)}
                  className="text-xs bg-transparent focus:outline-none" style={{ color: "#64748b" }}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <button onClick={() => removePoem(poem.id)} className="text-slate-200 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>

        <textarea value={collectionNote} onChange={e => setCollectionNote(e.target.value)}
          placeholder="Notes about your collection — theme, arc, emotional journey..." rows={3}
          className="w-full rounded-2xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none mb-4"
          style={{ background: "white", border: `1px solid ${BRAND.purpleLight}18`, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "14px" }} />

        <div className="flex items-center flex-wrap gap-3">
          <button onClick={getAdvice} disabled={loading || poems.filter(p => p.title.trim()).length < 2}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}>
            {loading ? "Analyzing..." : "Get Sequence Advice"}
          </button>
          <button onClick={() => setShowSend(true)} disabled={!sequenceText.trim() && !advice.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #2d4a6f)", color: "#fff" }}>
            Send to Manuscript
          </button>
          {(sequenceText || advice) && (
            <button onClick={handleStartOver}
              className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.07)", color: BRAND.purpleLight, border: "1px solid rgba(124,58,237,0.15)" }}>
              Start Over
            </button>
          )}
        </div>
      </div>

      {advice && (
        <div className="rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.purpleLight}18` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Sequence Feedback</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", lineHeight: "1.8" }}>
            {advice}
          </div>
        </div>
      )}
    </div>
  );
}
