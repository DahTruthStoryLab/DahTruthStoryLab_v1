// src/lib/projectsSync.js

// --------- Local helpers ---------
const PROJECTS_KEY = "userProjects";
const CURRENT_STORY_KEY = "currentStory";

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

function stripHtml(html = "") {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const countPlainWords = (s = "") =>
  s
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

// --------- Character helpers ---------

/**
 * Parse explicit tags like:
 *   @char:John Smith
 *   @char:John Smith|role:major
 *
 * Returns [{ name, role }]
 */
function extractTaggedCharactersFromChapters(chapters = []) {
  const tagRegex =
    /@char:([^\|\n\r]+?)(?:\|role:(major|supporting|minor|small))?/gi;

  const byName = new Map();

  for (const ch of chapters) {
    const html = ch?.content || ch?.text || ch?.body || "";
    const plain = stripHtml(html);
    let match;
    while ((match = tagRegex.exec(plain)) !== null) {
      const rawName = match[1].trim();
      if (!rawName) continue;

      const roleRaw = match[2]?.trim().toLowerCase();
      const role =
        roleRaw === "major" ||
        roleRaw === "supporting" ||
        roleRaw === "minor" ||
        roleRaw === "small"
          ? roleRaw
          : undefined;

      const key = rawName.toLowerCase();

      if (!byName.has(key)) {
        byName.set(key, {
          name: rawName,
          role: role || "supporting", // default for now
        });
      } else if (role && !byName.get(key).role) {
        byName.get(key).role = role;
      }
    }
  }

  return Array.from(byName.values());
}

/**
 * Very simple fallback if there are no @char tags yet.
 * You can delete this later once you're fully on @char: tags.
 */
function extractHeuristicCharacters(chapters = []) {
  const allText = chapters
    .map((ch) => stripHtml(ch?.content || ch?.text || ch?.body || ""))
    .join("\n\n");

  const words = allText
    .replace(/[\r\n]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const counts = new Map();
  const stopWords = new Set([
    "The",
    "And",
    "But",
    "For",
    "From",
    "With",
    "This",
    "That",
    "There",
    "Here",
    "They",
    "Them",
    "Then",
    "When",
    "What",
    "Where",
    "Which",
    "Who",
    "Whose",
    "Why",
    "How",
    "You",
    "Your",
    "Our",
    "Their",
    "His",
    "Her",
    "Its",
    "It",
    "He",
    "She",
    "We",
    "I",
  ]);

  for (let i = 0; i < words.length; i++) {
    const raw = words[i].replace(/[^A-Za-z']/g, "");
    if (!raw) continue;

    if (!/^[A-Z][a-z']+$/.test(raw)) continue;
    if (stopWords.has(raw)) continue;

    counts.set(raw, (counts.get(raw) || 0) + 1);
  }

  // Toss anything that only appears once or twice
  const candidates = Array.from(counts.entries())
    .filter(([_, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => ({ name, role: "supporting" }));

  return candidates;
}

// --------- Public helpers ---------

/**
 * Compute total words from a chapters array.
 * Each chapter can use .content or .text or .body (we try several),
 * AND we strip HTML to avoid counting tags.
 */
export function computeWordsFromChapters(chapters = []) {
  return chapters.reduce((sum, ch) => {
    const html = ch?.content || ch?.text || ch?.body || "";
    const plain = stripHtml(html);
    return sum + countPlainWords(plain);
  }, 0);
}

/**
 * Sync the currentStory and matching project in userProjects
 * with the latest wordCount / targetWords, and (optionally)
 * characters if chapters are provided.
 *
 * You can call this in two ways:
 *   syncProjectForCurrentStory({ wordCount, targetWords });
 *   syncProjectForCurrentStory({ chapters, targetWords, bookTitle });
 */
export function syncProjectForCurrentStory({
  wordCount,
  targetWords,
  chapters,
  bookTitle,
} = {}) {
  try {
    const rawStory = localStorage.getItem(CURRENT_STORY_KEY);
    if (!rawStory) return;

    const currentStory = JSON.parse(rawStory) || {};
    const id = currentStory.id;
    const existingTitle = (currentStory.title || "").trim();
    const safeTitle =
      (bookTitle && bookTitle.trim()) || existingTitle || "Untitled Project";

    const now = new Date().toISOString();

    // If chapters are passed, we compute words from text;
    // otherwise we trust the explicit wordCount (like you had before).
    const computedWordCount =
      typeof wordCount === "number"
        ? wordCount
        : Array.isArray(chapters) && chapters.length
        ? computeWordsFromChapters(chapters)
        : currentStory.wordCount || 0;

    // --- Character extraction (only if chapters are provided) ---
    let characters = undefined;
    let characterCount = undefined;

    if (Array.isArray(chapters) && chapters.length) {
      let tagged = extractTaggedCharactersFromChapters(chapters);
      if (!tagged.length) {
        tagged = extractHeuristicCharacters(chapters);
      }
      characters = tagged;
      characterCount = tagged.length;
    }

    let projects = loadProjects();
    let changed = false;

    projects = projects.map((p) => {
      const sameById = id && p.id === id;
      const sameByTitle = !id && safeTitle && (p.title || "").trim() === safeTitle;

      if (sameById || sameByTitle) {
        changed = true;

        const patch = {
          wordCount: computedWordCount,
          targetWords:
            typeof targetWords === "number"
              ? targetWords
              : p.targetWords || currentStory.targetWords || 0,
          lastModified: now,
        };

        if (characters !== undefined) {
          patch.characters = characters;
          patch.characterCount = characterCount;
        }

        // make sure title is up to date
        patch.title = safeTitle;

        return {
          ...p,
          ...patch,
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
      title: safeTitle,
      wordCount: computedWordCount,
      targetWords:
        typeof targetWords === "number"
          ? targetWords
          : currentStory.targetWords || 0,
      lastModified: now,
    };

    if (characters !== undefined) {
      updatedCurrent.characters = characters;
      updatedCurrent.characterCount = characterCount;
    }

    localStorage.setItem(CURRENT_STORY_KEY, JSON.stringify(updatedCurrent));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to sync project for current story:", err);
  }
}
