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

// New/current keys (used by this service)
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
   SMALL HELPERS
   ============================================================================ */

function isPlainObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/**
 * Some storage backends (or wrappers) may return already-parsed objects.
 * Normalize to object when possible.
 */
function safeParseJson<T>(raw: any): T | null {
  if (raw == null) return null;
  try {
    if (typeof raw === "string") return JSON.parse(raw) as T;
    // If it's already an object/array, assume it is the value
    return raw as T;
  } catch {
    return null;
  }
}

function safeParseIndex(raw: any): ProjectIndexEntry[] | null {
  const parsed = safeParseJson<unknown>(raw);
  return Array.isArray(parsed) ? (parsed as ProjectIndexEntry[]) : null;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Emit events so hooks/pages listening to "storage"/"project:change"/"projects:change"
 * stay in sync across the app.
 */
function emitProjectChangeEvents(): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("projects:change"));
    window.dispatchEvent(new Event("storage"));
  } catch {
    // ignore
  }
}

/**
 * Old UI expects `currentStory` to be *metadata*, not the full Project object.
 * Keep this synced for backward compatibility.
 */
function computeLegacyStoryMeta(project: Project) {
  const anyProj = project as any;

  const title =
    (typeof anyProj?.title === "string" && anyProj.title) ||
    (typeof anyProj?.book?.title === "string" && anyProj.book.title) ||
    (typeof anyProj?.publishing?.meta?.title === "string" && anyProj.publishing.meta.title) ||
    "Untitled";

  // Try to find chapters in a few common shapes (defensive)
  const chapters: any[] =
    (Array.isArray(anyProj?.chapters) && anyProj.chapters) ||
    (Array.isArray(anyProj?.manuscript?.chapters) && anyProj.manuscript.chapters) ||
    (Array.isArray(anyProj?.writing?.chapters) && anyProj.writing.chapters) ||
    [];

  const chapterCount = chapters.length;

  const wordCount = chapters.reduce((sum, ch) => {
    const wc = Number(ch?.wordCount ?? ch?.words ?? 0);
    return sum + (Number.isFinite(wc) ? wc : 0);
  }, 0);

  const updatedAt = typeof anyProj?.updatedAt === "string" ? anyProj.updatedAt : nowIso();
  const status = typeof anyProj?.status === "string" ? anyProj.status : "Draft";

  return {
    id: project.id,
    title,
    status,
    updatedAt,
    wordCount,
    chapterCount,
  };
}

/* ============================================================================
   LOCAL STORAGE OPERATIONS (IndexedDB via storage wrapper)
   ============================================================================ */

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
      storage.setItem(PROJECTS_INDEX_KEY, JSON.stringify(parsedLegacy));
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
    emitProjectChangeEvents();
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

    const parsed = safeParseJson<Project>(raw);
    return parsed ?? null;
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
      storage.getItem(CURRENT_PROJECT_ID_KEY) ||
      storage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY) ||
      null;

    if (currentId === project.id) {
      storage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));

      // Legacy: `currentStory` should be metadata
      storage.setItem(LEGACY_CURRENT_STORY_KEY, JSON.stringify(computeLegacyStoryMeta(project)));
    }

    emitProjectChangeEvents();
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

    // Some older builds used "-" instead of "_" between base and id
    storage.removeItem(`${PROJECTS_CACHE_KEY}-${projectId}`);

    emitProjectChangeEvents();
  } catch (err) {
    console.error("[projectsService] Failed to remove project from cache:", err);
  }
}

/**
 * Get the currently active project from storage (new key first; legacy story meta is only a fallback)
 */
export function getCurrentProject(): Project | null {
  if (typeof window === "undefined") return null;

  try {
    const rawNew = storage.getItem(CURRENT_PROJECT_KEY);
    const parsedNew = safeParseJson<Project>(rawNew);
    if (parsedNew) return parsedNew;

    // If only legacy currentStory exists, it may be *metadata only*.
    // In that case we can only recover the ID and try loading the cached project.
    const rawLegacy = storage.getItem(LEGACY_CURRENT_STORY_KEY);
    const legacy = safeParseJson<any>(rawLegacy);

    if (legacy && isPlainObject(legacy) && typeof legacy.id === "string") {
      const maybeProject = getLocalProject(legacy.id);
      if (maybeProject) {
        storage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(maybeProject));
        storage.setItem(CURRENT_PROJECT_ID_KEY, maybeProject.id);
        return maybeProject;
      }

      // Heal forward the ID even if the full project isn't cached
      storage.setItem(CURRENT_PROJECT_ID_KEY, legacy.id);
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
      storage.setItem(LEGACY_CURRENT_STORY_KEY, JSON.stringify(computeLegacyStoryMeta(project)));

      // Cache it too
      storage.setItem(`${PROJECTS_CACHE_KEY}_${project.id}`, JSON.stringify(project));
    } else {
      storage.removeItem(CURRENT_PROJECT_KEY);
      storage.removeItem(CURRENT_PROJECT_ID_KEY);

      // Clear legacy
      storage.removeItem(LEGACY_CURRENT_PROJECT_ID_KEY);
      storage.removeItem(LEGACY_CURRENT_STORY_KEY);
    }

    emitProjectChangeEvents();
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
    return (
      storage.getItem(CURRENT_PROJECT_ID_KEY) ||
      storage.getItem(LEGACY_CURRENT_PROJECT_ID_KEY) ||
      null
    );
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
  const authorId = (project as any).authorId || getLocalAuthorId();
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

    if (data?.body) return typeof data.body === "string" ? JSON.parse(data.body) : (data.body as Project);
    if (data?.data) return data.data as Project;

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
    updatedAt: nowIso(),
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
    if (data?.body) index = typeof data.body === "string" ? JSON.parse(data.body) : data.body;
    else if (data?.data) index = data.data;
    else index = data;

    return Array.isArray(index?.projects) ? index.projects : [];
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
    // Be defensive: these fields may or may not exist depending on your Project type shape
    (project as any).author = options.authorName;

    if ((project as any).publishing?.meta) {
      (project as any).publishing.meta.author = options.authorName;
    }
    if ((project as any).cover) {
      (project as any).cover.author = options.authorName;
    }
  }

  // Save locally
  setLocalProject(project);
  setCurrentProject(project);

  // Update local index
  const index = getLocalProjectIndex();
  const entry = createProjectIndexEntry(project);
  setLocalProjectIndex([entry, ...index]);

  // Save to cloud if requested (default true)
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
  (project as any).updatedAt = nowIso();

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
      const authorId = (project as any).authorId || getLocalAuthorId();
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

      // If authorId exists, check cloud and refresh if newer (non-blocking)
      if (authorId) {
        loadProjectFromCloud(authorId, projectId)
          .then((cloud) => {
            if (!cloud) return;

            const localUpdated = String((local as any).updatedAt || "");
            const cloudUpdated = String((cloud as any).updatedAt || "");

            if (cloudUpdated && localUpdated && cloudUpdated > localUpdated) {
              console.log("[projectsService] Cloud version is newer, updating local");
              setLocalProject(cloud);
              setCurrentProject(cloud);
            }
          })
          .catch(() => {
            // ignore background errors
          });
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

  // Extra cleanup for older modules that stored project-scoped cover keys
  // Try both "_" and "-" separators, and both raw id & "project-{id}" styles.
  const idVariants = [projectId, `project-${projectId}`];
  const keyBases = ["dahtruth_cover_image_url", "dahtruth_cover_image_meta", "dahtruth_cover_settings", "dahtruth_cover_designs"];

  try {
    for (const id of idVariants) {
      for (const base of keyBases) {
        storage.removeItem(`${base}_${id}`);
        storage.removeItem(`${base}-${id}`);
      }
      storage.removeItem(`dahtruth-project-${id}`);
      storage.removeItem(`dahtruth_project_${id}`);
    }
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

  emitProjectChangeEvents();
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

  const authorId = (original as any).authorId || getLocalAuthorId();
  if (!authorId) return null;

  const newId =
    (globalThis as any).crypto?.randomUUID?.() || `proj_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const newProject: Project = {
    ...(JSON.parse(JSON.stringify(original)) as Project),
    id: newId,
    title: newTitle || `${(original as any).title || "Untitled"} (Copy)`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  } as any;

  // Keep common nested title fields in sync (defensive)
  const anyProj = newProject as any;
  if (anyProj?.publishing?.meta) anyProj.publishing.meta.title = anyProj.title;
  if (anyProj?.cover) anyProj.cover.title = anyProj.title;

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
const syncListeners: Set<(status: SyncStatus) => void> = new Set();

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
