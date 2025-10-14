// src/components/publishing/PublishingSidebar.tsx
import React from "react";

/* local theme uses the same CSS vars so it matches parent */
const theme = {
  surface: "var(--brand-surface, var(--brand-white))",
  border: "var(--brand-border)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  white: "var(--brand-white)",
  primary: "var(--brand-primary)",
};

const styles = {
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
  label: { fontSize: 12, color: theme.subtext } as React.CSSProperties,
  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    background: theme.white,
    color: theme.text,
  } as React.CSSProperties,
  btn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
  } as React.CSSProperties,
};

// lightweight Toggle (local copy to avoid parent coupling)
const Toggle: React.FC<{checked:boolean; onChange:(v:boolean)=>void; label?:string}> = ({checked,onChange,label}) => (
  <button
    onClick={() => onChange(!checked)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 12px",
      borderRadius: 999,
      border: `1px solid ${theme.border}`,
      background: checked ? theme.highlight : theme.white,
      color: theme.text,
      cursor: "pointer",
    }}
    aria-pressed={checked}
    title={label}
  >
    <span style={{ width: 36, height: 20, borderRadius: 999, background: checked ? theme.accent : "#CBD5E1", position: "relative", display: "inline-block" }}>
      <span style={{ position: "absolute", top: 2, left: checked ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: theme.white, transition: "left .15s ease" }} />
    </span>
    {label && <span style={{ fontSize: 14 }}>{label}</span>}
  </button>
);

// Sidebar field
const Field: React.FC<{label:string; value:string; onChange:(v:string)=>void; placeholder?:string}> = ({label,value,onChange,placeholder}) => (
  <div>
    <div style={{ color: theme.subtext, fontSize: 12 }}>{label}</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={label.length > 12 ? 3 : 2}
      placeholder={placeholder}
      style={{
        width: "100%",
        marginTop: 6,
        fontSize: 14,
        padding: 10,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        background: theme.white,
        color: theme.text,
      }}
    />
  </div>
);

/* ---------- Props ---------- */
export type PublishingSidebarProps = {
  // manuscript details
  meta: { title: string; author: string; year: string; authorLast?: string };
  setMeta: (m: any) => void;
  // matter
  matter: { toc: boolean; titlePage: string; copyright: string; dedication: string; epigraph: string; acknowledgments: string; aboutAuthor: string; notes: string; tocFromHeadings?: boolean };
  setMatter: (u: any) => void;
  // presets
  manuscriptPreset: string;
  setManuscriptPreset: (k: any) => void;
  platformPreset: string;
  setPlatformPreset: (k: any) => void;
  manuscriptEntries: ReadonlyArray<readonly [string, string]>;
  platformEntries: ReadonlyArray<readonly [string, string]>;
  includeHeadersFooters: boolean;
  // ms overrides
  ms: { lineHeight?: number };
  setMsOverrides: (u: any) => void;
  // misc
  wordCount: number;
  googleMode: boolean;
  setGoogleMode: (b: boolean) => void;
};

export default function PublishingSidebar(props: PublishingSidebarProps) {
  const {
    meta, setMeta,
    matter, setMatter,
    manuscriptPreset, setManuscriptPreset,
    platformPreset, setPlatformPreset,
    manuscriptEntries, platformEntries,
    includeHeadersFooters,
    ms, setMsOverrides,
    wordCount,
    googleMode, setGoogleMode,
  } = props;

  return (
    <aside
      style={{
        position: "sticky",
        top: 16,
        alignSelf: "start",
        display: "grid",
        gap: 16,
        height: "fit-content",
      }}
      aria-label="Publishing sidebar"
    >
      {/* Manuscript Details */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Manuscript Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Title</label>
            <input style={styles.input as any} value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} placeholder="Enter your book title" />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author</label>
            <input style={styles.input as any} value={meta.author} onChange={(e) => setMeta({ ...meta, author: e.target.value })} placeholder="Enter author name" />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Publication Year</label>
            <input style={styles.input as any} value={meta.year} onChange={(e) => setMeta({ ...meta, year: e.target.value })} placeholder="YYYY" />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author Last Name (header)</label>
            <input style={styles.input as any} value={meta.authorLast || ""} onChange={(e) => setMeta({ ...meta, authorLast: e.target.value })} placeholder="For running header" />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 16, color: theme.subtext, fontSize: 14 }}>
            <div>Words: <strong>{wordCount.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>

      {/* Format & Presets + Google toggle */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Format & Presets</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ color: theme.subtext, fontSize: 12 }}>Google mode</div>
          <Toggle checked={googleMode} onChange={setGoogleMode} label={googleMode ? "On" : "Off"} />
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={styles.label}>Manuscript Preset</div>
            <select value={manuscriptPreset} onChange={(e) => setManuscriptPreset(e.target.value as any)}
                    style={{ ...styles.input, height: 40 }}>
              {manuscriptEntries.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>

          <div>
            <div style={styles.label}>Platform Preset</div>
            <select value={platformPreset} onChange={(e) => setPlatformPreset(e.target.value as any)}
                    style={{ ...styles.input, height: 40 }}>
              {platformEntries.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
            <div style={{ color: theme.subtext, fontSize: 12, marginTop: 6 }}>
              {includeHeadersFooters
                ? "DOCX export includes page margins (print-typical)."
                : "Headers/footers disabled (typical for eBooks)."}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={styles.label}>Line Spacing</span>
            <button
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight < 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides((o: any) => ({ ...o, lineHeight: 1.5 }))}
            >
              Single (1.5)
            </button>
            <button
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight >= 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides((o: any) => ({ ...o, lineHeight: 2.0 }))}
            >
              Double (2.0)
            </button>
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={!!matter.tocFromHeadings}
              onChange={(e) => setMatter((m: any) => ({ ...m, tocFromHeadings: e.target.checked }))}
            />
            Build Contents from Headings (H1–H3)
          </label>
        </div>
      </div>

      {/* Front/Back matter quick edits */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 16, color: theme.text }}>Front & Back Matter</h3>
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Title Page" value={matter.titlePage} onChange={(v) => setMatter({ ...matter, titlePage: v })} />
          <Field label="Copyright" value={matter.copyright} onChange={(v) => setMatter({ ...matter, copyright: v })} />
          <Field label="Dedication" value={matter.dedication} onChange={(v) => setMatter({ ...matter, dedication: v })} />
          <Field label="Epigraph" value={matter.epigraph} onChange={(v) => setMatter({ ...matter, epigraph: v })} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: theme.text }}>
            <input type="checkbox" checked={matter.toc}
                   onChange={(e) => setMatter({ ...matter, toc: e.target.checked })} /> Include Table of Contents
          </label>
          <Field label="Acknowledgments" value={matter.acknowledgments} onChange={(v) => setMatter({ ...matter, acknowledgments: v })} />
          <Field label="About the Author" value={matter.aboutAuthor} onChange={(v) => setMatter({ ...matter, aboutAuthor: v })} />
          <Field label="Author Notes" value={matter.notes} onChange={(v) => setMatter({ ...matter, notes: v })} />
        </div>
      </div>
    </aside>
  );
}
