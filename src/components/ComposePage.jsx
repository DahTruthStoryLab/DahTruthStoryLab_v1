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
} from "lucide-react";
import { useAI } from "../lib/AiProvider";
import { useNavigate } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import * as mammoth from "mammoth/mammoth.browser";
import { pickAndImportOneNotePage } from "../lib/onenoteImport";

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

/* Prevent global shortcuts when typing in inputs or Quill editor */
function isEditableTarget(t) {
  if (!t) return false;
  const el = t.nodeType === 3 ? t.parentElement : t;
  const tag = (el?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el?.isContentEditable) return true;
  return !!el?.closest?.('.ql-editor,[contenteditable="true"]');
}

/* ==============================
   Compose Page (isolated writer)
============================== */
export default function ComposePage() {
  const ai = useAI();
  const navigate = useNavigate();

  // Load initial project
  const initial = useMemo(loadState, []);
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(
    ensureFirstChapter(initial?.chapters || [])
  );
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((c) => c.id === selectedId) || chapters[0];

  // Editor state
  const [title, setTitle] = useState(selected.title || "");
  const [html, setHtml] = useState(selected.content || "");
  const [isFS, setIsFS] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const editorRef = useRef(null);
  const fsEditorRef = useRef(null); // Separate ref for fullscreen editor

  /* Sync editor when selected chapter changes */
  useEffect(() => {
    const sel = chapters.find((c) => c.id === selectedId);
    if (!sel) return;
    setTitle(sel.title || "");
    setHtml(sel.content || "");
  }, [selectedId, chapters]);

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
        book,
        chapters: nextChapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });

      return nextChapters;
    });
  }, [selectedId, title, html, book]);

  /* Undo / Redo */
  const getActiveEditor = () => (isFS ? fsEditorRef.current : editorRef.current);
  const undo = () => getActiveEditor()?.getEditor?.()?.history?.undo?.();
  const redo = () => getActiveEditor()?.getEditor?.()?.history?.redo?.();

  /* AI proof/clarify */
  const runAI = async (mode = "proofread") => {
    try {
      setAiBusy(true);
      const edited = await ai.proofread(html || "", { mode, noEmDashes: true });
      const newHtml = edited ?? html;
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
          book,
          chapters: next,
          daily: current.daily || { goal: 500, counts: {} },
          settings: current.settings || { theme: "light", focusMode: false },
          tocOutline: current.tocOutline || [],
        });
        return next;
      });
    } catch (e) {
      console.error("[AI] error:", e);
      alert(e.message || "AI request failed");
    } finally {
      setAiBusy(false);
    }
  };

  const handleSaveAndProof = async () => {
    handleSave();
    await runAI("proofread");
  };

  /* Keyboard shortcuts – guarded */
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
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [handleSave, handleSaveAndProof, isFS]);

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

  /* Reorder helper */
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
        const activeEditor = getActiveEditor();
        const q = activeEditor?.getEditor?.();
        if (q) {
          const delta = q.clipboard.convert({ html: htmlContent });
          q.setContents(delta, "user");
          setHtml(q.root.innerHTML);
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
          title="Import Word Document (.docx)"
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

  /* Import from OneNote (via Microsoft Graph) */
  const handleImportOneNote = () =>
    pickAndImportOneNotePage(getActiveEditor(), setHtml);

  /* Export to Word (.doc/.docx-friendly HTML) */
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

  /* Draggable + droppable chapter list item */
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
        onClick={() => setSelectedId(ch.id)}
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

  /* Toolbar component */
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

      {/* Import/Export */}
     <ImportDocxButton />

      <button
        onClick={handleImportOneNote}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
        title="Import from OneNote"
      >
        <Upload size={16} /> OneNote
      </button>
      
      <button
        onClick={exportToDocx}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
        title="Export to Word"
      >
        <Download size={16} /> Export
      </button>

      {/* AI actions */}
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

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
            title="Back to Dashboard"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>

          <div className="ml-auto flex items-center gap-2">
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
      </div>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6">
        {/* Left: Chapters */}
        <aside className="xl:sticky xl:top-16 space-y-2" style={{ zIndex: 10 }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Chapters</div>
            <button
              onClick={addChapter}
              className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {chapters.map((c) => (
              <ChapterItem key={c.id} ch={c} />
            ))}
          </div>
        </aside>

        {/* Center: Editor */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full text-lg font-semibold outline-none bg-transparent"
            />
            <div className="text-sm text-slate-500">
              {(countWords(html) || 0).toLocaleString()} words
            </div>
          </div>

          <div className="p-3">
            <ReactQuill
              ref={editorRef}
              theme="snow"
              value={html}
              onChange={setHtml}
              modules={modules}
              placeholder="Start writing your story here…"
            />
          </div>
        </section>
      </div>

      {/* Fullscreen overlay */}
      {isFS && (
        <div className="fixed inset-0 z-[9999] bg-[#fdecef]">
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between gap-2 bg-white/90 backdrop-blur border-b">
            <button
              onClick={goBack}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} /> Back
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

          <div className="pt-20 pb-6 px-6 h-full grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6 overflow-auto">
            {/* Chapters */}
            <aside className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">Chapters</div>
                <button
                  onClick={addChapter}
                  className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {chapters.map((c) => (
                  <ChapterItem key={c.id} ch={c} />
                ))}
              </div>
            </aside>

            {/* Page */}
            <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-[14px] shadow-2xl">
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent outline-none"
                  placeholder="Chapter title"
                />
                <span className="text-sm text-slate-500">
                  {(countWords(html) || 0).toLocaleString()} words
                </span>
              </div>
              <div className="p-3">
                <ReactQuill
                  ref={fsEditorRef}
                  theme="snow"
                  value={html}
                  onChange={setHtml}
                  modules={modules}
                  placeholder="Write in fullscreen…"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
