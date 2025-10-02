// src/components/TOCPage2.jsx
import React from "react";
import {
  BookOpen, Plus, FileText, Clock, Sparkles, Loader2,
  ChevronRight, ChevronDown, Search, X, Trash2, Copy, Download,
  Save, AlertCircle, ArrowUp, ArrowDown, Star, StarOff, Upload, Target,
  Tag, Flame, Minimize2, Maximize2, TrendingUp, CheckCircle, ArrowLeft
} from "lucide-react";
import { NavLink } from "react-router-dom";

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
      settings: { theme: "light", focusMode: false, ...(parsed.settings || {}) },
    };
  } catch {
    return null;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("project:change"));
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
      ]
        .filter(Boolean)
        .join("\n")
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
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json",
  });
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
  Blank: { title: "", content: "" },
  "Scene (POV)": {
    title: "New Scene",
    content: `# Setting\n\n# Characters\n\n# Goal/Conflict\n\n# Beats\n- \n- \n- \n\n# Exit/Hook`,
  },
  "Action Beat": {
    title: "Action Beat",
    content:
      "The room explodes into motion. Describe fast, concrete actions in short sentences.",
  },
  Reflection: {
    title: "Reflection",
    content:
      "After the turning point, the POV character processes the event. What changed internally?",
  },
  "Dialogue Heavy": {
    title: "Dialogue Scene",
    content: `"We need to talk," [Character A] said.\n\n[Character B] looked up from [action]. "About what?"\n\n"You know what."`,
  },
};

const PREDEFINED_TAGS = [
  "Action",
  "Romance",
  "Conflict",
  "Backstory",
  "Climax",
  "Setup",
  "Payoff",
  "Character Development",
  "World Building",
  "Humor",
  "Tension",
  "Resolution",
];

/* ──────────────────────────────────────────────────────────────
   Writing Streak Calculator
──────────────────────────────────────────────────────────────── */
const calculateStreak = (daily) => {
  const { goal, counts } = daily;
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
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
   Light Decorative Blobs (subtle)
──────────────────────────────────────────────────────────────── */
function DecorBlobs() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      <div className="absolute -top-10 -left-6 w-72 h-72 bg-primary/30 rounded-full blur-3xl" />
      <div className="absolute bottom-10 -right-6 w-72 h-72 bg-gold/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-72 h-72 bg-accent/40 rounded-full blur-3xl" />
    </div>
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
        id: 1,
        title: "Chapter 1",
        content: "",
        synopsis: "",
        bookmarked: false,
        updatedAt: Date.now() - 172800000,
        tags: [],
        wordGoal: 2000,
      },
      {
        id: 2,
        title: "Chapter 2",
        content: "",
        synopsis: "",
        bookmarked: false,
        updatedAt: Date.now() - 172800000,
        tags: [],
        wordGoal: 2000,
      },
      {
        id: 3,
        title: "Chapter 3",
        content: "",
        synopsis: "",
        bookmarked: false,
        updatedAt: Date.now() - 172800000,
        tags: [],
        wordGoal: 2000,
      },
    ],
    daily: { goal: 500, counts: {} },
    settings: { theme: "light", focusMode: false },
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

  // Live sync across pages/tabs
  React.useEffect(() => {
    const sync = () => {
      const s = loadState();
      if (!s) return;
      setBook(s.book || { title: "Untitled", targetWords: 25000 });
      setChapters(Array.isArray(s.chapters) ? s.chapters : []);
      setDaily(s.daily || { goal: 500, counts: {} });
      setSettings(s.settings || { theme: "light", focusMode: false });
    };
    window.addEventListener("project:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // History push on meaningful changes
  const commitSnapshot = React.useCallback(
    (next) => {
      if (ignoreHistoryRef.current) return;
      setPast((p) => [...p.slice(-24), { book, chapters, daily, settings }]);
      setFuture([]);
      if (next) {
        setBook(next.book ?? book);
        setChapters(next.chapters ?? chapters);
        setDaily(next.daily ?? daily);
        setSettings(next.settings ?? settings);
      }
    },
    [book, chapters, daily, settings]
  );

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
    setTimeout(() => {
      ignoreHistoryRef.current = false;
    }, 0);
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
    setTimeout(() => {
      ignoreHistoryRef.current = false;
    }, 0);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const onKey = (e) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      const k = e.key.toLowerCase();
      if (k === "s") {
        e.preventDefault();
        saveState({ book, chapters, daily, settings });
        setLastSaved(Date.now());
      }
      if (k === "n") {
        e.preventDefault();
        addChapter();
      }
      if (k === "z") {
        e.preventDefault();
        undo();
      }
      if (k === "y") {
        e.preventDefault();
        redo();
      }
      if (k === "f") {
        e.preventDefault();
        setSettings((s) => ({ ...s, focusMode: !s.focusMode }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book, chapters, daily, settings, past, future]); // eslint-disable-line

  // Daily tracker
  React.useEffect(() => {
    const nowTotal = chapters.reduce(
      (t, ch) => t + countWords(ch.content || ""),
      0
    );
    const delta = nowTotal - prevTotalRef.current;
    prevTotalRef.current = nowTotal;
    if (delta > 0) {
      const key = todayKey();
      setDaily((d) => ({
        ...d,
        counts: { ...d.counts, [key]: (d.counts[key] || 0) + delta },
      }));
    }
  }, [chapters]);

  /* ────────────── Derived ────────────── */
  const totalWords = chapters.reduce(
    (t, ch) => t + countWords(ch.content || ""),
    0
  );
  const readTime = readingMins(totalWords);
  const pct = progressPct(totalWords, book.targetWords);
  const streak = calculateStreak(daily);
  const allTags = [...new Set(chapters.flatMap((ch) => ch.tags || []))].sort();

  const filtered = chapters.filter((c) => {
    if (onlyBookmarked && !c.bookmarked) return false;
    if (tagFilter && !(c.tags || []).includes(tagFilter)) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(s) ||
      (c.synopsis || "").toLowerCase().includes(s) ||
      (c.content || "").toLowerCase().includes(s) ||
      (c.tags || []).some((tag) => tag.toLowerCase().includes(s))
    );
  });

  /* ────────────── Actions ────────────── */
  const addChapter = (tplKey = templateKey) => {
    const tpl = TEMPLATES[tplKey] || TEMPLATES.Blank;
    const title =
      (quickTitle || tpl.title || `Chapter ${chapters.length + 1}`).trim();
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
    const dup = {
      ...orig,
      id: Date.now(),
      title: `${orig.title} (Copy)`,
      updatedAt: Date.now(),
    };
    const next = [
      ...chapters.slice(0, i + 1),
      dup,
      ...chapters.slice(i + 1),
    ];
    commitSnapshot({ chapters: next });
  };

  const deleteChapter = (id) => {
    commitSnapshot({ chapters: chapters.filter((c) => c.id !== id) });
    setConfirmDeleteId(null);
  };

  const updateChapter = (id, patch) => {
    commitSnapshot({
      chapters: chapters.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: Date.now() } : c
      ),
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
    updateChapter(
      id,
      { bookmarked: !chapters.find((c) => c.id === id)?.bookmarked }
    );

  const generateOne = async (id) => {
    setBusyIds((b) => new Set(b).add(id));
    try {
      const current = chapters.find((c) => c.id === id);
      const summary = await summarize(current?.content || "");
      updateChapter(id, { synopsis: summary });
    } finally {
      setBusyIds((b) => {
        const n = new Set(b);
        n.delete(id);
        return n;
      });
    }
  };

  const generateAll = async () => {
    const pending = chapters.filter((c) => !c.synopsis);
    const batchSize = 3;
    for (let i = 0; i < pending.length; i += batchSize) {
      await Promise.all(
        pending.slice(i, i + batchSize).map((c) => generateOne(c.id))
      );
    }
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        if (!json || !json.book || !Array.isArray(json.chapters))
          throw new Error("Invalid backup file");
        commitSnapshot({
          book: {
            title: json.book.title || "Untitled",
            targetWords: json.book.targetWords || 25000,
          },
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
          daily:
            json.daily && json.daily.goal && json.daily.counts
              ? json.daily
              : daily,
          settings: json.settings || settings,
        });
      } catch (e) {
        alert("Could not import file. " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const addTagToChapter = (chapterId, tag) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter || (chapter.tags || []).includes(tag)) return;
    updateChapter(chapterId, { tags: [...(chapter.tags || []), tag] });
  };

  const removeTagFromChapter = (chapterId, tag) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    if (!chapter) return;
    updateChapter(chapterId, {
      tags: (chapter.tags || []).filter((t) => t !== tag),
    });
  };

  /* ────────────── Render ────────────── */
  const today = todayKey();
  const yesterday = yesterdayKey();
  const todayCount = daily.counts[today] || 0;
  const yesterdayCount = daily.counts[yesterday] || 0;
  const goalPct = progressPct(todayCount, daily.goal);

  // Focus mode — light/glass
  if (settings.focusMode) {
    return (
      <div className="min-h-screen bg-base bg-radial-fade text-ink relative overflow-hidden">
        <DecorBlobs />
        <div className="relative z-10 mx-auto max-w-4xl px-4">
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-glass border border-border p-6 mb-8">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <NavLink
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-border hover:bg-white/90 text-ink"
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={16} />
                  Back
                </NavLink>
                <h1 className="text-3xl font-bold">{book.title}</h1>
              </div>
              <button
                onClick={() => setSettings((s) => ({ ...s, focusMode: false }))}
                className="p-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink transition-all"
                title="Exit focus mode (Ctrl/Cmd+F)"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {chapters.map((ch) => (
              <div
                key={ch.id}
                className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-6"
              >
                <div className="text-xl font-bold mb-4">{ch.title}</div>
                <textarea
                  value={ch.content}
                  onChange={(e) =>
                    updateChapter(ch.id, { content: e.target.value })
                  }
                  placeholder="Write your chapter content here..."
                  className="w-full min-h-[200px] bg-white/70 border border-border rounded-xl text-ink placeholder:text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-all px-4 py-4 resize-y outline-none"
                />
                <div className="mt-3 text-sm text-muted">{countWords(ch.content)} words</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink relative overflow-hidden">
      <DecorBlobs />
      <div className="relative z-10 mx-auto max-w-5xl px-4">
        {/* Top banner */}
        <div className="rounded-3xl bg-white/85 backdrop-blur-xl text-ink shadow-glass border border-border">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/70 border border-border flex items-center justify-center">
                <BookOpen className="text-muted" size={24} />
              </div>
              <h1 className="text-4xl font-bold">Table of Contents</h1>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <NavLink
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink"
                title="Back to Dashboard"
              >
                <ArrowLeft size={16} />
                Back
              </NavLink>

              <button
                onClick={() => setSettings((s) => ({ ...s, focusMode: true }))}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Focus mode (Ctrl/Cmd+F)"
              >
                <Minimize2 size={16} /> Focus
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Writing analytics"
              >
                <TrendingUp size={16} /> Analytics
              </button>
              <button
                onClick={() => {
                  saveState({ book, chapters, daily, settings });
                  setLastSaved(Date.now());
                }}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Save now (Ctrl/Cmd+S)"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={() => exportText(book, chapters)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Export as .txt"
              >
                <Download size={16} /> Export
              </button>
              <button
                onClick={() => exportJSON({ book, chapters, daily, settings })}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Export backup JSON"
              >
                <Download size={16} /> Backup
              </button>
              <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm cursor-pointer">
                <Upload size={16} /> Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files[0] &&
                    importJSON(e.target.files[0])
                  }
                />
              </label>
              <button
                onClick={generateAll}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink text-sm"
                title="Generate AI synopses"
              >
                <Sparkles size={16} /> AI Synopses
              </button>
              <button
                onClick={() => addChapter()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary hover:opacity-95 text-white text-sm shadow-soft"
                title="New chapter (Ctrl/Cmd+N)"
              >
                <Plus size={16} /> New Chapter
              </button>
            </div>
          </div>
        </div>

        {/* Analytics panel */}
        {showAnalytics && (
          <div className="mt-6 rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-white/70 border border-border flex items-center justify-center">
                <TrendingUp className="text-muted" size={20} />
              </div>
              <h2 className="text-2xl font-bold">Writing Analytics</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="p-6 rounded-2xl bg-white/70 border border-border backdrop-blur-sm">
                <div className="text-3xl font-bold">{streak}</div>
                <div className="text-sm text-muted mt-1">Day streak</div>
                {streak > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Flame className="text-amber-500" size={16} />
                    <span className="text-amber-600 text-xs">On fire!</span>
                  </div>
                )}
              </div>
              <div className="p-6 rounded-2xl bg-white/70 border border-border backdrop-blur-sm">
                <div className="text-3xl font-bold">{todayCount}</div>
                <div className="text-sm text-muted mt-1">Words today</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/70 border border-border backdrop-blur-sm">
                <div className="text-3xl font-bold">{yesterdayCount}</div>
                <div className="text-sm text-muted mt-1">Words yesterday</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/70 border border-border backdrop-blur-sm">
                <div className="text-3xl font-bold">
                  {chapters.filter((c) => c.bookmarked).length}
                </div>
                <div className="text-sm text-muted mt-1">Bookmarked</div>
              </div>
            </div>
          </div>
        )}

        {/* Book + goals */}
        <div className="mt-6 grid lg:grid-cols-2 gap-6">
          {/* Book banner */}
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <input
                  value={book.title}
                  onChange={(e) =>
                    commitSnapshot({ book: { ...book, title: e.target.value } })
                  }
                  className="w-full bg-transparent text-2xl font-bold outline-none border-b border-transparent focus:border-primary/40"
                />
                <div className="text-muted mt-3">
                  {totalWords.toLocaleString()} /{" "}
                  {book.targetWords.toLocaleString()} words
                  {readTime > 0 && ` • ~${readTime} min read`}
                </div>
                <div className="mt-4 w-full bg-white border border-border rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-muted mt-2">
                  {pct.toFixed(1)}% complete • Last saved{" "}
                  {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">{chapters.length}</div>
                <div className="text-xs uppercase tracking-wider text-muted">
                  Chapters
                </div>
                <div className="mt-4 text-xs text-muted">
                  Target words
                  <input
                    type="number"
                    min={1}
                    value={book.targetWords}
                    onChange={(e) =>
                      commitSnapshot({
                        book: {
                          ...book,
                          targetWords: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-24 mt-2 rounded-xl bg-white/70 border border-border px-3 py-2 text-right outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Daily goal + streak */}
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/70 border border-border flex items-center justify-center">
                <Target className="text-muted" size={20} />
              </div>
              <div className="text-xl font-bold">Daily Goal</div>
              {streak > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <Flame className="text-amber-500" size={20} />
                  <span className="text-amber-700 font-medium">
                    {streak} day{streak !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
            <div className="text-muted mb-4">
              Today:{" "}
              <span className="font-bold text-ink">
                {todayCount.toLocaleString()}
              </span>{" "}
              / {daily.goal.toLocaleString()} words
            </div>
            <div className="w-full bg-white border border-border rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${goalPct}%` }}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs text-muted">Set goal:</span>
              <input
                type="number"
                min={100}
                step={100}
                value={daily.goal}
                onChange={(e) =>
                  commitSnapshot({
                    daily: {
                      ...daily,
                      goal: Math.max(100, Number(e.target.value) || 100),
                    },
                  })
                }
                className="rounded-xl bg-white/70 border border-border px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Search / filters / quick add + template */}
        <div className="mt-6 rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-8">
          <div className="space-y-6">
            {/* Search row */}
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                  <Search size={20} />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chapters by title, content, synopsis, or tags…"
                  className="w-full pl-12 pr-6 py-4 rounded-xl bg-white/70 border border-border text-ink placeholder:text-muted focus:ring-2 focus:ring-primary outline-none"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4">
                {allTags.length > 0 && (
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="rounded-xl bg-white/70 border border-border px-4 py-4 text-ink placeholder:text-muted focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="">All tags</option>
                    {allTags.map((tag) => (
                      <option key={tag} value={tag}>
                        {tag}
                      </option>
                    ))}
                  </select>
                )}
                <label className="inline-flex items-center gap-3 text-muted cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyBookmarked}
                    onChange={(e) => setOnlyBookmarked(e.target.checked)}
                    className="accent-primary w-4 h-4"
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") addChapter();
                }}
                placeholder="Quick add: Chapter title…"
                className="flex-1 rounded-xl bg-white/70 border border-border px-4 py-4 text-ink placeholder:text-muted focus:ring-2 focus:ring-primary outline-none"
              />
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="rounded-xl bg-white/70 border border-border px-4 py-4 text-ink focus:ring-2 focus:ring-primary outline-none"
              >
                {Object.keys(TEMPLATES).map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              <button
                onClick={() => addChapter()}
                className="px-8 py-4 rounded-xl bg-primary hover:opacity-95 text-white font-bold shadow-soft"
              >
                Add Chapter
              </button>
            </div>

            <div className="text-xs text-muted">
              <span className="font-semibold">Shortcuts:</span> Ctrl/Cmd+S save •
              Ctrl/Cmd+N new • Ctrl/Cmd+Z undo • Ctrl/Cmd+Y redo • Ctrl/Cmd+F
              focus mode
              {search && (
                <span>
                  {" "}• Showing {filtered.length} of {chapters.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chapters */}
        <div className="mt-8 space-y-6">
          {filtered.length === 0 ? (
            <div className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border p-12 text-center">
              <Search className="mx-auto mb-4 text-muted" size={48} />
              <div className="text-xl font-bold mb-2">No chapters found</div>
              <div className="text-muted">Try clearing the search or changing filters.</div>
            </div>
          ) : (
            filtered.map((ch) => {
              const words = countWords(ch.content || "");
              const mins = readingMins(words);
              const open = openIds.has(ch.id);
              const busy = busyIds.has(ch.id);
              const wordGoalPct = progressPct(words, ch.wordGoal || 2000);

              return (
                <div
                  key={ch.id}
                  className="rounded-3xl bg-white/85 backdrop-blur-xl shadow-soft border border-border overflow-hidden"
                >
                  <div className="px-8 py-6 flex items-start gap-4">
                    <button
                      onClick={() => toggleOpen(ch.id)}
                      className="mt-1 shrink-0 p-3 rounded-xl bg-white/70 border border-border hover:bg-white transition"
                      title={open ? "Collapse" : "Expand"}
                    >
                      {open ? (
                        <ChevronDown className="text-muted" size={20} />
                      ) : (
                        <ChevronRight className="text-muted" size={20} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-xl font-bold truncate">{ch.title}</div>
                        <div className="text-xs text-muted flex items-center gap-4 shrink-0">
                          <span className="flex items-center gap-2">
                            <FileText size={16} /> {words} words
                            {mins ? ` • ${mins}m` : ""}
                          </span>
                          <span className="flex items-center gap-2">
                            <Clock size={16} /> {daysAgoLabel(ch.updatedAt)}
                          </span>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => moveUp(ch.id)}
                              className="p-2 rounded-lg hover:bg-white/70 text-ink transition"
                              title="Move up"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button
                              onClick={() => moveDown(ch.id)}
                              className="p-2 rounded-lg hover:bg-white/70 text-ink transition"
                              title="Move down"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button
                              onClick={() => toggleBookmark(ch.id)}
                              className="p-2 rounded-lg hover:bg-white/70 text-ink transition"
                              title={ch.bookmarked ? "Remove bookmark" : "Bookmark"}
                            >
                              {ch.bookmarked ? (
                                <Star className="text-amber-500" size={16} />
                              ) : (
                                <StarOff size={16} />
                              )}
                            </button>
                            <button
                              onClick={() => duplicateChapter(ch.id)}
                              className="p-2 rounded-lg hover:bg-white/70 text-ink transition"
                              title="Duplicate"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(ch.id)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => generateOne(ch.id)}
                              disabled={busy}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/70 border border-border hover:bg-white text-ink transition"
                              title="Generate/regenerate AI synopsis"
                            >
                              {busy ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Sparkles size={16} />
                              )}
                              <span className="text-xs">{busy ? "Generating…" : "AI Synopsis"}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tags row */}
                      {(ch.tags || []).length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                          {(ch.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs bg-white/70 text-ink border border-border"
                            >
                              <Tag size={12} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {open && (
                        <div className="mt-6">
                          {/* Title */}
                          <div className="mb-4">
                            <div className="text-xs text-muted mb-2">Chapter title</div>
                            <input
                              value={ch.title}
                              onChange={(e) =>
                                updateChapter(ch.id, { title: e.target.value })
                              }
                              className="w-full px-4 py-3 rounded-xl bg-white/70 border border-border text-ink outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          {/* Word goal */}
                          <div className="mb-4">
                            <div className="text-xs text-muted mb-2">Word goal for this chapter</div>
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                min={100}
                                step={100}
                                value={ch.wordGoal || 2000}
                                onChange={(e) =>
                                  updateChapter(ch.id, {
                                    wordGoal: Number(e.target.value) || 2000,
                                  })
                                }
                                className="w-32 rounded-xl bg-white/70 border border-border px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-primary"
                              />
                              <div className="flex-1 bg-white border border-border rounded-full h-3">
                                <div
                                  className="bg-emerald-500 h-3 rounded-full transition-all duration-700"
                                  style={{ width: `${wordGoalPct}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted">
                                {wordGoalPct.toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          {/* Tags editor */}
                          <div className="mb-4">
                            <div className="text-xs text-muted mb-2">Tags</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {(ch.tags || []).map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs bg-white/70 text-ink border border-border"
                                >
                                  {tag}
                                  <button
                                    onClick={() =>
                                      removeTagFromChapter(ch.id, tag)
                                    }
                                    className="hover:text-red-600 transition-colors"
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
                                className="text-xs rounded-lg bg-white/70 border border-border px-3 py-2 text-ink outline-none focus:ring-2 focus:ring-primary"
                              >
                                <option value="">Add tag...</option>
                                {PREDEFINED_TAGS.filter(
                                  (tag) => !(ch.tags || []).includes(tag)
                                ).map((tag) => (
                                  <option key={tag} value={tag}>
                                    {tag}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Synopsis */}
                          <div className="mb-6">
                            <div className="font-semibold mb-3">AI Synopsis</div>
                            <div className="rounded-2xl bg-white/70 border border-border p-4">
                              {ch.synopsis ? (
                                <p className="leading-relaxed">{ch.synopsis}</p>
                              ) : (
                                <span className="text-muted">
                                  No synopsis yet. Click "AI Synopsis" to generate.
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content */}
                          <div>
                            <div className="text-xs text-muted mb-2">Chapter content</div>
                            <textarea
                              value={ch.content}
                              onChange={(e) =>
                                updateChapter(ch.id, { content: e.target.value })
                              }
                              placeholder="Draft your chapter content here…"
                              className="w-full min-h-[200px] rounded-2xl bg-white/70 border border-border px-4 py-4 text-ink placeholder:text-muted focus:ring-2 focus:ring-primary outline-none resize-y"
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
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-border shadow-glass">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-red-600" size={24} />
                <div className="text-xl font-bold text-ink">
                  Delete Chapter
                </div>
              </div>
              <div className="text-ink/80 mb-8 leading-relaxed">
                Are you sure you want to delete "
                {chapters.find((c) => c.id === confirmDeleteId)?.title}"? This
                action cannot be undone.
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-white border border-border hover:bg-white/90 text-ink"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteChapter(confirmDeleteId)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-soft"
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
