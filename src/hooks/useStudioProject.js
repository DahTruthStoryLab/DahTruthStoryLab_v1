// src/hooks/useStudioProject.js
// Shared hook for all Studio modules — reads projectId from URL and stores it
// so all child modules automatically know which project they're working on.
//
// Usage:
//   const { projectId, projectTitle } = useStudioProject();

import { useEffect, useState } from "react";

const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";

export function useStudioProject() {
  const [projectId, setProjectId] = useState(() => {
    // Initialize immediately from URL or localStorage
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("projectId") || localStorage.getItem(CURRENT_PROJECT_KEY) || "";
    if (pid) localStorage.setItem(CURRENT_PROJECT_KEY, pid);
    return pid;
  });

  const [projectTitle, setProjectTitle] = useState(() => {
    // Try to get project title from currentStory snapshot
    try {
      const raw = localStorage.getItem("currentStory");
      if (raw) {
        const story = JSON.parse(raw);
        return story?.title || "";
      }
    } catch { }
    return "";
  });

  useEffect(() => {
    // Re-read on navigation changes
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("projectId") || localStorage.getItem(CURRENT_PROJECT_KEY) || "";
    if (pid) {
      localStorage.setItem(CURRENT_PROJECT_KEY, pid);
      setProjectId(pid);
    }

    // Get project title
    try {
      const raw = localStorage.getItem("currentStory");
      if (raw) {
        const story = JSON.parse(raw);
        setProjectTitle(story?.title || "");
      }
    } catch { }

    // Listen for project changes
    const handleProjectChange = () => {
      try {
        const raw = localStorage.getItem("currentStory");
        if (raw) {
          const story = JSON.parse(raw);
          setProjectTitle(story?.title || "");
        }
      } catch { }
    };

    window.addEventListener("project:change", handleProjectChange);
    return () => window.removeEventListener("project:change", handleProjectChange);
  }, []);

  return { projectId, projectTitle };
}
