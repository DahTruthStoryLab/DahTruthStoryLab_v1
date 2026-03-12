// src/pages/storylab/poetry/VoiceIdentity.jsx
import React, { useState } from "react";
import { Mic2, Sparkles } from "lucide-react";

const BRAND = { navy: "#1e3a5f", gold: "#d4af37", cyan: "#0891b2" };

const VOICE_MODES = [
  { id: "analyze", label: "Analyze My Voice", prompt: "Analyze the distinct voice in this poem. Describe its tone, diction level, stance toward the subject, persona, and signature tendencies. Be specific — quote the poem. What makes this voice unmistakably this writer's?" },
  { id: "strengthen", label: "Strengthen Voice", prompt: "Rewrite this poem to make the voice stronger and more distinct. Remove any language that sounds generic or borrowed. Push toward what is most original and specific about this speaker. Return the rewritten poem with a brief note on what you amplified." },
  { id: "persona", label: "Explore a Persona", prompt: "Rewrite this poem from a completely different persona — different age, different vantage point, different relationship to the subject. Keep the core event or image but let the voice transform it. Return the persona poem and identify who the speaker became." },
  { id: "signature", label: "Find Signature Language", prompt: "Identify the signature language in this poem — the phrases, rhythms, or images that feel most characteristic of this writer. Then suggest 3 ways to develop these into a consistent poetic signature across a collection." },
];

export default function VoiceIdentity() {
  const [poem, setPoem] = useState("");
  const [mode, setMode] = useState("analyze");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    const selectedMode = VOICE_MODES.find(m => m.id === mode);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `${selectedMode.prompt}\n\nPoem:\n${poem}` }]
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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0e7490, #0891b2)" }}>
          <Mic2 size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Voice & Identity</h1>
          <p className="text-sm text-slate-500">Tone, stance, persona, signature language.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 mb-6">
        <h2 className="font-bold text-slate-800 mb-4">Choose a Mode</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {VOICE_MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className="rounded-xl border px-4 py-3 text-sm font-semibold text-left transition"
              style={{
                borderColor: mode === m.id ? BRAND.cyan : "#e2e8f0",
                background: mode === m.id ? "#e0f2fe" : "white",
                color: mode === m.id ? BRAND.cyan : "#475569",
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
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-300"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px" }}
        />
        <button
          onClick={analyze}
          disabled={loading || !poem.trim()}
          className="mt-3 px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #0e7490, #0891b2)" }}
        >
          {loading ? "Analyzing..." : "Analyze Voice"}
        </button>
      </div>

      {result && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            Voice Analysis
          </h3>
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
