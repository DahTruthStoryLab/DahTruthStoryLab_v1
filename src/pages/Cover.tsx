// src/pages/Cover.jsx
// NEW LAYOUT: Header/Footer with tabs instead of sidebar
// Includes: All blinking fixes, back cover, spine, full color controls

import React, { useEffect, useRef, useState, useCallback } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage, getViewUrl } from "../lib/uploads";
import { toPng } from "html-to-image";
import { storage } from "../lib/storage";
import { loadProject, saveProject } from "../lib/projectsService";

const theme = {
  bg: "var(--brand-bg, #0f172a)",
  surface: "var(--brand-surface, #ffffff)",
  border: "var(--brand-border, #e2e8f0)",
  borderStrong: "var(--brand-border-strong, #cbd5e1)",
  text: "var(--brand-text, #0f172a)",
  subtext: "var(--brand-subtext, #64748b)",
  accent: "var(--brand-accent, #6366f1)",
  primary: "var(--brand-primary, #111827)",
  white: "var(--brand-white, #ffffff)",
  gold: "var(--brand-gold, #facc15)",
};

// Robust project ID detection
function getActiveProjectId() {
  const possibleKeys = [
    'dahtruth-current-project-id',
    'dahtruth_current_project_id',
    'dahtruth-selected-project-id',
    'currentProjectId',
    'dt_current_project_id'
  ];

  for (const key of possibleKeys) {
    try {
      const id = storage.getItem(key);
      if (id && id !== 'undefined' && id !== 'null' && id !== 'default') {
        console.log('[Cover] Found project ID in', key, ':', id);
        return id;
      }
    } catch {}
  }

  try {
    const storyRaw = storage.getItem('currentStory');
    if (storyRaw) {
      const story = JSON.parse(storyRaw);
      if (story?.id && story.id !== 'default') {
        console.log('[Cover] Found project ID in currentStory:', story.id);
        return story.id;
      }
    }
  } catch {}

  try {
    const listRaw = storage.getItem('dahtruth-projects-list');
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list) && list.length > 0 && list[0]?.id) {
        console.log('[Cover] Using first project from list:', list[0].id);
        return list[0].id;
      }
    }
  } catch {}

  try {
    const userProjectsRaw = storage.getItem('userProjects');
    if (userProjectsRaw) {
      const projects = JSON.parse(userProjectsRaw);
      if (Array.isArray(projects) && projects.length > 0 && projects[0]?.id) {
        console.log('[Cover] Using first project from userProjects:', projects[0].id);
        return projects[0].id;
      }
    }
  } catch {}

  console.log('[Cover] No project ID found, using default');
  return 'default';
}

// Preset color swatches for quick selection
const COLOR_SWATCHES = [
  "#ffffff", "#f9fafb", "#f3f4f6", "#e5e7eb", "#d1d5db",
  "#d4af37", "#facc15", "#fbbf24", "#f59e0b", "#eab308",
  "#ef4444", "#dc2626", "#b91c1c", "#f43f5e", "#ec4899",
  "#3b82f6", "#2563eb", "#1d4ed8", "#1e3a5f", "#0f172a",
  "#8b5cf6", "#7c3aed", "#6366f1", "#b8a9c9", "#a855f7",
  "#22c55e", "#16a34a", "#15803d", "#10b981", "#059669",
  "#111827", "#1f2937", "#374151", "#4b5563", "#000000",
];

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
  {
    key: "essays",
    label: "Essays / Non-Fiction",
    bg: "linear-gradient(145deg, #1e3a5f, #374151)",
    titleColor: "#ffffff",
    subtitleColor: "#d1d5db",
    authorColor: "#facc15",
    overlay: "rgba(15,23,42,0.5)",
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

// Storage keys
const coverDesignsKeyForProject = (projectId) => `dahtruth_cover_designs_${projectId}`;
const coverImageKeyForProject = (projectId) => `dahtruth_cover_image_key_${projectId}`;
const coverImageMetaKeyForProject = (projectId) => `dahtruth_cover_image_meta_${projectId}`;
const coverSettingsKeyForProject = (projectId) => `dahtruth_cover_settings_${projectId}`;
const projectDataKeyForProject = (projectId) => `dahtruth-project-${projectId}`;
const COVER_DESIGNS_KEY = "dahtruth_cover_designs_v1";
const COVER_IMAGE_KEY_LEGACY = "dahtruth_cover_image_key";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getProjectTitle(projectId) {
  if (!projectId || projectId === "default") return null;
  try {
    const dataRaw = storage.getItem(projectDataKeyForProject(projectId));
    if (dataRaw) {
      const data = JSON.parse(dataRaw);
      if (data?.book?.title) return data.book.title;
      if (data?.name) return data.name;
      if (data?.title) return data.title;
    }
    const settingsRaw = storage.getItem(coverSettingsKeyForProject(projectId));
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      if (settings?.title) return settings.title;
    }
    const storyRaw = storage.getItem("currentStory");
    if (storyRaw) {
      const story = JSON.parse(storyRaw);
      if (story?.id === projectId && story?.title) return story.title;
    }
    return null;
  } catch {
    return null;
  }
}

const styles = {
  tabBtn: {
    padding: "12px 18px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: theme.subtext,
    marginBottom: 4,
    display: "block",
  },
  input: {
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    padding: "10px 12px",
    fontSize: 14,
    width: "100%",
    background: theme.white,
    color: theme.text,
    boxSizing: "border-box",
  },
  btn: {
    padding: "6px 12px",
    fontSize: 11,
    borderRadius: 999,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    cursor: "pointer",
  },
  btnPrimary: {
    padding: "10px 18px",
    fontSize: 13,
    borderRadius: 8,
    border: "none",
    background: theme.accent,
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 600,
  },
};

// Color Picker Component
function ColorPickerField({ label, value, onChange }) {
  const [showSwatches, setShowSwatches] = useState(false);

  return (
    <div style={{ marginBottom: 8 }}>
      <div style={styles.label}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button
          type="button"
          onClick={() => setShowSwatches(!showSwatches)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: "2px solid #e2e8f0",
            background: value,
            cursor: "pointer",
            flexShrink: 0,
          }}
          title="Click to choose color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          style={{
            flex: 1,
            padding: "6px 8px",
            fontSize: 12,
            fontFamily: "monospace",
            borderRadius: 6,
            border: `1px solid ${theme.border}`,
            background: theme.white,
            minWidth: 70,
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 28,
            height: 28,
            padding: 0,
            border: `1px solid ${theme.border}`,
            borderRadius: 6,
            cursor: "pointer",
            background: "transparent",
          }}
          title="Open color picker"
        />
      </div>

      {showSwatches && (
        <div
          style={{
            marginTop: 6,
            padding: 6,
            background: "#f8fafc",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowSwatches(false);
                }}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  border: value === color ? "2px solid #3b82f6" : "1px solid #d1d5db",
                  background: color,
                  cursor: "pointer",
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Persist cover to project record
async function persistCoverToProjectRecord(projectId, payload) {
  if (!projectId) return;

  try {
    const project = await loadProject(projectId, { preferCloud: false });
    if (!project) {
      console.warn("[Cover] No project found for id:", projectId);
      return;
    }

    project.book = project.book || {};
    project.cover = project.cover || {};
    project.publishing = project.publishing || {};
    project.publishing.meta = project.publishing.meta || {};

    if (payload.title !== undefined) {
      const nextTitle = payload.title || "";
      project.title = nextTitle;
      project.book.title = nextTitle;
      project.publishing.meta.title = nextTitle;
      project.cover.title = nextTitle;
    }

    if (payload.subtitle !== undefined) project.cover.subtitle = payload.subtitle || "";
    if (payload.author !== undefined) {
      project.cover.author = payload.author || "";
      project.publishing.meta.author = payload.author || project.publishing.meta.author || "";
    }
    if (payload.tagline !== undefined) project.cover.tagline = payload.tagline || "";

    if (payload.coverImageKey !== undefined) {
      project.cover.imageKey = payload.coverImageKey || "";
      project.publishing.coverImageKey = payload.coverImageKey || "";
    }

    if (payload.coverImageFit !== undefined) project.cover.imageFit = payload.coverImageFit;
    if (payload.coverImageFilter !== undefined) project.cover.imageFilter = payload.coverImageFilter;

    if (payload.backBlurb !== undefined) project.cover.backBlurb = payload.backBlurb || "";
    if (payload.aboutAuthor !== undefined) project.cover.aboutAuthor = payload.aboutAuthor || "";
    if (payload.spineText !== undefined) project.cover.spineText = payload.spineText || "";

    project.cover.updatedAt = new Date().toISOString();

    await saveProject(project, { updateIndex: true, cloudSync: false });

    window.dispatchEvent(
      new CustomEvent("project:cover-updated", { detail: { projectId } })
    );

    console.log("[Cover] ✅ Persisted cover into project record:", projectId);
  } catch (e) {
    console.warn("[Cover] Could not persist cover to project record:", e);
  }
}

// END OF PART 1 - Continue in Part 2

export default function Cover() {
  const coverRef = useRef(null);
  const persistTimerRef = useRef(null);
  const schedulePersistRef = useRef(null);
  
  // Blinking fix refs
  const isHydratingRef = useRef(false);
  const stableCoverUrlRef = useRef("");
  const isLoadingRef = useRef(false);

  // Project
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  // Tab navigation
  const [activeTab, setActiveTab] = useState("text");

  // Text content
  const [title, setTitle] = useState("Working Title");
  const [subtitle, setSubtitle] = useState("Optional subtitle");
  const [author, setAuthor] = useState("Your Name");
  const [tagline, setTagline] = useState("A NOVEL");

  // Preset & layout
  const [genrePresetKey, setGenrePresetKey] = useState("general");
  const [layoutKey, setLayoutKey] = useState("center");

  // Custom colors
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customTitleColor, setCustomTitleColor] = useState("#f9fafb");
  const [customSubtitleColor, setCustomSubtitleColor] = useState("#e5e7eb");
  const [customAuthorColor, setCustomAuthorColor] = useState("#e5e7eb");
  const [customTaglineColor, setCustomTaglineColor] = useState("#e5e7eb");

  // Custom font
  const [customFontFamily, setCustomFontFamily] = useState("");

  // Custom background
  const [customBgColor1, setCustomBgColor1] = useState("#111827");
  const [customBgColor2, setCustomBgColor2] = useState("#1e293b");
  const [useCustomBg, setUseCustomBg] = useState(false);

  // Cover image
  const [coverImageKey, setCoverImageKey] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageFit, setCoverImageFit] = useState("cover");
  const [coverImageFilter, setCoverImageFilter] = useState("soft-dark");

  // Back cover
  const [backBlurb, setBackBlurb] = useState("");
  const [aboutAuthor, setAboutAuthor] = useState("");
  const [showBackCover, setShowBackCover] = useState(true);
  const [showSpine, setShowSpine] = useState(false);
  const [spineText, setSpineText] = useState("");

  // Export
  const [trimKey, setTrimKey] = useState("6x9");
  const [dpi, setDpi] = useState(300);

  // Designs
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");

  // Loading
  const [coverLoaded, setCoverLoaded] = useState(false);

  // Derived values
  const selectedPreset = GENRE_PRESETS.find((p) => p.key === genrePresetKey) || GENRE_PRESETS[0];
  const selectedTrim = TRIM_PRESETS.find((t) => t.key === trimKey) || TRIM_PRESETS[0];

  const activeTitleColor = useCustomColors ? customTitleColor : selectedPreset.titleColor;
  const activeSubtitleColor = useCustomColors ? customSubtitleColor : selectedPreset.subtitleColor;
  const activeAuthorColor = useCustomColors ? customAuthorColor : selectedPreset.authorColor;
  const activeTaglineColor = useCustomColors ? customTaglineColor : selectedPreset.subtitleColor;
  const activeFontFamily = customFontFamily || selectedPreset.fontFamily;

  const activeBackground = coverImageUrl
    ? `url(${coverImageUrl})`
    : useCustomBg
    ? `linear-gradient(145deg, ${customBgColor1}, ${customBgColor2})`
    : selectedPreset.bg;

  // Stable URL ref for flicker prevention
  useEffect(() => {
    if (coverImageUrl) stableCoverUrlRef.current = coverImageUrl;
  }, [coverImageUrl]);

  const effectiveCoverUrl = coverImageUrl || stableCoverUrlRef.current;

  const overlayBackground = effectiveCoverUrl
    ? coverImageFilter === "soft-dark"
      ? "linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8))"
      : coverImageFilter === "soft-blur"
      ? "linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.6))"
      : "transparent"
    : selectedPreset.overlay;

  let justifyContent = "center";
  if (layoutKey === "top") justifyContent = "flex-start";
  if (layoutKey === "bottom") justifyContent = "flex-end";

  // Preview dimensions
  const PANEL_W = 380;
  const PANEL_H = Math.round(PANEL_W * (selectedTrim.hIn / selectedTrim.wIn));
  const SPINE_W = showSpine ? 45 : 0;

  // Debounced persist
  const schedulePersistToProjectRecord = useCallback((pid, payload) => {
    if (!pid || isHydratingRef.current || isLoadingRef.current) {
      console.log("[Cover] Skipping persist during hydration/loading");
      return;
    }

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      if (isHydratingRef.current || isLoadingRef.current) return;
      void persistCoverToProjectRecord(pid, payload);
    }, 500);
  }, []);

  useEffect(() => {
    schedulePersistRef.current = schedulePersistToProjectRecord;
  }, [schedulePersistToProjectRecord]);

  // Load cover data
  const loadCoverData = useCallback(async (pid) => {
    if (!pid) return;

    if (isLoadingRef.current) {
      console.log("[Cover] Already loading, skipping");
      return;
    }
    isLoadingRef.current = true;

    console.log("[Cover] Loading data for project:", pid);
    isHydratingRef.current = true;

    try {
      const pName = getProjectTitle(pid);
      setProjectName(pName || "");

      // Load image key and get fresh URL
      const savedKey = storage.getItem(coverImageKeyForProject(pid));
      if (savedKey) {
        setCoverImageKey(savedKey);
        console.log("[Cover] Found saved image key:", savedKey);
        try {
          const freshUrl = await getViewUrl(savedKey);
          setCoverImageUrl(freshUrl);
          console.log("[Cover] Got fresh viewUrl for key");
        } catch (e) {
          console.warn("[Cover] Could not get fresh viewUrl, trying direct S3:", e);
          const bucket = import.meta.env.VITE_S3_BUCKET || "dahtruth-user-stories";
          const directUrl = `https://${bucket}.s3.amazonaws.com/${savedKey}`;
          setCoverImageUrl(directUrl);
        }
      } else {
        setCoverImageKey("");
        setCoverImageUrl("");
      }

      // Load image meta
      const savedMeta = storage.getItem(coverImageMetaKeyForProject(pid));
      if (savedMeta) {
        const meta = safeJsonParse(savedMeta, {});
        if (meta.fit) setCoverImageFit(meta.fit);
        if (meta.filter) setCoverImageFilter(meta.filter);
      }

      // Load settings
      const savedSettings = storage.getItem(coverSettingsKeyForProject(pid));
      if (savedSettings) {
        const s = safeJsonParse(savedSettings, {});
        if (s.title) setTitle(s.title);
        if (s.subtitle !== undefined) setSubtitle(s.subtitle);
        if (s.author) setAuthor(s.author);
        if (s.tagline !== undefined) setTagline(s.tagline);
        if (s.genrePresetKey) setGenrePresetKey(s.genrePresetKey);
        if (s.layoutKey) setLayoutKey(s.layoutKey);
        if (s.trimKey) setTrimKey(s.trimKey);

        if (typeof s.useCustomColors === "boolean") setUseCustomColors(s.useCustomColors);
        if (s.customTitleColor) setCustomTitleColor(s.customTitleColor);
        if (s.customSubtitleColor) setCustomSubtitleColor(s.customSubtitleColor);
        if (s.customAuthorColor) setCustomAuthorColor(s.customAuthorColor);
        if (s.customTaglineColor) setCustomTaglineColor(s.customTaglineColor);

        if (s.customFontFamily !== undefined) setCustomFontFamily(s.customFontFamily);

        if (typeof s.useCustomBg === "boolean") setUseCustomBg(s.useCustomBg);
        if (s.customBgColor1) setCustomBgColor1(s.customBgColor1);
        if (s.customBgColor2) setCustomBgColor2(s.customBgColor2);

        // Back cover
        if (s.backBlurb !== undefined) setBackBlurb(s.backBlurb);
        if (s.aboutAuthor !== undefined) setAboutAuthor(s.aboutAuthor);
        if (typeof s.showBackCover === "boolean") setShowBackCover(s.showBackCover);
        if (typeof s.showSpine === "boolean") setShowSpine(s.showSpine);
        if (s.spineText !== undefined) setSpineText(s.spineText);
      } else {
        const pTitle = getProjectTitle(pid);
        if (pTitle) setTitle(pTitle);
      }

      // Load designs
      let savedDesigns = storage.getItem(coverDesignsKeyForProject(pid));
      if (!savedDesigns) savedDesigns = storage.getItem(COVER_DESIGNS_KEY);
      const designsArray = safeJsonParse(savedDesigns, []);
      setDesigns(Array.isArray(designsArray) ? designsArray : []);
    } catch (e) {
      console.error("[Cover] Failed to load cover data:", e);
    } finally {
      isLoadingRef.current = false;
      setTimeout(() => {
        isHydratingRef.current = false;
        setCoverLoaded(true);
      }, 100);
    }
  }, []);

  // Initialize
  useEffect(() => {
    const initProject = () => {
      try {
        const id = getActiveProjectId();
        console.log("[Cover] Initializing with project ID:", id);
        setProjectId(id);
        setCoverLoaded(false);
        loadCoverData(id);

        if (id && id !== 'default') {
          storage.setItem('dahtruth-current-project-id', id);
        }
      } catch (e) {
        console.error("[Cover] Failed to get project ID:", e);
        setProjectId("default");
        setCoverLoaded(true);
      }
    };

    initProject();

    const handleProjectChange = () => initProject();
    window.addEventListener("project:change", handleProjectChange);

    return () => {
      window.removeEventListener("project:change", handleProjectChange);
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [loadCoverData]);

  // Auto-save
  useEffect(() => {
    if (!coverLoaded || isHydratingRef.current || !projectId) return;

    try {
      const settings = {
        title, subtitle, author, tagline,
        genrePresetKey, layoutKey, trimKey,
        useCustomColors, customTitleColor, customSubtitleColor, customAuthorColor, customTaglineColor,
        customFontFamily, useCustomBg, customBgColor1, customBgColor2,
        backBlurb, aboutAuthor, showBackCover, showSpine, spineText,
      };

      storage.setItem(coverSettingsKeyForProject(projectId), JSON.stringify(settings));

      if (coverImageKey) {
        storage.setItem(coverImageKeyForProject(projectId), coverImageKey);
        storage.setItem(COVER_IMAGE_KEY_LEGACY, coverImageKey);
        storage.setItem(
          coverImageMetaKeyForProject(projectId),
          JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
        );
      } else {
        storage.removeItem(coverImageKeyForProject(projectId));
        storage.removeItem(coverImageMetaKeyForProject(projectId));
      }

      if (schedulePersistRef.current) {
        schedulePersistRef.current(projectId, {
          title, subtitle, author, tagline,
          coverImageKey, coverImageFit, coverImageFilter,
          backBlurb, aboutAuthor, spineText,
        });
      }
    } catch (e) {
      console.error("[Cover] Failed to save cover settings:", e);
    }
  }, [
    coverLoaded, projectId, title, subtitle, author, tagline,
    genrePresetKey, layoutKey, trimKey,
    useCustomColors, customTitleColor, customSubtitleColor, customAuthorColor, customTaglineColor,
    customFontFamily, useCustomBg, customBgColor1, customBgColor2,
    coverImageKey, coverImageFit, coverImageFilter,
    backBlurb, aboutAuthor, showBackCover, showSpine, spineText,
  ]);

  // Upload handler
  const handleCoverFileChange = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const pid = projectId || getActiveProjectId();

    try {
      setCoverImageUploading(true);

      const result = await uploadImage(file);
      if (!result?.key) throw new Error("No key in upload response");

      setCoverImageKey(result.key);
      setCoverImageUrl(result.viewUrl);

      console.log("[Cover] Image uploaded, key:", result.key);

      if (pid) {
        storage.setItem(coverImageKeyForProject(pid), result.key);
        storage.setItem(
          coverImageMetaKeyForProject(pid),
          JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
        );
        storage.setItem(COVER_IMAGE_KEY_LEGACY, result.key);
      }

      await persistCoverToProjectRecord(pid, {
        title, subtitle, author, tagline,
        coverImageKey: result.key,
        coverImageFit, coverImageFilter,
        backBlurb, aboutAuthor, spineText,
      });

      input.value = "";
    } catch (err) {
      console.error("[Cover upload error]", err);
      alert(err?.message || "Image upload failed. Please try again.");
    } finally {
      setCoverImageUploading(false);
    }
  };

  const handleClearCoverImage = async () => {
    const pid = projectId || getActiveProjectId();

    setCoverImageKey("");
    setCoverImageUrl("");
    stableCoverUrlRef.current = "";

    if (pid) {
      storage.removeItem(coverImageKeyForProject(pid));
      storage.removeItem(coverImageMetaKeyForProject(pid));
      storage.removeItem(COVER_IMAGE_KEY_LEGACY);
    }

    await persistCoverToProjectRecord(pid, {
      title, subtitle, author, tagline,
      coverImageKey: "",
      coverImageFit, coverImageFilter,
      backBlurb, aboutAuthor, spineText,
    });
  };

  // Build current design
  const buildCurrentDesign = () => {
    const id = typeof crypto !== "undefined" && crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now());

    return {
      id,
      name: (designName || title || "Untitled").trim(),
      createdAt: new Date().toISOString(),
      title, subtitle, author, tagline,
      genrePresetKey, layoutKey,
      coverImageKey, coverImageFit, coverImageFilter,
      useCustomColors, customTitleColor, customSubtitleColor, customAuthorColor, customTaglineColor,
      customFontFamily, useCustomBg, customBgColor1, customBgColor2,
      trimKey, backBlurb, aboutAuthor, showBackCover, showSpine, spineText,
    };
  };

  // Apply design
  const applyDesign = async (d) => {
    if (!d) return;
    setTitle(d.title ?? "Working Title");
    setSubtitle(d.subtitle ?? "");
    setAuthor(d.author ?? "Your Name");
    setTagline(d.tagline ?? "A NOVEL");
    setGenrePresetKey(d.genrePresetKey ?? "general");
    setLayoutKey(d.layoutKey ?? "center");

    if (d.coverImageKey) {
      setCoverImageKey(d.coverImageKey);
      try {
        const freshUrl = await getViewUrl(d.coverImageKey);
        setCoverImageUrl(freshUrl);
      } catch (e) {
        console.warn("[Cover] Could not get viewUrl for design:", e);
        setCoverImageUrl("");
      }
    } else {
      setCoverImageKey("");
      setCoverImageUrl(d.coverImageUrl ?? "");
    }

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

    setBackBlurb(d.backBlurb ?? "");
    setAboutAuthor(d.aboutAuthor ?? "");
    setShowBackCover(d.showBackCover ?? true);
    setShowSpine(d.showSpine ?? false);
    setSpineText(d.spineText ?? "");
  };

  const handleSaveDesign = () => {
    const next = buildCurrentDesign();
    const updated = [next, ...designs];
    setDesigns(updated);

    if (projectId) {
      storage.setItem(coverDesignsKeyForProject(projectId), JSON.stringify(updated));
      storage.setItem(COVER_DESIGNS_KEY, JSON.stringify(updated));
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
      storage.setItem(COVER_DESIGNS_KEY, JSON.stringify(updated));
    }

    setSelectedDesignId("");
  };

  // Export PNG
  const handleExportPNG = async () => {
    if (!coverRef.current) return;

    const panelCount = showBackCover ? 2 : 1;
    const targetW = Math.round(selectedTrim.wIn * dpi) * panelCount + (showSpine ? Math.round(0.5 * dpi) : 0);
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

  // Tab definitions
  const tabs = [
    { key: "text", label: "📝 Text" },
    { key: "style", label: "🎨 Style" },
    { key: "image", label: "🖼️ Image" },
    { key: "back", label: "📘 Back Cover" },
    { key: "export", label: "📦 Export" },
  ];

  // END OF PART 2 - Continue with Part 3 (JSX return)

  return (
    <PageShell style={{ background: theme.bg, minHeight: "100vh", padding: 0 }}>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>

        {/* ========== HEADER ========== */}
        <header
          style={{
            background: "linear-gradient(135deg, #1e3a5f, #4c1d95)",
            color: "#ffffff",
            padding: "12px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: 1600,
              margin: "0 auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 26 }}>🎨</span>
              <div>
                <a
                  href="/publishing"
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.7)",
                    textDecoration: "none",
                  }}
                >
                  ← Publishing Suite
                </a>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 600,
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  Cover Designer
                </h1>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.9,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {projectName || title || "Untitled Project"}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {coverImageKey && (
                <span
                  style={{
                    fontSize: 11,
                    background: "rgba(34,197,94,0.3)",
                    padding: "4px 10px",
                    borderRadius: 999,
                  }}
                >
                  ✅ Image saved
                </span>
              )}
              <button
                onClick={handleSaveDesign}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                💾 Save Design
              </button>
              <button
                onClick={handleExportPNG}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: "none",
                  background: theme.gold,
                  color: "#111",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                📦 Export PNG
              </button>
            </div>
          </div>
        </header>

        {/* ========== TAB BAR ========== */}
        <div
          style={{
            background: "#fff",
            borderBottom: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: 1600,
              margin: "0 auto",
              display: "flex",
              padding: "0 24px",
            }}
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  ...styles.tabBtn,
                  borderBottom:
                    activeTab === t.key
                      ? "3px solid #6366f1"
                      : "3px solid transparent",
                  color: activeTab === t.key ? "#6366f1" : "#64748b",
                  fontWeight: activeTab === t.key ? 600 : 400,
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ========== CONTROLS PANEL ========== */}
        <div
          style={{
            background: "#f8fafc",
            borderBottom: "1px solid #e2e8f0",
            padding: "16px 24px",
          }}
        >
          <div style={{ maxWidth: 1600, margin: "0 auto" }}>

            {/* TEXT TAB */}
            {activeTab === "text" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                }}
              >
                <div>
                  <label style={styles.label}>Tagline (above title)</label>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="A NOVEL"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Title</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Book title"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Subtitle (optional)</label>
                  <input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Subtitle or tagline"
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Author Name</label>
                  <input
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Your author name"
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            {/* STYLE TAB */}
            {activeTab === "style" && (
              <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                <div>
                  <label style={{ ...styles.label, marginBottom: 8 }}>
                    Genre Preset
                  </label>
                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      maxWidth: 550,
                    }}
                  >
                    {GENRE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setGenrePresetKey(p.key)}
                        style={{
                          ...styles.btn,
                          border:
                            genrePresetKey === p.key
                              ? "2px solid #6366f1"
                              : "1px solid #e2e8f0",
                          background:
                            genrePresetKey === p.key ? "#eef2ff" : "#fff",
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ ...styles.label, marginBottom: 8 }}>
                    Layout
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.key}
                        onClick={() => setLayoutKey(l.key)}
                        style={{
                          ...styles.btn,
                          border:
                            layoutKey === l.key
                              ? "2px solid #6366f1"
                              : "1px solid #e2e8f0",
                          background: layoutKey === l.key ? "#eef2ff" : "#fff",
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ ...styles.label, marginBottom: 8 }}>
                    Font Family
                  </label>
                  <select
                    value={customFontFamily}
                    onChange={(e) => setCustomFontFamily(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  >
                    <option value="">Preset Default</option>
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.key} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={useCustomColors}
                      onChange={(e) => setUseCustomColors(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Custom Colors</span>
                  </label>
                  {useCustomColors && (
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <ColorPickerField
                        label="Title"
                        value={customTitleColor}
                        onChange={setCustomTitleColor}
                      />
                      <ColorPickerField
                        label="Subtitle"
                        value={customSubtitleColor}
                        onChange={setCustomSubtitleColor}
                      />
                      <ColorPickerField
                        label="Author"
                        value={customAuthorColor}
                        onChange={setCustomAuthorColor}
                      />
                      <ColorPickerField
                        label="Tagline"
                        value={customTaglineColor}
                        onChange={setCustomTaglineColor}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={useCustomBg}
                      onChange={(e) => setUseCustomBg(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Custom Gradient</span>
                  </label>
                  {useCustomBg && (
                    <div style={{ display: "flex", gap: 12 }}>
                      <ColorPickerField
                        label="Start"
                        value={customBgColor1}
                        onChange={setCustomBgColor1}
                      />
                      <ColorPickerField
                        label="End"
                        value={customBgColor2}
                        onChange={setCustomBgColor2}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* IMAGE TAB */}
            {activeTab === "image" && (
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    padding: "12px 20px",
                    borderRadius: 8,
                    border: "2px dashed #cbd5e1",
                    background: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  📁{" "}
                  {coverImageUploading
                    ? "Uploading..."
                    : "Upload Cover Image"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleCoverFileChange}
                    disabled={coverImageUploading}
                  />
                </label>

                {effectiveCoverUrl && (
                  <>
                    <div>
                      <label style={{ ...styles.label, marginBottom: 6 }}>
                        Image Fit
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["cover", "contain"].map((f) => (
                          <button
                            key={f}
                            onClick={() => setCoverImageFit(f)}
                            style={{
                              ...styles.btn,
                              border:
                                coverImageFit === f
                                  ? "2px solid #6366f1"
                                  : "1px solid #e2e8f0",
                              background:
                                coverImageFit === f ? "#eef2ff" : "#fff",
                            }}
                          >
                            {f === "cover" ? "Fill" : "Fit"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ ...styles.label, marginBottom: 6 }}>
                        Overlay
                      </label>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[
                          { k: "soft-dark", l: "Dark" },
                          { k: "soft-blur", l: "Light" },
                          { k: "none", l: "None" },
                        ].map((o) => (
                          <button
                            key={o.k}
                            onClick={() => setCoverImageFilter(o.k)}
                            style={{
                              ...styles.btn,
                              border:
                                coverImageFilter === o.k
                                  ? "2px solid #6366f1"
                                  : "1px solid #e2e8f0",
                              background:
                                coverImageFilter === o.k ? "#eef2ff" : "#fff",
                            }}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleClearCoverImage}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 8,
                        border: "1px solid #ef4444",
                        background: "#fef2f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                    >
                      Remove Image
                    </button>
                  </>
                )}
              </div>
            )}

            {/* BACK COVER TAB */}
            {activeTab === "back" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 16,
                  alignItems: "start",
                }}
              >
                <div>
                  <label style={styles.label}>Back Blurb</label>
                  <textarea
                    value={backBlurb}
                    onChange={(e) => setBackBlurb(e.target.value)}
                    rows={5}
                    placeholder="Your book description..."
                    style={{
                      ...styles.input,
                      minHeight: 120,
                      resize: "vertical",
                    }}
                  />
                </div>
                <div>
                  <label style={styles.label}>About the Author</label>
                  <textarea
                    value={aboutAuthor}
                    onChange={(e) => setAboutAuthor(e.target.value)}
                    rows={5}
                    placeholder="Short bio..."
                    style={{
                      ...styles.input,
                      minHeight: 120,
                      resize: "vertical",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    paddingTop: 20,
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showBackCover}
                      onChange={(e) => setShowBackCover(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Show Back Cover</span>
                  </label>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={showSpine}
                      onChange={(e) => setShowSpine(e.target.checked)}
                    />
                    <span style={{ fontSize: 12 }}>Show Spine</span>
                  </label>
                  {showSpine && (
                    <input
                      value={spineText}
                      onChange={(e) => setSpineText(e.target.value)}
                      placeholder="TITLE • AUTHOR"
                      style={{
                        padding: "8px",
                        borderRadius: 6,
                        border: "1px solid #e2e8f0",
                        fontSize: 11,
                        width: 150,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* EXPORT TAB */}
            {activeTab === "export" && (
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <label style={{ ...styles.label, marginBottom: 6 }}>
                    Trim Size
                  </label>
                  <select
                    value={trimKey}
                    onChange={(e) => setTrimKey(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  >
                    {TRIM_PRESETS.map((t) => (
                      <option key={t.key} value={t.key}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ ...styles.label, marginBottom: 6 }}>
                    DPI
                  </label>
                  <select
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                      fontSize: 13,
                    }}
                  >
                    <option value={300}>300 (print)</option>
                    <option value={150}>150 (draft)</option>
                  </select>
                </div>

                <button onClick={handleExportPNG} style={styles.btnPrimary}>
                  Export Full Spread
                </button>

                <div>
                  <label style={{ ...styles.label, marginBottom: 6 }}>
                    Load Saved Design
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={selectedDesignId}
                      onChange={(e) => handleLoadDesign(e.target.value)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        fontSize: 13,
                      }}
                    >
                      <option value="">— Select —</option>
                      {designs.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {selectedDesignId && (
                      <button
                        onClick={handleDeleteDesign}
                        style={{
                          ...styles.btn,
                          border: "1px solid #ef4444",
                          color: "#b91c1c",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========== PREVIEW AREA ========== */}
        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "40px 24px",
            overflow: "auto",
          }}
        >
          <div
            ref={coverRef}
            style={{
              display: "flex",
              gap: 0,
              borderRadius: 12,
              overflow: "hidden",
              boxShadow: "0 40px 100px rgba(0,0,0,0.4)",
            }}
          >
            {/* BACK COVER */}
            {showBackCover && (
              <div
                style={{
                  width: PANEL_W,
                  height: PANEL_H,
                  position: "relative",
                  padding: "28px 24px",
                  backgroundImage: effectiveCoverUrl
                    ? `url(${effectiveCoverUrl})`
                    : undefined,
                  background: effectiveCoverUrl
                    ? undefined
                    : useCustomBg
                    ? `linear-gradient(145deg, ${customBgColor1}, ${customBgColor2})`
                    : selectedPreset.bg,
                  backgroundSize: coverImageFit,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: overlayBackground,
                  }}
                />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 2,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.5)",
                      marginBottom: 12,
                    }}
                  >
                    Back Cover
                  </div>
                  {backBlurb ? (
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.65,
                        color: activeSubtitleColor,
                        fontFamily: activeFontFamily,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {backBlurb}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.5,
                        fontStyle: "italic",
                        color: "#fff",
                      }}
                    >
                      Add your back blurb in the Back Cover tab...
                    </div>
                  )}
                  {aboutAuthor && (
                    <div style={{ marginTop: 20 }}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          color: activeTitleColor,
                          marginBottom: 6,
                        }}
                      >
                        About the Author
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          lineHeight: 1.55,
                          color: activeSubtitleColor,
                          fontFamily: activeFontFamily,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {aboutAuthor}
                      </div>
                    </div>
                  )}
                </div>
                {/* Barcode placeholder */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 1,
                    alignSelf: "flex-end",
                    width: 110,
                    height: 55,
                    background: "rgba(255,255,255,0.92)",
                    borderRadius: 5,
                    display: "grid",
                    placeItems: "center",
                    fontSize: 9,
                    color: "#374151",
                    fontWeight: 500,
                  }}
                >
                  ISBN BARCODE
                </div>
              </div>
            )}

            {/* SPINE */}
            {showSpine && (
              <div
                style={{
                  width: SPINE_W,
                  height: PANEL_H,
                  background: "rgba(15,23,42,0.95)",
                  color: activeTitleColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontFamily: activeFontFamily,
                  fontSize: 10,
                  letterSpacing: 2,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  padding: 4,
                }}
              >
                {spineText || `${title} • ${author}`}
              </div>
            )}

            {/* FRONT COVER */}
            <div
              style={{
                width: PANEL_W,
                height: PANEL_H,
                position: "relative",
                overflow: "hidden",
                backgroundImage: effectiveCoverUrl
                  ? `url(${effectiveCoverUrl})`
                  : undefined,
                background: effectiveCoverUrl
                  ? undefined
                  : useCustomBg
                  ? `linear-gradient(145deg, ${customBgColor1}, ${customBgColor2})`
                  : selectedPreset.bg,
                backgroundSize: coverImageFit,
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                display: "flex",
                flexDirection: "column",
                justifyContent,
                padding: "36px 28px",
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
                  gap: 8,
                }}
              >
                {tagline && (
                  <div
                    style={{
                      fontSize: 14,
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
                    fontSize: 28,
                    lineHeight: 1.15,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    color: activeTitleColor,
                  }}
                >
                  {title || "YOUR TITLE"}
                </div>
                {subtitle && (
                  <div
                    style={{
                      fontSize: 13,
                      marginTop: 8,
                      color: activeSubtitleColor,
                      maxWidth: 280,
                      marginInline: "auto",
                      lineHeight: 1.4,
                    }}
                  >
                    {subtitle}
                  </div>
                )}
                <div
                  style={{
                    fontSize: 13,
                    marginTop: 28,
                    letterSpacing: 4,
                    textTransform: "uppercase",
                    color: activeAuthorColor,
                  }}
                >
                  {author || "AUTHOR"}
                </div>
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 14,
                  zIndex: 1,
                  fontSize: 8,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.5)",
                  background: "rgba(15,23,42,0.6)",
                  padding: "4px 8px",
                  borderRadius: 999,
                }}
              >
                DahTruth StoryLab
              </div>
            </div>
          </div>
        </div>

        {/* ========== FOOTER ========== */}
        <footer
          style={{
            background: "#1e293b",
            color: "#94a3b8",
            padding: "10px 24px",
            fontSize: 11,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            Preview: {showBackCover ? "Back + " : ""}
            {showSpine ? "Spine + " : ""}Front • {selectedTrim.label} @ {dpi}{" "}
            DPI
          </div>
          <div>✅ Auto-saving • {projectName || title}</div>
        </footer>
      </div>
    </PageShell>
  );
}

