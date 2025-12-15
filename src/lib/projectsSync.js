// src/lib/projectsSync.js

// ---------- Constants ----------
const CURRENT_STORY_KEY = "currentStory";
const PROJECTS_KEY = "userProjects";
const SELECTED_PROJECT_ID_KEY = "dahtruth_selected_project_id";

// ---------- Helpers ----------
function safeParseJSON(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("safeParseJSON error:", err);
    return null;
  }
}

function nowISO() {
  return new Date().toISOString();
}

function makeProjectId(title = "Untitled") {
  // ID includes a slug + a short random suffix to prevent collisions
  const slug = String(title)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48) || "untitled";

  const rand = Math.random().toString(36).slice(2, 8);
  return `${slug}-${rand}`;
}

function loadProjects() {
  const raw =
    typeof window !== "undefined"
      ? window.localStorage.getItem(PROJECTS_KEY)
      : null;

  const parsed = safeParseJSON(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function saveProjects(projects) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects || []));
      window.dispatchEvent(new Event("project:change"));
    }
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

// ---------- Selected project ----------
export function getSelectedProjectId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SELECTED_PROJECT_ID_KEY) || "";
}

export function setSelectedProjectId(projectId) {
  if (typeof window === "undefined") return;
  if (!projectId) return;
  window.localStorage.setItem(SELECTED_PROJECT_ID_KEY, projectId);
  window.dispatchEvent(new Event("project:change"));
}

// ---------- Per-project storage keys ----------
export function chaptersKeyForProject(projectId) {
  return `dahtruth_chapters_${projectId}`;
}

export function coverKeyForProject(projectId) {
  return `dahtruth_cover_${projectId}`;
}

// ---------- Project CRUD ----------
export function createProject({ title, targetWords = 0 } = {}) {
  if (typeof window === "undefined") return null;

  const projects = loadProjects();
  const cleanTitle = (title || "Untitled Project").trim();
  const id = makeProjectId(cleanTitle);

  const project = {
    id,
    title: cleanTitle,
    targetWords: Number(targetWords) || 0,
    wordCount: 0,
    characterCount: 0,
    createdAt: nowISO(),
    lastModified: nowISO(),
  };

  saveProjects([project, ...projects]);
  setSelectedProjectId(id);

  // Also set currentStory for backward compatibility with existing pages
  try {
    window.localStorage.setItem(
      CURRENT_STORY_KEY,
      JSON.stringify({ id, title: cleanTitle, targetWords: project.targetWords })
    );
  } catch {
    // ignore
  }

  return project;
}

export function upsertProjectMeta(projectMeta = {}) {
  if (typeof window === "undefined") return null;

  const projects = loadProjects();
  const incomingTitle = (projectMeta.title || "Untitled Project").trim();

  let id = projectMeta.id || getSelectedProjectId();
  if (!id) id = makeProjectId(incomingTitle);

  const existingIdx = projects.findIndex((p) => p?.id === id);

  const next = {
    id,
    title: incomingTitle,
    targetWords: Number(projectMeta.targetWords) || 0,
    wordCount: Number(projectMeta.wordCount) || 0,
    characterCount: Number(projectMeta.characterCount) || 0,
    createdAt: projectMeta.createdAt || nowISO(),
    lastModified: nowISO(),
  };

  let updated;
  if (existingIdx >= 0) {
    updated = projects.slice();
    updated[existingIdx] = { ...updated[existingIdx], ...next };
  } else {
    updated = [next, ...projects];
  }

  saveProjects(updated);
  setSelectedProjectId(id);

  // Keep currentStory aligned too
  try {
    window.localStorage.setItem(
      CURRENT_STORY_KEY,
      JSON.stringify({ id, title: next.title, targetWords: next.targetWords })
    );
  } catch {
    // ignore
  }

  return next;
}

export function getProjectById(projectId) {
  const projects = loadProjects();
  return projects.find((p) => p?.id === projectId) || null;
}

export function ensureSelectedProject() {
  if (typeof window === "undefined") return null;

  const selectedId = getSelectedProjectId();
  if (selectedId) return getProjectById(selectedId);

  // Fall back to currentStory if it exists
  const rawStory = window.localStorage.getItem(CURRENT_STORY_KEY);
  const currentStory = safeParseJSON(rawStory) || {};
  if (currentStory?.id) {
    setSelectedProjectId(currentStory.id);
    return getProjectById(currentStory.id);
  }

  // If nothing exists, create a starter project
  return createProject({ title: "Untitled Project" });
}

// ---------- Strip HTML tags and count words ----------
function countWordsFromHtml(html) {
  if (!html) return 0;
  const plain = String(html).replace(/<[^>]*>/g, " ");
  const cleaned = plain.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

// ---------- Public: Words ----------
export function computeWordsFromChapters(chapters = []) {
  if (!Array.isArray(chapters)) return 0;

  return chapters.reduce((sum, ch) => {
    if (!ch) return sum;
    const html = ch.content || ch.text || ch.body || ch.html || "";
    return sum + countWordsFromHtml(html);
  }, 0);
}

// ---------- Public: Characters from @char: tags ----------
function extractCharactersFromHtml(html) {
  const set = new Set();
  if (!html) return set;

  const source = String(html);

  const spanRegex =
    /<span[^>]*class="[^"]*dt-character-tag[^"]*"[^>]*>@char:\s*([^<]+)<\/span>/gi;
  let m;
  while ((m = spanRegex.exec(source)) !== null) {
    const raw = m[1] || "";
    const cleaned = raw.replace(/\s+/g, " ").trim();
    if (cleaned) set.add(cleaned);
  }

  const rawTagRegex = /@char:\s*([A-Za-z0-9 .'-]+)/gi;
  let r;
  while ((r = rawTagRegex.exec(source)) !== null) {
    const cleaned = (r[1] || "").replace(/\s+/g, " ").trim();
    if (cleaned) set.add(cleaned);
  }

  return set;
}

export function computeCharactersFromChapters(chapters = []) {
  const all = new Set();

  if (Array.isArray(chapters)) {
    for (const ch of chapters) {
      if (!ch) continue;
      const html = ch.content || ch.text || ch.body || ch.html || "";
      const names = extractCharactersFromHtml(html);
      names.forEach((name) => all.add(name));
    }
  }

  const characters = Array.from(all).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return { characters, characterCount: characters.length };
}

// ---------- Public: Sync current story into userProjects ----------
export function syncProjectForCurrentStory({ wordCount, targetWords, characterCount }) {
  try {
    if (typeof window === "undefined") return;

    // Prefer selected project, fall back to currentStory
    const selectedId = getSelectedProjectId();

    const rawStory = window.localStorage.getItem(CURRENT_STORY_KEY);
    const currentStory = safeParseJSON(rawStory) || {};
    const id = selectedId || currentStory.id;

    if (!id) return;

    const now = nowISO();
    let projects = loadProjects();
    let changed = false;

    projects = projects.map((p) => {
      if (!p) return p;
      if (p.id !== id) return p;

      changed = true;
      return {
        ...p,
        wordCount: typeof wordCount === "number" ? wordCount : p.wordCount || 0,
        targetWords:
          typeof targetWords === "number"
            ? targetWords
            : p.targetWords || currentStory.targetWords || 0,
        characterCount:
          typeof characterCount === "number"
            ? characterCount
            : p.characterCount || currentStory.characterCount || 0,
        lastModified: now,
      };
    });

    if (changed) saveProjects(projects);
  } catch (err) {
    console.error("syncProjectForCurrentStory failed:", err);
  }
}

// Optional exports in case other parts of the app use them
export { loadProjects, saveProjects };
