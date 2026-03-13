// src/pages/storylab/poetry/VoiceIdentity.jsx
import React, { useState } from "react";
import { Mic2, Sparkles } from "lucide-react";

const BRAND = {
  purple: "#4c1d95",
  purpleLight: "#7c3aed",
  gold: "#d4af37",
  goldDark: "#b8960c",
  cyan: "#67e8f9",
  cyanDark: "#0891b2",
};

const VOICE_MODES = [
  { id: "analyze", label: "Analyze My Voice", color: "#a78bfa", prompt: "Analyze the distinct voice in this poem. Describe its tone, diction level, stance toward the subject, persona, and signature tendencies. Be specific — quote the poem. What makes this voice unmistakably this writer's?" },
  { id: "strengthen", label: "Strengthen Voice", color: BRAND.cyan, prompt: "Rewrite this poem to make the voice stronger and more distinct. Remove any language that sounds generic or borrowed. Push toward what is most original and specific about this speaker. Return the rewritten poem with a brief note on what you amplified." },
  { id: "persona", label: "Explore a Persona", color: BRAND.gold, prompt: "Rewrite this poem from a completely different persona — different age, different vantage point, different relationship to the subject. Keep the core event or image but let the voice transform it. Return the persona poem and identify who the speaker became." },
  { id: "signature", label: "Find Signature Language", color: "#6ee7b7", prompt: "Identify the signature language in this poem — the phrases, rhythms, or images that feel most characteristic of this writer. Then suggest 3 ways to develop these into a consistent poetic signature across a collection." },
];

export default function VoiceIdentity() {
  const [poem, setPoem] = useState("");
  const [mode, setMode] = useState("analyze");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = VOICE_MODES.find(m => m.id === mode);

  async function analyze() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `${selected.prompt}\n\nPoem:\n${poem}` }]
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
    <div className="max-w-2xl">

      {/* Page header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.cyanDark}, #06b6d4)` }}
        >
          <Mic2 size={22} className="text-white" />
        </div>
        <div>
          <h1
            className="font-bold text-slate-900"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}
          >
            Voice & Identity
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Tone · Stance · Persona · Signature language</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {VOICE_MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="rounded-2xl px-4 py-4 text-left transition-all"
            style={{
              background: mode === m.id ? `${m.color}15` : "#faf8ff",
              border: `1px solid ${mode === m.id ? m.color + "50" : "#e8e0ff"}`,
              boxShadow: mode === m.id ? `0 4px 16px ${m.color}20` : "none",
            }}
          >
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <span
              className="font-semibold block"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "15px",
                color: mode === m.id ? "#1e1040" : "#475569",
              }}
            >
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* Poem input */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: `linear-gradient(135deg, ${BRAND.purple}06, ${BRAND.purpleLight}04)`,
          border: `1px solid ${BRAND.purpleLight}18`,
        }}
      >
        <textarea
          value={poem}
          onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem here..."
          rows={8}
          className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "16px",
            lineHeight: "1.7",
            border: `1px solid ${BRAND.purpleLight}20`,
            background: "white",
          }}
        />
        <button
          onClick={analyze}
          disabled={loading || !poem.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.cyanDark}, #06b6d4)` }}
        >
          {loading ? "Analyzing..." : `Apply — ${selected?.label}`}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div
          className="mt-6 rounded-3xl p-6"
          style={{ background: "white", border: `1px solid ${BRAND.purpleLight}18` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3
              className="font-bold text-slate-800"
              style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}
            >
              Voice Analysis
            </h3>
          </div>
          <div
            className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.8" }}
          >
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

