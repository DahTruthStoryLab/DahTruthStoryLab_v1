// src/pages/Cover.jsx
// FIXED VERSION:
// 1. Saves S3 KEY (stable) instead of viewUrl (expires)
// 2. Calls getViewUrl(key) on load to get fresh signed URL
// 3. Removed "default" guard so it always saves
// 4. Robust project ID detection

import React, { useEffect, useRef, useState, useCallback } from "react";
import PageShell from "../components/layout/PageShell.tsx";
import { uploadImage, getViewUrl } from "../lib/uploads";  // ✅ ADDED getViewUrl
import { toPng } from "html-to-image";
import { storage } from "../lib/storage";
import { loadProject, saveProject } from "../lib/projectsService";

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

// ✅ ADDED: Robust project ID detection that checks multiple storage locations
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
  "#ffffff",
  "#f9fafb",
  "#f3f4f6",
  "#e5e7eb",
  "#d1d5db",
  "#d4af37",
  "#facc15",
  "#fbbf24",
  "#f59e0b",
  "#eab308",
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#f43f5e",
  "#ec4899",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e3a5f",
  "#0f172a",
  "#8b5cf6",
  "#7c3aed",
  "#6366f1",
  "#b8a9c9",
  "#a855f7",
  "#22c55e",
  "#16a34a",
  "#15803d",
  "#10b981",
  "#059669",
  "#111827",
  "#1f2937",
  "#374151",
  "#4b5563",
  "#000000",
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

// ✅ CHANGED: Storage keys now store KEY not URL
const coverDesignsKeyForProject = (projectId) => `dahtruth_cover_designs_${projectId}`;
const coverImageKeyForProject = (projectId) => `dahtruth_cover_image_key_${projectId}`;  // ✅ Changed from _url to _key
const coverImageMetaKeyForProject = (projectId) => `dahtruth_cover_image_meta_${projectId}`;
const coverSettingsKeyForProject = (projectId) => `dahtruth_cover_settings_${projectId}`;

// Project data key (to get project title)
const projectDataKeyForProject = (projectId) => `dahtruth-project-${projectId}`;

// Legacy keys (kept ONLY for backwards compat writing)
const COVER_DESIGNS_KEY = "dahtruth_cover_designs_v1";
const COVER_IMAGE_KEY_LEGACY = "dahtruth_cover_image_key";

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// Get project title from storage (best-effort)
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
  outer: {
    maxWidth: 1400,  // ✅ Increased for back+spine+front spread
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

// Color Picker Component with swatches + hex input
function ColorPickerField({ label, value, onChange }) {
  const [showSwatches, setShowSwatches] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...styles.label, marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          onClick={() => setShowSwatches(!showSwatches)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
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
            padding: "8px 10px",
            fontSize: 13,
            fontFamily: "monospace",
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.white,
          }}
        />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 36,
            height: 36,
            padding: 0,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            cursor: "pointer",
            background: "transparent",
          }}
          title="Open color picker"
        />
      </div>

      {showSwatches && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "#f8fafc",
            borderRadius: 10,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ fontSize: 10, color: theme.subtext, marginBottom: 6 }}>
            Quick colors (click to select):
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setShowSwatches(false);
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
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

/**
 * Persist cover fields into the *actual* Project record (IndexedDB).
 * ✅ CHANGED: Now saves coverImageKey instead of coverImageUrl
 */
async function persistCoverToProjectRecord(projectId, payload) {
  if (!projectId) return;  // ✅ REMOVED "default" check

  try {
    const project = await loadProject(projectId, { preferCloud: false });
    if (!project) {
      console.warn("[Cover] No project found for id:", projectId);
      return;
    }

    // Ensure objects exist
    project.book = project.book || {};
    project.cover = project.cover || {};
    project.publishing = project.publishing || {};
    project.publishing.meta = project.publishing.meta || {};

    // Keep titles in sync
    if (payload.title !== undefined) {
      const nextTitle = payload.title || "";
      project.title = nextTitle;
      project.book.title = nextTitle;
      project.publishing.meta.title = nextTitle;
      project.cover.title = nextTitle;
    }

    // Cover text fields
    if (payload.subtitle !== undefined) project.cover.subtitle = payload.subtitle || "";
    if (payload.author !== undefined) {
      project.cover.author = payload.author || "";
      project.publishing.meta.author = payload.author || project.publishing.meta.author || "";
    }
    if (payload.tagline !== undefined) project.cover.tagline = payload.tagline || "";

    // ✅ CHANGED: Save imageKey (stable) instead of imageUrl (expires)
    if (payload.coverImageKey !== undefined) {
      project.cover.imageKey = payload.coverImageKey || "";
      project.publishing.coverImageKey = payload.coverImageKey || "";
    }

    if (payload.coverImageFit !== undefined) project.cover.imageFit = payload.coverImageFit;
    if (payload.coverImageFilter !== undefined) project.cover.imageFilter = payload.coverImageFilter;

    // ✅ Back cover fields
    if (payload.backBlurb !== undefined) project.cover.backBlurb = payload.backBlurb || "";
    if (payload.aboutAuthor !== undefined) project.cover.aboutAuthor = payload.aboutAuthor || "";
    if (payload.spineText !== undefined) project.cover.spineText = payload.spineText || "";

    // Timestamp
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

export default function Cover() {
  const coverRef = useRef(null);

  // Debounce project-record writes
  const persistTimerRef = useRef(null);
  const schedulePersistRef = useRef(null);
  
  // ✅ FIX B: Prevent auto-save during hydration
  const isHydratingRef = useRef(false);
  
  // ✅ FIX C: Keep stable URL to prevent flicker
  const stableCoverUrlRef = useRef("");
  
  // ✅ FIX D: Prevent concurrent loads
  const isLoadingRef = useRef(false);

  // Project ID and name
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");

  // Text content
  const [title, setTitle] = useState("Working Title");
  const [subtitle, setSubtitle] = useState("Optional subtitle");
  const [author, setAuthor] = useState("Your Name");
  const [tagline, setTagline] = useState("A NOVEL");

  // Preset & layout
  const [genrePresetKey, setGenrePresetKey] = useState("general");
  const [layoutKey, setLayoutKey] = useState("center");

  // Custom colors (override preset colors)
  const [useCustomColors, setUseCustomColors] = useState(false);
  const [customTitleColor, setCustomTitleColor] = useState("#f9fafb");
  const [customSubtitleColor, setCustomSubtitleColor] = useState("#e5e7eb");
  const [customAuthorColor, setCustomAuthorColor] = useState("#e5e7eb");
  const [customTaglineColor, setCustomTaglineColor] = useState("#e5e7eb");

  // Custom font
  const [customFontFamily, setCustomFontFamily] = useState("");

  // Custom background (when no image)
  const [customBgColor1, setCustomBgColor1] = useState("#111827");
  const [customBgColor2, setCustomBgColor2] = useState("#1e293b");
  const [useCustomBg, setUseCustomBg] = useState(false);

  // ✅ CHANGED: Store both KEY (stable, persisted) and URL (temporary, for display)
  const [coverImageKey, setCoverImageKey] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageUploading, setCoverImageUploading] = useState(false);
  const [coverImageFit, setCoverImageFit] = useState("cover");
  const [coverImageFilter, setCoverImageFilter] = useState("soft-dark");

  // UI state
  const [designMode, setDesignMode] = useState("upload");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [coverLoaded, setCoverLoaded] = useState(false);

  // ✅ Back cover content
  const [backBlurb, setBackBlurb] = useState("");
  const [aboutAuthor, setAboutAuthor] = useState("");
  const [showBackCover, setShowBackCover] = useState(true);

  // ✅ Spine
  const [showSpine, setShowSpine] = useState(false);
  const [spineText, setSpineText] = useState("");

  // Export settings
  const [trimKey, setTrimKey] = useState("6x9");
  const [dpi, setDpi] = useState(300);

  // Save/Load designs
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");

  const selectedPreset =
    GENRE_PRESETS.find((p) => p.key === genrePresetKey) || GENRE_PRESETS[0];
  const selectedTrim =
    TRIM_PRESETS.find((t) => t.key === trimKey) || TRIM_PRESETS[0];

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

  // ✅ FIX C: Keep stable URL to prevent flicker during transient state updates
  useEffect(() => {
    if (coverImageUrl) stableCoverUrlRef.current = coverImageUrl;
  }, [coverImageUrl]);

  const effectiveCoverUrl = coverImageUrl || stableCoverUrlRef.current;

  let justifyContent = "center";
  if (layoutKey === "top") justifyContent = "flex-start";
  if (layoutKey === "bottom") justifyContent = "flex-end";

  // Debounced persist into Project record
  const schedulePersistToProjectRecord = useCallback((pid, payload) => {
    if (!pid) return;
    
    // ✅ FIX: Don't persist while loading/hydrating
    if (isHydratingRef.current || isLoadingRef.current) {
      console.log("[Cover] Skipping persist during hydration/loading");
      return;
    }

    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      // Double-check we're not hydrating when timeout fires
      if (isHydratingRef.current || isLoadingRef.current) return;
      void persistCoverToProjectRecord(pid, payload);
    }, 500);  // Increased debounce to 500ms
  }, []);

  useEffect(() => {
    schedulePersistRef.current = schedulePersistToProjectRecord;
  }, [schedulePersistToProjectRecord]);

  // ✅ CHANGED: Load cover data - now fetches fresh viewUrl from saved key
  const loadCoverData = useCallback(async (pid) => {
    if (!pid) return;
    
    // ✅ FIX D: Prevent concurrent loads
    if (isLoadingRef.current) {
      console.log("[Cover] Already loading, skipping");
      return;
    }
    isLoadingRef.current = true;

    console.log("[Cover] Loading data for project:", pid);
    
    // ✅ FIX B: Block auto-save during hydration
    isHydratingRef.current = true;

    try {
      const pName = getProjectTitle(pid);
      setProjectName(pName || "");

      // ✅ SIMPLIFIED: Use direct S3 URL (no async call = no re-render)
      const savedKey = storage.getItem(coverImageKeyForProject(pid));
      if (savedKey) {
        setCoverImageKey(savedKey);
        console.log("[Cover] Found saved image key:", savedKey);
        
        // Build direct S3 URL - no async call needed
        const bucket = import.meta.env.VITE_S3_BUCKET || "dahtruth-user-stories";
        const region = import.meta.env.VITE_S3_REGION || "us-east-1";
        const directUrl = `https://${bucket}.s3.${region}.amazonaws.com/${savedKey}`;
        setCoverImageUrl(directUrl);
        stableCoverUrlRef.current = directUrl;
        console.log("[Cover] Using direct S3 URL:", directUrl);
      } else {
        setCoverImageKey("");
        setCoverImageUrl("");
      }

      // Load cover image meta
      const savedMeta = storage.getItem(coverImageMetaKeyForProject(pid));
      if (savedMeta) {
        const meta = safeJsonParse(savedMeta, {});
        if (meta.fit) setCoverImageFit(meta.fit);
        if (meta.filter) setCoverImageFilter(meta.filter);
      }

      // Load cover settings (colors, fonts, etc.)
      const savedSettings = storage.getItem(coverSettingsKeyForProject(pid));
      if (savedSettings) {
        const settings = safeJsonParse(savedSettings, {});
        if (settings.title) setTitle(settings.title);
        if (settings.subtitle !== undefined) setSubtitle(settings.subtitle);
        if (settings.author) setAuthor(settings.author);
        if (settings.tagline !== undefined) setTagline(settings.tagline);
        if (settings.genrePresetKey) setGenrePresetKey(settings.genrePresetKey);
        if (settings.layoutKey) setLayoutKey(settings.layoutKey);
        if (settings.trimKey) setTrimKey(settings.trimKey);

        if (typeof settings.useCustomColors === "boolean") setUseCustomColors(settings.useCustomColors);
        if (settings.customTitleColor) setCustomTitleColor(settings.customTitleColor);
        if (settings.customSubtitleColor) setCustomSubtitleColor(settings.customSubtitleColor);
        if (settings.customAuthorColor) setCustomAuthorColor(settings.customAuthorColor);
        if (settings.customTaglineColor) setCustomTaglineColor(settings.customTaglineColor);

        if (settings.customFontFamily !== undefined) setCustomFontFamily(settings.customFontFamily);

        if (typeof settings.useCustomBg === "boolean") setUseCustomBg(settings.useCustomBg);
        if (settings.customBgColor1) setCustomBgColor1(settings.customBgColor1);
        if (settings.customBgColor2) setCustomBgColor2(settings.customBgColor2);

        // ✅ Back cover settings
        if (settings.backBlurb !== undefined) setBackBlurb(settings.backBlurb);
        if (settings.aboutAuthor !== undefined) setAboutAuthor(settings.aboutAuthor);
        if (typeof settings.showBackCover === "boolean") setShowBackCover(settings.showBackCover);

        // ✅ Spine settings
        if (typeof settings.showSpine === "boolean") setShowSpine(settings.showSpine);
        if (settings.spineText !== undefined) setSpineText(settings.spineText);
      } else {
        const pTitle = getProjectTitle(pid);
        if (pTitle) setTitle(pTitle);
      }

      // Load saved designs
      let savedDesigns = storage.getItem(coverDesignsKeyForProject(pid));
      if (!savedDesigns) savedDesigns = storage.getItem(COVER_DESIGNS_KEY);
      const designsArray = safeJsonParse(savedDesigns, []);
      setDesigns(Array.isArray(designsArray) ? designsArray : []);
    } catch (e) {
      console.error("[Cover] Failed to load cover data:", e);
    } finally {
      // ✅ FIX D: Allow future loads
      isLoadingRef.current = false;
      
      // ✅ FIX: Small delay before enabling auto-save to let state settle
      setTimeout(() => {
        isHydratingRef.current = false;
        setCoverLoaded(true);
      }, 100);
    }
  }, []);

  // ✅ CHANGED: Initialize with robust project ID detection
  useEffect(() => {
    const initProject = () => {
      try {
        const id = getActiveProjectId();
        console.log("[Cover] Initializing with project ID:", id);
        setProjectId(id);
        setCoverLoaded(false);
        loadCoverData(id);
        
        // Ensure project ID is saved consistently
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
    // ✅ REMOVED storage listener - was causing infinite re-render loop

    return () => {
      window.removeEventListener("project:change", handleProjectChange);
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [loadCoverData]);

  // ✅ CHANGED: Auto-save - removed "default" guard, saves KEY not URL
  useEffect(() => {
    // ✅ FIX B: Don't save while hydrating
    if (!coverLoaded || isHydratingRef.current || !projectId) return;

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
        // ✅ Back cover
        backBlurb,
        aboutAuthor,
        showBackCover,
        // ✅ Spine
        showSpine,
        spineText,
      };

      storage.setItem(coverSettingsKeyForProject(projectId), JSON.stringify(settings));

      // ✅ CHANGED: Save KEY (stable) not URL (expires)
      if (coverImageKey) {
        storage.setItem(coverImageKeyForProject(projectId), coverImageKey);
        storage.setItem(COVER_IMAGE_KEY_LEGACY, coverImageKey);
      } else {
        storage.removeItem(coverImageKeyForProject(projectId));
        storage.removeItem(COVER_IMAGE_KEY_LEGACY);
      }

      // Save image meta
      if (coverImageKey) {
        storage.setItem(
          coverImageMetaKeyForProject(projectId),
          JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
        );
      } else {
        storage.removeItem(coverImageMetaKeyForProject(projectId));
      }

      // Persist into Project record (IndexedDB)
      if (schedulePersistRef.current) {
        schedulePersistRef.current(projectId, {
          title,
          subtitle,
          author,
          tagline,
          coverImageKey,
          coverImageFit,
          coverImageFilter,
          // ✅ Back cover
          backBlurb,
          aboutAuthor,
          spineText,
        });
      }
    } catch (e) {
      console.error("[Cover] Failed to save cover settings:", e);
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
    coverImageKey,
    coverImageFit,
    coverImageFilter,
    // ✅ Back cover dependencies
    backBlurb,
    aboutAuthor,
    showBackCover,
    showSpine,
    spineText,
  ]);

  // ✅ CHANGED: Save KEY not URL on upload
  const handleCoverFileChange = async (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const pid = projectId || getActiveProjectId();

    try {
      setCoverImageUploading(true);

      const result = await uploadImage(file);
      if (!result?.key) throw new Error("No key in upload response");

      // ✅ CHANGED: Save the KEY (stable), use viewUrl for immediate display
      setCoverImageKey(result.key);
      setCoverImageUrl(result.viewUrl);

      console.log("[Cover] Image uploaded, key:", result.key);

      // ✅ CHANGED: Always save, removed "default" check
      if (pid) {
        storage.setItem(coverImageKeyForProject(pid), result.key);
        storage.setItem(
          coverImageMetaKeyForProject(pid),
          JSON.stringify({ fit: coverImageFit, filter: coverImageFilter })
        );
        storage.setItem(COVER_IMAGE_KEY_LEGACY, result.key);
      }

      // Persist to Project record
      await persistCoverToProjectRecord(pid, {
        title,
        subtitle,
        author,
        tagline,
        coverImageKey: result.key,  // ✅ CHANGED: Save key not URL
        coverImageFit,
        coverImageFilter,
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

    if (pid) {
      storage.removeItem(coverImageKeyForProject(pid));
      storage.removeItem(coverImageMetaKeyForProject(pid));
      storage.removeItem(COVER_IMAGE_KEY_LEGACY);
    }

    await persistCoverToProjectRecord(pid, {
      title,
      subtitle,
      author,
      tagline,
      coverImageKey: "",
      coverImageFit,
      coverImageFilter,
    });
  };

  const applyPresetToCustom = () => {
    setCustomTitleColor(selectedPreset.titleColor);
    setCustomSubtitleColor(selectedPreset.subtitleColor);
    setCustomAuthorColor(selectedPreset.authorColor);
    setCustomTaglineColor(selectedPreset.subtitleColor);
    setUseCustomColors(true);
  };

  // ✅ CHANGED: Build design with key not URL
  const buildCurrentDesign = () => {
    const id =
      typeof crypto !== "undefined" && crypto?.randomUUID
        ? crypto.randomUUID()
        : String(Date.now());

    return {
      id,
      name: (designName || title || "Untitled").trim(),
      createdAt: new Date().toISOString(),
      title,
      subtitle,
      author,
      tagline,
      genrePresetKey,
      layoutKey,
      coverImageKey,
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
      // ✅ Back cover
      backBlurb,
      aboutAuthor,
      showBackCover,
      showSpine,
      spineText,
    };
  };

  // ✅ CHANGED: Apply design loads key and fetches fresh URL
  const applyDesign = async (d) => {
    if (!d) return;
    setTitle(d.title ?? "Working Title");
    setSubtitle(d.subtitle ?? "");
    setAuthor(d.author ?? "Your Name");
    setTagline(d.tagline ?? "A NOVEL");
    setGenrePresetKey(d.genrePresetKey ?? "general");
    setLayoutKey(d.layoutKey ?? "center");
    
    // ✅ CHANGED: Load key and fetch fresh URL
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
      setCoverImageUrl(d.coverImageUrl ?? "");  // Fallback for old designs
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
    
    // ✅ Back cover
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

    if (projectId) {  // ✅ REMOVED "default" check
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

    if (projectId) {  // ✅ REMOVED "default" check
      storage.setItem(coverDesignsKeyForProject(projectId), JSON.stringify(updated));
      storage.setItem(COVER_DESIGNS_KEY, JSON.stringify(updated));
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

  // ✅ FIX C: Use effectiveCoverUrl for overlay too
  const overlayBackground = effectiveCoverUrl
    ? coverImageFilter === "soft-dark"
      ? "linear-gradient(180deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8))"
      : coverImageFilter === "soft-blur"
      ? "linear-gradient(180deg, rgba(15,23,42,0.25), rgba(15,23,42,0.6))"
      : "transparent"
    : selectedPreset.overlay;

  // Preview dimensions for sidebar layout
  const COVER_PREVIEW_WIDTH = 360;
  const coverPreviewHeight = Math.round(
    COVER_PREVIEW_WIDTH * (selectedTrim.hIn / selectedTrim.wIn)
  );

  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
        padding: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* ========== HEADER ========== */}
        <header
          style={{
            background: "linear-gradient(135deg, #1e3a5f, #4c1d95)",
            color: "#ffffff",
            padding: "14px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              maxWidth: 1600,
              margin: "0 auto",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.7,
                  marginBottom: 2,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                <a
                  href="/publishing"
                  style={{ color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
                >
                  PUBLISHING SUITE
                </a>
                {" ▸ "}Cover Designer
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {projectName || title || "Untitled Project"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleSaveDesign}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                💾 Save Design
              </button>
              <button
                onClick={handleExportPNG}
                style={{
                  padding: "8px 14px",
                  borderRadius: 6,
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
            </div>
          </div>
        </header>

        {/* ========== MAIN BODY: LEFT | CENTER | RIGHT ========== */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "320px 1fr 320px",
            gap: 20,
            padding: "20px 24px",
            maxWidth: 1600,
            margin: "0 auto",
            width: "100%",
            boxSizing: "border-box",
            alignItems: "start",
          }}
        >

          {/* ========== LEFT SIDEBAR ========== */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              maxHeight: "calc(100vh - 140px)",
            }}
          >
            {/* Save & Load Designs */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                💾 Save & Load
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={styles.label}>Design name</div>
                  <input
                    style={styles.input}
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="e.g., Thriller v2"
                  />
                </div>
                <button type="button" onClick={handleSaveDesign} style={styles.btnPrimary}>
                  Save Current Design
                </button>
                <div>
                  <div style={styles.label}>Load saved design</div>
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
                    style={{ ...styles.btn, border: "1px solid #ef4444", color: "#b91c1c", background: "#fef2f2" }}
                  >
                    Delete Selected
                  </button>
                )}
              </div>
            </div>

            {/* Text & Metadata */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                📝 Text & Metadata
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
                  <div style={styles.label}>Subtitle</div>
                  <input
                    style={styles.input}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Optional subtitle"
                  />
                </div>
                <div>
                  <div style={styles.label}>Author</div>
                  <input
                    style={styles.input}
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                  />
                </div>
              </div>
            </div>

            {/* Genre Preset */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                🎨 Genre & Layout
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={styles.label}>Genre Preset</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {GENRE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setGenrePresetKey(p.key)}
                        style={{
                          ...styles.btn,
                          fontSize: 10,
                          padding: "5px 8px",
                          border: genrePresetKey === p.key ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                          background: genrePresetKey === p.key ? "#eef2ff" : theme.white,
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={styles.label}>Layout</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.key}
                        type="button"
                        onClick={() => setLayoutKey(l.key)}
                        style={{
                          ...styles.btn,
                          border: layoutKey === l.key ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                          background: layoutKey === l.key ? "#eef2ff" : theme.white,
                        }}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Colors & Fonts */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                🎨 Colors & Fonts
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={styles.label}>Font Family</div>
                  <select
                    style={styles.input}
                    value={customFontFamily}
                    onChange={(e) => setCustomFontFamily(e.target.value)}
                  >
                    <option value="">Preset Default</option>
                    {FONT_FAMILIES.map((f) => (
                      <option key={f.key} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={useCustomColors}
                    onChange={(e) => setUseCustomColors(e.target.checked)}
                  />
                  <span style={{ fontSize: 12 }}>Custom Text Colors</span>
                </label>

                {useCustomColors && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ColorPickerField label="Title" value={customTitleColor} onChange={setCustomTitleColor} />
                    <ColorPickerField label="Subtitle" value={customSubtitleColor} onChange={setCustomSubtitleColor} />
                    <ColorPickerField label="Author" value={customAuthorColor} onChange={setCustomAuthorColor} />
                    <ColorPickerField label="Tagline" value={customTaglineColor} onChange={setCustomTaglineColor} />
                  </div>
                )}

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={useCustomBg}
                    onChange={(e) => setUseCustomBg(e.target.checked)}
                  />
                  <span style={{ fontSize: 12 }}>Custom Background Gradient</span>
                </label>

                {useCustomBg && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <ColorPickerField label="Gradient Start" value={customBgColor1} onChange={setCustomBgColor1} />
                    <ColorPickerField label="Gradient End" value={customBgColor2} onChange={setCustomBgColor2} />
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* ========== CENTER: PREVIEW ========== */}
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              position: "sticky",
              top: 20,
            }}
          >
            <div style={{ ...styles.glassCard, width: "100%", padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.text }}>
                  Live Preview
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: theme.subtext }}>
                    {selectedTrim.label}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: theme.subtext }}>Auto-saves</div>
              </div>

              <div
                ref={coverRef}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  alignItems: "center",
                }}
              >
                {/* FRONT COVER */}
                <div
                  style={{
                    width: COVER_PREVIEW_WIDTH,
                    height: coverPreviewHeight,
                    position: "relative",
                    overflow: "hidden",
                    borderRadius: 10,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                    backgroundImage: effectiveCoverUrl ? `url(${effectiveCoverUrl})` : undefined,
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
                    alignItems: "center",
                    padding: "28px 22px",
                  }}
                >
                  {/* Overlay */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: overlayBackground,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Front Cover Content */}
                  <div
                    style={{
                      position: "relative",
                      zIndex: 1,
                      textAlign: "center",
                      fontFamily: activeFontFamily,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {tagline && (
                      <div
                        style={{
                          fontSize: 11,
                          letterSpacing: 3,
                          textTransform: "uppercase",
                          color: activeTaglineColor,
                        }}
                      >
                        {tagline}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 24,
                        lineHeight: 1.15,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        color: activeTitleColor,
                        textShadow: effectiveCoverUrl ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                      }}
                    >
                      {title || "YOUR TITLE"}
                    </div>
                    {subtitle && (
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          color: activeSubtitleColor,
                          maxWidth: 240,
                          lineHeight: 1.4,
                        }}
                      >
                        {subtitle}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 22,
                        letterSpacing: 3,
                        textTransform: "uppercase",
                        color: activeAuthorColor,
                      }}
                    >
                      {author || "AUTHOR"}
                    </div>
                  </div>

                  {/* StoryLab Badge */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 10,
                      right: 12,
                      fontSize: 7,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                      background: "rgba(15,23,42,0.5)",
                      padding: "3px 6px",
                      borderRadius: 999,
                    }}
                  >
                    DahTruth StoryLab
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      left: 12,
                      fontSize: 8,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    Front Cover
                  </div>
                </div>

                {/* BACK COVER */}
                {showBackCover && (
                  <div
                    style={{
                      width: COVER_PREVIEW_WIDTH,
                      height: coverPreviewHeight,
                      position: "relative",
                      overflow: "hidden",
                      borderRadius: 10,
                      boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
                      backgroundImage: effectiveCoverUrl ? `url(${effectiveCoverUrl})` : undefined,
                      background: effectiveCoverUrl
                        ? undefined
                        : useCustomBg
                        ? `linear-gradient(145deg, ${customBgColor1}, ${customBgColor2})`
                        : selectedPreset.bg,
                      backgroundSize: coverImageFit,
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      padding: "22px 18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: overlayBackground,
                        pointerEvents: "none",
                      }}
                    />

                    <div style={{ position: "relative", zIndex: 1 }}>
                      {/* Label */}
                      <div
                        style={{
                          fontSize: 8,
                          letterSpacing: 1.5,
                          textTransform: "uppercase",
                          color: "rgba(255,255,255,0.4)",
                          marginBottom: 10,
                        }}
                      >
                        Back Cover
                      </div>

                      {/* Blurb */}
                      {backBlurb ? (
                        <div
                          style={{
                            fontSize: 11,
                            lineHeight: 1.55,
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
                            fontSize: 10,
                            opacity: 0.5,
                            fontStyle: "italic",
                            color: "#fff",
                          }}
                        >
                          Add blurb in Back Cover section →
                        </div>
                      )}

                      {/* Author Bio */}
                      {aboutAuthor && (
                        <div style={{ marginTop: 14 }}>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: 1.5,
                              textTransform: "uppercase",
                              color: activeTitleColor,
                              marginBottom: 4,
                            }}
                          >
                            About the Author
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              lineHeight: 1.45,
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

                    {/* ISBN Placeholder */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        alignSelf: "flex-end",
                        width: 90,
                        height: 45,
                        background: "rgba(255,255,255,0.9)",
                        borderRadius: 4,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 8,
                        color: "#374151",
                        fontWeight: 500,
                      }}
                    >
                      ISBN BARCODE
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ========== RIGHT SIDEBAR ========== */}
          <aside
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              maxHeight: "calc(100vh - 140px)",
            }}
          >
            {/* Background Image */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                🖼️ Background Image
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    border: "2px dashed #cbd5e1",
                    background: "#f8fafc",
                    cursor: "pointer",
                    fontSize: 12,
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  📁 {coverImageUploading ? "Uploading..." : "Upload Image"}
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
                      <div style={styles.label}>Image Fit</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {["cover", "contain"].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setCoverImageFit(f)}
                            style={{
                              ...styles.btn,
                              border: coverImageFit === f ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                              background: coverImageFit === f ? "#eef2ff" : theme.white,
                            }}
                          >
                            {f === "cover" ? "Fill" : "Fit"}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div style={styles.label}>Overlay</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {[
                          { k: "soft-dark", l: "Dark" },
                          { k: "soft-blur", l: "Light" },
                          { k: "none", l: "None" },
                        ].map((o) => (
                          <button
                            key={o.k}
                            type="button"
                            onClick={() => setCoverImageFilter(o.k)}
                            style={{
                              ...styles.btn,
                              border: coverImageFilter === o.k ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                              background: coverImageFilter === o.k ? "#eef2ff" : theme.white,
                            }}
                          >
                            {o.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearCoverImage}
                      style={{
                        ...styles.btn,
                        border: "1px solid #ef4444",
                        color: "#b91c1c",
                        background: "#fef2f2",
                      }}
                    >
                      Remove Image
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Back Cover Content */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                📘 Back Cover
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showBackCover}
                    onChange={(e) => setShowBackCover(e.target.checked)}
                  />
                  <span style={{ fontSize: 12 }}>Show Back Cover</span>
                </label>

                <div>
                  <div style={styles.label}>Book Description / Blurb</div>
                  <textarea
                    style={{ ...styles.input, minHeight: 100, resize: "vertical" }}
                    value={backBlurb}
                    onChange={(e) => setBackBlurb(e.target.value)}
                    placeholder="Your book description..."
                    rows={5}
                  />
                </div>

                <div>
                  <div style={styles.label}>About the Author</div>
                  <textarea
                    style={{ ...styles.input, minHeight: 70, resize: "vertical" }}
                    value={aboutAuthor}
                    onChange={(e) => setAboutAuthor(e.target.value)}
                    placeholder="Short author bio..."
                    rows={3}
                  />
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={showSpine}
                    onChange={(e) => setShowSpine(e.target.checked)}
                  />
                  <span style={{ fontSize: 12 }}>Show Spine (for full wrap)</span>
                </label>

                {showSpine && (
                  <div>
                    <div style={styles.label}>Spine Text</div>
                    <input
                      style={styles.input}
                      value={spineText}
                      onChange={(e) => setSpineText(e.target.value)}
                      placeholder="TITLE • AUTHOR"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Export Settings */}
            <div style={styles.glassCard}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 600, color: theme.text }}>
                📦 Export Settings
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div>
                  <div style={styles.label}>Trim Size</div>
                  <select
                    style={styles.input}
                    value={trimKey}
                    onChange={(e) => setTrimKey(e.target.value)}
                  >
                    {TRIM_PRESETS.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
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
                    <option value={300}>300 DPI (print quality)</option>
                    <option value={150}>150 DPI (draft)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleExportPNG}
                  style={{ ...styles.btnPrimary, marginTop: 4 }}
                >
                  📦 Export PNG
                </button>

                <p style={{ fontSize: 10, color: theme.subtext, margin: 0 }}>
                  Exports visible covers. KDP requires 300 DPI for print.
                </p>
              </div>
            </div>
          </aside>

        </div>

        {/* ========== FOOTER STATUS BAR ========== */}
        <footer
          style={{
            background: "#1e293b",
            color: "#94a3b8",
            padding: "10px 24px",
            fontSize: 11,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            Design both sides of your book. Print-ready previews update in real time.
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>✅ Auto-saving</span>
            <span>•</span>
            <span>{selectedTrim.label} @ {dpi} DPI</span>
          </div>
        </footer>
      </div>
    </PageShell>
  );
}

