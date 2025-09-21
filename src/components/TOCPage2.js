import React from "react";
import {
  BookOpen, Plus, FileText, Clock, Sparkles, Loader2,
  ChevronRight, ChevronDown, Search, X, Trash2, Copy, Download,
  Save, AlertCircle, ArrowUp, ArrowDown, Star, StarOff, Upload, Target,
  Tag, Flame, Moon, Sun, Minimize2, Maximize2, TrendingUp, Award
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Small helpers
──────────────────────────────────────────────────────────────── */
const WORDS_PER_MIN = 200;
const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;
const readingMins = (wc) => Math.ceil(wc / WORDS_PER_MIN);
const progressPct = (cur, tgt) => Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);
const truncateWords = (s = "", n = 40) =>
  s.split(/\s+/).slice(0, n).join(" ") + (countWords(s) > n ? "…" : "");
const daysAgoLabel = (ts) => {
  const d = Math.round((Date.now() - ts) / 86400000);
  if (d <= 0) return "Updated today";
  if (d === 1) return "Updated 1 day ago";
  return `Updated ${d} days ago`;
};
const todayKey = () => new Date().toISOString().slice(0, 10);
const yesterdayKey = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};

/* ──────────────────────────────────────────────────────────────
   Storage + Export/Import
──────────────────────────────────────────────────────────────── */
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      book: { title: "Untitled", targetWords: 25000, ...(parsed.book || {}) },
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
      daily: parsed.daily || { goal: 500, counts: {} },
      settings: { theme: 'dark', focusMode: false, ...(parsed.settings || {}) },
    };
  } catch {
    return null;
  }
};
const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const exportText = (book, chapters) => {
  const total = chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0);
  const body = [
    `${book.title}\n${"=".repeat(book.title.length)}`,
    `Total words: ${total.toLocaleString()}`,
    `Chapters: ${chapters.length}\n`,
    ...chapters.map((ch) =>
      [
        `${ch.title}\n${"-".repeat(ch.title.length)}`,
        ch.synopsis ? `Synopsis: ${ch.synopsis}\n` : "",
        ch.content || "(No content yet)\n",
      ].filter(Boolean).join("\n")
    ),
  ].join("\n");
  const blob = new Blob([body], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${book.title.replace(/[^a-z0-9]+/gi, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const exportJSON = (state) => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "dahtruth_toc_backup.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

/* ──────────────────────────────────────────────────────────────
   AI Summarizer
──────────────────────────────────────────────────────────────── */
async function summarizeLocal(text = "") {
  if (!text) return "No content yet — add some text to this chapter.";
  const first = text.split(/(?<=[.?!])\s+/)[0];
  if (first && countWords(first) >= 8) return first;
  return truncateWords(text, 40);
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
      console.warn("Remote summarizer failed, falling back:", e);
    }
  }
  return summarizeLocal(content);
}

/* ──────────────────────────────────────────────────────────────
   Templates + Tags
──────────────────────────────────────────────────────────────── */
const TEMPLATES = {
  "Blank": { title: "", content: "" },
  "Scene (POV)": {
    title: "New Scene",
    content: `# Setting\n\n# Characters\n\n# Goal/Conflict\n\n# Beats\n- \n- \n- \n\n# Exit/Hook`,
  },
  "Action Beat": {
    title: "Action Beat",
    content: "The room explodes into motion. Describe fast, concrete actions in short sentences.",
  },
  "Reflection": {
    title: "Reflection",
    content: "After the turning point, the POV character processes the event. What changed internally?",
  },
  "Dialogue Heavy": {
    title: "Dialogue Scene", 
    content: `"We need to talk," [Character A] said.\n\n[Character B] looked up from [action]. "About what?"\n\n"You know what."`
  },
};

const PREDEFINED_TAGS = [
  "Action", "Romance", "Conflict", "Backstory", "Climax", "Setup", "Payoff", 
  "Character Development", "World Building", "Humor", "Tension", "Resolution"
];

/* ──────────────────────────────────────────────────────────────
   Writing Streak Calculator
──────────────────────────────────────────────────────────────── */
const calculateStreak = (daily) => {
  const { goal, counts } = daily;
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) { // max 1 year lookback
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    
    if ((counts[key] || 0) >= goal) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

/* ──────────────────────────────────────────────────────────────
   Animated Blobs Component
──────────────────────────────────────────────────────────────── */
function DecorBlobs() {
  return (
    <div className="absolute inset-0 opacity-15">
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   UI Helper Components
──────────────────────────────────────────────────────────────── */
function Banner({ children, ok }) {
  return (
    <div className={`mb-6 p-4 rounded-xl flex items-center backdrop-blur-sm border ${ok ? 'bg-green-500/20 border-green-400/30 text-green-100' : 'bg-red-500/20 border-red-400/30 text-red-100'}`}>
      {ok ? <CheckCircle className="h-5 w-5 mr-2" /> : <X className="h-5 w-5 mr-2" />}
      <span className="text-sm font-serif">{children}</span>
    </div>
  );
}

function Input({ leftIcon, className = '', ...props }) {
  return (
    <div className="relative group">
      {leftIcon ? <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-300">{leftIcon}</div> : null}
      <input
        {...props}
        className={`w-full ${leftIcon ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-blue-900/30 border border-blue-700/50 rounded-xl 
          text-white placeholder-blue-300 backdrop-blur-sm
          focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40
          transition-all duration-300 font-serif ${className}`}
      />
    </div>
  );
}

function Button({ children, loading, grad, ...rest }) {
  const base = grad
    ? 'bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400'
    : 'bg-indigo-600 hover:bg-indigo-500';
  return (
    <button
      {...rest}
      disabled={loading}
      className={`w-full ${base} text-white py-4 px-6 rounded-xl font-serif font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-xl hover:shadow-2xl hover:scale-105`}
    >
      {loading ? <Loader2 className="animate-spin h-6 w-6 mr-2" /> : null}
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function TOCPage2() {
  // Initial state
  const initial = loadState() || {
    book: { title: "Jacque is a rock star!!", targetWords: 25000 },
    chapters: [
      { 
        id: 1, title: "Chapter 1", content: "", synopsis: "", bookmarked: false, 
        updatedAt: Date.now() - 172800000, tags: [], wordGoal: 2000 
      },
      { 
        id: 2, title: "Chapter 2", content: "", synopsis: "", bookmarked: false, 
        updatedAt: Date.now() - 172800000, tags: [], wordGoal: 2000 
      },
      { 
        id: 3, title: "Chapter 3", content: "", synopsis: "", bookmarked: false, 
        updatedAt: Date.now() - 172800000, tags: [], wordGoal: 2000 
      },
    ],
    daily: { goal: 500, counts: {} },
    settings: { theme: 'dark', focusMode: false },
  };

  const [book, setBook] = React.useState(initial.book);
  const [chapters, setChapters] = React.useState(initial.chapters);
  const [daily, setDaily] = React.useState(initial.daily);
  const [settings, setSettings] = React.useState(initial.settings);

  // UI state
  const [search, setSearch] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");
  const [onlyBookmarked, setOnlyBookmarked] = React.useState(false);
  const [openIds, setOpenIds] = React.useState(() => new Set());
  const [busyIds, setBusyIds] = React.useState(new Set());
  const [confirmDeleteId, setConfirmDeleteId] = React.useState(null);
  const [quickTitle, setQuickTitle] = React.useState("");
  const [templateKey, setTemplateKey] = React.useState("Blank");
  const [lastSaved, setLastSaved] = React.useState(Date.now());
  const [showAnalytics, setShowAnalytics] = React.useState(false);

  // Undo/Redo stacks
  const [past, setPast] = React.useState([]);
  const [future, setFuture] = React.useState([]);
  const ignoreHistoryRef = React.useRef(false);

  // Track total words for daily diffing
  const prevTotalRef = React.useRef(
    chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0)
  );

  // Debounced auto-save
  React.useEffect(() => {
    const timer = setTimeout(() => {
      saveState({ book, chapters, daily, settings });
      setLastSaved(Date.now());
    }, 1200);
    return () => clearTimeout(timer);
  }, [book, chapters, daily, settings]);

  // Hard auto-save fallback every 30s
  React.useEffect(() => {
    const iv = setInterval(() => {
      saveState({ book, chapters, daily, settings });
      setLastSaved(Date.now());
    }, 30000);
    return () => clearInterval(iv);
  }, [book, chapters, daily, settings]);

  // History push on meaningful changes
  const commitSnapshot = React.useCallback((next) => {
    if (ignoreHistoryRef.current) return;
    setPast((p) => [...p.slice(-24), { book, chapters, daily, settings }]);
    setFuture([]);
    if (next) {
      setBook(next.book ?? book);
      setChapters(next.chapters ?? chapters);
      setDaily(next.daily ?? daily);
      setSettings(next.settings ?? settings);
    }
  }, [book, chapters, daily, settings]);

  const undo = () => {
    if (!past.length) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ book, chapters, daily, settings }, ...f].slice(0, 25));
    ignoreHistoryRef.current = true;
    setBook(prev.book);
    setChapters(prev.chapters);
    setDaily(prev.daily);
    setSettings(prev.settings);
    setTimeout(() => { ignoreHistoryRef.current = false; }, 0);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p.slice(-24), { book, chapters, daily, settings }]);
    ignoreHistoryRef.current = true;
    setBook(next.book);
    setChapters(next.chapters);
    setDaily(next.daily);
    setSettings(next.settings);
    setTimeout(() => { ignoreHistoryRef.current = false; }, 0);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key.toLowerCase() === "s") { e.preventDefault(); saveState({ book, chapters, daily, settings }); setLastSaved(Date.now()); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); addChapter(); }
      if (e.key.toLowerCase() === "z") { e.preventDefault(); undo(); }
      if (e.key.toLowerCase() === "y") { e.preventDefault(); redo(); }
      if (e.key.toLowerCase() === "f") { e.preventDefault(); setSettings(s => ({ ...s, focusMode: !s.focusMode })); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, chapters, daily, settings, past, future]); // eslint-disable-line

  // Daily tracker
  React.useEffect(() => {
    const nowTotal = chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0);
    const delta = nowTotal - prevTotalRef.current;
    prevTotalRef.current = nowTotal;
    if (delta > 0) {
      const key = todayKey();
      setDaily((d) => ({ ...d, counts: { ...d.counts, [key]: (d.counts[key] || 0) + delta } }));
    }
  }, [chapters]);

  /* ────────────── Data derivations ────────────── */
  const totalWords = chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0);
  const readTime = readingMins(totalWords);
  const pct = progressPct(totalWords, book.targetWords);
  const streak = calculateStreak(daily);

  // Get all unique tags from chapters
  const allTags = [...new Set(chapters.flatMap(ch => ch.tags || []))].sort();

  const filtered = chapters.filter((c) => {
    if (onlyBookmarked && !c.bookmarked) return false;
    if (tagFilter && !(c.tags || []).includes(tagFilter)) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(s) ||
      (c.synopsis || "").toLowerCase().includes(s) ||
      (c.content || "").toLowerCase().includes(s) ||
      (c.tags || []).some(tag => tag.toLowerCase().includes(s))
    );
  });

  /* ────────────── Actions ────────────── */
  const addChapter = (tplKey = templateKey) => {
    const tpl = TEMPLATES[tplKey] || TEMPLATES.Blank;
    const title = (quickTitle || tpl.title || `Chapter ${chapters.length + 1}`).trim();
    const next = {
      id: Date.now(),
      title: title || `Chapter ${chapters.length + 1}`,
      content: tpl.content || "",
      synopsis: "",
      bookmarked: false,
      tags: [],
      wordGoal: 2000,
      updatedAt: Date.now(),
    };
    commitSnapshot({
      chapters: [next, ...chapters],
    });
    setQuickTitle("");
  };

  const duplicateChapter = (id) => {
    const i = chapters.findIndex((c) => c.id === id);
    if (i < 0) return;
    const orig = chapters[i];
    const dup = { ...orig, id: Date.now(), title: `${orig.title} (Copy)`, updatedAt: Date.now() };
    const next = [...chapters.slice(0, i + 1), dup, ...chapters.slice(i + 1)];
    commitSnapshot({ chapters: next });
  };

  const deleteChapter = (id) => {
    commitSnapshot({ chapters: chapters.filter((c) => c.id !== id) });
    setConfirmDeleteId(null);
  };

  const updateChapter = (id, patch) => {
    commitSnapshot({
      chapters: chapters.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c)),
    });
  };

  const moveUp = (id) => {
    const i = chapters.findIndex((c) => c.id === id);
    if (i < 1) return;
    const next = chapters.slice();
    const tmp = next[i - 1];
    next[i - 1] = next[i];
    next[i] = tmp;
    commitSnapshot({ chapters: next });
  };

  const moveDown = (id) => {
    const i = chapters.findIndex((c) => c.id === id);
    if (i < 0 || i >= chapters.length - 1) return;
    const next = chapters.slice();
    const tmp = next[i + 1];
    next[i + 1] = next[i];
    next[i] = tmp;
    commitSnapshot({ chapters: next });
  };

  const toggleOpen = (id) =>
    setOpenIds((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleBookmark = (id) =>
    updateChapter(id, { bookmarked: !chapters.find((c) => c.id === id)?.bookmarked });

  const generateOne = async (id) => {
    setBusyIds((b) => new Set(b).add(id));
    try {
      const current = chapters.find((c) => c.id === id);
      const summary = await summarize(current?.content || "");
      updateChapter(id, { synopsis: summary });
    } finally {
      setBusyIds((b) => {
        const n = new Set(b); n.delete(id); return n;
      });
    }
  };

  const generateAll = async () => {
    const pending = chapters.filter((c) => !c.synopsis);
    const batchSize = 3;
    for (let i = 0; i < pending.length; i += batchSize) {
      await Promise.all(pending.slice(i, i + batchSize).map((c) => generateOne(c.id)));
    }
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        if (!json || !json.book || !Array.isArray(json.chapters)) throw new Error("Invalid backup file");
        commitSnapshot({
          book: { title: json.book.title || "Untitled", targetWords: json.book.targetWords || 25000 },
          chapters: json.chapters.map((c) => ({
            id: c.id || Date.now() + Math.random(),
            title: c.title || "Untitled",
            content: c.content || "",
            synopsis: c.synopsis || "",
            bookmarked: !!c.bookmarked,
            tags: Array.isArray(c.tags) ? c.tags : [],
            wordGoal: c.wordGoal || 2000,
            updatedAt: c.updatedAt || Date.now(),
          })),
          daily: json.daily && json.daily.goal && json.daily.counts ? json.daily : daily,
          settings: json.settings || settings,
        });
      } catch (e) {
        alert("Could not import file. " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const addTagToChapter = (chapterId, tag) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter || (chapter.tags || []).includes(tag)) return;
    updateChapter(chapterId, { tags: [...(chapter.tags || []), tag] });
  };

  const removeTagFromChapter = (chapterId, tag) => {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, { tags: (chapter.tags || []).filter(t => t !== tag) });
  };

  /* ────────────── Render ────────────── */
  const today = todayKey();
  const yesterday = yesterdayKey();
  const todayCount = daily.counts[today] || 0;
  const yesterdayCount = daily.counts[yesterday] || 0;
  const goalPct = progressPct(todayCount, daily.goal);

  // Focus mode - simplified interface with your beautiful styling
  if (settings.focusMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-8 relative overflow-hidden">
        <DecorBlobs />
        <div className="relative z-10 mx-auto max-w-4xl px-4">
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white font-serif">{book.title}</h1>
              <button
                onClick={() => setSettings(s => ({ ...s, focusMode: false }))}
                className="p-3 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Exit focus mode (Ctrl/Cmd+F)"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {chapters.map(ch => (
              <div key={ch.id} className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8">
                <div className="text-xl font-bold text-white font-serif mb-4">{ch.title}</div>
                <textarea
                  value={ch.content}
                  onChange={(e) => updateChapter(ch.id, { content: e.target.value })}
                  placeholder="Write your chapter content here..."
                  className="w-full min-h-[200px] bg-blue-900/30 border border-blue-700/50 rounded-xl text-white placeholder-blue-300 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:bg-blue-900/40 transition-all duration-300 font-serif px-4 py-4 resize-vertical outline-none"
                />
                <div className="mt-3 text-sm text-blue-200 font-serif">
                  {countWords(ch.content)} words
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 py-8 relative overflow-hidden">
      <DecorBlobs />
      <div className="relative z-10 mx-auto max-w-5xl px-4">

        {/* Top banner */}
        <div className="rounded-3xl bg-gradient-to-r from-slate-900/90 via-indigo-900/90 to-slate-900/90 backdrop-blur-xl text-white shadow-2xl border border-blue-800/40">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/30 backdrop-blur-sm flex items-center justify-center border border-blue-400/30">
                <BookOpen size={24} />
              </div>
              <h1 className="text-4xl font-bold drop-shadow-lg font-serif">
                Table of Contents
              </h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSettings(s => ({ ...s, focusMode: true }))}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600/30 border border-purple-400/30 hover:bg-purple-600/40 text-purple-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Focus mode (Ctrl/Cmd+F)"
              >
                <Minimize2 size={16} /> Focus
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-teal-600/30 border border-teal-400/30 hover:bg-teal-600/40 text-teal-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Writing analytics"
              >
                <TrendingUp size={16} /> Analytics
              </button>
              <button
                onClick={() => { saveState({ book, chapters, daily, settings }); setLastSaved(Date.now()); }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-green-600/30 border border-green-400/30 hover:bg-green-600/40 text-green-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Save now (Ctrl/Cmd+S)"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => exportText(book, chapters)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-600/30 border border-blue-400/30 hover:bg-blue-600/40 text-blue-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Export as .txt"
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={() => exportJSON({ book, chapters, daily, settings })}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Export backup JSON"
              >
                <Download size={16} /> Backup
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-600/30 border border-slate-400/30 hover:bg-slate-600/40 text-slate-100 text-sm font-serif cursor-pointer backdrop-blur-sm transition-all duration-300 hover:scale-105">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && importJSON(e.target.files[0])}
                />
              </label>
              <button
                onClick={generateAll}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-purple-600/30 border border-purple-400/30 hover:bg-purple-600/40 text-purple-100 text-sm font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                title="Generate AI synopses"
              >
                <Sparkles size={16} /> AI Synopses
              </button>
              <button
                onClick={() => addChapter()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-serif shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                title="New chapter (Ctrl/Cmd+N)"
              >
                <Plus size={16} /> New Chapter
              </button>
            </div>
          </div>
        </div>

        {/* Analytics panel */}
        {showAnalytics && (
          <div className="mt-6 rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center">
                <TrendingUp className="text-indigo-300" size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white font-serif">Writing Analytics</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-blue-900/30 border border-blue-700/50 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white font-serif">{streak}</div>
                <div className="text-sm text-blue-200 font-serif mt-1">Day streak</div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Flame className="text-orange-400" size={16} />
                    <span className="text-orange-300 text-xs font-serif">On fire!</span>
                  </div>
                )}
              </div>
              <div className="p-6 rounded-2xl bg-blue-900/30 border border-blue-700/50 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white font-serif">{todayCount}</div>
                <div className="text-sm text-blue-200 font-serif mt-1">Words today</div>
              </div>
              <div className="p-6 rounded-2xl bg-blue-900/30 border border-blue-700/50 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white font-serif">{yesterdayCount}</div>
                <div className="text-sm text-blue-200 font-serif mt-1">Words yesterday</div>
              </div>
              <div className="p-6 rounded-2xl bg-blue-900/30 border border-blue-700/50 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white font-serif">{chapters.filter(c => c.bookmarked).length}</div>
                <div className="text-sm text-blue-200 font-serif mt-1">Bookmarked</div>
              </div>
            </div>
          </div>
        )}

        {/* Book + goals */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Book banner */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <input
                  value={book.title}
                  onChange={(e) => commitSnapshot({ book: { ...book, title: e.target.value } })}
                  className="w-full bg-transparent text-2xl font-bold text-white font-serif outline-none border-b border-transparent focus:border-blue-400/50 transition-colors"
                />
                <div className="text-blue-200 font-serif mt-3">
                  {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()} words
                  {readTime > 0 && ` • ~${readTime} min read`}
                </div>
                <div className="mt-4 w-full bg-blue-900/50 rounded-full h-3 backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-indigo-500 to-teal-500 h-3 rounded-full transition-all duration-700 shadow-lg" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="text-xs text-blue-300 font-serif mt-2">
                  {pct.toFixed(1)}% complete • Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-white font-serif">{chapters.length}</div>
                <div className="text-xs uppercase tracking-wider text-blue-300 font-serif">Chapters</div>
                <div className="mt-4 text-xs text-blue-300 font-serif">
                  Target words
                  <input
                    type="number"
                    min={1}
                    value={book.targetWords}
                    onChange={(e) => commitSnapshot({ book: { ...book, targetWords: Number(e.target.value) || 1 } })}
                    className="w-24 mt-2 rounded-xl bg-blue-900/60 border border-blue-700/50 px-3 py-2 text-right text-white font-serif backdrop-blur-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Daily goal + streak */}
          <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center">
                <Target className="text-indigo-300" size={20} />
              </div>
              <div className="text-xl font-bold text-white font-serif">Daily Goal</div>
              {streak > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <Flame className="text-orange-400" size={20} />
                  <span className="text-orange-300 font-serif font-medium">{streak} day{streak !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
            <div className="text-blue-200 font-serif mb-4">
              Today: <span className="font-bold text-white">{todayCount.toLocaleString()}</span> / {daily.goal.toLocaleString()} words
            </div>
            <div className="w-full bg-blue-900/50 rounded-full h-3 backdrop-blur-sm">
              <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-700 shadow-lg" style={{ width: `${goalPct}%` }}></div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-blue-300 font-serif">Set goal:</span>
              <input
                type="number"
                min={100}
                step={100}
                value={daily.goal}
                onChange={(e) => commitSnapshot({ daily: { ...daily, goal: Math.max(100, Number(e.target.value) || 100) } })}
                className="rounded-xl bg-blue-900/60 border border-blue-700/50 px-3 py-2 text-white font-serif backdrop-blur-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
              />
            </div>
          </div>
        </div>

        {/* Search / filters / quick add + template */}
        <div className="mt-6 rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-8">
          <div className="space-y-6">
            {/* Search row */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300">
                  <Search size={20} />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chapters by title, content, synopsis, or tags…"
                  className="w-full pl-12 pr-6 py-4 rounded-xl bg-blue-900/30 border border-blue-700/50 text-white placeholder-blue-300 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 font-serif outline-none"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300 hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                {allTags.length > 0 && (
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-4 text-white backdrop-blur-sm font-serif outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                  >
                    <option value="">All tags</option>
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                )}
                <label className="inline-flex items-center gap-3 text-blue-200 font-serif cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyBookmarked}
                    onChange={(e) => setOnlyBookmarked(e.target.checked)}
                    className="accent-indigo-500 w-4 h-4"
                  />
                  Bookmarked
                </label>
              </div>
            </div>

            {/* Quick add + template */}
            <div className="flex flex-col lg:flex-row gap-4">
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }}
                placeholder="Quick add: Chapter title…"
                className="flex-1 rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-4 text-white placeholder-blue-300 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 font-serif outline-none"
              />
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="rounded-xl bg-blue-900/30 border border-blue-700/50 px-4 py-4 text-white backdrop-blur-sm font-serif outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
              >
                {Object.keys(TEMPLATES).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <button
                onClick={() => addChapter()}
                className="px-8 py-4 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-serif font-bold shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl backdrop-blur-sm"
              >
                Add Chapter
              </button>
            </div>

            <div className="text-xs text-blue-300 font-serif">
              <span className="font-bold">Shortcuts:</span> Ctrl/Cmd+S save • Ctrl/Cmd+N new • Ctrl/Cmd+Z undo • Ctrl/Cmd+Y redo • Ctrl/Cmd+F focus mode
              {search && <span> • Showing {filtered.length} of {chapters.length}</span>}
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="mt-8 space-y-6">
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 p-12 text-center">
              <Search className="mx-auto mb-4 text-blue-300" size={48} />
              <div className="text-xl font-bold text-white font-serif mb-2">No chapters found</div>
              <div className="text-blue-200 font-serif">Try clearing the search or changing filters.</div>
            </div>
          ) : (
            filtered.map((ch) => {
              const words = countWords(ch.content || "");
              const mins = readingMins(words);
              const open = openIds.has(ch.id);
              const busy = busyIds.has(ch.id);
              const wordGoalPct = progressPct(words, ch.wordGoal || 2000);

              return (
                <div key={ch.id} className="rounded-3xl bg-blue-950/50 backdrop-blur-xl shadow-2xl border border-blue-800/40 overflow-hidden">
                  <div className="px-8 py-6 flex items-start gap-4">
                    <button
                      onClick={() => toggleOpen(ch.id)}
                      className="mt-1 shrink-0 p-3 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                      title={open ? "Collapse" : "Expand"}
                    >
                      {open ? <ChevronDown className="text-blue-300" size={20} /> : <ChevronRight className="text-blue-300" size={20} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xl font-bold text-white font-serif truncate">{ch.title}</div>
                        <div className="text-xs text-blue-200 flex items-center gap-4 shrink-0 font-serif">
                          <span className="flex items-center gap-2">
                            <FileText size={16} /> {words} words{mins ? ` • ${mins}m` : ""}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock size={16} /> {daysAgoLabel(ch.updatedAt)}
                          </span>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button onClick={() => moveUp(ch.id)} className="p-2 rounded-lg hover:bg-blue-700/50 text-blue-300 transition-all duration-300" title="Move up">
                              <ArrowUp size={16} />
                            </button>
                            <button onClick={() => moveDown(ch.id)} className="p-2 rounded-lg hover:bg-blue-700/50 text-blue-300 transition-all duration-300" title="Move down">
                              <ArrowDown size={16} />
                            </button>
                            <button onClick={() => toggleBookmark(ch.id)} className="p-2 rounded-lg hover:bg-blue-700/50 text-blue-300 transition-all duration-300" title={ch.bookmarked ? "Remove bookmark" : "Bookmark"}>
                              {ch.bookmarked ? <Star className="text-yellow-400" size={16} /> : <StarOff size={16} />}
                            </button>
                            <button onClick={() => duplicateChapter(ch.id)} className="p-2 rounded-lg hover:bg-blue-700/50 text-blue-300 transition-all duration-300" title="Duplicate">
                              <Copy size={16} />
                            </button>
                            <button onClick={() => setConfirmDeleteId(ch.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all duration-300" title="Delete">
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => generateOne(ch.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 font-serif transition-all duration-300 backdrop-blur-sm"
                              title="Generate/regenerate AI synopsis"
                            >
                              {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                              {busy ? "Generating…" : "AI Synopsis"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {(ch.tags || []).length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          {(ch.tags || []).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs bg-indigo-900/40 text-indigo-200 border border-indigo-700/50 backdrop-blur-sm font-serif">
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {open && (
                        <div className="mt-6 text-blue-200 font-serif">
                          {/* Title */}
                          <div className="mb-4">
                            <div className="text-xs text-blue-300 mb-2 font-serif">Chapter title</div>
                            <input
                              value={ch.title}
                              onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl bg-blue-900/30 border border-blue-700/50 text-white backdrop-blur-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 font-serif"
                            />
                          </div>

                          {/* Word goal */}
                          <div className="mb-4">
                            <div className="text-xs text-blue-300 mb-2 font-serif">Word goal for this chapter</div>
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                min={100}
                                step={100}
                                value={ch.wordGoal || 2000}
                                onChange={(e) => updateChapter(ch.id, { wordGoal: Number(e.target.value) || 2000 })}
                                className="w-32 rounded-xl bg-blue-900/60 border border-blue-700/50 px-3 py-2 text-white font-serif backdrop-blur-sm outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300"
                              />
                              <div className="flex-1 bg-blue-900/50 rounded-full h-3 backdrop-blur-sm">
                                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-700 shadow-lg" style={{ width: `${wordGoalPct}%` }}></div>
                              </div>
                              <span className="text-xs text-blue-300 font-serif">{wordGoalPct.toFixed(0)}%</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="mb-4">
                            <div className="text-xs text-blue-300 mb-2 font-serif">Tags</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(ch.tags || []).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-indigo-900/40 text-indigo-200 border border-indigo-700/50 backdrop-blur-sm font-serif">
                                  {tag}
                                  <button
                                    onClick={() => removeTagFromChapter(ch.id, tag)}
                                    className="hover:text-red-400 transition-colors"
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    addTagToChapter(ch.id, e.target.value);
                                    e.target.value = "";
                                  }
                                }}
                                className="text-xs rounded-lg bg-blue-900/30 border border-blue-700/50 px-3 py-2 text-white backdrop-blur-sm outline-none font-serif"
                              >
                                <option value="">Add tag...</option>
                                {PREDEFINED_TAGS.filter(tag => !(ch.tags || []).includes(tag)).map(tag => (
                                  <option key={tag} value={tag}>{tag}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Synopsis */}
                          <div className="mb-6">
                            <div className="font-bold mb-3 text-white font-serif text-lg">AI Synopsis</div>
                            <div className="rounded-2xl bg-blue-900/40 border border-blue-700/30 p-4 backdrop-blur-sm">
                              {ch.synopsis ? <p className="font-serif leading-relaxed">{ch.synopsis}</p> : <span className="opacity-60 font-serif">No synopsis yet. Click "AI Synopsis" to generate.</span>}
                            </div>
                          </div>

                          {/* Content */}
                          <div>
                            <div className="text-xs text-blue-300 mb-2 font-serif">Chapter content</div>
                            <textarea
                              value={ch.content}
                              onChange={(e) => updateChapter(ch.id, { content: e.target.value })}
                              placeholder="Draft your chapter content here…"
                              className="w-full min-h-[200px] rounded-2xl bg-blue-900/30 border border-blue-700/50 px-4 py-4 text-white placeholder-blue-300 backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-300 font-serif outline-none resize-vertical"
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
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-blue-950/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-blue-800/40 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-red-400" size={24} />
                <div className="text-xl font-bold text-white font-serif">Delete Chapter</div>
              </div>
              <div className="text-blue-200 font-serif mb-8 leading-relaxed">
                Are you sure you want to delete "{chapters.find(c => c.id === confirmDeleteId)?.title}"? This action cannot be undone.
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className="flex-1 px-6 py-3 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 text-white font-serif backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteChapter(confirmDeleteId)} 
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-serif shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
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
