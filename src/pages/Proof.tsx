// src/pages/Proof.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";

/* ---------- Where to call your backend ---------- */
/** If you proxy /api -> API Gateway in dev/hosting, keep "/api".
 *  Otherwise set your deployed API Gateway base URL, e.g.:
 *  const API_BASE = "https://572brq9d46.execute-api.us-east-1.amazonaws.com/dev";
 */
const API_BASE = "/api";

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
    transition: "background-color 0.2s ease, transform 0.05s ease",
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
    transition: "opacity 0.2s ease",
  } as React.CSSProperties,
} as const;

/* ---------- Helpers ---------- */
function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").trim();
}

/* Light types only for loading */
type ChapterLocal = { id: string; title: string; included?: boolean; text?: string; textHTML?: string };
type MatterLocal = { toc?: boolean; acknowledgments?: string; aboutAuthor?: string; notes?: string };
type MetaLocal = { title?: string; author?: string; year?: string };

/* ---------- Component ---------- */
export default function Proof(): JSX.Element {
  const navigate = useNavigate();
  const [proofResults, setProofResults] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);

  // Load manuscript saved by Publishing.tsx
  const { manuscriptText, meta } = useMemo(() => {
    let chapters: ChapterLocal[] = [];
    let matter: MatterLocal = {};
    let meta: MetaLocal = {};

    try {
      chapters = JSON.parse(localStorage.getItem("dt_publishing_chapters") || "[]");
    } catch {}
    try {
      matter = JSON.parse(localStorage.getItem("dt_publishing_matter") || "{}");
    } catch {}
    try {
      meta = JSON.parse(localStorage.getItem("dt_publishing_meta") || "{}");
    } catch {}

    const included = (chapters || []).filter((c) => c.included !== false);
    const pieces: string[] = [];

    // Optional front matter
    if (meta?.title || meta?.author || meta?.year) {
      pieces.push([meta?.title, meta?.author ? `by ${meta.author}` : "", meta?.year].filter(Boolean).join("\n"));
    }

    // Chapters
    included.forEach((c) => {
      const body = c.textHTML ? stripHtml(c.textHTML) : c.text || "";
      pieces.push([c.title, body].filter(Boolean).join("\n"));
    });

    // Optional back matter
    if (matter?.acknowledgments) pieces.push("Acknowledgments\n" + matter.acknowledgments);
    if (matter?.aboutAuthor) pieces.push("About the Author\n" + matter.aboutAuthor);
    if (matter?.notes) pieces.push("Notes\n" + matter.notes);

    const manuscriptText = pieces.join("\n\n").trim();
    return { manuscriptText, meta };
  }, []);

  const wordCount = useMemo(
    () => (manuscriptText ? manuscriptText.split(/\s+/).filter(Boolean).length : 0),
    [manuscriptText]
  );

  /* ---------- Local checks ---------- */
  function runLocalChecks() {
    const issues: string[] = [];
    const compiled = manuscriptText;

    if (!compiled) {
      setProofResults(["No manuscript found. Open Publishing and click Save (or type to autosave)."]);
      return;
    }

    if (compiled.match(/ {2,}/)) issues.push("Multiple consecutive spaces found.");
    if (/[“”]/.test(compiled) && !/[‘’]/.test(compiled))
      issues.push("Smart quotes present; ensure consistency of curly quotes.");
    if (/--/.test(compiled)) issues.push("Double hyphen found; consider an em dash (—) or a period.");

    const longParas = compiled.split(/\n\n+/).filter((p) => p.trim().split(/\s+/).length > 250).length;
    if (longParas) issues.push(`${longParas} very long paragraph(s); consider breaking them up.`);

    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  /* ---------- AI checks (calls your API) ---------- */
// put this near the top of Proof.tsx
const API_URL = "https://572brq9d46.execute-api.us-east-1.amazonaws.com/dev/ai/proof";

async function runAIChecks() {
  setAiBusy(true);
  const compiled = manuscriptText;

  if (!compiled) {
    setProofResults(["No manuscript found. Open Publishing and click Save (or type to autosave)."]);
    setAiBusy(false);
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: compiled })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json(); // { ok: true, received: "...", suggestions: [...] }

    // keep local checks + add API suggestions
    const local: string[] = [];
    if (/ {2,}/.test(compiled)) local.push("Multiple consecutive spaces found.");
    if (/--/.test(compiled)) local.push("Double hyphen found; consider an em dash (—) or a period.");

    const apiSuggestions: string[] = Array.isArray(data?.suggestions) ? data.suggestions : [];
    setProofResults([...local, ...apiSuggestions]);

  } catch (e: any) {
    setProofResults([`AI check failed: ${e.message}. Try again or check API Gateway logs.`]);
  } finally {
    setAiBusy(false);
  }
}

  function runGrammarCheck() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults(["No manuscript found. Open Publishing and click Save (or type to autosave)."]);
      return;
    }

    const issues: string[] = [];
    if (/\btheir\b.*\bthere\b|\bthere\b.*\btheir\b/i.test(compiled)) {
      issues.push("Possible their/there confusion detected.");
    }
    if (/\bits\b.*\bit's\b|\bit's\b.*\bits\b/i.test(compiled)) {
      issues.push("Possible its/it's confusion detected.");
    }
    setProofResults(issues.length ? issues : ["No grammar issues detected."]);
  }

  function runStyleAnalysis() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults(["No manuscript found. Open Publishing and click Save (or type to autosave)."]);
      return;
    }

    const issues: string[] = [];
    const adverbs = compiled.match(/\b\w+ly\b/gi) || [];
    if (adverbs.length > 20) issues.push(`Found ${adverbs.length} adverbs. Consider reducing for stronger prose.`);

    const passiveVoice = compiled.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    if (passiveVoice.length > 10) issues.push(`Found ${passiveVoice.length} instances of passive voice. Consider active voice.`);

    setProofResults(issues.length ? issues : ["Style looks good!"]);
  }

  function runCharacterConsistency() {
    const msg = [
      "Character consistency placeholder — wire this to your character bible.",
      "Tip: Track names, traits, ages, and relationships across chapters.",
    ];
    setProofResults(msg);
  }

  function runTimelineValidation() {
    const msg = [
      "Timeline validation placeholder — wire to your scene/event tracker.",
      "Tip: Check dates, seasons, time-of-day, and age progressions.",
    ];
    setProofResults(msg);
  }

  return (
    <PageShell style={{ background: theme.bg, minHeight: "100vh" }}>
      <div style={styles.outer}>
        {/* Header — rose/pink (no dark/blue) */}
        <div
          style={{
            background: `linear-gradient(135deg, rgba(236,72,153,0.65), rgba(249,168,212,0.65))`,
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
                background: "rgba(255,255,255,0.22)",
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
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Proof &amp; Consistency</h1>
            </div>
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Stats Card */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 4 }}>Word Count</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.primary }}>
                  {wordCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: theme.subtext, marginBottom: 4 }}>Issues Listed</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: theme.accent }}>{proofResults.length}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button style={styles.btnPrimary} onClick={runAIChecks} disabled={aiBusy}>
                  {aiBusy ? "Running AI Proof…" : "🤖 AI Proof (All Checks)"}
                </button>
              </div>
            </div>
          </div>

          {/* Check Buttons */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Quick Checks</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <button style={styles.btn} onClick={runGrammarCheck}>📝 Grammar Check</button>
              <button style={styles.btn} onClick={runStyleAnalysis}>✨ Style Analysis</button>
              <button style={styles.btn} onClick={runCharacterConsistency}>👤 Character Consistency</button>
              <button style={styles.btn} onClick={runTimelineValidation}>📅 Timeline Validation</button>
              <button style={styles.btn} onClick={runLocalChecks}>🔍 Basic Issues</button>
            </div>
          </div>

          {/* Results */}
          {proofResults.length > 0 ? (
            <div style={styles.glassCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, color: theme.text }}>Results</h3>
                <button style={{ ...styles.btn, padding: "8px 12px", fontSize: 12 }} onClick={() => setProofResults([])}>
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
          ) : (
            <div style={{ ...styles.glassCard, textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div style={{ fontSize: 18, color: theme.subtext, marginBottom: 8 }}>No checks run yet</div>
              <div style={{ fontSize: 14, color: theme.subtext }}>Click any button above to analyze your manuscript</div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
