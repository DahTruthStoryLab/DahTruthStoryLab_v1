// src/hooks/useChapterManager.js
// Manages chapter state, CRUD operations, and localStorage persistence

import { useState, useEffect, useMemo } from "react";

const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

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
      id: Date.now(),
      title: "Chapter 1: Untitled",
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    },
  ];
};

// Count words in HTML
const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
};

export function useChapterManager() {
  // Load initial state
  const initial = useMemo(loadState, []);
  
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(
    ensureFirstChapter(initial?.chapters || [])
  );
  const [selectedId, setSelectedId] = useState(chapters[0]?.id);

  // Get currently selected chapter
  const selectedChapter = chapters.find((c) => c.id === selectedId) || chapters[0];

  // Auto-save to localStorage when state changes (debounced)
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

  // Add new chapter
  const addChapter = () => {
    const id = Date.now();
    const newChapter = {
      id,
      title: `Chapter ${chapters.length + 1}: Untitled`,
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    };
    setChapters((prev) => [newChapter, ...prev]);
    setSelectedId(id);
    return id;
  };

  // Update existing chapter
  const updateChapter = (id, updates) => {
    setChapters((prev) =>
      prev.map((ch) => {
        if (ch.id !== id) return ch;
        
        const updated = {
          ...ch,
          ...updates,
          wordCount: updates.content ? countWords(updates.content) : ch.wordCount,
          lastEdited: new Date().toLocaleString(),
        };
        return updated;
      })
    );
  };

  // Delete chapter
const deleteChapter = (id) => {
  setChapters((prev) => {
    const filtered = prev.filter((c) => c.id !== id);
    // Ensure at least one chapter remains
    const result = filtered.length > 0 ? filtered : ensureFirstChapter([]);
    
    // Immediately save to localStorage
    setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters: result,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
    }, 0);
    
    return result;
  });
  
  // If deleted chapter was selected, select first remaining chapter
  if (selectedId === id) {
    setTimeout(() => {
      const remaining = chapters.filter((c) => c.id !== id);
      const newSelectedId = remaining[0]?.id || chapters[0]?.id;
      setSelectedId(newSelectedId);
    }, 50);
  }
};

  // Move chapter (for drag and drop)
  const moveChapter = (fromIndex, toIndex) => {
    setChapters((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  };

  // Manual save (for explicit save button)
  const saveProject = (overrides = {}) => {
    const current = loadState() || {};
    saveState({
      book: overrides.book || book,
      chapters: overrides.chapters || chapters,
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
