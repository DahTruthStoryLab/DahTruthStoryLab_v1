// src/components/WriteSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus, Save, Eye, FileText, Edit3, Trash2,
  Menu, X, Target, Clock, RotateCcw, Download,
  CheckCircle, AlertCircle, Lightbulb, Zap, Brain, MessageSquare,
  RefreshCw, Wand2, Users, BookOpen, MapPin, ArrowLeft, Maximize, Minimize, Moon, Sun
} from "lucide-react";
import { NavLink } from "react-router-dom";

/* ──────────────────────────────────────────────────────────────
   Shared storage helpers (same key as Project/TOC)
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
    // let other tabs/pages update live
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
            "Jacque's fingers trembled as they touched the guitar strings for the first time on stage...",
          wordCount: 1205,
          lastEdited: "2 hours ago",
          status: "draft",
          aiSuggestions: [
            "Consider adding more sensory details about the stage environment",
            "Develop Jacque's internal conflict more deeply",
          ],
          grammarIssues: [],
        },
        {
          id: 2,
          title: "Chapter 2: Backstage Revelations",
          content:
            "The dressing room smelled of stale coffee and nervous energy...",
          wordCount: 892,
          lastEdited: "Yesterday",
          status: "draft",
          aiSuggestions: [
            "Show more character interaction and relationship dynamics",
            "Consider adding dialogue tags for clarity",
          ],
          grammarIssues: [{ type: "suggestion", text: "Consider a comma after 'themselves'" }],
        },
      ],
      daily: { goal: 500, counts: {} },
      settings: { theme: "dark", focusMode: false },
    }
  );
};

/* ──────────────────────────────────────────────────────────────
   Banner (simple): left title, center book name, right actions
──────────────────────────────────────────────────────────────── */
const TopBanner = ({ bookTitle, onNewChapter, onExport }) => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="font-extrabold tracking-wide">Write your story</div>

          <div className="hidden md:block text-center">
            <div className="text-sm opacity-90">Current project</div>
            <div className="text-lg font-semibold">
              {bookTitle || "Untitled Book"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onNewChapter}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium border border-white/20"
            >
              <Plus size={16} /> New Chapter
            </button>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium border border-white/20"
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
   RIGHT: Chapter rail (collapsible on mobile, static on xl)
──────────────────────────────────────────────────────────────── */
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
        className={`xl:hidden fixed ${toggleBtnPos} top-20 z-40 p-2 rounded-lg bg-white/10 text-white border border-white/20 backdrop-blur-md`}
        title="Toggle chapters"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Mobile drawer */}
      <aside
        className={[
          "xl:hidden fixed top-16", fixedSide,
          "h-[calc(100vh-4rem)] w-72 z-30",
          "bg-white/10 backdrop-blur-xl", borderSide, "border-white/20",
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

      {/* Desktop/static column content (placed inside grid) */}
      <div className="hidden xl:block">
        <div className="sticky top-20">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
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
    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
      <h2 className="text-white font-semibold">Chapters</h2>
      <button
        type="button"
        onClick={onAdd}
        className="p-2 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20"
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
              ? "bg-indigo-500/20 border-indigo-400/40"
              : "bg-white/5 border-white/10 hover:bg-white/10",
            "text-white"
          ].join(" ")}
        >
          <button
            type="button"
            onClick={() => onSelect(ch.id)}
            className="w-full text-left px-3 py-2"
          >
            <div className="text-sm font-medium truncate">{ch.title}</div>
            <div className="text-xs text-white/70">
              {ch.wordCount} words • {ch.lastEdited}
            </div>
          </button>
          <div className="px-3 pb-2 flex gap-2">
            <span className="px-2 py-0.5 text-[10px] rounded bg-white/10 border border-white/20">
              {ch.status}
            </span>
            <button
              type="button"
              onClick={() => onDelete(ch.id)}
              className="ml-auto text-rose-200/90 hover:text-rose-100 p-1"
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
   Compact AI Assistant (raised above editor)
──────────────────────────────────────────────────────────────── */
const AIAssistant = ({ chapter, onApply }) => {
  const [tab, setTab] = useState("suggestions");
  const [busy, setBusy] = useState(false);

  const ideas = chapter?.aiSuggestions || [];
  const grammar = chapter?.grammarIssues || [];

  const generate = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 1200);
  };

  return (
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Brain size={18} className="text-indigo-500" />
          AI Assistant
        </div>
        <div className="flex items-center gap-2">
          {["suggestions", "grammar", "prompts"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-2 py-1 rounded-md text-xs border",
                tab === t
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
              ].join(" ")}
            >
              {t === "suggestions" ? "Ideas" : t === "grammar" ? "Grammar" : "Prompts"}
            </button>
          ))}
          <button
            onClick={generate}
            disabled={busy}
            className="px-2 py-1 rounded-md text-xs bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {busy ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-3 overflow-x-auto">
        {tab === "suggestions" &&
          (ideas.length ? (
            ideas.map((s, i) => (
              <div
                key={i}
                className="min-w-[16rem] p-3 rounded-xl border border-slate-200 bg-white"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="text-amber-500 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    {s}
                    <div>
                      <button
                        onClick={() => onApply(s)}
                        className="text-indigo-600 text-xs mt-2"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-slate-600">No suggestions yet.</div>
          ))}

        {tab === "grammar" &&
          (grammar.length ? (
            grammar.map((g, i) => (
              <div
                key={i}
                className="min-w-[16rem] p-3 rounded-xl border border-amber-200 bg-amber-50"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-900">{g.text}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="min-w-[16rem] p-3 rounded-xl border border-emerald-200 bg-emerald-50">
              <div className="flex items-center gap-2 text-sm text-emerald-900">
                <CheckCircle size={16} className="text-emerald-600" />
                No grammar issues found!
              </div>
            </div>
          ))}

        {tab === "prompts" && (
          <>
            <div className="min-w-[16rem] p-3 rounded-xl border border-violet-200 bg-violet-50">
              <div className="flex items-start gap-2 text-sm text-violet-900">
                <MessageSquare size={16} className="text-violet-600 mt-0.5" />
                Character: What secret is your protagonist hiding?
              </div>
            </div>
            <div className="min-w-[16rem] p-3 rounded-xl border border-blue-200 bg-blue-50">
              <div className="flex items-start gap-2 text-sm text-blue-900">
                <Zap size={16} className="text-blue-600 mt-0.5" />
                Plot: Add a conflict that tests a friendship.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   LEFT: Story Meta sidebar (+ Quick Nav)
──────────────────────────────────────────────────────────────── */
const MetaSidebar = ({ book, chapterWordCount, totalWords }) => {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 space-y-4">
        {/* Quick Nav */}
        <div className="flex flex-col gap-2">
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </NavLink>
          <div className="flex gap-2">
            <NavLink
              to="/toc"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              <BookOpen size={16} />
              TOC
            </NavLink>
            <NavLink
              to="/project"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15"
            >
              <FileText size={16} />
              Project
            </NavLink>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-2 font-medium">Word Count</div>
          <div className="text-slate-900">
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

        {/* Characters */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
            <Users size={16} className="text-indigo-500" /> Characters
          </div>
          <div className="text-sm text-slate-700">
            Add/track your key characters here.
          </div>
        </div>

        {/* Setting */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
            <MapPin size={16} className="text-emerald-600" /> Setting
          </div>
          <div className="text-sm text-slate-700">Where and when your story happens.</div>
        </div>

        {/* Theme */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
            <Lightbulb size={16} className="text-amber-500" /> Theme
          </div>
          <div className="text-sm text-slate-700">The underlying idea you're exploring.</div>
        </div>

        {/* Description */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-2">
            <BookOpen size={16} className="text-sky-600" /> Description
          </div>
          <div className="text-sm text-slate-700">
            A quick summary of your book (synopsis/logline).
          </div>
        </div>
      </div>
    </aside>
  );
};

/* ──────────────────────────────────────────────────────────────
   Writing Editor (white canvas) WITH FULLSCREEN MODE
──────────────────────────────────────────────────────────────── */
const WritingEditor = ({ chapter, onSave, onUpdate, onCreateNew }) => {
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTheme, setFullscreenTheme] = useState("light"); // light, dark, sepia

  // Only update when switching between different chapters
  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title || "");
      setContent(chapter.content || "");
    } else {
      setTitle("");
      setContent("");
    }
  }, [chapter?.id]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    setCount(words);
  }, [content]);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const getFullscreenTheme = () => {
    switch (fullscreenTheme) {
      case 'dark':
        return 'bg-slate-900 text-slate-100';
      case 'sepia':
        return 'bg-amber-50 text-amber-900';
      default:
        return 'bg-white text-slate-900';
    }
  };

  const getTextareaTheme = () => {
    switch (fullscreenTheme) {
      case 'dark':
        return 'bg-slate-900 text-slate-100 placeholder-slate-400';
      case 'sepia':
        return 'bg-amber-50 text-amber-900 placeholder-amber-600';
      default:
        return 'bg-white text-slate-900 placeholder-slate-400';
    }
  };

  // Fullscreen Mode Component
  const FullscreenEditor = () => (
    <div className={`fixed inset-0 z-[9999] ${getFullscreenTheme()} transition-colors duration-200`}>
      {/* Fullscreen Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between border-b border-current border-opacity-10 bg-opacity-90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold bg-transparent outline-none border-b border-transparent hover:border-current focus:border-current transition-colors"
            placeholder="Chapter title"
          />
          <div className="text-sm opacity-70">
            {count} words
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <div className="flex rounded-lg border border-current border-opacity-20 overflow-hidden">
            {[
              { key: 'light', icon: Sun, label: 'Light' },
              { key: 'sepia', icon: '📄', label: 'Sepia' }, 
              { key: 'dark', icon: Moon, label: 'Dark' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setFullscreenTheme(key)}
                className={`px-3 py-2 text-sm transition-colors ${
                  fullscreenTheme === key 
                    ? 'bg-current bg-opacity-10' 
                    : 'hover:bg-current hover:bg-opacity-5'
                }`}
                title={label}
              >
                {typeof Icon === 'string' ? Icon : <Icon size={16} />}
              </button>
            ))}
          </div>
          
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
          >
            <Save size={16} />
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg hover:bg-current hover:bg-opacity-10 transition-colors"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize size={20} />
          </button>
        </div>
      </div>

      {/* Fullscreen Content */}
      <div className="pt-20 pb-8 px-8 h-full flex items-center justify-center">
        <div className="w-full max-w-4xl h-full flex flex-col">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`w-full flex-1 resize-none outline-none text-lg leading-relaxed ${getTextareaTheme()}`}
            placeholder="Start writing your story here... Press Esc to exit fullscreen."
            autoFocus
          />
        </div>
      </div>

      {/* Fullscreen Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-center text-sm opacity-50">
        <div className="flex items-center justify-center gap-4">
          <span>Last saved: {chapter?.lastEdited || 'Never'}</span>
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
          <div className="w-16 h-16 bg-white/70 rounded-full grid place-items-center mx-auto mb-4 border border-slate-200">
            <Edit3 size={24} className="text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Start writing</h3>
          <p className="text-slate-300 mb-4">Create your first chapter to begin.</p>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500"
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
      <div className="flex-1 flex flex-col gap-4">
        {/* raised AI assistant */}
        <AIAssistant
          chapter={chapter}
          onApply={(s) => setContent((c) => c + (c.endsWith("\n") ? "" : "\n\n") + s)}
        />

        {/* white canvas */}
        <div className="rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="px-5 py-3 border-b border-slate-200 bg-white/70 backdrop-blur flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold bg-transparent text-slate-900 outline-none"
                placeholder="Chapter title"
              />
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <Target size={14} />
                <span>{count} words</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3 py-2 rounded-md text-sm border bg-white text-slate-700 border-slate-200 hover:bg-slate-50 transition-colors"
                title="Fullscreen Writing Mode"
              >
                <Maximize size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPreview(!preview)}
                className={[
                  "px-3 py-2 rounded-md text-sm border",
                  preview
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                ].join(" ")}
                title="Preview"
              >
                <Eye size={16} />
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
              >
                <Save size={16} />
                Save
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-auto">
            {preview ? (
              <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-slate-900 mb-6">{title}</h1>
                <div className="prose max-w-none">
                  {content.split("\n").map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[60vh] min-h-[420px] resize-none outline-none text-lg leading-7 text-slate-900"
                placeholder="Start writing your story here..."
              />
            )}
          </div>

          <div className="px-5 py-3 border-t border-slate-200 bg-white/70 text-sm text-slate-600 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock size={14} />
                <span>Last saved: {chapter.lastEdited}</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={14} />
                <span>Auto-save enabled</span>
              </div>
            </div>
            <button className="hover:text-slate-800" title="Download">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Render Fullscreen Mode */}
      {isFullscreen && <FullscreenEditor />}
    </>
  );
};

/* ──────────────────────────────────────────────────────────────
   Main
──────────────────────────────────────────────────────────────── */
export default function WriteSection() {
  const initial = useMemo(getInitialState, []);
  const [book, setBook] = useState(initial.book);
  const [chapters, setChapters] = useState(initial.chapters);
  const [selectedId, setSelectedId] = useState(initial.chapters[0]?.id || null);
  const [railOpen, setRailOpen] = useState(false); // closed by default on mobile

  const selected = chapters.find((c) => c.id === selectedId) || null;

  // derived totals
  const totalWords = chapters.reduce((s, c) => s + (c.wordCount || 0), 0);

  // persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "dark", focusMode: false },
      });
    }, 500);
    return () => clearTimeout(t);
  }, [book, chapters]);

  // live sync if other pages update
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

  const addChapter = () => {
    const id = Date.now();
    const ch = {
      id,
      title: `Chapter ${chapters.length + 1}: Untitled`,
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
      aiSuggestions: [],
      grammarIssues: [],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <TopBanner
        bookTitle={book?.title}
        onNewChapter={addChapter}
        onExport={exportJSON}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        {/* 3-column layout on xl: [left meta | editor | right chapters] */}
        <div className="grid grid-cols-1 xl:grid-cols-[20rem_1fr_20rem] gap-6 pt-6 lg:pt-8 w-full">
          {/* left meta */}
          <MetaSidebar
            book={book}
            chapterWordCount={selected?.wordCount || 0}
            totalWords={totalWords}
          />

          {/* center editor */}
          <WritingEditor
            chapter={selected}
            onSave={() => {}}
            onUpdate={updateChapter}
            onCreateNew={addChapter}
          />

          {/* right chapters (static on xl, drawer on mobile) */}
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
