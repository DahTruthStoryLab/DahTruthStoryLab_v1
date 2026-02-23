// src/lib/chapterTypes.js
// Helper to identify chapter types (poem, prose, etc.)

export function isPoem(chapter) {
  if (!chapter) return false;
  return chapter.type === "poem";
}

export function isProse(chapter) {
  if (!chapter) return false;
  return !chapter.type || chapter.type === "chapter" || chapter.type === "prose";
}
