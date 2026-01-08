// src/hooks/useProjectStore.js
// Central project management - create, switch, delete projects with isolated storage

import { useState, useEffect, useCallback } from "react";

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
    const raw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save projects list
function saveProjectsList(projects) {
  try {
    localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("projects:change"));
  } catch (err) {
    console.error("Failed to save projects list:", err);
  }
}

// Load current project ID
function loadCurrentProjectId() {
  try {
    return localStorage.getItem(CURRENT_PROJECT_KEY) || null;
  } catch {
    return null;
  }
}

// Save current project ID
function saveCurrentProjectId(projectId) {
  try {
    localStorage.setItem(CURRENT_PROJECT_KEY, projectId);
    
    // Load project data and sync to legacy keys
    const data = loadProjectData(projectId);
    if (data) {
      const title = data.book?.title || "Untitled";
      const totalWords = (data.chapters || []).reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      const chapterCount = (data.chapters || []).length;
      
      // Update legacy storage key
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      
      // Update currentStory for StoryLab sidebar
      localStorage.setItem("currentStory", JSON.stringify({
        id: projectId,
        title: title,
        status: "Draft",
        updatedAt: new Date().toISOString(),
        wordCount: totalWords,
        chapterCount: chapterCount,
      }));
    }
    
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to save current project ID:", err);
  }
}

// Load project data
function loadProjectData(projectId) {
  try {
    const key = getProjectDataKey(projectId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Save project data
function saveProjectData(projectId, data) {
  try {
    const key = getProjectDataKey(projectId);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Also update the project metadata (updatedAt, wordCount)
    const projects = loadProjectsList();
    const totalWords = (data.chapters || []).reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    const chapterCount = (data.chapters || []).length;
    const title = data.book?.title || "Untitled";
    
    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            title: title,
            updatedAt: new Date().toISOString(),
            wordCount: totalWords,
            chapterCount: chapterCount,
          }
        : p
    );
    saveProjectsList(updated);
    
    // ===== SYNC WITH LEGACY KEYS =====
    const currentId = loadCurrentProjectId();
    if (projectId === currentId) {
      // Update legacy storage key for backwards compatibility
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      
      // Update currentStory for StoryLab sidebar
      localStorage.setItem("currentStory", JSON.stringify({
        id: projectId,
        title: title,
        status: "Draft",
        updatedAt: new Date().toISOString(),
        wordCount: totalWords,
        chapterCount: chapterCount,
      }));
      
      // Update userProjects for Project page
      syncToUserProjects(updated);
    }
    
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Failed to save project data:", err);
  }
}

// Sync projects list to legacy userProjects key
function syncToUserProjects(projects) {
  try {
    const userProjects = projects.map(p => ({
      id: p.id,
      title: p.title,
      status: p.status || "Draft",
      source: p.source || "Project",
      updatedAt: p.updatedAt,
      wordCount: p.wordCount,
      chapterCount: p.chapterCount,
    }));
    localStorage.setItem("userProjects", JSON.stringify(userProjects));
  } catch (err) {
    console.error("Failed to sync userProjects:", err);
  }
}

// Delete project data
// ============================================================================
// COMPREHENSIVE PROJECT CLEANUP - Cleans ALL storage systems
// ============================================================================

function cleanupAllProjectStorage(projectId) {
  if (!projectId) return;

  console.log(`[ProjectStore] ========== COMPLETE CLEANUP for: ${projectId} ==========`);
  let removedCount = 0;

  // All project-scoped key patterns from ALL systems
  const projectScopedKeyBases = [
    "dahtruth_projects_cache", "dahtruth-project",
    "dahtruth-story-lab-toc-v3", "dahtruth-hfl-data-v2", "dahtruth-priorities-v2",
    "dahtruth-character-roadmap", "dahtruth-clothesline-v2", "dahtruth-dialogue-lab-v1",
    "dahtruth-narrative-arc-v2", "dahtruth-plot-builder-v2", "dahtruth-project-genre",
    "dt_arc_chars_v2", "dahtruth_cover_settings", "dahtruth_cover_designs",
    "dahtruth_cover_image_url", "dahtruth_cover_image_meta", "dt_publishing_meta",
    "publishingDraft", "dahtruth_project_meta", "dahtruth_chapters", "chapters",
    "dahtruth_characters", "dahtruth-workshop-data", "dahtruth-workshop-cohort",
  ];

  projectScopedKeyBases.forEach((baseKey) => {
    [`${baseKey}-${projectId}`, `${baseKey}_${projectId}`].forEach((key) => {
      try {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          console.log(`  ✓ Removed: ${key}`);
          removedCount++;
        }
      } catch {}
    });
  });

  // Clean dahtruth_projects_index
  try {
    const indexRaw = localStorage.getItem("dahtruth_projects_index");
    if (indexRaw) {
      const index = JSON.parse(indexRaw);
      if (Array.isArray(index)) {
        const filtered = index.filter((p) => p.id !== projectId);
        if (filtered.length !== index.length) {
          localStorage.setItem("dahtruth_projects_index", JSON.stringify(filtered));
          console.log(`  ✓ Removed from dahtruth_projects_index`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean dahtruth-projects-list
  try {
    const listRaw = localStorage.getItem(PROJECTS_LIST_KEY);
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list)) {
        const filtered = list.filter((p) => p.id !== projectId);
        if (filtered.length !== list.length) {
          localStorage.setItem(PROJECTS_LIST_KEY, JSON.stringify(filtered));
          console.log(`  ✓ Removed from ${PROJECTS_LIST_KEY}`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean userProjects
  try {
    const userProjectsRaw = localStorage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      if (Array.isArray(userProjects)) {
        const filtered = userProjects.filter((p) => p.id !== projectId);
        if (filtered.length !== userProjects.length) {
          localStorage.setItem("userProjects", JSON.stringify(filtered));
          console.log(`  ✓ Removed from userProjects`);
          removedCount++;
        }
      }
    }
  } catch {}

  // Clean dahtruth-project-store
  try {
    const storeRaw = localStorage.getItem("dahtruth-project-store");
    if (storeRaw) {
      const store = JSON.parse(storeRaw);
      let modified = false;
      if (store.selectedProjectId === projectId) { store.selectedProjectId = null; modified = true; }
      if (store.currentProjectId === projectId) { store.currentProjectId = null; modified = true; }
      if (Array.isArray(store.projects)) {
        const len = store.projects.length;
        store.projects = store.projects.filter(p => p.id !== projectId);
        if (store.projects.length !== len) modified = true;
      }
      if (modified) {
        localStorage.setItem("dahtruth-project-store", JSON.stringify(store));
        console.log(`  ✓ Cleaned dahtruth-project-store`);
        removedCount++;
      }
    }
  } catch {}

  // Clean ID keys
  ["dahtruth-selected-project-id", "dahtruth-current-project-id", "dahtruth_current_project_id", CURRENT_PROJECT_KEY].forEach((key) => {
    try {
      if (localStorage.getItem(key) === projectId) {
        localStorage.removeItem(key);
        console.log(`  ✓ Cleared ${key}`);
        removedCount++;
      }
    } catch {}
  });

  // Clean currentStory
  try {
    const raw = localStorage.getItem("currentStory");
    if (raw) {
      const cs = JSON.parse(raw);
      if (cs?.id === projectId) {
        localStorage.removeItem("currentStory");
        console.log(`  ✓ Cleared currentStory`);
        removedCount++;
      }
    }
  } catch {}

  // Clean dahtruth_current_project
  try {
    const raw = localStorage.getItem("dahtruth_current_project");
    if (raw) {
      const cp = JSON.parse(raw);
      if (cp?.id === projectId) {
        localStorage.removeItem("dahtruth_current_project");
        console.log(`  ✓ Cleared dahtruth_current_project`);
        removedCount++;
      }
    }
  } catch {}

  console.log(`[ProjectStore] ========== CLEANUP COMPLETE: ${removedCount} items ==========`);
}

// Legacy function name for backwards compatibility
function deleteProjectData(projectId) {
  cleanupAllProjectStorage(projectId);
}

// Migrate legacy data to new format (run once)
function migrateLegacyData() {
  const migrated = localStorage.getItem("dahtruth-migration-complete");
  if (migrated) return null;

  try {
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacyRaw) {
      localStorage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    const legacyData = JSON.parse(legacyRaw);
    if (!legacyData || !legacyData.chapters || legacyData.chapters.length === 0) {
      localStorage.setItem("dahtruth-migration-complete", "true");
      return null;
    }

    // Create a new project from the legacy data
    const projectId = generateId();
    const title = legacyData.book?.title || "Migrated Project";
    const totalWords = legacyData.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

    const project = {
      id: projectId,
      title: title,
      status: "Draft",
      source: "Migrated",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      wordCount: totalWords,
      chapterCount: legacyData.chapters.length,
    };

    // Save as new project
    saveProjectData(projectId, legacyData);
    saveProjectsList([project]);
    saveCurrentProjectId(projectId);

    localStorage.setItem("dahtruth-migration-complete", "true");
    console.log(`[Migration] Migrated legacy project: "${title}" (${legacyData.chapters.length} chapters)`);

    return projectId;
  } catch (err) {
    console.error("Migration failed:", err);
    localStorage.setItem("dahtruth-migration-complete", "true");
    return null;
  }
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

// ============ Main Hook ============

export function useProjectStore() {
  // Run migration on first load
  useEffect(() => {
    migrateLegacyData();
  }, []);

  const [projects, setProjects] = useState(() => loadProjectsList());
  const [currentProjectId, setCurrentProjectId] = useState(() => loadCurrentProjectId());

  // Sync with localStorage changes
  useEffect(() => {
    const sync = () => {
      setProjects(loadProjectsList());
      setCurrentProjectId(loadCurrentProjectId());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("projects:change", sync);
    window.addEventListener("project:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("projects:change", sync);
      window.removeEventListener("project:change", sync);
    };
  }, []);

  // Get current project metadata
  const currentProject = projects.find((p) => p.id === currentProjectId) || null;

  // ============ Actions ============

  // Create a new empty project
  const createProject = useCallback((title = "Untitled Book") => {
    const projectId = generateId();
    const now = new Date().toISOString();

    const project = {
      id: projectId,
      title: title,
      status: "Draft",
      source: "New",
      createdAt: now,
      updatedAt: now,
      wordCount: 0,
      chapterCount: 1,
    };

    // Create default project data
    const data = createDefaultProjectData(title);
    
    // Save to project-specific key
    const key = getProjectDataKey(projectId);
    localStorage.setItem(key, JSON.stringify(data));

    // Add to projects list
    const updated = [...projects, project];
    saveProjectsList(updated);
    setProjects(updated);

    // Switch to new project (this will sync legacy keys)
    saveCurrentProjectId(projectId);
    setCurrentProjectId(projectId);

    // Also sync to userProjects for Project page
    syncToUserProjects(updated);

    console.log(`[ProjectStore] Created new project: "${title}" (${projectId})`);
    return projectId;
  }, [projects]);

  // Create a project from imported document
  const createProjectFromImport = useCallback((parsedDocument) => {
    const projectId = generateId();
    const now = new Date().toISOString();

    const totalWords = parsedDocument.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

    const project = {
      id: projectId,
      title: parsedDocument.title,
      status: "Draft",
      source: "Imported",
      createdAt: now,
      updatedAt: now,
      wordCount: totalWords,
      chapterCount: parsedDocument.chapters.length,
    };

    // Convert parsed chapters to storage format
    const chapters = parsedDocument.chapters.map((ch, idx) => ({
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
      chapters: chapters,
      daily: { goal: 500, counts: {} },
      settings: { theme: "light", focusMode: false },
      tocOutline: parsedDocument.tableOfContents || [],
    };

    // Save to project-specific key
    const key = getProjectDataKey(projectId);
    localStorage.setItem(key, JSON.stringify(data));

    // Add to projects list
    const updated = [...projects, project];
    saveProjectsList(updated);
    setProjects(updated);

    // Switch to new project (this will sync legacy keys)
    saveCurrentProjectId(projectId);
    setCurrentProjectId(projectId);

    // Also sync to userProjects for Project page
    syncToUserProjects(updated);

    console.log(`[ProjectStore] Imported project: "${parsedDocument.title}" (${chapters.length} chapters, ${totalWords} words)`);
    return projectId;
  }, [projects]);

  // Switch to a different project
  const switchProject = useCallback((projectId) => {
    if (!projects.find((p) => p.id === projectId)) {
      console.warn(`[ProjectStore] Project not found: ${projectId}`);
      return false;
    }

    saveCurrentProjectId(projectId);
    setCurrentProjectId(projectId);

    console.log(`[ProjectStore] Switched to project: ${projectId}`);
    window.dispatchEvent(new Event("project:change"));
    return true;
  }, [projects]);

  // Delete a project and ALL related data from ALL storage systems
  const deleteProject = useCallback((projectId) => {
    console.log(`[ProjectStore] ========== DELETING PROJECT: ${projectId} ==========`);

    // COMPLETE CLEANUP: Remove ALL project-related data from ALL storage systems
    cleanupAllProjectStorage(projectId);

    // Update local state
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);

    // Dispatch events to notify all modules
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("projects:change"));
    window.dispatchEvent(new Event("storage"));

    // If we deleted the current project, switch to another or create new
    if (currentProjectId === projectId) {
      if (updated.length > 0) {
        switchProject(updated[0].id);
      } else {
        createProject("Untitled Book");
      }
    }

    console.log(`[ProjectStore] ========== PROJECT DELETION COMPLETE ==========`);
    return true;
  }, [projects, currentProjectId, switchProject, createProject]);

  // Rename a project
  const renameProject = useCallback((projectId, newTitle) => {
    const updated = projects.map((p) =>
      p.id === projectId
        ? { ...p, title: newTitle, updatedAt: new Date().toISOString() }
        : p
    );
    saveProjectsList(updated);
    setProjects(updated);

    // Also update the book title in project data
    const data = loadProjectData(projectId);
    if (data) {
      data.book = { ...data.book, title: newTitle };
      saveProjectData(projectId, data);
    }

    return true;
  }, [projects]);

  // Get project data (for useChapterManager to use)
  const getProjectData = useCallback((projectId) => {
    return loadProjectData(projectId || currentProjectId);
  }, [currentProjectId]);

  // Save project data (for useChapterManager to use)
  const saveProject = useCallback((projectId, data) => {
    saveProjectData(projectId || currentProjectId, data);
  }, [currentProjectId]);

  return {
    // State
    projects,
    currentProjectId,
    currentProject,

    // Actions
    createProject,
    createProjectFromImport,
    switchProject,
    deleteProject,
    renameProject,

    // Data access (for useChapterManager)
    getProjectData,
    saveProject,
  };
}

// ============ Standalone Functions for Direct Use ============

// These can be imported directly without the hook

export function getCurrentProjectId() {
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
  if (!projectId) return LEGACY_STORAGE_KEY; // Fallback for compatibility
  return getProjectDataKey(projectId);
}
