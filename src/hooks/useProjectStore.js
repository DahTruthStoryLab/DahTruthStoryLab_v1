// src/hooks/useProjectStore.js
// Central project management - create, switch, delete projects with isolated storage
// UPDATED: consistent project title propagation + emits "project:title-change" event
// NOTE: keeps legacy syncing (currentStory, userProjects, LEGACY_STORAGE_KEY) for compatibility

import { useState, useEffect, useCallback } from "react";
import { storage } from "../lib/storage";

/* ===================== Storage keys ===================== */

const PROJECTS_LIST_KEY = "dahtruth-projects-list";
const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";
const PROJECT_DATA_PREFIX = "dahtruth-project-";

// Legacy key (for migration / compatibility)
const LEGACY_STORAGE_KEY = "dahtruth-story-lab-toc-v3";

/* ===================== Helper Functions ===================== */

function generateId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProjectDataKey(projectId) {
  return `${PROJECT_DATA_PREFIX}${projectId}`;
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/* ===================== Projects List ===================== */

function loadProjectsList() {
  const raw = storage.getItem(PROJECTS_LIST_KEY);
  return safeJsonParse(raw, []);
}

function saveProjectsList(projects) {
  try {
    storage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("projects:change"));
  } catch (err) {
    console.error("Failed to save projects list:", err);
  }
}

/* ===================== Current Project ===================== */

function loadCurrentProjectId() {
  try {
    return storage.getItem(CURRENT_PROJECT_KEY) || null;
  } catch {
    return null;
  }
}

function emitProjectTitleChange(projectId, title) {
  try {
    window.dispatchEvent(
      new CustomEvent("project:title-change", { detail: { projectId, title } })
    );
  } catch {
    // ignore
  }
}

// Load project data
function loadProjectData(projectId) {
  try {
    const key = getProjectDataKey(projectId);
    const raw = storage.getItem(key);
    return safeJsonParse(raw, null);
  } catch {
    return null;
  }
}

// Sync projects list to legacy userProjects key
function syncToUserProjects(projects) {
  try {
    const userProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status || "Draft",
      source: p.source || "Project",
      updatedAt: p.updatedAt,
      wordCount: p.wordCount,
      chapterCount: p.chapterCount,
    }));
    storage.setItem("userProjects", JSON.stringify(userProjects));
  } catch (err) {
    console.error("Failed to sync userProjects:", err);
  }
}

// When switching project: keep legacy keys updated (currentStory, legacy TOC key)
function saveCurrentProjectId(projectId) {
  try {
    storage.setItem(CURRENT_PROJECT_KEY, projectId);

    const data = loadProjectData(projectId);
    if (data) {
      const title = data.book?.title || "Untitled";
      const totalWords = (data.chapters || []).reduce(
        (sum, ch) => sum + (ch.wordCount || 0),
        0
      );
      const chapterCount = (data.chapters || []).length;

      // Update legacy storage key
      storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));

      // Update currentStory for StoryLab sidebar
      storage.setItem(
        "currentStory",
        JSON.stringify({
          id: projectId,
          title,
          status: "Draft",
          updatedAt: new Date().toISOString(),
          wordCount: totalWords,
          chapterCount,
        })
      );

      // Emit title-change (helps headers across the app update instantly)
      emitProjectTitleChange(projectId, title);
    }

    // Existing events (keep for compatibility)
    window.dispatchEvent(new Event("project:change"));

    // Important: native "storage" event doesn't fire in same tab.
    // Your app already listens for "storage", so we intentionally keep this manual dispatch.
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to save current project ID:", err);
  }
}

/* ===================== Default Project Data ===================== */

function createDefaultProjectData(title = "Untitled Book") {
  return {
    book: { title },
    chapters: [
      {
        id: `chapter-${Date.now()}`,
        title: "Chapter 1: Untitled",
        content: "",
        wordCount: 0,
        lastEdited: new Date().toLocaleString(),
        status: "draft",
        order: 0,
      },
    ],
    daily: { goal: 500, counts: {} },
    settings: { theme: "light", focusMode: false },
    tocOutline: [],
  };
}

/* ===================== Title Propagation ===================== */
// Updates title in ALL related storage keys for consistency
function propagateTitleChange(projectId, newTitle) {
  if (!projectId || typeof newTitle !== "string") return;

  // Update project-scoped meta keys (best effort)
  [
    `dahtruth_project_meta_${projectId}`,
    `dt_publishing_meta_${projectId}`,
    `dahtruth_cover_settings_${projectId}`,
    `publishingDraft_${projectId}`,
  ].forEach((key) => {
    try {
      const raw = storage.getItem(key);
      if (!raw) return;
      const data = safeJsonParse(raw, null);
      if (!data || typeof data !== "object") return;

      if ("title" in data) data.title = newTitle;
      if (data.book?.title !== undefined) data.book.title = newTitle;

      storage.setItem(key, JSON.stringify(data));
    } catch {
      // ignore
    }
  });

  // Update currentStory
  try {
    const raw = storage.getItem("currentStory");
    const cs = safeJsonParse(raw, null);
    if (cs?.id === projectId) {
      cs.title = newTitle;
      cs.updatedAt = new Date().toISOString();
      storage.setItem("currentStory", JSON.stringify(cs));
    }
  } catch {
    // ignore
  }

  // Update userProjects
  try {
    const raw = storage.getItem("userProjects");
    const up = safeJsonParse(raw, null);
    if (Array.isArray(up)) {
      storage.setItem(
        "userProjects",
        JSON.stringify(up.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p)))
      );
    }
  } catch {
    // ignore
  }

  // Update dahtruth_projects_index if present
  try {
    const raw = storage.getItem("dahtruth_projects_index");
    const idx = safeJsonParse(raw, null);
    if (Array.isArray(idx)) {
      storage.setItem(
        "dahtruth_projects_index",
        JSON.stringify(
          idx.map((p) =>
            p.id === projectId ? { ...p, title: newTitle, updatedAt: new Date().toISOString() } : p
          )
        )
      );
    }
  } catch {
    // ignore
  }

  // Update dahtruth-projects-list
  try {
    const raw = storage.getItem(PROJECTS_LIST_KEY);
    const list = safeJsonParse(raw, null);
    if (Array.isArray(list)) {
      storage.setItem(
        PROJECTS_LIST_KEY,
        JSON.stringify(
          list.map((p) =>
            p.id === projectId ? { ...p, title: newTitle, updatedAt: new Date().toISOString() } : p
          )
        )
      );
    }
  } catch {
    // ignore
  }

  emitProjectTitleChange(projectId, newTitle);
  console.log(`[ProjectStore] Title propagated: "${newTitle}"`);
}

/* ===================== Save Project Data ===================== */

function saveProjectData(projectId, data) {
  try {
    const key = getProjectDataKey(projectId);
    storage.setItem(key, JSON.stringify(data));

    const projects = loadProjectsList();

    const totalWords = (data.chapters || []).reduce(
      (sum, ch) => sum + (ch.wordCount || 0),
      0
    );
    const chapterCount = (data.chapters || []).length;
    const title = data.book?.title || "Untitled";

    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            title,
            updatedAt: new Date().toISOString(),
            wordCount: totalWords,
            chapterCount,
          }
        : p
    );

    saveProjectsList(updated);

    // ===== SYNC WITH LEGACY KEYS (only for current project) =====
    const currentId = loadCurrentProjectId();
    if (projectId === currentId) {
      storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));

      storage.setItem(
        "currentStory",
        JSON.stringify({
          id: projectId,
          title,
          status: "Draft",
          updatedAt: new Date().toISOString(),
          wordCount: totalWords,
          chapterCount,
        })
      );

      syncToUserProjects(updated);

      // 🔥 Emit title-change (if title changed, app headers update immediately)
      emitProjectTitleChange(projectId, title);
    }

    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to save project data:", err);
  }
}

/* ===================== Comprehensive Cleanup ===================== */

function cleanupAllProjectStorage(projectId) {
  if (!projectId) return;

  console.log(`[ProjectStore] ========== COMPLETE CLEANUP for: ${projectId} ==========`);

  let removedCount = 0;

  const projectScopedKeyBases = [
    "dahtruth_projects_cache",
    "dahtruth-project",
    "dahtruth-story-lab-toc-v3",
    "dahtruth-hfl-data-v2",
    "dahtruth-priorities-v2",
    "dahtruth-character-roadmap",
    "dahtruth-clothesline-v2",
    "dahtruth-dialogue-lab-v1",
    "dahtruth-narrative-arc-v2",
    "dahtruth-plot-builder-v2",
    "dahtruth-project-genre",
    "dt_arc_chars_v2",
    "dahtruth_cover_settings",
    "dahtruth_cover_designs",
    "dahtruth_cover_image_url",
    "dahtruth_cover_image_meta",
    "dt_publishing_meta",
    "publishingDraft",
    "dahtruth_project_meta",
    "dahtruth_chapters",
    "chapters",
    "dahtruth_characters",
    "dahtruth-workshop-data",
    "dahtruth-workshop-cohort",
  ];

  projectScopedKeyBases.forEach((baseKey) => {
    [`${baseKey}-${projectId}`, `${baseKey}_${projectId}`].forEach((key) => {
      try {
        if (storage.getItem(key) !== null) {
          storage.removeItem(key);
          console.log(`  ✓ Removed: ${key}`);
          removedCount++;
        }
      } catch {
        // ignore
      }
    });
  });

  // Remove from projects list
  try {
    const listRaw = storage.getItem(PROJECTS_LIST_KEY);
    const list = safeJsonParse(listRaw, null);
    if (Array.isArray(list)) {
      const filtered = list.filter((p) => p.id !== projectId);
      if (filtered.length !== list.length) {
        storage.setItem(PROJECTS_LIST_KEY, JSON.stringify(filtered));
        console.log(`  ✓ Removed from ${PROJECTS_LIST_KEY}`);
        removedCount++;
      }
    }
  } catch {
    // ignore
  }

  // Remove from userProjects
  try {
    const raw = storage.getItem("userProjects");
    const up = safeJsonParse(raw, null);
    if (Array.isArray(up)) {
      const filtered = up.filter((p) => p.id !== projectId);
      if (filtered.length !== up.length) {
        storage.setItem("userProjects", JSON.stringify(filtered));
        console.log(`  ✓ Removed from userProjects`);
        removedCount++;
      }
    }
  } catch {
    // ignore
  }

  // Clear current IDs if they match
  [
    "dahtruth-selected-project-id",
    "dahtruth-current-project-id",
    "dahtruth_current_project_id",
    CURRENT_PROJECT_KEY,
  ].forEach((key) => {
    try {
      if (storage.getItem(key) === projectId) {
        storage.removeItem(key);
        console.log(`  ✓ Cleared ${key}`);
        removedCount++;
      }
    } catch {
      // ignore
    }
  });

  // Clear currentStory if it points to this project
  try {
    const raw = storage.getItem("currentStory");
    const cs = safeJsonParse(raw, null);
    if (cs?.id === projectId) {
      storage.removeItem("currentStory");
      console.log(`  ✓ Cleared currentStory`);
      removedCount++;
    }
  } catch {
    // ignore
  }

  console.log(`[ProjectStore] ========== CLEANUP COMPLETE: ${removedCount} items ==========`);

  // Notify app
  window.dispatchEvent(new Event("project:change"));
  window.dispatchEvent(new Event("projects:change"));
  window.dispatchEvent(new Event("storage"));
}

// Legacy function name for backwards compatibility
function deleteProjectData(projectId) {
  cleanupAllProjectStorage(projectId);
}

/* ===================== Migration ===================== */

function migrateLegacyData() {
  const migrated = storage.getItem("dahtruth-migration-complete");
  if (migrated) return null;

  try {
    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      storage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    const legacyData = safeJsonParse(legacyRaw, null);
    if (!legacyData || !legacyData.chapters || legacyData.chapters.length === 0) {
      storage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    const projectId = generateId();
    const title = legacyData.book?.title || "Migrated Project";
    const totalWords = legacyData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

    const now = new Date().toISOString();

    const project = {
      id: projectId,
      title,
      status: "Draft",
      source: "Migrated",
      createdAt: now,
      updatedAt: now,
      wordCount: totalWords,
      chapterCount: legacyData.chapters.length,
    };

    saveProjectData(projectId, legacyData);
    saveProjectsList([project]);
    saveCurrentProjectId(projectId);

    storage.setItem("dahtruth-migration-complete", "true");
    console.log(`[Migration] Migrated legacy project: "${title}" (${legacyData.chapters.length} chapters)`);
    return projectId;
  } catch (err) {
    console.error("Migration failed:", err);
    storage.setItem("dahtruth-migration-complete", "true");
    return null;
  }
}

/* ===================== Main Hook ===================== */

export function useProjectStore() {
  // Run migration on first load
  useEffect(() => {
    migrateLegacyData();
  }, []);

  const [projects, setProjects] = useState(() => loadProjectsList());
  const [currentProjectId, setCurrentProjectId] = useState(() => loadCurrentProjectId());

  useEffect(() => {
    const sync = () => {
      const loadedProjects = loadProjectsList();
      const loadedProjectId = loadCurrentProjectId();
      setProjects(loadedProjects);
      setCurrentProjectId(loadedProjectId);
    };

    window.addEventListener("storage", sync);
    window.addEventListener("projects:change", sync);
    window.addEventListener("project:change", sync);
    window.addEventListener("storage:ready", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("projects:change", sync);
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage:ready", sync);
    };
  }, []);

  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  /* ===================== Actions ===================== */

  const createProject = useCallback(
    (title = "Untitled Book") => {
      const projectId = generateId();
      const now = new Date().toISOString();

      const project = {
        id: projectId,
        title,
        status: "Draft",
        source: "New",
        createdAt: now,
        updatedAt: now,
        wordCount: 0,
        chapterCount: 1,
      };

      const data = createDefaultProjectData(title);
      storage.setItem(getProjectDataKey(projectId), JSON.stringify(data));

      const updated = [...projects, project];
      saveProjectsList(updated);
      setProjects(updated);

      saveCurrentProjectId(projectId);
      setCurrentProjectId(projectId);

      syncToUserProjects(updated);

      emitProjectTitleChange(projectId, title);

      console.log(`[ProjectStore] Created new project: "${title}" (${projectId})`);
      return projectId;
    },
    [projects]
  );

  const createProjectFromImport = useCallback(
    (parsedDocument) => {
      const projectId = generateId();
      const now = new Date().toISOString();

      const totalWords = (parsedDocument.chapters || []).reduce(
        (sum, ch) => sum + (ch.wordCount || 0),
        0
      );

      const projectTitle = parsedDocument.title || "Imported Project";

      const project = {
        id: projectId,
        title: projectTitle,
        status: "Draft",
        source: "Imported",
        createdAt: now,
        updatedAt: now,
        wordCount: totalWords,
        chapterCount: (parsedDocument.chapters || []).length,
      };

      const chapters = (parsedDocument.chapters || []).map((ch, idx) => ({
        id: ch.id || `chapter-${Date.now()}-${idx}`,
        title: ch.title,
        content: ch.content,
        preview: ch.preview || "",
        wordCount: ch.wordCount || 0,
        lastEdited: now,
        status: "draft",
        order: idx,
      }));

      const data = {
        book: { title: projectTitle },
        chapters,
        daily: { goal: 500, counts: {} },
        settings: { theme: "light", focusMode: false },
        tocOutline: parsedDocument.tableOfContents || [],
      };

      storage.setItem(getProjectDataKey(projectId), JSON.stringify(data));

      const updated = [...projects, project];
      saveProjectsList(updated);
      setProjects(updated);

      saveCurrentProjectId(projectId);
      setCurrentProjectId(projectId);

      syncToUserProjects(updated);

      emitProjectTitleChange(projectId, projectTitle);

      console.log(
        `[ProjectStore] Imported project: "${projectTitle}" (${chapters.length} chapters, ${totalWords} words)`
      );
      return projectId;
    },
    [projects]
  );

  const switchProject = useCallback(
    (projectId) => {
      if (!projects.find((p) => p.id === projectId)) {
        console.warn(`[ProjectStore] Project not found: ${projectId}`);
        return false;
      }

      saveCurrentProjectId(projectId);
      setCurrentProjectId(projectId);

      console.log(`[ProjectStore] Switched to project: ${projectId}`);
      window.dispatchEvent(new Event("project:change"));
      return true;
    },
    [projects]
  );

  const deleteProject = useCallback(
    (projectId) => {
      cleanupAllProjectStorage(projectId);

      const updated = projects.filter((p) => p.id !== projectId);
      setProjects(updated);

      // If current project deleted, switch
      if (currentProjectId === projectId) {
        if (updated.length > 0) switchProject(updated[0].id);
        else createProject("Untitled Book");
      }

      return true;
    },
    [projects, currentProjectId, switchProject, createProject]
  );

  const renameProject = useCallback(
    (projectId, newTitle) => {
      const trimmed = String(newTitle || "").trim();
      if (!trimmed) return false;

      // Update project metadata list
      const updated = projects.map((p) =>
        p.id === projectId ? { ...p, title: trimmed, updatedAt: new Date().toISOString() } : p
      );
      saveProjectsList(updated);
      setProjects(updated);

      // Update project data book title
      const data = loadProjectData(projectId);
      if (data) {
        data.book = { ...(data.book || {}), title: trimmed };
        saveProjectData(projectId, data);
      } else {
        // Even if data missing, still propagate to other keys
        propagateTitleChange(projectId, trimmed);
      }

      // If this is the current project, make sure currentStory + legacy keys update too
      const currentId = loadCurrentProjectId();
      if (currentId === projectId) {
        // Keep currentStory aligned even if saveProjectData didn't run
        try {
          const raw = storage.getItem("currentStory");
          const cs = safeJsonParse(raw, null);
          if (cs?.id === projectId) {
            cs.title = trimmed;
            cs.updatedAt = new Date().toISOString();
            storage.setItem("currentStory", JSON.stringify(cs));
          }
        } catch {
          // ignore
        }
      }

      // Final emit so headers update instantly
      propagateTitleChange(projectId, trimmed);

      return true;
    },
    [projects]
  );

  const getProjectData = useCallback(
    (projectId) => loadProjectData(projectId || currentProjectId),
    [currentProjectId]
  );

  const saveProject = useCallback(
    (projectId, data) => saveProjectData(projectId || currentProjectId, data),
    [currentProjectId]
  );

  return {
    projects,
    currentProjectId,
    currentProject,

    createProject,
    createProjectFromImport,
    switchProject,
    deleteProject,
    renameProject,

    getProjectData,
    saveProject,
  };
}

/* ===================== Standalone Functions ===================== */

export function getCurrentProjectId() {
  return loadCurrentProjectId();
}

// Helpful for pages that need the title without loading full data everywhere
export function getCurrentProjectTitle() {
  const id = loadCurrentProjectId();
  if (!id) return null;

  // Prefer projects list (fast)
  try {
    const projects = loadProjectsList();
    const found = projects.find((p) => p.id === id);
    if (found?.title) return found.title;
  } catch {
    // ignore
  }

  // Fallback to project data
  const data = loadProjectData(id);
  return data?.book?.title || null;
}

export function getCurrentProjectData() {
  const projectId = loadCurrentProjectId();
  if (!projectId) return null;
  return loadProjectData(projectId);
}

export function saveCurrentProjectData(data) {
  const projectId = loadCurrentProjectId();
  if (!projectId) return false;
  saveProjectData(projectId, data);
  return true;
}

export function getProjectStorageKey() {
  const projectId = loadCurrentProjectId();
  if (!projectId) return LEGACY_STORAGE_KEY;
  return getProjectDataKey(projectId);
}

export { propagateTitleChange, deleteProjectData, cleanupAllProjectStorage };
