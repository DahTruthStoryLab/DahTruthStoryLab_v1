// src/pages/Proof.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import {
  runGrammar,
  runStyle,
  runReadability,
  runAssistant,
} from "../lib/api"; // ✅ use existing AI helpers

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
type ChapterLocal = {
  id: string;
  title: string;
  included?: boolean;
  text?: string;
  textHTML?: string;
};
type MatterLocal = {
  toc?: boolean;
  acknowledgments?: string;
  aboutAuthor?: string;
  notes?: string;
};
type MetaLocal = { title?: string; author?: string; year?: string };

/* ---------- Component ---------- */
export default function Proof(): JSX.Element {
  const navigate = useNavigate();

  const [proofResults, setProofResults] = useState<string[]>([]);
  const [aiBusy, setAiBusy] = useState(false);
  const [provider, setProvider] = useState<"openai" | "anthropic">("openai");

  // Load manuscript saved by Publishing.tsx
  const { manuscriptText, meta } = useMemo(() => {
    let chapters: ChapterLocal[] = [];
    let matter: MatterLocal = {};
    let meta: MetaLocal = {};

    try {
      chapters = JSON.parse(
        localStorage.getItem("dt_publishing_chapters") || "[]"
      );
    } catch {}
    try {
      matter = JSON.parse(
        localStorage.getItem("dt_publishing_matter") || "{}"
      );
    } catch {}
    try {
      meta = JSON.parse(localStorage.getItem("dt_publishing_meta") || "{}");
    } catch {}

    const included = (chapters || []).filter((c) => c.included !== false);
    const pieces: string[] = [];

    // Optional front matter
    if (meta?.title || meta?.author || meta?.year) {
      pieces.push(
        [meta?.title, meta?.author ? `by ${meta.author}` : "", meta?.year]
          .filter(Boolean)
          .join("\n")
      );
    }

    // Chapters
    included.forEach((c) => {
      const body = c.textHTML ? stripHtml(c.textHTML) : c.text || "";
      pieces.push([c.title, body].filter(Boolean).join("\n"));
    });

    // Optional back matter
    if (matter?.acknowledgments)
      pieces.push("Acknowledgments\n" + matter.acknowledgments);
    if (matter?.aboutAuthor)
      pieces.push("About the Author\n" + matter.aboutAuthor);
    if (matter?.notes) pieces.push("Notes\n" + matter.notes);

    const manuscriptText = pieces.join("\n\n").trim();
    return { manuscriptText, meta };
  }, []);

  const wordCount = useMemo(
    () =>
      manuscriptText
        ? manuscriptText.split(/\s+/).filter(Boolean).length
        : 0,
    [manuscriptText]
  );

  /* ---------- Local baseline checks ---------- */
  function runLocalChecks() {
    const issues: string[] = [];
    const compiled = manuscriptText;

    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    if (compiled.match(/ {2,}/))
      issues.push("Multiple consecutive spaces found.");
    if (/[“”]/.test(compiled) && !/[‘’]/.test(compiled))
      issues.push("Smart quotes present; ensure consistency of curly quotes.");
    if (/--/.test(compiled))
      issues.push("Double hyphen found; consider an em dash (—) or a period.");

    const longParas = compiled
      .split(/\n\n+/)
      .filter((p) => p.trim().split(/\s+/).length > 250).length;
    if (longParas)
      issues.push(
        `${longParas} very long paragraph(s); consider breaking them up.`
      );

    setProofResults(issues.length ? issues : ["No basic issues found."]);
  }

  /* ---------- AI-backed checks using lib/api ---------- */

  function normalizeAiText(res: any, fallbackLabel: string): string {
    const text =
      res?.result || res?.text || res?.output || (typeof res === "string" ? res : "");
    if (!text) {
      return `${fallbackLabel}: AI returned an empty response.`;
    }
    return String(text).trim();
  }

  async function runGrammarCheck() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    try {
      setAiBusy(true);
      const res = await runGrammar(compiled, provider);
      const text = normalizeAiText(res, "Grammar check");
      const lines = text.split("\n").filter((l) => l.trim());
      setProofResults(lines.length ? lines : ["No grammar issues detected."]);
    } catch (e: any) {
      console.error("Grammar check error:", e);
      setProofResults([
        `Grammar check failed: ${e?.message || "Unknown error."}`,
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  async function runStyleAnalysis() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    try {
      setAiBusy(true);
      const res = await runStyle(compiled, provider);
      const text = normalizeAiText(res, "Style analysis");
      const lines = text.split("\n").filter((l) => l.trim());
      setProofResults(lines.length ? lines : ["Style looks good!"]);
    } catch (e: any) {
      console.error("Style analysis error:", e);
      setProofResults([
        `Style analysis failed: ${e?.message || "Unknown error."}`,
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  async function runCharacterConsistency() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    const prompt =
      "You are a professional fiction editor. Read the following full manuscript and return:\n" +
      "1) A list of main characters with a short description of each (age, key traits, relationships).\n" +
      "2) Any places where a character's description, age, or backstory seems to conflict with earlier details.\n" +
      "3) Suggestions to tighten character consistency.\n\n" +
      "Manuscript:\n\n" +
      compiled;

    try {
      setAiBusy(true);
      const res = await runAssistant(
        prompt,
        "character_consistency",
        "",
        provider
      );
      const text = normalizeAiText(res, "Character consistency");
      const lines = text.split("\n").filter((l) => l.trim());
      setProofResults(
        lines.length
          ? lines
          : ["No obvious character consistency issues detected."]
      );
    } catch (e: any) {
      console.error("Character consistency error:", e);
      setProofResults([
        `Character consistency check failed: ${
          e?.message || "Unknown error."
        }`,
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  async function runTimelineValidation() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    const prompt =
      "You are a continuity editor. Read the full manuscript and look for timeline issues.\n" +
      "Return:\n" +
      "1) A brief timeline of major events.\n" +
      "2) Any inconsistencies in dates, ages, seasons, holidays, pregnancies, school years, etc.\n" +
      "3) Clear notes on what might confuse a reader.\n\n" +
      "Manuscript:\n\n" +
      compiled;

    try {
      setAiBusy(true);
      const res = await runAssistant(
        prompt,
        "timeline_consistency",
        "",
        provider
      );
      const text = normalizeAiText(res, "Timeline validation");
      const lines = text.split("\n").filter((l) => l.trim());
      setProofResults(
        lines.length
          ? lines
          : ["No obvious timeline inconsistencies detected."]
      );
    } catch (e: any) {
      console.error("Timeline validation error:", e);
      setProofResults([
        `Timeline validation failed: ${e?.message || "Unknown error."}`,
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  /* ---------- AI Proof (All Checks) ---------- */
  async function runAIChecks() {
    const compiled = manuscriptText;
    if (!compiled) {
      setProofResults([
        "No manuscript found. Open Publishing and click Save (or type to autosave).",
      ]);
      return;
    }

    setAiBusy(true);
    const pieces: string[] = [];

    try {
      // Grammar
      const g = await runGrammar(compiled, provider);
      pieces.push("Grammar & Clarity:", normalizeAiText(g, "Grammar"));

      // Style
      const s = await runStyle(compiled, provider);
      pieces.push("", "Style & Voice:", normalizeAiText(s, "Style"));

      // Readability/basic
      const r = await runReadability(compiled, provider);
      pieces.push(
        "",
        "Readability & Basic Issues:",
        normalizeAiText(r, "Readability")
      );

      // You can add character/timeline here later if you want

      const lines = pieces
        .join("\n")
        .split("\n")
        .map((l) => l.trimEnd())
        .filter((l) => l.length > 0);

      setProofResults(lines.length ? lines : ["No issues returned by AI."]);
    } catch (e: any) {
      console.error("AI proof error:", e);
      setProofResults([
        `AI proof failed: ${e?.message || "Unknown error."} Check your API logs.`,
      ]);
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <PageShell style={{ background: theme.bg, minHeight: "100vh" }}>
      <div style={styles.outer}>
        {/* Header — rose/pink */}
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

            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
              }}
            >
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                Proof &amp; Consistency
              </h1>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
                minWidth: 150,
              }}
            >
              <label
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: 2,
                }}
              >
                AI Provider
              </label>
              <select
                value={provider}
                onChange={(e) =>
                  setProvider(e.target.value as "openai" | "anthropic")
                }
                style={{
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.16)",
                  color: theme.white,
                  fontSize: 11,
                  padding: "4px 10px",
                  outline: "none",
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Stats Card */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                gap: 32,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.subtext,
                    marginBottom: 4,
                  }}
                >
                  Word Count
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: theme.primary,
                  }}
                >
                  {wordCount.toLocaleString()}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: theme.subtext,
                    marginBottom: 4,
                  }}
                >
                  Issues Listed
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: theme.accent,
                  }}
                >
                  {proofResults.length}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button
                  style={styles.btnPrimary}
                  onClick={runAIChecks}
                  disabled={aiBusy}
                >
                  {aiBusy ? "Running AI Proof…" : "🤖 AI Proof (All Checks)"}
                </button>
              </div>
            </div>
          </div>

          {/* Check Buttons */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: 18,
                color: theme.text,
              }}
            >
              Quick Checks
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
              }}
            >
              <button style={styles.btn} onClick={runGrammarCheck} disabled={aiBusy}>
                📝 Grammar Check
              </button>
              <button style={styles.btn} onClick={runStyleAnalysis} disabled={aiBusy}>
                ✨ Style Analysis
              </button>
              <button
                style={styles.btn}
                onClick={runCharacterConsistency}
                disabled={aiBusy}
              >
                👤 Character Consistency
              </button>
              <button
                style={styles.btn}
                onClick={runTimelineValidation}
                disabled={aiBusy}
              >
                📅 Timeline Validation
              </button>
              <button style={styles.btn} onClick={runLocalChecks} disabled={aiBusy}>
                🔍 Basic Issues
              </button>
            </div>
          </div>

          {/* Results */}
          {proofResults.length > 0 ? (
            <div style={styles.glassCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    color: theme.text,
                  }}
                >
                  Results
                </h3>
                <button
                  style={{
                    ...styles.btn,
                    padding: "8px 12px",
                    fontSize: 12,
                  }}
                  onClick={() => setProofResults([])}
                >
                  Clear
                </button>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 24,
                  color: theme.text,
                  lineHeight: 1.8,
                }}
              >
                {proofResults.map((r, i) => (
                  <li key={i} style={{ marginBottom: 8 }}>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              style={{
                ...styles.glassCard,
                textAlign: "center",
                padding: 60,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <div
                style={{
                  fontSize: 18,
                  color: theme.subtext,
                  marginBottom: 8,
                }}
              >
                No checks run yet
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: theme.subtext,
                }}
              >
                Click any button above to analyze your manuscript
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
