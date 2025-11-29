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

// Remove @char: markers when counting words so they don’t inflate word count
const countWords = (s = "") => {
  const cleaned = s.replace(/@char:\s*/g, " "); // drop the marker, keep the name
  return cleaned.trim().split(/\s+/).filter(Boolean).length;
};

// --------- Character helpers ---------

function extractCharactersFromHtml(html = "") {
  // Strip HTML tags to get plain text
  const text = html.replace(/<[^>]+>/g, " ");

  // Look for patterns like: @char: John Smith
  const re = /@char:\s*([^\n\r<]+)/g;
  const names = new Set();
  let match;

  while ((match = re.exec(text)) !== null) {
    const rawName = (match[1] || "").trim();
    if (!rawName) continue;

    const name = rawName.replace(/\s+/g, " "); // normalize spaces
    if (name) names.add(name);
  }

  return Array.from(names);
}

/**
 * Compute characters and count from a chapters array.
 * Returns { characters: string[], characterCount: number }
 */
export function computeCharactersFromChapters(chapters = []) {
  const all = new Set();

  chapters.forEach((ch) => {
    if (!ch || !ch.content) return;
    const html = ch.content;

    // match: @char: Daisy Knox
    const matches = [...html.matchAll(/@char:\s*([A-Za-z0-9 .'-]+)/gi)];

    matches.forEach((m) => {
      const name = m[1].trim();
      if (name) all.add(name);
    });
  });

  return {
    characters: Array.from(all),
    characterCount: all.size,
  };
}

// --------- Public helpers ---------

/**
 * Compute total words from a chapters array.
 * Each chapter can use .content or .text or .body (we try several).
 */
export function computeWordsFromChapters(chapters = []) {
  return chapters.reduce((sum, ch) => {
    const text = ch?.content || ch?.text || ch?.body || "";
    return sum + countWords(text);
  }, 0);
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
  characterCount,
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

    // Also refresh currentStory snapshot so Dashboard & others see it
    const updatedCurrent = {
      ...currentStory,
      wordCount:
        typeof wordCount === "number" ? wordCount : currentStory.wordCount || 0,
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
