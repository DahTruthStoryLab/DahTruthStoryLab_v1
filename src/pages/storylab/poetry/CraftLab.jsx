// src/pages/storylab/poetry/CraftLab.jsx
// Dynamic AI prompts — regenerate on load, refresh button, and text-aware after Analyze

import React, { useState } from "react";
import { PenTool, Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { runAssistant } from "../../../lib/api";
import { useDynamicPrompts } from "../../../hooks/useDynamicPrompts";

const BRAND = {
  purple:      "#4c1d95",
  purpleLight: "#7c3aed",
  purplePale:  "#ede9fe",
  gold:        "#d4af37",
  goldDark:    "#b8960c",
};

const CRAFT_TOPICS = [
  {
    title: "Line Breaks",
    color: "#a78bfa",
    content: "The line break is the poet's most powerful tool. It controls breath, emphasis, and surprise. Break where meaning pivots — not just where the sentence ends. A line ending on a verb creates tension. A line ending on a preposition pulls the reader forward.",
  },
  {
    title: "Sound & Music",
    color: "#f9a8d4",
    content: "Poems are heard even when read silently. Listen for assonance (vowel echo), consonance (consonant repetition), and the rhythm of stressed and unstressed syllables. Sound should reinforce meaning — hard consonants for conflict, open vowels for grief or awe.",
  },
  {
    title: "Metaphor & Image",
    color: BRAND.gold,
    content: "The best metaphors are surprising yet inevitable. Avoid dead metaphors. Build images that are concrete and specific — not 'sadness' but 'the drawer I haven't opened since.' Images do emotional work that abstractions cannot.",
  },
  {
    title: "Tension & Turn",
    color: "#67e8f9",
    content: "Every strong poem has a turn — a volta — where something shifts. It may be a reversal, a revelation, or a deepening. The tension before the turn is what makes the turn land. Ask: where does your poem surprise itself?",
  },
  {
    title: "Clarity & Compression",
    color: "#6ee7b7",
    content: "Poetry earns its density. Every word must justify its place. Cut adjectives that explain rather than show. Cut lines that summarize what the poem has already enacted. What remains should feel inevitable.",
  },
];

const TOPIC_NAMES = CRAFT_TOPICS.map(t => t.title);

export default function CraftLab() {
  const [open, setOpen]         = useState(null);
  const [poem, setPoem]         = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading]   = useState(false);

  const { prompts, loading: promptsLoading, refresh, updateWithText } = useDynamicPrompts({
    module: "Craft Lab",
    topics: TOPIC_NAMES,
    genre:  "poetry",
  });

  async function analyzeCraft() {
    if (!poem.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      const instructions =
        "You are a master poetry editor. Analyze this poem for craft elements: " +
        "line breaks, sound, imagery, tension, and compression. " +
        "Be specific and direct. Point to exact lines. Do not be generic.";
      const res = await runAssistant(poem, "clarify", instructions, "anthropic");
      setFeedback(res?.result || res?.text || "No response received.");
      // Update all prompts to reference the writer's actual poem
      updateWithText(poem);
    } catch {
      setFeedback("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.purpleLight})` }}>
            <PenTool size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900"
              style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>
              Craft Lab
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Line breaks · Sound · Metaphor · Tension · Compression
            </p>
          </div>
        </div>

        {/* Refresh prompts button */}
        <button
          onClick={refresh}
          disabled={promptsLoading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
          style={{ background: `rgba(124,58,237,0.08)`, color: BRAND.purpleLight, border: `1px solid rgba(124,58,237,0.2)` }}
          title="Regenerate prompts">
          <RefreshCw size={13} className={promptsLoading ? "animate-spin" : ""} />
          {promptsLoading ? "Generating..." : "New Prompts"}
        </button>
      </div>

      {/* ── Prompts loading state ── */}
      {promptsLoading && Object.keys(prompts).length === 0 && (
        <div className="mb-6 px-4 py-3 rounded-xl text-xs flex items-center gap-2"
          style={{ background: `rgba(124,58,237,0.06)`, border: `1px solid rgba(124,58,237,0.15)`, color: BRAND.purpleLight }}>
          <Sparkles size={13} className="animate-pulse" />
          AI is generating fresh prompts for you...
        </div>
      )}

      {/* ── Accordion sections ── */}
      <div className="space-y-2 mb-10">
        {CRAFT_TOPICS.map((topic, i) => (
          <div key={i}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              border: open === i ? `1px solid ${topic.color}50` : "1px solid #e8e0ff",
              background: open === i ? "#fff" : "#faf8ff",
              boxShadow: open === i ? `0 4px 20px ${topic.color}15` : "none",
            }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left transition">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: topic.color }} />
                <span className="font-semibold text-slate-800"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px" }}>
                  {topic.title}
                </span>
              </div>
              {open === i
                ? <ChevronUp size={15} style={{ color: topic.color }} />
                : <ChevronDown size={15} className="text-slate-300" />}
            </button>

            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{topic.content}</p>
                <div className="rounded-xl px-4 py-3 text-sm italic"
                  style={{ background: `${topic.color}10`, borderLeft: `3px solid ${topic.color}`, color: "#374151" }}>
                  <strong style={{ color: topic.color }}>Try this:</strong>{" "}
                  {prompts[topic.title] || (
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

      {/* ── AI Craft Analysis ── */}
      <div className="rounded-3xl p-6"
        style={{ background: `linear-gradient(135deg, ${BRAND.purple}08, ${BRAND.purpleLight}05)`, border: `1px solid ${BRAND.purpleLight}20` }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: BRAND.gold }} />
          <h2 className="font-bold text-slate-800"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "18px" }}>
            AI Craft Analysis
          </h2>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Paste your poem for specific, line-level craft feedback. The prompts above will also update to reference your work.
        </p>
        <textarea
          value={poem}
          onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem here..."
          rows={8}
          className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none focus:ring-2"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: "16px",
            lineHeight: "1.7",
            border: `1px solid ${BRAND.purpleLight}25`,
            background: "white",
          }}
        />
        <button
          onClick={analyzeCraft}
          disabled={loading || !poem.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.purpleLight})` }}>
          {loading ? "Analyzing..." : "Analyze Craft"}
        </button>

        {feedback && (
          <div className="mt-6 rounded-2xl px-5 py-5 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{
              background: "white",
              border: `1px solid ${BRAND.purpleLight}20`,
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "15px",
              lineHeight: "1.75",
            }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}
