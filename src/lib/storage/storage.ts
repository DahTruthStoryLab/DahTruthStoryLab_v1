// src/lib/storage/storage.ts
// Storage service that provides localStorage-like API but uses IndexedDB
// Fixes:
//  - Prevents "projects disappeared" by ensuring hydration can be awaited
//  - Prevents "saved but lost on refresh" by adding flush() for queued writes
//  - Keeps backwards-compatible synchronous wrapper (storage.getItem/setItem)

import { db, initDB, isIndexedDBAvailable, StorageEntry, ProjectEntry } from "./db";

/* ============================================================================
   INITIALIZATION STATE
   ========================================================================== */

let initialized = false;
let initPromise: Promise<void> | null = null;
let fallbackToLocalStorage = false;

async function ensureReady(): Promise<void> {
  if (initialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      if (!isIndexedDBAvailable()) {
        console.warn("[Storage] IndexedDB not available, falling back to localStorage");
        fallbackToLocalStorage = true;
        initialized = true;
        return;
      }

      try {
        await initDB();
        initialized = true;
        console.log("[Storage] IndexedDB initialized successfully");
      } catch (error) {
        console.error("[Storage] Failed to init IndexedDB, falling back to localStorage:", error);
        fallbackToLocalStorage = true;
        initialized = true;
      }
    })();
  }

  return initPromise;
}

/* ============================================================================
   CORE STORAGE OPERATIONS (Async - for direct use)
   ========================================================================== */

export async function getItem(key: string): Promise<string | null> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    return localStorage.getItem(key);
  }

  try {
    const entry = await db.storage.get(key);
    return entry?.value ?? null;
  } catch (error) {
    console.error(`[Storage] Failed to get "${key}":`, error);
    return localStorage.getItem(key);
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    localStorage.setItem(key, value);
    return;
  }

  const entry: StorageEntry = {
    key,
    value,
    updatedAt: new Date().toISOString(),
  };

  await db.storage.put(entry);
}

export async function removeItem(key: string): Promise<void> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    localStorage.removeItem(key);
    return;
  }

  await db.storage.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {}
}

export async function getKeys(prefix?: string): Promise<string[]> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (!prefix || k.startsWith(prefix))) keys.push(k);
    }
    return keys;
  }

  try {
    const allEntries = await db.storage.toArray();
    return allEntries.map((e) => e.key).filter((k) => (!prefix ? true : k.startsWith(prefix)));
  } catch (error) {
    console.error("[Storage] Failed to get keys:", error);
    return [];
  }
}

export async function clear(prefix?: string): Promise<void> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    if (!prefix) {
      localStorage.clear();
      return;
    }
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    return;
  }

  try {
    if (!prefix) {
      await db.storage.clear();
      return;
    }
    const keys = await getKeys(prefix);
    await db.storage.bulkDelete(keys);
  } catch (error) {
    console.error("[Storage] Failed to clear:", error);
  }
}

/* ============================================================================
   PROJECT-SPECIFIC STORAGE (for large project data)
   ========================================================================== */

export async function saveProject(id: string, data: unknown): Promise<void> {
  await ensureReady();

  const jsonString = JSON.stringify(data);

  if (fallbackToLocalStorage) {
    try {
      localStorage.setItem(`dahtruth_project_${id}`, jsonString);
    } catch (e) {
      console.error(`[Storage] localStorage quota exceeded for project "${id}"`);
      throw new Error(
        `Storage quota exceeded. Your manuscript is too large for this browser's storage. ` +
          `Try clearing old projects or using a different browser.`
      );
    }
    return;
  }

  const entry: ProjectEntry = {
    id,
    data: jsonString,
    updatedAt: new Date().toISOString(),
  };

  await db.projects.put(entry);
}

export async function loadProject(id: string): Promise<unknown | null> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    const raw = localStorage.getItem(`dahtruth_project_${id}`);
    return raw ? JSON.parse(raw) : null;
  }

  try {
    const entry = await db.projects.get(id);
    return entry ? JSON.parse(entry.data) : null;
  } catch (error) {
    console.error(`[Storage] Failed to load project "${id}":`, error);
    return null;
  }
}

export async function deleteProject(id: string): Promise<void> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    localStorage.removeItem(`dahtruth_project_${id}`);
    return;
  }

  try {
    await db.projects.delete(id);
  } catch (error) {
    console.error(`[Storage] Failed to delete project "${id}":`, error);
  }
}

export async function listProjectIds(): Promise<string[]> {
  await ensureReady();

  if (fallbackToLocalStorage) {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("dahtruth_project_")) {
        ids.push(k.replace("dahtruth_project_", ""));
      }
    }
    return ids;
  }

  try {
    const entries = await db.projects.toArray();
    return entries.map((e) => e.id);
  } catch (error) {
    console.error("[Storage] Failed to list projects:", error);
    return [];
  }
}

/* ============================================================================
   SYNC WRAPPER + HYDRATION
   ========================================================================== */

const operationQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;
let queueDrainPromise: Promise<void> | null = null;
let resolveQueueDrain: (() => void) | null = null;

async function processQueue() {
  if (isProcessingQueue) return;

  isProcessingQueue = true;

  // create a "drain" promise if we don't already have one
  if (!queueDrainPromise) {
    queueDrainPromise = new Promise<void>((resolve) => {
      resolveQueueDrain = resolve;
    });
  }

  while (operationQueue.length > 0) {
    const op = operationQueue.shift();
    if (!op) continue;

    try {
      await op();
    } catch (error) {
      console.error("[Storage] Queue operation failed:", error);
    }
  }

  isProcessingQueue = false;

  // resolve drain promise
  if (resolveQueueDrain) resolveQueueDrain();
  queueDrainPromise = null;
  resolveQueueDrain = null;
}

// Cache for sync reads
const readCache = new Map<string, string | null>();

let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

export async function hydrateFromIndexedDB(): Promise<void> {
  if (isHydrated) return;
  if (hydrationPromise) return hydrationPromise;

  hydrationPromise = (async () => {
    await ensureReady();

    if (fallbackToLocalStorage) {
      console.log("[Storage] Hydrating from localStorage (fallback mode)...");
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k) readCache.set(k, localStorage.getItem(k));
      }
      isHydrated = true;
      window.dispatchEvent(new Event("storage:ready"));
      return;
    }

    try {
      console.log("[Storage] Hydrating from IndexedDB...");
      const allEntries = await db.storage.toArray();
      for (const entry of allEntries) {
        readCache.set(entry.key, entry.value);
      }
      isHydrated = true;
      console.log(`[Storage] Hydrated ${allEntries.length} items from IndexedDB`);
      window.dispatchEvent(new Event("storage:ready"));
    } catch (error) {
      console.error("[Storage] Hydration failed:", error);
      // still mark hydrated to avoid infinite retries
      isHydrated = true;
    }
  })();

  return hydrationPromise;
}

export function isStorageHydrated(): boolean {
  return isHydrated;
}

export async function waitForStorage(): Promise<void> {
  if (isHydrated) return;
  await hydrateFromIndexedDB();
}

// Auto-hydrate on module load
hydrateFromIndexedDB().catch((err) => console.error("[Storage] Auto-hydration failed:", err));

/**
 * storage: localStorage-compatible API
 * IMPORTANT:
 *  - getItem returns from cache only (fast, sync)
 *  - If not hydrated yet, it kicks hydration and returns null for now
 *  - Use storage.ready() at app startup to avoid "missing projects" on first render
 */
export const storage = {
  getItem(key: string): string | null {
    if (readCache.has(key)) return readCache.get(key) ?? null;

    // Kick hydration if needed so next read is correct
    if (!isHydrated) {
      hydrateFromIndexedDB().catch(() => {});
      return null;
    }

    if (fallbackToLocalStorage) {
      const v = localStorage.getItem(key);
      readCache.set(key, v);
      return v;
    }

    // If hydrated and still not in cache, it's genuinely missing
    return null;
  },

  setItem(key: string, value: string): void {
    readCache.set(key, value);

    if (fallbackToLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`[Storage] localStorage quota exceeded for "${key}"`);
        alert("Storage is full. Please delete old projects or clear browser storage.");
      }
      return;
    }

    operationQueue.push(async () => {
      await setItem(key, value);
    });
    processQueue();
  },

  removeItem(key: string): void {
    readCache.delete(key);

    if (fallbackToLocalStorage) {
      localStorage.removeItem(key);
      return;
    }

    operationQueue.push(async () => {
      await removeItem(key);
    });
    processQueue();
  },

  clear(): void {
    readCache.clear();

    if (fallbackToLocalStorage) {
      localStorage.clear();
      return;
    }

    operationQueue.push(async () => {
      await clear();
    });
    processQueue();
  },

  // NEW: await hydration so first load doesn’t show empty projects
  async ready(): Promise<void> {
    await waitForStorage();
  },

  // NEW: await queued writes (use before navigating / reloading)
  async flush(): Promise<void> {
    // ensure any current queue starts processing
    processQueue();
    if (queueDrainPromise) await queueDrainPromise;
  },
};

export default storage;

/* ============================================================================
   MIGRATION UTILITIES (unchanged from your version, keep if you use it)
   ========================================================================== */

const MIGRATION_KEY = "dahtruth_indexeddb_migration_v1";

export async function needsMigration(): Promise<boolean> {
  await ensureReady();

  if (fallbackToLocalStorage) return false;

  const migrated = await getItem(MIGRATION_KEY);
  if (migrated === "complete") return false;

  return localStorage.length > 0;
}

export async function migrateFromLocalStorage(): Promise<{
  migrated: number;
  failed: number;
  errors: string[];
}> {
  await ensureReady();

  const result = { migrated: 0, failed: 0, errors: [] as string[] };

  if (fallbackToLocalStorage) return result;

  console.log("[Storage] Starting migration from localStorage to IndexedDB...");

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }

  for (const k of keys) {
    try {
      const v = localStorage.getItem(k);
      if (v !== null) {
        await setItem(k, v);
        result.migrated++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to migrate "${k}": ${error}`);
      console.error(`[Storage] Migration failed for "${k}":`, error);
    }
  }

  await setItem(MIGRATION_KEY, "complete");

  if (result.migrated > 0 && result.failed === 0) {
    console.log("[Storage] Clearing localStorage after successful migration...");
    localStorage.clear();
  }

  console.log(`[Storage] Migration complete: ${result.migrated} items migrated, ${result.failed} failed`);
  return result;
}

export async function runMigrationIfNeeded(): Promise<void> {
  try {
    if (await needsMigration()) {
      const result = await migrateFromLocalStorage();
      if (result.failed > 0) console.warn(`[Storage] Migration had ${result.failed} failures:`, result.errors);
    }
  } catch (error) {
    console.error("[Storage] Migration check failed:", error);
  }
}
