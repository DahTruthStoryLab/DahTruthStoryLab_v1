// src/pages/Format.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";

// Simple theme to match Publishing
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

const styles = {
  outer: {
    maxWidth: 1300,
    margin: "32px auto",
    background: theme.white,
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(2,20,40,.08)",
    overflow: "hidden",
  } as React.CSSProperties,
  inner: {
    padding: "20px 24px",
  } as React.CSSProperties,
  sectionShell: {
    maxWidth: 1240,
    margin: "0 auto",
  } as React.CSSProperties,
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  label: {
    fontSize: 12,
    color: theme.subtext,
  } as React.CSSProperties,
  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 10,
    padding: "6px 8px",
    fontSize: 13,
    width: "100%",
    background: theme.white,
    color: theme.text,
  } as React.CSSProperties,
} as const;

const MANUSCRIPT_KEY = "dahtruth_publishing_manuscript";
const FORMAT_PREF_KEY = "dahtruth_format_prefs";

const FONT_OPTIONS = [
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino",
  "Calibri",
  "Arial",
];

type Align = "left" | "justify" | "center";

interface FormatPrefs {
  fontFamily: string;
  fontSizePx: number;
  lineHeight: number;
  align: Align;
  pageWidthPx: number;
  topBottomMargin: number;
  sideMargin: number;
}

export default function Format(): JSX.Element {
  const navigate = useNavigate();

  const [manuscript, setManuscript] = useState<string>("");

  // Default to "manuscript ready" (double spaced + roomy page)
  const [fontFamily, setFontFamily] = useState<string>("Times New Roman");
  const [fontSizePx, setFontSizePx] = useState<number>(16); // ~12 pt
  const [lineHeight, setLineHeight] = useState<number>(2.0); // double-spaced default
  const [align, setAlign] = useState<Align>("left");
  const [pageWidthPx, setPageWidthPx] = useState<number>(720); // ~5.5–6" visually
  const [topBottomMargin, setTopBottomMargin] = useState<number>(72);
  const [sideMargin, setSideMargin] = useState<number>(72);

  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load compiled manuscript from Publishing
  useEffect(() => {
    try {
      const raw = localStorage.getItem(MANUSCRIPT_KEY);
      if (raw && typeof raw === "string") {
        setManuscript(raw);
      }
    } catch {
      // ignore
    }
  }, []);

  // Load any saved formatting preferences
  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem(FORMAT_PREF_KEY);
      if (!rawPrefs) return;
      const parsed = JSON.parse(rawPrefs) as Partial<FormatPrefs>;

      if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
      if (typeof parsed.fontSizePx === "number")
        setFontSizePx(parsed.fontSizePx);
      if (typeof parsed.lineHeight === "number")
        setLineHeight(parsed.lineHeight);
      if (parsed.align) setAlign(parsed.align);
      if (typeof parsed.pageWidthPx === "number")
        setPageWidthPx(parsed.pageWidthPx);
      if (typeof parsed.topBottomMargin === "number")
        setTopBottomMargin(parsed.topBottomMargin);
      if (typeof parsed.sideMargin === "number")
        setSideMargin(parsed.sideMargin);
    } catch {
      // ignore
    }
  }, []);

  const wordCount = useMemo(
    () =>
      manuscript
        ? manuscript.split(/\s+/).filter(Boolean).length
        : 0,
    [manuscript]
  );

  const paragraphBlocks = useMemo(() => {
    if (!manuscript) return [];
    return manuscript
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [manuscript]);

  // Group paragraphs into pages by approximate character count
  const pages: string[][] = useMemo(() => {
    if (!paragraphBlocks.length) return [];

    const maxCharsPerPage = 3500; // tune if needed
    const result: string[][] = [];
    let currentPage: string[] = [];
    let currentCount = 0;

    for (const para of paragraphBlocks) {
      const paraLength = para.length + 2;
      if (currentPage.length > 0 && currentCount + paraLength > maxCharsPerPage) {
        result.push(currentPage);
        currentPage = [];
        currentCount = 0;
      }
      currentPage.push(para);
      currentCount += paraLength;
    }

    if (currentPage.length) {
      result.push(currentPage);
    }

    return result;
  }, [paragraphBlocks]);

  const handleSavePrefs = () => {
    try {
      setIsSavingPrefs(true);
      const prefs: FormatPrefs = {
        fontFamily,
        fontSizePx,
        lineHeight,
        align,
        pageWidthPx,
        topBottomMargin,
        sideMargin,
      };
      localStorage.setItem(FORMAT_PREF_KEY, JSON.stringify(prefs));
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2200);
    } catch {
      // ignore
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
      }}
      title="Format & Styles"
    >
      <div style={styles.outer}>
        {/* HEADER STRIP */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.75), rgba(147,197,253,0.9))",
            backdropFilter: "blur(12px)",
            color: theme.white,
            padding: "16px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <button
              onClick={() => navigate("/publishing")}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.18)",
                color: theme.white,
                padding: "8px 14px",
                fontSize: 13,
                borderRadius: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Back to Publishing
            </button>

            <div
              style={{
                textAlign: "center",
                flex: 1,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: 0.4,
                }}
              >
                Format & Styles
              </h1>
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.9,
                }}
              >
                Double-spaced preview with page-style layout for your manuscript.
              </div>
            </div>

            <div
              style={{
                minWidth: 180,
                textAlign: "right",
                fontSize: 11,
              }}
            >
              <div>
                Words:{" "}
                <span style={{ fontWeight: 600 }}>
                  {wordCount.toLocaleString()}
                </span>
              </div>
              {!manuscript && (
                <div style={{ marginTop: 2, opacity: 0.9 }}>
                  No manuscript loaded yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 2.1fr)",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            {/* LEFT: Controls */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 16,
                  color: theme.text,
                }}
              >
                Formatting Controls
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: theme.subtext,
                  margin: "0 0 14px",
                }}
              >
                These settings only affect how the page renders here. You can
                mirror them later when exporting to Word, PDF, or your layout
                tool.
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                {/* Font family */}
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Font family
                  </label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    style={styles.input}
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font size */}
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Font size (px)
                  </label>
                  <input
                    type="number"
                    min={12}
                    max={26}
                    value={fontSizePx}
                    onChange={(e) =>
                      setFontSizePx(Number(e.target.value) || 16)
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Line-height + alignment */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Line height
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    min={1}
                    max={3}
                    value={lineHeight}
                    onChange={(e) =>
                      setLineHeight(Number(e.target.value) || 2.0)
                    }
                    style={styles.input}
                  />
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 2,
                      color: theme.subtext,
                    }}
                  >
                    2.0 ≈ double-spaced
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Alignment
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    {(["left", "justify", "center"] as Align[]).map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setAlign(a)}
                        style={{
                          flex: 1,
                          padding: "6px 8px",
                          borderRadius: 999,
                          border:
                            align === a
                              ? `1px solid ${theme.accent}`
                              : `1px solid ${theme.border}`,
                          background:
                            align === a ? theme.highlight : theme.white,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        {a === "left"
                          ? "Left"
                          : a === "justify"
                          ? "Justify"
                          : "Center"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page width + margins */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Visual page width (px)
                  </label>
                  <input
                    type="number"
                    min={520}
                    max={880}
                    value={pageWidthPx}
                    onChange={(e) =>
                      setPageWidthPx(Number(e.target.value) || 720)
                    }
                    style={styles.input}
                  />
                </div>
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Side padding (px)
                  </label>
                  <input
                    type="number"
                    min={32}
                    max={120}
                    value={sideMargin}
                    onChange={(e) =>
                      setSideMargin(Number(e.target.value) || 72)
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Top/bottom margin */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <div>
                  <label
                    style={{
                      ...styles.label,
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Top / bottom padding (px)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={140}
                    value={topBottomMargin}
                    onChange={(e) =>
                      setTopBottomMargin(Number(e.target.value) || 72)
                    }
                    style={styles.input}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 11,
                  color: theme.subtext,
                  gap: 8,
                }}
              >
                <span>
                  Preview only – exporting is handled on the Export tab.
                </span>
                <button
                  type="button"
                  onClick={handleSavePrefs}
                  disabled={isSavingPrefs}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: isSavingPrefs ? "default" : "pointer",
                    background:
                      "linear-gradient(135deg, #22c55e, #4ade80)",
                    color: "#0f172a",
                  }}
                >
                  {isSavingPrefs ? "Saving…" : "Save format settings"}
                </button>
              </div>
            </div>

            {/* RIGHT: Paged Preview */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 16,
                  color: theme.text,
                }}
              >
                Manuscript Preview
              </h3>
              {!manuscript ? (
                <p
                  style={{
                    fontSize: 13,
                    color: theme.subtext,
                  }}
                >
                  No manuscript loaded. Go to{" "}
                  <strong>Publishing → Story</strong> first, make sure your
                  chapters and front matter are set, and the app will save the
                  compiled manuscript here automatically.
                </p>
              ) : (
                <div
                  style={{
                    padding: 16,
                    background:
                      "linear-gradient(180deg, #e5edf5, #f4f5f7)",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    maxHeight: "70vh",
                    overflowY: "auto",
                  }}
                >
                  {pages.map((page, pageIndex) => (
                    <div
                      key={pageIndex}
                      style={{
                        margin: "0 auto 24px auto",
                        maxWidth: pageWidthPx,
                        background: "#ffffff",
                        color: "#111827",
                        borderRadius: 6,
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 8px 30px rgba(15,23,42,0.12)",
                        padding: `${topBottomMargin}px ${sideMargin}px`,
                        fontFamily: fontFamily,
                        fontSize: fontSizePx,
                        lineHeight: lineHeight,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {page.map((p, idx) => (
                        <p
                          key={idx}
                          style={{
                            margin: "0 0 1.5em 0",
                            textAlign:
                              align === "center"
                                ? "center"
                                : align === "justify"
                                ? "justify"
                                : "left",
                            textJustify:
                              align === "justify" ? "inter-word" : "auto",
                          }}
                        >
                          {p}
                        </p>
                      ))}
                      <div
                        style={{
                          textAlign: "right",
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 12,
                        }}
                      >
                        Page {pageIndex + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save toast */}
      {showSaved && (
        <div
          style={{
            position: "fixed",
            right: 24,
            bottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #22c55e, #4ade80)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(22,163,74,0.4)",
          }}
        >
          Format settings saved
        </div>
      )}
    </PageShell>
  );
}
