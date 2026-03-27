// src/pages/storylab/nonfiction/ArgumentThesis.jsx
// FIXED: Removed direct fetch to api.anthropic.com
// Now routes through Lambda via runAssistant() from api.ts

import React, { useState } from "react";
import { Target, Sparkles } from "lucide-react";
import { runAssistant } from "../../../lib/api";

const BRAND = { brown: "#78350f", amber: "#b45309", gold: "#d4af37", goldDark: "#b8960c" };

const MODES = [
  { id: "sharpen", label: "Sharpen Thesis", color: "#d4af37", prompt: "Sharpen this thesis statement. Make it more specific, arguable, and significant. The thesis should take a clear position and signal the stakes of the argument. Return 3 revised versions ranked from good to best, with a brief explanation of each." },
  { id: "stress", label: "Stress Test", color: "#b45309", prompt: "Stress test this argument. Identify: (1) the weakest claim, (2) the most vulnerable assumption, (3) the strongest counterargument, (4) what evidence would disprove it. Be rigorous and honest." },
  { id: "counter", label: "Counterarguments", color: "#92400e", prompt: "Generate the 3 strongest counterarguments to this thesis or argument. For each, explain why it has force and how the writer might respond to it. Be fair to the opposing position." },
  { id: "stakes", label: "Raise the Stakes", color: "#78350f", prompt: "Analyze this argument and explain why it matters. What are the broader implications? What is at stake if the argument is right — or wrong? Help the writer articulate the significance of their claim beyond its immediate subject." },
];

export default function ArgumentThesis() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("sharpen");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = MODES.find(m => m.id === mode);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await runAssistant(text, "clarify", selected.prompt, "anthropic");
      setResult(res?.result || res?.text || "No response received.");
    } catch {
      setResult("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}>
          <Target size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Argument & Thesis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Sharpen · Stress test · Counterarguments · Stakes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="rounded-2xl px-4 py-4 text-left transition-all"
            style={{
              background: mode === m.id ? `${m.color}15` : "#fffbeb",
              border: `1px solid ${mode === m.id ? m.color + "50" : "#fde68a"}`,
              boxShadow: mode === m.id ? `0 4px 16px ${m.color}20` : "none",
            }}>
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <span className="font-semibold block" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", color: mode === m.id ? BRAND.brown : "#475569" }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}30` }}>
        <textarea value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste your thesis statement or argument here..."
          rows={6} className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.7", border: `1px solid ${BRAND.gold}25`, background: "white" }} />
        <button onClick={analyze} disabled={loading || !text.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.goldDark}, ${BRAND.gold})` }}>
          {loading ? "Analyzing..." : `Apply — ${selected?.label}`}
        </button>
      </div>

      {result && (
        <div className="rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.gold}20` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Analysis</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", lineHeight: "1.8" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
