// src/lib/backup.ts
// Export and Import functionality for DahTruth StoryLab
// Works with IndexedDB storage system
// Use this to manually transfer data between computers

import { getItem, setItem, getKeys } from './storage/storage';

const PROJECTS_LIST_KEY = "dahtruth-projects-list";
const PROJECT_DATA_PREFIX = "dahtruth-project-";

interface ProjectListEntry {
  id: string;
  title: string;
  status?: string;
  wordCount?: number;
  chapterCount?: number;
  primaryGenre?: string;
  createdAt?: string;
  updatedAt?: string;
  cover?: string;
  logline?: string;
  targetWords?: number;
  [key: string]: unknown;
}

interface BackupData {
  exportedAt: string;
  version: string;
  projectCount: number;
  projects: Array<{
    listEntry: ProjectListEntry;
    projectData: unknown;
  }>;
  authorProfile?: unknown;
  apiKeys?: {
    openai: boolean;
    anthropic: boolean;
  };
}

/**
 * Export all projects to a JSON file (triggers download)
 */
export async function exportAllProjects(): Promise<boolean> {
  try {
    // Get projects list from IndexedDB
    const listRaw = await getItem(PROJECTS_LIST_KEY);
    const projects: ProjectListEntry[] = listRaw ? JSON.parse(listRaw) : [];
    
    if (projects.length === 0) {
      alert('No projects to export.');
      return false;
    }
    
    // Gather all project data
    const projectsWithData = await Promise.all(
      projects.map(async (project) => {
        const dataKey = `${PROJECT_DATA_PREFIX}${project.id}`;
        const dataRaw = await getItem(dataKey);
        const projectData = dataRaw ? JSON.parse(dataRaw) : null;
        
        return {
          listEntry: project,
          projectData: projectData
        };
      })
    );
    
    const fullExport: BackupData = {
      exportedAt: new Date().toISOString(),
      version: '2.0', // v2 = IndexedDB compatible
      projectCount: projects.length,
      projects: projectsWithData
    };
    
    // Also include author profile
    try {
      const authorProfileRaw = await getItem('dahtruth_author_profile');
      if (authorProfileRaw) {
        fullExport.authorProfile = JSON.parse(authorProfileRaw);
      }
    } catch (e) {
      console.warn('[Backup] Could not include author profile:', e);
    }
    
    // Include API key status (not the actual keys for security)
    try {
      const apiKeysRaw = await getItem('dahtruth_api_keys');
      if (apiKeysRaw) {
        const keys = JSON.parse(apiKeysRaw);
        fullExport.apiKeys = {
          openai: !!keys.openai,
          anthropic: !!keys.anthropic
        };
      }
    } catch (e) {
      // Ignore
    }
    
    // Create and download file
    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dahtruth-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`[Backup] Exported ${projects.length} projects`);
    return true;
  } catch (err) {
    console.error('[Backup] Export failed:', err);
    alert('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    return false;
  }
}

interface ImportOptions {
  merge?: boolean;
  skipDuplicates?: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
  error?: string;
}

/**
 * Import projects from a JSON file
 * @param file - The JSON backup file
 * @param options - Import options
 */
export async function importProjects(
  file: File, 
  options: ImportOptions = { merge: true, skipDuplicates: true }
): Promise<ImportResult> {
  try {
    const text = await file.text();
    const data: BackupData = JSON.parse(text);
    
    // Validate format
    if (!data.projects || !Array.isArray(data.projects)) {
      throw new Error('Invalid backup file format');
    }
    
    console.log(`[Backup] Importing ${data.projects.length} projects...`);
    
    // Get existing projects if merging
    let existingList: ProjectListEntry[] = [];
    if (options.merge) {
      const listRaw = await getItem(PROJECTS_LIST_KEY);
      existingList = listRaw ? JSON.parse(listRaw) : [];
    }
    
    const existingIds = new Set(existingList.map(p => p.id));
    let imported = 0;
    let skipped = 0;
    
    const newList: ProjectListEntry[] = options.merge ? [...existingList] : [];
    
    for (const item of data.projects) {
      const { listEntry, projectData } = item;
      
      if (!listEntry || !listEntry.id) {
        console.warn('[Backup] Skipping invalid project entry');
        skipped++;
        continue;
      }
      
      // Check for duplicate
      if (options.skipDuplicates && existingIds.has(listEntry.id)) {
        console.log(`[Backup] Skipping duplicate: ${listEntry.title}`);
        skipped++;
        continue;
      }
      
      // If not merging or replacing duplicate, remove old entry
      if (!options.merge || !options.skipDuplicates) {
        const idx = newList.findIndex(p => p.id === listEntry.id);
        if (idx !== -1) {
          newList.splice(idx, 1);
        }
      }
      
      // Add to list
      newList.push(listEntry);
      existingIds.add(listEntry.id);
      
      // Save project data to IndexedDB
      if (projectData) {
        const dataKey = `${PROJECT_DATA_PREFIX}${listEntry.id}`;
        await setItem(dataKey, JSON.stringify(projectData));
      }
      
      imported++;
    }
    
    // Save updated list to IndexedDB
    await setItem(PROJECTS_LIST_KEY, JSON.stringify(newList));
    
    // Import author profile if present and doesn't exist locally
    if (data.authorProfile) {
      const existingProfile = await getItem('dahtruth_author_profile');
      if (!existingProfile) {
        await setItem('dahtruth_author_profile', JSON.stringify(data.authorProfile));
      }
    }
    
    // Dispatch events to update UI
    window.dispatchEvent(new Event('projects:change'));
    window.dispatchEvent(new Event('storage:ready'));
    
    const message = `Imported ${imported} project(s)${skipped > 0 ? `, skipped ${skipped}` : ''}`;
    console.log(`[Backup] ${message}`);
    alert(message);
    
    return { imported, skipped, total: data.projects.length };
  } catch (err) {
    console.error('[Backup] Import failed:', err);
    alert('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    return { imported: 0, skipped: 0, total: 0, error: err instanceof Error ? err.message : String(err) };
  }
}

interface BackupStats {
  projectCount: number;
  totalWords: number;
  totalChapters: number;
  storageType: 'indexeddb' | 'localstorage';
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<BackupStats | null> {
  try {
    const listRaw = await getItem(PROJECTS_LIST_KEY);
    const projects: ProjectListEntry[] = listRaw ? JSON.parse(listRaw) : [];
    
    let totalWords = 0;
    let totalChapters = 0;
    
    for (const project of projects) {
      totalWords += project.wordCount || 0;
      totalChapters += project.chapterCount || 0;
    }
    
    return {
      projectCount: projects.length,
      totalWords,
      totalChapters,
      storageType: 'indexeddb'
    };
  } catch (err) {
    console.error('[Backup] Stats failed:', err);
    return null;
  }
}

/**
 * Sync wrapper for ProjectPage (maintains backwards compatibility)
 * These call the async functions but don't await - for use in sync contexts
 */
export function exportAllProjectsSync(): void {
  exportAllProjects().catch(err => {
    console.error('[Backup] Export failed:', err);
  });
}

export default {
  exportAllProjects,
  importProjects,
  getBackupStats,
  exportAllProjectsSync
};
