// src/lib/storage/storage.ts
// Storage service - uses memory cache + localStorage + IndexedDB overflow
// Memory cache ensures synchronous reads always work

import { db, initDB, isIndexedDBAvailable, StorageEntry } from './db';

/* ============================================================================
   MEMORY CACHE - Source of truth for synchronous reads
   ============================================================================ */

const memoryCache = new Map<string, string>();
let isHydrated = false;
let hydrationPromise: Promise<void> | null = null;

/* ============================================================================
   INDEXEDDB HELPERS
   ============================================================================ */

let dbReady = false;
let dbInitPromise: Promise<void> | null = null;

async function ensureDB(): Promise<boolean> {
  if (dbReady) return true;
  if (!isIndexedDBAvailable()) return false;
  
  if (!dbInitPromise) {
    dbInitPromise = initDB().then(() => {
      dbReady = true;
    }).catch((err) => {
      console.error('[Storage] IndexedDB init failed:', err);
      dbReady = false;
    });
  }
  
  await dbInitPromise;
  return dbReady;
}

async function getFromIndexedDB(key: string): Promise<string | null> {
  if (!await ensureDB()) return null;
  try {
    const entry = await db.storage.get(key);
    return entry?.value ?? null;
  } catch (err) {
    console.error(`[Storage] IndexedDB get failed for "${key}":`, err);
    return null;
  }
}

async function setToIndexedDB(key: string, value: string): Promise<boolean> {
  if (!await ensureDB()) return false;
  try {
    const entry: StorageEntry = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await db.storage.put(entry);
    return true;
  } catch (err) {
    console.error(`[Storage] IndexedDB set failed for "${key}":`, err);
    return false;
  }
}

async function removeFromIndexedDB(key: string): Promise<void> {
  if (!await ensureDB()) return;
  try {
    await db.storage.delete(key);
  } catch (err) {
    console.error(`[Storage] IndexedDB delete failed for "${key}":`, err);
  }
}

/* ============================================================================
   HYDRATION - Load IndexedDB data into memory cache on startup
   ============================================================================ */

async function hydrateFromIndexedDB(): Promise<void> {
  if (isHydrated) return;
  
  if (!await ensureDB()) {
    isHydrated = true;
    return;
  }
  
  try {
    console.log('[Storage] Hydrating from IndexedDB...');
    const allEntries = await db.storage.toArray();
    
    for (const entry of allEntries) {
      // Only add to cache if not already there (localStorage takes precedence)
      if (!memoryCache.has(entry.key)) {
        memoryCache.set(entry.key, entry.value);
      }
    }
    
    console.log(`[Storage] Hydrated ${allEntries.length} items from IndexedDB`);
  } catch (err) {
    console.error('[Storage] Hydration failed:', err);
  }
  
  isHydrated = true;
}

/**
 * Initialize storage - call this before app renders
 * Loads all localStorage into memory cache, then hydrates from IndexedDB
 */
export async function initStorage(): Promise<void> {
  if (hydrationPromise) return hydrationPromise;
  
  hydrationPromise = (async () => {
    // First, load all localStorage into memory cache (instant)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          memoryCache.set(key, value);
        }
      }
    }
    console.log(`[Storage] Loaded ${memoryCache.size} items from localStorage`);
    
    // Then hydrate from IndexedDB (may have overflow items)
    await hydrateFromIndexedDB();
    
    console.log('[Storage] Storage ready');
  })();
  
  return hydrationPromise;
}

// Start hydration immediately on module load
initStorage();

/* ============================================================================
   MAIN STORAGE API (Synchronous - drop-in localStorage replacement)
   ============================================================================ */

export const storage = {
  /**
   * Get item - checks memory cache first, then localStorage
   */
  getItem(key: string): string | null {
    // 1. Check memory cache (has both localStorage + IndexedDB data after hydration)
    if (memoryCache.has(key)) {
      return memoryCache.get(key)!;
    }
    
    // 2. Check localStorage directly (in case hydration hasn't run yet)
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      memoryCache.set(key, localValue);
      return localValue;
    }
    
    // 3. Not found
    return null;
  },

  /**
   * Set item - writes to memory cache + tries localStorage, overflows to IndexedDB
   */
  setItem(key: string, value: string): void {
    // Always update memory cache first (ensures sync reads work)
    memoryCache.set(key, value);
    
    // Try to save to localStorage
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // localStorage quota exceeded - save to IndexedDB instead
      console.log(`[Storage] localStorage quota exceeded for "${key}", saving to IndexedDB`);
      
      // Remove from localStorage if it was partially there
      try {
        localStorage.removeItem(key);
      } catch {}
      
      // Save to IndexedDB (async, but memory cache already has it)
      setToIndexedDB(key, value).then((success) => {
        if (!success) {
          console.error(`[Storage] Failed to save "${key}" to IndexedDB`);
        }
      });
    }
  },

  /**
   * Remove item from all stores
   */
  removeItem(key: string): void {
    memoryCache.delete(key);
    localStorage.removeItem(key);
    removeFromIndexedDB(key);
  },

  /**
   * Clear all storage
   */
  clear(): void {
    memoryCache.clear();
    localStorage.clear();
    ensureDB().then(() => {
      db.storage.clear().catch(() => {});
    });
  },

  /**
   * Get number of items (for debugging)
   */
  get length(): number {
    return memoryCache.size;
  },

  /**
   * Get key at index (for debugging)
   */
  key(index: number): string | null {
    const keys = Array.from(memoryCache.keys());
    return keys[index] ?? null;
  },
};

/* ============================================================================
   ASYNC API (for explicit async usage)
   ============================================================================ */

export async function getItemAsync(key: string): Promise<string | null> {
  await initStorage(); // Ensure hydrated
  return storage.getItem(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await initStorage();
  storage.setItem(key, value);
}

/* ============================================================================
   MIGRATION HELPER
   ============================================================================ */

export async function runMigrationIfNeeded(): Promise<void> {
  await initStorage();
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

export default storage;
