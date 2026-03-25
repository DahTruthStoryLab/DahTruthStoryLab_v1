// src/pages/poetry/PoetryAIWorkshop.jsx
// Unified AI Poetry Workshop — all 4 tools in one page
// Route: /story-lab/poetry/craft  (update App routing as needed)

import React, { useState, useRef } from "react";
import {
  Wand2,
  Music,
  Heart,
  Sparkles,
  Copy,
  RotateCcw,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  runPoetryLineSuggestion,
  runPoetryRhymeMeter,
  runPoetryToneMood,
  runPoetryGenerate,
} from "../../lib/api";

/* ── Brand colors for Poetry module ── */
const PURPLE = "#7c3aed";
const GOLD = "#d4af37";
const PURPLE_DIM = "rgba(124,58,237,0.18)";
const PURPLE_BORDER = "rgba(124,58,237,0.35)";
const GOLD_DIM = "rgba(212,175,55,0.15)";

/* ── Tool definitions ── */
const TOOLS = [
  {
    id: "lines",
    label: "Line & Stanza",
    icon: ChevronRight,
    color: "#a78bfa",
    placeholder: "Paste your poem or the lines you have so far...",
    inputLabel: "Your Poem (in progress)",
    buttonText: "Suggest Next Lines",
    tip: "AI will offer 3 alternative continuations with craft notes.",
  },
  {
    id: "rhyme",
    label: "Rhyme & Meter",
    icon: Music,
    color: "#f9a8d4",
    placeholder: "Paste your complete or draft poem here...",
    inputLabel: "Your Poem",
    buttonText: "Analyze Sound & Meter",
    tip: "AI will map rhyme scheme, metrical patterns, and sonic devices.",
  },
  {
    id: "tone",
    label: "Tone & Mood",
    icon: Heart,
    color: "#67e8f9",
    placeholder: "Paste your poem here for emotional analysis...",
    inputLabel: "Your Poem",
    buttonText: "Read the Emotional Landscape",
    tip: "AI will surface tone, mood, imagery clusters, and emotional arc.",
  },
  {
    id: "generate",
    label: "Generate Poem",
    icon: Sparkles,
    color: GOLD,
    placeholder:
      "Describe what you want: a subject, emotion, image, form, voice, or situation...\n\nExample: Write a poem about a grandmother's hands, elegiac, free verse, grounded in memory and faith.",
    inputLabel: "Your Prompt",
    buttonText: "Write the Poem",
    tip: "AI will write a complete original poem plus a brief craft note.",
  },
];

/* ══════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════ */
export default function PoetryAIWorkshop() {
  const [activeTool, setActiveTool] = useState("lines");
  const [inputs, setInputs] = useState({ lines: "", rhyme: "", tone: "", generate: "" });
  const [responses, setResponses] = useState({ lines: "", rhyme: "", tone: "", generate: "" });
  const [loading, setLoading] = useState({ lines: false, rhyme: false, tone: false, generate: false });
  const [errors, setErrors] = useState({ lines: "", rhyme: "", tone: "", generate: "" });
  const [copied, setCopied] = useState(false);
  const responseRef = useRef(null);

  const tool = TOOLS.find((t) => t.id === activeTool);
  const Icon = tool.icon;

  /* ── API call dispatcher ── */
  async function handleRun() {
    const text = inputs[activeTool].trim();
    if (!text) return;

    setLoading((p) => ({ ...p, [activeTool]: true }));
    setErrors((p) => ({ ...p, [activeTool]: "" }));
    setResponses((p) => ({ ...p, [activeTool]: "" }));

    try {
      let res;
      switch (activeTool) {
        case "lines":
          res = await runPoetryLineSuggestion(text);
          break;
        case "rhyme":
          res = await runPoetryRhymeMeter(text);
          break;
        case "tone":
          res = await runPoetryToneMood(text);
          break;
        case "generate":
          res = await runPoetryGenerate(text);
          break;
        default:
          throw new Error("Unknown tool");
      }

      const output =
        res?.result ||
        res?.text ||
        res?.content?.[0]?.text ||
        (typeof res === "string" ? res : JSON.stringify(res, null, 2));

      setResponses((p) => ({ ...p, [activeTool]: output || "No response received." }));
      setTimeout(() => responseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e) {
      setErrors((p) => ({
        ...p,
        [activeTool]:
          e?.message?.includes("ANTHROPIC_API_KEY")
            ? "API key not configured in Lambda. See setup instructions."
            : e?.message || "Something went wrong. Please try again.",
      }));
    } finally {
      setLoading((p) => ({ ...p, [activeTool]: false }));
    }
  }

  function handleCopy() {
    const text = responses[activeTool];
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleClear() {
    setInputs((p) => ({ ...p, [activeTool]: "" }));
    setResponses((p) => ({ ...p, [activeTool]: "" }));
    setErrors((p) => ({ ...p, [activeTool]: "" }));
  }

  const isLoading = loading[activeTool];
  const response = responses[activeTool];
  const error = errors[activeTool];
  const inputVal = inputs[activeTool];

  /* ── Styles ── */
  const glassPanel = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "1rem",
    padding: "1.5rem",
  };

  return (
    <div style={{ minHeight: "100vh", padding: "1.5rem 1rem 3rem", fontFamily: "'EB Garamond', Georgia, serif" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: "0.75rem",
              background: PURPLE_DIM,
              border: `1px solid ${PURPLE_BORDER}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Wand2 size={20} style={{ color: PURPLE }} />
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 600, color: "#fff", margin: 0 }}>
            Poetry AI Workshop
          </h1>
        </div>
        <p style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.45)", margin: 0, paddingLeft: "3.25rem" }}>
          Four AI-powered tools for the poet at every stage of the work.
        </p>
      </div>

      {/* Tool Tabs */}
      <div
        style={{
          display: "flex", gap: "0.5rem", flexWrap: "wrap",
          marginBottom: "1.75rem",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "1rem",
          padding: "0.5rem",
        }}
      >
        {TOOLS.map((t) => {
          const TIcon = t.icon;
          const active = t.id === activeTool;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                padding: "0.55rem 1rem",
                borderRadius: "0.65rem",
                border: active ? `1px solid ${t.color}50` : "1px solid transparent",
                background: active ? `${t.color}18` : "transparent",
                color: active ? t.color : "rgba(255,255,255,0.5)",
                fontSize: "0.88rem",
                fontWeight: active ? 700 : 500,
                fontFamily: "'EB Garamond', Georgia, serif",
                cursor: "pointer",
                transition: "all 0.15s ease",
                whiteSpace: "nowrap",
              }}
            >
              <TIcon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* LEFT — Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={glassPanel}>
            {/* Tool tip */}
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: "0.6rem",
                padding: "0.65rem 0.9rem",
                background: GOLD_DIM,
                border: `1px solid ${GOLD}30`,
                borderRadius: "0.6rem",
                marginBottom: "1.1rem",
              }}
            >
              <Icon size={14} style={{ color: GOLD, marginTop: 2, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "0.83rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                {tool.tip}
              </p>
            </div>

            {/* Label */}
            <label
              style={{
                display: "block", fontSize: "0.8rem", fontWeight: 600,
                color: "rgba(255,255,255,0.5)", letterSpacing: "0.07em",
                textTransform: "uppercase", marginBottom: "0.5rem",
              }}
            >
              {tool.inputLabel}
            </label>

            {/* Textarea */}
            <textarea
              value={inputVal}
              onChange={(e) => setInputs((p) => ({ ...p, [activeTool]: e.target.value }))}
              placeholder={tool.placeholder}
              rows={14}
              style={{
                width: "100%", resize: "vertical",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "0.65rem",
                color: "#fff",
                fontSize: "0.97rem",
                lineHeight: 1.75,
                padding: "0.85rem 1rem",
                fontFamily: "'EB Garamond', Georgia, serif",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {/* Buttons */}
            <div style={{ display: "flex", gap: "0.65rem", marginTop: "0.9rem" }}>
              <button
                onClick={handleRun}
                disabled={isLoading || !inputVal.trim()}
                style={{
                  flex: 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  padding: "0.7rem 1rem",
                  borderRadius: "0.65rem",
                  border: "none",
                  background: inputVal.trim() && !isLoading
                    ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE}cc)`
                    : "rgba(255,255,255,0.07)",
                  color: inputVal.trim() && !isLoading ? "#fff" : "rgba(255,255,255,0.3)",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  fontFamily: "'EB Garamond', Georgia, serif",
                  cursor: inputVal.trim() && !isLoading ? "pointer" : "not-allowed",
                  transition: "all 0.15s ease",
                }}
              >
                {isLoading ? (
                  <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Working...</>
                ) : (
                  <><Wand2 size={15} /> {tool.buttonText}</>
                )}
              </button>

              <button
                onClick={handleClear}
                disabled={isLoading}
                style={{
                  padding: "0.7rem 0.9rem",
                  borderRadius: "0.65rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.45)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                title="Clear"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT — Response */}
        <div ref={responseRef} style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              ...glassPanel,
              flex: 1,
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
              borderColor: response ? PURPLE_BORDER : "rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{
                  fontSize: "0.8rem", fontWeight: 600,
                  color: response ? GOLD : "rgba(255,255,255,0.3)",
                  letterSpacing: "0.07em", textTransform: "uppercase",
                }}
              >
                {response ? "AI Response" : "Response Panel"}
              </span>

              {response && (
                <button
                  onClick={handleCopy}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    padding: "0.35rem 0.8rem",
                    borderRadius: "0.5rem",
                    border: `1px solid ${GOLD}40`,
                    background: GOLD_DIM,
                    color: GOLD,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "'EB Garamond', Georgia, serif",
                  }}
                >
                  <Copy size={12} />
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div
                style={{
                  padding: "0.85rem 1rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.3)",
                  borderRadius: "0.6rem",
                  color: "#fca5a5",
                  fontSize: "0.88rem",
                  lineHeight: 1.6,
                }}
              >
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && !response && (
              <div
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "1rem",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                <Loader2 size={28} style={{ color: PURPLE, animation: "spin 1s linear infinite" }} />
                <p style={{ margin: 0, fontSize: "0.9rem" }}>The AI is reading your poem...</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !response && !error && (
              <div
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  color: "rgba(255,255,255,0.2)",
                }}
              >
                <Icon size={36} style={{ color: "rgba(255,255,255,0.1)" }} />
                <p style={{ margin: 0, fontSize: "0.9rem", textAlign: "center", maxWidth: 220 }}>
                  Your AI response will appear here.
                </p>
              </div>
            )}

            {/* Response text */}
            {response && (
              <div
                style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.88)",
                  fontSize: "0.97rem",
                  lineHeight: 1.85,
                  whiteSpace: "pre-wrap",
                  overflowY: "auto",
                }}
              >
                {response}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spin keyframes */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        textarea:focus { border-color: ${PURPLE_BORDER} !important; box-shadow: 0 0 0 2px ${PURPLE}22; }
        textarea::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>
    </div>
  );
}
