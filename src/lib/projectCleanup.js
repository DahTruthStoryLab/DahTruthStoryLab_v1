// src/lib/projectCleanup.js
// Comprehensive project cleanup utility - cleans ALL storage locations
// This ensures deleted projects don't reappear from orphaned storage keys

import { storage } from "./storage";

/**
 * Complete list of ALL project-scoped storage key patterns
 * This is the single source of truth for what keys a project can have
 */
const PROJECT_KEY_PATTERNS = [
  // === projectsService.ts keys ===
  "dahtruth_projects_cache",      // dahtruth_projects_cache_{id}
  
  // === useProjectStore.js keys ===
  "dahtruth-project",             // dahtruth-project-{id}
  
  // === StoryLab module keys ===
  "dahtruth-story-lab-toc-v3",    // dahtruth-story-lab-toc-v3-{id}
  "dahtruth-hfl-data-v2",         // HopesFearsLegacy
  "dahtruth-priorities-v2",       // PriorityCards
  "dahtruth-character-roadmap",   // CharacterRoadmap
  "dahtruth-clothesline-v2",      // Clothesline
  "dahtruth-dialogue-lab-v1",     // DialogueLab
  "dahtruth-narrative-arc-v2",    // NarrativeArc
  "dahtruth-plot-builder-v2",     // PlotBuilder
  "dahtruth-project-genre",       // Genre settings
  "dt_arc_chars_v2",              // Arc characters
  
  // === Publishing / Cover keys ===
  "dahtruth_cover_settings",      // Cover design settings
  "dahtruth_cover_designs",       // Cover designs array
  "dahtruth_cover_image_url",     // Cover image URL
  "dahtruth_cover_image_meta",    // Cover image metadata
  "dt_publishing_meta",           // Publishing metadata
  "publishingDraft",              // Publishing draft data
  "dahtruth_project_meta",        // Project metadata
  
  // === Chapters / Characters ===
  "dahtruth_chapters",            // Chapters array
  "chapters",                     // Legacy chapters
  "dahtruth_characters",          // Characters list
  
  // === Workshop modules ===
  "dahtruth-workshop-data",       // Workshop data
  "dahtruth-workshop-cohort",     // Workshop cohort
];

/**
 * Remove a project from ALL storage locations
 * Call this whenever a project is deleted to ensure complete cleanup
 * 
 * @param {string} projectId - The ID of the project to remove
 * @returns {object} Summary of what was cleaned
 */
export function cleanupProjectCompletely(projectId) {
  if (!projectId) {
    console.warn("[projectCleanup] No projectId provided");
    return { cleaned: 0, errors: [] };
  }

  console.log(`[projectCleanup] Starting complete cleanup for project: ${projectId}`);
  
  const cleaned = [];
  const errors = [];

  // 1. Remove all project-scoped keys (try both - and _ separators)
  PROJECT_KEY_PATTERNS.forEach((baseKey) => {
    const keysToTry = [
      `${baseKey}-${projectId}`,
      `${baseKey}_${projectId}`,
    ];
    
    keysToTry.forEach((key) => {
      try {
        const existing = storage.getItem(key);
        if (existing !== null) {
          storage.removeItem(key);
          cleaned.push(key);
        }
      } catch (err) {
        errors.push({ key, error: err.message });
      }
    });
  });

  // 2. Clean up dahtruth_projects_index (projectsService)
  try {
    const indexRaw = storage.getItem("dahtruth_projects_index");
    if (indexRaw) {
      const index = JSON.parse(indexRaw);
      if (Array.isArray(index)) {
        const filtered = index.filter((p) => p.id !== projectId);
        if (filtered.length !== index.length) {
          storage.setItem("dahtruth_projects_index", JSON.stringify(filtered));
          cleaned.push("dahtruth_projects_index (entry removed)");
        }
      }
    }
  } catch (err) {
    errors.push({ key: "dahtruth_projects_index", error: err.message });
  }

  // 3. Clean up dahtruth-projects-list (useProjectStore)
  try {
    const listRaw = storage.getItem("dahtruth-projects-list");
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list)) {
        const filtered = list.filter((p) => p.id !== projectId);
        if (filtered.length !== list.length) {
          storage.setItem("dahtruth-projects-list", JSON.stringify(filtered));
          cleaned.push("dahtruth-projects-list (entry removed)");
        }
      }
    }
  } catch (err) {
    errors.push({ key: "dahtruth-projects-list", error: err.message });
  }

  // 4. Clean up userProjects (legacy ProjectPage)
  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      if (Array.isArray(userProjects)) {
        const filtered = userProjects.filter((p) => p.id !== projectId);
        if (filtered.length !== userProjects.length) {
          storage.setItem("userProjects", JSON.stringify(filtered));
          cleaned.push("userProjects (entry removed)");
        }
      }
    }
  } catch (err) {
    errors.push({ key: "userProjects", error: err.message });
  }

  // 5. Clean up dahtruth-project-store (if it exists)
  try {
    const storeRaw = storage.getItem("dahtruth-project-store");
    if (storeRaw) {
      const store = JSON.parse(storeRaw);
      let modified = false;

      if (store.selectedProjectId === projectId) {
        store.selectedProjectId = null;
        modified = true;
      }
      if (store.currentProjectId === projectId) {
        store.currentProjectId = null;
        modified = true;
      }
      if (Array.isArray(store.projects)) {
        const originalLength = store.projects.length;
        store.projects = store.projects.filter((p) => p.id !== projectId);
        if (store.projects.length !== originalLength) {
          modified = true;
        }
      }

      if (modified) {
        storage.setItem("dahtruth-project-store", JSON.stringify(store));
        cleaned.push("dahtruth-project-store (cleaned)");
      }
    }
  } catch (err) {
    errors.push({ key: "dahtruth-project-store", error: err.message });
  }

  // 6. Clean up selected/current project IDs if they match
  const idKeysToCheck = [
    "dahtruth-selected-project-id",
    "dahtruth-current-project-id",
    "dahtruth_current_project_id",
  ];

  idKeysToCheck.forEach((key) => {
    try {
      const value = storage.getItem(key);
      if (value === projectId) {
        storage.removeItem(key);
        cleaned.push(key);
      }
    } catch (err) {
      errors.push({ key, error: err.message });
    }
  });

  // 7. Clean up currentStory if it references this project
  try {
    const currentStoryRaw = storage.getItem("currentStory");
    if (currentStoryRaw) {
      const currentStory = JSON.parse(currentStoryRaw);
      if (currentStory?.id === projectId) {
        storage.removeItem("currentStory");
        cleaned.push("currentStory");
      }
    }
  } catch (err) {
    errors.push({ key: "currentStory", error: err.message });
  }

  // 8. Clean up dahtruth_current_project if it references this project
  try {
    const currentProjectRaw = storage.getItem("dahtruth_current_project");
    if (currentProjectRaw) {
      const currentProject = JSON.parse(currentProjectRaw);
      if (currentProject?.id === projectId) {
        storage.removeItem("dahtruth_current_project");
        cleaned.push("dahtruth_current_project");
      }
    }
  } catch (err) {
    errors.push({ key: "dahtruth_current_project", error: err.message });
  }

  console.log(`[projectCleanup] Cleanup complete. Removed ${cleaned.length} items:`, cleaned);
  if (errors.length > 0) {
    console.warn(`[projectCleanup] Encountered ${errors.length} errors:`, errors);
  }

  return { cleaned: cleaned.length, items: cleaned, errors };
}

/**
 * Remove ghost projects from all storage locations
 * A "ghost" project is one that appears in some storage locations but not others
 * This helps clean up inconsistent state
 * 
 * @param {string[]} keepProjectIds - Array of project IDs to keep (all others will be removed)
 * @returns {object} Summary of cleanup
 */
export function purgeAllExcept(keepProjectIds = []) {
  const keepSet = new Set(keepProjectIds);
  const purged = [];
  const errors = [];

  console.log(`[projectCleanup] Purging all projects except: ${keepProjectIds.join(", ")}`);

  // Get all projects from all sources
  const allProjectIds = new Set();

  // From dahtruth_projects_index
  try {
    const indexRaw = storage.getItem("dahtruth_projects_index");
    if (indexRaw) {
      const index = JSON.parse(indexRaw);
      if (Array.isArray(index)) {
        index.forEach((p) => allProjectIds.add(p.id));
      }
    }
  } catch {}

  // From dahtruth-projects-list
  try {
    const listRaw = storage.getItem("dahtruth-projects-list");
    if (listRaw) {
      const list = JSON.parse(listRaw);
      if (Array.isArray(list)) {
        list.forEach((p) => allProjectIds.add(p.id));
      }
    }
  } catch {}

  // From userProjects
  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      if (Array.isArray(userProjects)) {
        userProjects.forEach((p) => allProjectIds.add(p.id));
      }
    }
  } catch {}

  // Now remove all projects not in keepSet
  allProjectIds.forEach((projectId) => {
    if (!keepSet.has(projectId)) {
      try {
        const result = cleanupProjectCompletely(projectId);
        purged.push({ projectId, ...result });
      } catch (err) {
        errors.push({ projectId, error: err.message });
      }
    }
  });

  console.log(`[projectCleanup] Purged ${purged.length} projects`);
  return { purged, errors };
}

/**
 * Get a unified list of all projects from all storage locations
 * Useful for debugging and finding duplicates/ghosts
 * 
 * @returns {object} Projects from each storage location
 */
export function auditProjectStorage() {
  const audit = {
    dahtruth_projects_index: [],
    "dahtruth-projects-list": [],
    userProjects: [],
    "dahtruth-project-store": null,
    currentProjectIds: {},
  };

  try {
    const indexRaw = storage.getItem("dahtruth_projects_index");
    if (indexRaw) audit.dahtruth_projects_index = JSON.parse(indexRaw);
  } catch {}

  try {
    const listRaw = storage.getItem("dahtruth-projects-list");
    if (listRaw) audit["dahtruth-projects-list"] = JSON.parse(listRaw);
  } catch {}

  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) audit.userProjects = JSON.parse(userProjectsRaw);
  } catch {}

  try {
    const storeRaw = storage.getItem("dahtruth-project-store");
    if (storeRaw) audit["dahtruth-project-store"] = JSON.parse(storeRaw);
  } catch {}

  // Current project IDs
  audit.currentProjectIds = {
    "dahtruth-selected-project-id": storage.getItem("dahtruth-selected-project-id"),
    "dahtruth-current-project-id": storage.getItem("dahtruth-current-project-id"),
    "dahtruth_current_project_id": storage.getItem("dahtruth_current_project_id"),
  };

  try {
    const currentStoryRaw = storage.getItem("currentStory");
    if (currentStoryRaw) {
      const currentStory = JSON.parse(currentStoryRaw);
      audit.currentProjectIds.currentStory = currentStory?.id;
    }
  } catch {}

  return audit;
}

export default {
  cleanupProjectCompletely,
  purgeAllExcept,
  auditProjectStorage,
};
