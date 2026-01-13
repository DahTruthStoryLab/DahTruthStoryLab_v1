// src/lib/storage/storage.ts
// Storage service that provides localStorage-like API but uses IndexedDB
// This solves the quota exceeded error for large manuscripts
// FIXED: No longer writes to localStorage (was causing quota errors)

import { db, initDB, isIndexedDBAvailable, StorageEntry, ProjectEntry } from './db';

/* ============================================================================
   INITIALIZATION STATE
   ============================================================================ */

let initialized = false;
let initPromise: Promise<void> | null = null;
let fallbackToLocalStorage = false;

/**
 * Ensure storage is ready before operations
 */
async function ensureReady(): Promise<void> {
  if (initialized) return;
  
  if (!initPromise) {
    initPromise = (async () => {
      if (!isIndexedDBAvailable()) {
        console.warn('[Storage] IndexedDB not available, falling back to localStorage');
        fallbackToLocalStorage = true;
        initialized = true;
        return;
      }
      
      try {
        await initDB();
        initialized = true;
        console.log('[Storage] IndexedDB initialized successfully');
      } catch (error) {
        console.error('[Storage] Failed to init IndexedDB, falling back to localStorage:', error);
        fallbackToLocalStorage = true;
        initialized = true;
      }
    })();
  }
  
  return initPromise;
}

/* ============================================================================
   CORE STORAGE OPERATIONS (Async - for direct use)
   ============================================================================ */

/**
 * Get an item from storage
 */
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
    // Try localStorage as fallback
    return localStorage.getItem(key);
  }
}

/**
 * Set an item in storage
 */
export async function setItem(key: string, value: string): Promise<void> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(`[Storage] localStorage quota exceeded for "${key}"`);
      throw e;
    }
    return;
  }
  
  try {
    const entry: StorageEntry = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await db.storage.put(entry);
  } catch (error) {
    console.error(`[Storage] Failed to set "${key}":`, error);
    throw error;
  }
}

/**
 * Remove an item from storage
 */
export async function removeItem(key: string): Promise<void> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    localStorage.removeItem(key);
    return;
  }
  
  try {
    await db.storage.delete(key);
    // Also remove from localStorage if it exists there
    try {
      localStorage.removeItem(key);
    } catch {}
  } catch (error) {
    console.error(`[Storage] Failed to remove "${key}":`, error);
  }
}

/**
 * Get all keys matching a prefix
 */
export async function getKeys(prefix?: string): Promise<string[]> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (!prefix || key.startsWith(prefix))) {
        keys.push(key);
      }
    }
    return keys;
  }
  
  try {
    const allEntries = await db.storage.toArray();
    return allEntries
      .map(e => e.key)
      .filter(key => !prefix || key.startsWith(prefix));
  } catch (error) {
    console.error('[Storage] Failed to get keys:', error);
    return [];
  }
}

/**
 * Clear all items (optionally matching a prefix)
 */
export async function clear(prefix?: string): Promise<void> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    if (prefix) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } else {
      localStorage.clear();
    }
    return;
  }
  
  try {
    if (prefix) {
      const keys = await getKeys(prefix);
      await db.storage.bulkDelete(keys);
    } else {
      await db.storage.clear();
    }
  } catch (error) {
    console.error('[Storage] Failed to clear:', error);
  }
}

/* ============================================================================
   PROJECT-SPECIFIC STORAGE (for large project data)
   ============================================================================ */

/**
 * Save a project (optimized for large data)
 */
export async function saveProject(id: string, data: unknown): Promise<void> {
  await ensureReady();
  
  const jsonString = JSON.stringify(data);
  
  if (fallbackToLocalStorage) {
    try {
      localStorage.setItem(`dahtruth_project_${id}`, jsonString);
    } catch (e) {
      console.error(`[Storage] localStorage quota exceeded for project "${id}"`);
      throw new Error(`Storage quota exceeded. Your manuscript is too large for this browser's storage. Try clearing old projects or using a different browser.`);
    }
    return;
  }
  
  try {
    const entry: ProjectEntry = {
      id,
      data: jsonString,
      updatedAt: new Date().toISOString(),
    };
    await db.projects.put(entry);
  } catch (error) {
    console.error(`[Storage] Failed to save project "${id}":`, error);
    throw error;
  }
}

/**
 * Load a project
 */
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

/**
 * Delete a project
 */
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

/**
 * List all project IDs
 */
export async function listProjectIds(): Promise<string[]> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    const ids: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dahtruth_project_')) {
        ids.push(key.replace('dahtruth_project_', ''));
      }
    }
    return ids;
  }
  
  try {
    const entries = await db.projects.toArray();
    return entries.map(e => e.id);
  } catch (error) {
    console.error('[Storage] Failed to list projects:', error);
    return [];
  }
}

/* ============================================================================
   SYNCHRONOUS WRAPPER (for backwards compatibility)
   
   These functions provide a synchronous-looking API that matches localStorage.
   They queue operations and return immediately, with actual storage happening async.
   
   FIXED: No longer writes to localStorage (was causing quota errors)
   ============================================================================ */

// Operation queue for sync wrapper
const operationQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;
  
  while (operationQueue.length > 0) {
    const operation = operationQueue.shift();
    if (operation) {
      try {
        await operation();
      } catch (error) {
        console.error('[Storage] Queue operation failed:', error);
      }
    }
  }
  
  isProcessingQueue = false;
}

// Cache for sync reads (populated by writes and async reads)
const readCache = new Map<string, string | null>();

// Hydration state
let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

/**
 * Hydrate the cache from IndexedDB on startup
 * This ensures data persists across page reloads
 */
export async function hydrateFromIndexedDB(): Promise<void> {
  if (isHydrated) return;
  
  if (hydrationPromise) {
    return hydrationPromise;
  }
  
  hydrationPromise = (async () => {
    await ensureReady();
    
    if (fallbackToLocalStorage) {
      // Hydrate cache from localStorage
      console.log('[Storage] Hydrating from localStorage (fallback mode)...');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          readCache.set(key, localStorage.getItem(key));
        }
      }
      isHydrated = true;
      window.dispatchEvent(new Event('storage:ready'));
      return;
    }
    
    try {
      console.log('[Storage] Hydrating from IndexedDB...');
      const allEntries = await db.storage.toArray();
      
      let loadedCount = 0;
      for (const entry of allEntries) {
        readCache.set(entry.key, entry.value);
        loadedCount++;
      }
      
      isHydrated = true;
      console.log(`[Storage] Hydrated ${loadedCount} items from IndexedDB`);
      
      // Dispatch event so components know storage is ready
      window.dispatchEvent(new Event('storage:ready'));
    } catch (error) {
      console.error('[Storage] Hydration failed:', error);
      isHydrated = true; // Mark as hydrated anyway to prevent infinite retries
    }
  })();
  
  return hydrationPromise;
}

/**
 * Check if storage has been hydrated
 */
export function isStorageHydrated(): boolean {
  return isHydrated;
}

/**
 * Wait for storage to be ready (hydrated)
 */
export async function waitForStorage(): Promise<void> {
  if (isHydrated) return;
  return hydrateFromIndexedDB();
}

// Auto-hydrate on module load
hydrateFromIndexedDB().catch(err => {
  console.error('[Storage] Auto-hydration failed:', err);
});

/**
 * Synchronous-style storage wrapper
 * Provides localStorage-compatible API but uses IndexedDB under the hood
 * FIXED: No longer writes to localStorage - only uses IndexedDB + cache
 */
export const storage = {
  /**
   * Get item (uses cache for sync access, queues async fetch for fresh data)
   */
  getItem(key: string): string | null {
    // Return from cache if available
    if (readCache.has(key)) {
      return readCache.get(key) ?? null;
    }
    
    // ONLY use localStorage as fallback if IndexedDB isn't available
    if (fallbackToLocalStorage) {
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        readCache.set(key, localValue);
      }
      return localValue;
    }
    
    // Queue async fetch to populate cache
    operationQueue.push(async () => {
      const value = await getItem(key);
      if (value !== null) {
        readCache.set(key, value);
      }
    });
    processQueue();
    
    // Return null for now - the async fetch will populate for next read
    return null;
  },
  
  /**
   * Set item (queues async write, updates cache immediately)
   * FIXED: No longer writes to localStorage
   */
  setItem(key: string, value: string): void {
    // Update cache immediately for sync reads
    readCache.set(key, value);
    
    // If using localStorage fallback, write there
    if (fallbackToLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.error(`[Storage] localStorage quota exceeded for "${key}"`);
        alert('Storage full! Please delete some old projects to free up space.');
      }
      return;
    }
    
    // Queue async write to IndexedDB (NO localStorage write!)
    operationQueue.push(async () => {
      try {
        await setItem(key, value);
      } catch (error) {
        console.error(`[Storage] Failed to save "${key}":`, error);
        
        // Show user-friendly error for quota issues
        if (error instanceof Error && error.message.includes('quota')) {
          alert('Storage full! Please delete some old projects to free up space.');
        }
      }
    });
    processQueue();
  },
  
  /**
   * Remove item
   */
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
  
  /**
   * Clear storage
   */
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
};

/* ============================================================================
   MIGRATION UTILITIES
   ============================================================================ */

const MIGRATION_KEY = 'dahtruth_indexeddb_migration_v1';

/**
 * Check if migration from localStorage to IndexedDB is needed
 */
export async function needsMigration(): Promise<boolean> {
  await ensureReady();
  
  if (fallbackToLocalStorage) {
    return false; // Can't migrate if IndexedDB isn't available
  }
  
  // Check if we've already migrated
  const migrated = await getItem(MIGRATION_KEY);
  if (migrated === 'complete') {
    return false;
  }
  
  // Check if there's localStorage data to migrate
  return localStorage.length > 0;
}

/**
 * Migrate all localStorage data to IndexedDB
 */
export async function migrateFromLocalStorage(): Promise<{
  migrated: number;
  failed: number;
  errors: string[];
}> {
  await ensureReady();
  
  const result = {
    migrated: 0,
    failed: 0,
    errors: [] as string[],
  };
  
  if (fallbackToLocalStorage) {
    return result;
  }
  
  console.log('[Storage] Starting migration from localStorage to IndexedDB...');
  
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) {
        await setItem(key, value);
        result.migrated++;
      }
    } catch (error) {
      result.failed++;
      result.errors.push(`Failed to migrate "${key}": ${error}`);
      console.error(`[Storage] Migration failed for "${key}":`, error);
    }
  }
  
  // Mark migration as complete
  await setItem(MIGRATION_KEY, 'complete');
  
  // ADDED: Clear localStorage after successful migration to free up space
  if (result.migrated > 0 && result.failed === 0) {
    console.log('[Storage] Clearing localStorage after successful migration...');
    localStorage.clear();
  }
  
  console.log(`[Storage] Migration complete: ${result.migrated} items migrated, ${result.failed} failed`);
  
  return result;
}

/**
 * Run migration if needed (call this on app startup)
 */
export async function runMigrationIfNeeded(): Promise<void> {
  try {
    if (await needsMigration()) {
      const result = await migrateFromLocalStorage();
      if (result.failed > 0) {
        console.warn(`[Storage] Migration had ${result.failed} failures:`, result.errors);
      }
    }
  } catch (error) {
    console.error('[Storage] Migration check failed:', error);
  }
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

export default storage;
