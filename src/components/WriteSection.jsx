// src/components/WriteSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import {
  Plus, Save, Eye, FileText, Edit3, Trash2, Menu, X, Target, Clock, RotateCcw, Download,
  CheckCircle, Bot, SlidersHorizontal, BookOpen, MapPin, ArrowLeft,
  Maximize as MaximizeIcon, Minimize as MinimizeIcon,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Underline, Italic, Bold, Quote, Upload
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "react-quill/dist/quill.snow.css"; // toolbar styling

/* ──────────────────────────────────────────────────────────────
   Backend AI endpoint
   - Replace with your exact Lambda Function URL or "/api/ai/rewrite"
────────────────────────────────────────────────────────────── */
const AI_URL = process.env.VITE_AI_URL || "/api/ai/rewrite";

/* ──────────────────────────────────────────────────────────────
   Storage (kept compatible with your app-wide key)
────────────────────────────────────────────────────────────── */
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
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

const getInitialState = () => {
  const existing = loadState();
  return existing || {
    book: {
      title: "Untitled Book",
      subtitle: "",
      author: "",
      genre: "",
      tags: [],
      targetWords: 50000,
      deadline: "",
      status: "Draft",
      logline: "",
      synopsis: "",
      cover: "",
    },
    chapters: [
      {
        id: 1,
        title: "Chapter 1: First Chord",
        content:
          "<p>Jacque's fingers trembled as they touched the guitar strings for the first time on stage…</p><h1>Scene One</h1><p>The room hummed.</p><h2>Beat A</h2><p>It grew quiet.</p>",
        wordCount: 1205,
        lastEdited: "2 hours ago",
        status: "draft",
      },
      {
        id: 2,
        title: "Chapter 2: Backstage Revelations",
        content:
          "<p>The dressing room smelled of stale coffee and nervous energy…</p><h1>Interlude</h1><p>Whispers and light.</p>",
        wordCount: 892,
        lastEdited: "Yesterday",
        status: "draft",
      },
    ],
    daily: { goal: 500, counts: {} },
    settings: { theme: "light", focusMode: false },
    tocOutline: [],
  };
};

/* ──────────────────────────────────────────────────────────────
   Utilities
────────────────────────────────────────────────────────────── */
const countWords = (html = "") => {
  const text = html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00A0/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
};

const computeReadability = (html) => {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
  const words = (text.match(/\b[\w’'-]+\b/g) || []).length;
  const sentences =
    text.split(/[.!?]+["')\]]*\s+/).filter((s) => s.trim().length > 0).length || 1;
  const syllables = (text.match(/[aeiouy]{1,2}/gi) || []).length;
  const WPS = words / sentences;
  const FRE = Math.round(
    206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(words, 1))
  );
  const FKGL = Math.max(
    1,
    Math.round(
      0.39 * (words / sentences) + 11.8 * (syllables / Math.max(words, 1)) - 15.59
    )
  );
  return { words, sentences, avgSentence: Math.round(WPS * 10) / 10, fleschEase: FRE, grade: FKGL };
};

const findHeadings = (html) => {
  const out = [];
  const re = /<(h[1-3])[^>]*>(.*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const level = Number(m[1].slice(1));
    const title = m[2].replace(/<[^>]+>/g, "").trim();
    out.push({ level, title, line: out.length + 1 });
  }
  return out;
};

const applyQuickFixes = (html) => {
  let t = html;
  t = t.replace(/\s+([,.;:!?])/g, "$1");
  t = t.replace(/(>[^<]*) {2,}([^<]*<)/g, (_, a, b) => a.replace(/ {2,}/g, " ") + b);
  t = t.replace(/(^|[^\w'])i(\b)/g, "$1I$2");
  t = t.replace(/--/g, ". ");
  return t;
};

const debounce = (fn, ms = 500) => {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

/* ──────────────────────────────────────────────────────────────
   Top banner
────────────────────────────────────────────────────────────── */
const TopBanner = ({ bookTitle, onNewChapter, onExport }) => {
  return (
    <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="font-extrabold tracking-wide">Write your story</div>
          <div className="hidden md:block text-center">
            <div className="text-xs text-muted">Current project</div>
            <div className="text-lg font-semibold">{bookTitle || "Untitled Book"}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewChapter}
              className="inline-flex items-center gap-2 rounded-xl glass-soft border border-white/40 px-3 py-2 text-sm font-medium hover:bg-white/80"
            >
              <Plus size={16} /> New Chapter
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-3 py-2 text-sm font-medium hover:opacity-90"
            >
              <FileText size={16} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   Draggable Chapter (react-dnd)
────────────────────────────────────────────────────────────── */
function DraggableChapter({ chapter, index, isSelected, onSelect, onMove }) {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: "CHAPTER",
    hover(item) {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: "CHAPTER",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      onClick={onSelect}
      className={`p-2 ${isSelected ? "bg-primary/20" : "bg-white"} ${
        isDragging ? "opacity-50" : ""
      } cursor-pointer border rounded-md`}
    >
      {chapter.title}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Chapter Rail (now LEFT side)
────────────────────────────────────────────────────────────── */
const ChapterRail = ({
  chapters,
  selectedId,
  onSelect,
  onAdd,
  onDelete,
  onMove,
  open,
  setOpen,
  side = "left",
}) => {
  const isRight = side === "right";
  const toggleBtnPos = isRight ? "right-3" : "left-3";
  const fixedSide = isRight ? "right-0" : "left-0";
  const borderSide = isRight ? "border-l" : "border-r";
  const hiddenX = isRight ? "translate-x-full" : "-translate-x-full";

  return (
    <>
      {/* mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`xl:hidden fixed ${toggleBtnPos} top-20 z-40 p-2 rounded-lg bg-white/70 text-ink border border-white/60 backdrop-blur-md`}
        title="Toggle chapters"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile drawer */}
      <aside
        className={[
          "xl:hidden fixed top-16",
          fixedSide,
          "h-[calc(100vh-4rem)] w-72 z-30",
          "bg-white/70 backdrop-blur-xl",
          borderSide,
          "border-white/60",
          "transition-transform duration-300",
          open ? "translate-x-0" : hiddenX,
          "overflow-hidden",
        ].join(" ")}
      >
        <RailInner
          chapters={chapters}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onDelete={onDelete}
          onMove={onMove}
        />
      </aside>

      {/* Desktop/static column */}
      <div className="hidden xl:block">
        <div className="sticky top-20">
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden p-3">
            <div className="px-1 pb-3 flex items-center justify-between">
              <h2 className="text-ink font-semibold">Chapters</h2>
              <button
                type="button"
                onClick={onAdd}
                className="p-2 rounded-md glass-soft border border-white/40 text-ink hover:bg-white/80"
                title="New chapter"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {chapters.map((ch, i) => (
                <div
                  key={ch.id}
                  className={[
                    "group rounded-xl border",
                    selectedId === ch.id
                      ? "bg-primary/15 border-primary/40"
                      : "bg-white/70 border-white/60 hover:bg-white/80",
                    "text-ink p-2",
                  ].join(" ")}
                >
                  <DraggableChapter
                    chapter={ch}
                    index={i}
                    isSelected={selectedId === ch.id}
                    onSelect={() => onSelect(ch.id)}
                    onMove={onMove}
                  />
                  <div className="mt-1 px-1 flex items-center gap-2 text-xs text-muted">
                    <span>{(ch.wordCount || 0).toLocaleString()} words</span> •{" "}
                    <span>{ch.lastEdited || "—"}</span>
                    <span className="ml-auto px-2 py-0.5 text-[10px] rounded bg-white/70 border border-white/60 text-muted">
                      {ch.status || "draft"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(ch.id)}
                      className="ml-2 text-rose-500 hover:text-rose-600 p-1"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const RailInner = ({ chapters, selectedId, onSelect, onAdd, onDelete, onMove }) => (
  <div className="h-full flex flex-col p-3">
    <div className="px-1 pb-3 flex items-center justify-between border-b border-white/60">
      <h2 className="text-ink font-semibold">Chapters</h2>
      <button
        type="button"
        onClick={onAdd}
        className="p-2 rounded-md glass-soft border border-white/40 text-ink hover:bg-white/80"
        title="New chapter"
      >
        <Plus size={16} />
      </button>
    </div>
    <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1">
      {chapters.map((ch, i) => (
        <div key={ch.id} className="group rounded-xl border bg-white/70 border-white/60 text-ink p-2">
          <DraggableChapter
            chapter={ch}
            index={i}
            isSelected={selectedId === ch.id}
            onSelect={() => onSelect(ch.id)}
            onMove={onMove}
          />
          <div className="mt-1 px-1 flex items-center gap-2 text-xs text-muted">
            <span>{(ch.wordCount || 0).toLocaleString()} words</span> • <span>{ch.lastEdited || "—"}</span>
            <button
              type="button"
              onClick={() => onDelete(ch.id)}
              className="ml-auto text-rose-500 hover:text-rose-600 p-1"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────
   LEFT: Meta Sidebar (Quick Nav, Stats, AI Coach)
────────────────────────────────────────────────────────────── */
const MetaSidebar = ({
  book,
  chapterWordCount,
  totalWords,
  aiMode,
  setAiMode,
  aiResults,
  onRunChecks,
  onApplyFixes,
}) => {
  const modes = ["Fiction", "Poetry", "Screenplay", "Memoir", "Non-fiction"];

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 space-y-4">
        {/* Quick Nav */}
        <div className="flex flex-col gap-2">
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-soft border border-white/40 text-ink hover:bg-white/80"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </NavLink>
          <div className="flex gap-2">
            <NavLink
              to="/toc"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-soft border border-white/40 text-ink hover:bg-white/80"
            >
              <BookOpen size={16} />
              TOC
            </NavLink>
            <NavLink
              to="/project"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-soft border border-white/40 text-ink hover:bg-white/80"
            >
              <FileText size={16} />
              Project
            </NavLink>
          </div>
        </div>

        {/* Word stats */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="text-sm text-muted mb-2 font-medium">Word Count</div>
          <div className="text-ink">
            <div className="flex justify-between text-sm">
              <span>Current chapter</span>
              <span className="font-semibold">{chapterWordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span>Project total</span>
              <span className="font-semibold">{totalWords.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* AI Coach (local checks) */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="flex items-center gap-2 text-ink font-semibold mb-2">
            <Bot size={16} className="text-primary" /> AI Coach
          </div>

          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={16} className="text-muted" />
            <select
              className="w-full text-sm rounded-md border border-border px-2 py-1 bg-white text-ink"
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
            >
              {modes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRunChecks({ grammar: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Grammar & punctuation"
            >
              Grammar
            </button>
            <button
              onClick={() => onRunChecks({ clarity: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Clarity & readability"
            >
              Clarity
            </button>
            <button
              onClick={() => onRunChecks({ style: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Style & overuse"
            >
              Style
            </button>
            <button
              onClick={() => onRunChecks({ consistency: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Common consistency checks"
            >
              Consistency
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() =>
                onRunChecks({ grammar: true, clarity: true, style: true, consistency: true })
              }
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm hover:opacity-90"
            >
              Run All
            </button>
            <button
              onClick={onApplyFixes}
              className="text-sm px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              title="Apply safe quick fixes (spacing, hyphens, lone i, etc.)"
            >
              Apply Quick Fixes
            </button>
          </div>

          {/* Results */}
          {aiResults && (
            <div className="mt-3 space-y-3">
              {aiResults.stats && (
                <div className="rounded-lg border border-white/60 bg-white/70 p-2 text-xs text-ink">
                  <div className="font-medium mb-1">Readability</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>
                      Words: <b>{aiResults.stats.words.toLocaleString()}</b>
                    </div>
                    <div>
                      Sentences: <b>{aiResults.stats.sentences}</b>
                    </div>
                    <div>
                      Avg sent.: <b>{aiResults.stats.avgSentence}</b>
                    </div>
                    <div>
                      Flesch Ease: <b>{aiResults.stats.fleschEase}</b>
                    </div>
                    <div>
                      Grade: <b>{aiResults.stats.grade}</b>
                    </div>
                  </div>
                </div>
              )}

              {(aiResults.issues?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {aiResults.issues.map((it, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-2 text-sm border ${
                        it.type === "grammar"
                          ? "border-amber-300 bg-amber-50"
                          : it.type === "clarity"
                          ? "border-sky-300 bg-sky-50"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      <div className="font-medium">{it.title}</div>
                      <div className="text-ink/80">{it.message}</div>
                      {"example" in it && it.example && (
                        <div className="mt-1 text-xs text-muted">e.g. {it.example}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-1.5 text-sm text-emerald-900 flex items-center gap-2">
                  <CheckCircle size={16} /> No issues found by quick checks.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Characters */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="flex items-center gap-2 text-ink font-semibold mb-2">
            <UsersIcon /> Characters
          </div>
          <div className="text-sm text-muted">Add/track your key characters here.</div>
        </div>

        {/* Setting */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="flex items-center gap-2 text-ink font-semibold mb-2">
            <MapPin size={16} className="text-emerald-600" /> Setting
          </div>
          <div className="text-sm text-muted">Where and when your story happens.</div>
        </div>
      </div>
    </aside>
  );
};

// simple icon to avoid another import
const UsersIcon = (props) => (
  <svg
    {...props}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    className="text-primary"
  >
    <path
      fill="currentColor"
      d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3m-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3m0 2c-2.33 0-7 1.17-7 3.5V19h10v-2.5C11 14.17 6.33 13 4 13m12 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5"
    />
  </svg>
);

/* ──────────────────────────────────────────────────────────────
   Writing Editor (ReactQuill + toolbar + fullscreen)
────────────────────────────────────────────────────────────── */
const WritingEditor = ({
  chapter,
  onSave,
  onUpdate,
  onCreateNew,
  onPushTOC,
  onImportDocx,
  onImportHtml,
}) => {
  const [title, setTitle] = useState(chapter?.title || "");
  const [html, setHtml] = useState(chapter?.content || "");
  const [count, setCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const containerRef = useRef(null);

  // Force LTR to stop reversed typing
  useEffect(() => {
    const root = containerRef.current;
    if (root) {
      root.setAttribute("dir", "ltr");
      root.style.direction = "ltr";
    }
    const htmlEl = document.documentElement;
    if (htmlEl && htmlEl.getAttribute("dir") === "rtl") htmlEl.setAttribute("dir", "ltr");
  }, []);

  // Update local state when selection changes
  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
      setHtml(chapter.content || "");
    } else {
      setTitle("");
      setHtml("");
    }
  }, [chapter?.id]);

  useEffect(() => setCount(countWords(html)), [html]);

  // Debounced autosave to parent
  const pushUpdate = useMemo(() => debounce((next) => onUpdate(next), 500), [onUpdate]);

  useEffect(() => {
    if (!chapter) return;
    const next = {
      ...chapter,
      title,
      content: html,
      wordCount: countWords(html),
      lastEdited: "Just now",
    };
    pushUpdate(next);
  }, [title, html]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    if (!chapter) return;
    onSave?.({
      ...chapter,
      title,
      content: html,
      wordCount: countWords(html),
      lastEdited: "Just now",
    });
  };
  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  // Quill toolbar/modules (highlighting & formatting supported by default)
  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  /* ---------- AI: Proofread/Clarify with robust error handling ---------- */
  async function runAIProofread(htmlContent, setHtmlFn) {
    try {
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "proofread",
          content: htmlContent,
          constraints: { preserveVoice: true, noEmDashes: true },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setHtmlFn(data.editedHtml || htmlContent);
      } else {
        throw new Error(data?.error || "AI proofreading failed.");
      }
    } catch (error) {
      alert(error.message || "AI request failed.");
    }
  }

  // Convenience wrapper for your toolbar buttons
  const cloudRewrite = async (mode = "proofread") => {
    try {
      setAiBusy(true);
      if (mode === "proofread") {
        await runAIProofread(html || "", setHtml);
        return;
      }
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, // "proofread" | "clarify"
          content: html || "",
          constraints: {
            preserveVoice: true,
            noEmDashes: true,
          },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `AI error (${res.status})`);
      setHtml(data.editedHtml || "");
    } catch (e) {
      alert(e.message || "AI request failed");
    } finally {
      setAiBusy(false);
    }
  };

  const PageShell = ({ children }) => (
    <div className="flex-1 p-6 overflow-auto grid place-items-center">
      <div className="w-full max-w-3xl">{children}</div>
    </div>
  );

  if (!chapter) {
    return (
      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/70 rounded-full grid place-items-center mx-auto mb-4 border border-border">
            <Edit3 size={24} className="text-muted" />
          </div>
          <h3 className="text-xl font-bold text-ink mb-2">Start writing</h3>
          <p className="text-muted mb-4">Create your first chapter to begin.</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white hover:opacity-90"
          >
            <Plus size={16} />
            New Chapter
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toolbar header */}
      <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-1">
          {/* Visual buttons (Quill handles real formatting) */}
          <button className="btn-icon" title="Align left">
            <AlignLeft size={16} />
          </button>
          <button className="btn-icon" title="Align center">
            <AlignCenter size={16} />
          </button>
          <button className="btn-icon" title="Align right">
            <AlignRight size={16} />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button className="btn-icon" title="Bold">
            <Bold size={16} />
          </button>
          <button className="btn-icon" title="Italic">
            <Italic size={16} />
          </button>
          <button className="btn-icon" title="Underline">
            <Underline size={16} />
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button className="btn-chip">
            <Heading1 size={16} /> H1
          </button>
          <button className="btn-chip">
            <Heading2 size={16} /> H2
          </button>
          <button className="btn-chip">
            <Heading3 size={16} /> H3
          </button>
          <span className="mx-1 h-5 w-px bg-border" />
          <button className="btn-icon" title="Bulleted list">
            <List size={16} />
          </button>
          <button className="btn-icon" title="Numbered list">
            <ListOrdered size={16} />
          </button>
          <button className="btn-icon" title="Quote block">
            <Quote size={16} />
          </button>

          {/* AI buttons */}
          <span className="mx-1 h-5 w-px bg-border" />
          <button
            onClick={() => cloudRewrite("proofread")}
            className="btn-chip disabled:opacity-60"
            disabled={aiBusy}
            title="AI Proofread (grammar/clarity)"
          >
            {aiBusy ? "AI…working" : "AI: Proofread"}
          </button>
          <button
            onClick={() => cloudRewrite("clarify")}
            className="btn-chip disabled:opacity-60"
            disabled={aiBusy}
            title="AI Clarify (tighten sentences)"
          >
            {aiBusy ? "AI…working" : "AI: Clarify"}
          </button>

          {/* Imports */}
          <span className="mx-1 h-5 w-px bg-border" />
          <label className="btn-chip cursor-pointer" title="Import DOCX">
            <Upload size={16} /> DOCX
            <input
              type="file"
              accept=".docx"
              className="hidden"
              onChange={(e) => onImportDocx(e, setHtml)}
            />
          </label>
          <label className="btn-chip cursor-pointer" title="Import HTML">
            <Upload size={16} /> HTML
            <input
              type="file"
              accept=".html,.htm,.xhtml"
              className="hidden"
              onChange={(e) => onImportHtml(e, setHtml)}
            />
          </label>

          <button onClick={() => onPushTOC()} className="btn-chip" title="Update TOC from headings">
            <BookOpen size={16} /> Push TOC
          </button>

          <span className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn-chip"
            title="Fullscreen Writing Mode"
          >
            <MaximizeIcon size={16} /> Fullscreen
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className={`px-3 py-2 rounded-md text-sm border ${
                showPreview
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-white text-ink border-border hover:bg-white/80"
              }`}
              title="Preview"
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:opacity-90"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Desk + page */}
      <div
        className="rounded-3xl shadow-2xl border border-border overflow-hidden flex-1 flex flex-col"
        ref={containerRef}
        style={{ background: "rgba(244,247,250,0.9)" }}
      >
        <div className="px-5 py-3 border-b border-border bg-white/70 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent text-ink outline-none"
              placeholder="Chapter title"
            />
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted">
              <Target size={14} />
              <span>{count.toLocaleString()} words</span>
            </div>
          </div>
        </div>

        <PageShell>
          {showPreview ? (
            <div className="prose max-w-none text-ink">
              <div
                dangerouslySetInnerHTML={{
                  __html: `<h1>${title || ""}</h1>${html || ""}`,
                }}
              />
            </div>
          ) : (
            <div className="rounded-[20px] border border-slate-200 shadow-sm overflow-hidden">
              <ReactQuill
                theme="snow"
                value={html || ""}
                onChange={setHtml}
                placeholder="Start writing your story here…"
                modules={quillModules}
              />
            </div>
          )}
        </PageShell>

        <div className="px-5 py-3 border-t border-border bg-white/70 text-sm text-muted flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Last saved: {chapter.lastEdited || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={14} />
              <span>Auto-save enabled</span>
            </div>
          </div>
          <button className="hover:text-ink" title="Download (use Export in top bar)">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Fullscreen overlay: pale pink background + white page */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999]" style={{ background: "#fdecef" }}>
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 mr-2"
            >
              <Save size={16} /> Save
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50"
            >
              <MinimizeIcon size={18} />
            </button>
          </div>

          {/* Page */}
          <div className="pt-14 pb-8 px-6 h-full flex items-start justify-center overflow-auto">
            <div
              className="w-[92%] max-w-[1100px] bg-white border border-slate-200 rounded-[14px] shadow-2xl p-3"
              dir="ltr"
            >
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent outline-none"
                  placeholder="Chapter title"
                />
                <span className="text-sm text-muted">{count.toLocaleString()} words</span>
              </div>
              <div className="p-3">
                <ReactQuill
                  theme="snow"
                  value={html || ""}
                  onChange={setHtml}
                  placeholder="Write in fullscreen…"
                  modules={quillModules}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main
────────────────────────────────────────────────────────────── */
export default function WriteSection() {
  const initial = useMemo(getInitialState, []);
  const [book, setBook] = useState(initial.book);
  const [chapters, setChapters] = useState(initial.chapters);
  const [selectedId, setSelectedId] = useState(initial.chapters[0]?.id || null);
  const [railOpen, setRailOpen] = useState(false);
  const [aiMode, setAiMode] = useState("Fiction");
  const [aiResults, setAiResults] = useState(null);

  const selected = chapters.find((c) => c.id === selectedId) || null;

  // totals
  const totalWords = chapters.reduce(
    (s, c) => s + (c.wordCount || countWords(c.content || "")),
    0
  );

  // persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
    }, 400);
    return () => clearTimeout(t);
  }, [book, chapters]);

  // live sync across tabs/windows
  useEffect(() => {
    const sync = () => {
      const s = loadState();
      if (!s) return;
      if (s.book) setBook(s.book);
      if (Array.isArray(s.chapters)) {
        setChapters(s.chapters);
        if (!s.chapters.find((c) => c.id === selectedId)) {
          setSelectedId(s.chapters[0]?.id || null);
        }
      }
    };
    window.addEventListener("project:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [selectedId]);

  /* ---------- Chapter CRUD ---------- */
  const addChapter = () => {
    const id = Date.now();
    const ch = {
      id,
      title: `Chapter ${chapters.length + 1}: Untitled`,
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    };
    setChapters((prev) => [ch, ...prev]);
    setSelectedId(id);
    setRailOpen(true);
  };
  const deleteChapter = (id) => {
    const next = chapters.filter((c) => c.id !== id);
    setChapters(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
  };
  const updateChapter = (updated) => {
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  // Reorder chapters (drag & drop)
  const moveChapter = (fromIndex, toIndex) => {
    setChapters((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  /* ---------- Save button (explicit persist) ---------- */
  const handleExplicitSave = (updatedSelected) => {
    setChapters((prev) => prev.map((c) => (c.id === updatedSelected.id ? updatedSelected : c)));
    const current = loadState() || {};
    saveState({
      book,
      chapters: chapters.map((c) => (c.id === updatedSelected.id ? updatedSelected : c)),
      daily: current.daily || { goal: 500, counts: {} },
      settings: current.settings || { theme: "light", focusMode: false },
      tocOutline: current.tocOutline || [],
    });
  };

  /* ---------- Export (JSON) ---------- */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ book, chapters }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "story_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- Local quick checks ---------- */
  const runChecks = ({ grammar, clarity, style, consistency }) => {
    if (!selected) return;
    const html = selected.content || "";
    const issues = [];

    if (grammar) {
      if (/\s[,.!?;:]/.test(html)) {
        issues.push({
          type: "grammar",
          title: "Spacing before punctuation",
          message: "Remove spaces before , . ! ? ; :",
          example: "Hello , world → Hello, world",
        });
      }
      if (/(^|[^\w'])i(\b)/.test(html.replace(/<[^>]+>/g, " "))) {
        issues.push({
          type: "grammar",
          title: "Lowercase 'i'",
          message: "Capitalize the pronoun 'I' when used alone.",
        });
      }
      if (/--/.test(html)) {
        issues.push({
          type: "grammar",
          title: "Double hyphen",
          message: "Replace with period + space or revise punctuation.",
        });
      }
      if (/ {2,}/.test(html.replace(/<[^>]+>/g, " "))) {
        issues.push({
          type: "grammar",
          title: "Double spaces",
          message: "Condense multiple spaces to one.",
        });
      }
    }

    if (clarity) {
      const text = html
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/p>/gi, "\n\n")
        .replace(/<[^>]+>/g, "")
        .trim();
      const sentences = text.split(/(?<=[.!?]["')\]]*)\s+/).filter(Boolean);
      const long = sentences.filter((s) => s.split(/\s+/).length > 30);
      if (long.length) {
        issues.push({
          type: "clarity",
          title: "Long sentences",
          message: `${long.length} sentence(s) exceed 30 words—consider splitting.`,
        });
      }
      const par = text.split(/\n{2,}/).filter(Boolean);
      const longp = par.filter((p) => p.split(/\s+/).length > 250);
      if (longp.length) {
        issues.push({
          type: "clarity",
          title: "Very long paragraphs",
          message: `${longp.length} very long paragraph(s)—consider paragraph breaks.`,
        });
      }
    }

    if (style) {
      const text = html.replace(/<[^>]+>/g, " ");
      const very = (text.match(/\bvery\b/gi) || []).length;
      if (very > 2) {
        issues.push({
          type: "style",
          title: "Weak intensifier 'very'",
          message: "Replace 'very' with stronger wording.",
        });
      }
      const adverbs = (text.match(/\b\w+ly\b/gi) || []).length;
      if (adverbs > 15) {
        issues.push({
          type: "style",
          title: "Adverb overuse",
          message: "Reduce -ly adverbs for tighter prose.",
        });
      }
    }

    if (consistency) {
      const text = html;
      const openSmart = (text.match(/[“‘]/g) || []).length;
      const closeSmart = (text.match(/[”’]/g) || []).length;
      if (Math.abs(openSmart - closeSmart) > 0) {
        issues.push({
          type: "style",
          title: "Mismatched smart quotes",
          message: "Balance opening/closing quotes.",
        });
      }
      if (/\b(Email|email|e-mail)\b/.test(text)) {
        issues.push({
          type: "style",
          title: "Term consistency",
          message: "Ensure consistent variants (e.g., email vs e-mail).",
        });
      }
    }

    const stats = computeReadability(html);
    setAiResults({ issues, stats, mode: aiMode });
  };

  const applyAIQuickFixes = () => {
    if (!selected) return;
    const fixed = applyQuickFixes(selected.content || "");
    updateChapter({
      ...selected,
      content: fixed,
      wordCount: countWords(fixed),
      lastEdited: "Just now",
    });
    runChecks({ grammar: true, clarity: true, style: true, consistency: true });
  };

  /* ---------- Push TOC ---------- */
  const pushTOC = () => {
    const outline = [];
    chapters.forEach((ch, idx) => {
      findHeadings(ch.content || "").forEach((h) => {
        outline.push({
          chapterId: ch.id,
          chapterIndex: idx,
          chapterTitle: ch.title,
          level: h.level,
          heading: h.title,
          line: h.line,
        });
      });
    });
    const current = loadState() || {};
    current.tocOutline = outline;
    saveState(current);
    alert("TOC updated from document headings (H1/H2/H3). Open the TOC page to view.");
  };

  /* ---------- Imports ---------- */
  const importDocx = async (e, setHtml) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const JSZip = (await import("jszip")).default;
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml").async("text");

    // Naive extraction to text, then wrap paragraphs to HTML
    const text = xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const html = text
      .split(/\n{2,}/)
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join("\n");

    setHtml((prev) => (prev ? prev + "\n" + html : html));
    e.target.value = "";
  };

  const importHtml = async (e, setHtml) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    let clean = txt
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_m, p1) => `<h1>${p1}</h1>`)
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_m, p1) => `<h2>${p1}</h2>`)
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_m, p1) => `<h3>${p1}</h3>`)
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (_m, p1) => `<p>• ${p1}</p>`)
      .replace(/<br\s*\/?>/gi, "<br/>")
      .replace(/\u00A0/g, " ");
    setHtml((prev) => (prev ? prev + "\n" + clean : clean));
    e.target.value = "";
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Faint books background */}
      <div
        className="min-h-screen bg-fixed text-ink"
        style={{
          backgroundImage: "url('/assets/faint-books.jpg')", // <- replace with your actual path
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <TopBanner bookTitle={book?.title} onNewChapter={addChapter} onExport={exportJSON} />

        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          {/* 3-column layout on xl: [LEFT chapters | editor | RIGHT meta] */}
          <div className="grid grid-cols-1 xl:grid-cols-[20rem_1fr_20rem] gap-6 pt-6 lg:pt-8 w-full">
            {/* LEFT chapters (moved from right) */}
            <ChapterRail
              chapters={chapters}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addChapter}
              onDelete={deleteChapter}
              onMove={moveChapter}
              open={railOpen}
              setOpen={setRailOpen}
              side="left"
            />

            {/* center editor */}
            <WritingEditor
              chapter={selected}
              onSave={handleExplicitSave}
              onUpdate={updateChapter}
              onCreateNew={addChapter}
              onPushTOC={pushTOC}
              onImportDocx={importDocx}
              onImportHtml={importHtml}
            />

            {/* RIGHT meta + AI */}
            <MetaSidebar
              book={book}
              chapterWordCount={selected ? countWords(selected.content || "") : 0}
              totalWords={totalWords}
              aiMode={aiMode}
              setAiMode={setAiMode}
              aiResults={aiResults}
              onRunChecks={runChecks}
              onApplyFixes={applyAIQuickFixes}
            />
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

/* ──────────────────────────────────────────────────────────────
   Tiny button styles (inject once)
────────────────────────────────────────────────────────────── */
const styleTag = document.createElement("style");
styleTag.innerHTML = `
.btn-icon{display:inline-flex;align-items:center;gap:.25rem;padding:.4rem;border-radius:.5rem;border:1px solid var(--brand-border,#e5e7eb);background:#fff;color:#0f172a}
.btn-icon:hover{background:#fff;opacity:.9}
.btn-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .6rem;border-radius:.6rem;border:1px solid var(--brand-border,#e5e7eb);background:#fff;color:#0f172a;font-size:.85rem}
.btn-chip:hover{background:#fff;opacity:.9}
`;
if (typeof document !== "undefined") document.head.appendChild(styleTag);

/* ──────────────────────────────────────────────────────────────
   Helper for import
────────────────────────────────────────────────────────────── */
function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

/* OPTIONAL: Add these CSS rules once in src/styles/editor-fixes.css and import in src/main.jsx or src/index.jsx:
.ql-container .ql-editor { direction: ltr !important; unicode-bidi: plaintext !important; }
.ql-container.ql-snow { border: 1px solid rgba(0,0,0,.08) !important; border-radius: 12px !important; }
.ql-toolbar.ql-snow { border: 1px solid rgba(0,0,0,.08) !important; border-top-left-radius: 12px !important; border-top-right-radius: 12px !important; }
*/
