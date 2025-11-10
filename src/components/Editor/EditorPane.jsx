// src/components/Editor/EditorPane.jsx
// Main editor with Quill, pagination, and white book-page design
// Proper 8.5" x 11" page with 1" margins and scrolling

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageNumberBadge } from "../UI/UIComponents";
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

/* ========== Constants ========== */

// 8.5" x 11" page at 96 DPI
const PAGE_WIDTH = 816;   // 8.5" × 96 DPI
const PAGE_HEIGHT = 1056; // 11" × 96 DPI
const MARGIN = 96;        // 1" margins × 96 DPI

/* ========== EditorPane Component ========== */

export default function EditorPane({ title, setTitle, html, setHtml, onSave, onAI, aiBusy }) {
  const editorRef = useRef(null);
  const containerRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // Quill modules configuration
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
      clipboard: { matchVisual: false },
    }),
    []
  );

  // Get Quill instance
  const getQuill = () => editorRef.current?.getEditor?.();

  // Calculate page count based on content height
  const recalcPages = useCallback(() => {
    const q = getQuill();
    if (!q) return;
    
    const scrollEl = q.root;
    const contentHeight = scrollEl.scrollHeight;
    const count = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));
    
    console.log(`📄 Recalc: content=${contentHeight}px, pages=${count}`);
    setPageCount(count);
    setPageIndex((prev) => Math.min(prev, count - 1));
  }, []);

  // Navigate to specific page
  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      const scrollEl = q.root;
      const targetScrollTop = target * PAGE_HEIGHT;
      
      console.log(`📄 Going to page ${target + 1}/${pageCount}, scrollTop=${targetScrollTop}px`);
      
      scrollEl.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });
      
      setPageIndex(target);
    },
    [pageCount]
  );

  const nextPage = () => goToPage(pageIndex + 1);
  const prevPage = () => goToPage(pageIndex - 1);

  // Recalculate pages when content changes
  useEffect(() => {
    const timer = setTimeout(() => recalcPages(), 100);
    return () => clearTimeout(timer);
  }, [html, recalcPages]);

  // Track scroll position to update page number
  useEffect(() => {
    const q = getQuill();
    if (!q) return;

    const scrollEl = q.root;

    const onScroll = () => {
      const scrollTop = scrollEl.scrollTop;
      const currentPage = Math.floor(scrollTop / PAGE_HEIGHT);
      
      if (currentPage !== pageIndex && currentPage < pageCount) {
        setPageIndex(currentPage);
      }
    };

    scrollEl.addEventListener("scroll", onScroll);
    return () => scrollEl.removeEventListener("scroll", onScroll);
  }, [pageIndex, pageCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
      if (isInput) return;

      const k = e.key.toLowerCase();

      // Ctrl/Cmd + S = Save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        onSave?.();
      }

      // Ctrl/Cmd + Arrow = Page navigation
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
  }, [onSave, nextPage, prevPage]);

  return (
    <section className="bg-transparent">
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

        {/* Page Navigation */}
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
            Page {pageIndex + 1} / {pageCount}
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

      {/* White Page Container - Book-like design */}
      <div 
        ref={containerRef}
        style={{ 
          padding: 16, 
          background: "#f0f3f8",
          maxHeight: "calc(100vh - 200px)",
          overflowY: "auto"
        }}
      >
        <div
          style={{
            margin: "0 auto",
            width: PAGE_WIDTH,
            minHeight: PAGE_HEIGHT,
            background: "#fff",
            color: "#111",
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
            borderRadius: 12,
            padding: `${MARGIN}px`,
            position: "relative",
          }}
        >
          {/* Quill Editor - Now with proper scrolling */}
          <div style={{ 
            minHeight: PAGE_HEIGHT - (MARGIN * 2),
            position: "relative"
          }}>
            <ReactQuill
              ref={editorRef}
              theme="snow"
              value={html}
              onChange={(value) => {
                setHtml(value);
                setTimeout(recalcPages, 50);
              }}
              modules={modules}
              placeholder="Write your chapter…"
              style={{
                border: "none",
                minHeight: "100%"
              }}
            />
          </div>

          {/* Page Number Badge */}
          <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <button
          onClick={() => onAI?.("proofread")}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
          disabled={aiBusy}
          title="AI Proofread"
        >
          {aiBusy ? "AI…" : "Proofread"}
        </button>
        
        <button
          onClick={() => onAI?.("grammar")}
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
          disabled={aiBusy}
          title="AI Grammar"
        >
          🔤 Grammar
        </button>

        <button
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white hover:opacity-90"
          style={{ backgroundColor: "#D4AF37" }}
          title="Save (Ctrl+S)"
        >
          💾 Save
        </button>
      </div>

      {/* Custom styles for Quill to make it scrollable */}
      <style>{`
        .ql-container {
          border: none !important;
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 2;
        }
        .ql-editor {
          padding: 0 !important;
          min-height: ${PAGE_HEIGHT - (MARGIN * 2)}px;
          overflow-y: auto !important;
          max-height: none !important;
        }
        .ql-editor::-webkit-scrollbar {
          width: 12px;
        }
        .ql-editor::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .ql-editor::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </section>
  );
}
