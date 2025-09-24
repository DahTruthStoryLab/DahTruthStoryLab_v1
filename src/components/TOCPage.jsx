// src/components/TOCPage.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen, Plus, FileText, Clock, Sparkles, Loader2,
  ListTree, ChevronRight, ChevronDown, Search, X,
  Trash2, Copy, Download, Save, AlertCircle, ArrowLeft
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */
const countWords = (text = "") =>
  text.trim().split(/\s+/).filter(Boolean).length;

const getReadingTime = (wordCount) => Math.ceil(wordCount / 200); // ~200 WPM
const getProgress = (current, target) => Math.min((current / target) * 100, 100);

const truncate = (s = "", n = 40) =>
  s.split(/\s+/).slice(0, n).join(" ") + (countWords(s) > n ? "…" : "");

const formatWhen = (ts) => {
  const d = Math.round((Date.now() - ts) / (1000 * 60 * 60 * 24));
  if (d <= 0) return "Updated today";
  if (d === 1) return "Updated 1 day ago";
  return `Updated ${d} days ago`;
};

// Shared storage key (same as Writer/Project)
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // notify other tabs/pages (Writer/Project) to live-sync
    window.dispatchEvent(new Event("project:change"));
  } catch (e) {
    console.warn("Failed to save to localStorage:", e);
  }
};

const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn("Failed to load from localStorage:", e);
    return null;
  }
};

/** Fallback local "AI" summarizer. Replace with your API if you have one. */
async function summarizeLocal(text = "") {
  if (!text) return "No content yet — add some text to this chapter.";
  const firstSentence = text.split(/(?<=[.?!])\s+/)[0];
  if (firstSentence && countWords(firstSentence) >= 8) return firstSentence;
  return truncate(text, 40);
}

async function summarize(content) {
  const url = process.env.REACT_APP_SUMMARY_URL;
  if (url) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await r.json();
      if (data?.summary) return data.summary;
    } catch (e) {
      console.warn("Remote summarize failed, using local:", e);
    }
  }
  return summarizeLocal(content);
}

// Export as .txt
const exportToText = (book, chapters) => {
  const content = [
    `${book.title}\n${"=".repeat(book.title.length)}\n`,
    `Total words: ${chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0).toLocaleString()}`,
    `Chapters: ${chapters.length}\n\n`,
    ...chapters.map(ch =>
      [
        `${ch.title}\n${"-".repeat(ch.title.length)}`,
        ch.synopsis ? `Synopsis: ${ch.synopsis}\n` : "",
        ch.content || "(No content yet)\n",
      ].filter(Boolean).join("\n")
    ),
  ].join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${book.title.replace(/[^a-zA-Z0-9]/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/* ──────────────────────────────────────────────────────────────
   Initial Data
──────────────────────────────────────────────────────────────── */
const getInitialData = () => {
  const saved = loadFromStorage();
  if (saved) return saved;

  return {
    book: { title: "Jacque is a rock star!!", targetWords: 25000 },
    chapters: [
      {
        id: 1,
        title: "Chapter 1",
        content:
          "Jacque steps on stage for the first time. The crowd hums; nerves prickle at the skin. One clear note steadies the soul.",
        synopsis: "",
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: 2,
        title: "Chapter 2",
        content:
          "Backstage, friendships strain. A whispered truth forces Jacque to reconsider who really has their back.",
        synopsis: "",
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: 3,
        title: "Chapter 3",
        content: "",
        synopsis: "",
        updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
    ],
  };
};

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function TOCPage() {
  const initialData = getInitialData();
  const [book, setBook] = React.useState(initialData.book);
  const [chapters, setChapters] = React.useState(initialData.chapters);
  const [quickTitle, setQuickTitle] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [open, setOpen] = React.useState(() => new Set());
  const [busyIds, setBusyIds] = React.useState(new Set());
  const [showConfirm, setShowConfirm] = React.useState(null);
  const [lastSaved, setLastSaved] = React.useState(Date.now());

  // Auto-save every 30s
  React.useEffect(() => {
    const interval = setInterval(() => {
      saveToStorage({ book, chapters });
      setLastSaved(Date.now());
    }, 30000);
    return () => clearInterval(interval);
  }, [book, chapters]);

  const saveNow = () => {
    saveToStorage({ book, chapters });
    setLastSaved(Date.now());
  };

  // Shortcuts: Ctrl/Cmd+S, Ctrl/Cmd+N
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "s") {
          e.preventDefault();
          saveNow();
        } else if (e.key === "n") {
          e.preventDefault();
          addChapter();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [quickTitle, chapters, book]);

  const totalWords = chapters.reduce((t, ch) => t + (ch.content ? countWords(ch.content) : 0), 0);
  const progress = getProgress(totalWords, book.targetWords);
  const totalReadingTime = getReadingTime(totalWords);

  const filteredChapters = chapters.filter(
    (ch) =>
      ch.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ch.synopsis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addChapter = () => {
    const title = quickTitle.trim() || `Chapter ${chapters.length + 1}`;
    const next = { id: Date.now(), title, content: "", synopsis: "", updatedAt: Date.now() };
    setChapters((c) => [next, ...c]);
    setQuickTitle("");
  };

  const duplicateChapter = (id) => {
    const original = chapters.find((ch) => ch.id === id);
    if (!original) return;
    const duplicate = { ...original, id: Date.now(), title: `${original.title} (Copy)`, updatedAt: Date.now() };
    setChapters((c) => {
      const index = c.findIndex((ch) => ch.id === id);
      return [...c.slice(0, index + 1), duplicate, ...c.slice(index + 1)];
    });
  };

  const deleteChapter = (id) => {
    setChapters((c) => c.filter((ch) => ch.id !== id));
    setShowConfirm(null);
  };

  const generateOne = async (id) => {
    setBusyIds((b) => new Set(b).add(id));
    try {
      setChapters((c) => c.map((ch) => (ch.id === id ? { ...ch, synopsis: ch.synopsis || "…" } : ch)));
      const ch = chapters.find((x) => x.id === id);
      const summary = await summarize(ch?.content || "");
      setChapters((c) => c.map((x) => (x.id === id ? { ...x, synopsis: summary } : x)));
    } finally {
      setBusyIds((b) => {
        const n = new Set(b);
        n.delete(id);
        return n;
      });
    }
  };

  const generateAll = async () => {
    const toGenerate = chapters.filter((ch) => !ch.synopsis);
    const batchSize = 3;
    for (let i = 0; i < toGenerate.length; i += batchSize) {
      const batch = toGenerate.slice(i, i + batchSize);
      await Promise.all(batch.map((ch) => generateOne(ch.id)));
    }
  };

  const toggleOpen = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const updateChapter = (id, updates) => {
    setChapters((c) => c.map((ch) => (ch.id === id ? { ...ch, ...updates, updatedAt: Date.now() } : ch)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-8 relative overflow-hidden">
      {/* Top utility bar with Back */}
      <div className="sticky top-0 z-40 -mt-8 mb-4 bg-sky-950/60 backdrop-blur-xl border-b border-sky-800/40">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/20 hover:bg-white/15"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </NavLink>
          <div className="text-xs text-sky-100/80">
            Saved {Math.round((Date.now() - lastSaved) / 1000 / 60) || 0}m ago
          </div>
        </div>
      </div>

      {/* Ambient blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4">
        {/* Header banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-900/90 to-slate-900/90 backdrop-blur-xl text-white shadow-2xl border border-sky-800/40">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <h1 className="text-3xl font-extrabold drop-shadow-sm">Table of Contents</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={saveNow}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600/30 border border-green-400/30 hover:bg-green-600/40 text-green-100 text-sm"
                title="Save now (Ctrl+S)"
              >
                <Save size={16} />
                Save
              </button>
              <button
                onClick={() => exportToText(book, chapters)}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600/30 border border-sky-400/30 hover:bg-sky-600/40 text-sky-100 text-sm"
                title="Export as text file"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={generateAll}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm"
                title="Generate AI synopses for chapters without one"
              >
                <Sparkles size={16} />
                Generate synopses
              </button>
              <button
                onClick={addChapter}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm shadow"
                title="New chapter (Ctrl+N)"
              >
                <Plus size={16} /> New Chapter
              </button>
            </div>
          </div>
        </div>

        {/* Book banner */}
        <div className="mt-4 rounded-3xl bg-sky-900/40 backdrop-blur-xl text-white shadow-2xl border border-sky-700/40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">{book.title}</div>
                <div className="text-sm text-slate-200/90 mt-1">
                  {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()} words
                  {totalReadingTime > 0 && ` • ~${totalReadingTime} min read`}
                </div>
                <div className="mt-2 w-64 bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-sky-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-300 mt-1">{progress.toFixed(1)}% complete</div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold">{chapters.length}</div>
                <div className="text-xs uppercase tracking-wide text-slate-300">Chapters</div>
                <div className="text-xs text-slate-300/90 mt-1">
                  Last saved {Math.round((Date.now() - lastSaved) / 1000 / 60) || 0}m ago
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Quick add */}
        <div className="mt-4 rounded-3xl bg-sky-900/40 backdrop-blur-xl text-white shadow-2xl border border-sky-700/40">
          <div className="px-6 py-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search chapters by title, content, or synopsis..."
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-sky-800/30 border border-sky-600/40 text-sm outline-none placeholder:text-slate-300/80 backdrop-blur-sm font-serif"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick add */}
            <div className="flex gap-3">
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChapter()}
                placeholder="Quick add: Chapter title…"
                className="flex-1 rounded-xl bg-sky-800/30 border border-sky-600/40 px-4 py-3 text-sm outline-none placeholder:text-slate-300/80 backdrop-blur-sm font-serif"
              />
              <button
                onClick={addChapter}
                className="px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm min-w-[84px]"
              >
                Add
              </button>
            </div>
            <div className="text-xs text-slate-300/90">
              Press <b>Enter</b> to add • <b>Ctrl+S</b> to save • <b>Ctrl+N</b> for new chapter
              {searchTerm && (
                <span> • Showing {filteredChapters.length} of {chapters.length} chapters</span>
              )}
            </div>
          </div>
        </div>

        {/* Chapters list */}
        <div className="mt-6 space-y-4">
          {filteredChapters.length === 0 && searchTerm ? (
            <div className="rounded-3xl bg-sky-900/40 backdrop-blur-xl text-white shadow-2xl border border-sky-700/40 p-8 text-center">
              <Search className="mx-auto mb-3 text-slate-300" size={32} />
              <div className="text-lg font-medium mb-1">No chapters found</div>
              <div className="text-sm text-slate-300/90">
                Try adjusting your search term or clear the search to see all chapters.
              </div>
            </div>
          ) : (
            filteredChapters.map((ch) => {
              const words = countWords(ch.content || "");
              const readTime = getReadingTime(words);
              const isOpen = open.has(ch.id);
              const loading = busyIds.has(ch.id);

              return (
                <div
                  key={ch.id}
                  className="rounded-3xl bg-sky-900/40 backdrop-blur-xl text-white shadow-2xl border border-sky-700/40 overflow-hidden"
                >
                  <div className="px-5 py-4 flex items-start gap-3">
                    <button
                      onClick={() => toggleOpen(ch.id)}
                      className="mt-0.5 shrink-0 p-2 rounded-lg bg-sky-800/40 hover:bg-sky-800/60 backdrop-blur-sm"
                      title={isOpen ? "Collapse" : "Expand"}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold truncate">{ch.title}</div>
                        <div className="text-xs text-slate-200/90 flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1">
                            <FileText size={14} /> {words} words
                            {readTime > 0 && ` • ${readTime}m`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {formatWhen(ch.updatedAt)}
                          </span>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => duplicateChapter(ch.id)}
                              className="p-1 rounded hover:bg-slate-700/60"
                              title="Duplicate chapter"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => setShowConfirm(ch.id)}
                              className="p-1 rounded hover:bg-red-500/20 text-red-300"
                              title="Delete chapter"
                            >
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={() => generateOne(ch.id)}
                              disabled={loading}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100"
                              title="Generate/regenerate AI synopsis"
                            >
                              {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              {loading ? "…" : "AI"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="mt-3 text-sm text-slate-200/95">
                          {/* Editable title */}
                          <div className="mb-3">
                            <div className="text-xs text-slate-300/90 mb-1">Chapter title</div>
                            <input
                              value={ch.title}
                              onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg bg-sky-800/30 border border-sky-600/40 text-sm outline-none backdrop-blur-sm font-serif"
                            />
                          </div>

                          {/* AI Synopsis */}
                          <div className="mb-4">
                            <div className="font-medium mb-1 text-slate-100">AI Synopsis</div>
                            <div className="rounded-lg bg-sky-800/30 border border-sky-600/40 p-3 backdrop-blur-sm">
                              {ch.synopsis ? (
                                ch.synopsis
                              ) : (
                                <span className="opacity-70">No synopsis yet. Click "AI" to generate.</span>
                              )}
                            </div>
                          </div>

                          {/* Chapter content */}
                          <div>
                            <div className="flex items-center gap-2 text-slate-300/90 text-xs mb-1">
                              <ListTree size={14} />
                              <span>Chapter content</span>
                            </div>
                            <textarea
                              value={ch.content}
                              onChange={(e) => updateChapter(ch.id, { content: e.target.value })}
                              placeholder="Draft your chapter content here…"
                              className="w-full min-h-[120px] rounded-lg bg-sky-800/30 border border-sky-600/40 px-3 py-2 text-sm outline-none placeholder:text-slate-300/70 resize-y backdrop-blur-sm font-serif"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete confirmation modal */}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-sky-950/90 backdrop-blur-xl rounded-3xl p-6 max-w-md w-full border border-sky-800/40 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-300" size={20} />
                <div className="text-lg font-semibold text-white">Delete Chapter</div>
              </div>
              <div className="text-slate-200 mb-6">
                Are you sure you want to delete "
                {chapters.find((ch) => ch.id === showConfirm)?.title}"? This action cannot be undone.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteChapter(showConfirm)}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
