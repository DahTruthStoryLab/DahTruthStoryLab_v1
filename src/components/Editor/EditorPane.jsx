// src/components/Editor/EditorPane.jsx
// Main editor with Quill, pagination, and white book-page design
// Preserves all visual styling: 800px × 1040px white page, 48px margins

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

const PAGE_HEIGHT = 1040; // px - matches Word document page height

/* ========== EditorPane Component ========== */

export default function EditorPane({ title, setTitle, html, setHtml, onSave, onAI, aiBusy }) {
  const editorRef = useRef(null);
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
      clipboard: { matchVisual: false }, // Preserve formatting on paste
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
    const total = Math.max(scrollEl.scrollHeight, scrollEl.clientHeight);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    
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
    
    // Scroll to the target page position
    scrollEl.scrollTo({
      top: target * PAGE_HEIGHT,
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
    const timer = setTimeout(() => recalcPages(), 60);
    return () => clearTimeout(timer);
  }, [html, recalcPages]);

 // Auto-advance to next page when typing at bottom
useEffect(() => {
  const q = getQuill();
  if (!q) return;

  const onTextChange = () => {
    recalcPages();

    const sel = q.getSelection();
    if (!sel) return;

    const atEnd = sel.index >= q.getLength() - 1;
    const scrollEl = q.root;
    const nearBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 20;

    if (atEnd && nearBottom) {
      setTimeout(() => {
        recalcPages();
        const newCount = Math.max(1, Math.ceil(scrollEl.scrollHeight / PAGE_HEIGHT));
        if (pageIndex < newCount - 1) {
          goToPage(pageIndex + 1);
        }
      }, 10);
    }
  };

  q.on("text-change", onTextChange);
  return () => q.off("text-change", onTextChange);
}, [recalcPages, goToPage, pageIndex]);

// ========== ADD THIS NEW EFFECT ==========
// Auto-flip to next page when scrolling to bottom
useEffect(() => {
  const q = getQuill();
  if (!q) return;

  const scrollEl = q.root;
  let scrollTimeout = null;

  const onScroll = () => {
    // Clear existing timeout
    if (scrollTimeout) clearTimeout(scrollTimeout);

    // Wait for scroll to finish (debounce)
    scrollTimeout = setTimeout(() => {
      const scrollTop = scrollEl.scrollTop;
      const clientHeight = scrollEl.clientHeight;
      const scrollHeight = scrollEl.scrollHeight;
      
      // Calculate which page we should be on based on scroll position
      const targetPage = Math.floor(scrollTop / PAGE_HEIGHT);
      
      // If we're near the bottom of current page, advance to next
      const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
      
      if (distanceFromBottom < 50 && pageIndex < pageCount - 1) {
        // Near bottom, advance to next page
        goToPage(pageIndex + 1);
      } else if (targetPage !== pageIndex) {
        // Update page index to match scroll position
        setPageIndex(Math.max(0, Math.min(targetPage, pageCount - 1)));
      }
    }, 150); // Wait 150ms after scroll stops
  };

  scrollEl.addEventListener("scroll", onScroll);
  return () => {
    scrollEl.removeEventListener("scroll", onScroll);
    if (scrollTimeout) clearTimeout(scrollTimeout);
  };
}, [pageIndex, pageCount, goToPage]);
// ========== END NEW EFFECT ==========

    q.on("text-change", onTextChange);
    return () => q.off("text-change", onTextChange);
  }, [recalcPages, goToPage, pageIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      // Only handle if not in an input
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
  }, [onSave, pageIndex, pageCount]);

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

      {/* White Page Container - Book-like design */}
      <div style={{ padding: 16, background: "#f0f3f8" }}>
        <div
          style={{
            margin: "0 auto",
            width: "100%",
            maxWidth: 800,          // Standard manuscript width
            height: PAGE_HEIGHT,     // 1040px - like a real page
            background: "#fff",      // Pure white paper
            color: "#111",           // Black text
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 30px rgba(2,20,40,0.10)", // Paper shadow
            borderRadius: 12,
            padding: "48px 48px",    // Generous margins (like 1" in Word)
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Quill Editor */}
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
          />

          {/* Page Number Badge */}
          <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
        </div>
      </div>

      {/* Bottom Action Buttons (Optional - can remove if toolbar at top is enough) */}
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
    </section>
  );
}

