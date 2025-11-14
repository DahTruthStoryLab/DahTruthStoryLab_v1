// src/hooks/useChapterManager.js
// Manages chapter state, CRUD operations, and localStorage persistence

import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

// -------- Helpers --------

// Load from localStorage
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Save to localStorage
const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Optional: broadcast that project changed
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save state:", err);
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
  // Load initial state once
  const initial = useMemo(loadState, []);

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

  // -------- Auto-save whenever book/chapters change --------
  useEffect(() => {
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
  }, [book, chapters]);

  // -------- CRUD operations --------

  // Add new chapter (append, do NOT replace existing)
  const addChapter = () => {
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
  };

  // Update an existing chapter by id
  const updateChapter = (id, updates) => {
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
  };

  // Delete a single chapter
  const deleteChapter = (id) => {
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
  };

  // Move chapter (for drag + drop reordering)
  const moveChapter = (fromIndex, toIndex) => {
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
  };

  // Explicit save (used when user clicks Save)
  const saveProject = (overrides = {}) => {
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
  };

  return {
    book,
    setBook,
    chapters,
    setChapters,
    selectedId,
    setSelectedId,
    selectedChapter,
    addChapter,
    updateChapter,
    deleteChapter,
    moveChapter,
    saveProject,
  };
}
