// src/lib/projectsSync.js

// ---------- Constants ----------
const CURRENT_STORY_KEY = "currentStory";
const PROJECTS_KEY = "userProjects";

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

function loadProjects() {
  const raw = typeof window !== "undefined"
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

// Strip HTML tags and count words
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
    const html =
      ch.content || ch.text || ch.body || ch.html || "";
    return sum + countWordsFromHtml(html);
  }, 0);
}

// ---------- Public: Characters from @char: tags ----------

/**
 * Extract character names from HTML content.
 * Supports both raw "@char: Name" and highlighted StoryLab spans:
 *   <span class="dt-character-tag"> @char: Name </span>
 */
function extractCharactersFromHtml(html) {
  const set = new Set();
  if (!html) return set;

  const source = String(html);

  // 1) Highlight spans: <span class="dt-character-tag"> @char: Name </span>
  const spanRegex =
    /<span[^>]*class="[^"]*dt-character-tag[^"]*"[^>]*>@char:\s*([^<]+)<\/span>/gi;
  let m;
  while ((m = spanRegex.exec(source)) !== null) {
    const raw = m[1] || "";
    const cleaned = raw.replace(/\s+/g, " ").trim();
    if (cleaned) set.add(cleaned);
  }

  // 2) Raw @char: tags in text
  const rawTagRegex = /@char:\s*([A-Za-z0-9 .'-]+)/gi;
  let r;
  while ((r = rawTagRegex.exec(source)) !== null) {
    const cleaned = (r[1] || "").replace(/\s+/g, " ").trim();
    if (cleaned) set.add(cleaned);
  }

  return set;
}

/**
 * Compute unique characters & count across all chapters.
 *
 * Returns:
 *   {
 *     characters: string[],
 *     characterCount: number
 *   }
 */
export function computeCharactersFromChapters(chapters = []) {
  const all = new Set();

  if (Array.isArray(chapters)) {
    for (const ch of chapters) {
      if (!ch) continue;
      const html =
        ch.content || ch.text || ch.body || ch.html || "";
      const names = extractCharactersFromHtml(html);
      names.forEach((name) => all.add(name));
    }
  }

  const characters = Array.from(all).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return {
    characters,
    characterCount: characters.length,
  };
}

// ---------- Public: Sync current story into userProjects ----------

/**
 * Sync the currentStory and matching project in userProjects
 * with the latest wordCount / targetWords / characterCount.
 *
 * Call this from Writer / ComposePage whenever totals change.
 */
export function syncProjectForCurrentStory({
  wordCount,
  targetWords,
  characterCount,
}) {
  try {
    if (typeof window === "undefined") return;

    const rawStory = window.localStorage.getItem(CURRENT_STORY_KEY);
    if (!rawStory) return;

    const currentStory = safeParseJSON(rawStory) || {};
    const id = currentStory.id;
    const title = (currentStory.title || "").trim();
    const now = new Date().toISOString();

    let projects = loadProjects();
    let changed = false;

    projects = projects.map((p) => {
      if (!p) return p;

      const sameById = id && p.id === id;
      const sameByTitle = !id && title && (p.title || "").trim() === title;

      if (sameById || sameByTitle) {
        changed = true;
        return {
          ...p,
          wordCount:
            typeof wordCount === "number" ? wordCount : p.wordCount || 0,
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
      }
      return p;
    });

    if (changed) {
      saveProjects(projects);
    }
  } catch (err) {
    console.error("syncProjectForCurrentStory failed:", err);
  }
}

// Optional exports in case other parts of the app use them
export { loadProjects, saveProjects };
