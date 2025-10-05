// src/components/ProjectPage.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Save, Download, Upload, Target, Tag, Image, AlertCircle,
  TrendingUp, Clock, Star, BarChart3, CheckCircle, Edit3
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Optional store (works if <UserProvider> is mounted)
─────────────────────────────────────────────────────────────── */
let useUserSafe = null;
try {
  // eslint-disable-next-line global-require
  useUserSafe = require("../lib/state/userStore").useUser;
} catch {}

/* ──────────────────────────────────────────────────────────────
   Shared storage helpers (same key as TOCPage2)
─────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // broadcast so other pages (TOC, etc.) update live
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

/* ──────────────────────────────────────────────────────────────
   Profile name helpers (UserProvider → localStorage fallback)
─────────────────────────────────────────────────────────────── */
function readProfileObject() {
  try {
    const keys = ["dt_profile", "userProfile", "profile", "currentUser"];
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function extractDisplayName(obj) {
  if (!obj || typeof obj !== "object") return "";
  if (obj.displayName) return obj.displayName;
  const fn = obj.firstName || obj.given_name;
  const ln = obj.lastName || obj.family_name;
  if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
  if (obj.username) return obj.username;
  return "";
}

/* ──────────────────────────────────────────────────────────────
   Small helpers
─────────────────────────────────────────────────────────────── */
const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;

const daysUntil = (yyyy_mm_dd) => {
  if (!yyyy_mm_dd) return null;
  const today = new Date();
  const d = new Date(yyyy_mm_dd + "T00:00:00");
  return Math.ceil((d - today) / 86400000);
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const progressPct = (cur, tgt) => Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);
const getReadingTime = (wordCount) => Math.ceil(wordCount / 200);

// Light theme status pill colors
const getStatusColor = (status) => {
  const pill = (bg, text, border) =>
    `bg-[${bg}] text-[${text}] border ${border} rounded-full`;
  const colors = {
    Idea: pill("color:rgba(202,177,214,0.20)", "color:#6B4F7A", "border-[hsl(var(--border))]"),
    Outline: pill("color:rgba(234,242,255,0.60)", "color:#0F172A", "border-[hsl(var(--border))]"),
    Draft: pill("color:rgba(255,213,0,0.15)", "color:#7A5E00", "border-[hsl(var(--border))]"),
    Revision: pill("color:rgba(255,173,51,0.18)", "color:#7A3E00", "border-[hsl(var(--border))]"),
    Editing: pill("color:rgba(46,204,113,0.18)", "color:#1E6B43", "border-[hsl(var(--border))]"),
    Published: pill("color:rgba(212,175,55,0.18)", "color:#6B5A1E", "border-[hsl(var(--border))]"),
  };
  return colors[status] || colors.Draft;
};

/* ──────────────────────────────────────────────────────────────
   Component
─────────────────────────────────────────────────────────────── */
export default function ProjectPage() {
  const navigate = useNavigate();

  // Optional user store
  const store = (() => {
    try { return useUserSafe ? useUserSafe() : null; } catch { return null; }
  })();

  // Load existing app state (book/chapters/daily/settings)
  const existing =
    loadState() || {
      book: {
        title: "Untitled Book",
        subtitle: "",
        author: "",
        genre: "",
        tags: [],
        targetWords: 25000,
        deadline: "",
        status: "Draft",
        logline: "",
        synopsis: "",
        cover: "",
      },
      chapters: [],
      daily: { goal: 500, counts: {} },
      settings: { theme: "light", focusMode: false },
    };

  const [book, setBook] = useState({
    title: "Untitled Book",
    subtitle: "",
    author: "",
    genre: "",
    tags: [],
    targetWords: 25000,
    deadline: "",
    status: "Draft",
    logline: "",
    synopsis: "",
    cover: "",
    ...(existing.book || {}),
  });
  const [chapters, setChapters] = useState(existing.chapters || []);
  const [daily, setDaily] = useState(existing.daily || { goal: 500, counts: {} });
  const [settings, setSettings] = useState(existing.settings || { theme: "light", focusMode: false });
  const [newTag, setNewTag] = useState("");
  const [lastSaved, setLastSaved] = useState(Date.now());

  // Live profile display name (UserProvider → localStorage)
  const profileDisplayName = useMemo(() => {
    if (store?.user?.displayName) return store.user.displayName;
    const obj = readProfileObject();
    return extractDisplayName(obj) || "";
  }, [store?.user?.displayName]);

  // On mount: if book.author is empty, populate from profile and persist
  useEffect(() => {
    if (!book.author && profileDisplayName) {
      setBook((b) => {
        const next = { ...b, author: profileDisplayName };
        const current = loadState() || {};
        saveState({
          book: next,
          chapters: current.chapters || chapters,
          daily: current.daily || daily,
          settings: current.settings || settings,
        });
        return next;
      });
      setLastSaved(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // Listen for profile changes; update header author (and book.author if empty)
  useEffect(() => {
    const onProfileChange = () => {
      const obj = readProfileObject();
      const name = extractDisplayName(obj) || "";
      if (!name) return;
      setBook((b) => {
        if (b.author && b.author.trim().length > 0) return b; // don't override explicit author
        const next = { ...b, author: name };
        const current = loadState() || {};
        saveState({
          book: next,
          chapters: current.chapters || chapters,
          daily: current.daily || daily,
          settings: current.settings || settings,
        });
        setLastSaved(Date.now());
        return next;
      });
    };
    window.addEventListener("profile:updated", onProfileChange);
    window.addEventListener("storage", onProfileChange);
    return () => {
      window.removeEventListener("profile:updated", onProfileChange);
      window.removeEventListener("storage", onProfileChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, daily, settings]);

  // Live sync: if other pages change the project, refresh
  useEffect(() => {
    const sync = () => {
      const s = loadState();
      if (!s) return;
      if (s.book) setBook(s.book);
      if (Array.isArray(s.chapters)) setChapters(s.chapters);
      if (s.daily) setDaily(s.daily);
      if (s.settings) setSettings(s.settings);
    };
    window.addEventListener("project:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Debounced auto-save whenever the book object changes
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters: current.chapters || chapters,
        daily: current.daily || daily,
        settings: current.settings || settings,
      });
      setLastSaved(Date.now());
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book]);

  // Explicit save button
  const saveNow = () => {
    const current = loadState() || {};
    saveState({
      book,
      chapters: current.chapters || chapters,
      daily: current.daily || daily,
      settings: current.settings || settings,
    });
    setLastSaved(Date.now());
  };

  // Export backup JSON of the whole workspace
  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ book, chapters, daily, settings }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dahtruth_project_backup.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Cover image upload (stored as data URL)
  const onCoverPicked = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBook((b) => ({ ...b, cover: reader.result }));
    reader.readAsDataURL(file);
  };
  const removeCover = () => setBook((b) => ({ ...b, cover: "" }));

  // Tags
  const addTag = () => {
    const t = newTag.trim();
    if (!t || (book.tags || []).includes(t)) return;
    setBook((b) => ({ ...b, tags: [...(b.tags || []), t] }));
    setNewTag("");
  };
  const removeTag = (tag) =>
    setBook((b) => ({ ...b, tags: (b.tags || []).filter((x) => x !== tag) }));

  // Derived stats
  const totalWords = chapters.reduce((sum, ch) => sum + countWords(ch.content || ""), 0);
  const pct = progressPct(totalWords, book.targetWords || 25000);
  const daysLeft = daysUntil(book.deadline);
  const wordsRemaining = Math.max((book.targetWords || 0) - totalWords, 0);
  const wordsPerDayNeeded =
    daysLeft != null && daysLeft > 0 ? Math.ceil(wordsRemaining / daysLeft) : null;
  const totalReadingTime = getReadingTime(totalWords);
  const avgWordsPerChapter = chapters.length > 0 ? Math.round(totalWords / chapters.length) : 0;
  const completedChapters = chapters.filter(
    (ch) => (ch.content || "").trim().length > 100
  ).length;

  // Render author for header: prefer explicit book.author, else live profile name
  const headerAuthor = book.author?.trim() || profileDisplayName || "";

  return (
    <div className="min-h-screen text-[color:var(--color-ink)] bg-[color:var(--color-base)] bg-radial-fade py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Top header */}
        <div className="glass-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[color:var(--color-primary)] grid place-items-center">
                <BookOpen size={20} className="text-[color:var(--color-ink)]/80" />
              </div>
              <div>
                <h1 className="text-3xl heading-serif">Project Overview</h1>
                <div className="text-sm text-muted mt-1">
                  {headerAuthor ? <>by {headerAuthor} • </> : null}
                  {chapters.length} chapters • {totalWords.toLocaleString()} words
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveNow}
                className="btn-gold inline-flex items-center gap-2"
                title="Save"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={exportJSON}
                className="btn-primary inline-flex items-center gap-2"
                title="Export backup JSON"
              >
                <Download size={16} /> Export
              </button>
              <div className="text-xs text-muted">
                Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progress */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-[color:var(--color-ink)]/70" />
              <div className="text-sm text-muted">Progress</div>
            </div>
            <div className="text-2xl font-bold">{pct.toFixed(1)}%</div>
            <div className="w-full bg-[color:var(--color-primary)]/60 rounded-full h-2 mt-2">
              <div
                className="bg-[color:var(--color-accent)] h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Reading Time */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[color:var(--color-ink)]/70" />
              <div className="text-sm text-muted">Read Time</div>
            </div>
            <div className="text-2xl font-bold">{totalReadingTime}m</div>
            <div className="text-xs text-muted mt-1">~{Math.round(totalReadingTime / 60)}h total</div>
          </div>

          {/* Completion */}
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-[color:var(--color-ink)]/70" />
              <div className="text-sm text-muted">Complete</div>
            </div>
            <div className="text-2xl font-bold">{completedChapters}</div>
            <div className="text-xs text-muted mt-1">of {chapters.length} chapters</div>
          </div>

          {/* Status Badge */}
        <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-[color:var(--color-ink)]/70" />
              <div className="text-sm text-muted">Status</div>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 text-sm font-medium ${getStatusColor(book.status)}`}
            >
              {book.status}
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="mt-6 grid lg:grid-cols-[320px,1fr] gap-6">
          {/* Left sidebar - Cover & Meta */}
          <div className="space-y-6">
            {/* Cover Card */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2 heading-serif">
                <Image size={18} className="text-[color:var(--color-ink)]/80" />
                Book Cover
              </div>

              <div className="rounded-2xl overflow-hidden border border-[hsl(var(--border))] bg-[color:var(--color-primary)]/40 aspect-[3/4] flex items-center justify-center mb-4">
                {book.cover ? (
                  <img src={book.cover} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted">
                    <Image size={32} className="mx-auto mb-2 opacity-60" />
                    <div className="text-sm">Upload cover image</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[color:var(--color-primary)] border border-[hsl(var(--border))] hover:opacity-90 text-sm cursor-pointer">
                  <Upload size={16} /> Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files && e.target.files[0] && onCoverPicked(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                {book.cover && (
                  <button
                    onClick={removeCover}
                    className="px-3 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:opacity-90 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Tags Card */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2 heading-serif">
                <Tag size={18} className="text-[color:var(--color-ink)]/80" />
                Tags & Genre
              </div>

              <div className="mb-4">
                <input
                  value={book.genre || ""}
                  onChange={(e) => setBook((b) => ({ ...b, genre: e.target.value }))}
                  placeholder="Genre (e.g., Fantasy, Romance)"
                  className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none placeholder:text-[color:var(--color-muted)]"
                  style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {(book.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-[color:var(--color-primary)] text-[color:var(--color-ink)] border border-[hsl(var(--border))]"
                  >
                    {t}
                    <button className="hover:opacity-80 ml-1" onClick={() => removeTag(t)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addTag();
                  }}
                  placeholder="Add tag..."
                  className="flex-1 rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none placeholder:text-[color:var(--color-muted)]"
                  style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                />
                <button
                  onClick={addTag}
                  className="btn-primary px-4 py-2"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Goals Card */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2 heading-serif">
                <Target size={18} className="text-[color:var(--color-ink)]/80" />
                Goals & Deadline
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted mb-1 block">Target Words</label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={book.targetWords || 0}
                    onChange={(e) =>
                      setBook((b) => ({
                        ...b,
                        targetWords: clamp(Number(e.target.value) || 0, 0, 5_000_000),
                      }))
                    }
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Deadline</label>
                  <input
                    type="date"
                    value={book.deadline || ""}
                    onChange={(e) => setBook((b) => ({ ...b, deadline: e.target.value }))}
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                  {book.deadline && (
                    <div className="text-xs text-muted mt-2">
                      {daysLeft >= 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`}
                      {wordsPerDayNeeded && <div className="mt-1">Need {wordsPerDayNeeded.toLocaleString()} words/day</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Story Details */}
          <div className="space-y-6">
            {/* Title & Basic Info */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2 heading-serif">
                <Edit3 size={18} className="text-[color:var(--color-ink)]/80" />
                Story Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs text-muted mb-1 block">Title (updates across entire app)</label>
                  <input
                    value={book.title}
                    onChange={(e) => setBook((b) => ({ ...b, title: e.target.value }))}
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-lg font-semibold outline-none"
                    placeholder="Your story title..."
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Subtitle</label>
                  <input
                    value={book.subtitle || ""}
                    onChange={(e) => setBook((b) => ({ ...b, subtitle: e.target.value }))}
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    placeholder="Optional subtitle..."
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Author</label>
                  <input
                    value={book.author || ""}
                    onChange={(e) => setBook((b) => ({ ...b, author: e.target.value }))}
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    placeholder="Your name..."
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Status</label>
                  <select
                    value={book.status || "Draft"}
                    onChange={(e) => setBook((b) => ({ ...b, status: e.target.value }))}
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  >
                    {["Idea", "Outline", "Draft", "Revision", "Editing", "Published"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-muted mb-1 block">Logline</label>
                  <input
                    value={book.logline || ""}
                    onChange={(e) => setBook((b) => ({ ...b, logline: e.target.value }))}
                    placeholder="One-sentence hook for your story..."
                    className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none"
                    style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted mb-1 block">Synopsis</label>
                <textarea
                  value={book.synopsis || ""}
                  onChange={(e) => setBook((b) => ({ ...b, synopsis: e.target.value }))}
                  placeholder="High-level overview of your book..."
                  className="w-full min-h-[160px] rounded-lg bg-white border border-[hsl(var(--border))] px-4 py-3 text-sm outline-none resize-vertical"
                  style={{ fontFamily: "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif" }}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="glass-panel p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2 heading-serif">
                <BarChart3 size={18} className="text-[color:var(--color-ink)]/80" />
                Writing Statistics
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
                  <div className="text-xs text-muted">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{chapters.length}</div>
                  <div className="text-xs text-muted">Chapters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{avgWordsPerChapter.toLocaleString()}</div>
                  <div className="text-xs text-muted">Avg/Chapter</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalReadingTime}m</div>
                  <div className="text-xs text-muted">Read Time</div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-[color:var(--color-primary)]/50 border border-[hsl(var(--border))]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Word Count Progress</span>
                  <span className="text-sm text-muted">
                    {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-3 border border-[hsl(var(--border))]">
                  <div
                    className="bg-[color:var(--color-accent)] h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Helpful message if no chapters */}
            {chapters.length === 0 && (
              <div className="glass-panel p-6 text-center">
                <AlertCircle className="mx-auto mb-3 text-[color:var(--color-ink)]/70" size={32} />
                <div className="text-lg font-medium mb-2">Ready to start writing?</div>
                <div className="text-sm text-muted mb-4">
                  Head over to your Table of Contents to create your first chapter and begin your story.
                </div>
                <button
                  onClick={() => navigate("/toc")}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <BookOpen size={16} />
                  Go to Table of Contents
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
