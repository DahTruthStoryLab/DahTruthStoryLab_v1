// src/lib/storylab/projectStore.js

// Primary key going forward (new)
const KEY_NEW = "dt_project_v1";
// Legacy key (what you already had)
export const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

/** Safe localStorage guard (avoid SSR/test crashes) */
function hasStorage() {
  try { return typeof window !== "undefined" && !!window.localStorage; }
  catch { return false; }
}

/** Tiny uid */
export function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Load project (prefers new key, migrates from old if present) */
export function loadProject() {
  if (!hasStorage()) return ensureWorkshopFields({});
  // 1) Try new key
  try {
    const raw = localStorage.getItem(KEY_NEW);
    if (raw) return ensureWorkshopFields(JSON.parse(raw));
  } catch {}

  // 2) Fallback to legacy key and migrate
  try {
    const rawOld = localStorage.getItem(STORAGE_KEY);
    if (rawOld) {
      const migrated = migrateFromOld(JSON.parse(rawOld));
      // Save immediately under new key so future loads are fast
      saveProject(migrated);
      return migrated;
    }
  } catch {}

  // 3) Nothing found — return a fresh scaffold
  return ensureWorkshopFields({});
}

/** Save whole project to the new key */
export function saveProject(next) {
  if (!hasStorage()) return;
  try {
    localStorage.setItem(KEY_NEW, JSON.stringify(next));
  } catch {
    // ignore quota/JSON issues for now
  }
}

/** Ensure all workshop sections exist + sensible defaults */
export function ensureWorkshopFields(project) {
  const p = project && typeof project === "object" ? project : {};

  p.title    = p.title || "My Story";
  p.chapters = Array.isArray(p.chapters) ? p.chapt
