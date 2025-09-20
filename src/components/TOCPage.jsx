import React from "react";
import {
  BookOpen, Plus, FileText, Clock, Sparkles, Loader2,
  ListTree, ChevronRight, ChevronDown
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────── */
const countWords = (text = "") =>
  text.trim().split(/\s+/).filter(Boolean).length;

const truncate = (s = "", n = 40) =>
  s.split(/\s+/).slice(0, n).join(" ") + (countWords(s) > n ? "…" : "");

/** Fallback local "AI" summarizer. Replace with your API if you have one. */
async function summarizeLocal(text = "") {
  if (!text) return "No content yet — add some text to this chapter.";
  // silly-but-useful local summary: first sentence or first ~40 words
  const firstSentence = text.split(/(?<=[.?!])\s+/)[0];
  if (firstSentence && countWords(firstSentence) >= 8) return firstSentence;
  return truncate(text, 40);
}

/** If you have a backend summarizer, set REACT_APP_SUMMARY_URL
 *  It should accept POST { content } and return { summary }.
 */
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

/* ──────────────────────────────────────────────────────────────
   Sample data (replace with your real source)
──────────────────────────────────────────────────────────────── */
const initialBook = {
  title: "Jacque is a rock star!!",
  targetWords: 25000,
};

const initialChapters = [
  {
    id: 1,
    title: "Chapter 1",
    content:
      "Jacque steps on stage for the first time. The crowd hums; nerves prickle at the skin. One clear note steadies the soul.",
    synopsis: "", // will be generated
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
];

/* ──────────────────────────────────────────────────────────────
   Component
──────────────────────────────────────────────────────────────── */
export default function TOCPage() {
  const [book, setBook] = React.useState(initialBook);
  const [chapters, setChapters] = React.useState(initialChapters);
  const [quickTitle, setQuickTitle] = React.useState("");
  const [open, setOpen] = React.useState(() => new Set()); // expanders
  const [busyIds, setBusyIds] = React.useState(new Set());  // generating flags

  const totalWords = chapters.reduce(
    (t, ch) => t + (ch.content ? countWords(ch.content) : 0),
    0
  );

  const formatWhen = (ts) => {
    const d = Math.round((Date.now() - ts) / (1000 * 60 * 60 * 24));
    if (d <= 0) return "Updated today";
    if (d === 1) return "Updated 1 day ago";
    return `Updated ${d} days ago`;
    // Swap for a real time-ago lib if you like.
  };

  const addChapter = () => {
    const title = quickTitle.trim() || `Chapter ${chapters.length + 1}`;
    const next = {
      id: Date.now(),
      title,
      content: "",
      synopsis: "",
      updatedAt: Date.now(),
    };
    setChapters((c) => [next, ...c]);
    setQuickTitle("");
  };

  const generateOne = async (id) => {
    setBusyIds((b) => new Set(b).add(id));
    try {
      setChapters((c) =>
        c.map((ch) =>
          ch.id === id ? { ...ch, synopsis: ch.synopsis || "…" } : ch
        )
      );
      const ch = chapters.find((x) => x.id === id);
      const summary = await summarize(ch?.content || "");
      setChapters((c) =>
        c.map((x) => (x.id === id ? { ...x, synopsis: summary } : x))
      );
    } finally {
      setBusyIds((b) => {
        const n = new Set(b);
        n.delete(id);
        return n;
      });
    }
  };

  const generateAll = async () => {
    // generate only those missing a synopsis
    for (const ch of chapters) {
      if (!ch.synopsis) {
        /* eslint-disable no-await-in-loop */
        await generateOne(ch.id);
      }
    }
  };

  const toggleOpen = (id) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="min-h-screen bg-[#e9f0fa] py-8">
      <div className="mx-auto max-w-5xl px-4">

        {/* Header banner */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white shadow-xl border border-white/10">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <h1 className="text-3xl font-extrabold drop-shadow-sm">
                Table of Contents
              </h1>
            </div>
            <div className="flex items-center gap-2">
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
              >
                <Plus size={16} /> New Chapter
              </button>
            </div>
          </div>
        </div>

        {/* Book banner */}
        <div className="mt-4 rounded-2xl bg-slate-800 text-white shadow border border-white/10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-xl font-semibold">{book.title}</div>
              <div className="text-sm text-slate-300 mt-1">
                {totalWords.toLocaleString()} / {book.targetWords.toLocaleString()} words
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold">{chapters.length}</div>
              <div className="text-xs uppercase tracking-wide text-slate-300">Chapters</div>
            </div>
          </div>
        </div>

        {/* Quick add */}
        <div className="mt-4 rounded-2xl bg-slate-800 text-white shadow border border-white/10">
          <div className="px-6 py-4">
            <div className="flex gap-3">
              <input
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addChapter(); }}
                placeholder="Quick add: Chapter title…"
                className="flex-1 rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                onClick={addChapter}
                className="px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm min-w-[84px]"
              >
                Add
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              Press <b>Enter</b> or click <b>Add</b> to quickly create a new chapter
            </div>
          </div>
        </div>

        {/* Chapters list */}
        <div className="mt-6 space-y-4">
          {chapters.map((ch) => {
            const words = countWords(ch.content || "");
            const isOpen = open.has(ch.id);
            const loading = busyIds.has(ch.id);

            return (
              <div
                key={ch.id}
                className="rounded-2xl bg-slate-800 text-white shadow border border-white/10 overflow-hidden"
              >
                <div className="px-5 py-4 flex items-start gap-3">
                  <button
                    onClick={() => toggleOpen(ch.id)}
                    className="mt-0.5 shrink-0 p-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/60"
                    title={isOpen ? "Collapse" : "Expand"}
                  >
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-lg font-semibold truncate">{ch.title}</div>
                      <div className="text-xs text-slate-300 flex items-center gap-4 shrink-0">
                        <span className="flex items-center gap-1">
                          <FileText size={14} /> {words} words
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {formatWhen(ch.updatedAt)}
                        </span>
                        <button
                          onClick={() => generateOne(ch.id)}
                          disabled={loading}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100"
                          title="Generate AI synopsis"
                        >
                          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                          {loading ? "Generating…" : "Synopsis"}
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 text-sm text-slate-300">
                        <div className="font-medium mb-1 text-slate-200">AI Synopsis</div>
                        <div className="rounded-lg bg-slate-900/40 border border-white/5 p-3">
                          {ch.synopsis ? ch.synopsis : (
                            <span className="opacity-60">No synopsis yet. Click “Synopsis”.</span>
                          )}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                            <ListTree size={14} />
                            <span>Chapter content</span>
                          </div>
                          <textarea
                            value={ch.content}
                            onChange={(e) =>
                              setChapters((c) =>
                                c.map((x) =>
                                  x.id === ch.id
                                    ? { ...x, content: e.target.value, updatedAt: Date.now() }
                                    : x
                                )
                              )
                            }
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
          })}
        </div>

      </div>
    </div>
  );
}
