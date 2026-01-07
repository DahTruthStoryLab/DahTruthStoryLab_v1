// src/hooks/useProjectStore.js
// Central project management - create, switch, delete projects with isolated storage
// UPDATED: Uses IndexedDB-backed storage wrapper for persistence

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
    return JSON.parse(raw);
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

// Save current project ID
function saveCurrentProjectId(projectId) {
  try {
    storage.setItem(CURRENT_PROJECT_KEY, projectId);
    
    // Load project data and sync to legacy keys
    const data = loadProjectData(projectId);
    if (data) {
      const title = data.book?.title || "Untitled";
      const totalWords = (data.chapters || []).reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      const chapterCount = (data.chapters || []).length;
      
      // Update legacy storage key
      storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      
      // Update currentStory for StoryLab sidebar
      storage.setItem("currentStory", JSON.stringify({
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
    const raw = storage.getItem(key);
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
    storage.setItem(key, JSON.stringify(data));
    
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
      storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(data));
      
      // Update currentStory for StoryLab sidebar
      storage.setItem("currentStory", JSON.stringify({
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
    storage.setItem("userProjects", JSON.stringify(userProjects));
  } catch (err) {
    console.error("Failed to sync userProjects:", err);
  }
}

// ✅ NEW: Delete ALL data associated with a project
function deleteAllProjectData(projectId) {
  try {
    // Main project data key
    const key = getProjectDataKey(projectId);
    storage.removeItem(key);
    
    // All possible project-related keys to clean up
    const keysToDelete = [
      // Project data
      `dahtruth-project-${projectId}`,
      `dahtruth_project_${projectId}`,
      `dahtruth_project_meta_${projectId}`,
      
      // Cover data
      `dahtruth_cover_designs_${projectId}`,
      `dahtruth_cover_settings_${projectId}`,
      `dahtruth_cover_image_url_${projectId}`,
      `dahtruth_cover_image_meta_${projectId}`,
      
      // Publishing data
      `publishingDraft_${projectId}`,
      `dt_publishing_meta_${projectId}`,
      
      // Chapters data (various formats)
      `dahtruth_chapters_${projectId}`,
      `chapters_${projectId}`,
      
      // Character data
      `dahtruth_characters_${projectId}`,
    ];
    
    keysToDelete.forEach(k => {
      try {
        storage.removeItem(k);
      } catch (e) {
        // Ignore errors for non-existent keys
      }
    });
    
    console.log(`[ProjectStore] Deleted all data for project: ${projectId}`);
  } catch (err) {
    console.error("Failed to delete project data:", err);
  }
}

// Migrate legacy data to new format (run once)
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
    if (!legacyData || !legacyData.chapters || legacyData.chapters.length === 0) {
      storage.setItem("dahtruth-migration-complete", "true");
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

    storage.setItem("dahtruth-migration-complete", "true");
    console.log(`[Migration] Migrated legacy project: "${title}" (${legacyData.chapters.length} chapters)`);

    return projectId;
  } catch (err) {
    console.error("Migration failed:", err);
    storage.setItem("dahtruth-migration-complete", "true");
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

// ============ Title Propagation ============

// ✅ NEW: Propagate title change to all related storage keys
function propagateTitleChange(projectId, newTitle) {
  if (!projectId || !newTitle) return;

  const keysToUpdate = [
    `dahtruth_project_meta_${projectId}`,
    `dt_publishing_meta_${projectId}`,
    `dahtruth_cover_settings_${projectId}`,
    `publishingDraft_${projectId}`,
  ];

  keysToUpdate.forEach((key) => {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === "object") {
          if ("title" in data) {
            data.title = newTitle;
          }
          if (data.book && typeof data.book === "object") {
            data.book.title = newTitle;
          }
          storage.setItem(key, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error(`Failed to update title in ${key}:`, err);
    }
  });

  // Also update currentStory if it matches this project
  try {
    const currentStoryRaw = storage.getItem("currentStory");
    if (currentStoryRaw) {
      const currentStory = JSON.parse(currentStoryRaw);
      if (currentStory && currentStory.id === projectId) {
        currentStory.title = newTitle;
        storage.setItem("currentStory", JSON.stringify(currentStory));
      }
    }
  } catch (err) {
    console.error("Failed to update currentStory:", err);
  }

  // Update userProjects
  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      if (Array.isArray(userProjects)) {
        const updated = userProjects.map(p => 
          p.id === projectId ? { ...p, title: newTitle } : p
        );
        storage.setItem("userProjects", JSON.stringify(updated));
      }
    }
  } catch (err) {
    console.error("Failed to update userProjects:", err);
  }

  console.log(`[ProjectStore] Title propagated for project ${projectId}: "${newTitle}"`);
}

// ============ Main Hook ============

export function useProjectStore() {
  // Run migration on first load
  useEffect(() => {
    migrateLegacyData();
  }, []);

  const [projects, setProjects] = useState(() => loadProjectsList());
  const [currentProjectId, setCurrentProjectId] = useState(() => loadCurrentProjectId());

  // Sync with storage changes
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
    storage.setItem(key, JSON.stringify(data));

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
    storage.setItem(key, JSON.stringify(data));

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

  // ✅ UPDATED: Delete a project and ALL related data
  const deleteProject = useCallback((projectId) => {
    // Remove from list
    const updated = projects.filter((p) => p.id !== projectId);
    saveProjectsList(updated);
    setProjects(updated);

    // Delete ALL project-related data
    deleteAllProjectData(projectId);

    // Update userProjects to remove this project
    syncToUserProjects(updated);

    // If we deleted the current project, switch to another or create new
    if (currentProjectId === projectId) {
      if (updated.length > 0) {
        switchProject(updated[0].id);
      } else {
        createProject("Untitled Book");
      }
    }

    console.log(`[ProjectStore] Deleted project: ${projectId}`);
    return true;
  }, [projects, currentProjectId, switchProject, createProject]);

  // ✅ UPDATED: Rename a project with full propagation
  const renameProject = useCallback((projectId, newTitle) => {
    // Update projects list
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

    // Propagate title to all related storage keys
    propagateTitleChange(projectId, newTitle);

    // Sync to userProjects
    syncToUserProjects(updated);

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
  if (!projectId) return LEGACY_STORAGE_KEY;
  return getProjectDataKey(projectId);
}

// ✅ NEW: Export for use in other components
export { propagateTitleChange, deleteAllProjectData };
