// src/lib/projectSystem.ts
// Unified export for the multi-project system

// Types
export type {
  AuthorProfile,
  AuthorPreferences,
  Project,
  ProjectStatus,
  ComposeData,
  Chapter,
  ChapterStatus,
  Character,
  CharacterRelationship,
  EditorSettings,
  PublishingData,
  PublishingChapter,
  Matter,
  PublishingMeta,
  FormatSettings,
  PlatformSettings,
  StoryMaterials,
  CoverData,
  SavedCoverDesign,
  ProjectIndexEntry,
  ProjectIndex,
  SyncStatus,
  SyncState,
} from "../types/project";

// Defaults and factories
export {
  DEFAULT_MATTER,
  DEFAULT_FORMAT_SETTINGS,
  DEFAULT_PLATFORM_SETTINGS,
  DEFAULT_COVER_DATA,
  createEmptyProject,
  createProjectIndexEntry,
} from "../types/project";

// Author service
export {
  getLocalAuthorProfile,
  setLocalAuthorProfile,
  getLocalAuthorId,
  clearLocalAuthorProfile,
  createAuthorProfile,
  updateAuthorProfile,
  initializeAuthor,
  completeAuthorSetup,
  isAuthorSetupComplete,
  saveAuthorProfileToCloud,
  loadAuthorProfileFromCloud,
  checkEmailExists,
  authorService,
} from "./authorService";

// Projects service
export {
  getLocalProjectIndex,
  setLocalProjectIndex,
  getLocalProject,
  setLocalProject,
  removeLocalProject,
  getCurrentProject,
  setCurrentProject,
  getCurrentProjectId,
  saveProjectToCloud,
  loadProjectFromCloud,
  deleteProjectFromCloud,
  saveIndexToCloud,
  loadIndexFromCloud,
  createProject,
  saveProject,
  loadProject,
  deleteProject,
  listProjects,
  duplicateProject,
  queueAutoSave,
  cancelAutoSave,
  flushAutoSave,
  getSyncStatus,
  setSyncStatus,
  onSyncStatusChange,
  projectsService,
} from "./projectsService";

/* ============================================================================
   MIGRATION UTILITIES
   
   These help migrate from the old localStorage-only system to the new
   project-based system.
   ============================================================================ */

import type { Project, Chapter } from "../types/project";
import { createEmptyProject } from "../types/project";
import { getLocalAuthorId } from "./authorService";
import { setLocalProject, setCurrentProject, setLocalProjectIndex } from "./projectsService";

/**
 * Migrate legacy localStorage data to a new project
 */
export function migrateLegacyData(): Project | null {
  if (typeof window === "undefined") return null;
  
  try {
    // Check for legacy chapters
    const legacyChaptersRaw = localStorage.getItem("dahtruth_chapters");
    const legacyMetaRaw = localStorage.getItem("dahtruth_project_meta");
    const legacyCurrentStoryRaw = localStorage.getItem("dahtruth_current_story");
    
    // If no legacy data, nothing to migrate
    if (!legacyChaptersRaw && !legacyMetaRaw) {
      console.log("[migration] No legacy data found");
      return null;
    }
    
    const authorId = getLocalAuthorId() || "migrated_author";
    
    // Parse legacy data
    let legacyChapters: any[] = [];
    let legacyMeta: any = {};
    let legacyCurrentStory: any = {};
    
    try {
      if (legacyChaptersRaw) legacyChapters = JSON.parse(legacyChaptersRaw);
    } catch {}
    
    try {
      if (legacyMetaRaw) legacyMeta = JSON.parse(legacyMetaRaw);
    } catch {}
    
    try {
      if (legacyCurrentStoryRaw) legacyCurrentStory = JSON.parse(legacyCurrentStoryRaw);
    } catch {}
    
    // Create new project from legacy data
    const title = legacyCurrentStory?.title || legacyMeta?.title || "Migrated Project";
    const project = createEmptyProject(authorId, title);
    
    // Populate metadata
    if (legacyMeta) {
      project.author = legacyMeta.author || "";
      project.publishing.meta = {
        title: legacyMeta.title || title,
        author: legacyMeta.author || "",
        year: legacyMeta.year || new Date().getFullYear().toString(),
        authorLast: legacyMeta.authorLast || "",
      };
    }
    
    // Populate chapters
    if (Array.isArray(legacyChapters) && legacyChapters.length > 0) {
      project.compose.chapters = legacyChapters.map((ch: any, idx: number) => ({
        id: ch.id || `migrated_ch_${idx}`,
        title: ch.title || `Chapter ${idx + 1}`,
        order: idx,
        text: ch.text || "",
        textHTML: ch.textHTML || ch.content || "",
        included: ch.included !== false,
        status: "draft" as const,
        createdAt: ch.createdAt || project.createdAt,
        updatedAt: ch.updatedAt || project.updatedAt,
      }));
    }
    
    // Try to get publishing matter
    try {
      const legacyMatterRaw = localStorage.getItem("dt_publishing_matter");
      if (legacyMatterRaw) {
        const legacyMatter = JSON.parse(legacyMatterRaw);
        project.publishing.matter = {
          ...project.publishing.matter,
          ...legacyMatter,
        };
      }
    } catch {}
    
    // Try to get cover data
    try {
      const legacyCoverUrl = localStorage.getItem("dahtruth_cover_image_url");
      const legacyCoverMetaRaw = localStorage.getItem("dahtruth_cover_image_meta");
      
      if (legacyCoverUrl) {
        project.cover.backgroundType = "image";
        project.cover.backgroundImageUrl = legacyCoverUrl;
        
        if (legacyCoverMetaRaw) {
          const meta = JSON.parse(legacyCoverMetaRaw);
          project.cover.backgroundImageFit = meta.fit || "cover";
          project.cover.backgroundImageFilter = meta.filter || "soft-dark";
        }
      }
    } catch {}
    
    // Save the migrated project
    setLocalProject(project);
    setCurrentProject(project);
    
    // Add to index
    const indexEntry = {
      id: project.id,
      title: project.title,
      author: project.author,
      status: project.status,
      wordCount: project.compose.chapters.reduce(
        (sum, ch) => sum + (ch.text?.split(/\s+/).filter(Boolean).length || 0),
        0
      ),
      chapterCount: project.compose.chapters.length,
      updatedAt: project.updatedAt,
      createdAt: project.createdAt,
    };
    setLocalProjectIndex([indexEntry]);
    
    console.log("[migration] Successfully migrated legacy data to project:", project.id);
    
    // Optionally clear legacy keys (comment out to keep backup)
    // localStorage.removeItem("dahtruth_chapters");
    // localStorage.removeItem("dahtruth_project_meta");
    // localStorage.removeItem("dahtruth_current_story");
    
    return project;
  } catch (err) {
    console.error("[migration] Failed to migrate legacy data:", err);
    return null;
  }
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  if (typeof window === "undefined") return false;
  
  // If we already have projects in the new system, no migration needed
  const indexRaw = localStorage.getItem("dahtruth_projects_index");
  if (indexRaw) {
    try {
      const index = JSON.parse(indexRaw);
      if (Array.isArray(index) && index.length > 0) {
        return false;
      }
    } catch {}
  }
  
  // Check for legacy data
  const hasLegacyChapters = !!localStorage.getItem("dahtruth_chapters");
  const hasLegacyMeta = !!localStorage.getItem("dahtruth_project_meta");
  
  return hasLegacyChapters || hasLegacyMeta;
}
