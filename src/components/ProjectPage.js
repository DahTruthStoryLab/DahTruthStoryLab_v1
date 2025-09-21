import React from "react";
import {
  BookOpen, Save, Download, Upload, Target, Calendar, Tag, Image, AlertCircle
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
  const diff = Math.ceil((d - today) / 86400000);
  return diff;
};

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const progressPct = (cur, tgt) => Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function ProjectPage() {
  // Load existing app state (book/chapters/daily/settings)
  const existing = loadState() || {
    book: { title: "Untitled Book", subtitle: "", author: "", genre: "", tags: [], targetWords: 25000, deadline: "", status: "Draft", logline: "", synopsis: "", cover: "" },
    chapters: [],
    daily: { goal: 500, counts: {} },
    settings: { theme: "dark", focusMode: false },
  };

  const [book, setBook] = React.useState({
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
    ...(existing.book || {})
  });

  const [chapters, setChapters] = React.useState(existing.chapters || []);
  const [daily, setDaily] = React.useState(existing.daily || { goal: 500, counts: {} });
  const [settings, setSettings] = React.useState(existing.settings || { theme: "dark", focusMode: false });
  const [newTag, setNewTag] = React.useState("");
  const [lastSaved, setLastSaved] = React.useState(Date.now());

  // Theme (match TOC aesthetic)
  const isDark = (settings?.theme || "dark") === "dark";
  const themeClasses = {
    bg: 'bg-[#e9f0fa]',
    cardBg: isDark ? 'bg-slate-800' : 'bg-white',
    headerBg: isDark ? 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900' : 'bg-gradient-to-r from-slate-700 via-indigo-700 to-slate-700',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-300' : 'text-slate-600',
    textVeryMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    border: isDark ? 'border-white/10' : 'border-slate-200',
    inputBg: isDark ? 'bg-slate-900/60' : 'bg-slate-50',
    inputBorder: isDark ? 'border-white/10' : 'border-slate-300',
  };

  // Live sync: if other pages change the project, refresh
  React.useEffect(() => {
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
  React.useEffect(() => {
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
  const daysLeft = daysUntil(book.deadline); // can be negative when past due
  const wordsRemaining = Math.max((book.targetWords || 0) - totalWords, 0);
  const wordsPerDayNeeded = daysLeft != null && daysLeft > 0
    ? Math.ceil(wordsRemaining / daysLeft)
    : null;

  return (
    <div className={`min-h-screen ${themeClasses.bg} py-8`}>
      <div className="mx-auto max-w-5xl px-4">

        {/* Top header */}
        <div className={`rounded-2xl ${themeClasses.headerBg} text-white shadow-xl border ${themeClasses.border}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <h1 className="text-3xl font-extrabold drop-shadow-sm">
                Project
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={saveNow}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600/30 border border-green-400/30 hover:bg-green-600/40 text-green-100 text-sm"
                title="Save"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={exportJSON}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-sm"
                title="Export backup JSON"
              >
                <Download size={16} /> .json
              </button>
              <div className="text-xs opacity-80">
                Last saved {Math.round((Date.now() - lastSaved) / 60000) || 0}m ago
              </div>
            </div>
          </div>
        </div>

        {/* Summary / Stats */}
        <div className="mt-4 grid lg:grid-cols-3 gap-4">
          {/* Progress */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
            <div className="px-6 py-4">
              <div className="text-sm mb-1">Total Words</div>
              <div className="text-2xl font-bold">{totalWords.toLocaleString()}</div>
              <div className="mt-2 text-sm">
                Target: { (book.targetWords || 0).toLocaleString() }
              </div>
              <div className={`mt-2 w-full ${isDark ? 'bg-slate-700' : 'bg-slate-300'} rounded-full h-2`}>
                <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className={`text-xs ${themeClasses.textVeryMuted} mt-1`}>
                {pct.toFixed(1)}% complete
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
            <div className="px-6 py-4">
              <div className="text-sm mb-1 flex items-center gap-2">
                <Calendar size={16} className="text-indigo-400" /> Deadline
              </div>
              <input
                type="date"
                value={book.deadline || ""}
                onChange={(e) => setBook((b) => ({ ...b, deadline: e.target.value }))}
                className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
              />
              <div className={`text-xs ${themeClasses.textVeryMuted} mt-2`}>
                {book.deadline
                  ? (daysLeft >= 0
                      ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`
                      : `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} past due`)
                  : "No deadline set"}
              </div>
              {wordsPerDayNeeded != null && (
                <div className={`text-xs ${themeClasses.textVeryMuted} mt-1`}>
                  Need ~<b>{wordsPerDayNeeded.toLocaleString()}</b> words/day to hit the target.
                </div>
              )}
            </div>
          </div>

          {/* Target words */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border}`}>
            <div className="px-6 py-4">
              <div className="text-sm mb-1 flex items-center gap-2">
                <Target size={16} className="text-teal-400" /> Target Words
              </div>
              <input
                type="number"
                min={1000}
                step={500}
                value={book.targetWords || 0}
                onChange={(e) =>
                  setBook((b) => ({ ...b, targetWords: clamp(Number(e.target.value) || 0, 0, 5_000_000) }))
                }
                className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
              />
              <div className={`text-xs ${themeClasses.textVeryMuted} mt-2`}>
                Chapters: <b>{chapters.length}</b>
              </div>
            </div>
          </div>
        </div>

        {/* Main editor cards */}
        <div className="mt-4 grid lg:grid-cols-[280px,1fr] gap-4">
          {/* Cover / Tags card */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-6`}>
            <div className="text-sm font-semibold mb-3">Cover</div>
            <div className="rounded-xl overflow-hidden border border-white/10 bg-slate-900/30 aspect-[3/4] flex items-center justify-center">
              {book.cover ? (
                <img src={book.cover} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className={`text-sm ${themeClasses.textVeryMuted} flex flex-col items-center`}>
                  <Image className="mb-2" />
                  Upload a cover image
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-600/30 border border-slate-400/30 hover:bg-slate-600/40 text-slate-100 text-sm cursor-pointer">
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
                  className="px-3 py-2 rounded-xl bg-red-600/30 border border-red-400/30 hover:bg-red-600/40 text-red-100 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="h-px my-6 bg-white/10" />

            <div className="text-sm font-semibold mb-2">Tags</div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {(book.tags || []).map((t) => (
                <span
                  key={t}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isDark ? 'bg-indigo-900/40 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}
                >
                  <Tag size={12} />
                  {t}
                  <button className="hover:text-red-400" onClick={() => removeTag(t)}>×</button>
                </span>
              ))}
              {(!book.tags || book.tags.length === 0) && (
                <div className={`text-xs ${themeClasses.textVeryMuted}`}>No tags yet</div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
                placeholder="Add a tag…"
                className={`flex-1 rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
              />
              <button
                onClick={addTag}
                className="px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {/* Metadata / Title / Synopsis card */}
          <div className={`rounded-2xl ${themeClasses.cardBg} ${themeClasses.text} shadow border ${themeClasses.border} p-6`}>
            {/* Title + subtitle + author */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs mb-1 opacity-70">Title (renaming here updates the whole app)</div>
                <input
                  value={book.title}
                  onChange={(e) => setBook((b) => ({ ...b, title: e.target.value }))}
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-lg font-semibold outline-none`}
                />
              </div>
              <div>
                <div className="text-xs mb-1 opacity-70">Subtitle</div>
                <input
                  value={book.subtitle || ""}
                  onChange={(e) => setBook((b) => ({ ...b, subtitle: e.target.value }))}
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
                />
              </div>
              <div>
                <div className="text-xs mb-1 opacity-70">Author</div>
                <input
                  value={book.author || ""}
                  onChange={(e) => setBook((b) => ({ ...b, author: e.target.value }))}
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
                />
              </div>
              <div>
                <div className="text-xs mb-1 opacity-70">Genre</div>
                <input
                  value={book.genre || ""}
                  onChange={(e) => setBook((b) => ({ ...b, genre: e.target.value }))}
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
                />
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs mb-1 opacity-70">Status</div>
                <select
                  value={book.status || "Draft"}
                  onChange={(e) => setBook((b) => ({ ...b, status: e.target.value }))}
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
                >
                  {["Idea", "Outline", "Draft", "Revision", "Editing", "Published"].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs mb-1 opacity-70">Logline (1–2 sentences)</div>
                <input
                  value={book.logline || ""}
                  onChange={(e) => setBook((b) => ({ ...b, logline: e.target.value }))}
                  placeholder="A one-sentence hook for your story…"
                  className={`w-full rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none`}
                />
              </div>
            </div>

            {/* Synopsis */}
            <div className="mt-4">
              <div className="text-sm font-semibold mb-1">Synopsis</div>
              <textarea
                value={book.synopsis || ""}
                onChange={(e) => setBook((b) => ({ ...b, synopsis: e.target.value }))}
                placeholder="High-level overview of your book…"
                className={`w-full min-h-[140px] rounded ${themeClasses.inputBg} border ${themeClasses.inputBorder} px-3 py-2 text-sm outline-none resize-vertical`}
              />
            </div>

            {/* Heads-up if no chapters exist */}
            {chapters.length === 0 && (
              <div className="mt-4 rounded-xl bg-yellow-500/15 border border-yellow-500/25 text-yellow-200 p-3 text-sm flex items-start gap-2">
                <AlertCircle className="mt-0.5 shrink-0" size={16} />
                No chapters yet. Head over to your Table of Contents to add your first chapter.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
