// src/pages/storylab/poetry/CraftLab.jsx
import React, { useState } from "react";
import { PenTool, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const BRAND = { navy: "#1e3a5f", gold: "#d4af37", mauve: "#b8a9c9" };

const CRAFT_TOPICS = [
  {
    title: "Line Breaks",
    content: "The line break is the poet's most powerful tool. It controls breath, emphasis, and surprise. Break where meaning pivots — not just where the sentence ends. A line ending on a verb creates tension. A line ending on a preposition pulls the reader forward.",
    prompt: "Take one of your stanzas and break every line differently. What changes?",
  },
  {
    title: "Sound & Music",
    content: "Poems are heard even when read silently. Listen for assonance (vowel echo), consonance (consonant repetition), and the rhythm of stressed and unstressed syllables. Sound should reinforce meaning — hard consonants for conflict, open vowels for grief or awe.",
    prompt: "Read your poem aloud. Circle every word where sound and meaning align. Where do they clash?",
  },
  {
    title: "Metaphor & Image",
    content: "The best metaphors are surprising yet inevitable. Avoid dead metaphors (heart of stone, sea of troubles). Build images that are concrete and specific — not 'sadness' but 'the drawer I haven't opened since.' Images do emotional work that abstractions cannot.",
    prompt: "Replace every abstract word in your poem with a concrete image.",
  },
  {
    title: "Tension & Turn",
    content: "Every strong poem has a turn — a volta — where something shifts. It may be a reversal, a revelation, or a deepening. The tension before the turn is what makes the turn land. Ask: where does your poem surprise itself?",
    prompt: "Identify the turn in your poem. If you can't find one, write it.",
  },
  {
    title: "Clarity & Compression",
    content: "Poetry earns its density. Every word must justify its place. Cut adjectives that explain rather than show. Cut lines that summarize what the poem has already enacted. What remains should feel inevitable.",
    prompt: "Cut 20% of your poem's words without losing its meaning. What do you notice?",
  },
];

export default function CraftLab() {
  const [open, setOpen] = useState(null);
  const [poem, setPoem] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function analyzeCraft() {
    if (!poem.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a master poetry editor. Analyze this poem for craft elements: line breaks, sound, imagery, tension, and compression. Be specific and direct. Point to exact lines. Do not be generic.\n\nPoem:\n${poem}`
          }]
        })
      });
      const data = await res.json();
      setFeedback(data.content?.[0]?.text || "No response received.");
    } catch (e) {
      setFeedback("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-2">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)" }}>
          <PenTool size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>Craft Lab</h1>
          <p className="text-sm text-slate-500">Line breaks, sound, metaphor, syntax, tension, clarity.</p>
        </div>
      </div>

      {/* Craft Topics */}
      <div className="mb-8 space-y-2">
        {CRAFT_TOPICS.map((topic, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
            >
              <span className="font-semibold text-slate-800">{topic.title}</span>
              {open === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {open === i && (
              <div className="px-5 pb-5">
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{topic.content}</p>
                <div className="rounded-lg px-4 py-3 text-sm italic text-slate-700" style={{ background: `${BRAND.mauve}20`, borderLeft: `3px solid ${BRAND.mauve}` }}>
                  <strong>Try this:</strong> {topic.prompt}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Craft Analysis */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Sparkles size={16} style={{ color: BRAND.gold }} />
          AI Craft Analysis
        </h2>
        <p className="text-xs text-slate-500 mb-4">Paste your poem and get specific craft feedback.</p>
        <textarea
          value={poem}
          onChange={e => setPoem(e.target.value)}
          placeholder="Paste your poem here..."
          rows={8}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px" }}
        />
        <button
          onClick={analyzeCraft}
          disabled={loading || !poem.trim()}
          className="mt-3 px-5 py-2 rounded-xl text-white text-sm font-semibold transition disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)" }}
        >
          {loading ? "Analyzing..." : "Analyze Craft"}
        </button>
        {feedback && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

