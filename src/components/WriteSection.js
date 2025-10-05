// src/components/WriteSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus, Save, Eye, FileText, Edit3, Trash2,
  Menu, X, Target, Clock, RotateCcw, Download,
  CheckCircle, AlertCircle, Lightbulb, Zap, Brain, MessageSquare,
  RefreshCw, Wand2, Users, BookOpen, MapPin, ArrowLeft, Maximize, Minimize, Moon, Sun,
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List as ListBullets, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Eraser, Upload
} from "lucide-react";
import { NavLink } from "react-router-dom";

/* ──────────────────────────────────────────────────────────────
   Shared storage helpers (same key as Project/TOC)
───────────────────────────────────────────────────────────── */
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
          // content can be HTML; we seed with simple paragraphs
          content:
            "<h1>Chapter 1: First Chord</h1><p>Jacque's fingers trembled as they touched the guitar strings for the first time on stage...</p>",
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
            "<h1>Chapter 2: Backstage Revelations</h1><p>The dressing room smelled of stale coffee and nervous energy...</p>",
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
      toc: [] // where we’ll store pushed table of contents
    }
  );
};

/* ──────────────────────────────────────────────────────────────
   Top banner (light glass, brand buttons)
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
              <FileText size={16} /> Export JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────────────────────────────────────────────────────────────
   RIGHT: Chapter rail (collapsible on mobile, static on xl)
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

      {/* Desktop/static column content */}
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
              {ch.wordCount} words • {ch.lastEdited}
            </div>
          </button>
          <div className="px-3 pb-2 flex gap-2">
            <span className="px-2 py-0.5 text-[10px] rounded bg-white/70 border border-white/60 text-muted">
              {ch.status}
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
   Compact AI Assistant (raised above editor)
───────────────────────────────────────────────────────────── */
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
    <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold text-ink">
          <Brain size={18} className="text-primary" />
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
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-white border-border text-muted hover:bg-white/80",
              ].join(" ")}
            >
              {t === "suggestions" ? "Ideas" : t === "grammar" ? "Grammar" : "Prompts"}
            </button>
          ))}
          <button
            onClick={generate}
            disabled={busy}
            className="px-2 py-1 rounded-md text-xs bg-primary text-white hover:opacity-90 disabled:opacity-50"
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
                className="min-w-[16rem] p-3 rounded-xl border border-border bg-white"
              >
                <div className="flex items-start gap-2">
                  <Lightbulb size={16} className="text-gold mt-0.5" />
                  <div className="text-sm text-ink">
                    {s}
                    <div>
                      <button
                        onClick={() => onApply(s)}
                        className="text-primary text-xs mt-2"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted">No suggestions yet.</div>
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
            <div className="min-w-[16rem] p-3 rounded-xl border border-accent/40 bg-accent/15">
              <div className="flex items-start gap-2 text-sm text-ink">
                <MessageSquare size={16} className="text-accent mt-0.5" />
                Character: What secret is your protagonist hiding?
              </div>
            </div>
            <div className="min-w-[16rem] p-3 rounded-xl border border-primary/30 bg-primary/10">
              <div className="flex items-start gap-2 text-sm text-ink">
                <Zap size={16} className="text-primary mt-0.5" />
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
   Small helpers for the rich editor
───────────────────────────────────────────────────────────── */
const sanitizeBasic = (html) => {
  // very light whitelist; enough for our editor use
  const allowed = /<(\/)?(p|br|h1|h2|h3|strong|b|em|i|u|ul|ol|li|hr|span)(\s+[^>]*)?>/gi;
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  // strip scripts and event handlers
  tmp.querySelectorAll("script, style").forEach((n) => n.remove());
  tmp.querySelectorAll("*").forEach((el) => {
    [...el.attributes].forEach((a) => {
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
    });
  });
  // remove disallowed tags but keep text
  const walker = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) {
        const tag = child.nodeName.toLowerCase();
        if (!allowed.test(`<${tag}>`)) {
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.replaceWith(frag);
        } else {
          walker(child);
        }
      }
    });
  };
  walker(tmp);
  return tmp.innerHTML;
};

const htmlToText = (html) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html || "";
  return (tmp.textContent || "").replace(/\s+/g, " ").trim();
};

/* ──────────────────────────────────────────────────────────────
   Writing Editor (Word-like page) + fullscreen + toolbar + imports
───────────────────────────────────────────────────────────── */
const WritingEditor = ({
  chapter, onSave, onUpdate, onCreateNew, onPushTOC,
  chapters = [], onSelectChapter
}) => {
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [count, setCount] = useState(0);
  const [preview, setPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenTheme, setFullscreenTheme] = useState("light"); // light, dark, sepia
  const editorRef = useRef(null);
  const importDocxInputRef = useRef(null);
  const importHtmlInputRef = useRef(null);

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

  // Update word count from HTML text content
  useEffect(() => {
    const words = htmlToText(content).split(/\s+/).filter(Boolean).length;
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
      content, // HTML
      wordCount: count,
      lastEdited: "Just now",
    });
    onSave?.();
  };

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  const getFullscreenTheme = () => {
    switch (fullscreenTheme) {
      case 'dark': return 'bg-slate-900 text-slate-100';
      case 'sepia': return 'bg-amber-50 text-amber-900';
      default: return 'bg-white text-ink';
    }
  };

  const getPageColors = () => {
    // outer desk is gray, page is bright white
    return {
      desk: "bg-slate-100",
      page: fullscreenTheme === "dark" ? "bg-white/95" : "bg-white"
    };
  };

  // basic rich commands
  const exec = (cmd, val = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val);
    setContent(editorRef.current?.innerHTML || "");
  };

  const insertPageBreak = () => {
    editorRef.current?.focus();
    const el = document.createElement("hr");
    el.className = "page-break";
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    range.insertNode(el);
    range.setStartAfter(el);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    setContent(editorRef.current?.innerHTML || "");
  };

  // imports
  const handleImportDocx = async (file) => {
    if (!file) return;
    const { default: JSZip } = await import("jszip");
    const ab = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(ab);
    const doc = await zip.file("word/document.xml")?.async("string");
    if (!doc) {
      alert("Could not read the .docx (missing document.xml).");
      return;
    }
    // minimal .docx XML → HTML
    const xml = new DOMParser().parseFromString(doc, "text/xml");
    const paras = [...xml.getElementsByTagName("w:p")];
    let html = "";
    paras.forEach((p) => {
      const pStyle = p.querySelector("w:pStyle")?.getAttribute("w:val");
      const runs = [...p.getElementsByTagName("w:t")].map((t) => t.textContent).join("");
      if (!runs) { html += "<p><br/></p>"; return; }
      if (pStyle === "Heading1") html += `<h1>${runs}</h1>`;
      else if (pStyle === "Heading2") html += `<h2>${runs}</h2>`;
      else if (pStyle === "Heading3") html += `<h3>${runs}</h3>`;
      else html += `<p>${runs}</p>`;
    });
    const clean = sanitizeBasic(html);
    setContent(clean);
    // reflect in editor box
    if (editorRef.current) editorRef.current.innerHTML = clean;
  };

  const handleImportHtml = async (file) => {
    if (!file) return;
    const text = await file.text();
    const clean = sanitizeBasic(text);
    setContent(clean);
    if (editorRef.current) editorRef.current.innerHTML = clean;
  };

  // Fullscreen Mode Component (with chapter picker)
  const [fsRailOpen, setFsRailOpen] = useState(false);

  const FullscreenEditor = () => (
    <div className={`fixed inset-0 z-[9999] ${getFullscreenTheme()} transition-colors duration-200`}>
      <style>{`
        .page-break { border: 0; border-top: 2px dashed #cbd5e1; margin: 24px 0; page-break-before: always; }
      `}</style>

      {/* Fullscreen Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between border-b border-current border-opacity-10 bg-opacity-90 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setFsRailOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-current/10"
            title="Chapters"
          >
            <Menu size={18} />
          </button>
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
                className={`px-3 py-2 text-sm transition-colors ${fullscreenTheme === key ? 'bg-current bg-opacity-10' : 'hover:bg-current hover:bg-opacity-5'}`}
                title={label}
              >
                {typeof Icon === 'string' ? Icon : <Icon size={16} />}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-colors"
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

      {/* Chapter drawer */}
      {fsRailOpen && (
        <aside className="absolute top-16 left-0 bottom-0 w-72 bg-white/90 backdrop-blur border-r border-current/10 overflow-auto p-3">
          <div className="text-xs font-semibold text-ink mb-2">Chapters</div>
          <div className="space-y-1">
            {chapters.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onSelectChapter?.(c.id);
                  setFsRailOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-ink"
              >
                <div className="text-sm font-medium truncate">{c.title}</div>
                <div className="text-[11px] text-muted">{c.wordCount || 0} words</div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Fullscreen Content */}
      <div className={`pt-20 pb-8 px-8 h-full flex items-center justify-center ${getPageColors().desk}`}>
        <div className="w-full max-w-4xl h-full">
          <div className={`mx-auto ${getPageColors().page} shadow-2xl border border-slate-300 rounded-xl`}>
            {/* Page-like padding + editable area */}
            <div className="px-10 py-8">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => setContent(editorRef.current?.innerHTML || "")}
                className="min-h-[60vh] outline-none text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content || "<p><br/></p>" }}
              />
            </div>
          </div>
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

  // toolbar for normal mode
  const Toolbar = () => (
    <>
      <style>{`
        .page-break { border: 0; border-top: 2px dashed #e2e8f0; margin: 24px 0; page-break-before: always; }
      `}</style>
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-white/70 backdrop-blur">
        {/* formatting */}
        <button className="px-2 py-1 rounded hover:bg-white" title="Bold" onClick={() => exec("bold")}><Bold size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Italic" onClick={() => exec("italic")}><Italic size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Underline" onClick={() => exec("underline")}><Underline size={16} /></button>
        <span className="mx-1 w-px h-5 bg-border" />
        <button className="px-2 py-1 rounded hover:bg-white" title="Heading 1" onClick={() => exec("formatBlock", "H1")}><Heading1 size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Heading 2" onClick={() => exec("formatBlock", "H2")}><Heading2 size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Heading 3" onClick={() => exec("formatBlock", "H3")}><Heading3 size={16} /></button>
        <span className="mx-1 w-px h-5 bg-border" />
        <button className="px-2 py-1 rounded hover:bg-white" title="Bulleted list" onClick={() => exec("insertUnorderedList")}><ListBullets size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Numbered list" onClick={() => exec("insertOrderedList")}><ListOrdered size={16} /></button>
        <span className="mx-1 w-px h-5 bg-border" />
        <button className="px-2 py-1 rounded hover:bg-white" title="Align left" onClick={() => exec("justifyLeft")}><AlignLeft size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Align center" onClick={() => exec("justifyCenter")}><AlignCenter size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Align right" onClick={() => exec("justifyRight")}><AlignRight size={16} /></button>
        <span className="mx-1 w-px h-5 bg-border" />
        <button className="px-2 py-1 rounded hover:bg-white" title="Clear formatting" onClick={() => exec("removeFormat")}><Eraser size={16} /></button>
        <button className="px-2 py-1 rounded hover:bg-white" title="Insert page break" onClick={insertPageBreak}>⧉</button>

        {/* importers */}
        <span className="mx-1 w-px h-5 bg-border" />
        <button className="px-2 py-1 rounded hover:bg-white" title="Import Word (.docx)" onClick={() => importDocxInputRef.current?.click()}>
          <Upload size={16} /> <span className="ml-1 text-xs">DOCX</span>
        </button>
        <input type="file" accept=".docx" className="hidden" ref={importDocxInputRef}
               onChange={(e) => handleImportDocx(e.target.files?.[0])} />
        <button className="px-2 py-1 rounded hover:bg-white" title="Import HTML" onClick={() => importHtmlInputRef.current?.click()}>
          <Upload size={16} /> <span className="ml-1 text-xs">HTML</span>
        </button>
        <input type="file" accept=".html,.htm,text/html" className="hidden" ref={importHtmlInputRef}
               onChange={(e) => handleImportHtml(e.target.files?.[0])} />

        {/* actions right */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreview((v) => !v)}
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
            onClick={toggleFullscreen}
            className="px-3 py-2 rounded-md text-sm border bg-white text-ink border-border hover:bg-white/80 transition-colors"
            title="Fullscreen Writing Mode"
          >
            <Maximize size={16} />
          </button>
          <button
            type="button"
            onClick={onPushTOC}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-ink border-border hover:bg-white/80"
            title="Build and push TOC from H1/H2/H3"
          >
            <BookOpen size={16} />
            <span className="text-sm">Push TOC</span>
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
    </>
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
      <div className="flex-1 flex flex-col gap-4">
        {/* raised AI assistant */}
        <AIAssistant
          chapter={chapter}
          onApply={(s) => {
            // append suggestion as a new paragraph
            const add = `<p>${s}</p>`;
            const next = (content || "<p><br/></p>") + add;
            setContent(next);
            if (editorRef.current) editorRef.current.innerHTML = next;
          }}
        />

        {/* Word-like page on desk */}
        <div className="rounded-3xl shadow-2xl border border-border overflow-hidden flex-1 flex flex-col bg-slate-100">
          {/* toolbar */}
          <Toolbar />

          {/* White page */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-3xl mx-auto bg-white rounded-xl shadow border border-slate-300">
              {/* Title row above the page */}
              <div className="px-6 pt-4 pb-2 flex items-center justify-between">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-semibold bg-transparent text-ink outline-none w-full"
                  placeholder="Chapter title"
                />
                <div className="hidden sm:flex items-center gap-2 text-sm text-muted ml-4">
                  <Target size={14} />
                  <span>{count} words</span>
                </div>
              </div>

              {/* Editable page body */}
              <div className="px-10 pb-8">
                {preview ? (
                  <div className="prose max-w-none text-ink py-4" dangerouslySetInnerHTML={{ __html: content || "<p><br/></p>" }} />
                ) : (
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={() => setContent(editorRef.current?.innerHTML || "")}
                    className="min-h-[60vh] outline-none text-lg leading-relaxed py-4"
                    dangerouslySetInnerHTML={{ __html: content || "<p><br/></p>" }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* footer strip */}
          <div className="px-5 py-3 border-t border-border bg-white/70 text-sm text-muted flex items-center justify-between">
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
            <button className="hover:text-ink" title="Download raw HTML"
              onClick={() => {
                const blob = new Blob([content || ""], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${(title || "chapter").replace(/[^\w\-]+/g, "_")}.html`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
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
   LEFT: Story Meta sidebar (+ Quick Nav)
───────────────────────────────────────────────────────────── */
const MetaSidebar = ({ book, chapterWordCount, totalWords }) => {
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

        {/* Stats */}
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

        {/* Theme */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="flex items-center gap-2 text-ink font-semibold mb-2">
            <Lightbulb size={16} className="text-gold" /> Theme
          </div>
          <div className="text-sm text-muted">The underlying idea you're exploring.</div>
        </div>

        {/* Description */}
        <div className="rounded-2xl bg-white/80 backdrop-blur border border-border p-4">
          <div className="flex items-center gap-2 text-ink font-semibold mb-2">
            <BookOpen size={16} className="text-primary" /> Description
          </div>
          <div className="text-sm text-muted">A quick summary of your book (synopsis/logline).</div>
        </div>
      </div>
    </aside>
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
  const [railOpen, setRailOpen] = useState(false); // closed by default on mobile

  const selected = chapters.find((c) => c.id === selectedId) || null;

  // derived totals
  const totalWords = chapters.reduce((s, c) => s + (c.wordCount || 0), 0);

  // persist (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        ...current,
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "dark", focusMode: false },
        toc: current.toc || []
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
      content: "<h1>Untitled</h1><p><br/></p>",
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

  // Build a TOC from chapter HTML (looks for H1/H2/H3)
  const buildTOC = React.useCallback(() => {
    const toItems = (html) => {
      try {
        const doc = new DOMParser().parseFromString(html || "", "text/html");
        const hs = Array.from(doc.querySelectorAll("h1,h2,h3"));
        return hs.map((h) => ({
          level: Number(h.tagName[1]),      // 1, 2, 3
          text: (h.textContent || "").trim()
        }));
      } catch {
        return [];
      }
    };
    return chapters.map((ch) => ({
      chapterId: ch.id,
      chapterTitle: ch.title,
      items: toItems(ch.content || "")
    }));
  }, [chapters]);

  // Save TOC into localStorage and notify other pages
  const pushTOC = React.useCallback(() => {
    const existing = loadState() || {};
    const toc = buildTOC();
    saveState({
      ...existing,
      book,
      chapters,
      toc, // <— TOC lives here
    });
    alert("Table of Contents updated from chapter headings (H1/H2/H3). Open the TOC page to see it.");
  }, [book, chapters, buildTOC]);

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
            onPushTOC={pushTOC}
            chapters={chapters}
            onSelectChapter={setSelectedId}
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
