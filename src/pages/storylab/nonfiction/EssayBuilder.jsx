// src/pages/storylab/nonfiction/EssayBuilder.jsx
// FIXED: No longer calls api.anthropic.com directly.
// Now routes through your Lambda via runAssistant() from api.ts

import React, { useState } from "react";
import { FileText, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { runAssistant } from "../../../lib/api";

const BRAND = { brown: "#78350f", amber: "#b45309", gold: "#d4af37", goldDark: "#b8960c" };

const ESSAY_PARTS = [
  { title: "Thesis Statement", color: "#d97706", content: "Your thesis is a single, arguable claim that your entire essay defends. It should be specific, debatable, and significant. Avoid thesis statements that merely state a fact or announce your topic. A strong thesis takes a position and signals the stakes of the argument.", prompt: "Write your thesis in one sentence. Then ask: Is this arguable? Is it specific? Does it matter?" },
  { title: "Claims & Evidence", color: "#d4af37", content: "Each body paragraph makes one claim that supports your thesis. The claim is your argument; the evidence is your proof. Evidence must be specific — a quote, a statistic, an example. After evidence, always explain how it supports your claim. Never let evidence speak for itself.", prompt: "For each paragraph, write: Claim -> Evidence -> Explanation. Are all three present?" },
  { title: "Counterargument", color: "#92400e", content: "A strong essay anticipates and addresses opposing views. Acknowledge the counterargument fairly. Then refute it, concede part of it, or reframe it. Handling objections strengthens your credibility and deepens your argument.", prompt: "What is the strongest objection to your argument? Write it honestly, then respond to it." },
  { title: "Transitions", color: "#b45309", content: "Transitions are the connective tissue of your essay. They show logical relationships — causation, contrast, sequence, consequence. Avoid mechanical transitions. Instead, use transitional ideas that grow naturally from your previous point.", prompt: "Read your essay aloud. Where does it feel abrupt or disconnected? Rewrite those moments." },
  { title: "Conclusion", color: "#78350f", content: "Your conclusion should do more than summarize. It should land with weight — synthesizing your argument, raising the stakes, or opening outward to a larger implication. The final sentence of your essay is the last thing your reader carries away. Make it count.", prompt: "Write a conclusion that begins with synthesis, not summary. What does your argument mean beyond itself?" },
];

export default function EssayBuilder() {
  const [open, setOpen] = useState(null);
  const [essay, setEssay] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyze() {
    if (!essay.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      const instructions =
        "You are a rigorous essay editor. Analyze this essay or essay draft for: " +
        "thesis strength, claim-evidence-explanation structure, counterargument handling, " +
        "transitions, and conclusion. Be specific. Point to exact sentences. Do not be generic.";

      const res = await runAssistant(essay, "clarify", instructions, "anthropic");
      setFeedback(res?.result || res?.text || "No response received.");
    } catch (err) {
      setFeedback("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
          <FileText size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Essay Builder</h1>
          <p className="text-slate-500 text-sm mt-0.5">Thesis · Claims · Evidence · Counterargument · Conclusion</p>
        </div>
      </div>

      <div className="space-y-2 mb-10">
        {ESSAY_PARTS.map((part, i) => (
          <div key={i} className="rounded-2xl overflow-hidden transition-all"
            style={{ border: open === i ? `1px solid ${part.color}50` : "1px solid #fde68a", background: open === i ? "#fff" : "#fffbeb" }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: part.color }} />
                <span className="font-semibold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px" }}>{part.title}</span>
              </div>
              {open === i ? <ChevronUp size={15} style={{ color: part.color }} /> : <ChevronDown size={15} className="text-slate-300" />}
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{part.content}</p>
                <div className="rounded-xl px-4 py-3 text-sm italic" style={{ background: `${part.color}10`, borderLeft: `3px solid ${part.color}`, color: "#374151" }}>
                  <strong style={{ color: part.color }}>Try this:</strong> {part.prompt}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl p-6" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}30` }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: BRAND.gold }} />
          <h2 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "18px" }}>AI Essay Analysis</h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">Paste your essay or draft for specific structural feedback.</p>
        <textarea value={essay} onChange={e => setEssay(e.target.value)}
          placeholder="Paste your essay or draft here..."
          rows={8} className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.7", border: `1px solid ${BRAND.gold}30`, background: "white" }} />
        <button onClick={analyze} disabled={loading || !essay.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
          {loading ? "Analyzing..." : "Analyze Essay"}
        </button>
        {feedback && (
          <div className="mt-6 rounded-2xl px-5 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ background: "white", border: `1px solid ${BRAND.gold}20`, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", lineHeight: "1.75" }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
