// src/pages/storylab/nonfiction/EssayBuilder.jsx
// Receives text from Compose via localStorage "essay-builder-incoming"
// Split view: editable draft on left, AI feedback on right
// Send to Manuscript saves the revised draft as a named chapter

import React, { useState, useEffect } from "react";
import { FileText, Sparkles, ChevronDown, ChevronUp, RefreshCw, ArrowLeft, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { runAssistant } from "../../../lib/api";
import { usePersistedText } from "../../../hooks/usePersistedText";
import { useDynamicPrompts } from "../../../hooks/useDynamicPrompts";
import SendToManuscript from "../../../components/storylab/SendToManuscript";

const BRAND = {
  brown:    "#78350f",
  amber:    "#b45309",
  gold:     "#d4af37",
  goldDark: "#b8960c",
};

const ESSAY_PARTS = [
  {
    title: "Thesis Statement",
    color: "#d97706",
    content: "Your thesis is a single, arguable claim that your entire essay defends. It should be specific, debatable, and significant. Avoid thesis statements that merely state a fact or announce your topic. A strong thesis takes a position and signals the stakes of the argument.",
  },
  {
    title: "Claims & Evidence",
    color: "#d4af37",
    content: "Each body paragraph makes one claim that supports your thesis. The claim is your argument; the evidence is your proof. Evidence must be specific — a quote, a statistic, an example. After evidence, always explain how it supports your claim. Never let evidence speak for itself.",
  },
  {
    title: "Counterargument",
    color: "#92400e",
    content: "A strong essay anticipates and addresses opposing views. Acknowledge the counterargument fairly. Then refute it, concede part of it, or reframe it. Handling objections strengthens your credibility and deepens your argument.",
  },
  {
    title: "Transitions",
    color: "#b45309",
    content: "Transitions are the connective tissue of your essay. They show logical relationships — causation, contrast, sequence, consequence. Avoid mechanical transitions. Instead, use transitional ideas that grow naturally from your previous point.",
  },
  {
    title: "Conclusion",
    color: "#78350f",
    content: "Your conclusion should do more than summarize. It should land with weight — synthesizing your argument, raising the stakes, or opening outward to a larger implication. The final sentence of your essay is the last thing your reader carries away. Make it count.",
  },
];

const TOPIC_NAMES = ESSAY_PARTS.map(p => p.title);

export default function EssayBuilder() {
  const navigate = useNavigate();

  const [open, setOpen]                        = useState(null);
  const [essay, setEssay, clearEssay]          = usePersistedText("essay-builder-draft", "");
  const [feedback, setFeedback, clearFeedback] = usePersistedText("essay-builder-feedback", "");
  const [loading, setLoading]                  = useState(false);
  const [showSend, setShowSend]                = useState(false);
  const [incomingMeta, setIncomingMeta]        = useState(null); // tracks where text came from
  const [showSplitView, setShowSplitView]      = useState(false);

  const { prompts, loading: promptsLoading, refresh, updateWithText } = useDynamicPrompts({
    module: "Essay Builder",
    topics: TOPIC_NAMES,
    genre:  "nonfiction",
  });

  // ── Check for incoming text from Compose on mount ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem("essay-builder-incoming");
      if (!raw) return;

      const incoming = JSON.parse(raw);
      if (!incoming?.text) return;

      // Pre-fill the essay textarea with the incoming text
      setEssay(incoming.text);
      setIncomingMeta(incoming);

      // Clear so it doesn't reload on next visit
      localStorage.removeItem("essay-builder-incoming");
    } catch (err) {
      console.error("Failed to load incoming essay text:", err);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Show split view automatically when feedback arrives ──
  useEffect(() => {
    if (feedback) setShowSplitView(true);
  }, [feedback]);

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
      const output = res?.result || res?.text || "No response received.";
      setFeedback(output);
      updateWithText(essay);
    } catch {
      setFeedback("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  function handleStartOver() {
    clearEssay();
    clearFeedback();
    setIncomingMeta(null);
    setShowSplitView(false);
  }

  return (
    <div className="max-w-5xl">

      <SendToManuscript
        isOpen={showSend}
        onClose={() => setShowSend(false)}
        writerText={essay}
        aiFeedback={feedback}
        sourceLabel="Essay Builder"
      />

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
            <FileText size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900"
              style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>
              Essay Builder
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Thesis · Claims · Evidence · Counterargument · Conclusion
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Back to Compose if came from there */}
          {incomingMeta && (
            <button onClick={() => navigate("/writer")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(30,58,95,0.08)", color: "#1e3a5f", border: "1px solid rgba(30,58,95,0.2)" }}>
              <ArrowLeft size={13} />
              Back to Compose
            </button>
          )}

          {/* Toggle split view */}
          {feedback && (
            <button onClick={() => setShowSplitView(v => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{ background: "rgba(180,83,9,0.08)", color: BRAND.amber, border: "1px solid rgba(180,83,9,0.2)" }}>
              <BookOpen size={13} />
              {showSplitView ? "Single view" : "Split view"}
            </button>
          )}

          <button onClick={refresh} disabled={promptsLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
            style={{ background: "rgba(180,83,9,0.08)", color: BRAND.amber, border: "1px solid rgba(180,83,9,0.2)" }}>
            <RefreshCw size={13} className={promptsLoading ? "animate-spin" : ""} />
            {promptsLoading ? "Generating..." : "New Prompts"}
          </button>
        </div>
      </div>

      {/* ── Incoming text banner ── */}
      {incomingMeta && (
        <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3"
          style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)" }}>
          <BookOpen size={15} style={{ color: BRAND.goldDark, flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: BRAND.brown }}>
              Loaded from Compose: <strong>{incomingMeta.chapterTitle}</strong>
              {incomingMeta.projectTitle && ` — ${incomingMeta.projectTitle}`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(120,53,15,0.6)" }}>
              Edit the text below, analyze it, then send the revised version back to your manuscript.
            </p>
          </div>
        </div>
      )}

      {/* ── Prompts loading state ── */}
      {promptsLoading && Object.keys(prompts).length === 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
          style={{ background: "rgba(217,119,6,0.08)", border: "1px solid rgba(217,119,6,0.2)", color: BRAND.amber }}>
          <Sparkles size={13} className="animate-pulse" />
          AI is generating fresh prompts for you...
        </div>
      )}

      {/* ── Craft accordion ── */}
      <div className="space-y-2 mb-8">
        {ESSAY_PARTS.map((part, i) => (
          <div key={i} className="rounded-2xl overflow-hidden transition-all"
            style={{
              border: open === i ? `1px solid ${part.color}50` : "1px solid #fde68a",
              background: open === i ? "#fff" : "#fffbeb",
            }}>
            <button onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: part.color }} />
                <span className="font-semibold text-slate-800"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px" }}>
                  {part.title}
                </span>
              </div>
              {open === i
                ? <ChevronUp size={15} style={{ color: part.color }} />
                : <ChevronDown size={15} className="text-slate-300" />}
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{part.content}</p>
                <div className="rounded-xl px-4 py-3 text-sm italic"
                  style={{ background: `${part.color}10`, borderLeft: `3px solid ${part.color}`, color: "#374151" }}>
                  <strong style={{ color: part.color }}>Try this:</strong>{" "}
                  {prompts[part.title] || (
                    <span className="text-slate-400">
                      {promptsLoading ? "Generating..." : "Loading prompt..."}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Split view OR single view ── */}
      {showSplitView && feedback ? (
        /* SPLIT VIEW — essay left, feedback right */
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Left — editable essay */}
          <div className="rounded-3xl p-6 flex flex-col"
            style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}30` }}>
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} style={{ color: BRAND.amber }} />
              <h2 className="font-bold text-slate-800"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px" }}>
                Your Draft
              </h2>
              <span className="text-xs text-slate-400 ml-auto">Edit here</span>
            </div>
            <textarea value={essay} onChange={e => setEssay(e.target.value)}
              placeholder="Your essay text..." rows={16}
              className="w-full flex-1 rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "15px",
                lineHeight: "1.7",
                border: `1px solid ${BRAND.gold}25`,
                background: "white",
              }} />
          </div>

          {/* Right — AI feedback read only */}
          <div className="rounded-3xl p-6 flex flex-col"
            style={{ background: "white", border: `1px solid ${BRAND.gold}20` }}>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} style={{ color: BRAND.gold }} />
              <h2 className="font-bold text-slate-800"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px" }}>
                AI Feedback
              </h2>
              <span className="text-xs text-slate-400 ml-auto">Read only</span>
            </div>
            <div className="flex-1 overflow-y-auto text-slate-700 leading-relaxed whitespace-pre-wrap"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "14px",
                lineHeight: "1.8",
                maxHeight: "420px",
              }}>
              {feedback}
            </div>
            {/* Re-analyze in split view */}
            <button onClick={analyze} disabled={loading || !essay.trim()}
              className="mt-4 w-full py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
              style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
              {loading ? "Re-analyzing..." : "Re-analyze"}
            </button>
          </div>
        </div>
      ) : (
        /* SINGLE VIEW */
        <div className="rounded-3xl p-6 mb-6"
          style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}30` }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} style={{ color: BRAND.gold }} />
            <h2 className="font-bold text-slate-800"
              style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "18px" }}>
              AI Essay Analysis
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {incomingMeta
              ? "Your chapter has been loaded below. Edit it here, then analyze it for structural feedback."
              : "Paste your essay or draft for specific structural feedback. The prompts above will also update to reference your work."}
          </p>
          <textarea value={essay} onChange={e => setEssay(e.target.value)}
            placeholder="Paste your essay or draft here..."
            rows={12}
            className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "16px",
              lineHeight: "1.7",
              border: `1px solid ${BRAND.gold}30`,
              background: "white",
            }} />

          {/* Feedback in single view */}
          {feedback && (
            <div className="mt-6 rounded-2xl px-5 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
              style={{
                background: "white",
                border: `1px solid ${BRAND.gold}20`,
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: "15px",
                lineHeight: "1.75",
              }}>
              {feedback}
            </div>
          )}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex items-center flex-wrap gap-3">
        <button onClick={analyze} disabled={loading || !essay.trim()}
          className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
          {loading ? "Analyzing..." : "Analyze Essay"}
        </button>

        <button onClick={() => setShowSend(true)} disabled={!essay.trim() && !feedback.trim()}
          className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-40 inline-flex items-center gap-1.5"
          style={{ background: "linear-gradient(135deg, #1e3a5f, #2d4a6f)", color: "#fff" }}>
          Send to Manuscript
        </button>

        {(essay || feedback) && (
          <button onClick={handleStartOver}
            className="px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "rgba(120,53,15,0.07)", color: BRAND.brown, border: "1px solid rgba(120,53,15,0.15)" }}>
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}
