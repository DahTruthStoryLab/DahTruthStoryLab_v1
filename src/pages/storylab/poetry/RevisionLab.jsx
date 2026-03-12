// src/pages/storylab/poetry/RevisionLab.jsx
import React, { useState } from "react";
import { Wand2, Sparkles } from "lucide-react";

const BRAND = { navy: "#1e3a5f", gold: "#d4af37", roseDark: "#c97b7b", rose: "#e8b4b8" };

const REVISION_MODES = [
  { id: "tighten", label: "Tighten Diction", prompt: "Revise this poem to tighten the diction. Cut every word that does not earn its place. Strengthen verbs. Remove adjectives that explain rather than show. Return only the revised poem with a short note on what you changed." },
  { id: "images", label: "Sharpen Images", prompt: "Revise this poem's imagery. Replace abstractions with concrete, specific images. Every image should be surprising yet inevitable. Return the revised poem with a short note on what you changed." },
  { id: "turn", label: "Strengthen the Turn", prompt: "Identify and strengthen the volta (turn) in this poem. If there isn't one, introduce it. The turn should shift something — a perspective, a revelation, a deepening. Return the revised poem with a brief explanation of where the turn now lands." },
  { id: "compress", label: "Compress", prompt: "Cut this poem by 20-30% without losing its emotional core. Every cut should sharpen rather than diminish. Return the compressed poem and note what you removed and why." },
];

export default function RevisionLab() {
  const [poem, setPoem] = useState("");
  const [mode, setMode] = useState("tighten");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function revise() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    const selectedMode = REVISION_MODES.find(m => m.id === mode);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `${selectedMode.prompt}\n\nPoem:\n${poem}`
          }]
        })
      });
      const data = await res.json();
      setResult(data.content?.[0]?.text || "No response received.");
    } catch (e) {
      setResult("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${BRAND.roseDark}, ${BRAND.rose})` }}>
          <Wand2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Revision Lab</h1>
          <p className="text-sm text-slate-500">Tighten diction, sharpen images, strengthen the turn.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Choose a Revision Mode</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {REVISION_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="rounded-xl border px-4 py-3 text-sm font-semibold text-left transition"
              style={{
                borderColor: mode === m.id ? BRAND.roseDark : "#e2e8f0",
                background: mode === m.id ? `${BRAND.rose}20` : "white",
                color: mode === m.id ? BRAND.roseDark : "#475569",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        <textarea
          value={poem}
          onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem here..."
          rows={8}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", focusRingColor: BRAND.roseDark }}
        />
        <button
          onClick={revise}
          disabled={loading || !poem.trim()}
          className="mt-3 px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
          style={{ background: `linear-gradient(135deg, ${BRAND.roseDark}, ${BRAND.rose})` }}
        >
          {loading ? "Revising..." : "Revise Poem"}
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            Revised Draft
          </h3>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

