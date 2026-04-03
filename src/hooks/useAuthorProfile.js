// src/hooks/useAuthorProfile.js
// Author profile + book data hook
// Saves to S3 via Lambda — localStorage used as fast cache and offline fallback

import { useState, useCallback, useEffect } from "react";

const CLOUD_TIMEOUT = 8000;

// ── Storage keys (localStorage cache) ─────────────────
const KEYS = {
  PROFILE: "storylab_author_profile",
  BOOKS:   "storylab_author_books",
};

// ── Default values ────────────────────────────────────
export const DEFAULT_AUTHOR_PROFILE = {
  fullName:       "",
  penName:        "",
  tagline:        "",
  bio:            "",
  writingMission: "",
  personalQuote:  "",
  photoUrl:       "",
  genres:         [],
  themes:         [],
  socialLinks:    {},
  contactEmail:   "",
  updatedAt:      new Date().toISOString(),
};

// ── Helpers ───────────────────────────────────────────
function getApiBase() {
  return String(
    (typeof window !== "undefined" && window.__API_BASE__) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    "/api"
  ).replace(/\/+$/, "");
}

function getUserId() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.includes("CognitoIdentityServiceProvider") && key.endsWith(".idToken")) {
        const token = localStorage.getItem(key);
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.sub) return payload.sub;
        }
      }
    }
    const userId = localStorage.getItem("dt_user_id");
    if (userId) return userId;
  } catch { }
  return "default";
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function writeLocal(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { }
}

// ── Cloud API calls ───────────────────────────────────
async function cloudGetProfile() {
  try {
    const userId = getUserId();
    const res = await fetch(
      `${getApiBase()}/data/author-profile?userId=${encodeURIComponent(userId)}`,
      {
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        signal: AbortSignal.timeout(CLOUD_TIMEOUT),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.profile || null;
  } catch { return null; }
}

async function cloudSaveProfile(profile) {
  try {
    const userId = getUserId();
    await fetch(`${getApiBase()}/data/author-profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ profile }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
  } catch { /* silent — localStorage already saved */ }
}

async function cloudGetBooks() {
  try {
    const userId = getUserId();
    const res = await fetch(
      `${getApiBase()}/data/author-books?userId=${encodeURIComponent(userId)}`,
      {
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        signal: AbortSignal.timeout(CLOUD_TIMEOUT),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.books || null;
  } catch { return null; }
}

async function cloudSaveBooks(books) {
  try {
    const userId = getUserId();
    await fetch(`${getApiBase()}/data/author-books`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ books }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
  } catch { /* silent */ }
}

// ── Hook ──────────────────────────────────────────────
export function useAuthorProfile() {
  const [profile, setProfileState] = useState(() =>
    readLocal(KEYS.PROFILE, DEFAULT_AUTHOR_PROFILE)
  );
  const [books, setBooksState] = useState(() =>
    readLocal(KEYS.BOOKS, [])
  );
  const [cloudLoaded, setCloudLoaded] = useState(false);

  // ── On mount: load from cloud, sync to localStorage ──
  useEffect(() => {
    let cancelled = false;

    Promise.all([cloudGetProfile(), cloudGetBooks()]).then(([cloudProfile, cloudBooks]) => {
      if (cancelled) return;

      if (cloudProfile) {
        setProfileState(cloudProfile);
        writeLocal(KEYS.PROFILE, cloudProfile);
      }
      if (cloudBooks) {
        setBooksState(cloudBooks);
        writeLocal(KEYS.BOOKS, cloudBooks);
      }

      setCloudLoaded(true);
    });

    return () => { cancelled = true; };
  }, []);

  // ── Profile actions ───────────────────────────────────
  const saveProfile = useCallback((updates) => {
    const updated = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    // Save to localStorage immediately
    writeLocal(KEYS.PROFILE, updated);
    setProfileState(updated);
    // Save to cloud async
    cloudSaveProfile(updated);
  }, [profile]);

  // ── Book actions ──────────────────────────────────────
  const saveBook = useCallback((book) => {
    const updated = books.some((b) => b.id === book.id)
      ? books.map((b) =>
          b.id === book.id
            ? { ...book, updatedAt: new Date().toISOString() }
            : b
        )
      : [...books, { ...book, updatedAt: new Date().toISOString() }];

    writeLocal(KEYS.BOOKS, updated);
    setBooksState(updated);
    cloudSaveBooks(updated);
  }, [books]);

  const deleteBook = useCallback((id) => {
    const updated = books.filter((b) => b.id !== id);
    writeLocal(KEYS.BOOKS, updated);
    setBooksState(updated);
    cloudSaveBooks(updated);
  }, [books]);

  const createBook = useCallback(() => ({
    id:          `book_${Date.now()}`,
    title:       "",
    subtitle:    "",
    genre:       "",
    blurb:       "",
    excerpt:     "",
    status:      "draft",
    buyLinks:    {},
    tags:        [],
    isFeatured:  false,
    coverUrl:    "",
    publishDate: "",
    series:      "",
    seriesNumber:"",
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  }), []);

  const toggleFeatured = useCallback((id) => {
    const updated = books.map((b) =>
      b.id === id
        ? { ...b, isFeatured: !b.isFeatured, updatedAt: new Date().toISOString() }
        : b
    );
    writeLocal(KEYS.BOOKS, updated);
    setBooksState(updated);
    cloudSaveBooks(updated);
  }, [books]);

  const getBook = useCallback(
    (id) => books.find((b) => b.id === id) || null,
    [books]
  );

  return {
    profile,
    books,
    cloudLoaded,
    featuredBooks:  books.filter((b) => b.isFeatured),
    publishedBooks: books.filter((b) => b.status === "published"),
    activeProjects: books.filter((b) => ["draft", "in-progress"].includes(b.status)),
    saveProfile,
    saveBook,
    deleteBook,
    createBook,
    toggleFeatured,
    getBook,
  };
}
