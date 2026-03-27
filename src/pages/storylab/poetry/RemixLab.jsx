// src/pages/storylab/poetry/RemixLab.jsx
// FIXED: Removed direct fetch to api.anthropic.com
// Now routes through Lambda via runAssistant() from api.ts

import React, { useState } from "react";
import { Shuffle, Sparkles } from "lucide-react";
import { runAssistant } from "../../../lib/api";

const BRAND = { purple: "#4c1d95", purpleLight: "#7c3aed", gold: "#d4af37", goldDark: "#b8960c", green: "#6ee7b7", greenDark: "#059669" };

const REMIX_MODES = [
  { id: "erase", label: "Erasure", color: "#a78bfa", desc: "Find a poem inside the original text.", prompt: "Create an erasure poem from this source text. Select words and phrases already present — do not add new words. What remains should feel like a complete, resonant poem discovered inside the original. Return the erasure poem and show which words you selected in brackets." },
  { id: "mirror", label: "Mirror", color: "#f9a8d4", desc: "Reverse or complicate every claim.", prompt: "Write a mirror poem that responds to this poem. Use the same structure and number of lines but reverse or complicate every claim, image, or emotion. Return the mirror poem alongside the original." },
  { id: "compress", label: "Compress to a Lyric", color: "#d4af37", desc: "Six lines. Essential image only.", prompt: "Compress this poem into a single tight lyric of no more than 6 lines. Keep only the essential image and emotion. Every word must carry the weight of what was cut. Return the compressed lyric and explain what you kept and why." },
  { id: "expand", label: "Expand", color: "#67e8f9", desc: "Double the length without padding.", prompt: "Expand this poem into a longer piece — at least double its current length. Do not pad or repeat. Add new images, deepen the turn, develop what the original poem gestures toward but doesn't fully enter. Return the expanded poem." },
  { id: "constraint", label: "Constraint Rewrite", color: "#6ee7b7", desc: "Lipogram, anaphora, abecedarian.", prompt: "Rewrite this poem under a formal constraint of your choosing — lipogram (avoid a letter), syllabic verse, abecedarian, or anaphora. Name the constraint you chose and return the constrained rewrite." },
];

export default function RemixLab() {
  const [poem, setPoem] = useState("");
  const [mode, setMode] = useState("erase");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = REMIX_MODES.find(m => m.id === mode);

  async function remix() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await runAssistant(poem, "clarify", selected.prompt, "anthropic");
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
          style={{ background: `linear-gradient(135deg, ${BRAND.greenDark}, #34d399)` }}>
          <Shuffle size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Remix Lab</h1>
          <p className="text-slate-500 text-sm mt-0.5">Erase · Mirror · Compress · Expand · Constrain</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {REMIX_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} className="rounded-2xl px-4 py-4 text-left transition-all"
            style={{ background: mode === m.id ? `${m.color}15` : "#faf8ff", border: `1px solid ${mode === m.id ? m.color + "50" : "#e8e0ff"}`, boxShadow: mode === m.id ? `0 4px 16px ${m.color}20` : "none" }}>
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <span className="font-semibold block" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", color: mode === m.id ? "#1e1040" : "#475569" }}>{m.label}</span>
            <span className="text-xs mt-0.5 block" style={{ color: "#94a3b8" }}>{m.desc}</span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl p-6" style={{ background: `linear-gradient(135deg, ${BRAND.purple}06, ${BRAND.purpleLight}04)`, border: `1px solid ${BRAND.purpleLight}18` }}>
        <textarea value={poem} onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem or source text here..." rows={8}
          className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.7", border: `1px solid ${BRAND.purpleLight}20`, background: "white" }} />
        <button onClick={remix} disabled={loading || !poem.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.greenDark}, #34d399)` }}>
          {loading ? "Remixing..." : `Apply — ${selected?.label}`}
        </button>
      </div>

      {result && (
        <div className="mt-6 rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.purpleLight}18` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Remixed Result</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.8" }}>{result}</div>
        </div>
      )}
    </div>
  );
}
