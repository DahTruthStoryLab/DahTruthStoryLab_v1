// src/components/publishing/PublishingSidebar.tsx
import React from "react";

/* ---------- Local theme (CSS vars from brand.css) ---------- */
const theme = {
  surface: "var(--brand-surface, var(--brand-white))",
  border: "var(--brand-border)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  white: "var(--brand-white)",
  primary: "var(--brand-primary)",
} as const;

const styles = {
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 4px 16px rgba(2,20,40,.04)",
  } as React.CSSProperties,
  label: { fontSize: 11, color: theme.subtext, fontWeight: 500 } as React.CSSProperties,
  input: {
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 13,
    width: "100%",
    background: theme.white,
    color: theme.text,
  } as React.CSSProperties,
  btn: {
    padding: "6px 10px",
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
    fontSize: 12,
  } as React.CSSProperties,
} as const;

/* ---------- Small UI helpers ---------- */
type ToggleProps = { checked: boolean; onChange: (v: boolean) => void; label?: string };
const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "5px 8px",
      borderRadius: 999,
      border: `1px solid ${theme.border}`,
      background: checked ? theme.highlight : theme.white,
      color: theme.text,
      cursor: "pointer",
    }}
    aria-pressed={checked}
    title={label}
  >
    <span
      style={{
        width: 28,
        height: 16,
        borderRadius: 999,
        background: checked ? theme.accent : "#CBD5E1",
        position: "relative",
        display: "inline-block",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 14 : 2,
          width: 12,
          height: 12,
          borderRadius: 999,
          background: theme.white,
          transition: "left .15s ease",
        }}
      />
    </span>
    {label && <span style={{ fontSize: 11 }}>{label}</span>}
  </button>
);

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};
const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder }) => (
  <div>
    <div style={{ color: theme.subtext, fontSize: 10, marginBottom: 4, fontWeight: 500 }}>{label}</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
      rows={2}
      placeholder={placeholder}
      style={{
        width: "100%",
        fontSize: 12,
        padding: "6px 8px",
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        background: theme.white,
        color: theme.text,
        resize: "vertical",
      }}
    />
  </div>
);

/* ---------- Optional Chapters support (safe to ignore if not used yet) ---------- */
export type ChapterLite = {
  id: string;
  title: string;
  included: boolean;
  text?: string;
  textHTML?: string;
};

/* ---------- Props ---------- */
export type PublishingSidebarProps = {
  // manuscript details
  meta: { title: string; author: string; year: string; authorLast?: string };
  setMeta: (m: PublishingSidebarProps["meta"]) => void;

  // matter
  matter: {
    toc: boolean;
    titlePage: string;
    copyright: string;
    dedication: string;
    epigraph: string;
    acknowledgments: string;
    aboutAuthor: string;
    notes: string;
    tocFromHeadings?: boolean;
  };
  setMatter: (m: PublishingSidebarProps["matter"]) => void;

  // presets
  manuscriptPreset: string;
  setManuscriptPreset: (k: string) => void;
  platformPreset: string;
  setPlatformPreset: (k: string) => void;
  manuscriptEntries: ReadonlyArray<readonly [string, string]>;
  platformEntries: ReadonlyArray<readonly [string, string]>;
  includeHeadersFooters: boolean;

  // ms overrides
  ms: { lineHeight?: number };
  setMsOverrides: (u: Partial<{ lineHeight: number }>) => void;

  // misc
  wordCount: number;
  googleMode: boolean;
  setGoogleMode: (b: boolean) => void;

  // OPTIONAL chapters (only needed if you merge chapters into this sidebar)
  chapters?: ChapterLite[];
  activeChapterId?: string;
  onSelectChapter?: (id: string) => void;
  onToggleChapter?: (id: string, included: boolean) => void;
  onMoveChapter?: (index: number, direction: -1 | 1) => void;
  onAddChapter?: () => void;
};

export default function PublishingSidebar(props: PublishingSidebarProps) {
  const {
    // manuscript + matter
    meta,
    setMeta,
    matter,
    setMatter,
    // presets
    manuscriptPreset,
    setManuscriptPreset,
    platformPreset,
    setPlatformPreset,
    manuscriptEntries,
    platformEntries,
    includeHeadersFooters,
    // overrides
    ms,
    setMsOverrides,
    // misc
    wordCount,
    googleMode,
    setGoogleMode,
    // optional chapters
    chapters,
    activeChapterId,
    onSelectChapter,
    onToggleChapter,
    onMoveChapter,
    onAddChapter,
  } = props;

  return (
    <aside
      style={{
        position: "sticky",
        top: 16,
        alignSelf: "start",
        display: "grid",
        gap: 12,
        height: "fit-content",
        fontSize: 13,
      }}
      aria-label="Publishing sidebar"
    >
      {/* Manuscript Details - Compact */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, color: theme.text }}>Manuscript</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 4 }}>Title</label>
            <input
              type="text"
              style={styles.input}
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.currentTarget.value })}
              placeholder="Book title"
            />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 4 }}>Author</label>
            <input
              type="text"
              style={styles.input}
              value={meta.author}
              onChange={(e) => setMeta({ ...meta, author: e.currentTarget.value })}
              placeholder="Author name"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <label style={{ ...styles.label, display: "block", marginBottom: 4 }}>Year</label>
              <input
                type="text"
                inputMode="numeric"
                style={styles.input}
                value={meta.year}
                onChange={(e) => setMeta({ ...meta, year: e.currentTarget.value })}
                placeholder="YYYY"
              />
            </div>
            <div>
              <label style={{ ...styles.label, display: "block", marginBottom: 4 }}>Last Name</label>
              <input
                type="text"
                style={styles.input}
                value={meta.authorLast || ""}
                onChange={(e) => setMeta({ ...meta, authorLast: e.currentTarget.value })}
                placeholder="Header"
              />
            </div>
          </div>
          <div style={{ color: theme.subtext, fontSize: 11, paddingTop: 4 }}>
            Words: <strong>{wordCount.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Format & Presets - Compact */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 600, color: theme.text }}>Format</h3>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ color: theme.subtext, fontSize: 11 }}>Google mode</div>
          <Toggle checked={googleMode} onChange={setGoogleMode} label={googleMode ? "On" : "Off"} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div>
            <div style={{ ...styles.label, marginBottom: 4 }}>Manuscript</div>
            <select
              value={manuscriptPreset}
              onChange={(e) => setManuscriptPreset(e.currentTarget.value)}
              style={{ ...styles.input, height: 32 }}
            >
              {manuscriptEntries.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={{ ...styles.label, marginBottom: 4 }}>Platform</div>
            <select
              value={platformPreset}
              onChange={(e) => setPlatformPreset(e.currentTarget.value)}
              style={{ ...styles.input, height: 32 }}
            >
              {platformEntries.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ ...styles.label, marginBottom: 0 }}>Spacing</span>
            <button
              type="button"
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight < 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides({ ...ms, lineHeight: 1.5 })}
            >
              1.5
            </button>
            <button
              type="button"
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight >= 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides({ ...ms, lineHeight: 2.0 })}
            >
              2.0
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <input
              type="checkbox"
              checked={!!matter.tocFromHeadings}
              onChange={(e) => setMatter({ ...matter, tocFromHeadings: e.currentTarget.checked })}
            />
            TOC from Headings
          </label>
        </div>
      </div>

      {/* Front/Back matter - Compact */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 600, color: theme.text }}>Matter</h3>
        <div style={{ display: "grid", gap: 8 }}>
          <Field label="Title Page" value={matter.titlePage} onChange={(v) => setMatter({ ...matter, titlePage: v })} />
          <Field label="Copyright" value={matter.copyright} onChange={(v) => setMatter({ ...matter, copyright: v })} />
          <Field label="Dedication" value={matter.dedication} onChange={(v) => setMatter({ ...matter, dedication: v })} />
          <Field label="Epigraph" value={matter.epigraph} onChange={(v) => setMatter({ ...matter, epigraph: v })} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: theme.text }}>
            <input
              type="checkbox"
              checked={matter.toc}
              onChange={(e) => setMatter({ ...matter, toc: e.currentTarget.checked })}
            />
            Include TOC
          </label>
          <Field
            label="Acknowledgments"
            value={matter.acknowledgments}
            onChange={(v) => setMatter({ ...matter, acknowledgments: v })}
          />
          <Field
            label="About Author"
            value={matter.aboutAuthor}
            onChange={(v) => setMatter({ ...matter, aboutAuthor: v })}
          />
          <Field label="Notes" value={matter.notes} onChange={(v) => setMatter({ ...matter, notes: v })} />
        </div>
      </div>
    </aside>
  );
}
