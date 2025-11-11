// src/components/Editor/EditorPane.jsx
// COMPLETE FIX: Professional toolbar, line spacing, margins, page navigation working
// Preserves all functionality: 800px × 1040px white page, 48px margins

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
const Parchment = Quill.import('parchment');
const lineHeightStyle = new Parchment.Attributor.Style('lineheight', 'line-height', {
  scope: Parchment.Scope.BLOCK,
  whitelist: ['1', '1.5', '2']
});
Quill.register(lineHeightStyle, true);

/* ========== Constants ========== */

const PAGE_HEIGHT = 1040; // px - matches Word document page height

/* ========== EditorPane Component ========== */

export default function EditorPane({ title, setTitle, html, setHtml, onSave, onAI, aiBusy, margins }) {
  const editorRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lineSpacing, setLineSpacing] = useState('1.5'); // Default 1.5 line spacing

  // Use provided margins or defaults
  const actualMargins = margins || {
    top: 48,
    bottom: 48,
    left: 48,
    right: 48,
  };

  // Quill modules configuration with line spacing
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: FONT_WHITELIST }],
        [{ size: Size.whitelist }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        [{ lineheight: ['1', '1.5', '2'] }], // Line spacing
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

  // Apply line spacing to selection or document
  const applyLineSpacing = useCallback((spacing) => {
    const q = getQuill();
    if (!q) return;
    
    setLineSpacing(spacing);
    
    const range = q.getSelection();
    if (range) {
      if (range.length === 0) {
        // Apply to entire document
        q.formatText(0, q.getLength(), 'lineheight', spacing);
      } else {
        // Apply to selection
        q.formatText(range.index, range.length, 'lineheight', spacing);
      }
    }
  }, []);

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

        {/* Line Spacing Control */}
        <div className="flex items-center gap-2 ml-4">
          <label className="text-xs text-slate-600">Line Spacing:</label>
          <select
            value={lineSpacing}
            onChange={(e) => applyLineSpacing(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
          >
            <option value="1">Single</option>
            <option value="1.5">1.5 Lines</option>
            <option value="2">Double</option>
          </select>
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
          {/* Quill Editor with scrolling */}
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

          {/* Enhanced Custom Styles */}
          <style>{`
            /* Toolbar Styling - Professional Look */}
            .ql-toolbar {
              position: sticky !important;
              top: -16px !important;
              z-index: 100 !important;
              background: linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%) !important;
              border: none !important;
              border-bottom: 2px solid #e5e7eb !important;
              padding: 12px 16px !important;
              margin: -${actualMargins.top}px -${actualMargins.right}px 16px -${actualMargins.left}px !important;
              width: calc(100% + ${actualMargins.left + actualMargins.right}px) !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
              border-radius: 12px 12px 0 0 !important;
            }

            .ql-toolbar button {
              width: 32px !important;
              height: 32px !important;
              margin: 0 2px !important;
              border-radius: 6px !important;
              transition: all 0.2s !important;
            }

            .ql-toolbar button:hover {
              background: #e0e7ff !important;
            }

            .ql-toolbar button.ql-active {
              background: #818cf8 !important;
              color: white !important;
            }

            .ql-toolbar select {
              height: 32px !important;
              padding: 0 8px !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 6px !important;
              background: white !important;
              margin: 0 4px !important;
            }

            .ql-toolbar .ql-formats {
              margin-right: 12px !important;
            }

            /* Editor Content Styling */}
            .ql-container {
              border: none !important;
              font-family: 'Times New Roman', Times, serif;
            }

            .ql-editor {
              font-family: 'Times New Roman', Times, serif;
              font-size: 12pt;
              line-height: ${lineSpacing};
              padding: 0 !important;
            }

            .ql-editor p {
              margin-bottom: 0;
              line-height: ${lineSpacing};
            }

            .ql-editor h1,
            .ql-editor h2,
            .ql-editor h3 {
              margin-top: 1.5em;
              margin-bottom: 0.75em;
              line-height: 1.3;
            }

            /* Scrollbar styling */}
            .ql-editor::-webkit-scrollbar {
              width: 12px;
            }

            .ql-editor::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 6px;
            }

            .ql-editor::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 6px;
            }

            .ql-editor::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
          `}</style>

          {/* Page Number Badge */}
          <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
        </div>
      </div>
    </section>
  );
}

