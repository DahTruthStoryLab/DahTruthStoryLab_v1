// src/lib/storylab/projectStore.js
export const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

/** Safe localStorage getters (avoid SSR/test crashes) */
function hasStorage() {
  try { return typeof window !== "undefined" && !!window.localStorage; } catch { return false; }
}

/** Load whole project (whatever structure you already have) */
export function loadProject() {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota/JSON issues for now
  }
}

/** Ensure new sections exist without breaking older data */
export function ensureWorkshopFields(project) {
  if (!project) return project;
  project.characters ||= []; // [{id,name,strengths,weaknesses}]
  project.roadmap   ||= [];  // [{id,title,done}]
  project.priorities||= [];  // [{id,title,priority:'High'|'Medium'|'Low',done:false}]
  project.scenes    ||= [];  // clothesline: [{id,title,notes}]
  return project;
}

/** Pull ALL story text (combines chapter text fields) */
export function getFullStoryText(project) {
  if (!project) return "";
  const chapters = project.chapters || [];
  return chapters
    .map(c => c.text || c.content || c.body || "")
    .filter(Boolean)
    .join(" ");
}

/** Simple uid */
export function uid() {
  return (crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`);
}

/** Tiny migration to keep older saves from breaking */
function migrate(p) {
  if (!p) return p;
  if (!Array.isArray(p.chapters)) p.chapters = [];
  return ensureWorkshopFields(p);
}
