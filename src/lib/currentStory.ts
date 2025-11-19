const CHAPTERS_KEY = "dahtruth_chapters";
const PUBLISHING_KEY = "dahtruth_publishing_manuscript";
const CURRENT_STORY_KEY = "currentStory";

export function loadChapters() {
  try {
    const raw = localStorage.getItem(CHAPTERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildManuscriptFromChapters() {
  const chapters = loadChapters();
  const sorted = [...chapters].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const text = sorted
    .map((ch, idx) => {
      const title = (ch.title || `Chapter ${idx + 1}`).trim();
      const content = ch.content || "";
      return `# ${title}\n\n${content.trim()}\n`;
    })
    .join("\n\n");

  localStorage.setItem(PUBLISHING_KEY, text);
  return text;
}

export function loadPublishingManuscript() {
  return localStorage.getItem(PUBLISHING_KEY) || "";
}

export function loadCurrentStoryMeta() {
  try {
    const raw = localStorage.getItem(CURRENT_STORY_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
}
