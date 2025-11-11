// src/components/Editor/EditorPane.jsx
// Main editor with Quill, pagination, and white book-page design
// Preserves all visual styling: 800px × 1040px white page, 48px margins

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

/* ========== Constants ========== */

const PAGE_HEIGHT = 1040; // px - matches Word document page height

/* ========== EditorPane Component ========== */

export default function EditorPane({ title, setTitle, html, setHtml, onSave, onAI, aiBusy }) {
  const editorRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    const total = Math.max(scrollEl.scrollHeight, PAGE_HEIGHT);
    const count = Math.max(1, Math.ceil(total / PAGE_HEIGHT));
    
    setPageCount(count);
    
    // Keep current page in bounds
    setPageIndex((prev) => {
      const newIdx = Math.min(prev, count - 1);
      // Update scroll position to match page
      scrollEl.scrollTop = newIdx * PAGE_HEIGHT;
      return newIdx;
    });
  }, []);

  // Navigate to specific page
  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      const scrollEl = q.root;
      
      // Smoothly scroll to page
      scrollEl.scrollTo({
        top: target * PAGE_HEIGHT,
        behavior: 'smooth'
      });
      
      setPageIndex(target);
    },
    [pageCount]
  );

  const nextPage = () => {
    if (pageIndex < pageCount - 1) {
      goToPage(pageIndex + 1);
    }
  };
  
  const prevPage = () => {
    if (pageIndex > 0) {
      goToPage(pageIndex - 1);
    }
  };

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [html, title]);

  // Save handler with feedback
  const handleSave = async () => {
    setSaving(true);
    setHasUnsavedChanges(false);
    
    try {
      await onSave?.();
      setLastSaved("Just now");
      
      // Update "Just now" to relative time after a bit
      setTimeout(() => setLastSaved("1 min ago"), 60000);
    } catch (err) {
      console.error("Save error:", err);
      setHasUnsavedChanges(true);
    } finally {
      setSaving(false);
    }
  };

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
        handleSave();
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
  }, [pageIndex, pageCount]);

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

        {/* Save Status */}
        <SaveStatus 
          saving={saving}
          lastSaved={lastSaved}
          hasUnsavedChanges={hasUnsavedChanges}
        />

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
          {/* Quill Editor with custom styling */}
          <div style={{ height: '100%', overflow: 'auto' }}>
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
              style={{ 
                height: '100%',
                border: 'none'
              }}
            />
          </div>

          {/* Custom styles for better formatting */}
          <style>{`
            .ql-editor {
              font-family: 'Times New Roman', Times, serif;
              font-size: 14px;
              line-height: 1.8;
              padding: 0 !important;
              padding-left: 60px !important;
              border-left: 2px solid #e5e7eb;
              position: relative;
            }
            .ql-editor::before {
              content: '';
              position: absolute;
              left: 48px;
              top: 0;
              bottom: 0;
              width: 2px;
              background: linear-gradient(to bottom, #D4AF37 0%, #e5e7eb 50%, #D4AF37 100%);
              opacity: 0.3;
            }
            .ql-editor p {
              margin-bottom: 1em;
            }
            .ql-editor h1,
            .ql-editor h2,
            .ql-editor h3 {
              margin-top: 1.5em;
              margin-bottom: 0.75em;
              line-height: 1.3;
            }
            .ql-container {
              border: none !important;
              font-family: 'Times New Roman', Times, serif;
            }
            .ql-toolbar {
              border: none !important;
              border-bottom: 1px solid #e5e7eb !important;
            }
          `}</style>

          {/* Page Number Badge */}
          <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
        </div>
      </div>

      {/* Bottom Action Buttons - Remove duplicates, keep only unique AI buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {/* Keep only AI buttons that aren't in top toolbar */}
      </div>
    </section>
  );
}

