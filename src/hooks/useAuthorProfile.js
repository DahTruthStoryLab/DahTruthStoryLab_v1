// src/hooks/useAuthorProfile.js
// Author profile + book data hook — plain JS (no TypeScript)
// Types merged in here to avoid import chain issues with Amplify/Rollup

import { useState, useCallback } from "react";

// ─────────────────────────────────────────────
//  Default values (replaces authorTypes.ts)
// ─────────────────────────────────────────────
export const DEFAULT_AUTHOR_PROFILE = {
  fullName: "",
  penName: "",
  tagline: "",
  bio: "",
  writingMission: "",
  personalQuote: "",
  photoUrl: "",
  genres: [],
  themes: [],
  socialLinks: {},
  contactEmail: "",
  updatedAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────
//  Storage keys
// ─────────────────────────────────────────────
const KEYS = {
  PROFILE: "storylab_author_profile",
  BOOKS: "storylab_author_books",
};

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("[StoryLab] Storage write failed:", e);
  }
}

// ─────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────
export function useAuthorProfile() {
  const [profile, setProfileState] = useState(() =>
    readStorage(KEYS.PROFILE, DEFAULT_AUTHOR_PROFILE)
  );

  const [books, setBooksState] = useState(() =>
    readStorage(KEYS.BOOKS, [])
  );

  // ── Profile ──────────────────────────────────
  const saveProfile = useCallback(
    (updates) => {
      const updated = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeStorage(KEYS.PROFILE, updated);
      setProfileState(updated);
    },
    [profile]
  );

  // ── Books ─────────────────────────────────────
  const saveBook = useCallback(
    (book) => {
      const updated = books.some((b) => b.id === book.id)
        ? books.map((b) =>
            b.id === book.id
              ? { ...book, updatedAt: new Date().toISOString() }
              : b
          )
        : [...books, { ...book, updatedAt: new Date().toISOString() }];
      writeStorage(KEYS.BOOKS, updated);
      setBooksState(updated);
    },
    [books]
  );

  const deleteBook = useCallback(
    (id) => {
      const updated = books.filter((b) => b.id !== id);
      writeStorage(KEYS.BOOKS, updated);
      setBooksState(updated);
    },
    [books]
  );

  const createBook = useCallback(
    () => ({
      id: `book_${Date.now()}`,
      title: "",
      subtitle: "",
      genre: "",
      blurb: "",
      excerpt: "",
      status: "draft",
      buyLinks: {},
      tags: [],
      isFeatured: false,
      coverUrl: "",
      publishDate: "",
      series: "",
      seriesNumber: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    []
  );

  const toggleFeatured = useCallback(
    (id) => {
      const updated = books.map((b) =>
        b.id === id
          ? { ...b, isFeatured: !b.isFeatured, updatedAt: new Date().toISOString() }
          : b
      );
      writeStorage(KEYS.BOOKS, updated);
      setBooksState(updated);
    },
    [books]
  );

  const getBook = useCallback(
    (id) => books.find((b) => b.id === id) || null,
    [books]
  );

  return {
    profile,
    books,
    featuredBooks: books.filter((b) => b.isFeatured),
    publishedBooks: books.filter((b) => b.status === "published"),
    activeProjects: books.filter((b) =>
      ["draft", "in-progress"].includes(b.status)
    ),
    saveProfile,
    saveBook,
    deleteBook,
    createBook,
    toggleFeatured,
    getBook,
  };
}
