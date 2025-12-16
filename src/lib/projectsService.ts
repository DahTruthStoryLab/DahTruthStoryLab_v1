// src/lib/projectsService.ts
// Handles all project persistence operations (localStorage + S3)

import type {
  Project,
  ProjectIndex,
  ProjectIndexEntry,
  SyncState,
  SyncStatus,
} from "../types/project";
import { createEmptyProject, createProjectIndexEntry } from "../types/project";
import { API_BASE } from "./api";
import { getLocalAuthorId } from "./authorService";

/* ============================================================================
   CONSTANTS
   ============================================================================ */

const PROJECTS_CACHE_KEY = "dahtruth_projects_cache";
const PROJECTS_INDEX_KEY = "dahtruth_projects_index";
const CURRENT_PROJECT_KEY = "dahtruth_current_project";
const CURRENT_PROJECT_ID_KEY = "dahtruth_current_project_id";

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DELAY = 3000;

/* ============================================================================
   LOCAL STORAGE OPERATIONS
   ============================================================================ */

/**
 * Get project index from localStorage
 */
export function getLocalProjectIndex(): ProjectIndexEntry[] {
  if (typeof window === "undefined") return [];
  
  try {
    const raw = localStorage.getItem(PROJECTS_INDEX_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error("[projectsService] Failed to parse project index:", err);
    return [];
  }
}

/**
 * Save project index to localStorage
 */
export function setLocalProjectIndex(entries: ProjectIndexEntry[]): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(entries));
  } catch (err) {
    console.error("[projectsService] Failed to save project index:", err);
  }
}

/**
 * Get a single project from localStorage cache
 */
export function getLocalProject(projectId: string): Project | null {
  if (typeof window === "undefined") return null;
  
  try {
    const key = `${PROJECTS_CACHE_KEY}_${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    return JSON.parse(raw) as Project;
  } catch (err) {
    console.error("[projectsService] Failed to load project from cache:", err);
    return null;
  }
}

/**
 * Save a single project to localStorage cache
 */
export function setLocalProject(project: Project): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `${PROJECTS_CACHE_KEY}_${project.id}`;
    localStorage.setItem(key, JSON.stringify(project));
    
    // Also update the current project if it matches
    const currentId = localStorage.getItem(CURRENT_PROJECT_ID_KEY);
    if (currentId === project.id) {
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
    }
  } catch (err) {
    console.error("[projectsService] Failed to save project to cache:", err);
  }
}

/**
 * Remove a project from localStorage cache
 */
export function removeLocalProject(projectId: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = `${PROJECTS_CACHE_KEY}_${projectId}`;
    localStorage.removeItem(key);
  } catch (err) {
    console.error("[projectsService] Failed to remove project from cache:", err);
  }
}

/**
 * Get the currently active project from localStorage
 */
export function getCurrentProject(): Project | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (!raw) return null;
    
    return JSON.parse(raw) as Project;
  } catch (err) {
    console.error("[projectsService] Failed to load current project:", err);
    return null;
  }
}

/**
 * Set the currently active project
 */
export function setCurrentProject(project: Project | null): void {
  if (typeof window === "undefined") return;
  
  try {
    if (project) {
      localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
      localStorage.setItem(CURRENT_PROJECT_ID_KEY, project.id);
      setLocalProject(project); // Also cache it
    } else {
      localStorage.removeItem(CURRENT_PROJECT_KEY);
      localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
    }
  } catch (err) {
    console.error("[projectsService] Failed to set current project:", err);
  }
}

/**
 * Get just the current project ID
 */
export function getCurrentProjectId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(CURRENT_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}

/* ============================================================================
   S3 OPERATIONS
   ============================================================================ */

/**
 * Build S3 key for a project
 */
function projectKey(authorId: string, projectId: string): string {
  return `authors/${authorId}/projects/${projectId}.json`;
}

/**
 * Build S3 key for project index
 */
function indexKey(authorId: string): string {
  return `authors/${authorId}/projects/index.json`;
}

/**
 * Save project to S3
 */
export async function saveProjectToCloud(project: Project): Promise<void> {
  const authorId = project.authorId || getLocalAuthorId();
  if (!authorId) {
    throw new Error("No author ID available for cloud save");
  }
  
  const key = projectKey(authorId, project.id);
  
  const response = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operation": "put-object",
    },
    body: JSON.stringify({
      operation: "put-object",
      key,
      contentType: "application/json",
      body: JSON.stringify(project),
    }),
  });
  
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Failed to save project: ${response.status} ${text}`);
  }
  
  console.log("[projectsService] Project saved to cloud:", project.id);
}

/**
 * Load project from S3
 */
export async function loadProjectFromCloud(
  authorId: string,
  projectId: string
): Promise<Project | null> {
  const key = projectKey(authorId, projectId);
  
  try {
    const response = await fetch(`${API_BASE}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operation": "get-object",
      },
      body: JSON.stringify({
        operation: "get-object",
        key,
      }),
    });
    
    if (response.status === 404) {
      console.log("[projectsService] Project not found in cloud:", projectId);
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load project: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle different response formats
    if (data.body) {
      return typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    }
    if (data.data) {
      return data.data as Project;
    }
    
    return data as Project;
  } catch (err) {
    console.error("[projectsService] Cloud load failed:", err);
    return null;
  }
}

/**
 * Delete project from S3
 */
export async function deleteProjectFromCloud(
  authorId: string,
  projectId: string
): Promise<void> {
  const key = projectKey(authorId, projectId);
  
  const response = await fetch(`${API_BASE}/files`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      operation: "delete-object",
      key,
    }),
  });
  
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete project: ${response.status}`);
  }
  
  console.log("[projectsService] Project deleted from cloud:", projectId);
}

/**
 * Save project index to S3
 */
export async function saveIndexToCloud(
  authorId: string,
  entries: ProjectIndexEntry[]
): Promise<void> {
  const key = indexKey(authorId);
  
  const index: ProjectIndex = {
    authorId,
    projects: entries,
    updatedAt: new Date().toISOString(),
  };
  
  const response = await fetch(`${API_BASE}/files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-operation": "put-object",
    },
    body: JSON.stringify({
      operation: "put-object",
      key,
      contentType: "application/json",
      body: JSON.stringify(index),
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to save index: ${response.status}`);
  }
  
  console.log("[projectsService] Index saved to cloud");
}

/**
 * Load project index from S3
 */
export async function loadIndexFromCloud(
  authorId: string
): Promise<ProjectIndexEntry[]> {
  const key = indexKey(authorId);
  
  try {
    const response = await fetch(`${API_BASE}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operation": "get-object",
      },
      body: JSON.stringify({
        operation: "get-object",
        key,
      }),
    });
    
    if (response.status === 404) {
      console.log("[projectsService] No index found in cloud");
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load index: ${response.status}`);
    }
    
    const data = await response.json();
    
    let index: ProjectIndex;
    if (data.body) {
      index = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    } else if (data.data) {
      index = data.data;
    } else {
      index = data;
    }
    
    return index.projects || [];
  } catch (err) {
    console.error("[projectsService] Failed to load index from cloud:", err);
    return [];
  }
}

/* ============================================================================
   HIGH-LEVEL OPERATIONS
   ============================================================================ */

/**
 * Create a new project
 */
export async function createProject(
  title: string,
  options: {
    authorId?: string;
    authorName?: string;
    saveToCloud?: boolean;
  } = {}
): Promise<Project> {
  const authorId = options.authorId || getLocalAuthorId();
  if (!authorId) {
    throw new Error("No author ID available");
  }
  
  const project = createEmptyProject(authorId, title);
  
  if (options.authorName) {
    project.author = options.authorName;
    project.publishing.meta.author = options.authorName;
    project.cover.author = options.authorName;
  }
  
  // Save locally
  setLocalProject(project);
  setCurrentProject(project);
  
  // Update local index
  const index = getLocalProjectIndex();
  const entry = createProjectIndexEntry(project);
  setLocalProjectIndex([entry, ...index]);
  
  // Save to cloud if requested
  if (options.saveToCloud !== false) {
    try {
      await saveProjectToCloud(project);
      await saveIndexToCloud(authorId, [entry, ...index]);
    } catch (err) {
      console.error("[projectsService] Cloud save failed:", err);
      // Don't throw - local save succeeded
    }
  }
  
  console.log("[projectsService] Project created:", project.id);
  return project;
}

/**
 * Save the current project (local + cloud)
 */
export async function saveProject(
  project: Project,
  options: {
    updateIndex?: boolean;
    cloudSync?: boolean;
  } = {}
): Promise<void> {
  // Update timestamp
  project.updatedAt = new Date().toISOString();
  
  // Save locally
  setLocalProject(project);
  
  // Update index if requested
  if (options.updateIndex !== false) {
    const index = getLocalProjectIndex();
    const entry = createProjectIndexEntry(project);
    const newIndex = [
      entry,
      ...index.filter((e) => e.id !== project.id),
    ];
    setLocalProjectIndex(newIndex);
    
    // Save index to cloud
    if (options.cloudSync !== false) {
      const authorId = project.authorId || getLocalAuthorId();
      if (authorId) {
        saveIndexToCloud(authorId, newIndex).catch((err) => {
          console.error("[projectsService] Index cloud save failed:", err);
        });
      }
    }
  }
  
  // Save to cloud
  if (options.cloudSync !== false) {
    try {
      await saveProjectToCloud(project);
    } catch (err) {
      console.error("[projectsService] Cloud save failed:", err);
      throw err;
    }
  }
}

/**
 * Load a project by ID (local first, then cloud)
 */
export async function loadProject(
  projectId: string,
  options: {
    authorId?: string;
    preferCloud?: boolean;
  } = {}
): Promise<Project | null> {
  const authorId = options.authorId || getLocalAuthorId();
  
  // Try local first (faster)
  if (!options.preferCloud) {
    const local = getLocalProject(projectId);
    if (local) {
      setCurrentProject(local);
      
      // Sync from cloud in background
      if (authorId) {
        loadProjectFromCloud(authorId, projectId).then((cloud) => {
          if (cloud && cloud.updatedAt > local.updatedAt) {
            console.log("[projectsService] Cloud version is newer, updating local");
            setLocalProject(cloud);
            setCurrentProject(cloud);
          }
        }).catch(() => {});
      }
      
      return local;
    }
  }
  
  // Try cloud
  if (authorId) {
    const cloud = await loadProjectFromCloud(authorId, projectId);
    if (cloud) {
      setLocalProject(cloud);
      setCurrentProject(cloud);
      return cloud;
    }
  }
  
  console.log("[projectsService] Project not found:", projectId);
  return null;
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string,
  options: {
    authorId?: string;
  } = {}
): Promise<void> {
  const authorId = options.authorId || getLocalAuthorId();
  
  // Remove from local
  removeLocalProject(projectId);
  
  // Update local index
  const index = getLocalProjectIndex();
  const newIndex = index.filter((e) => e.id !== projectId);
  setLocalProjectIndex(newIndex);
  
  // Clear current project if it matches
  if (getCurrentProjectId() === projectId) {
    setCurrentProject(null);
  }
  
  // Delete from cloud
  if (authorId) {
    try {
      await deleteProjectFromCloud(authorId, projectId);
      await saveIndexToCloud(authorId, newIndex);
    } catch (err) {
      console.error("[projectsService] Cloud delete failed:", err);
    }
  }
  
  console.log("[projectsService] Project deleted:", projectId);
}

/**
 * List all projects (local + cloud merge)
 */
export async function listProjects(options: {
  authorId?: string;
  refreshFromCloud?: boolean;
} = {}): Promise<ProjectIndexEntry[]> {
  const authorId = options.authorId || getLocalAuthorId();
  
  // Get local index
  let entries = getLocalProjectIndex();
  
  // Fetch from cloud if requested
  if (options.refreshFromCloud && authorId) {
    try {
      const cloudEntries = await loadIndexFromCloud(authorId);
      
      // Merge: prefer newer entries
      const merged = new Map<string, ProjectIndexEntry>();
      
      for (const entry of entries) {
        merged.set(entry.id, entry);
      }
      
      for (const entry of cloudEntries) {
        const existing = merged.get(entry.id);
        if (!existing || entry.updatedAt > existing.updatedAt) {
          merged.set(entry.id, entry);
        }
      }
      
      entries = Array.from(merged.values());
      
      // Sort by updatedAt (most recent first)
      entries.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      // Update local cache
      setLocalProjectIndex(entries);
    } catch (err) {
      console.error("[projectsService] Failed to refresh from cloud:", err);
    }
  }
  
  return entries;
}

/**
 * Duplicate a project
 */
export async function duplicateProject(
  projectId: string,
  newTitle?: string
): Promise<Project | null> {
  const original = await loadProject(projectId);
  if (!original) return null;
  
  const authorId = original.authorId || getLocalAuthorId();
  if (!authorId) return null;
  
  // Create new project with copied data
  const newProject: Project = {
    ...JSON.parse(JSON.stringify(original)), // Deep clone
    id: crypto?.randomUUID?.() || `proj_${Date.now()}`,
    title: newTitle || `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Update nested titles
  newProject.publishing.meta.title = newProject.title;
  newProject.cover.title = newProject.title;
  
  // Save
  setLocalProject(newProject);
  
  const index = getLocalProjectIndex();
  const entry = createProjectIndexEntry(newProject);
  setLocalProjectIndex([entry, ...index]);
  
  // Cloud save
  try {
    await saveProjectToCloud(newProject);
    await saveIndexToCloud(authorId, [entry, ...index]);
  } catch (err) {
    console.error("[projectsService] Cloud save failed for duplicate:", err);
  }
  
  return newProject;
}

/* ============================================================================
   AUTO-SAVE UTILITIES
   ============================================================================ */

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingSave: Project | null = null;

/**
 * Queue an auto-save (debounced)
 */
export function queueAutoSave(
  project: Project,
  onSaveStart?: () => void,
  onSaveComplete?: (success: boolean) => void
): void {
  pendingSave = project;
  
  // Clear existing timeout
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }
  
  // Save locally immediately
  setLocalProject(project);
  
  // Debounce cloud save
  autoSaveTimeout = setTimeout(async () => {
    if (!pendingSave) return;
    
    onSaveStart?.();
    
    try {
      await saveProject(pendingSave, { updateIndex: true, cloudSync: true });
      onSaveComplete?.(true);
    } catch (err) {
      console.error("[projectsService] Auto-save failed:", err);
      onSaveComplete?.(false);
    }
    
    pendingSave = null;
    autoSaveTimeout = null;
  }, AUTO_SAVE_DELAY);
}

/**
 * Cancel pending auto-save
 */
export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
  pendingSave = null;
}

/**
 * Force immediate save of pending changes
 */
export async function flushAutoSave(): Promise<void> {
  if (!pendingSave) return;
  
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
  
  try {
    await saveProject(pendingSave, { updateIndex: true, cloudSync: true });
  } finally {
    pendingSave = null;
  }
}

/* ============================================================================
   SYNC STATUS
   ============================================================================ */

let syncStatus: SyncStatus = "idle";
let syncListeners: Set<(status: SyncStatus) => void> = new Set();

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function setSyncStatus(status: SyncStatus): void {
  syncStatus = status;
  syncListeners.forEach((listener) => listener(status));
}

export function onSyncStatusChange(listener: (status: SyncStatus) => void): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

export const projectsService = {
  // Local operations
  getLocalIndex: getLocalProjectIndex,
  setLocalIndex: setLocalProjectIndex,
  getLocal: getLocalProject,
  setLocal: setLocalProject,
  removeLocal: removeLocalProject,
  getCurrent: getCurrentProject,
  setCurrent: setCurrentProject,
  getCurrentId: getCurrentProjectId,
  
  // Cloud operations
  saveToCloud: saveProjectToCloud,
  loadFromCloud: loadProjectFromCloud,
  deleteFromCloud: deleteProjectFromCloud,
  saveIndexToCloud,
  loadIndexFromCloud,
  
  // High-level operations
  create: createProject,
  save: saveProject,
  load: loadProject,
  delete: deleteProject,
  list: listProjects,
  duplicate: duplicateProject,
  
  // Auto-save
  queueAutoSave,
  cancelAutoSave,
  flushAutoSave,
  
  // Sync status
  getSyncStatus,
  setSyncStatus,
  onSyncStatusChange,
};

export default projectsService;
