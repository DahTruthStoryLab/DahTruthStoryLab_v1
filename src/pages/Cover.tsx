// src/pages/Cover.jsx
import React, { useEffect, useRef, useState } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage } from "../lib/uploads";
import { toPng } from "html-to-image";

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
    overlay:
      "radial-gradient(circle at top, rgba(96,165,250,0.4), transparent 60%)",
    fontFamily: "'Garamond', 'Times New Roman', serif",
  },
];

const LAYOUTS = [
  { key: "center", label: "Centered" },
  { key: "top", label: "Title at Top" },
  { key: "bottom", label: "Title at Bottom" },
];

const TRIM_PRESETS = [
  { key: "6x9", label: '6" × 9" (most common)', wIn: 6, hIn: 9 },
  { key: "5x8", label: '5" × 8"', wIn: 5, hIn: 8 },
  { key: "8.5x11", label: '8.5" × 11"', wIn: 8.5, hIn: 11 },
];

// Design save/load helpers
const COVER_DESIGNS_KEY = "dahtruth_cover_designs_v1";

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadDesigns() {
  if (typeof window === "undefined") return [];
  return safeJsonParse(localStorage.getItem(COVER_DESIGNS_KEY), []);
}

function saveDesigns(designs) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COVER_DESIGNS_KEY, JSON.stringify(designs));
}

const styles = {
  outer: {
    maxWidth: 1300,
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
  // ✅ MUST be inside the component
  const coverRef = useRef(null);

  const [title, setTitle] = useState("Working Title");
  const [subtitle, setSubtitle] = useState("Optional subtitle");
  const [author, setAuthor] = useState("Your Name");
  const [genrePresetKey, setGenrePresetKey] = useState("general");
  const [layoutKey, setLayoutKey] = useState("center");

  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageFit, setCoverImageFit] = useState("cover");
  const [coverImageFilter, setCoverImageFilter] = useState("soft-dark");

  const [designMode, setDesignMode] = useState("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  // ✅ NEW: Trim size and DPI for print-ready export
  const [trimKey, setTrimKey] = useState("6x9");
  const [dpi, setDpi] = useState(300);

  // ✅ NEW: Save/Load designs
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");

  const COVER_IMAGE_URL_KEY = "dahtruth_cover_image_url";
  const COVER_IMAGE_META_KEY = "dahtruth_cover_image_meta";

  const selectedPreset =
    GENRE_PRESETS.find((p) => p.key === genrePresetKey) || GENRE_PRESETS[0];

  const selectedTrim = TRIM_PRESETS.find((t) => t.key === trimKey) || TRIM_PRESETS[0];

  let justifyContent = "center";
  if (layoutKey === "top") justifyContent = "flex-start";
  if (layoutKey === "bottom") justifyContent = "flex-end";

  useEffect(() => {
    try {
      const savedUrl = localStorage.getItem(COVER_IMAGE_URL_KEY);
      if (savedUrl) setCoverImageUrl(savedUrl);

      const savedMeta = localStorage.getItem(COVER_IMAGE_META_KEY);
      if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        if (meta?.fit) setCoverImageFit(meta.fit);
        if (meta?.filter) setCoverImageFilter(meta.filter);
      }
    } catch {
      // ignore
    } finally {
      setCoverLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!coverLoaded) return;

    try {
      if (coverImageUrl) localStorage.setItem(COVER_IMAGE_URL_KEY, coverImageUrl);
      else localStorage.removeItem(COVER_IMAGE_URL_KEY);

      localStorage.setItem(
        COVER_IMAGE_META_KEY,
        JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
      );
    } catch {
      // ignore
    }
  }, [coverLoaded, coverImageUrl, coverImageFit, coverImageFilter]);

  // ✅ Load saved designs on page load
  useEffect(() => {
    const saved = loadDesigns();
    setDesigns(Array.isArray(saved) ? saved : []);
  }, []);

  const handleCoverFileChange = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    try {
      setCoverImageUploading(true);
      const result = await uploadImage(file);
      setCoverImageUrl(result.viewUrl);
      input.value = "";
    } catch (err) {
      console.error("[Cover upload error]", err);
      alert(err?.message || "Image upload failed. Please try again.");
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleClearCoverImage = () => {
    setCoverImageUrl("");
    try {
      localStorage.removeItem(COVER_IMAGE_URL_KEY);
    } catch {
      // ignore
    }
  };

  // ✅ Design save/load functions
  const buildCurrentDesign = () => {
    return {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: (designName || title || "Untitled").trim(),
      createdAt: new Date().toISOString(),

      // cover fields
      title,
      subtitle,
      author,
      genrePresetKey,
      layoutKey,

      coverImageUrl,
      coverImageFit,
      coverImageFilter,
    };
  };

  const applyDesign = (d) => {
    if (!d) return;
    setTitle(d.title ?? "Working Title");
    setSubtitle(d.subtitle ?? "");
    setAuthor(d.author ?? "Your Name");
    setGenrePresetKey(d.genrePresetKey ?? "general");
    setLayoutKey(d.layoutKey ?? "center");

    setCoverImageUrl(d.coverImageUrl ?? "");
    setCoverImageFit(d.coverImageFit ?? "cover");
    setCoverImageFilter(d.coverImageFilter ?? "soft-dark");
  };

  const handleSaveDesign = () => {
    const next = buildCurrentDesign();
    const updated = [next, ...designs];
    setDesigns(updated);
    saveDesigns(updated);
    setSelectedDesignId(next.id);
    setDesignName("");
  };

  const handleLoadDesign = (id) => {
    setSelectedDesignId(id);
    const found = designs.find((d) => d.id === id);
    if (found) applyDesign(found);
  };

  const handleDeleteDesign = () => {
    if (!selectedDesignId) return;
    const updated = designs.filter((d) => d.id !== selectedDesignId);
    setDesigns(updated);
    saveDesigns(updated);
    setSelectedDesignId("");
  };

  // ✅ UPDATED: Print-sized export (inches × DPI)
  const handleExportPNG = async () => {
    if (!coverRef.current) return;

    const targetW = Math.round(selectedTrim.wIn * dpi);
    const targetH = Math.round(selectedTrim.hIn * dpi);

    try {
      const dataUrl = await toPng(coverRef.current, {
        cacheBust: true,
        width: targetW,
        height: targetH,
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });

      const link = document.createElement("a");
      link.download = `${(title || "cover").replace(/[^\w\-]+/g, "_")}_${trimKey}_${dpi}dpi.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export image. Check console for details.");
    }
  };

  const handleAiDesignSuggest = async () => {
    if (!aiPrompt.trim()) {
      alert(
        "Add a few words about your story (e.g. 'dark historical thriller in Philly')."
      );
      return;
    }

    setAiBusy(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/ai-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiPrompt,
          operation: "chat",
          instructions: `You are a book cover design assistant. Based on the story description, suggest the best cover design settings.

You MUST respond with ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "genre": "general" | "romance" | "thriller" | "memoir" | "fantasy",
  "layout": "center" | "top" | "bottom",
  "filter": "soft-dark" | "soft-blur" | "none",
  "reasoning": "Brief explanation of why these choices fit the story"
}

Story description: ${aiPrompt}`,
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();

      if (data.ok && data.result) {
        let jsonStr = String(data.result).trim();
        jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();

        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        const suggestions = JSON.parse(jsonStr);

        if (suggestions.genre && GENRE_PRESETS.find((p) => p.key === suggestions.genre)) {
          setGenrePresetKey(suggestions.genre);
        }
        if (suggestions.layout && LAYOUTS.find((l) => l.key === suggestions.layout)) {
          setLayoutKey(suggestions.layout);
        }
        if (
          suggestions.filter &&
          ["soft-dark", "soft-blur", "none"].includes(suggestions.filter)
        ) {
          setCoverImageFilter(suggestions.filter);
        }
      } else {
        throw new Error(data.error || "Unknown error from AI");
      }
    } catch (err) {
      console.error("[AI Design Assist error]", err);
      alert(err?.message || "AI design suggestion failed. Please try again.");
    } finally {
      setAiBusy(false);
    }
  };

  const overlayBackground = coverImageUrl
    ? coverImageFilter === "soft-dark"
      ? "linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8))"
      : coverImageFilter === "soft-blur"
      ? "linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.6))"
      : "transparent"
    : selectedPreset.overlay;

  // Calculate cover preview size - larger to fill space better
  const COVER_PREVIEW_WIDTH = 420;
  const coverPreviewHeight = Math.round(COVER_PREVIEW_WIDTH * (selectedTrim.hIn / selectedTrim.wIn));

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
              maxWidth: 1260,
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
                <a
                  href="/publishing"
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.8)",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    marginBottom: 2,
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                >
                  ← Back to Publishing Suite
                </a>
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
                  Build a story-aware cover with live preview. Export print-ready
                  images for your KDP upload.
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
                Currently editing: <strong>{title || "Untitled Project"}</strong>
              </div>
              <div>Tip: keep it simple, bold, and readable at thumbnail size.</div>
            </div>
          </div>
        </div>

        {/* BODY GRID - adjusted for larger preview */}
        <div
          style={{
            padding: "18px 24px 24px",
            display: "grid",
            gridTemplateColumns: "320px minmax(0, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* LEFT: CONTROLS - narrower */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Save / Load Designs */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                Save & Load
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={styles.label}>Design name (optional)</div>
                  <input
                    style={styles.input}
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="e.g., Thriller v2 / Romance alt"
                  />
                </div>

                <button type="button" onClick={handleSaveDesign} style={styles.btnPrimary}>
                  Save this design
                </button>

                <div>
                  <div style={styles.label}>Load a saved design</div>
                  <select
                    style={styles.input}
                    value={selectedDesignId}
                    onChange={(e) => handleLoadDesign(e.target.value)}
                  >
                    <option value="">— Select —</option>
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({new Date(d.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleDeleteDesign}
                  disabled={!selectedDesignId}
                  style={{
                    ...styles.btn,
                    border: "1px solid #ef4444",
                    color: "#b91c1c",
                    background: "#fef2f2",
                    opacity: !selectedDesignId ? 0.6 : 1,
                    cursor: !selectedDesignId ? "not-allowed" : "pointer",
                  }}
                >
                  Delete selected design
                </button>

                <div style={{ fontSize: 10, color: theme.subtext }}>
                  Saved locally in this browser (no public links, no S3 needed yet).
                </div>
              </div>
            </div>

            {/* Text basics */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
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
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                Mood & Layout
              </h3>

              <div style={{ marginBottom: 10 }}>
                <div style={{ ...styles.label, marginBottom: 6 }}>Genre / Mood Preset</div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                        background: genrePresetKey === preset.key ? "#eef2ff" : "#ffffff",
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ ...styles.label, marginBottom: 6 }}>Title Block Layout</div>

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
                        background: layoutKey === layout.key ? "#eef2ff" : "#ffffff",
                      }}
                    >
                      {layout.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Background Image + AI Design */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                Background Image & AI Design
              </h3>

              {/* Tabs */}
              <div
                style={{
                  display: "inline-flex",
                  borderRadius: 999,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                  margin: "6px 0 12px",
                  fontSize: 11,
                }}
              >
                <button
                  type="button"
                  onClick={() => setDesignMode("upload")}
                  style={{
                    padding: "4px 10px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      designMode === "upload"
                        ? "var(--brand-highlight, rgba(148,163,184,0.25))"
                        : "#fff",
                    fontWeight: designMode === "upload" ? 600 : 400,
                  }}
                >
                  Upload
                </button>

                <button
                  type="button"
                  onClick={() => setDesignMode("ai")}
                  style={{
                    padding: "4px 10px",
                    border: "none",
                    cursor: "pointer",
                    background:
                      designMode === "ai"
                        ? "var(--brand-highlight, rgba(148,163,184,0.25))"
                        : "#fff",
                    fontWeight: designMode === "ai" ? 600 : 400,
                  }}
                >
                  AI Design Assist
                </button>
              </div>

              {/* Upload tab */}
              {designMode === "upload" && (
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={styles.label}>Cover background image</div>
                    <label
                      style={{
                        ...styles.btn,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 11,
                      }}
                    >
                      📁 {coverImageUploading ? "Uploading…" : "Choose image file"}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleCoverFileChange}
                        disabled={coverImageUploading}
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

                  {coverImageUrl && (
                    <>
                      <div>
                        <div style={{ ...styles.label, marginBottom: 4 }}>Image fit</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setCoverImageFit("cover")}
                            style={{
                              ...styles.btn,
                              flex: 1,
                              fontSize: 11,
                              border:
                                coverImageFit === "cover"
                                  ? `1px solid ${theme.accent}`
                                  : `1px solid ${theme.border}`,
                              background: coverImageFit === "cover" ? "#eef2ff" : "#ffffff",
                            }}
                          >
                            Fill cover
                          </button>

                          <button
                            type="button"
                            onClick={() => setCoverImageFit("contain")}
                            style={{
                              ...styles.btn,
                              flex: 1,
                              fontSize: 11,
                              border:
                                coverImageFit === "contain"
                                  ? `1px solid ${theme.accent}`
                                  : `1px solid ${theme.border}`,
                              background: coverImageFit === "contain" ? "#eef2ff" : "#ffffff",
                            }}
                          >
                            Fit inside
                          </button>
                        </div>
                      </div>

                      <div>
                        <div style={{ ...styles.label, marginBottom: 4 }}>
                          Overlay & readability
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => setCoverImageFilter("soft-dark")}
                            style={{
                              ...styles.btn,
                              fontSize: 11,
                              border:
                                coverImageFilter === "soft-dark"
                                  ? `1px solid ${theme.accent}`
                                  : `1px solid ${theme.border}`,
                              background: coverImageFilter === "soft-dark" ? "#eef2ff" : "#ffffff",
                            }}
                          >
                            Soft dark overlay
                          </button>

                          <button
                            type="button"
                            onClick={() => setCoverImageFilter("soft-blur")}
                            style={{
                              ...styles.btn,
                              fontSize: 11,
                              border:
                                coverImageFilter === "soft-blur"
                                  ? `1px solid ${theme.accent}`
                                  : `1px solid ${theme.border}`,
                              background: coverImageFilter === "soft-blur" ? "#eef2ff" : "#ffffff",
                            }}
                          >
                            Soft blur
                          </button>

                          <button
                            type="button"
                            onClick={() => setCoverImageFilter("none")}
                            style={{
                              ...styles.btn,
                              fontSize: 11,
                              border:
                                coverImageFilter === "none"
                                  ? `1px solid ${theme.accent}`
                                  : `1px solid ${theme.border}`,
                              background: coverImageFilter === "none" ? "#eef2ff" : "#ffffff",
                            }}
                          >
                            No overlay
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearCoverImage}
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          padding: "4px 8px",
                          borderRadius: 999,
                          border: "1px solid #ef4444",
                          color: "#b91c1c",
                          background: "#fef2f2",
                          cursor: "pointer",
                        }}
                      >
                        Remove image
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* AI Design tab */}
              {designMode === "ai" && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={styles.label}>Tell the AI about your story</div>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Dark, moody historical thriller in South Philadelphia with family secrets."
                    style={{
                      resize: "vertical",
                      padding: 8,
                      fontSize: 11,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      fontFamily:
                        "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                    }}
                  />
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={handleAiDesignSuggest}
                    style={{
                      ...styles.btnPrimary,
                      fontSize: 12,
                      padding: "7px 12px",
                      opacity: aiBusy ? 0.7 : 1,
                      cursor: aiBusy ? "wait" : "pointer",
                    }}
                  >
                    {aiBusy ? "Thinking…" : "Suggest palette & layout"}
                  </button>
                  <p style={{ margin: 0, fontSize: 10, color: theme.subtext }}>
                    Today this assistant adjusts your mood preset, overlay, and layout based on your
                    description. Later, we can connect it to real AI-generated artwork.
                  </p>
                </div>
              )}
            </div>

            {/* ✅ NEW: Export Settings */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                Export Settings
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={styles.label}>Trim size</div>
                  <select
                    style={styles.input}
                    value={trimKey}
                    onChange={(e) => setTrimKey(e.target.value)}
                  >
                    {TRIM_PRESETS.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div style={styles.label}>DPI</div>
                  <select
                    style={styles.input}
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                  >
                    <option value={150}>150 (draft)</option>
                    <option value={300}>300 (print)</option>
                  </select>
                </div>

                <button type="button" onClick={handleExportPNG} style={styles.btnPrimary}>
                  Export PNG ({Math.round(selectedTrim.wIn * dpi)} × {Math.round(selectedTrim.hIn * dpi)})
                </button>

                <p style={{ margin: 0, fontSize: 10, color: theme.subtext }}>
                  KDP requires 300 DPI for print. Use 150 DPI for quick drafts.
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT: PREVIEW - larger */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...styles.glassCard, flex: 1, display: "flex", flexDirection: "column", minHeight: 700 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
                  Live Preview
                  <span
                    style={{
                      display: "inline-block",
                      marginLeft: 8,
                      fontSize: 12,
                      fontWeight: 400,
                      color: theme.subtext,
                    }}
                  >
                    {selectedTrim.label} ratio
                  </span>
                </div>

                <div style={{ fontSize: 11, color: theme.subtext, textAlign: "right" }}>
                  Use <strong>Export Settings</strong> to download print-ready PNG.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "20px 0" }}>
                {/* ✅ attach ref to the actual cover - LARGER SIZE */}
                <div
                  ref={coverRef}
                  style={{
                    width: COVER_PREVIEW_WIDTH,
                    height: coverPreviewHeight,
                    borderRadius: 12,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.6)",
                    backgroundImage: coverImageUrl
                      ? `url(${coverImageUrl})`
                      : selectedPreset.bg,
                    backgroundSize: coverImageUrl
                      ? coverImageFit === "cover"
                        ? "cover"
                        : "contain"
                      : "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    boxShadow:
                      "0 30px 80px rgba(15, 23, 42, 0.5), 0 0 0 1px rgba(15,23,42,0.3)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent,
                    padding: "40px 32px",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: overlayBackground,
                    }}
                  />

                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      fontFamily: selectedPreset.fontFamily,
                      color: selectedPreset.titleColor,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        letterSpacing: 4,
                        textTransform: "uppercase",
                        color: selectedPreset.subtitleColor,
                      }}
                    >
                      A NOVEL
                    </div>

                    <div
                      style={{
                        fontSize: 38,
                        lineHeight: 1.1,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {title || "YOUR TITLE HERE"}
                    </div>

                    {subtitle && (
                      <div
                        style={{
                          fontSize: 16,
                          marginTop: 8,
                          color: selectedPreset.subtitleColor,
                          maxWidth: 320,
                          marginInline: "auto",
                        }}
                      >
                        {subtitle}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 16,
                        marginTop: 32,
                        letterSpacing: 4,
                        textTransform: "uppercase",
                        color: selectedPreset.authorColor,
                      }}
                    >
                      {author || "AUTHOR NAME"}
                    </div>
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      bottom: 14,
                      right: 16,
                      zIndex: 1,
                      fontSize: 10,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "#e5e7eb",
                      background: "rgba(15,23,42,0.7)",
                      padding: "5px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(249,250,251,0.2)",
                    }}
                  >
                    DahTruth StoryLab
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: theme.subtext, textAlign: "right" }}>
              Coming soon: spine/back design and full AI cover concepts.
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

