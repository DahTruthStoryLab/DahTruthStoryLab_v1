// src/lib/projectsSync.js

// --------- Local helpers ---------
const PROJECTS_KEY = "userProjects";

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

const countWords = (s = "") =>
  s.trim().split(/\s+/).filter(Boolean).length;

// 🔹 NEW: extract unique @char: tags from chapters
function extractCharactersFromChapters(chapters = []) {
  const names = new Set();
  const tagRegex = /@char:([^|\n\r]+)/g; // grab text after @char: up to '|' or newline

  for (const ch of chapters || []) {
    const raw =
      ch?.content ||
      ch?.text ||
      ch?.body ||
      "";

    if (!raw) continue;

    let html = String(raw);
    let match;
    while ((match = tagRegex.exec(html)) !== null) {
      let name = match[1] || "";
      // strip any HTML tags that might have snuck in
      name = name.replace(/<[^>]+>/g, "").trim();
      if (name) {
        names.add(name);
      }
    }
  }

  return Array.from(names);
}

// --------- Public helpers ---------

/**
 * Compute total words from a chapters array.
 * Each chapter can use .content or .text or .body (we try several).
 */
export function computeWordsFromChapters(chapters = []) {
  return chapters.reduce((sum, ch) => {
    const text =
      ch?.content ||
      ch?.text ||
      ch?.body ||
      "";
    return sum + countWords(text);
  }, 0);
}

// 🔹 NEW: compute character list + count from chapters
export function computeCharactersFromChapters(chapters = []) {
  const list = extractCharactersFromChapters(chapters);
  return {
    characters: list,
    characterCount: list.length,
  };
}

/**
 * Sync the currentStory and matching project in userProjects
 * with the latest wordCount / targetWords / characterCount.
 *
 * Call this from Writer and TOC whenever words change.
 */
export function syncProjectForCurrentStory({
  wordCount,
  targetWords,
  characterCount,   // 🔹 NEW
}) {
  try {
    const rawStory = localStorage.getItem("currentStory");
    if (!rawStory) return;

    const currentStory = JSON.parse(rawStory) || {};
    const id = currentStory.id;
    const title = (currentStory.title || "").trim();
    const now = new Date().toISOString();

    let projects = loadProjects();
    let changed = false;

    projects = projects.map((p) => {
      const sameById = id && p.id === id;
      const sameByTitle =
        !id && title && (p.title || "").trim() === title;

      if (sameById || sameByTitle) {
        changed = true;
        return {
          ...p,
          wordCount:
            typeof wordCount === "number"
              ? wordCount
              : (p.wordCount || 0),
          targetWords:
            typeof targetWords === "number"
              ? targetWords
              : (p.targetWords || currentStory.targetWords || 0),
          // 🔹 keep characterCount in sync too
          characterCount:
            typeof characterCount === "number"
              ? characterCount
              : (p.characterCount || 0),
          lastModified: now,
        };
      }
      return p;
    });

    if (changed) {
      saveProjects(projects);
    }

    // Also refresh currentStory snapshot so Dashboard & others see it
    const updatedCurrent = {
      ...currentStory,
      wordCount:
        typeof wordCount === "number"
          ? wordCount
          : currentStory.wordCount || 0,
      targetWords:
        typeof targetWords === "number"
          ? targetWords
          : currentStory.targetWords || 0,
      characterCount:
        typeof characterCount === "number"
          ? characterCount
          : currentStory.characterCount || 0,
      lastModified: now,
    };

    localStorage.setItem("currentStory", JSON.stringify(updatedCurrent));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to sync project for current story:", err);
  }
}
