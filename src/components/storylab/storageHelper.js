// src/components/storylab/storageHelper.js
// Shared storage utilities for all StoryLab modules
// Uses the app's storage service (memory cache + localStorage + IndexedDB)

import { storage } from "../../lib/storage/storage";

/* ============================================
   PROJECT ID HELPERS
   ============================================ */

/**
 * Get the currently selected project ID
 */
export function getSelectedProjectId() {
  try {
    const stored = storage.getItem("dahtruth-selected-project-id");
    if (stored) return stored;
    
    const projectData = storage.getItem("dahtruth-project-store");
    if (projectData) {
      const parsed = JSON.parse(projectData);
      return parsed.selectedProjectId || parsed.currentProjectId || "default";
    }
    return "default";
  } catch {
    return "default";
  }
}

/**
 * Get a project-scoped storage key
 */
export function getProjectKey(baseKey) {
  const projectId = getSelectedProjectId();
  return projectId === "default" ? baseKey : `${baseKey}-${projectId}`;
}

/* ============================================
   GENERIC LOAD/SAVE HELPERS
   ============================================ */

/**
 * Load JSON data from storage
 */
export function loadJSON(key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save JSON data to storage
 */
export function saveJSON(key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (e) {
    console.error(`[Storage] Save failed for "${key}":`, e);
    return false;
  }
}

/**
 * Load a string value from storage
 */
export function loadString(key, fallback = "") {
  try {
    return storage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save a string value to storage
 */
export function saveString(key, value) {
  try {
    storage.setItem(key, value);
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (e) {
    console.error(`[Storage] Save failed for "${key}":`, e);
    return false;
  }
}

/**
 * Remove an item from storage
 */
export function removeItem(key) {
  try {
    storage.removeItem(key);
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (e) {
    console.error(`[Storage] Remove failed for "${key}":`, e);
    return false;
  }
}

/* ============================================
   STORYLAB-SPECIFIC STORAGE KEYS
   ============================================ */

export const STORAGE_KEYS = {
  // Core StoryLab data
  STORYLAB_TOC: "dahtruth-story-lab-toc-v3",
  
  // Workshop modules
  PRIORITIES: "dahtruth-priorities-v2",
  HOPES_FEARS: "dahtruth-hopes-fears-v2",
  CLOTHESLINE: "dahtruth-clothesline-v2",
  CHARACTER_ROADMAP: "dahtruth-character-roadmap-v2",
  ARC_BEATS: "dt_arc_beats_v2",
  ARC_CHARS: "dt_arc_chars_v2",
  PLOT_BUILDER: "dahtruth-plot-builder-v1",
  DIALOGUE_LAB: "dahtruth-dialogue-lab-v1",
  
  // Settings
  PROJECT_GENRE: "dahtruth-project-genre",
};

/* ============================================
   STORYLAB DATA LOADERS
   ============================================ */

/**
 * Load StoryLab TOC data (chapters, book info)
 */
export function loadStoryLabData() {
  const key = getProjectKey(STORAGE_KEYS.STORYLAB_TOC);
  return loadJSON(key, null);
}

/**
 * Load characters from Narrative Arc
 */
export function loadCharacters() {
  const key = getProjectKey(STORAGE_KEYS.ARC_CHARS);
  return loadJSON(key, []);
}

/**
 * Save characters to Narrative Arc
 */
export function saveCharacters(chars) {
  const key = getProjectKey(STORAGE_KEYS.ARC_CHARS);
  return saveJSON(key, chars);
}

/**
 * Load story beats from Narrative Arc
 */
export function loadBeats() {
  const key = getProjectKey(STORAGE_KEYS.ARC_BEATS);
  return loadJSON(key, []);
}

/**
 * Save story beats to Narrative Arc
 */
export function saveBeats(beats) {
  const key = getProjectKey(STORAGE_KEYS.ARC_BEATS);
  return saveJSON(key, beats);
}

/**
 * Load project genre setting
 */
export function loadGenre() {
  const key = getProjectKey(STORAGE_KEYS.PROJECT_GENRE);
  return loadString(key, "fiction");
}

/**
 * Save project genre setting
 */
export function saveGenre(genre) {
  const key = getProjectKey(STORAGE_KEYS.PROJECT_GENRE);
  return saveString(key, genre);
}

/**
 * Load priorities
 */
export function loadPriorities() {
  const key = getProjectKey(STORAGE_KEYS.PRIORITIES);
  return loadJSON(key, []);
}

/**
 * Save priorities
 */
export function savePriorities(priorities) {
  const key = getProjectKey(STORAGE_KEYS.PRIORITIES);
  return saveJSON(key, priorities);
}

/**
 * Load hopes/fears/legacy data
 */
export function loadHopesFears() {
  const key = getProjectKey(STORAGE_KEYS.HOPES_FEARS);
  return loadJSON(key, { entities: {}, roles: {} });
}

/**
 * Save hopes/fears/legacy data
 */
export function saveHopesFears(data) {
  const key = getProjectKey(STORAGE_KEYS.HOPES_FEARS);
  return saveJSON(key, data);
}

/**
 * Load clothesline data
 */
export function loadClothesline() {
  const key = getProjectKey(STORAGE_KEYS.CLOTHESLINE);
  return loadJSON(key, { characters: [] });
}

/**
 * Save clothesline data
 */
export function saveClothesline(data) {
  const key = getProjectKey(STORAGE_KEYS.CLOTHESLINE);
  return saveJSON(key, data);
}

/**
 * Load plot builder data
 */
export function loadPlotData() {
  const key = getProjectKey(STORAGE_KEYS.PLOT_BUILDER);
  return loadJSON(key, { blocks: [] });
}

/**
 * Save plot builder data
 */
export function savePlotData(data) {
  const key = getProjectKey(STORAGE_KEYS.PLOT_BUILDER);
  return saveJSON(key, data);
}

/**
 * Load dialogue lab sessions
 */
export function loadDialogueSessions() {
  const key = getProjectKey(STORAGE_KEYS.DIALOGUE_LAB);
  return loadJSON(key, []);
}

/**
 * Save dialogue lab sessions
 */
export function saveDialogueSessions(sessions) {
  const key = getProjectKey(STORAGE_KEYS.DIALOGUE_LAB);
  return saveJSON(key, sessions);
}

/* ============================================
   CHARACTER EXTRACTION HELPERS
   ============================================ */

/**
 * Extract entities from chapters based on tag pattern
 * @param {Array} chapters - Array of chapter objects
 * @param {RegExp} pattern - Tag pattern to match (e.g., /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi)
 */
export function extractEntitiesFromChapters(chapters = [], pattern) {
  const entitySet = new Set();
  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    let match;
    // Create fresh regex instance to avoid stateful issues
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) entitySet.add(name);
    }
  });
  return Array.from(entitySet).sort();
}

/**
 * Extract characters from chapters using @char: tags
 */
export function extractCharactersFromChapters(chapters = []) {
  const charPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi;
  return extractEntitiesFromChapters(chapters, charPattern);
}

/* ============================================
   UID GENERATOR
   ============================================ */

export function uid() {
  try {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {}
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
}

/* ============================================
   EXPORTS
   ============================================ */

export default {
  getSelectedProjectId,
  getProjectKey,
  loadJSON,
  saveJSON,
  loadString,
  saveString,
  removeItem,
  STORAGE_KEYS,
  loadStoryLabData,
  loadCharacters,
  saveCharacters,
  loadBeats,
  saveBeats,
  loadGenre,
  saveGenre,
  loadPriorities,
  savePriorities,
  loadHopesFears,
  saveHopesFears,
  loadClothesline,
  saveClothesline,
  loadPlotData,
  savePlotData,
  loadDialogueSessions,
  saveDialogueSessions,
  extractEntitiesFromChapters,
  extractCharactersFromChapters,
  uid,
};
