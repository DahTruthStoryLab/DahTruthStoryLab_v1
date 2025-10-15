// src/pages/Proof.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";

/* ---------- Theme ---------- */
const theme = {
  bg: "var(--brand-bg)",
  surface: "var(--brand-surface, var(--brand-white))",
  border: "var(--brand-border)",
  borderStrong: "var(--brand-border-strong)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  primary: "var(--brand-primary)",
  white: "var(--brand-white)",
} as const;

/* ---------- Styles ---------- */
const styles = {
  outer: {
    maxWidth: 1200,
    margin: "32px auto",
    background: "var(--brand-white)",
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(2,20,40,.08)",
    overflow: "hidden",
  } as React.CSSProperties,
  inner: { padding: "20px 24px" } as React.CSSProperties,
  sectionShell: { maxWidth: 1120, margin: "0 auto" } as React.CSSProperties,
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  btn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "none",
    background: theme.accent,
    color: theme.white,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s ease",
  } as React.CSSProperties,
} as const;

/* ---------- Helper to strip HTML ---------- */
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

/* ---------- Component ---------- */
export default function Proof(): JSX.Element {
  const navigate = useNavigate();
  const [proofResults, setProofResults] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  // Mock manuscript text - in real app, you'd pass this via props/context/state
  const mockManuscriptText = `
    The morning held the kind of quiet that asks for a first sentence...
    Change arrived softly, a hinge on a well-oiled door...
    They counted the hours by the cooling of the tea...
  `.trim();

  const wordCount = useMemo(
    () => mockManuscriptText.split(/\s+/).filter(Boolean).length,
    [mockManuscriptText]
  );

  function runLocalChecks() {
    const issues: string[] = [];
    const compiled = mockManuscriptText;

    if (compiled.match(/ {2,}/)) issues.push("Multiple consecutive spaces found.");
    if (compiled.match(/[""]/) && !compiled.match(/['']/))
      issues.push("Smart quotes present; ensure consistency of curly quotes.");
    if (compiled.match(/--/)) issues.push("Double hyphen found; consider an em dash (—) or a period.");
    
    const longParas = compiled.split("\n\n").filter((p) => p.split(/\s+/).length > 250).length;
    if (longParas) issues.push(`${longParas} very long paragraph(s); consider breaking them up.`);
    
    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  async function runAIChecks() {
    setAiBusy(true);
    const compiled = mockManuscriptText;
    const suggestions: string[] = [];

    // Simulated AI checks
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

    if (compiled.match(/\bi\b(?![a-zA-Z])/g)) suggestions.push("Pronoun 'I' should be capitalized.");
    if (compiled.match(/\s[,.!?;:]/g)) suggestions.push("Punctuation spacing: remove spaces before punctuation marks.");
    if (compiled.match(/\bvery\b/gi)) suggestions.push("Style: Consider replacing 'very' with stronger wording.");
    if (compiled.length < 100) suggestions.push("Manuscript seems short—consider expanding content.");

    runLocalChecks();
    setProofResults((prev) => [...prev, ...suggestions]);
    setAiBusy(false);
  }

  function runGrammarCheck() {
    const issues: string[] = [];
    const text = mockManuscriptText;

    // Basic grammar checks
    if (text.match(/\btheir\b.*\bthere\b|\bthere\b.*\btheir\b/i)) {
      issues.push("Possible their/there confusion detected.");
    }
    if (text.match(/\bits\b.*\bit's\b|\bit's\b.*\bits\b/i)) {
      issues.push("Possible its/it's confusion detected.");
    }

    setProofResults(issues.length ? issues : ["No grammar issues detected."]);
  }

  function runStyleAnalysis() {
    const issues: string[] = [];
    const text = mockManuscriptText;

    // Style checks
    const adverbs = text.match(/\b\w+ly\b/gi) || [];
    if (adverbs.length > 10) {
      issues.push(`Found ${adverbs.length} adverbs. Consider reducing for stronger prose.`);
    }

    const passiveVoice = text.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    if (passiveVoice.length > 5) {
      issues.push(`Found ${passiveVoice.length} instances of passive voice. Consider active voice.`);
    }

    setProofResults(issues.length ? issues : ["Style looks good!"]);
  }

  function runCharacterConsistency() {
    setProofResults([
      "Character consistency check placeholder - wire to your character database.",
      "Tip: Track character names, descriptions, and traits across chapters.",
    ]);
  }

  function runTimelineValidation() {
    setProofResults([
      "Timeline validation placeholder - wire to your timeline tracking system.",
      "Tip: Ensure dates, seasons, and event sequences remain consistent.",
    ]);
  }

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
      }}
    >
      <div style={styles.outer}>
        {/* Header */}
        <div
          style={{
            background: `linear-gradient(135deg, rgba(236, 72, 153, 0.65), rgba(249, 168, 212, 0.65))`,
            backdropFilter: "blur(12px)",
            color: theme.white,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => navigate("/publishing")}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: theme.white,
                padding: "10px 18px",
                fontSize: 15,
                borderRadius: 12,
                cursor: "pointer",
              }}
            >
              ← Back to Publishing
            </button>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Proof & Consistency</h1>
            </div>
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Stats Card */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 4 }}>Word Count</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>{wordCount.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 4 }}>Issues Found</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent }}>{proofResults.length}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button
                  style={styles.btnPrimary}
                  onClick={runAIChecks}
                  disabled={aiBusy}
                >
                  {aiBusy ? "Running AI Proof..." : "🤖 AI Proof (All Checks)"}
                </button>
              </div>
            </div>
          </div>

          {/* Check Buttons */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Quick Checks</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <button
                style={{
                  ...styles.btn,
                  ":hover": { background: theme.highlight },
                }}
                onClick={runGrammarCheck}
              >
                📝 Grammar Check
              </button>
              <button
                style={styles.btn}
                onClick={runStyleAnalysis}
              >
                ✨ Style Analysis
              </button>
              <button
                style={styles.btn}
                onClick={runCharacterConsistency}
              >
                👤 Character Consistency
              </button>
              <button
                style={styles.btn}
                onClick={runTimelineValidation}
              >
                📅 Timeline Validation
              </button>
              <button
                style={styles.btn}
                onClick={runLocalChecks}
              >
                🔍 Basic Issues
              </button>
            </div>
          </div>

          {/* Results */}
          {proofResults.length > 0 && (
            <div style={styles.glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: theme.text }}>Results</h3>
                <button
                  style={{ ...styles.btn, padding: "8px 12px", fontSize: 12 }}
                  onClick={() => setProofResults([])}
                >
                  Clear
                </button>
              </div>
              <ul style={{ margin: 0, paddingLeft: 24, color: theme.text, lineHeight: 1.8 }}>
                {proofResults.map((r, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Placeholder for no results */}
          {proofResults.length === 0 && (
            <div style={{ ...styles.glassCard, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 18, color: theme.subtext, marginBottom: 8 }}>
                No checks run yet
              </div>
              <div style={{ fontSize: 14, color: theme.subtext }}>
                Click any button above to analyze your manuscript
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
