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

const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;

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

/**
 * Sync the currentStory and matching project in userProjects
 * with the latest wordCount / targetWords.
 *
 * Call this from Writer and TOC whenever words change.
 */
export function syncProjectForCurrentStory({
  wordCount,
  targetWords,
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
          wordCount: typeof wordCount === "number" ? wordCount : (p.wordCount || 0),
          targetWords:
            typeof targetWords === "number"
              ? targetWords
              : (p.targetWords || currentStory.targetWords || 0),
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
      lastModified: now,
    };

    localStorage.setItem("currentStory", JSON.stringify(updatedCurrent));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to sync project for current story:", err);
  }
}
