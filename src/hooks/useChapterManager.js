// src/hooks/useChapterManager.js
// Manages chapter state, CRUD operations, and localStorage persistence
// NOW: Uses project-specific storage via useProjectStore

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getCurrentProjectId,
  getCurrentProjectData,
  saveCurrentProjectData,
  getProjectStorageKey,
} from "./useProjectStore";
import { storage } from "../lib/storage";

// -------- Helpers --------

// Load from current project's storage
const loadState = () => {
  try {
    const data = getCurrentProjectData();
    if (data) return data;

    // Fallback: try legacy key for backwards compatibility
    const legacyRaw = storage.getItem("dahtruth-story-lab-toc-v3");
    return legacyRaw ? JSON.parse(legacyRaw) : null;
  } catch {
    return null;
  }
};

// Save to current project's storage
const saveState = (state) => {
  try {
    const saved = saveCurrentProjectData(state);
    
    // Also save to legacy key for backwards compatibility with other components
    // that might still be reading from there (like StoryLab modules)
    const projectId = getCurrentProjectId();
    if (projectId) {
      storage.setItem("dahtruth-story-lab-toc-v3", JSON.stringify(state));
      
      // Save currentStory as JSON object for StoryLab sidebar
      const totalWords = (state.chapters || []).reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      storage.setItem("currentStory", JSON.stringify({
        id: projectId,
        title: state.book?.title || "Untitled",
        status: "Draft",
        updatedAt: new Date().toISOString(),
        wordCount: totalWords,
        chapterCount: (state.chapters || []).length,
      }));
    }

    // Broadcast that project changed
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("storage"));
    
    return saved;
  } catch (err) {
    console.error("Failed to save state:", err);
    return false;
  }
};

// Ensure at least one chapter exists
const ensureFirstChapter = (chapters) => {
  if (Array.isArray(chapters) && chapters.length > 0) {
    return chapters;
  }
  return [
    {
      id: `chapter-${Date.now()}`,
      title: "Chapter 1: Untitled",
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
      order: 0,
    },
  ];
};

// Count words in HTML
const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
};

export function useChapterManager() {
  // Track which project we're working with
  const [projectId, setProjectId] = useState(() => getCurrentProjectId());

  // Load initial state once
  const initial = useMemo(() => loadState(), [projectId]);

  const [book, setBook] = useState(
    initial?.book || { title: "Untitled Book" }
  );

  const [chapters, setChapters] = useState(
    ensureFirstChapter(initial?.chapters || [])
  );

  const [selectedId, setSelectedId] = useState(chapters[0]?.id || null);

  // Currently selected chapter (fallback to first)
  const selectedChapter =
    chapters.find((c) => c.id === selectedId) || chapters[0] || null;

  // -------- Listen for project switches --------
  useEffect(() => {
    const handleProjectChange = () => {
      const newProjectId = getCurrentProjectId();
      if (newProjectId !== projectId) {
        console.log(`[ChapterManager] Project switched: ${projectId} → ${newProjectId}`);
        setProjectId(newProjectId);

        // Reload data for new project
        const data = getCurrentProjectData();
        if (data) {
          setBook(data.book || { title: "Untitled Book" });
          setChapters(ensureFirstChapter(data.chapters || []));
          setSelectedId(data.chapters?.[0]?.id || null);
        } else {
          // New project with no data yet
          setBook({ title: "Untitled Book" });
          setChapters(ensureFirstChapter([]));
          setSelectedId(null);
        }
      }
    };

    window.addEventListener("project:change", handleProjectChange);
    return () => window.removeEventListener("project:change", handleProjectChange);
  }, [projectId]);

  // -------- Auto-save whenever book/chapters change --------
  useEffect(() => {
    // Don't save if no project is selected
    if (!projectId && !getCurrentProjectId()) return;

    const timer = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [book, chapters, projectId]);

  // -------- CRUD operations --------

  // Add new chapter (append, do NOT replace existing)
  const addChapter = useCallback(() => {
    const id = `chapter-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    setChapters((prev) => {
      const next = [
        ...prev,
        {
          id,
          title: `Chapter ${prev.length + 1}`,
          content: "",
          wordCount: 0,
          lastEdited: new Date().toLocaleString(),
          status: "draft",
          order: prev.length,
        },
      ];
      return next;
    });

    setSelectedId(id);
    return id;
  }, []);

  // Update an existing chapter by id
  const updateChapter = useCallback((id, updates) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== id) return ch;

        const newContent =
          updates.content !== undefined ? updates.content : ch.content;

        return {
          ...ch,
          ...updates,
          content: newContent,
          wordCount: countWords(newContent),
          lastEdited: new Date().toLocaleString(),
        };
      })
    );
  }, []);

  // Delete a single chapter
  const deleteChapter = useCallback((id) => {
    setChapters((prev) => {
      const filtered = prev.filter((c) => c.id !== id);

      // Ensure at least one chapter remains
      const result = ensureFirstChapter(filtered);

      // If we just deleted the selected one, move selection
      if (selectedId === id) {
        const newSelected = result[0]?.id || null;
        setSelectedId(newSelected);
      }

      return result;
    });
  }, [selectedId]);

  // Move chapter (for drag + drop reordering)
  const moveChapter = useCallback((fromIndex, toIndex) => {
    setChapters((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }

      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);

      // Recompute order indices
      return copy.map((ch, idx) => ({ ...ch, order: idx }));
    });
  }, []);

  // Explicit save (used when user clicks Save)
  const saveProject = useCallback((overrides = {}) => {
    const current = loadState() || {};

    const finalBook = overrides.book || book;
    // Important: if overrides.chapters is undefined, keep current chapters
    const finalChapters =
      overrides.chapters !== undefined ? overrides.chapters : chapters;

    saveState({
      book: finalBook,
      chapters: finalChapters,
      daily: current.daily || { goal: 500, counts: {} },
      settings: current.settings || { theme: "light", focusMode: false },
      tocOutline: current.tocOutline || [],
    });
  }, [book, chapters]);

  // Load chapters from parsed document (for import INTO CURRENT project)
  const loadFromParsedDocument = useCallback((parsedDoc) => {
    const newChapters = parsedDoc.chapters.map((ch, idx) => ({
      id: ch.id || `chapter-${Date.now()}-${idx}`,
      title: ch.title,
      content: ch.content,
      wordCount: ch.wordCount || countWords(ch.content),
      lastEdited: new Date().toLocaleString(),
      status: "draft",
      order: idx,
    }));

    setBook({ title: parsedDoc.title });
    setChapters(ensureFirstChapter(newChapters));
    setSelectedId(newChapters[0]?.id || null);

    // Save immediately
    saveState({
      book: { title: parsedDoc.title },
      chapters: newChapters,
      daily: { goal: 500, counts: {} },
      settings: { theme: "light", focusMode: false },
      tocOutline: parsedDoc.tableOfContents || [],
    });

    return newChapters;
  }, []);

  return {
    // Current project ID
    projectId,

    // Book & chapters
    book,
    setBook,
    chapters,
    setChapters,
    selectedId,
    setSelectedId,
    selectedChapter,

    // CRUD
    addChapter,
    updateChapter,
    deleteChapter,
    moveChapter,
    saveProject,

    // Import
    loadFromParsedDocument,
  }; 
}
