// src/hooks/useProjectsList.js
import { useEffect, useState } from "react";

const USER_PROJECTS_KEY = "userProjects";

function normalizeProjects(rawArr) {
  if (!Array.isArray(rawArr)) return [];
  return rawArr.map((p, idx) => ({
    id: p.id || `${p.title || "project"}-${idx}`,
    title: p.title || "Untitled Project",
    status: p.status || "Draft",
    source: p.source || "Project",
    updatedAt: p.updatedAt || null,
  }));
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(USER_PROJECTS_KEY);
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

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
    };
  }, []);

  return projects;
}
