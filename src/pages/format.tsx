// src/pages/Format.tsx
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
    padding: 24,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  preview: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 16,
    background: theme.bg,
    minHeight: 400,
    overflow: "auto",
  } as React.CSSProperties,
  btn: {
    padding: "8px 16px",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.2s ease",
  } as React.CSSProperties,
  btnActive: {
    padding: "8px 16px",
    borderRadius: 10,
    border: `2px solid ${theme.accent}`,
    background: theme.highlight,
    color: theme.primary,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  } as React.CSSProperties,
} as const;

function htmlEscape(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/* ---------- Component ---------- */
export default function Format(): JSX.Element {
  const navigate = useNavigate();

  // Mock data - in real app, pass via props/context/state
  const [fontFamily, setFontFamily] = useState("Times New Roman");
  const [fontSize, setFontSize] = useState(12);
  const [lineHeight, setLineHeight] = useState(2.0);
  const [align, setAlign] = useState<"left" | "justify">("left");
  const [firstLineIndent, setFirstLineIndent] = useState(0.5);
  const [marginTop, setMarginTop] = useState(1);
  const [marginRight, setMarginRight] = useState(1);
  const [marginBottom, setMarginBottom] = useState(1);
  const [marginLeft, setMarginLeft] = useState(1);

  const meta = {
    title: "Working Title",
    author: "Your Name",
    year: new Date().getFullYear().toString(),
  };

  // Generate preview HTML
  const previewHTML = useMemo(() => {
    const css = `
      @page { margin: ${marginTop}in ${marginRight}in ${marginBottom}in ${marginLeft}in; }
      body { 
        font-family: ${fontFamily}; 
        font-size: ${fontSize}pt; 
        margin: 0; 
        line-height: ${lineHeight}; 
        color: #111; 
      }
      p { 
        orphans: 3; 
        widows: 3; 
        ${align === "justify" ? "text-align: justify;" : "text-align: left;"}
        ${firstLineIndent ? `text-indent: ${firstLineIndent}in;` : ""}
        margin: 0 0 1em 0;
      }
      h1, h2 { text-align: center; margin: 2em 0 1em 0; }
      h2.chapter { page-break-before: always; text-align: center; margin: 0 0 1.2em 0; font-weight: bold; }
    `;

    const content = `
      <h1>${htmlEscape(meta.title)}</h1>
      <p style="text-align:center;">by ${htmlEscape(meta.author)} • ${meta.year}</p>
      <h2 class="chapter">Chapter 1 – Beginnings</h2>
      <p>The morning held the kind of quiet that asks for a first sentence. She sat at the window, watching the light gather itself across the valley floor, pooling in the low places first, then climbing slowly up the slopes.</p>
      <p>Her coffee had gone cold in the cup. That happened most mornings now. She would pour it with intention, carry it to this exact spot, set it on the sill beside her notebook, and then forget it entirely as the day began to declare itself.</p>
      <p>Today felt different somehow. Not in any way she could name or point to, just a quality in the air, a sense of possibility that made her reach for her pen before the sun had cleared the eastern ridge.</p>
    `;

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title><style>${css}</style></head><body>${content}</body></html>`;
  }, [fontFamily, fontSize, lineHeight, align, firstLineIndent, marginTop, marginRight, marginBottom, marginLeft, meta]);

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
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600 }}>Format & Styles</h1>
            </div>
            <div style={{ width: 150 }} />
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
            {/* Controls Sidebar */}
            <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
              {/* Font Settings */}
              <div style={styles.glassCard}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: theme.text }}>Font</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Family
                    </label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: 13,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 8,
                      }}
                    >
                      <option>Times New Roman</option>
                      <option>Georgia</option>
                      <option>Garamond</option>
                      <option>Palatino Linotype</option>
                      <option>Calibri</option>
                      <option>Arial</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Size (pt)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: 13,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 8,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Spacing */}
              <div style={styles.glassCard}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: theme.text }}>Spacing</h4>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, color: theme.subtext, display: "block", marginBottom: 6 }}>
                      Line Height
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        style={lineHeight === 1.0 ? styles.btnActive : styles.btn}
                        onClick={() => setLineHeight(1.0)}
                      >
                        Single
                      </button>
                      <button
                        style={lineHeight === 1.5 ? styles.btnActive : styles.btn}
                        onClick={() => setLineHeight(1.5)}
                      >
                        1.5
                      </button>
                      <button
                        style={lineHeight === 2.0 ? styles.btnActive : styles.btn}
                        onClick={() => setLineHeight(2.0)}
                      >
                        Double
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      First Line Indent (in)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={firstLineIndent}
                      onChange={(e) => setFirstLineIndent(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: 13,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 8,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Alignment */}
              <div style={styles.glassCard}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: theme.text }}>Alignment</h4>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    style={align === "left" ? styles.btnActive : styles.btn}
                    onClick={() => setAlign("left")}
                  >
                    Left
                  </button>
                  <button
                    style={align === "justify" ? styles.btnActive : styles.btn}
                    onClick={() => setAlign("justify")}
                  >
                    Justify
                  </button>
                </div>
              </div>

              {/* Margins */}
              <div style={styles.glassCard}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: theme.text }}>Page Margins (inches)</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 11, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Top
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={marginTop}
                      onChange={(e) => setMarginTop(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "5px 6px",
                        fontSize: 12,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Right
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={marginRight}
                      onChange={(e) => setMarginRight(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "5px 6px",
                        fontSize: 12,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Bottom
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={marginBottom}
                      onChange={(e) => setMarginBottom(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "5px 6px",
                        fontSize: 12,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: theme.subtext, display: "block", marginBottom: 4 }}>
                      Left
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="2"
                      step="0.25"
                      value={marginLeft}
                      onChange={(e) => setMarginLeft(parseFloat(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "5px 6px",
                        fontSize: 12,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 6,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div style={styles.glassCard}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: 15, color: theme.text }}>Quick Presets</h4>
                <div style={{ display: "grid", gap: 6 }}>
                  <button
                    style={styles.btn}
                    onClick={() => {
                      setFontFamily("Times New Roman");
                      setFontSize(12);
                      setLineHeight(2.0);
                      setAlign("left");
                      setFirstLineIndent(0.5);
                      setMarginTop(1);
                      setMarginRight(1);
                      setMarginBottom(1);
                      setMarginLeft(1);
                    }}
                  >
                    📄 Agent Standard
                  </button>
                  <button
                    style={styles.btn}
                    onClick={() => {
                      setFontFamily("Georgia");
                      setFontSize(11);
                      setLineHeight(1.5);
                      setAlign("justify");
                      setFirstLineIndent(0.3);
                      setMarginTop(0.75);
                      setMarginRight(0.75);
                      setMarginBottom(0.75);
                      setMarginLeft(0.75);
                    }}
                  >
                    📖 KDP Paperback
                  </button>
                </div>
              </div>
            </aside>

            {/* Preview */}
            <main>
              <div style={styles.glassCard}>
                <h3 style={{ margin: "0 0 12px 0", fontSize: 18, color: theme.text }}>Live Preview</h3>
                <p style={{ margin: "0 0 16px 0", fontSize: 13, color: theme.subtext }}>
                  Adjust settings on the left to see real-time formatting changes.
                </p>
                <div style={styles.preview}>
                  <iframe
                    title="format-preview"
                    style={{ width: "100%", height: "100%", minHeight: 500, border: 0, background: "white" }}
                    srcDoc={previewHTML}
                  />
                </div>
                <p style={{ margin: "12px 0 0 0", fontSize: 12, color: theme.subtext }}>
                  * For production exports with headers/footers and page numbers, export as DOCX and finalize in Word/LibreOffice.
                </p>
              </div>
            </main>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
