// src/lib/storylab/projectStore.js
export const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

/** Safe localStorage check (avoid SSR/test crashes) */
function hasStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

/** Load whole project (whatever structure you already have) */
export function loadProject() {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return migrate(parsed);
  } catch {
    return null;
  }
}

/** Save whole project back */
export function saveProject(next) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota/JSON issues for now
  }
}

/** Ensure new sections exist without breaking older data */
export function ensureWorkshopFields(project) {
  if (!project || typeof project !== "object") return project;

  if (!Array.isArray(project.characters)) project.characters = []; // [{id,name,strengths,weaknesses}]
  if (!Array.isArray(project.roadmap)) project.roadmap = [];       // [{id,title,done}]
  if (!Array.isArray(project.priorities)) project.priorities = []; // [{id,title,priority:'High'|'Medium'|'Low',done:false}]
  if (!Array.isArray(project.scenes)) project.scenes = [];         // clothesline: [{id,title,notes}]

  return project;
}

/** Pull ALL story text (combines chapter text fields) */
export function getFullStoryText(project) {
  if (!project) return "";
  const chapters = Array.isArray(project.chapters) ? project.chapters : [];
  return chapters
    .map((c) => c.text || c.content || c.body || "")
    .filter(Boolean)
    .join(" ");
}

/** Simple uid, with wide compatibility */
export function uid() {
  try {
    if (typeof window !== "undefined" && window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
}

/** Tiny migration to keep older saves from breaking */
function migrate(p) {
  if (!p || typeof p !== "object") return p;

  // Ensure chapters is always an array
  if (!Array.isArray(p.chapters)) p.chapters = [];

  // Add new fields safely
  ensureWorkshopFields(p);

  return p;
}
