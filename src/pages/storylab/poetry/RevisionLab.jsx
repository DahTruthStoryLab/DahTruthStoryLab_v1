// src/pages/storylab/poetry/RevisionLab.jsx
import React, { useState } from "react";
import { Wand2, Sparkles, RefreshCw } from "lucide-react";
import { runAssistant } from "../../../lib/api";
import { usePersistedText } from "../../../hooks/usePersistedText";
import { useDynamicPrompts } from "../../../hooks/useDynamicPrompts";
import SendToManuscript from "../../../components/storylab/SendToManuscript";

const BRAND = { purple: "#4c1d95", purpleLight: "#7c3aed", gold: "#d4af37", goldDark: "#b8960c", rose: "#f9a8d4", roseDark: "#ec4899" };

const REVISION_MODES = [
  { id: "tighten",  label: "Tighten Diction",      color: "#a78bfa", prompt: "Revise this poem to tighten the diction. Cut every word that does not earn its place. Strengthen verbs. Remove adjectives that explain rather than show. Return only the revised poem with a short note on what you changed." },
  { id: "images",   label: "Sharpen Images",        color: "#d4af37", prompt: "Revise this poem's imagery. Replace abstractions with concrete, specific images. Every image should be surprising yet inevitable. Return the revised poem with a short note on what you changed." },
  { id: "turn",     label: "Strengthen the Turn",   color: "#f9a8d4", prompt: "Identify and strengthen the volta (turn) in this poem. If there isn't one, introduce it. The turn should shift something — a perspective, a revelation, a deepening. Return the revised poem with a brief explanation of where the turn now lands." },
  { id: "compress", label: "Compress",              color: "#6ee7b7", prompt: "Cut this poem by 20-30% without losing its emotional core. Every cut should sharpen rather than diminish. Return the compressed poem and note what you removed and why." },
];

const TOPIC_NAMES = REVISION_MODES.map(m => m.label);

export default function RevisionLab() {
  const [poem, setPoem, clearPoem]             = usePersistedText("revision-lab-poem", "");
  const [result, setResult, clearResult]       = usePersistedText("revision-lab-result", "");
  const [mode, setMode]                        = useState("tighten");
  const [loading, setLoading]                  = useState(false);
  const [showSend, setShowSend]                = useState(false);

  const { prompts, loading: promptsLoading, refresh, updateWithText } = useDynamicPrompts({
    module: "Revision Lab",
    topics: TOPIC_NAMES,
    genre:  "poetry",
  });

  const selected = REVISION_MODES.find(m => m.id === mode);

  async function revise() {
    if (!poem.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await runAssistant(poem, "clarify", selected.prompt, "anthropic");
      const output = res?.result || res?.text || "No response received.";
      setResult(output);
      updateWithText(poem);
    } catch {
      setResult("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <SendToManuscript isOpen={showSend} onClose={() => setShowSend(false)}
        writerText={poem} aiFeedback={result} sourceLabel="Revision Lab" />

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND.roseDark}, ${BRAND.rose})` }}>
            <Wand2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Revision Lab</h1>
            <p className="text-slate-500 text-sm mt-0.5">Tighten diction · Sharpen images · Strengthen the turn</p>
          </div>
        </div>
        <button onClick={refresh} disabled={promptsLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(236,72,153,0.08)", color: BRAND.roseDark, border: "1px solid rgba(236,72,153,0.2)" }}>
          <RefreshCw size={13} className={promptsLoading ? "animate-spin" : ""} />
          {promptsLoading ? "Generating..." : "New Prompts"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {REVISION_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} className="rounded-2xl px-4 py-4 text-left transition-all"
            style={{ background: mode === m.id ? `${m.color}15` : "#faf8ff", border: `1px solid ${mode === m.id ? m.color + "50" : "#e8e0ff"}`, boxShadow: mode === m.id ? `0 4px 16px ${m.color}20` : "none" }}>
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <span className="font-semibold text-sm block" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", color: mode === m.id ? "#1e1040" : "#475569" }}>
              {m.label}
            </span>
            {prompts[m.label] && (
              <p className="text-xs mt-1.5 italic leading-snug" style={{ color: "rgba(76,29,149,0.55)" }}>
                {prompts[m.label]}
              </p>
            )}
          </button>
        ))}
      </div>

      <div className="rounded-3xl p-6"
        style={{ background: `linear-gradient(135deg, ${BRAND.purple}06, ${BRAND.purpleLight}04)`, border: `1px solid ${BRAND.purpleLight}18` }}>
        <textarea value={poem} onChange={e => setPoem(e.target.value)} placeholder="Paste your poem here..." rows={8}
          className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none focus:ring-2"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.7", border: `1px solid ${BRAND.purpleLight}20`, background: "white" }} />
        <div className="flex items-center flex-wrap gap-3 mt-4">
          <button onClick={revise} disabled={loading || !poem.trim()}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${selected?.color || BRAND.roseDark}, ${BRAND.roseDark})` }}>
            {loading ? "Revising..." : `Apply — ${selected?.label}`}
          </button>
          <button onClick={() => setShowSend(true)} disabled={!poem.trim() && !result.trim()}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-1.5"
            style={{ background: "linear-gradient(135deg, #1e3a5f, #2d4a6f)", color: "#fff" }}>
            Send to Manuscript
          </button>
          {(poem || result) && (
            <button onClick={() => { clearPoem(); clearResult(); }}
              className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.07)", color: BRAND.purpleLight, border: "1px solid rgba(124,58,237,0.15)" }}>
              Start Over
            </button>
          )}
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.purpleLight}18` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Revised Draft</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.8" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
