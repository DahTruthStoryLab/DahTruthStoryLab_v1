// src/lib/storage/db.ts
// IndexedDB database setup using Dexie
// This replaces localStorage to handle large manuscripts without quota issues

import Dexie, { Table } from 'dexie';

/* ============================================================================
   TYPE DEFINITIONS
   ============================================================================ */

export interface StorageEntry {
  key: string;
  value: string;
  updatedAt: string;
}

export interface ProjectEntry {
  id: string;
  data: string; // JSON stringified project
  updatedAt: string;
}

export interface BlobEntry {
  key: string;
  blob: Blob;
  mimeType: string;
  updatedAt: string;
}

/* ============================================================================
   DATABASE CLASS
   ============================================================================ */

export class DahTruthDB extends Dexie {
  // Generic key-value storage (replaces most localStorage usage)
  storage!: Table<StorageEntry, string>;
  
  // Project-specific storage for large project data
  projects!: Table<ProjectEntry, string>;
  
  // Blob storage for images, covers, etc.
  blobs!: Table<BlobEntry, string>;

  constructor() {
    super('DahTruthStoryLab');
    
    // Schema version 1
    this.version(1).stores({
      // Primary key is 'key', no additional indexes needed
      storage: 'key',
      projects: 'id',
      blobs: 'key',
    });
  }
}

/* ============================================================================
   DATABASE INSTANCE
   ============================================================================ */

export const db = new DahTruthDB();

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

let isInitialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize the database (called automatically on first use)
 */
export async function initDB(): Promise<void> {
  if (isInitialized) return;
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      await db.open();
      isInitialized = true;
      console.log('[DahTruthDB] Database initialized successfully');
    } catch (error) {
      console.error('[DahTruthDB] Failed to initialize database:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Get database storage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  usagePercent: number;
} | null> {
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      return {
        usage,
        quota,
        usagePercent: quota > 0 ? (usage / quota) * 100 : 0,
      };
    }
  } catch (error) {
    console.warn('[DahTruthDB] Could not get storage estimate:', error);
  }
  return null;
}

export default db;
