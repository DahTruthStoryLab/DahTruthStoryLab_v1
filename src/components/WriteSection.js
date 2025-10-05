// src/components/WriteSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Save, Eye, FileText, Edit3, Trash2, Menu, X, Target, Clock, RotateCcw, Download,
  CheckCircle, AlertCircle, Lightbulb, Zap, Brain, MessageSquare, RefreshCw, Wand2, Users,
  BookOpen, MapPin, ArrowLeft, Maximize, Minimize, Moon, Sun, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Heading1, Heading2, Heading3, Underline, Italic, Bold,
  Quote, Upload, Bot, SlidersHorizontal
} from "lucide-react";
import { NavLink } from "react-router-dom";

/* ──────────────────────────────────────────────────────────────
   Shared storage helpers
───────────────────────────────────────────────────────────── */
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

const getInitialState = () => {
  const existing = loadState();
  return (
    existing || {
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
            "Jacque's fingers trembled as they touched the guitar strings for the first time on stage...\n\n# Scene One\nThe room hummed.\n\n## Beat A\nIt grew quiet.",
          wordCount: 1205,
          lastEdited: "2 hours ago",
          status: "draft",
        },
        {
          id: 2,
          title: "Chapter 2: Backstage Revelations",
          content:
            "The dressing room smelled of stale coffee and nervous energy...\n\n# Interlude\nWhispers and light.",
          wordCount: 892,
          lastEdited: "Yesterday",
          status: "draft",
        },
      ],
      daily: { goal: 500, counts: {} },
      settings: { theme: "light", focusMode: false },
      tocOutline: [] // will be filled by Push TOC
    }
  );
};

/* ──────────────────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────────────────── */
const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;

const computeReadability = (text) => {
  const words = text.trim().match(/\b[\w’'-]+\b/g)?.length || 0;
  const sentences = text.split(/[.!?]+["')\]]*\s+/).filter((s) => s.trim().length > 0).length || 1;
  const syllables = (text.match(/[aeiouy]{1,2}/gi) || []).length; // crude but ok for UI hint
  const WPS = words / sentences;
  // Flesch Reading Ease
  const FRE = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(words, 1));
  // Grade estimate with FKGL
  const FKGL = 0.39 * (words / sentences) + 11.8 * (syllables / Math.max(words, 1)) - 15.59;
  return {
    words, sentences, avgSentence: Math.round(WPS * 10) / 10,
    fleschEase: Math.round(FRE), grade: Math.max(1, Math.round(FKGL))
  };
};

const findHeadings = (text) => {
  // Headings are lines starting with #, ##, ###
  const lines = text.split(/\r?\n/);
  const out = [];
  lines.forEach((line, idx) => {
    const m = line.match(/^(#{1,3})\s+(.*)$/);
    if (m) {
      out.push({ level: m[1].length, title: m[2].trim(), line: idx + 1 });
    }
  });
  return out;
};

const applyQuickFixes = (text) => {
  let t = text;
  t = t.replace(/\s+([,.;:!?])/g, "$1");        // remove space before punctuation
  t = t.replace(/ {2,}/g, " ");                 // condense spaces
  t = t.replace(/\bi\b(?=\b)/g, "I");           // capitalize solitary i
  t = t.replace(/--/g, "—");                    // double hyphen to em dash
  t = t.replace(/\s+(\n)/g, "$1");              // trim trailing spaces before newlines
  return t;
};

const applyModeHints = (mode, text) => {
  // Add very light-touch suggestions or shaping based on mode (non-destructive)
  if (mode === "Screenplay") {
    // ensure blank lines between paragraphs (helps screenplay readability)
    return text.replace(/\n{2,}/g, "\n\n");
  }
  return text;
};

/* ──────────────────────────────────────────────────────────────
   Top banner
───────────────────────────────────────────────────────────── */
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
   RIGHT: Chapter rail
───────────────────────────────────────────────────────────── */
const ChapterRail = ({
  chapters, selectedId, onSelect, onAdd, onDelete, open, setOpen, side = "right"
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
          "xl:hidden fixed top-16", fixedSide,
          "h:[calc(100vh-4rem)] w-72 z-30",
          "bg-white/70 backdrop-blur-xl", borderSide, "border-white/60",
          "transition-transform duration-300",
          open ? "translate-x-0" : hiddenX,
          "overflow-hidden"
        ].join(" ")}
      >
        <RailInner
          chapters={chapters}
          selectedId={selectedId}
          onSelect={onSelect}
          onAdd={onAdd}
          onDelete={onDelete}
        />
      </aside>

      {/* Desktop/static column */}
      <div className="hidden xl:block">
        <div className="sticky top-20">
          <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 overflow-hidden">
            <RailInner
              chapters={chapters}
              selectedId={selectedId}
              onSelect={onSelect}
              onAdd={onAdd}
              onDelete={onDelete}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const RailInner = ({ chapters, selectedId, onSelect, onAdd, onDelete }) => (
  <div className="h-full flex flex-col">
    <div className="px-4 py-3 flex items-center justify-between border-b border-white/60">
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

    <div className="flex-1 overflow-y-auto p-3">
      {chapters.map((ch) => (
        <div
          key={ch.id}
          className={[
            "group mb-2 rounded-xl border",
            selectedId === ch.id
              ? "bg-primary/15 border-primary/40"
              : "bg-white/70 border-white/60 hover:bg-white/80",
            "text-ink"
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => onSelect(ch.id)}
            className="w-full text-left px-3 py-2"
          >
            <div className="text-sm font-medium truncate">{ch.title}</div>
            <div className="text-xs text-muted">
              {(ch.wordCount || 0).toLocaleString()} words • {ch.lastEdited || "—"}
            </div>
          </button>
          <div className="px-3 pb-2 flex gap-2">
            <span className="px-2 py-0.5 text-[10px] rounded bg-white/70 border border-white/60 text-muted">
              {ch.status || "draft"}
            </span>
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
   LEFT: Sidebar (Quick Nav, Stats, AI Coach)
───────────────────────────────────────────────────────────── */
const MetaSidebar = ({
  book, chapterWordCount, totalWords,
  aiMode, setAiMode, aiResults, onRunAI, onApplyFixes
}) => {
  const modes = ["Fiction", "Poetry", "Screenplay", "Memoir", "Non-fiction"];
  const stats = aiResults?.stats;

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

        {/* AI Coach */}
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
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onRunAI({ grammar: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Grammar & punctuation"
            >
              Grammar
            </button>
            <button
              onClick={() => onRunAI({ clarity: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Clarity & readability"
            >
              Clarity
            </button>
            <button
              onClick={() => onRunAI({ style: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Style & overuse"
            >
              Style
            </button>
            <button
              onClick={() => onRunAI({ consistency: true })}
              className="px-2 py-1 rounded-md text-sm border border-border hover:bg-white/80"
              title="Common consistency checks"
            >
              Consistency
            </button>
          </div>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => onRunAI({ grammar: true, clarity: true, style: true, consistency: true })}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-white text-sm hover:opacity-90"
            >
              <Wand2 size={16} /> Run All
            </button>
            <button
              onClick={onApplyFixes}
              className="text-sm px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
              title="Apply safe quick fixes (spacing, em dashes, lone i, etc.)"
            >
              Apply Quick Fixes
            </button>
          </div>

          {/* Results */}
          {aiResults && (
            <div className="mt-3 space-y-3">
              {stats && (
                <div className="rounded-lg border border-white/60 bg-white/70 p-2 text-xs text-ink">
                  <div className="font-medium mb-1">Readability</div>
                  <div className="grid grid-cols-2 gap-1">
                    <div>Words: <b>{stats.words.toLocaleString()}</b></div>
                    <div>Sentences: <b>{stats.sentences}</b></div>
                    <div>Avg sent.: <b>{stats.avgSentence}</b></div>
                    <div>Flesch Ease: <b>{stats.fleschEase}</b></div>
                    <div>Grade: <b>{stats.grade}</b></div>
                  </div>
                </div>
              )}

              {(aiResults.issues?.length || 0) > 0 ? (
                <div className="space-y-2">
                  {aiResults.issues.map((it, i) => (
                    <div key={i}
                      className={`rounded-lg p-2 text-sm border ${
                        it.type === "grammar" ? "border-amber-300 bg-amber-50"
                        : it.type === "clarity" ? "border-sky-300 bg-sky-50"
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
            <Users size={16} className="text-primary" /> Characters
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

/* ──────────────────────────────────────────────────────────────
   Editor Toolbar helpers (textarea-based)
───────────────────────────────────────────────────────────── */
const surroundSelection = (ta, left, right = left) => {
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const before = ta.value.slice(0, start);
  const sel = ta.value.slice(start, end);
  const after = ta.value.slice(end);
  const next = before + left + sel + right + after;
  const newPos = start + left.length + sel.length + right.length;
  return { next, cursor: newPos };
};

const prefixLines = (ta, prefix) => {
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const before = ta.value.slice(0, start);
  const sel = ta.value.slice(start, end);
  const after = ta.value.slice(end);
  const block = sel || "";
  const nextBlock = block.split("\n").map((l) => (l.trim() ? `${prefix}${l}` : l)).join("\n");
  const next = before + nextBlock + after;
  const newPos = before.length + nextBlock.length;
  return { next, cursor: newPos };
};

const insertAtCursor = (ta, text) => {
  const start = ta.selectionStart ?? 0;
  const end = ta.selectionEnd ?? 0;
  const before = ta.value.slice(0, start);
  const after = ta.value.slice(end);
  const next = before + text + after;
  const cursor = start + text.length;
  return { next, cursor };
};

/* ──────────────────────────────────────────────────────────────
   Writing Editor (Word-like canvas + toolbar + imports)
───────────────────────────────────────────────────────────── */
const WritingEditor = ({
  chapter, onSave, onUpdate, onCreateNew,
  onPushTOC, onImportDocx, onImportHtml
}) => {
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTheme, setFullscreenTheme] = useState("light"); // light, dark, sepia
  const textareaRef = useRef(null);

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
      setContent(chapter.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [chapter?.id]);

  useEffect(() => setCount(countWords(content)), [content]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false);
    };
    if (isFullscreen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  const handleSave = () => {
    if (!chapter) return;
    onUpdate({
      ...chapter,
      title,
      content,
      wordCount: count,
      lastEdited: "Just now",
    });
    onSave?.();
  };
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const applyToolbar = (action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    let r = null;
    switch (action) {
      case "bold": r = surroundSelection(ta, "**"); break;
      case "italic": r = surroundSelection(ta, "*"); break;
      case "underline": r = surroundSelection(ta, "__"); break;
      case "h1": r = prefixLines(ta, "# "); break;
      case "h2": r = prefixLines(ta, "## "); break;
      case "h3": r = prefixLines(ta, "### "); break;
      case "ul": r = prefixLines(ta, "- "); break;
      case "ol": {
        // naive: each line becomes "1. ", "2. ", etc.
        const start = ta.selectionStart ?? 0;
        const end = ta.selectionEnd ?? 0;
        const block = (ta.value.slice(start, end) || "").split("\n");
        let i = 1;
        const transformed = block.map((l) => (l.trim() ? `${i++}. ${l}` : l)).join("\n");
        const before = ta.value.slice(0, start);
        const after = ta.value.slice(end);
        r = { next: before + transformed + after, cursor: (before + transformed).length };
        break;
      }
      case "quote": r = prefixLines(ta, "> "); break;
      case "center": r = surroundSelection(ta, '<div style="text-align:center">', "</div>"); break;
      case "left": r = surroundSelection(ta, '<div style="text-align:left">', "</div>"); break;
      case "right": r = surroundSelection(ta, '<div style="text-align:right">', "</div>"); break;
      case "pagebreak": r = insertAtCursor(ta, "\n\n---PAGE BREAK---\n\n"); break;
      default: break;
    }
    if (r) {
      setContent(r.next);
      requestAnimationFrame(() => ta.setSelectionRange(r.cursor, r.cursor));
    }
  };

  const FullscreenEditor = () => (
    <div className={`fixed inset-0 z-[9999] ${fullscreenTheme === "dark"
        ? "bg-slate-900 text-slate-100"
        : fullscreenTheme === "sepia"
        ? "bg-amber-50 text-amber-900"
        : "bg-white text-ink"} transition-colors duration-200`}
    >
      {/* FS Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between border-b border-current/10 bg-opacity-90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent outline-none border-b border-transparent hover:border-current focus:border-current transition-colors"
            placeholder="Chapter title"
          />
          <div className="text-sm opacity-70">{count} words</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-current/20 overflow-hidden">
            {[
              { key: "light", icon: Sun, label: "Light" },
              { key: "sepia", icon: () => <>📄</>, label: "Sepia" },
              { key: "dark", icon: Moon, label: "Dark" },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setFullscreenTheme(key)}
                className={`px-3 py-2 text-sm ${fullscreenTheme === key ? "bg-current/10" : "hover:bg-current/5"}`}
                title={label}
              >
                {typeof Icon === "function" ? <Icon /> : <Icon size={16} />}
              </button>
            ))}
          </div>

          <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90">
            <Save size={16} />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg hover:bg-current/10" title="Exit Fullscreen (Esc)">
            <Minimize size={20} />
          </button>
        </div>
      </div>

      {/* FS Content */}
      <div className="pt-20 pb-8 px-8 h-full flex items-center justify-center">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full flex-1 resize-none outline-none text-lg leading-relaxed ${
              fullscreenTheme === "dark" ? "bg-slate-900 text-slate-100 placeholder-slate-400"
              : fullscreenTheme === "sepia" ? "bg-amber-50 text-amber-900 placeholder-amber-600"
              : "bg-white text-ink placeholder-slate-400"
            }`}
            placeholder="Start writing your story here... Press Esc to exit fullscreen."
            autoFocus
          />
        </div>
      </div>

      {/* FS Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm opacity-50">
        <div className="flex items-center justify-center gap-4">
          <span>Last saved: {chapter?.lastEdited || "Never"}</span>
          <span>•</span>
          <span>Auto-save enabled</span>
          <span>•</span>
          <span>Press Esc to exit</span>
        </div>
      </div>
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

  // Word-like desk + bright page with gray border
  return (
    <>
      <div className="flex-1 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-1">
            <button onClick={() => applyToolbar("bold")} className="btn-icon"><Bold size={16} /></button>
            <button onClick={() => applyToolbar("italic")} className="btn-icon"><Italic size={16} /></button>
            <button onClick={() => applyToolbar("underline")} className="btn-icon"><Underline size={16} /></button>
            <span className="mx-1 h-5 w-px bg-border" />
            <button onClick={() => applyToolbar("h1")} className="btn-chip"><Heading1 size={16} /> H1</button>
            <button onClick={() => applyToolbar("h2")} className="btn-chip"><Heading2 size={16} /> H2</button>
            <button onClick={() => applyToolbar("h3")} className="btn-chip"><Heading3 size={16} /> H3</button>
            <span className="mx-1 h-5 w-px bg-border" />
            <button onClick={() => applyToolbar("ul")} className="btn-icon"><List size={16} /></button>
            <button onClick={() => applyToolbar("ol")} className="btn-icon"><ListOrdered size={16} /></button>
            <button onClick={() => applyToolbar("quote")} className="btn-icon"><Quote size={16} /></button>
            <span className="mx-1 h-5 w-px bg-border" />
            <button onClick={() => applyToolbar("left")} className="btn-icon" title="Align left"><AlignLeft size={16} /></button>
            <button onClick={() => applyToolbar("center")} className="btn-icon" title="Align center"><AlignCenter size={16} /></button>
            <button onClick={() => applyToolbar("right")} className="btn-icon" title="Align right"><AlignRight size={16} /></button>
            <span className="mx-1 h-5 w-px bg-border" />
            <button onClick={() => applyToolbar("pagebreak")} className="btn-chip">Page Break</button>
            <span className="mx-1 h-5 w-px bg-border" />
            <label className="btn-chip cursor-pointer">
              <Upload size={16} /> DOCX
              <input type="file" accept=".docx" className="hidden" onChange={(e) => onImportDocx(e, setContent)} />
            </label>
            <label className="btn-chip cursor-pointer">
              <Upload size={16} /> HTML
              <input type="file" accept=".html,.htm,.xhtml" className="hidden" onChange={(e) => onImportHtml(e, setContent)} />
            </label>
            <button onClick={() => onPushTOC()} className="btn-chip">
              <BookOpen size={16} /> Push TOC
            </button>
            <span className="mx-1 h-5 w-px bg-border" />
            <button
              type="button"
              onClick={toggleFullscreen}
              className="btn-chip"
              title="Fullscreen Writing Mode"
            >
              <Maximize size={16} /> Fullscreen
            </button>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className={[
                  "px-3 py-2 rounded-md text-sm border",
                  preview
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-white text-ink border-border hover:bg-white/80",
                ].join(" ")}
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

        {/* White canvas (page) on gray desk */}
        <div className="rounded-3xl bg-[rgb(244,247,250)] shadow-2xl border border-border overflow-hidden flex-1 flex flex-col">
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
                <span>{count} words</span>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto grid place-items-center">
            <div className="w-full max-w-3xl">
              {preview ? (
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-bold text-ink mb-6">{title}</h1>
                  <div className="prose max-w-none text-ink">
                    {content.split("\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-[60vh] min-h-[520px] resize-none outline-none text-lg leading-7 text-ink bg-white rounded-[20px] border border-slate-200 p-6 shadow-sm"
                  placeholder="Bright white page. Use the toolbar above for H1/H2/H3, lists, alignment, page breaks, and imports."
                />
              )}
            </div>
          </div>

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
            <button className="hover:text-ink" title="Download (JSON export in top bar)">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen Mode */}
      {isFullscreen && <FullscreenEditor />}
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main
───────────────────────────────────────────────────────────── */
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
  const totalWords = chapters.reduce((s, c) => s + (c.wordCount || countWords(c.content || "")), 0);

  // persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || []
      });
    }, 400);
    return () => clearTimeout(t);
  }, [book, chapters]);

  // live sync
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

  /* ---------- Push TOC ---------- */
  const pushTOC = () => {
    // Build across all chapters from H1/H2/H3
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
  const importDocx = async (e, setContent) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const JSZip = (await import("jszip")).default;
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml").async("text");
    // Very light extraction: remove tags, treat </w:p> as newline
    const text = xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    setContent((prev) => (prev ? prev + "\n\n" + text : text));
    e.target.value = "";
  };

  const importHtml = async (e, setContent) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const txt = await file.text();
    // Convert common headings to markdown, then strip tags
    let t = txt
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_m, p1) => `\n# ${p1}\n`)
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_m, p1) => `\n## ${p1}\n`)
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_m, p1) => `\n### ${p1}\n`)
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (_m, p1) => `- ${p1}\n`)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    setContent((prev) => (prev ? prev + "\n\n" + t : t));
    e.target.value = "";
  };

  /* ---------- AI (local quick checks + mode-aware hints) ---------- */
  const runAI = ({ grammar, clarity, style, consistency }) => {
    if (!selected) return;
    const text = applyModeHints(aiMode, selected.content || "");
    const issues = [];

    if (grammar) {
      if (/\s[,.!?;:]/.test(text)) {
        issues.push({ type: "grammar", title: "Spacing before punctuation", message: "Remove spaces before , . ! ? ; :", example: "Hello , world → Hello, world" });
      }
      if (/\bi\b(?=\b)/.test(text)) {
        issues.push({ type: "grammar", title: "Lowercase 'i'", message: "Capitalize the pronoun 'I' when used alone." });
      }
      if (/--/.test(text)) {
        issues.push({ type: "grammar", title: "Double hyphen", message: "Use an em dash (—) or revise punctuation." });
      }
      if (/ {2,}/.test(text)) {
        issues.push({ type: "grammar", title: "Double spaces", message: "Condense multiple spaces to one." });
      }
      if (/\brecieve\b/i.test(text)) {
        issues.push({ type: "grammar", title: "Common misspelling: 'recieve'", message: "Replace with 'receive'." });
      }
      if (/\bteh\b/i.test(text)) {
        issues.push({ type: "grammar", title: "Common misspelling: 'teh'", message: "Replace with 'the'." });
      }
    }

    if (clarity) {
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
      const very = (text.match(/\bvery\b/gi) || []).length;
      if (very > 2) {
        issues.push({ type: "style", title: "Weak intensifier 'very'", message: "Replace 'very' with stronger wording." });
      }
      const adverbs = (text.match(/\b\w+ly\b/gi) || []).length;
      if (adverbs > 15) {
        issues.push({ type: "style", title: "Adverb overuse", message: "Reduce -ly adverbs for tighter prose." });
      }
      const repeats = (text.match(/\b(\w+)\b(?:\W+\1\b){2,}/gi) || []);
      if (repeats.length) {
        issues.push({ type: "style", title: "Word repetition", message: "Repeated words found close together." });
      }
      if (aiMode === "Screenplay") {
        issues.push({
          type: "style",
          title: "Screenplay format (basic)",
          message: "Consider ALL CAPS character names and clear scene headings (INT./EXT.).",
        });
      }
      if (aiMode === "Poetry") {
        issues.push({
          type: "style",
          title: "Poetry line shape",
          message: "Vary line length and consider line breaks for emphasis.",
        });
      }
    }

    if (consistency) {
      const smartQuotesOpen = (text.match(/[“‘]/g) || []).length;
      const smartQuotesClose = (text.match(/[”’]/g) || []).length;
      if (Math.abs(smartQuotesOpen - smartQuotesClose) > 0) {
        issues.push({ type: "style", title: "Mismatched smart quotes", message: "Balance opening/closing quotes." });
      }
      if (/\b(Email|email|e-mail)\b/i.test(text)) {
        issues.push({
          type: "style", title: "Term consistency", message: "Ensure consistent variants (e.g., email vs e-mail)."
        });
      }
    }

    const stats = computeReadability(text);
    setAiResults({ issues, stats, mode: aiMode });
  };

  const applyAIQuickFixes = () => {
    if (!selected) return;
    const fixed = applyQuickFixes(selected.content || "");
    updateChapter({ ...selected, content: fixed, wordCount: countWords(fixed), lastEdited: "Just now" });
    runAI({ grammar: true, clarity: true, style: true, consistency: true });
  };

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      <TopBanner
        bookTitle={book?.title}
        onNewChapter={addChapter}
        onExport={exportJSON}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* 3-column layout on xl: [left meta | editor | right chapters] */}
        <div className="grid grid-cols-1 xl:grid-cols-[20rem_1fr_20rem] gap-6 pt-6 lg:pt-8 w-full">
          {/* left meta + AI */}
          <MetaSidebar
            book={book}
            chapterWordCount={selected ? countWords(selected.content || "") : 0}
            totalWords={totalWords}
            aiMode={aiMode}
            setAiMode={setAiMode}
            aiResults={aiResults}
            onRunAI={runAI}
            onApplyFixes={applyAIQuickFixes}
          />

          {/* center editor */}
          <WritingEditor
            chapter={selected}
            onSave={() => {}}
            onUpdate={updateChapter}
            onCreateNew={addChapter}
            onPushTOC={pushTOC}
            onImportDocx={importDocx}
            onImportHtml={importHtml}
          />

          {/* right chapters */}
          <ChapterRail
            chapters={chapters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAdd={addChapter}
            onDelete={deleteChapter}
            open={railOpen}
            setOpen={setRailOpen}
            side="right"
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Tiny button styles (Tailwind utility aliases)
───────────────────────────────────────────────────────────── */
const style = document.createElement("style");
style.innerHTML = `
.btn-icon{display:inline-flex;align-items:center;gap:.25rem;padding:.4rem;border-radius:.5rem;border:1px solid var(--brand-border,#e5e7eb);background:#fff;color:#0f172a}
.btn-icon:hover{background:#fff;opacity:.9}
.btn-chip{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .6rem;border-radius:.6rem;border:1px solid var(--brand-border,#e5e7eb);background:#fff;color:#0f172a;font-size:.85rem}
.btn-chip:hover{background:#fff;opacity:.9}
`;
document.head.appendChild(style);
