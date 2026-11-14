// src/hooks/useTbrList.js
// "To Be Read" reading list — data + persistence.
//
// Rules:
//   • Up to 200 books may be added per calendar year (TBR_YEARLY_LIMIT).
//   • A book counts toward the year it was added (addedYear).
//   • Deleting a book frees its slot for that year.
//
// Persistence follows the same pattern as usePersistedText:
//   localStorage (fast cache / offline) + S3 via the existing
//   /data/module-draft Lambda route (key "tbr-list"), so no backend
//   changes are needed. The list is stored as JSON in the draft's `content`.

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

export const TBR_YEARLY_LIMIT = 200;

export const TBR_STATUSES = [
  { value: "to-read", label: "To Read" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

const LOCAL_KEY = "storylab_tbr_list";
const CLOUD_KEY = "tbr-list";
const CLOUD_TIMEOUT = 8000;
const CLOUD_DEBOUNCE_MS = 1200;

function getApiBase() {
  return (
    (typeof window !== "undefined" && window.__API_BASE__) ||
    "https://nh462913aa.execute-api.us-east-1.amazonaws.com/prod"
  );
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

// Local cache is per user so two people on one computer don't mix lists.
function localKey() {
  return `${LOCAL_KEY}_${getUserId()}`;
}

function emptyState() {
  return { books: [], updatedAt: null };
}

function normalizeState(raw) {
  if (!raw || typeof raw !== "object") return emptyState();
  const books = Array.isArray(raw.books) ? raw.books.filter((b) => b && b.id && b.title) : [];
  return { books, updatedAt: raw.updatedAt || null };
}

function readLocal() {
  try {
    const raw = localStorage.getItem(localKey());
    return raw ? normalizeState(JSON.parse(raw)) : emptyState();
  } catch { return emptyState(); }
}

function writeLocal(state) {
  try { localStorage.setItem(localKey(), JSON.stringify(state)); } catch { }
}

async function cloudGet() {
  try {
    const userId = getUserId();
    const res = await fetch(
      `${getApiBase()}/data/module-draft?userId=${encodeURIComponent(userId)}&key=${encodeURIComponent(CLOUD_KEY)}`,
      {
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        signal: AbortSignal.timeout(CLOUD_TIMEOUT),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.draft?.content;
    if (!content) return null;
    return normalizeState(JSON.parse(content));
  } catch { return null; }
}

async function cloudSave(state) {
  try {
    const userId = getUserId();
    const res = await fetch(`${getApiBase()}/data/module-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ key: CLOUD_KEY, content: JSON.stringify(state) }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
    return res.ok;
  } catch { return false; }
}

function newId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch { }
  return `tbr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

export function countForYear(books, year) {
  return books.filter((b) => Number(b.addedYear) === Number(year)).length;
}

export function useTbrList() {
  const [state, setState] = useState(readLocal);
  // "local" until the cloud copy has been checked; then "synced" / "saving" / "offline"
  const [syncStatus, setSyncStatus] = useState("loading");
  const stateRef = useRef(state);
  const saveTimer = useRef(null);

  useEffect(() => { stateRef.current = state; }, [state]);

  // On mount: prefer whichever copy (local or cloud) was updated most recently.
  useEffect(() => {
    let cancelled = false;
    cloudGet().then((cloud) => {
      if (cancelled) return;
      if (!cloud) {
        setSyncStatus(navigator.onLine === false ? "offline" : "synced");
        return;
      }
      const local = stateRef.current;
      const cloudTime = cloud.updatedAt ? Date.parse(cloud.updatedAt) : 0;
      const localTime = local.updatedAt ? Date.parse(local.updatedAt) : 0;
      if (cloudTime >= localTime) {
        setState(cloud);
        writeLocal(cloud);
        setSyncStatus("synced");
      } else {
        // Local copy is newer (e.g. edits made offline) — push it up.
        setSyncStatus("saving");
        cloudSave(local).then((ok) => !cancelled && setSyncStatus(ok ? "synced" : "offline"));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const scheduleCloudSave = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSyncStatus("saving");
    saveTimer.current = setTimeout(async () => {
      saveTimer.current = null;
      const ok = await cloudSave(next);
      setSyncStatus(ok ? "synced" : "offline");
    }, CLOUD_DEBOUNCE_MS);
  }, []);

  // Flush a pending save when leaving the page.
  useEffect(() => () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      cloudSave(stateRef.current);
    }
  }, []);

  const commit = useCallback((books) => {
    const next = { books, updatedAt: new Date().toISOString() };
    stateRef.current = next;
    setState(next);
    writeLocal(next);
    scheduleCloudSave(next);
  }, [scheduleCloudSave]);

  const currentYear = new Date().getFullYear();
  const usedThisYear = useMemo(() => countForYear(state.books, currentYear), [state.books, currentYear]);
  const remainingThisYear = Math.max(0, TBR_YEARLY_LIMIT - usedThisYear);

  /** Returns { ok: true, book } or { ok: false, error } */
  const addBook = useCallback((fields) => {
    const title = clean(fields?.title, 300);
    if (!title) return { ok: false, error: "Please enter a title." };

    const year = new Date().getFullYear();
    const books = stateRef.current.books;
    if (countForYear(books, year) >= TBR_YEARLY_LIMIT) {
      return {
        ok: false,
        error: `You've reached the limit of ${TBR_YEARLY_LIMIT} books for ${year}. Delete a book to free up a slot.`,
      };
    }

    const now = new Date().toISOString();
    const book = {
      id: newId(),
      title,
      author: clean(fields.author, 200),
      genre: clean(fields.genre, 100),
      status: TBR_STATUSES.some((s) => s.value === fields.status) ? fields.status : "to-read",
      upNext: !!fields.upNext,
      recommendedBy: clean(fields.recommendedBy, 200),
      notes: clean(fields.notes, 2000),
      addedAt: now,
      addedYear: year,
      updatedAt: now,
    };
    commit([book, ...books]);
    return { ok: true, book };
  }, [commit]);

  /** Edits never change addedAt/addedYear, so editing doesn't affect the yearly count. */
  const updateBook = useCallback((id, fields) => {
    const books = stateRef.current.books;
    const existing = books.find((b) => b.id === id);
    if (!existing) return { ok: false, error: "That book no longer exists." };

    const title = fields.title !== undefined ? clean(fields.title, 300) : existing.title;
    if (!title) return { ok: false, error: "Please enter a title." };

    const updated = {
      ...existing,
      title,
      author: fields.author !== undefined ? clean(fields.author, 200) : existing.author,
      genre: fields.genre !== undefined ? clean(fields.genre, 100) : existing.genre,
      status: TBR_STATUSES.some((s) => s.value === fields.status) ? fields.status : existing.status,
      upNext: fields.upNext !== undefined ? !!fields.upNext : existing.upNext,
      recommendedBy: fields.recommendedBy !== undefined ? clean(fields.recommendedBy, 200) : existing.recommendedBy,
      notes: fields.notes !== undefined ? clean(fields.notes, 2000) : existing.notes,
      updatedAt: new Date().toISOString(),
    };
    commit(books.map((b) => (b.id === id ? updated : b)));
    return { ok: true, book: updated };
  }, [commit]);

  /** Deleting frees the slot for the year the book was added. */
  const deleteBook = useCallback((id) => {
    commit(stateRef.current.books.filter((b) => b.id !== id));
  }, [commit]);

  return {
    books: state.books,
    syncStatus,
    currentYear,
    usedThisYear,
    remainingThisYear,
    limit: TBR_YEARLY_LIMIT,
    addBook,
    updateBook,
    deleteBook,
  };
}
