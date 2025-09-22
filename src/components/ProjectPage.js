// src/components/ProjectPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Save, Download, Upload, Target, Tag, Image, AlertCircle,
  TrendingUp, Clock, Star, BarChart3, CheckCircle, Edit3
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Shared storage helpers (same key as TOCPage2)
──────────────────────────────────────────────────────────────── */
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
   Small helpers
──────────────────────────────────────────────────────────────── */
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

const getStatusColor = (status) => {
  const colors = {
    Idea: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    Outline: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    Draft: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
    Revision: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    Editing: "bg-green-500/20 text-green-300 border-green-500/40",
    Published: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };
  return colors[status] || colors.Draft;
};

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function ProjectPage() {
  const navigate = useNavigate();

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
      settings: { theme: "dark", focusMode: false },
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
  const [settings, setSettings] = useState(existing.settings || { theme: "dark", focusMode: false });
  const [newTag, setNewTag] = useState("");
  const [lastSaved, setLastSaved] = useState(Date.now());

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-8 relative overflow-hidden">
      {/* Animated blobs */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4">
        {/* Top header */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-900/90 to-slate-900/90 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold drop-shadow-sm">Project Overview</h1>
                <div className="text-sm text-slate-300 mt-1">
                  {book.author && `by ${book.author} • `}
                  {chapters.length} chapters • {totalWords.toLocaleString()} words
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveNow}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600/30 border border-green-400/30 hover:bg-green-600/40 text-green-100 text-sm backdrop-blur-sm"
                title="Save"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={exportJSON}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm backdrop-blur-sm"
                title="Export backup JSON"
              >
                <Download size={16} /> Export
              </button>
              <div className="text-xs text-slate-400">
                Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progress */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-400" />
              <div className="text-sm text-slate-300">Progress</div>
            </div>
            <div className="text-2xl font-bold">{pct.toFixed(1)}%</div>
            <div className="w-full bg-blue-900/30 rounded-full h-2 mt-2">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Reading Time */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-400" />
              <div className="text-sm text-slate-300">Read Time</div>
            </div>
            <div className="text-2xl font-bold">{totalReadingTime}m</div>
            <div className="text-xs text-slate-400 mt-1">~{Math.round(totalReadingTime / 60)}h total</div>
          </div>

          {/* Completion */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-teal-400" />
              <div className="text-sm text-slate-300">Complete</div>
            </div>
            <div className="text-2xl font-bold">{completedChapters}</div>
            <div className="text-xs text-slate-400 mt-1">of {chapters.length} chapters</div>
          </div>

          {/* Status Badge */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-yellow-400" />
              <div className="text-sm text-slate-300">Status</div>
            </div>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                book.status
              )}`}
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
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Image size={18} className="text-indigo-400" />
                Book Cover
              </div>

              <div className="rounded-2xl overflow-hidden border border-blue-700/30 bg-blue-900/20 aspect-[3/4] flex items-center justify-center mb-4">
                {book.cover ? (
                  <img src={book.cover} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-400">
                    <Image size={32} className="mx-auto mb-2 opacity-50" />
                    <div className="text-sm">Upload cover image</div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <label className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm cursor-pointer backdrop-blur-sm">
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
                    className="px-3 py-2 rounded-xl bg-red-600/30 border border-red-400/30 hover:bg-red-600/40 text-red-100 text-sm backdrop-blur-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Tags Card */}
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Tag size={18} className="text-yellow-400" />
                Tags & Genre
              </div>

              <div className="mb-4">
                <input
                  value={book.genre || ""}
                  onChange={(e) => setBook((b) => ({ ...b, genre: e.target.value }))}
                  placeholder="Genre (e.g., Fantasy, Romance)"
                  className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none placeholder:text-slate-400 backdrop-blur-sm font-serif"
                />
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {(book.tags || []).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                  >
                    {t}
                    <button className="hover:text-red-400 ml-1" onClick={() => removeTag(t)}>
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
                  className="flex-1 rounded-xl bg-blue-900/30 border border-blue-700/50 px-3 py-2 text-sm outline-none placeholder:text-slate-400 backdrop-blur-sm font-serif"
                />
                <button
                  onClick={addTag}
                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm backdrop-blur-sm"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Goals Card */}
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target size={18} className="text-green-400" />
                Goals & Deadline
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Target Words</label>
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
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Deadline</label>
                  <input
                    type="date"
                    value={book.deadline || ""}
                    onChange={(e) => setBook((b) => ({ ...b, deadline: e.target.value }))}
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                  />
                  {book.deadline && (
                    <div className="text-xs text-slate-400 mt-2">
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
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Edit3 size={18} className="text-blue-400" />
                Story Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 mb-1 block">Title (updates across entire app)</label>
                  <input
                    value={book.title}
                    onChange={(e) => setBook((b) => ({ ...b, title: e.target.value }))}
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-lg font-semibold outline-none backdrop-blur-sm font-serif"
                    placeholder="Your story title..."
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Subtitle</label>
                  <input
                    value={book.subtitle || ""}
                    onChange={(e) => setBook((b) => ({ ...b, subtitle: e.target.value }))}
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                    placeholder="Optional subtitle..."
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Author</label>
                  <input
                    value={book.author || ""}
                    onChange={(e) => setBook((b) => ({ ...b, author: e.target.value }))}
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                    placeholder="Your name..."
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Status</label>
                  <select
                    value={book.status || "Draft"}
                    onChange={(e) => setBook((b) => ({ ...b, status: e.target.value }))}
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                  >
                    {["Idea", "Outline", "Draft", "Revision", "Editing", "Published"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Logline</label>
                  <input
                    value={book.logline || ""}
                    onChange={(e) => setBook((b) => ({ ...b, logline: e.target.value }))}
                    placeholder="One-sentence hook for your story..."
                    className="w-full rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none backdrop-blur-sm font-serif"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Synopsis</label>
                <textarea
                  value={book.synopsis || ""}
                  onChange={(e) => setBook((b) => ({ ...b, synopsis: e.target.value }))}
                  placeholder="High-level overview of your book..."
                  className="w-full min-h-[160px] rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-3 text-sm outline-none resize-vertical backdrop-blur-sm font-serif"
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40 p-6">
              <div className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-teal-400" />
                Writing Statistics
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-300">{totalWords.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-300">{chapters.length}</div>
                  <div className="text-xs text-slate-400">Chapters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-300">{avgWordsPerChapter.toLocaleString()}</div>
                  <div className="text-xs text-slate-400">Avg/Chapter</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-300">{totalReadingTime}m</div>
                  <div className="text-xs text-slate-400">Read Time</div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-900/20 border border-blue-700/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Word Count Progress</span>
                  <span className="text-sm text-slate-300">
                    {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-blue-900/40 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-700 relative overflow-hidden"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Helpful message if no chapters */}
            {chapters.length === 0 && (
              <div className="rounded-3xl bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 p-6 text-center">
                <AlertCircle className="mx-auto mb-3 text-amber-400" size={32} />
                <div className="text-lg font-medium text-amber-100 mb-2">Ready to start writing?</div>
                <div className="text-sm text-amber-200/80 mb-4">
                  Head over to your Table of Contents to create your first chapter and begin your story.
                </div>
                <button
                  onClick={() => navigate("/toc")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 text-amber-100 text-sm backdrop-blur-sm"
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
