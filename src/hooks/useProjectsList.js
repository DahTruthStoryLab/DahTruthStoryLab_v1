// ============================================================================
// FILE: src/hooks/useProjectsList.js
// ============================================================================
// Hook to get the list of user projects
// UPDATED: Uses IndexedDB-backed storage wrapper for persistence
// ============================================================================

import { useEffect, useState } from "react";
import { storage } from "../lib/storage";

const USER_PROJECTS_KEY = "userProjects";

function normalizeProjects(rawArr) {
  if (!Array.isArray(rawArr)) return [];
  return rawArr.map((p, idx) => ({
    id: p.id || `${p.title || "project"}-${idx}`,
    title: p.title || "Untitled Project",
    status: p.status || "Draft",
    source: p.source || "Project",
    updatedAt: p.updatedAt || null,
    wordCount: p.wordCount || 0,
    chapterCount: p.chapterCount || 0,
  }));
}

function loadProjects() {
  try {
    const raw = storage.getItem(USER_PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return normalizeProjects(arr);
  } catch {
    return [];
  }
}

export function useProjectsList() {
  const [projects, setProjects] = useState(() => loadProjects());

  useEffect(() => {
    const sync = () => setProjects(loadProjects());
    window.addEventListener("storage", sync);
    window.addEventListener("project:change", sync);
    window.addEventListener("projects:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
      window.removeEventListener("projects:change", sync);
    };
  }, []);

  return projects;
}
