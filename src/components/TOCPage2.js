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

  // Theme classes
  const isDark = settings.theme === 'dark';
  const themeClasses = {
    bg: isDark ? 'bg-[#e9f0fa]' : 'bg-slate-100',
    cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    headerBg: isDark ? 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900' : 'bg-gradient-to-r from-slate-700 via-indigo-700 to-slate-700',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-600',
    textVeryMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    inputBg: isDark ? 'bg-slate-900/60' : 'bg-slate-50',
    inputBorder: isDark ? 'border-white/10' : 'border-slate-300',
  };

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

  // Focus mode - simplified interface
  if (settings.focusMode) {
    return (
      <div className={`min-h-screen ${themeClasses.bg} py-8`}>
        <div className="mx-auto max-w-4xl px-4">
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-6 mb-6`}>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">{book.title}</h1>
              <button
                onClick={() => setSettings(s => ({ ...s, focusMode: false }))}
                className="p-2 rounded-lg hover:bg-slate-700 text-slate-400"
                title="Exit focus mode (Ctrl/Cmd+F)"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {chapters.map(ch => (
              <div key={ch.id} className={`rounded-xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-4`}>
                <div className="text-lg font-semibold mb-3">{ch.title}</div>
                <textarea
                  value={ch.content}
                  onChange={(e) => updateChapter(ch.id, { content: e.target.value })}
                  placeholder="Write your chapter content here..."
                  className={`w-full min-h-[200px] ${themeClasses.inputBg} border ${themeClasses.inputBorder} rounded-lg px-3 py-2 text-sm outline-none resize-vertical`}
                />
                <div className={`mt-2 text-xs ${themeClasses.textVeryMuted}`}>
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
    <div className={`min-h-screen ${themeClasses.bg} py-8`}>
      <div className="mx-auto max-w-5xl px-4">

        {/* Top banner */}
        <div className={`rounded-2xl ${themeClasses.headerBg} text-white shadow-xl border border-white/10`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <h1 className="text-3xl font-extrabold drop-shadow-sm">
                Table of Contents
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSettings(s => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))}
                className="p-3 lg:p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                title="Toggle theme"
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                onClick={() => setSettings(s => ({ ...s, focusMode: true }))}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/30 border border-purple-400/30 hover:bg-purple-600/40 text-purple-100 text-sm"
                title="Focus mode (Ctrl/Cmd+F)"
              >
                <Minimize2 size={16} /> Focus
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-teal-600/30 border border-teal-400/30 hover:bg-teal-600/40 text-teal-100 text-sm"
                title="Writing analytics"
              >
                <TrendingUp size={16} /> Analytics
              </button>
              <button
                onClick={() => { saveState({ book, chapters, daily, settings }); setLastSaved(Date.now()); }}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600/30 border border-green-400/30 hover:bg-green-600/40 text-green-100 text-sm"
                title="Save now (Ctrl/Cmd+S)"
              >
                <Save size={16} /> <span className="hidden sm:inline">Save</span>
              </button>
              <button
                onClick={() => exportText(book, chapters)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600/30 border border-blue-400/30 hover:bg-blue-600/40 text-blue-100 text-sm"
                title="Export as .txt"
              >
                <Download size={16} /> <span className="hidden sm:inline">.txt</span>
              </button>
              <button
                onClick={() => exportJSON({ book, chapters, daily, settings })}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm"
                title="Export backup JSON"
              >
                <Download size={16} /> <span className="hidden sm:inline">.json</span>
              </button>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-600/30 border border-slate-400/30 hover:bg-slate-600/40 text-slate-100 text-sm cursor-pointer">
                <Upload size={16} /> <span className="hidden sm:inline">Import</span>
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) => e.target.files && e.target.files[0] && importJSON(e.target.files[0])}
                />
              </label>
              <button
                onClick={generateAll}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/30 border border-purple-400/30 hover:bg-purple-600/40 text-purple-100 text-sm"
                title="Generate AI synopses"
              >
                <Sparkles size={16} /> <span className="hidden sm:inline">AI</span>
              </button>
              <button
                onClick={() => addChapter()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm shadow"
                title="New chapter (Ctrl/Cmd+N)"
              >
                <Plus size={16} /> <span className="hidden sm:inline">New</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics panel */}
        {showAnalytics && (
          <div className={`mt-4 rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-6`}>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-indigo-400" size={20} />
              <h2 className="text-lg font-semibold">Writing Analytics</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`p-4 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder}`}>
                <div className="text-2xl font-bold">{streak}</div>
                <div className={`text-sm ${themeClasses.textMuted}`}>Day streak</div>
              </div>
              <div className={`p-4 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder}`}>
                <div className="text-2xl font-bold">{todayCount}</div>
                <div className={`text-sm ${themeClasses.textMuted}`}>Words today</div>
              </div>
              <div className={`p-4 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder}`}>
                <div className="text-2xl font-bold">{yesterdayCount}</div>
                <div className={`text-sm ${themeClasses.textMuted}`}>Words yesterday</div>
              </div>
              <div className={`p-4 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder}`}>
                <div className="text-2xl font-bold">{chapters.filter(c => c.bookmarked).length}</div>
                <div className={`text-sm ${themeClasses.textMuted}`}>Bookmarked</div>
              </div>
            </div>
          </div>
        )}

        {/* Book + goals */}
        <div className="mt-4 grid lg:grid-cols-2 gap-4">
          {/* Book banner */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
            <div className="px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <input
                    value={book.title}
                    onChange={(e) => commitSnapshot({ book: { ...book, title: e.target.value } })}
                    className={`w-full bg-transparent text-xl font-semibold outline-none border-b border-transparent focus:border-current`}
                  />
                  <div className={`text-sm ${themeClasses.textMuted} mt-1`}>
                    {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()} words
                    {readTime > 0 && ` • ~${readTime} min read`}
                  </div>
                  <div className={`mt-2 w-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded-full h-2`}>
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className={`text-xs ${themeClasses.textVeryMuted} mt-1`}>
                    {pct.toFixed(1)}% complete • Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
                  </div>
                </div>
                <div className="w-40 shrink-0">
                  <div className="text-3xl font-extrabold text-right">{chapters.length}</div>
                  <div className={`text-xs uppercase tracking-wide text-right ${themeClasses.textMuted}`}>Chapters</div>
                  <div className={`mt-3 text-xs text-right ${themeClasses.textVeryMuted}`}>
                    Target words
                    <input
                      type="number"
                      min={1}
                      value={book.targetWords}
                      onChange={(e) => commitSnapshot({ book: { ...book, targetWords: Number(e.target.value) || 1 } })}
                      className={`w-full mt-1 rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-2 py-1 text-right outline-none`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily goal + streak */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-2">
                <Target size={18} className="text-indigo-400" />
                <div className="text-lg font-semibold">Daily Goal</div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 ml-auto">
                    <Flame className="text-orange-400" size={16} />
                    <span className="text-sm font-medium">{streak} day{streak !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div className={`text-sm ${themeClasses.textMuted} mb-2`}>
                Today: <b>{todayCount.toLocaleString()}</b> / {daily.goal.toLocaleString()} words
              </div>
              <div className={`w-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded-full h-2`}>
                <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${goalPct}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs ${themeClasses.textVeryMuted}`}>Set goal:</span>
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={daily.goal}
                  onChange={(e) => commitSnapshot({ daily: { ...daily, goal: Math.max(100, Number(e.target.value) || 100) } })}
                  className={`w-28 rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-2 py-1 text-sm outline-none`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Search / filters / quick add + template */}
        <div className={`mt-4 rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
          <div className="px-6 py-4 space-y-4">
            {/* Search row */}
            <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${themeClasses.textVeryMuted}`} size={16} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chapters by title, content, synopsis, or tags…"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder} text-sm outline-none`}
                />
                {search && (
                  <button onClick={() => setSearch("")} className={`absolute right-3 top-1/2 -translate-y-1/2 ${themeClasses.textVeryMuted} hover:${themeClasses.text}`}>
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                {allTags.length > 0 && (
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className={`rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-3 text-sm outline-none`}
                  >
                    <option value="">All tags</option>
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                  </select>
                )}
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyBookmarked}
                    onChange={(e) => setOnlyBookmarked(e.target.checked)}
                    className="accent-indigo-500"
                  />
                  Bookmarked
                </label>
              </div>
            </div>

            {/* Quick add + template */}
            <div className="flex flex-col lg:flex-row gap-3">
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }}
                placeholder="Quick add: Chapter title…"
                className={`flex-1 rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-4 py-3 text-sm outline-none`}
              />
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className={`rounded-xl ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-3 text-sm outline-none`}
              >
                {Object.keys(TEMPLATES).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <button
                onClick={() => addChapter()}
                className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm min-w-[120px]"
              >
                Add Chapter
              </button>
            </div>

            <div className={`text-xs ${themeClasses.textVeryMuted}`}>
              <b>Shortcuts:</b> Ctrl/Cmd+S save • Ctrl/Cmd+N new • Ctrl/Cmd+Z undo • Ctrl/Cmd+Y redo • Ctrl/Cmd+F focus mode
              {search && <span> • Showing {filtered.length} of {chapters.length}</span>}
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-8 text-center`}>
              <Search className={`mx-auto mb-3 ${themeClasses.textVeryMuted}`} size={32} />
              <div className="text-lg font-medium mb-1">No chapters found</div>
              <div className={`text-sm ${themeClasses.textMuted}`}>Try clearing the search or changing filters.</div>
            </div>
          ) : (
            filtered.map((ch) => {
              const words = countWords(ch.content || "");
              const mins = readingMins(words);
              const open = openIds.has(ch.id);
              const busy = busyIds.has(ch.id);
              const wordGoalPct = progressPct(words, ch.wordGoal || 2000);

              return (
                <div key={ch.id} className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} overflow-hidden`}>
                  <div className="px-5 py-4 flex items-start gap-3">
                    <button
                      onClick={() => toggleOpen(ch.id)}
                      className={`mt-0.5 shrink-0 p-3 lg:p-2 rounded-lg ${isDark ? 'bg-slate-900/40 hover:bg-slate-900/60' : 'bg-slate-100 hover:bg-slate-200'}`}
                      title={open ? "Collapse" : "Expand"}
                    >
                      {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-lg font-semibold truncate">{ch.title}</div>
                        <div className={`text-xs ${themeClasses.textMuted} flex items-center gap-2 lg:gap-3 shrink-0 flex-wrap`}>
                          <span className="flex items-center gap-1">
                            <FileText size={14} /> {words} words{mins ? ` • ${mins}m` : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> {daysAgoLabel(ch.updatedAt)}
                          </span>

                          {/* Mobile-friendly action buttons */}
                          <div className="flex items-center gap-1">
                            <button onClick={() => moveUp(ch.id)} className={`p-2 lg:p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} title="Move up">
                              <ArrowUp size={14} />
                            </button>
                            <button onClick={() => moveDown(ch.id)} className={`p-2 lg:p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} title="Move down">
                              <ArrowDown size={14} />
                            </button>
                            <button onClick={() => toggleBookmark(ch.id)} className={`p-2 lg:p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} title={ch.bookmarked ? "Remove bookmark" : "Bookmark"}>
                              {ch.bookmarked ? <Star size={14} className="text-yellow-400" /> : <StarOff size={14} />}
                            </button>
                            <button onClick={() => duplicateChapter(ch.id)} className={`p-2 lg:p-1 rounded hover:${isDark ? 'bg-slate-700' : 'bg-slate-200'}`} title="Duplicate">
                              <Copy size={14} />
                            </button>
                            <button onClick={() => setConfirmDeleteId(ch.id)} className={`p-2 lg:p-1 rounded hover:bg-red-500/20 text-red-400`} title="Delete">
                              <Trash2 size={14} />
                            </button>
                            <button
                              onClick={() => generateOne(ch.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100"
                              title="Generate/regenerate AI synopsis"
                            >
                              {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              <span className="hidden lg:inline">{busy ? "…" : "AI"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      {(ch.tags || []).length > 0 && (
                        <div className="mt-2 flex items-center gap-1 flex-wrap">
                          {(ch.tags || []).map(tag => (
                            <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isDark ? 'bg-indigo-900/40 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {open && (
                        <div className={`mt-3 text-sm ${themeClasses.textMuted}`}>
                          {/* Title */}
                          <div className="mb-3">
                            <div className={`text-xs ${themeClasses.textVeryMuted} mb-1`}>Chapter title</div>
                            <input
                              value={ch.title}
                              onChange={(e) => updateChapter(ch.id, { title: e.target.value })}
                              className={`w-full px-3 py-2 rounded-lg ${themeClasses.inputBg} border ${themeClasses.inputBorder} text-sm outline-none`}
                            />
                          </div>

                          {/* Word goal */}
                          <div className="mb-3">
                            <div className={`text-xs ${themeClasses.textVeryMuted} mb-1`}>Word goal for this chapter</div>
                            <div className="flex items-center gap-3">
                              <input
                                type="number"
                                min={100}
                                step={100}
                                value={ch.wordGoal || 2000}
                                onChange={(e) => updateChapter(ch.id, { wordGoal: Number(e.target.value) || 2000 })}
                                className={`w-32 rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-2 py-1 text-sm outline-none`}
                              />
                              <div className={`flex-1 ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded-full h-2`}>
                                <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${wordGoalPct}%` }} />
                              </div>
                              <span className={`text-xs ${themeClasses.textVeryMuted}`}>{wordGoalPct.toFixed(0)}%</span>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="mb-3">
                            <div className={`text-xs ${themeClasses.textVeryMuted} mb-1`}>Tags</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(ch.tags || []).map(tag => (
                                <span key={tag} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isDark ? 'bg-indigo-900/40 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                                  {tag}
                                  <button
                                    onClick={() => removeTagFromChapter(ch.id, tag)}
                                    className="hover:text-red-400"
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
                                className={`text-xs rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-2 py-1 outline-none`}
                              >
                                <option value="">Add tag...</option>
                                {PREDEFINED_TAGS.filter(tag => !(ch.tags || []).includes(tag)).map(tag => (
                                  <option key={tag} value={tag}>{tag}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Synopsis */}
                          <div className="mb-4">
                            <div className={`font-medium mb-1 ${themeClasses.text}`}>AI Synopsis</div>
                            <div className={`rounded-lg ${isDark ? 'bg-slate-900/40' : 'bg-slate-50'} border ${isDark ? 'border-white/5' : 'border-slate-200'} p-3`}>
                              {ch.synopsis ? ch.synopsis : <span className="opacity-60">No synopsis yet. Click "AI".</span>}
                            </div>
                          </div>

                          {/* Content */}
                          <div>
                            <div className={`text-xs ${themeClasses.textVeryMuted} mb-1`}>Chapter content</div>
                            <textarea
                              value={ch.content}
                              onChange={(e) => updateChapter(ch.id, { content: e.target.value })}
                              placeholder="Draft your chapter content here…"
                              className={`w-full min-h-[140px] rounded-lg ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none resize-vertical`}
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

        {/* Delete confirmation */}
        {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`${themeClasses.cardBg} rounded-2xl p-6 max-w-md w-full border ${themeClasses.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="text-red-400" size={20} />
                <div className={`text-lg font-semibold ${themeClasses.text}`}>Delete Chapter</div>
              </div>
              <div className={`${themeClasses.textMuted} mb-6`}>
                Are you sure you want to delete "{chapters.find(c => c.id === confirmDeleteId)?.title}"? This cannot be undone.
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmDeleteId(null)} 
                  className={`flex-1 px-4 py-2 rounded-xl ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'} ${themeClasses.text}`}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteChapter(confirmDeleteId)} 
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
