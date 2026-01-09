// src/lib/projectsService.ts
// Handles all project persistence operations (IndexedDB + S3)
// Updated to use IndexedDB for large manuscript support

import type { Project, ProjectIndex, ProjectIndexEntry, SyncStatus } from "../types/project";
import { createEmptyProject, createProjectIndexEntry } from "../types/project";
import { API_BASE } from "./api";
import { getLocalAuthorId } from "./authorService";
import { storage, runMigrationIfNeeded } from "./storage";

/* ============================================================================
   CONSTANTS
   ============================================================================ */

const PROJECTS_CACHE_KEY = "dahtruth_projects_cache";
const PROJECTS_INDEX_KEY = "dahtruth_projects_index";
const CURRENT_PROJECT_KEY = "dahtruth_current_project";
const CURRENT_PROJECT_ID_KEY = "dahtruth_current_project_id";

// Legacy keys still used by older UI/pages
const LEGACY_PROJECTS_LIST_KEY = "dahtruth-projects-list";
const LEGACY_CURRENT_PROJECT_ID_KEY = "dahtruth-current-project-id";
const LEGACY_CURRENT_STORY_KEY = "currentStory";

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DELAY = 3000;

// Run migration on module load
runMigrationIfNeeded().catch((err) => {
  console.error("[projectsService] Migration failed:", err);
});

/* ============================================================================
   LOCAL STORAGE OPERATIONS (Now uses IndexedDB via storage wrapper)
   ============================================================================ */

function safeParseJson<T>(raw: any): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function safeParseIndex(raw: any): ProjectIndexEntry[] | null {
  const parsed = safeParseJson<unknown>(raw);
  return Array.isArray(parsed) ? (parsed as ProjectIndexEntry[]) : null;
}

/**
 * Get project index from storage (new key first, then legacy key)
 */
export function getLocalProjectIndex(): ProjectIndexEntry[] {
  if (typeof window === "undefined") return [];

  try {
    // Primary (new)
    const rawNew = storage.getItem(PROJECTS_INDEX_KEY);
    const parsedNew = safeParseIndex(rawNew);
    if (parsedNew) return parsedNew;

    // Legacy (old UI)
    const rawLegacy = storage.getItem(LEGACY_PROJECTS_LIST_KEY);
    const parsedLegacy = safeParseIndex(rawLegacy);
    if (parsedLegacy) {
      // Heal forward
      const healed = JSON.stringify(parsedLegacy);
      storage.setItem(PROJECTS_INDEX_KEY, healed);
      return parsedLegacy;
    }

    return [];
  } catch (err) {
    console.error("[projectsService] Failed to read project index:", err);
    return [];
  }
}

/**
 * Save project index to storage (writes both new + legacy keys)
 */
export function setLocalProjectIndex(entries: ProjectIndexEntry[]): void {
  if (typeof window === "undefined") return;

  try {
    const raw = JSON.stringify(entries);
    storage.setItem(PROJECTS_INDEX_KEY, raw);
    storage.setItem(LEGACY_PROJECTS_LIST_KEY, raw); // keep legacy UI in sync
  } catch (err) {
    console.error("[projectsService] Failed to save project index:", err);
  }
}

/**
 * Get a single project from storage cache
 */
export function getLocalProject(projectId: string): Project | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${PROJECTS_CACHE_KEY}_${projectId}`;
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Project;
  } catch (err) {
    console.error("[projectsService] Failed to load project from cache:", err);
    return null;
  }
}

/**
 * Save a single project to storage cache
 */
export function setLocalProject(project: Project): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${PROJECTS_CACHE_KEY}_${project.id}`;
    storage.setItem(key, JSON.stringify(project));

    // Also update the current project if it matches (supports legacy current id key too)
    const currentId =
      storage.getItem(CURRENT_PROJECT_ID_KEY) || storage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY);

    if (currentId === project.id) {
      storage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
      storage.setItem(LEGACY_CURRENT_STORY_KEY, JSON.stringify(project));
    }
  } catch (err) {
    console.error("[projectsService] Failed to save project to cache:", err);
  }
}

/**
 * Remove a project from storage cache
 */
export function removeLocalProject(projectId: string): void {
  if (typeof window === "undefined") return;

  try {
    const key = `${PROJECTS_CACHE_KEY}_${projectId}`;
    storage.removeItem(key);
  } catch (err) {
    console.error("[projectsService] Failed to remove project from cache:", err);
  }
}

/**
 * Get the currently active project from storage (new key first; legacy story is only a fallback)
 */
export function getCurrentProject(): Project | null {
  if (typeof window === "undefined") return null;

  try {
    const rawNew = storage.getItem(CURRENT_PROJECT_KEY);
    const parsedNew = safeParseJson<Project>(rawNew);
    if (parsedNew) return parsedNew;

    const rawLegacy = storage.getItem(LEGACY_CURRENT_STORY_KEY);
    const parsedLegacy = safeParseJson<Project>(rawLegacy);
    if (parsedLegacy) {
      // Heal forward
      storage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(parsedLegacy));
      if (parsedLegacy?.id) {
        storage.setItem(CURRENT_PROJECT_ID_KEY, parsedLegacy.id);
      }
      return parsedLegacy;
    }

    return null;
  } catch (err) {
    console.error("[projectsService] Failed to load current project:", err);
    return null;
  }
}

/**
 * Set the currently active project (writes both new + legacy keys)
 */
export function setCurrentProject(project: Project | null): void {
  if (typeof window === "undefined") return;

  try {
    if (project) {
      storage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
      storage.setItem(CURRENT_PROJECT_ID_KEY, project.id);

      // Keep legacy keys in sync
      storage.setItem(LEGACY_CURRENT_PROJECT_ID_KEY, project.id);
      storage.setItem(LEGACY_CURRENT_STORY_KEY, JSON.stringify(project));

      setLocalProject(project); // Also cache it
    } else {
      storage.removeItem(CURRENT_PROJECT_KEY);
      storage.removeItem(CURRENT_PROJECT_ID_KEY);

      // Clear legacy
      storage.removeItem(LEGACY_CURRENT_PROJECT_ID_KEY);
      storage.removeItem(LEGACY_CURRENT_STORY_KEY);
    }
  } catch (err) {
    console.error("[projectsService] Failed to set current project:", err);
  }
}

/**
 * Get just the current project ID (new key first; fallback to legacy)
 */
export function getCurrentProjectId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return storage.getItem(CURRENT_PROJECT_ID_KEY) || storage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}

/* ============================================================================
   S3 OPERATIONS
   ============================================================================ */

function projectKey(authorId: string, projectId: string): string {
  return `authors/${authorId}/projects/${projectId}.json`;
}

function indexKey(authorId: string): string {
  return `authors/${authorId}/projects/index.json`;
}

export async function saveProjectToCloud(project: Project): Promise<void> {
  const authorId = project.authorId || getLocalAuthorId();
  if (!authorId) throw new Error("No author ID available for cloud save");

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

export async function loadProjectFromCloud(authorId: string, projectId: string): Promise<Project | null> {
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

    if (!response.ok) throw new Error(`Failed to load project: ${response.status}`);

    const data = await response.json();

    if (data.body) return typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    if (data.data) return data.data as Project;

    return data as Project;
  } catch (err) {
    console.error("[projectsService] Cloud load failed:", err);
    return null;
  }
}

export async function deleteProjectFromCloud(authorId: string, projectId: string): Promise<void> {
  const key = projectKey(authorId, projectId);

  const response = await fetch(`${API_BASE}/files`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
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

export async function saveIndexToCloud(authorId: string, entries: ProjectIndexEntry[]): Promise<void> {
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

  if (!response.ok) throw new Error(`Failed to save index: ${response.status}`);

  console.log("[projectsService] Index saved to cloud");
}

export async function loadIndexFromCloud(authorId: string): Promise<ProjectIndexEntry[]> {
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

    if (!response.ok) throw new Error(`Failed to load index: ${response.status}`);

    const data = await response.json();

    let index: ProjectIndex;
    if (data.body) index = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    else if (data.data) index = data.data;
    else index = data;

    return index.projects || [];
  } catch (err) {
    console.error("[projectsService] Failed to load index from cloud:", err);
    return [];
  }
}

/* ============================================================================
   HIGH-LEVEL OPERATIONS
   ============================================================================ */

export async function createProject(
  title: string,
  options: { authorId?: string; authorName?: string; saveToCloud?: boolean } = {}
): Promise<Project> {
  const authorId = options.authorId || getLocalAuthorId();
  if (!authorId) throw new Error("No author ID available");

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
    }
  }

  console.log("[projectsService] Project created:", project.id);
  return project;
}

export async function saveProject(
  project: Project,
  options: { updateIndex?: boolean; cloudSync?: boolean } = {}
): Promise<void> {
  project.updatedAt = new Date().toISOString();

  // Save locally
  setLocalProject(project);

  // Update index if requested
  if (options.updateIndex !== false) {
    const index = getLocalProjectIndex();
    const entry = createProjectIndexEntry(project);
    const newIndex = [entry, ...index.filter((e) => e.id !== project.id)];
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
    await saveProjectToCloud(project);
  }
}

export async function loadProject(
  projectId: string,
  options: { authorId?: string; preferCloud?: boolean } = {}
): Promise<Project | null> {
  const authorId = options.authorId || getLocalAuthorId();

  // Try local first
  if (!options.preferCloud) {
    const local = getLocalProject(projectId);
    if (local) {
      setCurrentProject(local);

      // Sync from cloud in background
      if (authorId) {
        loadProjectFromCloud(authorId, projectId)
          .then((cloud) => {
            if (cloud && cloud.updatedAt > local.updatedAt) {
              console.log("[projectsService] Cloud version is newer, updating local");
              setLocalProject(cloud);
              setCurrentProject(cloud);
            }
          })
          .catch(() => {});
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

export async function deleteProject(projectId: string, options: { authorId?: string } = {}): Promise<void> {
  const authorId = options.authorId || getLocalAuthorId();

  // Remove from local cache
  removeLocalProject(projectId);

  // Update index (writes BOTH new + legacy list keys)
  const index = getLocalProjectIndex();
  const newIndex = index.filter((e) => e.id !== projectId);
  setLocalProjectIndex(newIndex);

  // Clear current project if it matches (clears BOTH key styles)
  if (getCurrentProjectId() === projectId) {
    setCurrentProject(null);
  }

  // Extra legacy cleanup (older pages sometimes store per-project extras)
  try {
    storage.removeItem(`dahtruth-project-project-${projectId}`);
    storage.removeItem(`dahtruth_cover_image_url_project-${projectId}`);
    storage.removeItem(`dahtruth_cover_image_meta_project-${projectId}`);
  } catch {
    // ignore
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

export async function listProjects(options: {
  authorId?: string;
  refreshFromCloud?: boolean;
} = {}): Promise<ProjectIndexEntry[]> {
  const authorId = options.authorId || getLocalAuthorId();

  let entries = getLocalProjectIndex();

  if (options.refreshFromCloud && authorId) {
    try {
      const cloudEntries = await loadIndexFromCloud(authorId);

      const merged = new Map<string, ProjectIndexEntry>();
      for (const entry of entries) merged.set(entry.id, entry);

      for (const entry of cloudEntries) {
        const existing = merged.get(entry.id);
        if (!existing || entry.updatedAt > existing.updatedAt) merged.set(entry.id, entry);
      }

      entries = Array.from(merged.values());
      entries.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      setLocalProjectIndex(entries);
    } catch (err) {
      console.error("[projectsService] Failed to refresh from cloud:", err);
    }
  }

  return entries;
}

export async function duplicateProject(projectId: string, newTitle?: string): Promise<Project | null> {
  const original = await loadProject(projectId);
  if (!original) return null;

  const authorId = original.authorId || getLocalAuthorId();
  if (!authorId) return null;

  const newProject: Project = {
    ...JSON.parse(JSON.stringify(original)),
    id: crypto?.randomUUID?.() || `proj_${Date.now()}`,
    title: newTitle || `${original.title} (Copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  newProject.publishing.meta.title = newProject.title;
  newProject.cover.title = newProject.title;

  setLocalProject(newProject);

  const index = getLocalProjectIndex();
  const entry = createProjectIndexEntry(newProject);
  setLocalProjectIndex([entry, ...index]);

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

export function queueAutoSave(
  project: Project,
  onSaveStart?: () => void,
  onSaveComplete?: (success: boolean) => void
): void {
  pendingSave = project;

  if (autoSaveTimeout) clearTimeout(autoSaveTimeout);

  // Save locally immediately
  setLocalProject(project);

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

export function cancelAutoSave(): void {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = null;
  }
  pendingSave = null;
}

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
