// src/pages/Cover.jsx
import React, { useEffect, useRef, useState } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage } from "../lib/uploads";
import { toPng } from "html-to-image";
import { storage } from "../lib/storage";
import { getSelectedProjectId } from "../lib/projectsSync";

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
  {
    key: "urban",
    label: "Urban Fiction",
    bg: "linear-gradient(145deg, #1e3a5f, #0f172a)",
    titleColor: "#d4af37",
    subtitleColor: "#e5e7eb",
    authorColor: "#d4af37",
    overlay: "rgba(15,23,42,0.5)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    key: "inspirational",
    label: "Inspirational / Faith",
    bg: "linear-gradient(145deg, #1e3a5f, #b8a9c9)",
    titleColor: "#ffffff",
    subtitleColor: "#e5e7eb",
    authorColor: "#d4af37",
    overlay: "rgba(30,58,95,0.4)",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
];

const FONT_FAMILIES = [
  { key: "georgia", label: "Georgia", value: "Georgia, 'Times New Roman', serif" },
  { key: "times", label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { key: "garamond", label: "Garamond", value: "Garamond, 'Times New Roman', serif" },
  { key: "playfair", label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { key: "impact", label: "Impact", value: "Impact, 'Arial Black', sans-serif" },
  { key: "arial", label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { key: "palatino", label: "Palatino", value: "'Palatino Linotype', 'Book Antiqua', Palatino, serif" },
  { key: "bookman", label: "Bookman", value: "'Bookman Old Style', serif" },
];

const LAYOUTS = [
  { key: "center", label: "Centered" },
  { key: "top", label: "Title at Top" },
  { key: "bottom", label: "Title at Bottom" },
];

const TRIM_PRESETS = [
  { key: "6x9", label: '6" × 9" (most common)', wIn: 6, hIn: 9 },
  { key: "5x8", label: '5" × 8"', wIn: 5, hIn: 8 },
  { key: "5.5x8.5", label: '5.5" × 8.5"', wIn: 5.5, hIn: 8.5 },
  { key: "8.5x11", label: '8.5" × 11"', wIn: 8.5, hIn: 11 },
];

// Project-scoped storage keys
const coverDesignsKeyForProject = (projectId) =>
  `dahtruth_cover_designs_${projectId}`;

const coverImageUrlKeyForProject = (projectId) =>
  `dahtruth_cover_image_url_${projectId}`;

const coverImageMetaKeyForProject = (projectId) =>
  `dahtruth_cover_image_meta_${projectId}`;

const coverSettingsKeyForProject = (projectId) =>
  `dahtruth_cover_settings_${projectId}`;

// Legacy keys (for backwards compatibility)
const COVER_DESIGNS_KEY = "dahtruth_cover_designs_v1";
const COVER_IMAGE_URL_KEY = "dahtruth_cover_image_url";
const COVER_IMAGE_META_KEY = "dahtruth_cover_image_meta";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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
  colorPickerRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  colorInput: {
    width: 40,
    height: 32,
    padding: 0,
    border: `1px solid ${theme.border}`,
    borderRadius: 6,
    cursor: "pointer",
    background: "transparent",
  },
  colorLabel: {
    fontSize: 12,
    color: theme.text,
    flex: 1,
  },
  colorHexInput: {
    width: 80,
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    fontFamily: "monospace",
  },
};

export default function Cover() {
  const coverRef = useRef(null);

  // Project ID
  const [projectId, setProjectId] = useState("");

  // Text content
  const [title, setTitle] = useState("Working Title");
  const [subtitle, setSubtitle] = useState("Optional subtitle");
  const [author, setAuthor] = useState("Your Name");
  const [tagline, setTagline] = useState("A NOVEL");

  // Preset & layout
  const [genrePresetKey, setGenrePresetKey] = useState("general");
  const [layoutKey, setLayoutKey] = useState("center");

  // ✅ Custom colors (override preset colors)
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customTitleColor, setCustomTitleColor] = useState("#f9fafb");
  const [customSubtitleColor, setCustomSubtitleColor] = useState("#e5e7eb");
  const [customAuthorColor, setCustomAuthorColor] = useState("#e5e7eb");
  const [customTaglineColor, setCustomTaglineColor] = useState("#e5e7eb");

  // ✅ Custom font
  const [customFontFamily, setCustomFontFamily] = useState("");

  // ✅ Custom background (when no image)
  const [customBgColor1, setCustomBgColor1] = useState("#111827");
  const [customBgColor2, setCustomBgColor2] = useState("#1e293b");
  const [useCustomBg, setUseCustomBg] = useState(false);

  // Cover image
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageFit, setCoverImageFit] = useState("cover");
  const [coverImageFilter, setCoverImageFilter] = useState("soft-dark");

  // UI state
  const [designMode, setDesignMode] = useState("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  // Export settings
  const [trimKey, setTrimKey] = useState("6x9");
  const [dpi, setDpi] = useState(300);

  // Save/Load designs
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");

  const selectedPreset =
    GENRE_PRESETS.find((p) => p.key === genrePresetKey) || GENRE_PRESETS[0];

  const selectedTrim = TRIM_PRESETS.find((t) => t.key === trimKey) || TRIM_PRESETS[0];

  // Determine actual colors to use
  const activeTitleColor = useCustomColors ? customTitleColor : selectedPreset.titleColor;
  const activeSubtitleColor = useCustomColors ? customSubtitleColor : selectedPreset.subtitleColor;
  const activeAuthorColor = useCustomColors ? customAuthorColor : selectedPreset.authorColor;
  const activeTaglineColor = useCustomColors ? customTaglineColor : selectedPreset.subtitleColor;
  const activeFontFamily = customFontFamily || selectedPreset.fontFamily;

  // Determine background
  const activeBackground = coverImageUrl
    ? `url(${coverImageUrl})`
    : useCustomBg
    ? `linear-gradient(145deg, ${customBgColor1}, ${customBgColor2})`
    : selectedPreset.bg;

  let justifyContent = "center";
  if (layoutKey === "top") justifyContent = "flex-start";
  if (layoutKey === "bottom") justifyContent = "flex-end";

  // Initialize project ID
  useEffect(() => {
    try {
      const id = getSelectedProjectId() || "default";
      setProjectId(id);
    } catch (e) {
      console.error("Failed to get project ID:", e);
      setProjectId("default");
    }
  }, []);

  // Load saved cover data when project changes
  useEffect(() => {
    if (!projectId) return;

    try {
      // Load cover image URL (project-scoped first, then legacy)
      let savedUrl = storage.getItem(coverImageUrlKeyForProject(projectId));
      if (!savedUrl) savedUrl = storage.getItem(COVER_IMAGE_URL_KEY);
      if (savedUrl) setCoverImageUrl(savedUrl);

      // Load cover image meta
      let savedMeta = storage.getItem(coverImageMetaKeyForProject(projectId));
      if (!savedMeta) savedMeta = storage.getItem(COVER_IMAGE_META_KEY);
      if (savedMeta) {
        const meta = safeJsonParse(savedMeta, {});
        if (meta.fit) setCoverImageFit(meta.fit);
        if (meta.filter) setCoverImageFilter(meta.filter);
      }

      // Load cover settings (colors, fonts, etc.)
      const savedSettings = storage.getItem(coverSettingsKeyForProject(projectId));
      if (savedSettings) {
        const settings = safeJsonParse(savedSettings, {});
        if (settings.title) setTitle(settings.title);
        if (settings.subtitle) setSubtitle(settings.subtitle);
        if (settings.author) setAuthor(settings.author);
        if (settings.tagline) setTagline(settings.tagline);
        if (settings.genrePresetKey) setGenrePresetKey(settings.genrePresetKey);
        if (settings.layoutKey) setLayoutKey(settings.layoutKey);
        if (settings.trimKey) setTrimKey(settings.trimKey);

        // Custom colors
        if (typeof settings.useCustomColors === "boolean") setUseCustomColors(settings.useCustomColors);
        if (settings.customTitleColor) setCustomTitleColor(settings.customTitleColor);
        if (settings.customSubtitleColor) setCustomSubtitleColor(settings.customSubtitleColor);
        if (settings.customAuthorColor) setCustomAuthorColor(settings.customAuthorColor);
        if (settings.customTaglineColor) setCustomTaglineColor(settings.customTaglineColor);

        // Custom font
        if (settings.customFontFamily) setCustomFontFamily(settings.customFontFamily);

        // Custom background
        if (typeof settings.useCustomBg === "boolean") setUseCustomBg(settings.useCustomBg);
        if (settings.customBgColor1) setCustomBgColor1(settings.customBgColor1);
        if (settings.customBgColor2) setCustomBgColor2(settings.customBgColor2);
      }

      // Load saved designs
      let savedDesigns = storage.getItem(coverDesignsKeyForProject(projectId));
      if (!savedDesigns) savedDesigns = storage.getItem(COVER_DESIGNS_KEY);
      const designsArray = safeJsonParse(savedDesigns, []);
      setDesigns(Array.isArray(designsArray) ? designsArray : []);

    } catch (e) {
      console.error("Failed to load cover data:", e);
    } finally {
      setCoverLoaded(true);
    }
  }, [projectId]);

  // Auto-save cover settings when they change
  useEffect(() => {
    if (!coverLoaded || !projectId) return;

    try {
      const settings = {
        title,
        subtitle,
        author,
        tagline,
        genrePresetKey,
        layoutKey,
        trimKey,
        useCustomColors,
        customTitleColor,
        customSubtitleColor,
        customAuthorColor,
        customTaglineColor,
        customFontFamily,
        useCustomBg,
        customBgColor1,
        customBgColor2,
      };

      storage.setItem(coverSettingsKeyForProject(projectId), JSON.stringify(settings));

      // Save image URL
      if (coverImageUrl) {
        storage.setItem(coverImageUrlKeyForProject(projectId), coverImageUrl);
      } else {
        storage.removeItem(coverImageUrlKeyForProject(projectId));
      }

      // Save image meta
      storage.setItem(
        coverImageMetaKeyForProject(projectId),
        JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
      );

    } catch (e) {
      console.error("Failed to save cover settings:", e);
    }
  }, [
    coverLoaded,
    projectId,
    title,
    subtitle,
    author,
    tagline,
    genrePresetKey,
    layoutKey,
    trimKey,
    useCustomColors,
    customTitleColor,
    customSubtitleColor,
    customAuthorColor,
    customTaglineColor,
    customFontFamily,
    useCustomBg,
    customBgColor1,
    customBgColor2,
    coverImageUrl,
    coverImageFit,
    coverImageFilter,
  ]);

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
  };

  // Apply preset colors to custom colors (for starting point)
  const applyPresetToCustom = () => {
    setCustomTitleColor(selectedPreset.titleColor);
    setCustomSubtitleColor(selectedPreset.subtitleColor);
    setCustomAuthorColor(selectedPreset.authorColor);
    setCustomTaglineColor(selectedPreset.subtitleColor);
    setUseCustomColors(true);
  };

  // Build current design object for saving
  const buildCurrentDesign = () => {
    return {
      id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: (designName || title || "Untitled").trim(),
      createdAt: new Date().toISOString(),
      title,
      subtitle,
      author,
      tagline,
      genrePresetKey,
      layoutKey,
      coverImageUrl,
      coverImageFit,
      coverImageFilter,
      useCustomColors,
      customTitleColor,
      customSubtitleColor,
      customAuthorColor,
      customTaglineColor,
      customFontFamily,
      useCustomBg,
      customBgColor1,
      customBgColor2,
      trimKey,
    };
  };

  const applyDesign = (d) => {
    if (!d) return;
    setTitle(d.title ?? "Working Title");
    setSubtitle(d.subtitle ?? "");
    setAuthor(d.author ?? "Your Name");
    setTagline(d.tagline ?? "A NOVEL");
    setGenrePresetKey(d.genrePresetKey ?? "general");
    setLayoutKey(d.layoutKey ?? "center");
    setCoverImageUrl(d.coverImageUrl ?? "");
    setCoverImageFit(d.coverImageFit ?? "cover");
    setCoverImageFilter(d.coverImageFilter ?? "soft-dark");
    setUseCustomColors(d.useCustomColors ?? false);
    setCustomTitleColor(d.customTitleColor ?? "#f9fafb");
    setCustomSubtitleColor(d.customSubtitleColor ?? "#e5e7eb");
    setCustomAuthorColor(d.customAuthorColor ?? "#e5e7eb");
    setCustomTaglineColor(d.customTaglineColor ?? "#e5e7eb");
    setCustomFontFamily(d.customFontFamily ?? "");
    setUseCustomBg(d.useCustomBg ?? false);
    setCustomBgColor1(d.customBgColor1 ?? "#111827");
    setCustomBgColor2(d.customBgColor2 ?? "#1e293b");
    if (d.trimKey) setTrimKey(d.trimKey);
  };

  const handleSaveDesign = () => {
    const next = buildCurrentDesign();
    const updated = [next, ...designs];
    setDesigns(updated);

    // Save to storage
    if (projectId) {
      storage.setItem(coverDesignsKeyForProject(projectId), JSON.stringify(updated));
    }

    setSelectedDesignId(next.id);
    setDesignName("");
    alert("✅ Design saved!");
  };

  const handleLoadDesign = (id) => {
    setSelectedDesignId(id);
    const found = designs.find((d) => d.id === id);
    if (found) applyDesign(found);
  };

  const handleDeleteDesign = () => {
    if (!selectedDesignId) return;
    if (!window.confirm("Delete this saved design?")) return;

    const updated = designs.filter((d) => d.id !== selectedDesignId);
    setDesigns(updated);

    if (projectId) {
      storage.setItem(coverDesignsKeyForProject(projectId), JSON.stringify(updated));
    }

    setSelectedDesignId("");
  };

  // Export PNG
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
      alert("Add a few words about your story (e.g. 'dark historical thriller in Philly').");
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
  "genre": "general" | "romance" | "thriller" | "memoir" | "fantasy" | "urban" | "inspirational",
  "layout": "center" | "top" | "bottom",
  "filter": "soft-dark" | "soft-blur" | "none",
  "titleColor": "#hexcolor",
  "subtitleColor": "#hexcolor",
  "authorColor": "#hexcolor",
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
        if (suggestions.filter && ["soft-dark", "soft-blur", "none"].includes(suggestions.filter)) {
          setCoverImageFilter(suggestions.filter);
        }

        // Apply custom colors if AI suggested them
        if (suggestions.titleColor || suggestions.subtitleColor || suggestions.authorColor) {
          setUseCustomColors(true);
          if (suggestions.titleColor) setCustomTitleColor(suggestions.titleColor);
          if (suggestions.subtitleColor) setCustomSubtitleColor(suggestions.subtitleColor);
          if (suggestions.authorColor) setCustomAuthorColor(suggestions.authorColor);
        }

        if (suggestions.reasoning) {
          alert(`AI Suggestion: ${suggestions.reasoning}`);
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

  // Preview size
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
            background: "linear-gradient(135deg, #1e3a5f, #b8a9c9)",
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
                  Build a story-aware cover with live preview. Export print-ready images.
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", fontSize: 11, opacity: 0.9 }}>
              <div>
                Currently editing: <strong>{title || "Untitled Project"}</strong>
              </div>
              <div>Changes auto-save to your project.</div>
            </div>
          </div>
        </div>

        {/* BODY GRID */}
        <div
          style={{
            padding: "18px 24px 24px",
            display: "grid",
            gridTemplateColumns: "340px minmax(0, 1fr)",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* LEFT: CONTROLS */}
          <aside style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: "85vh", overflowY: "auto" }}>
            {/* Save / Load Designs */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                💾 Save & Load Designs
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
                  Save Current Design
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

                {selectedDesignId && (
                  <button
                    type="button"
                    onClick={handleDeleteDesign}
                    style={{
                      ...styles.btn,
                      border: "1px solid #ef4444",
                      color: "#b91c1c",
                      background: "#fef2f2",
                    }}
                  >
                    Delete Selected Design
                  </button>
                )}
              </div>
            </div>

            {/* Text & Metadata */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                ✏️ Text & Metadata
              </h3>

              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <div style={styles.label}>Tagline (above title)</div>
                  <input
                    style={styles.input}
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="A NOVEL"
                  />
                </div>

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

            {/* Mood & Layout */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                🎭 Mood & Layout
              </h3>

              <div style={{ marginBottom: 12 }}>
                <div style={{ ...styles.label, marginBottom: 6 }}>Genre / Mood Preset</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {GENRE_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setGenrePresetKey(preset.key)}
                      style={{
                        ...styles.btn,
                        fontSize: 10,
                        padding: "5px 9px",
                        border:
                          genrePresetKey === preset.key
                            ? `2px solid ${theme.accent}`
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
                            ? `2px solid ${theme.accent}`
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

            {/* ✅ NEW: Colors & Fonts */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                🎨 Colors & Fonts
              </h3>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={useCustomColors}
                    onChange={(e) => setUseCustomColors(e.target.checked)}
                  />
                  <span style={{ fontSize: 12, color: theme.text }}>Use custom colors (override preset)</span>
                </label>

                {!useCustomColors && (
                  <button
                    type="button"
                    onClick={applyPresetToCustom}
                    style={{ ...styles.btn, fontSize: 10, marginTop: 6 }}
                  >
                    Copy preset colors to customize
                  </button>
                )}
              </div>

              {useCustomColors && (
                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  <div style={styles.colorPickerRow}>
                    <input
                      type="color"
                      value={customTitleColor}
                      onChange={(e) => setCustomTitleColor(e.target.value)}
                      style={styles.colorInput}
                    />
                    <span style={styles.colorLabel}>Title</span>
                    <input
                      type="text"
                      value={customTitleColor}
                      onChange={(e) => setCustomTitleColor(e.target.value)}
                      style={styles.colorHexInput}
                    />
                  </div>

                  <div style={styles.colorPickerRow}>
                    <input
                      type="color"
                      value={customSubtitleColor}
                      onChange={(e) => setCustomSubtitleColor(e.target.value)}
                      style={styles.colorInput}
                    />
                    <span style={styles.colorLabel}>Subtitle</span>
                    <input
                      type="text"
                      value={customSubtitleColor}
                      onChange={(e) => setCustomSubtitleColor(e.target.value)}
                      style={styles.colorHexInput}
                    />
                  </div>

                  <div style={styles.colorPickerRow}>
                    <input
                      type="color"
                      value={customAuthorColor}
                      onChange={(e) => setCustomAuthorColor(e.target.value)}
                      style={styles.colorInput}
                    />
                    <span style={styles.colorLabel}>Author</span>
                    <input
                      type="text"
                      value={customAuthorColor}
                      onChange={(e) => setCustomAuthorColor(e.target.value)}
                      style={styles.colorHexInput}
                    />
                  </div>

                  <div style={styles.colorPickerRow}>
                    <input
                      type="color"
                      value={customTaglineColor}
                      onChange={(e) => setCustomTaglineColor(e.target.value)}
                      style={styles.colorInput}
                    />
                    <span style={styles.colorLabel}>Tagline</span>
                    <input
                      type="text"
                      value={customTaglineColor}
                      onChange={(e) => setCustomTaglineColor(e.target.value)}
                      style={styles.colorHexInput}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <div style={styles.label}>Font Family</div>
                <select
                  style={styles.input}
                  value={customFontFamily}
                  onChange={(e) => setCustomFontFamily(e.target.value)}
                >
                  <option value="">Use preset font</option>
                  {FONT_FAMILIES.map((f) => (
                    <option key={f.key} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom background (when no image) */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={useCustomBg}
                    onChange={(e) => setUseCustomBg(e.target.checked)}
                  />
                  <span style={{ fontSize: 12, color: theme.text }}>Custom gradient background</span>
                </label>

                {useCustomBg && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.label, fontSize: 10 }}>Color 1</div>
                      <input
                        type="color"
                        value={customBgColor1}
                        onChange={(e) => setCustomBgColor1(e.target.value)}
                        style={{ ...styles.colorInput, width: "100%" }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ ...styles.label, fontSize: 10 }}>Color 2</div>
                      <input
                        type="color"
                        value={customBgColor2}
                        onChange={(e) => setCustomBgColor2(e.target.value)}
                        style={{ ...styles.colorInput, width: "100%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Background Image & AI */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                🖼️ Background Image
              </h3>

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
                    background: designMode === "upload" ? theme.gold : "#fff",
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
                    background: designMode === "ai" ? theme.gold : "#fff",
                    fontWeight: designMode === "ai" ? 600 : 400,
                  }}
                >
                  AI Design Assist
                </button>
              </div>

              {designMode === "upload" && (
                <div style={{ display: "grid", gap: 10 }}>
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
                    <>
                      <p style={{ fontSize: 10, color: theme.subtext }}>
                        ✅ Image set. It appears behind your text.
                      </p>

                      <div>
                        <div style={{ ...styles.label, marginBottom: 4 }}>Image fit</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {["cover", "contain"].map((fit) => (
                            <button
                              key={fit}
                              type="button"
                              onClick={() => setCoverImageFit(fit)}
                              style={{
                                ...styles.btn,
                                flex: 1,
                                fontSize: 11,
                                border:
                                  coverImageFit === fit
                                    ? `2px solid ${theme.accent}`
                                    : `1px solid ${theme.border}`,
                                background: coverImageFit === fit ? "#eef2ff" : "#ffffff",
                              }}
                            >
                              {fit === "cover" ? "Fill cover" : "Fit inside"}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div style={{ ...styles.label, marginBottom: 4 }}>Overlay</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {[
                            { key: "soft-dark", label: "Dark" },
                            { key: "soft-blur", label: "Light" },
                            { key: "none", label: "None" },
                          ].map((f) => (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => setCoverImageFilter(f.key)}
                              style={{
                                ...styles.btn,
                                fontSize: 11,
                                border:
                                  coverImageFilter === f.key
                                    ? `2px solid ${theme.accent}`
                                    : `1px solid ${theme.border}`,
                                background: coverImageFilter === f.key ? "#eef2ff" : "#ffffff",
                              }}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleClearCoverImage}
                        style={{
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

              {designMode === "ai" && (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={styles.label}>Describe your story</div>
                  <textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Dark, moody urban fiction about family secrets in South Philadelphia."
                    style={{
                      resize: "vertical",
                      padding: 8,
                      fontSize: 11,
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                    }}
                  />
                  <button
                    type="button"
                    disabled={aiBusy}
                    onClick={handleAiDesignSuggest}
                    style={{
                      ...styles.btnPrimary,
                      opacity: aiBusy ? 0.7 : 1,
                    }}
                  >
                    {aiBusy ? "Thinking…" : "✨ Suggest Design"}
                  </button>
                </div>
              )}
            </div>

            {/* Export Settings */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 10px", fontSize: 15, fontWeight: 600, color: theme.text }}>
                📦 Export Settings
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
                  KDP requires 300 DPI for print covers.
                </p>
              </div>
            </div>
          </aside>

          {/* RIGHT: PREVIEW */}
          <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ ...styles.glassCard, flex: 1, display: "flex", flexDirection: "column", minHeight: 700 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: theme.text }}>
                  Live Preview
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: theme.subtext }}>
                    {selectedTrim.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: theme.subtext }}>
                  Auto-saves as you edit
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, padding: "20px 0" }}>
                <div
                  ref={coverRef}
                  style={{
                    width: COVER_PREVIEW_WIDTH,
                    height: coverPreviewHeight,
                    borderRadius: 12,
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(15,23,42,0.6)",
                    backgroundImage: coverImageUrl ? `url(${coverImageUrl})` : undefined,
                    background: coverImageUrl ? undefined : activeBackground,
                    backgroundSize: coverImageUrl
                      ? coverImageFit === "cover"
                        ? "cover"
                        : "contain"
                      : "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    boxShadow: "0 30px 80px rgba(15, 23, 42, 0.5)",
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
                      fontFamily: activeFontFamily,
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    {tagline && (
                      <div
                        style={{
                          fontSize: 20,
                          letterSpacing: 4,
                          textTransform: "uppercase",
                          color: activeTaglineColor,
                        }}
                      >
                        {tagline}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 38,
                        lineHeight: 1.1,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: activeTitleColor,
                      }}
                    >
                      {title || "YOUR TITLE HERE"}
                    </div>

                    {subtitle && (
                      <div
                        style={{
                          fontSize: 16,
                          marginTop: 8,
                          color: activeSubtitleColor,
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
                        color: activeAuthorColor,
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
              Coming soon: spine/back design and full AI cover generation.
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

