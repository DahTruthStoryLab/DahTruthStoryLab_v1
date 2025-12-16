// src/pages/Proof.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import { runAssistant } from "../lib/api"; // ✅ use the unified AI assistant

import {
  ensureSelectedProject,
  getSelectedProjectId,
  chaptersKeyForProject,
} from "../lib/projectsSync";

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

/* ---------- Project-aware key helpers ---------- */
const publishingChaptersKeyForProject = (projectId: string) =>
  `dt_publishing_chapters_${projectId}`;

const publishingMatterKeyForProject = (projectId: string) =>
  `dt_publishing_matter_${projectId}`;

const publishingMetaKeyForProject = (projectId: string) =>
  `dt_publishing_meta_${projectId}`;

const projectMetaKeyForProject = (projectId: string) =>
  `dahtruth_project_meta_${projectId}`;

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

  // NEW: scope selection (whole book vs single chapter)
  const [scope, setScope] = useState<"all" | "chapter">("all");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");

  // ✅ NEW: Project ID state
  const [projectId, setProjectId] = useState<string>("");

  // ✅ Initialize selected project on mount
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      setProjectId(id);
    } catch (e) {
      console.error("Failed to init selected project in Proof:", e);
    }
  }, []);

  // ✅ Load manuscript + chapters (project-scoped first, then legacy fallbacks)
  const { manuscriptText, meta, chapters } = useMemo(() => {
    let chapters: ChapterLocal[] = [];
    let matter: MatterLocal = {};
    let meta: MetaLocal = {};

    if (!projectId) {
      return { manuscriptText: "", meta: {}, chapters: [] };
    }

    try {
      // 1) Prefer project-scoped Publishing outputs
      chapters = JSON.parse(
        localStorage.getItem(publishingChaptersKeyForProject(projectId)) || "[]"
      );
    } catch {}

    // If Publishing hasn't saved yet, fall back to per-project chapters from Compose
    if (!Array.isArray(chapters) || chapters.length === 0) {
      try {
        chapters = JSON.parse(
          localStorage.getItem(chaptersKeyForProject(projectId)) || "[]"
        );
      } catch {}
    }

    try {
      matter = JSON.parse(
        localStorage.getItem(publishingMatterKeyForProject(projectId)) || "{}"
      );
    } catch {}

    try {
      meta = JSON.parse(
        localStorage.getItem(publishingMetaKeyForProject(projectId)) || "{}"
      );
    } catch {}

    // If meta is empty, fall back to project meta from Compose
    if (!meta || (!meta.title && !meta.author && !meta.year)) {
      try {
        const projMeta = JSON.parse(
          localStorage.getItem(projectMetaKeyForProject(projectId)) || "{}"
        );
        meta = { ...projMeta, ...meta };
      } catch {}
    }

    // Legacy fallbacks (optional, keeps old behavior working)
    if (!Array.isArray(chapters) || chapters.length === 0) {
      try {
        chapters = JSON.parse(localStorage.getItem("dt_publishing_chapters") || "[]");
      } catch {}
    }
    if (!matter || Object.keys(matter).length === 0) {
      try {
        matter = JSON.parse(localStorage.getItem("dt_publishing_matter") || "{}");
      } catch {}
    }
    if (!meta || Object.keys(meta).length === 0) {
      try {
        meta = JSON.parse(localStorage.getItem("dt_publishing_meta") || "{}");
      } catch {}
    }

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
    return { manuscriptText, meta, chapters: included };
  }, [projectId]);

  // ✅ Reset chapter scope when manuscript changes
  useEffect(() => {
    if (chapters.length && !selectedChapterId) {
      setSelectedChapterId(chapters[0].id);
    }
    if (!chapters.length) {
      setSelectedChapterId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters.length, projectId]);

  const wordCount = useMemo(
    () =>
      manuscriptText
        ? manuscriptText.split(/\s+/).filter(Boolean).length
        : 0,
    [manuscriptText]
  );

  // Effective chapter for scope "chapter"
  const effectiveChapterId =
    selectedChapterId || (chapters.length ? chapters[0].id : "");
  const currentChapter =
    scope === "chapter"
      ? chapters.find((c) => c.id === effectiveChapterId) || null
      : null;

  const scopeLabel =
    scope === "all"
      ? "Whole manuscript"
      : currentChapter
      ? `Chapter: ${currentChapter.title}`
      : "Chapter (none selected)";

  // Helper: get the text we are currently checking
  function getScopedText(): { text: string; label: string } {
    if (!manuscriptText) return { text: "", label: "manuscript" };
    if (scope === "chapter" && currentChapter) {
      const body = currentChapter.textHTML
        ? stripHtml(currentChapter.textHTML)
        : currentChapter.text || "";
      const label = `chapter "${currentChapter.title}"`;
      return { text: body.trim(), label };
    }
    return { text: manuscriptText, label: "entire manuscript" };
  }

  /* ---------- Local checks ---------- */
  function runLocalChecks() {
    const { text: compiled, label } = getScopedText();
    const issues: string[] = [];

    if (!compiled) {
      setProofResults([
        `No ${label} text found. Open Publishing and click Save (or type to autosave).`,
      ]);
      return;
    }

    issues.push(`Scope: ${scopeLabel}.`);

    if (compiled.match(/ {2,}/))
      issues.push("Multiple consecutive spaces found.");
    if (/[""]/.test(compiled) && !/['']/.test(compiled))
      issues.push("Smart quotes present; ensure curly quotes are consistent.");
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

  /* ---------- AI checks (uses unified /ai-assistant) ---------- */
  async function runAIChecks() {
    setAiBusy(true);
    const { text: compiled, label } = getScopedText();

    if (!compiled) {
      setProofResults([
        `No ${label} text found. Open Publishing and click Save (or type to autosave).`,
      ]);
      setAiBusy(false);
      return;
    }

    // 🔹 Only send a sample to avoid rate-limit problems
    const MAX_WORDS_FOR_AI = 3000;
    const words = compiled.split(/\s+/);
    const sampleText =
      words.length > MAX_WORDS_FOR_AI
        ? words.slice(0, MAX_WORDS_FOR_AI).join(" ")
        : compiled;

    const sampleNote =
      words.length > MAX_WORDS_FOR_AI
        ? `Note: AI Proof scanned the first ${MAX_WORDS_FOR_AI.toLocaleString()} words of the ${scopeLabel.toLowerCase()} as a sample. Use the chapter tools in Publishing for detailed fixes.`
        : "";

    try {
      const res = await runAssistant(
        sampleText,
        "proofread",
        "Return a concise list of grammar, spelling, clarity, and consistency issues found in this text. Be specific about locations and suggested fixes.",
        "openai"
      );

      const local: string[] = [];
      local.push(`Scope: ${scopeLabel}.`);
      if (/ {2,}/.test(compiled))
        local.push("Multiple consecutive spaces found.");
      if (/--/.test(compiled))
        local.push(
          "Double hyphen found; consider an em dash (—) or a period."
        );

      // Parse AI response - could be string or array
      let apiSuggestions: string[] = [];
      if (res?.result) {
        if (Array.isArray(res.result)) {
          apiSuggestions = res.result;
        } else if (typeof res.result === "string") {
          // Split by newlines if it's a string list
          apiSuggestions = res.result
            .split(/\n+/)
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
        }
      }

      const combined = [
        ...(sampleNote ? [sampleNote] : []),
        ...local,
        ...apiSuggestions,
      ];

      setProofResults(
        combined.length ? combined : ["No issues returned by AI."]
      );
    } catch (e: any) {
      const msg =
        typeof e?.message === "string" && e.message.includes("429")
          ? "AI Proof hit the provider's rate limit. Try again a bit later, or run checks on shorter sections."
          : `AI check failed: ${e.message}. Try again or check API logs.`;
      setProofResults([msg]);
    } finally {
      setAiBusy(false);
    }
  }

  function runGrammarCheck() {
    const { text: compiled, label } = getScopedText();
    if (!compiled) {
      setProofResults([
        `No ${label} text found. Open Publishing and click Save (or type to autosave).`,
      ]);
      return;
    }

    const issues: string[] = [`Scope: ${scopeLabel}.`];

    if (/\btheir\b.*\bthere\b|\bthere\b.*\btheir\b/i.test(compiled)) {
      issues.push("Possible their/there confusion detected.");
    }
    if (/\bits\b.*\bit's\b|\bit's\b.*\bits\b/i.test(compiled)) {
      issues.push("Possible its/it's confusion detected.");
    }
    setProofResults(issues.length > 1 ? issues : ["No grammar issues detected."]);
  }

  function runStyleAnalysis() {
    const { text: compiled, label } = getScopedText();
    if (!compiled) {
      setProofResults([
        `No ${label} text found. Open Publishing and click Save (or type to autosave).`,
      ]);
      return;
    }

    const issues: string[] = [`Scope: ${scopeLabel}.`];

    const adverbs = compiled.match(/\b\w+ly\b/gi) || [];
    if (adverbs.length > 20)
      issues.push(
        `Found ${adverbs.length} adverbs. Consider trimming them for stronger prose.`
      );

    const passiveVoice =
      compiled.match(/\b(was|were|been|being)\s+\w+ed\b/gi) || [];
    if (passiveVoice.length > 10)
      issues.push(
        `Found ${passiveVoice.length} instances of passive voice. Consider revising to active voice where it matters.`
      );

    setProofResults(issues.length > 1 ? issues : ["Style looks good!"]);
  }

  function runCharacterConsistency() {
    const msg = [
      `Scope: ${scopeLabel}.`,
      "Character consistency placeholder — later this can wire to your character bible.",
      "Tip: Track names, traits, ages, and relationships across chapters.",
    ];
    setProofResults(msg);
  }

  function runTimelineValidation() {
    const msg = [
      `Scope: ${scopeLabel}.`,
      "Timeline validation placeholder — later this can wire to your scene/event tracker.",
      "Tip: Check dates, seasons, time-of-day, and age progressions for continuity.",
    ];
    setProofResults(msg);
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

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* 🔹 NEW: banner explaining how this page relates to Publishing */}
          <div
            style={{
              ...styles.glassCard,
              marginBottom: 16,
              background:
                "linear-gradient(120deg, rgba(248,250,252,0.96), rgba(255,240,246,0.96))",
              borderColor: "rgba(248, 113, 166, 0.3)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <div style={{ fontSize: 20, marginTop: 2 }}>💡</div>
            <div style={{ fontSize: 13, color: theme.text, lineHeight: 1.6 }}>
              <strong>This page is your overview check.</strong> Use it to scan
              the <em>whole manuscript</em> or a <em>single chapter</em> for
              big-picture grammar, style, and consistency issues. For detailed,
              line-by-line edits, use the AI tools on the right side of the{" "}
              <strong>Publishing Studio</strong> page—those work chapter by
              chapter and write changes directly into your manuscript.
            </div>
          </div>

          {/* Stats + scope selector */}
          <div style={{ ...styles.glassCard, marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                gap: 24,
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

              {/* Scope controls */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: theme.subtext,
                  }}
                >
                  Check scope
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="all"
                      checked={scope === "all"}
                      onChange={() => setScope("all")}
                    />
                    Whole manuscript
                  </label>
                  <label
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="radio"
                      name="scope"
                      value="chapter"
                      checked={scope === "chapter"}
                      onChange={() => setScope("chapter")}
                    />
                    Single chapter
                  </label>
                </div>

                {scope === "chapter" && chapters.length > 0 && (
                  <select
                    value={effectiveChapterId}
                    onChange={(e) => {
                      setScope("chapter");
                      setSelectedChapterId(e.target.value);
                    }}
                    style={{
                      borderRadius: 10,
                      border: `1px solid ${theme.border}`,
                      padding: "6px 10px",
                      fontSize: 12,
                      width: "100%",
                    }}
                  >
                    {chapters.map((c, idx) => (
                      <option key={c.id} value={c.id}>
                        {idx + 1}. {c.title}
                      </option>
                    ))}
                  </select>
                )}

                <div
                  style={{
                    fontSize: 11,
                    color: theme.subtext,
                    marginTop: 2,
                  }}
                >
                  Current scope: <strong>{scopeLabel}</strong>
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
              <button style={styles.btn} onClick={runGrammarCheck}>
                📝 Grammar Check
              </button>
              <button style={styles.btn} onClick={runStyleAnalysis}>
                ✨ Style Analysis
              </button>
              <button style={styles.btn} onClick={runCharacterConsistency}>
                👤 Character Consistency
              </button>
              <button style={styles.btn} onClick={runTimelineValidation}>
                📅 Timeline Validation
              </button>
              <button style={styles.btn} onClick={runLocalChecks}>
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
                Choose a scope above, then click any button to analyze your
                manuscript.
              </div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
