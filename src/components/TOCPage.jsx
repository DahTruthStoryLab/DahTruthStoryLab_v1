import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  BookOpen, Plus, FileText, Clock, Sparkles, Loader2, ListTree,
  ChevronRight, ChevronDown, Search, Trash2, Copy, Download,
  Upload, Save, Undo, Redo, Target, GripVertical, Bookmark
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
  Small helpers
──────────────────────────────────────────────────────────────── */
const LS_KEY_BOOK = "toc.book.v1";
const LS_KEY_CHAPTERS = "toc.chapters.v1";

const now = () => Date.now();
const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;
const getReadingTime = (wc) => Math.ceil((wc || 0) / 200); // ~200 WPM
const getProgress = (current, target) => Math.min(Math.round((current / Math.max(target, 1)) * 100), 100);
const debounce = (fn, ms = 500) => {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

const truncate = (s = "", n = 40) => {
  const words = s.trim().split(/\s+/);
  if (words.length <= n) return s;
  return words.slice(0, n).join(" ") + "…";
};

/** Fallback local summary; if REACT_APP_SUMMARY_URL is set, we POST {content} */
async function summarize(content = "") {
  const url = process.env.REACT_APP_SUMMARY_URL;
  if (url) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      const data = await r.json();
      if (data?.summary) return data.summary;
    } catch { /* fallthrough */ }
  }
  if (!content) return "No content yet — add some text to this chapter.";
  const firstSentence = content.split(/(?<=[.?!])\s+/)[0];
  if (countWords(firstSentence) >= 10) return firstSentence;
  return truncate(content, 50);
}

/* ──────────────────────────────────────────────────────────────
  Sample defaults (only used first run)
──────────────────────────────────────────────────────────────── */
const DEFAULT_BOOK = { title: "Jacque is a rock star!!", targetWords: 25000, dailyGoal: 800 };
const DEFAULT_CHAPTERS = [
  { id: 1, title: "Chapter 1", content: "Stage lights flare. Jacque steadies a trembling chord and finds a true note.", synopsis: "", updatedAt: now(), bookmarked: false },
  { id: 2, title: "Chapter 2", content: "Backstage whispers fracture trust. A hard truth pushes growth.", synopsis: "", updatedAt: now(), bookmarked: false },
  { id: 3, title: "Chapter 3", content: "", synopsis: "", updatedAt: now(), bookmarked: false },
];

/* New chapter templates */
const CHAPTER_TEMPLATES = [
  { key: "blank", name: "Blank", content: "" },
  { key: "action", name: "Action Beat", content: "Chaos erupts. Movement drives the scene. Short, punchy lines. Stakes rise." },
  { key: "dialogue", name: "Dialogue-Heavy", content: "“We can’t keep doing this.”\n“Then tell me the truth.”\nSilence stretches thin as wire." },
  { key: "reflection", name: "Quiet Reflection", content: "Alone at last, a stillness settles. Memory stitches together a fragile resolve." },
];

/* ──────────────────────────────────────────────────────────────
  Component
──────────────────────────────────────────────────────────────── */
export default function TOCPage() {
  // ── State
  const [book, setBook] = useState(() => JSON.parse(localStorage.getItem(LS_KEY_BOOK) || "null") || DEFAULT_BOOK);
  const [chapters, setChapters] = useState(() => JSON.parse(localStorage.getItem(LS_KEY_CHAPTERS) || "null") || DEFAULT_CHAPTERS);
  const [query, setQuery] = useState("");
  const [quickTitle, setQuickTitle] = useState("");
  const [templateKey, setTemplateKey] = useState("blank");
  const [open, setOpen] = useState(() => new Set());
  const [busy, setBusy] = useState(new Set()); // generating synopses
  const [focusId, setFocusId] = useState(null); // focus mode

  // Undo / Redo
  const history = useRef([chapters]);
  const idx = useRef(0);

  const totalWords = useMemo(() => chapters.reduce((t, ch) => t + countWords(ch.content || ""), 0), [chapters]);

  // ── Persistence (debounced)
  const saveToLS = useCallback(
    debounce((b, c) => {
      localStorage.setItem(LS_KEY_BOOK, JSON.stringify(b));
      localStorage.setItem(LS_KEY_CHAPTERS, JSON.stringify(c));
    }, 500),
    []
  );
  useEffect(() => { saveToLS(book, chapters); }, [book, chapters, saveToLS]);

  // ── Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveToLS.flush?.(); // if supported; otherwise debounce will save shortly
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault(); addChapter();
      }
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []); // eslint-disable-line

  // ── History helpers
  const pushHistory = (next) => {
    const snapshot = JSON.parse(JSON.stringify(next));
    history.current = history.current.slice(0, idx.current + 1);
    history.current.push(snapshot);
    idx.current++;
  };
  const undo = () => {
    if (idx.current === 0) return;
    idx.current--;
    setChapters(history.current[idx.current]);
  };
  const redo = () => {
    if (idx.current >= history.current.length - 1) return;
    idx.current++;
    setChapters(history.current[idx.current]);
  };

  // ── Add / duplicate / delete / bookmark
  const addChapter = () => {
    const base = CHAPTER_TEMPLATES.find(t => t.key === templateKey) || CHAPTER_TEMPLATES[0];
    const title = quickTitle.trim() || `Chapter ${chapters.length + 1}`;
    const next = { id: now(), title, content: base.content, synopsis: "", updatedAt: now(), bookmarked: false };
    const newState = [next, ...chapters];
    setChapters(newState);
    pushHistory(newState);
    setQuickTitle("");
  };

  const duplicateChapter = (id) => {
    const ch = chapters.find(c => c.id === id);
    if (!ch) return;
    const copy = { ...ch, id: now(), title: `${ch.title} (Copy)`, updatedAt: now(), bookmarked: false };
    const newState = [copy, ...chapters];
    setChapters(newState);
    pushHistory(newState);
  };

  const deleteChapter = (id) => {
    const ch = chapters.find(c => c.id === id);
    if (!ch) return;
    if (!window.confirm(`Delete "${ch.title}"? This cannot be undone.`)) return;
    const newState = chapters.filter(c => c.id !== id);
    setChapters(newState);
    pushHistory(newState);
  };

  const toggleBookmark = (id) => {
    const newState = chapters.map(c => (c.id === id ? { ...c, bookmarked: !c.bookmarked } : c));
    setChapters(newState);
    pushHistory(newState);
  };

  // ── Drag & drop reorder
  const dragId = useRef(null);
  const onDragStart = (id) => (e) => { dragId.current = id; e.dataTransfer.effectAllowed = "move"; };
  const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const onDrop = (id) => (e) => {
    e.preventDefault();
    const from = chapters.findIndex(c => c.id === dragId.current);
    const to = chapters.findIndex(c => c.id === id);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...chapters];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setChapters(next);
    pushHistory(next);
    dragId.current = null;
  };

  // ── Expand / collapse & focus
  const toggleOpen = (id) => setOpen(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // ── Search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chapters;
    return chapters.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      (c.synopsis || "").toLowerCase().includes(q)
    );
  }, [chapters, query]);

  // ── Summaries
  const generateOne = async (id, { force = false } = {}) => {
    if (!force) {
      const ch = chapters.find(c => c.id === id);
      if (!ch || ch.synopsis) return; // skip if already has one
    }
    setBusy(s => new Set(s).add(id));
    try {
      const ch = chapters.find(c => c.id === id);
      const summary = await summarize(ch?.content || "");
      const next = chapters.map(c => (c.id === id ? { ...c, synopsis: summary } : c));
      setChapters(next);
      pushHistory(next);
    } finally {
      setBusy(s => { const n = new Set(s); n.delete(id); return n; });
    }
  };

  const generateAll = async ({ regenerate = false } = {}) => {
    const targets = chapters.filter(c => regenerate ? true : !c.synopsis);
    if (!targets.length) return;
    setBusy(s => {
      const n = new Set(s);
      targets.forEach(t => n.add(t.id));
      return n;
    });
    try {
      const results = await Promise.all(
        targets.map(async (c) => ({ id: c.id, summary: await summarize(c.content || "") }))
      );
      const next = chapters.map(c => {
        const hit = results.find(r => r.id === c.id);
        return hit ? { ...c, synopsis: hit.summary } : c;
      });
      setChapters(next);
      pushHistory(next);
    } finally {
      setBusy(s => {
        const n = new Set(s);
        targets.forEach(t => n.delete(t.id));
        return n;
      });
    }
  };

  // ── Export/Backup
  const exportTxt = () => {
    const lines = [];
    lines.push(`# ${book.title}`);
    lines.push(`${totalWords} / ${book.targetWords} words`);
    lines.push("");
    chapters.forEach((c, i) => {
      lines.push(`## ${i + 1}. ${c.title}`);
      if (c.synopsis) lines.push(`_Synopsis:_ ${c.synopsis}`);
      lines.push("");
      lines.push(c.content || "");
      lines.push("");
    });
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${book.title.replace(/\s+/g, "_")}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    const payload = { book, chapters };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `story_backup_${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file) => {
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (!data?.chapters || !Array.isArray(data.chapters)) throw new Error("Invalid file");
      setBook(data.book || DEFAULT_BOOK);
      setChapters(data.chapters);
      history.current = [data.chapters]; idx.current = 0;
    } catch {
      alert("Invalid backup file.");
    }
  };

  // ── Render helpers
  const ChapterCard = ({ ch, index }) => {
    const words = countWords(ch.content || "");
    const isOpen = open.has(ch.id);
    const isBusy = busy.has(ch.id);

    const setContent = (val) => {
      const next = chapters.map(c => (c.id === ch.id ? { ...c, content: val, updatedAt: now() } : c));
      setChapters(next);
      pushHistory(next);
    };
    const setTitle = (val) => {
      const next = chapters.map(c => (c.id === ch.id ? { ...c, title: val, updatedAt: now() } : c));
      setChapters(next);
      pushHistory(next);
    };

    return (
      <div
        className="rounded-2xl bg-slate-800 text-white shadow border border-white/10 overflow-hidden"
        draggable
        onDragStart={onDragStart(ch.id)}
        onDragOver={onDragOver}
        onDrop={onDrop(ch.id)}
      >
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="mt-0.5 text-slate-300">
            <GripVertical size={18} />
          </div>

          <button
            onClick={() => toggleOpen(ch.id)}
            className="mt-0.5 shrink-0 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/60"
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <input
                value={ch.title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent outline-none text-lg font-semibold truncate"
                placeholder={`Chapter ${index + 1}`}
              />
              <div className="text-xs text-slate-300 flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1"><FileText size={14} /> {words} words</span>
                <span className="flex items-center gap-1"><Clock size={14} /> {formatWhen(ch.updatedAt)}</span>
                <span className="hidden sm:flex items-center gap-1"><Target size={14} /> {getReadingTime(words)} min</span>

                <button onClick={() => toggleBookmark(ch.id)} className={`${ch.bookmarked ? "text-yellow-300" : "text-slate-300 hover:text-slate-100"}`} title="Bookmark">
                  <Bookmark size={16} />
                </button>

                <button onClick={() => duplicateChapter(ch.id)} className="hover:text-slate-100" title="Duplicate">
                  <Copy size={16} />
                </button>
                <button onClick={() => generateOne(ch.id, { force: true })} disabled={isBusy} className="hover:text-slate-100" title="Generate / Regenerate synopsis">
                  {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                </button>
                <button onClick={() => setFocusId(ch.id)} className="hover:text-slate-100" title="Focus mode">
                  <ListTree size={16} />
                </button>
                <button onClick={() => deleteChapter(ch.id)} className="text-red-300 hover:text-red-200" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-3 text-sm text-slate-300">
                <div className="font-medium mb-1 text-slate-200">AI Synopsis</div>
                <div className="rounded-lg bg-slate-900/40 border border-white/5 p-3">
                  {ch.synopsis ? ch.synopsis : <span className="opacity-60">No synopsis yet. Click the ✨ button.</span>}
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <ListTree size={14} /><span>Chapter content</span>
                  </div>
                  <textarea
                    value={ch.content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Draft your chapter content here…"
                    className="w-full min-h-[120px] rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2 text-sm outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const formatWhen = (ts) => {
    const days = Math.floor((now() - ts) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Updated today";
    if (days === 1) return "Updated 1 day ago";
    return `Updated ${days} days ago`;
  };

  // Focus view
  const focused = focusId ? chapters.find(c => c.id === focusId) : null;

  return (
    <div className="min-h-screen bg-[#e9f0fa] py-8">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <h1 className="text-3xl font-extrabold drop-shadow-sm">Table of Contents</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => generateAll({ regenerate: false })} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm" title="Generate synopses for chapters without one">
                <Sparkles size={16} /> Generate missing synopses
              </button>
              <button onClick={() => generateAll({ regenerate: true })} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/20 border border-indigo-400/30 hover:bg-indigo-600/30 text-indigo-100 text-sm" title="Regenerate all synopses">
                <Sparkles size={16} /> Regenerate all
              </button>
              <button onClick={exportTxt} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-800 text-slate-100 text-sm"><Download size={16}/> Export .txt</button>
              <button onClick={exportJson} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-800 text-slate-100 text-sm" title="Backup JSON"><Save size={16}/> Backup</button>
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-800 text-slate-100 text-sm cursor-pointer" title="Restore from JSON">
                <Upload size={16}/> Restore
                <input type="file" accept="application/json" hidden onChange={(e) => importJson(e.target.files?.[0])}/>
              </label>
              <button onClick={undo} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-800 text-slate-100 text-sm"><Undo size={16}/>Undo</button>
              <button onClick={redo} className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/70 border border-white/10 hover:bg-slate-800 text-slate-100 text-sm"><Redo size={16}/>Redo</button>
            </div>
          </div>
        </div>

        {/* Book banner */}
        <div className="mt-4 rounded-2xl bg-slate-800 text-white shadow border border-white/10">
          <div className="px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <input
                value={book.title}
                onChange={(e) => setBook({ ...book, title: e.target.value })}
                className="bg-transparent outline-none text-xl font-semibold w-full"
              />
              <div className="text-sm text-slate-300 mt-1">
                {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()} words · {getProgress(totalWords, book.targetWords)}%
                ({getReadingTime(totalWords)} min read)
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-3xl font-extrabold">{chapters.length}</div>
                <div className="text-xs uppercase tracking-wide text-slate-300 text-right">Chapters</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools row: search + quick add */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
          <div className="rounded-2xl bg-slate-800 text-white shadow border border-white/10 px-4 py-3 flex items-center gap-2">
            <Search size={16} className="text-slate-300" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chapters…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
            />
          </div>

          <select
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            className="rounded-2xl bg-slate-800 text-white shadow border border-white/10 px-3 py-3 text-sm"
            title="Template for the next chapter you add"
          >
            {CHAPTER_TEMPLATES.map(t => (
              <option key={t.key} value={t.key}>{t.name} template</option>
            ))}
          </select>

          <div className="rounded-2xl bg-slate-800 text-white shadow border border-white/10 px-4 py-3 flex items-center gap-2">
            <input
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }}
              placeholder="Quick add: Chapter title…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400"
            />
            <button onClick={addChapter} className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm">
              <Plus size={16}/> Add
            </button>
          </div>
        </div>

        {/* Focus mode (single chapter) */}
        {focused && (
          <div className="mt-6 rounded-2xl bg-slate-900 text-white border border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-300">Focus mode</div>
              <button onClick={() => setFocusId(null)} className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm">Exit</button>
            </div>
            {/* reuse card body with open=true */}
            <div className="opacity-100">
              <ChapterCard ch={focused} index={chapters.findIndex(c => c.id === focusId)} />
            </div>
          </div>
        )}

        {/* Chapters list */}
        {!focusId && (
          <div className="mt-6 space-y-4">
            {filtered.map((ch, i) => (
              <ChapterCard key={ch.id} ch={ch} index={i} />
            ))}
            {filtered.length === 0 && (
              <div className="text-center text-slate-500 py-12">No chapters match your search.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
