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
    <span
      style={{
        width: 36,
        height: 20,
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
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: 999,
          background: theme.white,
          transition: "left .15s ease",
        }}
      />
    </span>
    {label && <span style={{ fontSize: 14 }}>{label}</span>}
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
    <div style={{ color: theme.subtext, fontSize: 12 }}>{label}</div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
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
        gap: 16,
        height: "fit-content",
      }}
      aria-label="Publishing sidebar"
    >
      {/* OPTIONAL: Chapters block — rendered only if props provided */}
      {chapters && chapters.length > 0 && (
        <div style={{ ...styles.glassCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <h3 style={{ margin: 0, fontSize: 16, color: theme.text }}>Chapters</h3>
            {/* Compact toggle could go here later */}
          </div>
          <div
            style={{
              display: "grid",
              gap: 6,
              maxHeight: "calc(100vh - 160px)",
              overflow: "auto",
            }}
          >
            {chapters.map((c, i) => (
              <div key={c.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {onMoveChapter && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <button
                      type="button"
                      style={{ ...styles.btn, padding: "6px 8px" }}
                      title="Move up"
                      onClick={() => onMoveChapter(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      style={{ ...styles.btn, padding: "6px 8px" }}
                      title="Move down"
                      onClick={() => onMoveChapter(i, 1)}
                    >
                      ↓
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => onSelectChapter && onSelectChapter(c.id)}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: 10,
                    border: `1px solid ${c.id === activeChapterId ? theme.accent : theme.border}`,
                    background: c.id === activeChapterId ? theme.highlight : theme.white,
                    color: theme.text,
                    cursor: "pointer",
                    flex: 1,
                  }}
                  title={c.title}
                >
                  {c.included ? "✅ " : "🚫 "} {c.title}
                </button>

                {onToggleChapter && (
                  <Toggle
                    checked={c.included}
                    onChange={(v) => onToggleChapter(c.id, v)}
                    label={c.included ? "Included" : "Excluded"}
                  />
                )}
              </div>
            ))}
            {onAddChapter && (
              <button type="button" onClick={onAddChapter} style={{ ...styles.btn, fontWeight: 600, marginTop: 6 }}>
                + Add Chapter
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manuscript Details */}
      <div style={{ ...styles.glassCard }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: theme.text }}>Manuscript Details</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Title</label>
            <input
              type="text"
              style={styles.input}
              value={meta.title}
              onChange={(e) => setMeta({ ...meta, title: e.currentTarget.value })}
              placeholder="Enter your book title"
            />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author</label>
            <input
              type="text"
              style={styles.input}
              value={meta.author}
              onChange={(e) => setMeta({ ...meta, author: e.currentTarget.value })}
              placeholder="Enter author name"
            />
          </div>
          <div>
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Publication Year</label>
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
            <label style={{ ...styles.label, display: "block", marginBottom: 6 }}>Author Last Name (header)</label>
            <input
              type="text"
              style={styles.input}
              value={meta.authorLast || ""}
              onChange={(e) => setMeta({ ...meta, authorLast: e.currentTarget.value })}
              placeholder="For running header"
            />
          </div>
          <div style={{ display: "flex", alignItems: "end", gap: 16, color: theme.subtext, fontSize: 14 }}>
            <div>
              Words: <strong>{wordCount.toLocaleString()}</strong>
            </div>
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
            <select
              value={manuscriptPreset}
              onChange={(e) => setManuscriptPreset(e.currentTarget.value)}
              style={{ ...styles.input, height: 40 }}
            >
              {manuscriptEntries.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div style={styles.label}>Platform Preset</div>
            <select
              value={platformPreset}
              onChange={(e) => setPlatformPreset(e.currentTarget.value)}
              style={{ ...styles.input, height: 40 }}
            >
              {platformEntries.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
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
              type="button"
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight < 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides({ ...ms, lineHeight: 1.5 })}
            >
              Single (1.5)
            </button>
            <button
              type="button"
              style={{
                ...styles.btn,
                ...(ms.lineHeight && ms.lineHeight >= 2 ? { background: theme.highlight, borderColor: theme.accent } : {}),
              }}
              onClick={() => setMsOverrides({ ...ms, lineHeight: 2.0 })}
            >
              Double (2.0)
            </button>
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14 }}>
            <input
              type="checkbox"
              checked={!!matter.tocFromHeadings}
              onChange={(e) => setMatter({ ...matter, tocFromHeadings: e.currentTarget.checked })}
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
            <input
              type="checkbox"
              checked={matter.toc}
              onChange={(e) => setMatter({ ...matter, toc: e.currentTarget.checked })}
            />{" "}
            Include Table of Contents
          </label>
          <Field
            label="Acknowledgments"
            value={matter.acknowledgments}
            onChange={(v) => setMatter({ ...matter, acknowledgments: v })}
          />
          <Field
            label="About the Author"
            value={matter.aboutAuthor}
            onChange={(v) => setMatter({ ...matter, aboutAuthor: v })}
          />
          <Field label="Author Notes" value={matter.notes} onChange={(v) => setMatter({ ...matter, notes: v })} />
        </div>
      </div>
    </aside>
  );
}
