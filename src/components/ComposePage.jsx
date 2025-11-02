// src/components/ComposePage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import {
  ArrowLeft,
  Bot,
  Save,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Grid,
  BookOpenCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";

import {
  runAssistant,
  runGrammar,
  runStyle,
  runReadability,
  runRewrite,
  proofread,
  clarify,
  rewrite,
  runPublishingPrep,
} from "../lib/api";

/* ------- Fonts whitelist (family + size) ------- */
const Font = Quill.import("formats/font");
const FONT_WHITELIST = [
  "sans",
  "serif",
  "mono",
  "arial",
  "calibri",
  "cambria",
  "timesnewroman",
  "georgia",
  "garamond",
  "verdana",
  "couriernew",
];
Font.whitelist = FONT_WHITELIST;
Quill.register(Font, true);

const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

/* ------- Load Mammoth dynamically from CDN ------- */
async function loadMammoth() {
  if (window.mammoth) return window.mammoth;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Mammoth"));
    document.head.appendChild(s);
  });
  return window.mammoth;
}

/* ------- Storage helpers ------- */
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";
const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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

/* ------- Small helpers ------- */
const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
};
const htmlToPlain = (html = "") =>
  html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const plainToSimpleHtml = (text = "") => {
  if (!text) return "";
  const paras = text
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return paras || `<p>${text}</p>`;
};

const ensureFirstChapter = (chapters) =>
  Array.isArray(chapters) && chapters.length
    ? chapters
    : [
        {
          id: Date.now(),
          title: "Chapter 1: Untitled",
          content: "",
          wordCount: 0,
          lastEdited: "Just now",
          status: "draft",
        },
      ];

function isEditableTarget(t) {
  if (!t) return false;
  const el = t.nodeType === 3 ? t.parentElement : t;
  const tag = (el?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el?.isContentEditable) return true;
  return !!el?.closest?.('.ql-editor,[contenteditable="true"]');
}

/* ----------------------------
   Chapter Card (Grid view)
---------------------------- */
function ChapterCard({ ch, active, onOpen, onDropHere, onDragStart }) {
  // Simple non-RnD draggable (grid is for quick access)
  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "group relative rounded-2xl border p-4 text-left transition bg-white",
        active ? "ring-2 ring-primary/60" : "hover:shadow-md",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold line-clamp-2">{ch.title}</div>
        <BookOpenCheck className="opacity-60" size={18} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {(ch.wordCount || 0).toLocaleString()} words • {ch.lastEdited || "—"}
      </div>
      <div className="absolute inset-0 rounded-2xl ring-0 ring-primary/0 group-hover:ring-2 group-hover:ring-primary/20 pointer-events-none" />
    </button>
  );
}

/* Little badge that sits on the page and shows "Page X / Y" */
function PageNumberBadge({ pageIndex, pageCount }) {
  return (
    <div
      aria-label={`Page ${Math.min(pageIndex + 1, pageCount)} of ${pageCount}`}
      className="pointer-events-none select-none text-[12px] text-slate-600"
      style={{
        position: "absolute",
        bottom: 10,
        right: 16,
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 8,
        padding: "4px 8px",
        boxShadow: "0 2px 8px rgba(2,20,40,0.10)",
        backdropFilter: "blur(2px)",
      }}
    >
      Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
    </div>
  );
}


/* ----------------------------
   Compose Page
---------------------------- */
export default function ComposePage() {
  const navigate = useNavigate();

  // Load initial project
  const initial = useMemo(loadState, []);
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(
    ensureFirstChapter(initial?.chapters || [])
  );
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((c) => c.id === selectedId) || chapters[0];

  // Views: 'grid' (chapter cards) or 'editor' (book page)
  const [view, setView] = useState("grid");

  // Editor state
  const [title, setTitle] = useState(selected.title || "");
  const [html, setHtml] = useState(selected.content || "");
  const [isFS, setIsFS] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);

  const editorRef = useRef(null);
  const fsEditorRef = useRef(null);

  // AI controls
  const [instructions, setInstructions] = useState(
    "Keep ADOS cadence; pastoral but firm."
  );
  const [provider, setProvider] = useState("anthropic"); // "anthropic" | "openai"

  // Publishing prep preview
  const [pubAdvice, setPubAdvice] = useState(null);
  const [author, setAuthor] = useState("Jacqueline Session Ausby");
  const [bookTitle, setBookTitle] = useState(initial?.book?.title || "Raising Daisy");

  // Book page "flip" state
  const PAGE_HEIGHT = 1040; // px (visual page height)
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const pageContainerRef = useRef(null); // holds Quill container in editor view

  /* Sync editor when selected chapter changes */
  useEffect(() => {
    const sel = chapters.find((c) => c.id === selectedId);
    if (!sel) return;
    setTitle(sel.title || "");
    setHtml(sel.content || "");
    setPageIndex(0);
    // recalc after content renders
    const t = setTimeout(() => recalcPages(), 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, chapters, view, isFS]);

  /* Persist project (debounced) */
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

  /* Quill toolbar modules */
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: FONT_WHITELIST }],
        [{ size: Size.whitelist }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
      history: { delay: 500, maxStack: 200, userOnly: true },
    }),
    []
  );

  /* Helpers to access active Quill instance */
  const getActiveEditor = () => (isFS ? fsEditorRef.current : editorRef.current);
  const getQuill = () => getActiveEditor()?.getEditor?.();

  /* Recalculate pages by measuring the editor scroll size */
  const recalcPages = () => {
    const q = getQuill();
    if (!q) return;
    const scrollEl = q.root; // .ql-editor is scrollable when container has fixed height
    if (!scrollEl) return;
    const total = Math.max(scrollEl.scrollHeight, scrollEl.clientHeight);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    setPageCount(count);
    // Clamp current page
    setPageIndex((p) => Math.min(p, count - 1));
  };

  /* Flip to page by adjusting scrollTop on the Quill editor root */
  const goToPage = (idx) => {
    const q = getQuill();
    if (!q) return;
    const target = Math.max(0, Math.min(idx, pageCount - 1));
    q.root.scrollTop = target * PAGE_HEIGHT;
    setPageIndex(target);
  };
  const nextPage = () => goToPage(pageIndex + 1);
  const prevPage = () => goToPage(pageIndex - 1);

  /* Recalc pages after content changes and after Quill mounts */
  useEffect(() => {
    const t = setTimeout(() => recalcPages(), 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, isFS]);

  /* Make Quill render as a fixed-height "book page" */
  const quillPageStyles = {
    // outer white page
    padding: 16,
    background: "#f0f3f8",
  };
  const quillPageInnerStyles = {
    margin: "0 auto",
    width: "100%",
    maxWidth: 800,
    height: PAGE_HEIGHT, // <- fixed page height
    background: "#fff",
    color: "#111",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
    borderRadius: 12,
    padding: "48px 48px",
  };

  /* Save */
  const handleSave = useCallback(() => {
    setChapters((prevChapters) => {
      const chapterToUpdate = prevChapters.find((c) => c.id === selectedId);
      if (!chapterToUpdate) return prevChapters;

      const updated = {
        ...chapterToUpdate,
        title: title || chapterToUpdate.title,
        content: html,
        wordCount: countWords(html),
        lastEdited: new Date().toLocaleString(),
        status: chapterToUpdate.status || "draft",
      };

      const nextChapters = prevChapters.map((c) =>
        c.id === updated.id ? updated : c
      );

      const current = loadState() || {};
      saveState({
        book: { ...book, title: bookTitle || book.title },
        chapters: nextChapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });

      return nextChapters;
    });
  }, [selectedId, title, html, book, bookTitle]);

  /* Undo / Redo */
  const undo = () => getActiveEditor()?.getEditor?.()?.history?.undo?.();
  const redo = () => getActiveEditor()?.getEditor?.()?.history?.redo?.();

  /* -------- AI actions (pass instructions + provider) -------- */
  const chooseContent = (res) =>
    res?.result ??
    res?.reply ??
    res?.edited ??
    res?.text ??
    res?.output ??
    res?.echo?.message ??
    "";

  const runAI = async (mode = "proofread") => {
    setAiError(null);
    try {
      setAiBusy(true);
      const inputPlain = htmlToPlain(html || "");
      let res;

      if (mode === "clarify") res = await clarify(inputPlain, instructions, provider);
      else if (mode === "rewrite") res = await rewrite(inputPlain, instructions, provider);
      else if (mode === "grammar") res = await runGrammar(inputPlain, provider);
      else if (mode === "style") res = await runStyle(inputPlain, provider);
      else if (mode === "readability") res = await runReadability(inputPlain, provider);
      else res = await proofread(inputPlain, instructions, provider);

      const out = chooseContent(res);
      const newHtml =
        out && out !== inputPlain ? plainToSimpleHtml(out) : html;

      setHtml(newHtml);
      setChapters((prev) => {
        const next = prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                title: title || c.title,
                content: newHtml,
                wordCount: countWords(newHtml),
                lastEdited: new Date().toLocaleString(),
              }
            : c
        );
        const current = loadState() || {};
        saveState({
          book: { ...book, title: bookTitle || book.title },
          chapters: next,
          daily: current.daily || { goal: 500, counts: {} },
          settings: current.settings || { theme: "light", focusMode: false },
          tocOutline: current.tocOutline || [],
        });
        return next;
      });

      // Recalculate pagination after AI rewrite
      setTimeout(() => {
        recalcPages();
        goToPage(0);
      }, 30);
    } catch (e) {
      console.error("[AI] error:", e);
      setAiError(e?.message || "AI request failed");
      alert(e?.message || "AI request failed");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSaveAndProof = async () => {
    handleSave();
    await runAI("proofread");
  };

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "s") {
        e.preventDefault();
        handleSaveAndProof();
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "z") {
        e.preventDefault();
        redo();
      }
      // Page flipping shortcuts
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "arrowright") {
        e.preventDefault();
        nextPage();
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "arrowleft") {
        e.preventDefault();
        prevPage();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [handleSave, handleSaveAndProof, isFS, pageIndex, pageCount]);

  /* Add a new chapter */
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
  };

  /* Reorder helper (kept from your original list) */
  const reorderChapters = (dragId, targetId) => {
    if (!dragId || !targetId || dragId === targetId) return;
    setChapters((prev) => {
      const from = prev.findIndex((c) => c.id === dragId);
      const to = prev.findIndex((c) => c.id === targetId);
      if (from === -1 || to === -1 || from === to) return prev;

      const next = prev.slice();
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);

      const current = loadState() || {};
      saveState({
        book,
        chapters: next,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });

      if (selectedId === dragId) setSelectedId(dragId);
      return next;
    });
  };

  /* Import Word (.docx) */
  const ImportDocxButton = () => {
    const fileInputRef = useRef(null);
    const onPick = () => fileInputRef.current?.click();

    const onFile = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".docx")) {
        alert("Please choose a .docx file (not .doc).");
        e.target.value = "";
        return;
      }

      try {
        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();

        const { value: htmlContent } = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
            ],
            convertImage: mammoth.images.inline(async (elem) => {
              const buff = await elem.read("base64");
              return { src: `data:${elem.contentType};base64,${buff}` };
            }),
          }
        );

        const q = getQuill();
        if (q) {
          const delta = q.clipboard.convert({ html: htmlContent });
          q.setContents(delta, "user");
          setHtml(q.root.innerHTML);
          setTimeout(() => {
            recalcPages();
            goToPage(0);
          }, 30);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to import .docx");
      } finally {
        e.target.value = "";
      }
    };

    return (
      <>
        <button
          onClick={onPick}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
          title="Import Word Document"
        >
          <Upload size={16} /> Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={onFile}
        />
      </>
    );
  };

  /* Export to Word */
  const exportToDocx = () => {
    try {
      const docHtml = `
        <!DOCTYPE html>
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head>
          <meta charset='utf-8'>
          <title>${title || "Untitled Chapter"}</title>
          <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
            h1, h2, h3 { font-family: Arial, sans-serif; }
            p { margin: 0 0 12pt 0; }
          </style>
        </head>
        <body>
          <h1>${title || "Untitled Chapter"}</h1>
          ${html}
        </body>
        </html>
      `;
      const blob = new Blob(['\ufeff', docHtml], {
        type: 'application/msword',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || "chapter"}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to export document");
    }
  };

  /* Draggable + droppable chapter list item (kept for left rail list if you want it later) */
  const ChapterItem = ({ ch }) => {
    const [{ isDragging }, dragRef] = useDrag(
      () => ({
        type: "CHAPTER",
        item: { id: ch.id },
        collect: (m) => ({ isDragging: m.isDragging() }),
      }),
      [ch.id]
    );

    const [{ isOver }, dropRef] = useDrop(
      () => ({
        accept: "CHAPTER",
        drop: (item) => {
          if (item?.id && item.id !== ch.id) reorderChapters(item.id, ch.id);
        },
        collect: (m) => ({ isOver: m.isOver() }),
      }),
      [ch.id]
    );

    const setRefs = (el) => {
      dropRef(el);
      dragRef(el);
    };

    return (
      <button
        ref={setRefs}
        type="button"
        onClick={() => {
          setSelectedId(ch.id);
          setView("editor");
          setTimeout(() => {
            recalcPages();
            goToPage(0);
          }, 30);
        }}
        className={[
          "w-full text-left px-3 py-2 rounded-lg border transition",
          isOver ? "dnd-drop-hover" : "",
          isDragging ? "dnd-draggable dnd-dragging" : "dnd-draggable",
          selectedId === ch.id
            ? "bg-primary/15 border-primary/40"
            : "bg-white border-white/60 hover:bg-white/80",
        ].join(" ")}
        title={`${(ch.wordCount || 0).toLocaleString()} words`}
      >
        <div className="font-medium truncate">{ch.title}</div>
        <div className="text-xs text-slate-500">
          {(ch.wordCount || 0).toLocaleString()} words • {ch.lastEdited || "—"}
        </div>
      </button>
    );
  };

  /* Back to Dashboard */
  const goBack = () => navigate("/dashboard");

  /* Toolbar */
  const Toolbar = ({ compact = false }) => (
    <>
      {!compact && (
        <>
          <button
            onClick={undo}
            className="rounded-lg border px-2 py-1.5 bg-white hover:bg-slate-50"
            title="Undo"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={redo}
            className="rounded-lg border px-2 py-1.5 bg-white hover:bg-slate-50"
            title="Redo"
          >
            <RotateCw size={16} />
          </button>
        </>
      )}

      <ImportDocxButton />

      <button
        onClick={exportToDocx}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
        title="Export to Word"
      >
        <Download size={16} /> Export
      </button>

      {/* AI Actions */}
      <button
        onClick={() => runAI("proofread")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Proofread"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : compact ? "Proof" : "AI: Proofread"}
      </button>
      <button
        onClick={() => runAI("clarify")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Clarify"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : compact ? "Clarify" : "AI: Clarify"}
      </button>
      <button
        onClick={() => runAI("rewrite")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Clear Rewrite"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : compact ? "Rewrite" : "AI: Rewrite"}
      </button>

      {!compact && (
        <>
          <button
            onClick={() => runAI("grammar")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Grammar"
          >
            🔤 Grammar
          </button>
          <button
            onClick={() => runAI("style")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Style"
          >
            🪶 Style
          </button>
          <button
            onClick={() => runAI("readability")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Readability"
          >
            📊 Readability
          </button>
        </>
      )}

      <button
        onClick={handleSaveAndProof}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="Proofread + Save"
      >
        <Bot size={16} />
        Proof + Save
      </button>
      <button
        onClick={handleSave}
        className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-1.5 hover:opacity-90"
        title="Save (Ctrl+S)"
      >
        <Save size={16} /> Save
      </button>
    </>
  );

  /* ----------------------------
     TOP BAR
  ---------------------------- */
  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="ml-3 flex items-center gap-2">
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${view === "grid" ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
              title="Chapter Grid"
            >
              <Grid size={16} /> Grid
            </button>
            <button
              onClick={() => {
                setView("editor");
                setTimeout(() => {
                  recalcPages();
                  goToPage(0);
                }, 30);
              }}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${view === "editor" ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
              title="Open Editor"
            >
              <BookOpenCheck size={16} /> Editor
            </button>
          </div>

          {/* Provider */}
          <div className="ml-3 flex items-center gap-2">
            <label className="text-xs text-slate-600">Provider:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="flex-1" />
          <Toolbar />
          <button
            onClick={() => setIsFS((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
            title={isFS ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFS ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFS ? "Exit" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* ----------------------------
          GRID VIEW (4 x 4)
      ---------------------------- */}
      {view === "grid" && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold">Chapters</h1>
            <button
              onClick={addChapter}
              className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50"
            >
              + Add Chapter
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
            {chapters.map((c) => (
              <ChapterCard
                key={c.id}
                ch={c}
                active={c.id === selectedId}
                onOpen={() => {
                  setSelectedId(c.id);
                  setView("editor");
                  setTimeout(() => {
                    recalcPages();
                    goToPage(0);
                  }, 30);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------
          EDITOR VIEW (Book pages)
      ---------------------------- */}
      {view === "editor" && (
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6">
          {/* Left sidebar: meta + AI instructions */}
          <aside className="xl:sticky xl:top-16 space-y-3" style={{ zIndex: 10 }}>
            <div className="space-y-2 border rounded-lg p-3 bg-white">
              <div className="text-sm font-medium">Publishing Meta</div>
              <label className="text-xs text-slate-600">Book Title</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
              />
              <label className="text-xs text-slate-600">Author</label>
              <input
                className="w-full border rounded px-2 py-1 text-sm"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
              <button
                className="w-full mt-2 border rounded px-2 py-1 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
                onClick={async () => {
                  try {
                    setAiBusy(true);
                    setAiError(null);
                    const meta = {
                      title: bookTitle || book?.title || "Untitled",
                      author,
                      genre: "Literary Fiction",
                      keywords: ["family", "faith", "Philadelphia"],
                    };
                    const ch = [...chapters];
                    ch[0] = {
                      ...(ch[0] || { id: Date.now(), no: 1, title }),
                      title: title || ch[0]?.title || "Chapter 1",
                      text: htmlToPlain(html),
                    };
                    const advice = await runPublishingPrep(
                      meta,
                      ch,
                      { kdpTrim: "6x9", includeTOC: true, tone: "warm-biblical-editorial" },
                      provider
                    );
                    setPubAdvice(advice);
                  } catch (e) {
                    console.error(e);
                    setAiError(e?.message || "Publishing prep failed");
                    alert(e?.message || "Publishing prep failed");
                  } finally {
                    setAiBusy(false);
                  }
                }}
                disabled={aiBusy}
              >
                🚀 Run Publishing Prep
              </button>
              {aiError && (
                <div className="text-red-600 text-xs border border-red-200 bg-red-50 rounded p-2">
                  {aiError}
                </div>
              )}
              {pubAdvice && (
                <details className="text-xs">
                  <summary className="cursor-pointer select-none">Show Publishing Advice</summary>
                  <pre className="text-[11px] bg-slate-50 border rounded p-2 overflow-auto max-h-60">
                    {JSON.stringify(pubAdvice, null, 2)}
                  </pre>
                </details>
              )}
            </div>

            <div className="space-y-1 border rounded-lg p-3 bg-white">
              <div className="text-sm font-medium">AI Instructions</div>
              <textarea
                className="w-full border rounded p-2 text-sm h-24"
                placeholder="e.g., Keep my voice; simplify sentences; retain biblical tone."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>

            <div className="border rounded-lg p-3 bg-white space-y-2">
              <div className="text-sm text-slate-600">Chapters</div>
              <div className="space-y-2 max-h-[40vh] overflow-auto pr-1">
                {chapters.map((c) => (
                  <ChapterItem key={c.id} ch={c} />
                ))}
              </div>
              <button
                onClick={addChapter}
                className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
              >
                + Add
              </button>
            </div>
          </aside>

          {/* Page editor */}
          <section className="bg-transparent">
            <div className="mb-3 flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter title"
                className="flex-1 text-lg font-semibold outline-none bg-transparent border-b border-slate-300 pb-1"
              />
              <div className="text-sm text-slate-500 whitespace-nowrap">
                {(countWords(html) || 0).toLocaleString()} words
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={pageIndex === 0}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <div className="text-sm tabular-nums">
                  Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
                </div>
                <button
                  onClick={nextPage}
                  disabled={pageIndex >= pageCount - 1}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* White page with page-height viewport */}
            <div style={quillPageStyles}>
              <div
                style={{
                  ...quillPageInnerStyles,
                  position: "relative",         // <-- add this so we can absolutely position the badge
                  overflow: "hidden"            // keeps badge visually crisp on edges
                }}
              >
                <ReactQuill
                  ref={editorRef /* or fsEditorRef in the fullscreen block */}
                  theme="snow"
                  value={html}
                  onChange={(v) => {
                    setHtml(v);
                    setTimeout(recalcPages, 10);
                  }}
                  modules={modules}
                  placeholder="Write your chapter…"
                />
            
                {/* Page number overlay */}
                <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                onClick={handleSaveAndProof}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
                disabled={aiBusy}
                title="Proofread + Save"
              >
                <Bot size={16} />
                Proof + Save
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-1.5 hover:opacity-90"
                title="Save (Ctrl+S)"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Fullscreen overlay (optional — keeps your old FS, works with page flip too) */}
      {isFS && view === "editor" && (
        <div className="fixed inset-0 z-[9999] bg-[#fdecef]">
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between gap-2 bg-white/90 backdrop-blur border-b">
            <button
              onClick={() => setView("grid")}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
              title="Back to Grid"
            >
              <Grid size={16} /> Grid
            </button>

            <div className="flex items-center gap-2">
              <Toolbar compact />
              <button
                onClick={() => setIsFS(false)}
                className="rounded-lg border bg-white px-3 py-1.5 hover:bg-slate-50"
                title="Exit Fullscreen"
              >
                <Minimize2 size={18} />
              </button>
            </div>
          </div>

          <div className="pt-20 pb-6 px-6 h-full overflow-auto">
            <div className="mx-auto" style={{ maxWidth: 880 }}>
              <div className="mb-3 flex items-center gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 text-xl font-semibold bg-transparent outline-none border-b border-slate-300 pb-1"
                  placeholder="Chapter title"
                />
                <span className="text-sm text-slate-500">
                  {(countWords(html) || 0).toLocaleString()} words
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={prevPage}
                    disabled={pageIndex === 0}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>
                  <div className="text-sm tabular-nums">
                    Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
                  </div>
                  <button
                    onClick={nextPage}
                    disabled={pageIndex >= pageCount - 1}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div style={quillPageStyles}>
                <div style={quillPageInnerStyles}>
                  <ReactQuill
                    ref={fsEditorRef}
                    theme="snow"
                    value={html}
                    onChange={(v) => {
                      setHtml(v);
                      setTimeout(recalcPages, 10);
                    }}
                    modules={modules}
                    placeholder="Write in fullscreen…"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={handleSaveAndProof}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
                  disabled={aiBusy}
                  title="Proofread + Save"
                >
                  <Bot size={16} />
                  Proof + Save
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-1.5 hover:opacity-90"
                  title="Save (Ctrl+S)"
                >
                  <Save size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------
   Styling note for Quill:
   To ensure the editor scrolls by page-height, Quill needs a
   fixed-height container and a scrollable .ql-editor.
   The inline styles above set a fixed height; Quill snow theme
   already makes .ql-editor scrollable when height is constrained.
---------------------------- */
