// src/lib/storage/index.ts
// Export all storage utilities

export { db, initDB, isIndexedDBAvailable, getStorageEstimate } from './db';
export type { StorageEntry, ProjectEntry, BlobEntry } from './db';

export {
  // Async operations (preferred)
  getItem,
  setItem,
  removeItem,
  getKeys,
  clear,
  
  // Project operations
  saveProject,
  loadProject,
  deleteProject,
  listProjectIds,
  
  // Sync wrapper (for backwards compatibility)
  storage,
  
  // Migration
  needsMigration,
  migrateFromLocalStorage,
  runMigrationIfNeeded,
} from './storage';

export { default as storage } from './storage';
