// src/hooks/useProjectStore.js
// Central project management - create, switch, delete projects with isolated storage

import { useState, useEffect, useCallback } from "react";
import { storage } from "../lib/storage";

// Storage keys
const PROJECTS_LIST_KEY = "dahtruth-projects-list";
const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";
const PROJECT_DATA_PREFIX = "dahtruth-project-";

// Legacy key (for migration)
const LEGACY_STORAGE_KEY = "dahtruth-story-lab-toc-v3";

// ============ Helper Functions ============

function generateId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProjectDataKey(projectId) {
  return `${PROJECT_DATA_PREFIX}${projectId}`;
}

// Load projects list
function loadProjectsList() {
  try {
    const raw = storage.getItem(PROJECTS_LIST_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save projects list
function saveProjectsList(projects) {
  try {
    storage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("projects:change"));
  } catch (err) {
    console.error("Failed to save projects list:", err);
  }
}

// Load current project ID
function loadCurrentProjectId() {
  try {
    return storage.getItem(CURRENT_PROJECT_KEY) || null;
  } catch {
    return null;
  }
}

// Load project data
function loadProjectData(projectId) {
  try {
    const key = getProjectDataKey(projectId);
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Sync projects list to legacy userProjects key
function syncToUserProjects(projects) {
  try {
    const userProjects = (projects || []).map((p) => ({
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

// Save current project ID
function saveCurrentProjectId(projectId) {
  try {
    storage.setItem(CURRENT_PROJECT_KEY, projectId);

    // Load project data and sync to legacy keys
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

      // Update currentStory for StoryLab sidebar (legacy consumers)
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
    }

    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage")); // custom notify for same-tab listeners
  } catch (err) {
    console.error("Failed to save current project ID:", err);
  }
}

// Save project data
function saveProjectData(projectId, data) {
  try {
    const key = getProjectDataKey(projectId);
    storage.setItem(key, JSON.stringify(data));

    // Update project metadata (updatedAt, wordCount)
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

    // ===== SYNC WITH LEGACY KEYS (only if saving current project) =====
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

      // Keep Project Page list in sync
      syncToUserProjects(updated);
    }

    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage")); // custom notify for same-tab listeners
  } catch (err) {
    console.error("Failed to save project data:", err);
  }
}

// ============================================================================
// COMPREHENSIVE PROJECT CLEANUP - Cleans ALL storage systems
// ============================================================================

function cleanupAllProjectStorage(projectId) {
  if (!projectId) return;

  console.log(
    `[ProjectStore] ========== COMPLETE CLEANUP for: ${projectId} ==========`
  );
  let removedCount = 0;

  // All project-scoped key patterns from ALL systems
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
      } catch {}
    });
  });

  // Clean dahtruth_projects_index (if present)
  try {
    const indexRaw = storage.getItem("dahtruth_projects_index");
    if (indexRaw) {
      const index = JSON.parse(indexRaw);
      if (Array.isArray(index)) {
        const filtered = index.filter((p) => p.id !== projectId);
        if (filtered.length !== index.length) {
          storage.setItem("dahtruth_projects_index", JSON.stringify(filtered));
          console.log(`  ✓ Removed from dahtruth_projects_index`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean dahtruth-projects-list
  try {
    const listRaw = storage.getItem(PROJECTS_LIST_KEY);
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list)) {
        const filtered = list.filter((p) => p.id !== projectId);
        if (filtered.length !== list.length) {
          storage.setItem(PROJECTS_LIST_KEY, JSON.stringify(filtered));
          console.log(`  ✓ Removed from ${PROJECTS_LIST_KEY}`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean userProjects
  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      if (Array.isArray(userProjects)) {
        const filtered = userProjects.filter((p) => p.id !== projectId);
        if (filtered.length !== userProjects.length) {
          storage.setItem("userProjects", JSON.stringify(filtered));
          console.log(`  ✓ Removed from userProjects`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean dahtruth-project-store (if present)
  try {
    const storeRaw = storage.getItem("dahtruth-project-store");
    if (storeRaw) {
      const store = JSON.parse(storeRaw);
      let modified = false;

      if (store.selectedProjectId === projectId) {
        store.selectedProjectId = null;
        modified = true;
      }
      if (store.currentProjectId === projectId) {
        store.currentProjectId = null;
        modified = true;
      }
      if (Array.isArray(store.projects)) {
        const len = store.projects.length;
        store.projects = store.projects.filter((p) => p.id !== projectId);
        if (store.projects.length !== len) modified = true;
      }

      if (modified) {
        storage.setItem("dahtruth-project-store", JSON.stringify(store));
        console.log(`  ✓ Cleaned dahtruth-project-store`);
        removedCount++;
      }
    }
  } catch {}

  // Clean ID keys that may point to this project
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
    } catch {}
  });

  // Clean currentStory if it references this project
  try {
    const raw = storage.getItem("currentStory");
    if (raw) {
      const cs = JSON.parse(raw);
      if (cs?.id === projectId) {
        storage.removeItem("currentStory");
        console.log(`  ✓ Cleared currentStory`);
        removedCount++;
      }
    }
  } catch {}

  // Clean dahtruth_current_project object if it references this project
  try {
    const raw = storage.getItem("dahtruth_current_project");
    if (raw) {
      const cp = JSON.parse(raw);
      if (cp?.id === projectId) {
        storage.removeItem("dahtruth_current_project");
        console.log(`  ✓ Cleared dahtruth_current_project`);
        removedCount++;
      }
    }
  } catch {}

  console.log(
    `[ProjectStore] ========== CLEANUP COMPLETE: ${removedCount} items ==========`
  );
}

// Legacy function name for backwards compatibility
function deleteProjectData(projectId) {
  cleanupAllProjectStorage(projectId);
}

// ============ Default Project Data ============

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

// ============ Title Propagation ============
// Updates title in ALL related storage keys for consistency

function propagateTitleChange(projectId, newTitle) {
  if (!projectId || !newTitle) return;

  // Update project-scoped meta keys
  [
    `dahtruth_project_meta_${projectId}`,
    `dt_publishing_meta_${projectId}`,
    `dahtruth_cover_settings_${projectId}`,
    `publishingDraft_${projectId}`,
  ].forEach((key) => {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === "object") {
          if ("title" in data) data.title = newTitle;
          if (data.book?.title !== undefined) data.book.title = newTitle;
          storage.setItem(key, JSON.stringify(data));
        }
      }
    } catch {}
  });

  // Update currentStory
  try {
    const raw = storage.getItem("currentStory");
    if (raw) {
      const cs = JSON.parse(raw);
      if (cs?.id === projectId) {
        cs.title = newTitle;
        storage.setItem("currentStory", JSON.stringify(cs));
      }
    }
  } catch {}

  // Update userProjects
  try {
    const raw = storage.getItem("userProjects");
    if (raw) {
      const up = JSON.parse(raw);
      if (Array.isArray(up)) {
        storage.setItem(
          "userProjects",
          JSON.stringify(
            up.map((p) => (p.id === projectId ? { ...p, title: newTitle } : p))
          )
        );
      }
    }
  } catch {}

  // Update dahtruth_projects_index
  try {
    const raw = storage.getItem("dahtruth_projects_index");
    if (raw) {
      const idx = JSON.parse(raw);
      if (Array.isArray(idx)) {
        storage.setItem(
          "dahtruth_projects_index",
          JSON.stringify(
            idx.map((p) =>
              p.id === projectId
                ? { ...p, title: newTitle, updatedAt: new Date().toISOString() }
                : p
            )
          )
        );
      }
    }
  } catch {}

  // Update dahtruth-projects-list
  try {
    const raw = storage.getItem(PROJECTS_LIST_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        storage.setItem(
          PROJECTS_LIST_KEY,
          JSON.stringify(
            list.map((p) =>
              p.id === projectId
                ? { ...p, title: newTitle, updatedAt: new Date().toISOString() }
                : p
            )
          )
        );
      }
    }
  } catch {}

  console.log(`[ProjectStore] Title propagated: "${newTitle}"`);
}

// ============ Migration ============

function migrateLegacyData() {
  const migrated = storage.getItem("dahtruth-migration-complete");
  if (migrated) return null;

  try {
    const legacyRaw = storage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      storage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    const legacyData = JSON.parse(legacyRaw);
    if (
      !legacyData ||
      !legacyData.chapters ||
      legacyData.chapters.length === 0
    ) {
      storage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    const projectId = generateId();
    const title = legacyData.book?.title || "Migrated Project";
    const totalWords = legacyData.chapters.reduce(
      (sum, ch) => sum + (ch.wordCount || 0),
      0
    );

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

    // Save data into the new project key
    saveProjectData(projectId, legacyData);

    // ✅ IMPORTANT: Append to existing projects list (DO NOT overwrite)
    const existing = loadProjectsList();
    const next = [...existing, project];
    saveProjectsList(next);
    syncToUserProjects(next);

    // Set as current project
    saveCurrentProjectId(projectId);

    storage.setItem("dahtruth-migration-complete", "true");
    console.log(
      `[Migration] Migrated legacy project: "${title}" (${legacyData.chapters.length} chapters)`
    );

    return projectId;
  } catch (err) {
    console.error("Migration failed:", err);
    storage.setItem("dahtruth-migration-complete", "true");
    return null;
  }
}

// ============ Main Hook ============

export function useProjectStore() {
  // Run migration on first load
  useEffect(() => {
    migrateLegacyData();
  }, []);

  const [projects, setProjects] = useState(() => loadProjectsList());
  const [currentProjectId, setCurrentProjectId] = useState(() =>
    loadCurrentProjectId()
  );

  // Sync with localStorage changes AND storage hydration
  useEffect(() => {
    const sync = () => {
      const loadedProjects = loadProjectsList();
      const loadedProjectId = loadCurrentProjectId();
      console.log(
        `[ProjectStore] Syncing - found ${loadedProjects.length} projects, current: ${loadedProjectId}`
      );
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

  const currentProject =
    projects.find((p) => p.id === currentProjectId) || null;

  // ============ Actions ============

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

      // Save project data
      storage.setItem(getProjectDataKey(projectId), JSON.stringify(data));

      // Add to projects list
      const updated = [...projects, project];
      saveProjectsList(updated);
      syncToUserProjects(updated);

      setProjects(updated);

      // Switch to new project
      saveCurrentProjectId(projectId);
      setCurrentProjectId(projectId);

      console.log(
        `[ProjectStore] Created new project: "${title}" (${projectId})`
      );
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

      const project = {
        id: projectId,
        title: parsedDocument.title,
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
        book: { title: parsedDocument.title },
        chapters,
        daily: { goal: 500, counts: {} },
        settings: { theme: "light", focusMode: false },
        tocOutline: parsedDocument.tableOfContents || [],
      };

      storage.setItem(getProjectDataKey(projectId), JSON.stringify(data));

      const updated = [...projects, project];
      saveProjectsList(updated);
      syncToUserProjects(updated);

      setProjects(updated);

      saveCurrentProjectId(projectId);
      setCurrentProjectId(projectId);

      console.log(
        `[ProjectStore] Imported project: "${parsedDocument.title}" (${chapters.length} chapters, ${totalWords} words)`
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
      console.log(
        `[ProjectStore] ========== DELETING PROJECT: ${projectId} ==========`
      );

      // Remove ALL project-related data
      cleanupAllProjectStorage(projectId);

      // Update + persist lists
      const updated = projects.filter((p) => p.id !== projectId);
      saveProjectsList(updated);
      syncToUserProjects(updated);

      setProjects(updated);

      window.dispatchEvent(new Event("project:change"));
      window.dispatchEvent(new Event("projects:change"));
      window.dispatchEvent(new Event("storage"));

      // If deleted current, switch/create
      if (currentProjectId === projectId) {
        if (updated.length > 0) {
          switchProject(updated[0].id);
        } else {
          createProject("Untitled Book");
        }
      }

      console.log(`[ProjectStore] ========== PROJECT DELETION COMPLETE ==========`);
      return true;
    },
    [projects, currentProjectId, switchProject, createProject]
  );

  const renameProject = useCallback(
    (projectId, newTitle) => {
      const updated = projects.map((p) =>
        p.id === projectId
          ? { ...p, title: newTitle, updatedAt: new Date().toISOString() }
          : p
      );

      saveProjectsList(updated);
      syncToUserProjects(updated);
      setProjects(updated);

      // Update book title in project data
      const data = loadProjectData(projectId);
      if (data) {
        data.book = { ...(data.book || {}), title: newTitle };
        saveProjectData(projectId, data);
      }

      // ✅ Also propagate to related keys (cover/publishing/currentStory)
      propagateTitleChange(projectId, newTitle);

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

// ============ Standalone Functions for Direct Use ============

export function getCurrentProjectId() {
  return loadCurrentProjectId();
}

// ✅ Alias used by other pages (like Cover.jsx)
export function getSelectedProjectId() {
  return loadCurrentProjectId();
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
