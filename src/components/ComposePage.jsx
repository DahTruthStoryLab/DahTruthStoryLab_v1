// src/components/ComposePage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import {
  Bot,
  Save,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";

import {
  runGrammar,
  runStyle,
  runReadability,
  proofread,
  clarify,
  rewrite,
  runPublishingPrep,
} from "../lib/api";

/* ------------------------------------
   Quill: fonts + sizes whitelists
------------------------------------ */
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

/* ------------------------------------
   Page sizing / pagination constants
------------------------------------ */
const PAGE_HEIGHT = 1040; // px visual page “viewport” height

/* ------------------------------------
   Load Mammoth dynamically from CDN
------------------------------------ */
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

/* ------------------------------------
   Local storage helpers
------------------------------------ */
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

/* ------------------------------------
   Text helpers
------------------------------------ */
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

/* ------------------------------------
   Tiny UI helpers
------------------------------------ */
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

function GoldButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1",
        className,
      ].join(" ")}
      style={{ backgroundColor: "#D4AF37" }}
    >
      {children}
    </button>
  );
}

function WritingCrumb({ view }) {
  return (
    <div className="text-[13px] text-slate-600">
      <span className="opacity-80">Writing</span>
      <span className="px-2 opacity-50">▸</span>
      <span className="font-medium">{view === "grid" ? "Chapters" : "Editor"}</span>
    </div>
  );
}

/* ------------------------------------
   Chapter card (grid) — draggable
------------------------------------ */
const DND_TYPE = "CHAPTER_CARD";
function ChapterCard({ ch, index, moveCard, onOpen, active }) {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: DND_TYPE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      if (dragIndex === index) return;
      moveCard(dragIndex, index);
      item.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: { id: ch.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={[
        "group relative rounded-2xl border p-4 text-left transition bg-white",
        active ? "ring-2 ring-primary/60" : "hover:shadow-md",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      <div className="h-2 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 mb-3" />
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold line-clamp-2">{ch.title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          {ch.status || "draft"}
        </span>
      </div>
      <p className="mt-2 text-[12px] text-slate-600 line-clamp-3">
        {String(ch.content || "").replace(/<[^>]+>/g, " ").trim().slice(0, 180) || "—"}
      </p>
      <div className="mt-3 text-[12px] text-slate-500 flex items-center justify-between">
        <span>{(ch.wordCount || 0).toLocaleString()} words</span>
        <span>{ch.lastEdited || "—"}</span>
      </div>
      <div className="absolute inset-0 rounded-2xl ring-0 ring-primary/0 group-hover:ring-2 group-hover:ring-primary/10 pointer-events-none" />
    </button>
  );
}

/* ============================
   Compose Page
============================ */
export default function ComposePage() {
  const navigate = useNavigate();

  // Initial project
  const initial = useMemo(loadState, []);
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(
    ensureFirstChapter(initial?.chapters || [])
  );
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((c) => c.id === selectedId) || chapters[0];

  // Views: 'grid' or 'editor'
  const [view, setView] = useState("grid");

  // Editor state
  const [title, setTitle] = useState(selected.title || "");
  const [html, setHtml] = useState(selected.content || "");
  const editorRef = useRef(null);

  // Pagination
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // AI controls
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [instructions, setInstructions] = useState(
    "Keep ADOS cadence; pastoral but firm."
  );
 - const [provider, setProvider] = useState("anthropic"); // "anthropic" | "openai"
+  const [provider, setProvider] = useState("openai"); // "openai" | "anthropic"
   const [pubAdvice, setPubAdvice] = useState(null);
   const [author, setAuthor] = useState("Jacqueline Session Ausby");
   const [bookTitle, setBookTitle] = useState(initial?.book?.title || "Raising Daisy");

  // Quill toolbar
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

  const getQuill = () => editorRef.current?.getEditor?.();

  const recalcPages = useCallback(() => {
    const q = getQuill();
    if (!q) return;
    const scrollEl = q.root;
    const total = Math.max(scrollEl.scrollHeight, scrollEl.clientHeight);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    setPageCount(count);
    setPageIndex((p) => Math.min(p, count - 1));
  }, []);

  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      q.root.scrollTop = target * PAGE_HEIGHT;
      setPageIndex(target);
    },
    [pageCount]
  );

  const nextPage = () => goToPage(pageIndex + 1);
  const prevPage = () => goToPage(pageIndex - 1);

  /* Sync editor when chapter changes */
  useEffect(() => {
    const sel = chapters.find((c) => c.id === selectedId);
    if (!sel) return;
    setTitle(sel.title || "");
    setHtml(sel.content || "");
    setPageIndex(0);
    const t = setTimeout(() => recalcPages(), 80);
    return () => clearTimeout(t);
  }, [selectedId, chapters, view, recalcPages]);

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

  /* Auto-advance at bottom while typing (page flip) */
  useEffect(() => {
    const q = getQuill();
    if (!q) return;

    const onTextChange = () => {
      recalcPages();

      const sel = q.getSelection();
      const atEnd = sel && sel.index >= q.getLength() - 1;
      const nearBottom = q.root.scrollTop + q.root.clientHeight >= q.root.scrollHeight - 4;

      if (atEnd && nearBottom) {
        setTimeout(() => {
          recalcPages();
          const total = Math.max(1, Math.ceil(q.root.scrollHeight / q.root.clientHeight));
          if (pageIndex < total - 1) {
            goToPage(pageIndex + 1);
          }
        }, 10);
      }
    };

    q.on("text-change", onTextChange);
    return () => q.off("text-change", onTextChange);
  }, [recalcPages, goToPage, pageIndex]);

  /* Also recalc after explicit HTML updates */
  useEffect(() => {
    const t = setTimeout(() => recalcPages(), 60);
    return () => clearTimeout(t);
  }, [html, recalcPages]);

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

      const nextChapters = prevChapters.map((c) => (c.id === updated.id ? updated : c));

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
  const undo = () => getQuill()?.history?.undo?.();
  const redo = () => getQuill()?.history?.redo?.();

  /* ------------------------------------
     AI helpers + actions
  ------------------------------------ */
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
    setAiBusy(true);
    try {
      const inputPlain = htmlToPlain(html || "");
      let res;

      if (mode === "clarify") res = await clarify(inputPlain, instructions, provider);
      else if (mode === "rewrite") res = await rewrite(inputPlain, instructions, provider);
      else if (mode === "grammar") res = await runGrammar(inputPlain, provider);
      else if (mode === "style") res = await runStyle(inputPlain, provider);
      else if (mode === "readability") res = await runReadability(inputPlain, provider);
      else res = await proofread(inputPlain, instructions, provider);

      const out = chooseContent(res);
      const newHtml = out && out !== inputPlain ? plainToSimpleHtml(out) : html;

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

  /* Shortcuts */
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
  }, [handleSave, handleSaveAndProof, pageIndex, pageCount]);

  /* Add + reorder chapters for grid drag/drop */
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
    setView("editor");
    setTimeout(() => {
      recalcPages();
      goToPage(0);
    }, 30);
  };

  const arrayMove = (arr, from, to) => {
    const copy = arr.slice();
    const [m] = copy.splice(from, 1);
    copy.splice(to, 0, m);
    return copy;
  };

  const moveCard = (fromIndex, toIndex) => {
    setChapters((prev) => {
      const next = arrayMove(prev, fromIndex, toIndex);
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
  };

  /* ------------------------------
     Import / Export
  ------------------------------ */
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
      const blob = new Blob(["\ufeff", docHtml], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
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

  const goBack = () => navigate("/dashboard");

  /* ------------------------------------
     Toolbar with AI buttons
  ------------------------------------ */
  const Toolbar = ({ compact = false }) => (
    <div className="flex items-center gap-2">
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
        {aiBusy ? "AI…" : "Proofread"}
      </button>

      <button
        onClick={() => runAI("clarify")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Clarify"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : "Clarify"}
      </button>

      <button
        onClick={() => runAI("rewrite")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Rewrite"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : "Rewrite"}
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
    </div>
  );

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      {/* Top bar with GOLD button + crumb + full AI Toolbar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 h-auto py-2 flex flex-wrap items-center gap-3">
          <GoldButton onClick={goBack} title="Back to Dashboard">
            ← Dashboard
          </GoldButton>

          <WritingCrumb view={view} />

          {/* View toggle */}
          <div className="ml-1 flex items-center gap-1">
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] ${
                view === "grid" ? "bg-slate-100" : "bg-white hover:bg-slate-50"
              }`}
              title="Chapter Grid"
            >
              Grid
            </button>
            <button
              onClick={() => {
                setView("editor");
                setTimeout(() => {
                  recalcPages();
                  goToPage(0);
                }, 30);
              }}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] ${
                view === "editor" ? "bg-slate-100" : "bg-white hover:bg-slate-50"
              }`}
              title="Open Editor"
            >
              Editor
            </button>
          </div>

          {/* Provider (compact) */}
          <div className="ml-2 flex items-center gap-1">
            <label className="text-[12px] text-slate-600">Provider:</label>
            <select
              className="border rounded px-2 py-1 text-[12px]"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          <div className="w-full sm:flex-1" />
          <Toolbar />
        </div>
      </div>

      {/* GRID VIEW (4x4) */}
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
            {chapters.map((c, idx) => (
              <ChapterCard
                key={c.id}
                ch={c}
                index={idx}
                moveCard={moveCard}
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

      {/* EDITOR VIEW (book page with flip + page numbers) */}
      {view === "editor" && (
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6">
          {/* Left: meta + AI instructions + chapters list */}
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
              <div className="space-y-2 max-h=[40vh] overflow-auto pr-1">
                {chapters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedId(c.id);
                      setView("editor");
                      setTimeout(() => {
                        recalcPages();
                        goToPage(0);
                      }, 30);
                    }}
                    className={[
                      "w-full text-left px-3 py-2 rounded-lg border transition",
                      selectedId === c.id
                        ? "bg-primary/15 border-primary/40"
                        : "bg-white border-white/60 hover:bg-white/80",
                    ].join(" ")}
                  >
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-slate-500">
                      {(c.wordCount || 0).toLocaleString()} words • {c.lastEdited || "—"}
                    </div>
                  </button>
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

            {/* White page with fixed page-height viewport */}
            <div style={{ padding: 16, background: "#f0f3f8" }}>
              <div
                style={{
                  margin: "0 auto",
                  width: "100%",
                  maxWidth: 800,
                  height: PAGE_HEIGHT,
                  background: "#fff",
                  color: "#111",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
                  borderRadius: 12,
                  padding: "48px 48px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <ReactQuill
                  ref={editorRef}
                  theme="snow"
                  value={html}
                  onChange={(v) => {
                    setHtml(v);
                    setTimeout(recalcPages, 10);
                  }}
                  modules={modules}
                  placeholder="Write your chapter…"
                />
                <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
              </div>
            </div>

            {/* Footer actions with AI + Save */}
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => runAI("proofread")}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
                disabled={aiBusy}
                title="AI Proofread"
              >
                <Bot size={16} />
                {aiBusy ? "AI…" : "Proofread"}
              </button>
              <button
                onClick={() => runAI("clarify")}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
                disabled={aiBusy}
                title="AI Clarify"
              >
                <Bot size={16} />
                {aiBusy ? "AI…" : "Clarify"}
              </button>
              <button
                onClick={() => runAI("rewrite")}
                className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
                disabled={aiBusy}
                title="AI Rewrite"
              >
                <Bot size={16} />
                {aiBusy ? "AI…" : "Rewrite"}
              </button>
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
    </div>
  );
}
