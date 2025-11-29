// src/lib/projectsSync.ts

const PROJECTS_KEY = "userProjects";
const CURRENT_STORY_KEY = "currentStory";

// ---------- Helpers ----------

function safeParseJSON(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Basic word counter for plain text or HTML
function countWords(text: string = ""): number {
  if (!text) return 0;

  // Strip HTML tags if present
  const plain = text.replace(/<[^>]*>/g, " ");
  const cleaned = plain.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

// ---------- Projects storage ----------

export function loadProjects(): any[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(PROJECTS_KEY);
  const parsed = safeParseJSON(raw);
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed;
}

export function saveProjects(projects: any[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects || []));
    // Let dashboards / project lists know something changed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("project:change"));
    }
  } catch (err) {
    console.error("saveProjects error:", err);
  }
}

// ---------- Aggregate stats ----------

export function computeWordsFromChapters(chapters: any[] = []): number {
  return chapters.reduce((sum, ch) => {
    const text = ch?.content || ch?.text || ch?.body || "";
    return sum + countWords(text);
  }, 0);
}

/**
 * Scan chapter content for `@char: Name` tags and return:
 *   - a unique, sorted list of character names
 *   - how many distinct characters were tagged
 *
 * This is used by ComposePage to populate the Characters box and to
 * sync `characterCount` into the project + currentStory.
 */
export function computeCharactersFromChapters(
  chapters: Array<{ content?: string }> = []
): { characters: string[]; characterCount: number } {
  const found = new Set<string>();

  for (const ch of chapters) {
    if (!ch || !ch.content) continue;

    const html = String(ch.content);

    // Strip HTML tags so we only work with the visible text
    const text = html.replace(/<[^>]*>/g, " ");

    /**
     * Look for patterns like:
     *   @char: June Baxter
     *   @char: Jonas "Big Man" Smith
     *
     * We cap the length so it does NOT swallow the whole sentence.
     */
    const regex = /@char:\s*([A-Za-z][A-Za-z0-9 .'-]{0,80})/gi;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const raw = match[1] || "";

      // If the user kept typing a sentence after the name,
      // stop at the first punctuation or line break.
      let name = raw.split(/[.!?;,\n\r]/)[0].trim();
      if (!name) continue;

      // Normalize multiple spaces
      name = name.replace(/\s+/g, " ");

      found.add(name);
    }
  }

  const characters = Array.from(found).sort((a, b) =>
    a.localeCompare(b)
  );

  return {
    characters,
    characterCount: characters.length,
  };
}

/**
 * Sync the `currentStory` and any matching project in `userProjects`
 * with the latest:
 *   - wordCount
 *   - targetWords (if you pass one)
 *   - characterCount (from @char: tags)
 *
 * Called from ComposePage after saving.
 */
export function syncProjectForCurrentStory({
  wordCount,
  targetWords,
  characterCount,
}: {
  wordCount?: number;
  targetWords?: number;
  characterCount?: number;
}) {
  if (typeof localStorage === "undefined") return;

  try {
    const rawStory = localStorage.getItem(CURRENT_STORY_KEY);
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

    // Also keep the currentStory itself in sync
    const updatedStory = {
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

    localStorage.setItem(CURRENT_STORY_KEY, JSON.stringify(updatedStory));
  } catch (err) {
    console.error("syncProjectForCurrentStory error:", err);
  }
}
