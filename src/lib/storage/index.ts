// src/lib/storage/index.ts
// Export all storage utilities

export { db, initDB, isIndexedDBAvailable, getStorageEstimate } from './db';
export type { StorageEntry, ProjectEntry, BlobEntry } from './db';

export {
  // Sync wrapper (main API)
  storage,
  
  // Initialization
  initStorage,
  
  // Async operations
  getItemAsync,
  setItemAsync,
  
  // Migration
  runMigrationIfNeeded,
} from './storage';
