// ─────────────────────────────────────────────
//  DahTruth StoryLab – useAuthorProfile hook
// ─────────────────────────────────────────────
import { useState, useCallback } from 'react';
import type { AuthorProfile, Book, DEFAULT_AUTHOR_PROFILE } from '../types/authorTypes';
import { DEFAULT_AUTHOR_PROFILE as DEFAULTS } from '../types/authorTypes';
 
const KEYS = {
  PROFILE: 'storylab_author_profile',
  BOOKS:   'storylab_author_books',
  BLOG:    'storylab_author_blog_posts',
} as const;
 
// ── helpers ──────────────────────────────────
function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
 
function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('[StoryLab] Storage write failed:', e);
  }
}
 
// ── hook ──────────────────────────────────────
export function useAuthorProfile() {
  const [profile, setProfileState] = useState<AuthorProfile>(() =>
    readStorage<AuthorProfile>(KEYS.PROFILE, DEFAULTS)
  );
 
  const [books, setBooksState] = useState<Book[]>(() =>
    readStorage<Book[]>(KEYS.BOOKS, [])
  );
 
  // ── Profile actions ──────────────────────────
  const saveProfile = useCallback((updates: Partial<AuthorProfile>) => {
    const updated: AuthorProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeStorage(KEYS.PROFILE, updated);
    setProfileState(updated);
  }, [profile]);
 
  // ── Book actions ─────────────────────────────
  const saveBook = useCallback((book: Book) => {
    const updated = books.some(b => b.id === book.id)
      ? books.map(b => b.id === book.id ? { ...book, updatedAt: new Date().toISOString() } : b)
      : [...books, { ...book, updatedAt: new Date().toISOString() }];
    writeStorage(KEYS.BOOKS, updated);
    setBooksState(updated);
  }, [books]);
 
  const deleteBook = useCallback((id: string) => {
    const updated = books.filter(b => b.id !== id);
    writeStorage(KEYS.BOOKS, updated);
    setBooksState(updated);
  }, [books]);
 
  const createBook = useCallback((): Book => ({
    id: `book_${Date.now()}`,
    title: '',
    subtitle: '',
    genre: '',
    blurb: '',
    excerpt: '',
    status: 'draft',
    buyLinks: {},
    tags: [],
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }), []);
 
  const toggleFeatured = useCallback((id: string) => {
    const updated = books.map(b =>
      b.id === id ? { ...b, isFeatured: !b.isFeatured, updatedAt: new Date().toISOString() } : b
    );
    writeStorage(KEYS.BOOKS, updated);
    setBooksState(updated);
  }, [books]);
 
  const getBook = useCallback((id: string) =>
    books.find(b => b.id === id) ?? null
  , [books]);
 
  const featuredBooks = books.filter(b => b.isFeatured);
  const publishedBooks = books.filter(b => b.status === 'published');
  const activeProjects = books.filter(b => ['draft', 'in-progress'].includes(b.status));
 
  return {
    profile,
    books,
    featuredBooks,
    publishedBooks,
    activeProjects,
    saveProfile,
    saveBook,
    deleteBook,
    createBook,
    toggleFeatured,
    getBook,
  };
}
 


File: src/  useAuthorProfile.ts
