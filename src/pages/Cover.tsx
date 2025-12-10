// src/pages/Cover.jsx
import React, { useState } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage } from "../lib/uploads";

const theme = {
  bg: "var(--brand-bg, #0f172a)",
  surface: "var(--brand-surface, #ffffff)",
  border: "var(--brand-border, #e2e8f0)",
  borderStrong: "var(--brand-border-strong, #cbd5f5)",
  text: "var(--brand-text, #0f172a)",
  subtext: "var(--brand-subtext, #64748b)",
  accent: "var(--brand-accent, #6366f1)",
  primary: "var(--brand-primary, #111827)",
  white: "var(--brand-white, #ffffff)",
  gold: "var(--brand-gold, #facc15)",
};

// Simple genre / mood presets
const GENRE_PRESETS = [
  {
    key: "general",
    label: "General Fiction",
    bg: "linear-gradient(145deg, #111827, #1e293b)",
    titleColor: "#f9fafb",
    subtitleColor: "#e5e7eb",
    authorColor: "#e5e7eb",
    overlay: "rgba(15,23,42,0.5)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    key: "romance",
    label: "Romance",
    bg: "linear-gradient(145deg, #fecaca, #f97373)",
    titleColor: "#111827",
    subtitleColor: "#1f2937",
    authorColor: "#111827",
    overlay: "rgba(248,250,252,0.2)",
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  {
    key: "thriller",
    label: "Thriller / Suspense",
    bg: "linear-gradient(145deg, #020617, #0f172a)",
    titleColor: "#f9fafb",
    subtitleColor: "#e5e7eb",
    authorColor: "#e5e7eb",
    overlay: "rgba(15,23,42,0.6)",
    fontFamily: "'Impact', system-ui, sans-serif",
  },
  {
    key: "memoir",
    label: "Memoir",
    bg: "linear-gradient(145deg, #fef9c3, #fde68a)",
    titleColor: "#111827",
    subtitleColor: "#1f2937",
    authorColor: "#111827",
    overlay: "rgba(249,250,251,0.4)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    key: "fantasy",
    label: "Fantasy / YA",
    bg: "linear-gradient(145deg, #1e293b, #4f46e5)",
    titleColor: "#e5e7eb",
    subtitleColor: "#c7d2fe",
    authorColor: "#f9fafb",
    overlay: "radial-gradient(circle at top, rgba(96,165,250,0.4), transparent 60%)",
    fontFamily: "'Garamond', 'Times New Roman', serif",
  },
];

const LAYOUTS = [
  { key: "center", label: "Centered" },
  { key: "top", label: "Title at Top" },
  { key: "bottom", label: "Title at Bottom" },
];

// Basic styles reused
const styles = {
  outer: {
    maxWidth: 1200,
    margin: "32px auto",
    background: "var(--brand-white, #ffffff)",
    borderRadius: 16,
    border: "1px solid var(--brand-border-strong, #cbd5f5)",
    boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
    overflow: "hidden",
  },
  glassCard: {
    background: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    border: "1px solid var(--brand-border, #e2e8f0)",
    padding: 16,
    boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
  },
  label: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.08,
    color: theme.subtext,
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    background: theme.white,
    color: theme.text,
  },
  btn: {
    padding: "7px 11px",
    fontSize: 12,
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "8px 14px",
    fontSize: 12,
    borderRadius: 999,
    border: "none",
    background: theme.accent,
    color: "#ffffff",
    cursor: "pointer",
  },
};

export default function Cover() {
  const [title, setTitle] = useState("Working Title");
  const [subtitle, setSubtitle] = useState("Optional subtitle");
  const [author, setAuthor] = useState("Your Name");
  const [genrePresetKey, setGenrePresetKey] = useState("general");
  const [layoutKey, setLayoutKey] = useState("center");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const selectedPreset =
    GENRE_PRESETS.find((p) => p.key === genrePresetKey) || GENRE_PRESETS[0];

  // Layout positioning for title block
  let justifyContent = "center";
  if (layoutKey === "top") justifyContent = "flex-start";
  if (layoutKey === "bottom") justifyContent = "flex-end";

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await uploadImage(file);
      setCoverImageUrl(url);
    } catch (err) {
      console.error("Upload failed:", err);
      alert(
        err?.message ||
          "Sorry, the image upload failed. Please try again or use a smaller file."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
        padding: "24px 12px",
      }}
    >
      <div style={styles.outer}>
        {/* HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg, #0f172a, #4c1d95)",
            color: "#ffffff",
            padding: "16px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1160,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 26 }}>
                🎨
              </span>
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 20,
                    letterSpacing: 0.4,
                    fontWeight: 600,
                    fontFamily: "Garamond, Georgia, serif",
                  }}
                >
                  Cover Designer
                </h1>
                <div style={{ fontSize: 11, opacity: 0.9 }}>
                  Build a story-aware cover with live preview. Save the final
                  image for your KDP upload.
                </div>
              </div>
            </div>

            <div
              style={{
                textAlign: "right",
                fontSize: 11,
                opacity: 0.9,
              }}
            >
              <div>
                Currently editing:{" "}
                <strong>{title || "Untitled Project"}</strong>
              </div>
              <div>Tip: keep it simple, bold, and readable at thumbnail size.</div>
            </div>
          </div>
        </div>

        {/* BODY GRID */}
        <div
          style={{
            padding: "18px 24px 24px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 360px) minmax(0, 1fr)",
            gap: 20,
          }}
        >
          {/* LEFT: CONTROLS */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* Text basics */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                Text & Metadata
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={styles.label}>Title</div>
                  <input
                    style={styles.input}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Book title"
                  />
                </div>
                <div>
                  <div style={styles.label}>Subtitle (optional)</div>
                  <input
                    style={styles.input}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Subtitle or tagline"
                  />
                </div>
                <div>
                  <div style={styles.label}>Author Name</div>
                  <input
                    style={styles.input}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your author name"
                  />
                </div>
              </div>
            </div>

            {/* Presets & layout */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                Mood & Layout
              </h3>
              <div style={{ marginBottom: 10 }}>
                <div style={{ ...styles.label, marginBottom: 6 }}>
                  Genre / Mood Preset
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  {GENRE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setGenrePresetKey(preset.key)}
                      style={{
                        ...styles.btn,
                        fontSize: 11,
                        borderRadius: 999,
                        border:
                          genrePresetKey === preset.key
                            ? `1px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        background:
                          genrePresetKey === preset.key ? "#eef2ff" : "#ffffff",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ ...styles.label, marginBottom: 6 }}>
                  Title Block Layout
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {LAYOUTS.map((layout) => (
                    <button
                      key={layout.key}
                      type="button"
                      onClick={() => setLayoutKey(layout.key)}
                      style={{
                        ...styles.btn,
                        flex: 1,
                        border:
                          layoutKey === layout.key
                            ? `1px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        background:
                          layoutKey === layout.key ? "#eef2ff" : "#ffffff",
                      }}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image upload */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 10px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                Background Image
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: theme.subtext,
                  marginBottom: 8,
                }}
              >
                Upload a high-resolution image to use as your cover background,
                or leave it empty for a clean color-only design.
              </p>
              <label
                style={{
                  ...styles.btn,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                📁 {uploading ? "Uploading…" : "Choose Image"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                  disabled={uploading}
                />
              </label>
              {coverImageUrl && (
                <p
                  style={{
                    fontSize: 10,
                    marginTop: 6,
                    color: theme.subtext,
                    wordBreak: "break-all",
                  }}
                >
                  Image set. It will appear behind your text in the preview.
                </p>
              )}
            </div>

            {/* AI button placeholder */}
            <div style={styles.glassCard}>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.text,
                }}
              >
                AI Cover Ideas (Coming Next)
              </h3>
              <p
                style={{
                  fontSize: 11,
                  color: theme.subtext,
                  marginBottom: 10,
                }}
              >
                Soon, StoryLab will read your synopsis or manuscript and suggest
                2–3 complete cover concepts (colors, layout, imagery). For now,
                use the presets and image upload to design manually.
              </p>
              <button
                type="button"
                style={{
                  ...styles.btnPrimary,
                  opacity: 0.6,
                  cursor: "not-allowed",
                }}
                disabled
              >
                ✨ Generate AI Concepts
              </button>
            </div>
          </aside>

          {/* RIGHT: PREVIEW */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={styles.glassCard}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  Live Preview
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 8,
                      fontSize: 11,
                      fontWeight: 400,
                      color: theme.subtext,
                    }}
                  >
                    Approx. 6" × 9" trade paperback ratio
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: theme.subtext,
                    textAlign: "right",
                  }}
                >
                  This is a design preview. Final export to PNG/JPEG will come in
                  the Export panel.
                </div>
              </div>

              {/* Cover canvas */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 320,
                    height: 500,
                    borderRadius: 10,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.6)",
                    backgroundImage: coverImageUrl
                      ? `url(${coverImageUrl})`
                      : selectedPreset.bg,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow:
                      "0 24px 60px rgba(15, 23, 42, 0.6), 0 0 0 1px rgba(15,23,42,0.3)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: justifyContent,
                    padding: "32px 24px",
                  }}
                >
                  {/* overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: coverImageUrl
                        ? "linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.75))"
                        : selectedPreset.overlay,
                    }}
                  />

                  {/* text block */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      fontFamily: selectedPreset.fontFamily,
                      color: selectedPreset.titleColor,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: selectedPreset.subtitleColor,
                      }}
                    >
                      A NOVEL
                    </div>
                    <div
                      style={{
                        fontSize: 30,
                        lineHeight: 1.05,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {title || "YOUR TITLE HERE"}
                    </div>
                    {subtitle && (
                      <div
                        style={{
                          fontSize: 14,
                          marginTop: 6,
                          color: selectedPreset.subtitleColor,
                          maxWidth: 260,
                          marginInline: "auto",
                        }}
                      >
                        {subtitle}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 14,
                        marginTop: 24,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: selectedPreset.authorColor,
                      }}
                    >
                      {author || "AUTHOR NAME"}
                    </div>
                  </div>

                  {/* DahTruth badge */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 14,
                      zIndex: 1,
                      fontSize: 9,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "#e5e7eb",
                      background: "rgba(15,23,42,0.7)",
                      padding: "4px 8px",
                      borderRadius: 999,
                      border: "1px solid rgba(249,250,251,0.2)",
                    }}
                  >
                    DahTruth StoryLab
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color: theme.subtext,
                textAlign: "right",
              }}
            >
              Later we can add: export as PNG/JPEG, spine/back design, and AI
              layout suggestions.
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
