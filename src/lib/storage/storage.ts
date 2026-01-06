// src/lib/storage/storage.ts
// Storage service - uses localStorage with IndexedDB as overflow for large items
// This fixes the quota exceeded error while maintaining synchronous reads

import { db, initDB, isIndexedDBAvailable, StorageEntry } from './db';

/* ============================================================================
   OVERFLOW TRACKING
   We track which keys are "too big" for localStorage and stored in IndexedDB
   ============================================================================ */

const OVERFLOW_REGISTRY_KEY = 'dahtruth_indexeddb_overflow_keys';

function getOverflowKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(OVERFLOW_REGISTRY_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function addOverflowKey(key: string): void {
  const keys = getOverflowKeys();
  keys.add(key);
  try {
    localStorage.setItem(OVERFLOW_REGISTRY_KEY, JSON.stringify([...keys]));
  } catch {
    // If we can't even save the registry, just continue
  }
}

function removeOverflowKey(key: string): void {
  const keys = getOverflowKeys();
  keys.delete(key);
  try {
    localStorage.setItem(OVERFLOW_REGISTRY_KEY, JSON.stringify([...keys]));
  } catch {
    // Continue anyway
  }
}

/* ============================================================================
   INDEXEDDB HELPERS (for overflow items only)
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
   MAIN STORAGE API (Synchronous - drop-in localStorage replacement)
   ============================================================================ */

export const storage = {
  /**
   * Get item - checks localStorage first, then IndexedDB for overflow items
   */
  getItem(key: string): string | null {
    // First, try localStorage (synchronous, fast)
    const localValue = localStorage.getItem(key);
    if (localValue !== null) {
      return localValue;
    }
    
    // Check if this key is in IndexedDB overflow
    const overflowKeys = getOverflowKeys();
    if (overflowKeys.has(key)) {
      // This is an overflow item - we need to fetch async
      // For now, return null and let the app handle it
      // The app should call getItemAsync for large items
      console.debug(`[Storage] Key "${key}" is in IndexedDB overflow, use getItemAsync()`);
      
      // Try to load it async and cache it for next time
      getFromIndexedDB(key).then((value) => {
        if (value !== null) {
          // Try to put it back in localStorage for faster access
          try {
            localStorage.setItem(key, value);
            removeOverflowKey(key);
          } catch {
            // Still too big, keep in overflow
          }
        }
      });
    }
    
    return null;
  },

  /**
   * Set item - tries localStorage first, falls back to IndexedDB if quota exceeded
   */
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
      // Success! Remove from overflow registry if it was there
      removeOverflowKey(key);
    } catch (e) {
      // localStorage quota exceeded - use IndexedDB
      console.log(`[Storage] localStorage quota exceeded for "${key}", using IndexedDB`);
      
      // Mark this key as overflow
      addOverflowKey(key);
      
      // Store in IndexedDB (async, but we don't wait)
      setToIndexedDB(key, value).then((success) => {
        if (!success) {
          console.error(`[Storage] Failed to save "${key}" to IndexedDB`);
          alert(`Failed to save data. Your manuscript may be too large. Please try again or contact support.`);
        }
      });
    }
  },

  /**
   * Remove item from both localStorage and IndexedDB
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
    removeOverflowKey(key);
    removeFromIndexedDB(key);
  },

  /**
   * Clear all storage
   */
  clear(): void {
    localStorage.clear();
    ensureDB().then(() => {
      db.storage.clear().catch(() => {});
    });
  },
};

/* ============================================================================
   ASYNC API (for when you know you're dealing with large items)
   ============================================================================ */

/**
 * Get item async - checks both localStorage and IndexedDB
 */
export async function getItemAsync(key: string): Promise<string | null> {
  // Try localStorage first
  const localValue = localStorage.getItem(key);
  if (localValue !== null) {
    return localValue;
  }
  
  // Try IndexedDB
  return await getFromIndexedDB(key);
}

/**
 * Set item async - tries localStorage, falls back to IndexedDB
 */
export async function setItemAsync(key: string, value: string): Promise<boolean> {
  try {
    localStorage.setItem(key, value);
    removeOverflowKey(key);
    return true;
  } catch {
    // localStorage quota exceeded
    addOverflowKey(key);
    return await setToIndexedDB(key, value);
  }
}

/* ============================================================================
   MIGRATION (run once to move any stuck IndexedDB data back to localStorage)
   ============================================================================ */

export async function runMigrationIfNeeded(): Promise<void> {
  // This version doesn't need complex migration
  // Data stays in localStorage unless it overflows to IndexedDB
  console.log('[Storage] Storage system ready');
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

export default storage;
