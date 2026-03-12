// src/pages/storylab/poetry/RemixLab.jsx
import React, { useState } from "react";
import { Shuffle, Sparkles } from "lucide-react";

const BRAND = { navy: "#1e3a5f", gold: "#d4af37", green: "#059669" };

const REMIX_MODES = [
  { id: "erase", label: "Erasure", prompt: "Create an erasure poem from this source text. Select words and phrases already present in the text — do not add new words. What remains should feel like a complete, resonant poem discovered inside the original. Return the erasure poem and the source text with the selected words highlighted in brackets." },
  { id: "mirror", label: "Mirror", prompt: "Write a mirror poem that responds to this poem. The mirror poem should use the same structure and number of lines but reverse or complicate every claim, image, or emotion. Return the mirror poem alongside the original." },
  { id: "compress", label: "Compress to a Lyric", prompt: "Compress this poem into a single tight lyric of no more than 6 lines. Keep only the essential image and emotion. Every word must carry the weight of what was cut. Return the compressed lyric and explain what you kept and why." },
  { id: "expand", label: "Expand", prompt: "Expand this poem into a longer piece — at least double its current length. Do not pad or repeat. Add new images, deepen the turn, develop what the original poem gestures toward but doesn't fully enter. Return the expanded poem." },
  { id: "constraint", label: "Constraint Rewrite", prompt: "Rewrite this poem under a formal constraint of your choosing — lipogram (avoid a letter), syllabic verse, abecedarian, or anaphora. Name the constraint you chose and return the constrained rewrite." },
];

export default function RemixLab() {
  const [poem, setPoem] = useState("");
  const [mode, setMode] = useState("erase");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function remix() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    const selectedMode = REMIX_MODES.find(m => m.id === mode);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `${selectedMode.prompt}\n\nPoem/Text:\n${poem}` }]
        })
      });
      const data = await res.json();
      setResult(data.content?.[0]?.text || "No response received.");
    } catch {
      setResult("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #047857, #059669)" }}>
          <Shuffle size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Remix Lab</h1>
          <p className="text-sm text-slate-500">Rewrite with constraints: erase, mirror, compress, expand.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Choose a Remix Mode</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {REMIX_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="rounded-xl border px-4 py-3 text-sm font-semibold text-left transition"
              style={{
                borderColor: mode === m.id ? BRAND.green : "#e2e8f0",
                background: mode === m.id ? "#d1fae5" : "white",
                color: mode === m.id ? BRAND.green : "#475569",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        <textarea
          value={poem}
          onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem or source text here..."
          rows={8}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px" }}
        />
        <button
          onClick={remix}
          disabled={loading || !poem.trim()}
          className="mt-3 px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #047857, #059669)" }}
        >
          {loading ? "Remixing..." : "Remix Poem"}
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            Remixed Result
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
