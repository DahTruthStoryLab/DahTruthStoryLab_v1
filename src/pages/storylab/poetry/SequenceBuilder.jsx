// src/pages/storylab/poetry/SequenceBuilder.jsx
import React, { useState } from "react";
import { Layers, Plus, Trash2, Sparkles, GripVertical } from "lucide-react";

const BRAND = { navy: "#1e3a5f", gold: "#d4af37", goldDark: "#b8960c" };

export default function SequenceBuilder() {
  const [poems, setPoems] = useState([
    { id: 1, title: "", role: "opening" },
    { id: 2, title: "", role: "middle" },
    { id: 3, title: "", role: "closer" },
  ]);
  const [collectionNote, setCollectionNote] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);

  const ROLES = ["opening", "early", "middle", "hinge", "late", "closer"];

  function addPoem() {
    setPoems(prev => [...prev, { id: Date.now(), title: "", role: "middle" }]);
  }

  function removePoem(id) {
    setPoems(prev => prev.filter(p => p.id !== id));
  }

  function updatePoem(id, field, value) {
    setPoems(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }

  async function getSequenceAdvice() {
    const titled = poems.filter(p => p.title.trim());
    if (titled.length < 2) return;
    setLoading(true);
    setAdvice("");
    const list = titled.map((p, i) => `${i + 1}. "${p.title}" (role: ${p.role})`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a poetry editor helping a writer sequence a collection. Here is the current sequence:\n\n${list}\n\nCollection notes: ${collectionNote || "None provided."}\n\nAdvise on: (1) whether this sequence builds an effective arc, (2) which poems should move and why, (3) what's missing — an opening that earns entry, a hinge that pivots the collection, a closer that resonates. Be specific and direct.`
          }]
        })
      });
      const data = await res.json();
      setAdvice(data.content?.[0]?.text || "No response received.");
    } catch {
      setAdvice("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}>
          <Layers size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Sequence Builder</h1>
          <p className="text-sm text-slate-500">Arrange poems into an arc: openings, hinges, closers.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Your Sequence</h2>
          <button onClick={addPoem} className="flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition">
            <Plus size={14} /> Add Poem
          </button>
        </div>

        <div className="space-y-3 mb-6">
          {poems.map((poem, i) => (
            <div key={poem.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <GripVertical size={16} className="text-slate-300 shrink-0" />
              <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
              <input
                value={poem.title}
                onChange={e => updatePoem(poem.id, "title", e.target.value)}
                placeholder={`Poem title...`}
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <select
                value={poem.role}
                onChange={e => updatePoem(poem.id, "role", e.target.value)}
                className="text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none"
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => removePoem(poem.id)} className="text-slate-300 hover:text-red-400 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <textarea
          value={collectionNote}
          onChange={e => setCollectionNote(e.target.value)}
          placeholder="Notes about your collection (theme, arc, emotional journey)..."
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 mb-3"
        />
        <button
          onClick={getSequenceAdvice}
          disabled={loading || poems.filter(p => p.title.trim()).length < 2}
          className="px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}
        >
          {loading ? "Analyzing..." : "Get Sequence Advice"}
        </button>
      </div>

      {advice && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            Sequence Feedback
          </h3>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {advice}
          </div>
        </div>
      )}
    </div>
  );
}

