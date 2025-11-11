// src/components/Editor/EditorPane.jsx
// Professional top toolbar, consistent sizing, margins
// Built-in Sidebar with fallback "Chapter N" + auto-extracted headings (H1/H2/H3)

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageNumberBadge, SaveStatus } from "../UI/UIComponents";
import { countWords } from "../../utils/textFormatting";

/* ========== Quill Configuration ========== */

// Register fonts
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

// Register sizes
const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

// Register line height (for line spacing)
const Parchment = Quill.import("parchment");
const lineHeightStyle = new Parchment.Attributor.Style("lineheight", "line-height", {
  scope: Parchment.Scope.BLOCK,
  whitelist: ["1", "1.5", "2"],
});
Quill.register(lineHeightStyle, true);

/* ========== Constants ========== */

const PAGE_HEIGHT = 1040; // px - book-like page height

/* ========== Component ========== */
/**
 * Props:
 * - title, setTitle, html, setHtml, onSave, onAI, aiBusy, margins
 * - chapters?: Array<{ id?: string, title?: string }>
 * - showSidebar?: boolean (default true)
 * - onHeadingsChange?: (headings: { level: 'h1'|'h2'|'h3', text: string, id: string|null }[]) => void
 */
export default function EditorPane({
  title,
  setTitle,
  html,
  setHtml,
  onSave,
  onAI,
  aiBusy,
  margins,
  chapters = [],
  showSidebar = true,
  onHeadingsChange,
}) {
  const editorRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lineSpacing, setLineSpacing] = useState("1.5");
  const [extractedHeadings, setExtractedHeadings] = useState([]);

  const actualMargins = margins || { top: 48, bottom: 48, left: 48, right: 48 };

  // Custom toolbar mounted at the very top
  const modules = useMemo(
    () => ({
      toolbar: {
        container: "#editor-toolbar",
      },
      history: { delay: 500, maxStack: 200, userOnly: true },
      clipboard: { matchVisual: false },
    }),
    []
  );

  const getQuill = () => editorRef.current?.getEditor?.();

  const applyLineSpacing = useCallback((spacing) => {
    const q = getQuill();
    if (!q) return;
    setLineSpacing(spacing);
    const range = q.getSelection();
    if (range) {
      if (range.length === 0) {
        q.formatText(0, q.getLength(), "lineheight", spacing);
      } else {
        q.formatText(range.index, range.length, "lineheight", spacing);
      }
    }
  }, []);

  const recalcPages = useCallback(() => {
    const q = getQuill();
    if (!q) return;
    const scrollEl = q.root;
    const total = Math.max(scrollEl.scrollHeight, PAGE_HEIGHT);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    setPageCount(count);
    setPageIndex((prev) => {
      const newIdx = Math.min(prev, count - 1);
      scrollEl.scrollTop = newIdx * PAGE_HEIGHT;
      return newIdx;
    });
  }, []);

  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      const scrollEl = q.root;
      scrollEl.scrollTo({ top: target * PAGE_HEIGHT, behavior: "smooth" });
      setPageIndex(target);
    },
    [pageCount]
  );

  const nextPage = () => pageIndex < pageCount - 1 && goToPage(pageIndex + 1);
  const prevPage = () => pageIndex > 0 && goToPage(pageIndex - 1);

  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [html, title]);

  const handleSave = async () => {
    setSaving(true);
    setHasUnsavedChanges(false);
    try {
      await onSave?.();
      setLastSaved("Just now");
      setTimeout(() => setLastSaved("1 min ago"), 60000);
    } catch (err) {
      console.error("Save error:", err);
      setHasUnsavedChanges(true);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => recalcPages(), 60);
    return () => clearTimeout(timer);
  }, [html, recalcPages]);

  // Auto-extract headings from editor HTML and emit upstream
  useEffect(() => {
    const temp = document.createElement("div");
    temp.innerHTML = html || "";
    const hs = Array.from(temp.querySelectorAll("h1, h2, h3")).map((el, i) => ({
      level: el.tagName.toLowerCase(),
      text: el.textContent?.trim() || `Untitled ${i + 1}`,
      id: el.id || null,
    }));
    setExtractedHeadings(hs);
    if (onHeadingsChange) onHeadingsChange(hs);
  }, [html, onHeadingsChange]);

  // Auto-advance on typing at bottom
  useEffect(() => {
    const q = getQuill();
    if (!q) return;
    const onTextChange = () => {
      recalcPages();
      const sel = q.getSelection();
      if (!sel) return;
      const atEnd = sel.index >= q.getLength() - 1;
      const scrollEl = q.root;
      const nearBottom =
        scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 20;
      if (atEnd && nearBottom) {
        setTimeout(() => {
          recalcPages();
          const newCount = Math.max(1, Math.ceil(scrollEl.scrollHeight / PAGE_HEIGHT));
          if (pageIndex < newCount - 1) goToPage(pageIndex + 1);
        }, 10);
      }
    };
    q.on("text-change", onTextChange);
    return () => q.off("text-change", onTextChange);
  }, [recalcPages, goToPage, pageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
      if (isInput) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        handleSave();
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
  }, [pageIndex, pageCount]);

  /* ---------- Sidebar data ---------- */
  // If chapters are provided, show them with fallback "Chapter N".
  // Otherwise, show auto-extracted headings.
  const sidebarItems =
    chapters && chapters.length > 0
      ? chapters.map((c, i) => ({
        key: c.id || `ch-${i}`,
        label: (c.title && c.title.trim()) ? c.title.trim() : `Chapter ${i + 1}`,
      }))
      : extractedHeadings.length > 0
      ? extractedHeadings.map((h, i) => ({
          key: `${h.level}-${i}`,
          label: h.text,
        }))
      : [{ key: "default-1", label: "Chapter 1" }];

  return (
    <section className="bg-transparent">
      {/* Top Toolbar (sticky, full width) */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          {/* Quill toolbar container */}
          <div id="editor-toolbar" className="ql-toolbar ql-snow !border-0 !py-2 !px-0">
            <span className="ql-formats">
              <select className="ql-header">
                <option value="1">H1</option>
                <option value="2">H2</option>
                <option value="3">H3</option>
                <option value="">Normal</option>
              </select>
              <select className="ql-font"></select>
              <select className="ql-size"></select>
            </span>

            <span className="ql-formats">
              <button className="ql-bold"></button>
              <button className="ql-italic"></button>
              <button className="ql-underline"></button>
              <button className="ql-strike"></button>
            </span>

            <span className="ql-formats">
              <button className="ql-list" value="ordered"></button>
              <button className="ql-list" value="bullet"></button>
              <select className="ql-align"></select>
            </span>

            <span className="ql-formats">
              <button className="ql-blockquote"></button>
              <button className="ql-code-block"></button>
              <button className="ql-link"></button>
              <button className="ql-image"></button>
              <button className="ql-clean"></button>
            </span>

            {/* Line spacing (matches toolbar style) */}
            <span className="ql-formats">
              <label className="text-xs text-slate-600 mr-2">Line</label>
              <select
                value={lineSpacing}
                onChange={(e) => applyLineSpacing(e.target.value)}
                className="border rounded px-2 py-[6px] text-sm"
              >
                <option value="1">Single</option>
                <option value="1.5">1.5</option>
                <option value="2">Double</option>
              </select>
            </span>
          </div>
        </div>
      </div>

      {/* Layout: Sidebar + Main */}
      <div className="mx-auto w-full max-w-[1200px] px-4">
        <div className="grid grid-cols-12 gap-6 mt-4">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="col-span-12 md:col-span-3 lg:col-span-3">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-700">Contents</div>
                  <div className="text-xs text-slate-500">
                    {chapters && chapters.length > 0 ? "Chapters" : "Headings"}
                  </div>
                </div>
                <nav className="max-h-[70vh] overflow-auto py-2">
                  {sidebarItems.map((item) => (
                    <div
                      key={item.key}
                      className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-default"
                      title={item.label}
                    >
                      {item.label}
                    </div>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Main Column */}
          <div className={showSidebar ? "col-span-12 md:col-span-9 lg:col-span-9" : "col-span-12"}>
            {/* Chapter Title and Controls */}
            <div className="mb-3 flex items-center gap-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Chapter title"
                className="flex-1 text-lg font-semibold outline-none bg-transparent border-b border-slate-300 pb-1"
              />

              <div className="text-sm text-slate-500 whitespace-nowrap">
                {countWords(html).toLocaleString()} words
              </div>

              <SaveStatus
                saving={saving}
                lastSaved={lastSaved}
                hasUnsavedChanges={hasUnsavedChanges}
              />

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={prevPage}
                  disabled={pageIndex === 0}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page (Ctrl+←)"
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                <div className="text-sm tabular-nums">
                  Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
                </div>

                <button
                  onClick={nextPage}
                  disabled={pageIndex >= pageCount - 1}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page (Ctrl+→)"
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* White Page Container */}
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
                  padding: `${actualMargins.top}px ${actualMargins.right}px ${actualMargins.bottom}px ${actualMargins.left}px`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Editor with scroll */}
                <div style={{ height: "100%", overflow: "auto" }}>
                  <ReactQuill
                    ref={editorRef}
                    theme="snow"
                    value={html}
                    onChange={(value) => {
                      setHtml(value);
                      setTimeout(recalcPages, 10);
                    }}
                    modules={modules}
                    placeholder="Write your chapter…"
                    style={{ height: "100%", border: "none" }}
                  />
                </div>

                {/* Styles */}
                <style>{`
                  /* Toolbar sizing & consistency */
                  .ql-toolbar,
                  .ql-toolbar .ql-formats,
                  .ql-toolbar button,
                  .ql-toolbar .ql-picker,
                  .ql-toolbar .ql-picker-label,
                  .ql-toolbar .ql-picker-item,
                  .ql-toolbar select {
                    font-size: 13px !important;
                    line-height: 1 !important;
                  }
                  .ql-toolbar button {
                    width: 32px !important;
                    height: 32px !important;
                    margin: 0 2px !important;
                    border-radius: 6px !important;
                    transition: background .15s ease;
                  }
                  .ql-toolbar button:hover { background: #eef2ff !important; }
                  .ql-toolbar button.ql-active { background: #818cf8 !important; color: white !important; }
                  .ql-toolbar select, .ql-toolbar .ql-picker {
                    height: 32px !important;
                  }
                  .ql-snow .ql-picker-label, .ql-snow .ql-picker-item {
                    padding: 0 8px !important;
                  }

                  /* Editor look */
                  .ql-container { border: none !important; }
                  .ql-editor {
                    font-family: 'Times New Roman', Times, serif;
                    font-size: 12pt;
                    line-height: ${lineSpacing};
                    padding: 0 !important;
                  }
                  .ql-editor p { margin-bottom: 0; line-height: ${lineSpacing}; }
                  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                    margin-top: 1.5em; margin-bottom: 0.75em; line-height: 1.3;
                  }

                  /* Scrollbar (editor area) */
                  .ql-editor::-webkit-scrollbar { width: 12px; }
                  .ql-editor::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 6px; }
                  .ql-editor::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
                  .ql-editor::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                `}</style>

                <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
