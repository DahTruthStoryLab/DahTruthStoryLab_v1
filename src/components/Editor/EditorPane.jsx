// src/components/Editor/EditorPane.jsx
// Top toolbar only (no extra sidebar), robust page navigation, adjustable page width, preserved margins.

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageNumberBadge } from "../UI/UIComponents"; // 👈 SaveStatus removed
import { countWords } from "../../utils/textFormatting";

/* ========== Quill Configuration ========== */

// Fonts
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

// Sizes
const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

// Line-height (still registered but we’ll keep behavior simple)
const Parchment = Quill.import("parchment");
const lineHeightStyle = new Parchment.Attributor.Style(
  "lineheight",
  "line-height",
  { scope: Parchment.Scope.BLOCK, whitelist: ["1", "1.5", "2"] }
);
Quill.register(lineHeightStyle, true);

/* ========== Constants ========== */

const PAGE_HEIGHT = 1040; // px

/* ========== Component ========== */

export default function EditorPane({
  title,
  setTitle,
  html,
  setHtml,
  onSave,
  onAI,
  aiBusy,
  margins,
  onHeadingsChange, // optional; emits [{level, text, id}], no UI rendered
  pageWidth = 960, // adjustable writing canvas width (px)
}) {
  const editorRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [lineSpacing, setLineSpacing] = useState("1.5");

  const actualMargins = margins || {
    top: 48,
    bottom: 48,
    left: 48,
    right: 48,
  };

  // Toolbar at very top
  const modules = useMemo(
    () => ({
      toolbar: { container: "#editor-toolbar" },
      history: { delay: 500, maxStack: 200, userOnly: true },
      clipboard: { matchVisual: false },
    }),
    []
  );

  const getQuill = () => editorRef.current?.getEditor?.();

  // 🟣 Simpler: line spacing now just updates CSS so it always “does something”
  const applyLineSpacing = useCallback((spacing) => {
    setLineSpacing(spacing);
  }, []);

  const recalcPages = useCallback(() => {
    const q = getQuill();
    if (!q) return;
    const scrollEl = q.root;
    const total = Math.max(scrollEl.scrollHeight, PAGE_HEIGHT);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    setPageCount(count);

    // keep index in range and align scrollTop
    setPageIndex((prev) => {
      const clamped = Math.min(prev, count - 1);
      scrollEl.scrollTop = clamped * PAGE_HEIGHT;
      return clamped;
    });
  }, []);

  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      const scrollEl = q.root;
      scrollEl.scrollTop = target * PAGE_HEIGHT;
      setPageIndex(target);
    },
    [pageCount]
  );

  const nextPage = () => pageIndex < pageCount - 1 && goToPage(pageIndex + 1);
  const prevPage = () => pageIndex > 0 && goToPage(pageIndex - 1);

  // Save: now just delegates to parent – no local "unsaved changes" UI
  const handleSave = async () => {
    try {
      await onSave?.();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  // recalc pages on content
  useEffect(() => {
    const timer = setTimeout(recalcPages, 60);
    return () => clearTimeout(timer);
  }, [html, recalcPages]);

  // auto-extract headings for parent (no rendering here)
  useEffect(() => {
    if (!onHeadingsChange) return;
    const temp = document.createElement("div");
    temp.innerHTML = html || "";
    const hs = Array.from(temp.querySelectorAll("h1, h2, h3")).map((el, i) => ({
      level: el.tagName.toLowerCase(),
      text: el.textContent?.trim() || `Untitled ${i + 1}`,
      id: el.id || null,
    }));
    onHeadingsChange(hs);
  }, [html, onHeadingsChange]);

  // auto-advance near bottom
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
        scrollEl.scrollTop + scrollEl.clientHeight >=
        scrollEl.scrollHeight - 20;
      if (atEnd && nearBottom) {
        setTimeout(() => {
          recalcPages();
          const newCount = Math.max(
            1,
            Math.ceil(scrollEl.scrollHeight / PAGE_HEIGHT)
          );
          if (pageIndex < newCount - 1) goToPage(pageIndex + 1);
        }, 10);
      }
    };
    q.on("text-change", onTextChange);
    return () => q.off("text-change", onTextChange);
  }, [recalcPages, goToPage, pageIndex]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      const isInput =
        tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable;

      const k = e.key.toLowerCase();

      // allow ctrl/cmd+S inside/outside editor
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        handleSave();
        return;
      }
      if (isInput) return;

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

  // quick-jump via clicking the counter
  const onClickPageCounter = () => {
    const input = prompt(`Go to page (1-${pageCount}):`, String(pageIndex + 1));
    if (!input) return;
    const n = parseInt(input, 10);
    if (!Number.isNaN(n)) goToPage(n - 1);
  };

  return (
    <section className="bg-transparent">
      {/* Sticky top toolbar (no extra sidebar here) */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="mx-auto w-full max-w-[1200px] px-4">
          <div
            id="editor-toolbar"
            className="ql-toolbar ql-snow !border-0 !py-2 !px-0"
          >
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

            {/* Line spacing control – now clearly affects the whole page */}
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

      {/* Title + controls */}
      <div className="mb-3 mt-3 flex items-center gap-3 mx-auto w-full max-w-[1200px] px-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chapter title"
          className="flex-1 text-lg font-semibold outline-none bg-transparent border-b border-slate-300 pb-1"
        />

        <div className="text-sm text-slate-500 whitespace-nowrap">
          {countWords(html).toLocaleString()} words
        </div>

        {/* SaveStatus removed — save state handled in toolbar via saveStatus prop */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={pageIndex === 0}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous Page (Ctrl+←)"
          >
            <ChevronLeft size={16} /> Prev
          </button>

          {/* Click to jump */}
          <button
            onClick={onClickPageCounter}
            className="text-sm tabular-nums px-2 py-1 rounded hover:bg-slate-50 border border-transparent"
            title="Click to jump to a page"
            type="button"
          >
            Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
          </button>

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

      {/* Writing Page */}
      <div style={{ padding: 16, background: "#f0f3f8" }}>
        <div
          style={{
            margin: "0 auto",
            width: "100%",
            maxWidth: pageWidth, // wider canvas
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

          <style>{`
            /* Toolbar consistency */
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
    </section>
  );
}
