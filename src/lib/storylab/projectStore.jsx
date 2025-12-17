// src/lib/storylab/projectStore.js
// Updated to connect with ComposePage and the unified project system

// Legacy key (kept for backward compatibility)
export const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

// Keys from ComposePage / main project system
const CURRENT_PROJECT_KEY = "dahtruth_current_project";
const LEGACY_CHAPTERS_KEY = "dahtruth_chapters";
const LEGACY_META_KEY = "dahtruth_project_meta";

/** Safe localStorage check (avoid SSR/test crashes) */
function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/**
 * Load the current project from the unified system
 * Priority:
 * 1. New project system (dahtruth_current_project)
 * 2. Legacy Compose chapters (dahtruth_chapters) ← ComposePage writes here
 * 3. Legacy StoryLab key (dahtruth-story-lab-toc-v3)
 */
export function loadProject() {
  if (!hasStorage()) return null;

  try {
    // 1. Try new unified project system first
    const currentProjectRaw = window.localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentProjectRaw) {
      const project = JSON.parse(currentProjectRaw);
      if (project && project.compose && Array.isArray(project.compose.chapters)) {
        const converted = {
          id: project.id,
          title: project.title,
          author: project.author,
          chapters: project.compose.chapters.map((ch, idx) => ({
            id: ch.id,
            title: ch.title || `Chapter ${idx + 1}`,
            text: ch.text || ch.textHTML || ch.content || "",
            textHTML: ch.textHTML || ch.text || ch.content || "",
            content: ch.content || ch.text || ch.textHTML || "",
            wordCount: ch.wordCount || 0,
            status: ch.status || "draft",
            included: ch.included !== false,
            storyLab: ch.storyLab || {},
          })),
          characters: project.compose.characters || [],
          roadmap: [],
          priorities: [],
          scenes: [],
          _source: "unified",
        };
        return ensureWorkshopFields(converted);
      }
    }

    // 2. Try legacy Compose chapters (this is what ComposePage writes to!)
    const legacyChaptersRaw = window.localStorage.getItem(LEGACY_CHAPTERS_KEY);
    if (legacyChaptersRaw) {
      const chapters = JSON.parse(legacyChaptersRaw);
      if (Array.isArray(chapters) && chapters.length > 0) {
        // Get meta if available
        let meta = {};
        try {
          const metaRaw = window.localStorage.getItem(LEGACY_META_KEY);
          if (metaRaw) meta = JSON.parse(metaRaw);
        } catch {}

        const converted = {
          id: meta.id || "legacy-project",
          title: meta.title || "My Story",
          author: meta.author || "Author",
          chapters: chapters.map((ch, idx) => ({
            id: ch.id || String(idx),
            title: ch.title || `Chapter ${idx + 1}`,
            text: ch.text || ch.textHTML || ch.content || ch.body || "",
            textHTML: ch.textHTML || ch.text || ch.content || "",
            content: ch.content || ch.text || ch.textHTML || "",
            wordCount: ch.wordCount || 0,
            status: ch.status || "draft",
            included: ch.included !== false,
            storyLab: ch.storyLab || {},
          })),
          characters: [],
          roadmap: [],
          priorities: [],
          scenes: [],
          _source: "legacy-compose",
        };
        return ensureWorkshopFields(converted);
      }
    }

    // 3. Try legacy StoryLab key
    const storyLabRaw = window.localStorage.getItem(STORAGE_KEY);
    if (storyLabRaw) {
      const parsed = JSON.parse(storyLabRaw);
      if (parsed && (parsed.chapters || parsed.title)) {
        return migrate(parsed);
      }
    }

    // No data found
    return null;
  } catch (err) {
    console.error("[projectStore] Failed to load project:", err);
    return null;
  }
}

/**
 * Save project back to storage
 * Writes to StoryLab key AND syncs back to Compose's dahtruth_chapters
 */
export function saveProject(next) {
  if (!hasStorage() || !next) return;

  try {
    // Always save to StoryLab key for backward compat
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // Also sync back to dahtruth_chapters so ComposePage sees changes
    if (next.chapters && Array.isArray(next.chapters)) {
      const chaptersForCompose = next.chapters.map((ch, idx) => ({
        id: ch.id,
        title: ch.title || `Chapter ${idx + 1}`,
        content: ch.content || ch.text || ch.textHTML || "",
        text: ch.text || ch.content || "",
        textHTML: ch.textHTML || ch.text || ch.content || "",
        wordCount: ch.wordCount || countWords(ch.text || ch.content || ""),
        status: ch.status || "draft",
        included: ch.included !== false,
        storyLab: ch.storyLab || {},
      }));
      window.localStorage.setItem(LEGACY_CHAPTERS_KEY, JSON.stringify(chaptersForCompose));
    }

    // Update unified project system if it exists
    const currentProjectRaw = window.localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentProjectRaw) {
      const currentProject = JSON.parse(currentProjectRaw);
      if (currentProject && currentProject.compose) {
        currentProject.compose.chapters = (next.chapters || []).map((ch, idx) => {
          const existing = currentProject.compose.chapters?.find(c => c.id === ch.id) || {};
          return {
            ...existing,
            id: ch.id,
            title: ch.title || `Chapter ${idx + 1}`,
            text: ch.text || ch.content || "",
            textHTML: ch.textHTML || ch.text || ch.content || "",
            content: ch.content || ch.text || "",
            wordCount: ch.wordCount || countWords(ch.text || ch.content || ""),
            status: ch.status || "draft",
            included: ch.included !== false,
            storyLab: ch.storyLab || {},
          };
        });

        if (Array.isArray(next.characters)) {
          currentProject.compose.characters = next.characters;
        }

        currentProject.updatedAt = new Date().toISOString();
        window.localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(currentProject));
      }
    }

    // Dispatch event so ComposePage and other components know data changed
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  } catch (err) {
    console.error("[projectStore] Failed to save project:", err);
  }
}

/** Ensure new sections exist without breaking older data */
export function ensureWorkshopFields(project) {
  if (!project || typeof project !== "object") return project;
  if (!Array.isArray(project.characters)) project.characters = [];
  if (!Array.isArray(project.roadmap)) project.roadmap = [];
  if (!Array.isArray(project.priorities)) project.priorities = [];
  if (!Array.isArray(project.scenes)) project.scenes = [];
  return project;
}

/** Pull ALL story text (combines chapter text fields) */
export function getFullStoryText(project) {
  if (!project) return "";
  const chapters = Array.isArray(project.chapters) ? project.chapters : [];
  return chapters
    .map((c) => c.text || c.textHTML || c.content || c.body || "")
    .filter(Boolean)
    .join(" ");
}

/** Get current chapter count */
export function getChapterCount(project) {
  if (!project) return 0;
  return Array.isArray(project.chapters) ? project.chapters.length : 0;
}

/** Get total word count */
export function getTotalWordCount(project) {
  if (!project) return 0;
  const chapters = Array.isArray(project.chapters) ? project.chapters : [];
  return chapters.reduce((sum, ch) => {
    if (ch.wordCount) return sum + ch.wordCount;
    const text = ch.text || ch.textHTML || ch.content || "";
    return sum + countWords(text);
  }, 0);
}

/** Count words in text */
function countWords(text) {
  if (!text) return 0;
  const plain = text.replace(/<[^>]*>/g, " ");
  const words = plain.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Get a specific chapter by ID */
export function getChapterById(project, chapterId) {
  if (!project || !Array.isArray(project.chapters)) return null;
  return project.chapters.find((c) => String(c.id) === String(chapterId)) || null;
}

/** Update a specific chapter by ID */
export function updateChapter(project, chapterId, updates) {
  if (!project || !Array.isArray(project.chapters)) return project;
  
  const chapters = project.chapters.map((ch) => {
    if (String(ch.id) === String(chapterId)) {
      return { ...ch, ...updates };
    }
    return ch;
  });

  return { ...project, chapters };
}

/** Simple uid, with wide compatibility */
export function uid() {
  try {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {}
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
}

/** Tiny migration to keep older saves from breaking */
function migrate(p) {
  if (!p || typeof p !== "object") return p;
  if (!Array.isArray(p.chapters)) p.chapters = [];
  p.chapters = p.chapters.map((ch, idx) => ({
    ...ch,
    id: ch.id || String(idx),
    title: ch.title || `Chapter ${idx + 1}`,
    text: ch.text || ch.textHTML || ch.content || ch.body || "",
    content: ch.content || ch.text || ch.textHTML || "",
  }));
  ensureWorkshopFields(p);
  return p;
}

/** Force refresh from the latest source */
export function refreshProject() {
  return loadProject();
}

/** Check if there's any story data available */
export function hasStoryData() {
  const project = loadProject();
  return project && Array.isArray(project.chapters) && project.chapters.length > 0;
}
