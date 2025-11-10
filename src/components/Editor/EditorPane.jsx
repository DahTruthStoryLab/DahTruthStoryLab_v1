// src/components/Editor/EditorPane.jsx
// FIXED: Toolbar at top, proper page navigation, scrolling works
// 8.5" x 11" page with margins

import React, { useRef, useState, useEffect, useCallback } from "react";
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
const MARGIN_TOP = 96;    // 1 inch
const MARGIN_BOTTOM = 96;
const MARGIN_LEFT = 96;
const MARGIN_RIGHT = 96;

/* ========== EditorPane Component ========== */

export default function EditorPane({ title, setTitle, html, setHtml, onSave, onAI, aiBusy, margins }) {
  const editorRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);

  // Use provided margins or defaults
  const actualMargins = margins || {
    top: MARGIN_TOP,
    bottom: MARGIN_BOTTOM,
    left: MARGIN_LEFT,
    right: MARGIN_RIGHT,
  };

  // Quill modules - toolbar at top
  const modules = {
    toolbar: {
      container: "#quill-toolbar", // Use custom toolbar
      handlers: {},
    },
    history: { delay: 500, maxStack: 200, userOnly: true },
    clipboard: { matchVisual: false },
  };

  // Get Quill instance
  const getQuill = () => editorRef.current?.getEditor?.();

  // Calculate page count based on content height
  const recalcPages = useCallback(() => {
    const q = getQuill();
    if (!q) return;
    
    const contentHeight = q.root.scrollHeight;
    const count = Math.max(1, Math.ceil(contentHeight / PAGE_HEIGHT));
    
    console.log(`📄 Pages: ${count}, content height: ${contentHeight}px`);
    setPageCount(count);
  }, []);

  // Navigate to specific page
  const goToPage = useCallback(
    (idx) => {
      const q = getQuill();
      if (!q) return;
      
      const target = Math.max(0, Math.min(idx, pageCount - 1));
      const targetScrollTop = target * PAGE_HEIGHT;
      
      console.log(`📄 Going to page ${target + 1}/${pageCount}, scroll to ${targetScrollTop}px`);
      
      q.root.scrollTo({
        top: targetScrollTop,
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

  // Recalculate pages when content changes
  useEffect(() => {
    const timer = setTimeout(() => recalcPages(), 100);
    return () => clearTimeout(timer);
  }, [html, recalcPages]);

  // Track scroll to update page number
  useEffect(() => {
    const q = getQuill();
    if (!q) return;

    const onScroll = () => {
      const scrollTop = q.root.scrollTop;
      const currentPage = Math.floor(scrollTop / PAGE_HEIGHT);
      
      if (currentPage !== pageIndex && currentPage < pageCount) {
        setPageIndex(currentPage);
      }
    };

    q.root.addEventListener("scroll", onScroll);
    return () => q.root.removeEventListener("scroll", onScroll);
  }, [pageIndex, pageCount]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const isInput = e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA";
      if (isInput) return;

      const k = e.key.toLowerCase();

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        onSave?.();
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
  }, [onSave, pageIndex, pageCount]);

  return (
    <div className="flex flex-col h-full">
      {/* Chapter Title and Page Navigation */}
      <div className="mb-3 flex items-center gap-3 flex-shrink-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Chapter title"
          className="flex-1 text-lg font-semibold outline-none bg-transparent border-b border-slate-300 pb-1"
        />
        
        <div className="text-sm text-slate-500 whitespace-nowrap">
          {countWords(html).toLocaleString()} words
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={pageIndex === 0}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Previous Page (Ctrl+←)"
          >
            <ChevronLeft size={16} /> Prev
          </button>
          
          <div className="text-sm font-medium tabular-nums">
            Page {pageIndex + 1} / {pageCount}
          </div>
          
          <button
            onClick={nextPage}
            disabled={pageIndex >= pageCount - 1}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            title="Next Page (Ctrl+→)"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Custom Quill Toolbar - OUTSIDE editor, at top */}
      <div 
        id="quill-toolbar" 
        className="mb-2 flex-shrink-0 bg-white border border-slate-300 rounded-lg p-2"
        style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px',
          alignItems: 'center'
        }}
      >
        {/* Font */}
        <select className="ql-font" defaultValue="">
          <option value="">Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
          {FONT_WHITELIST.map(font => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>

        {/* Size */}
        <select className="ql-size" defaultValue="">
          <option value="small">Small</option>
          <option value="">Normal</option>
          <option value="large">Large</option>
          <option value="huge">Huge</option>
        </select>

        {/* Headers */}
        <select className="ql-header" defaultValue="">
          <option value="">Normal</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
        </select>

        <span className="border-l border-slate-300 h-6 mx-1"></span>

        {/* Formatting */}
        <button className="ql-bold" title="Bold"></button>
        <button className="ql-italic" title="Italic"></button>
        <button className="ql-underline" title="Underline"></button>
        <button className="ql-strike" title="Strikethrough"></button>

        <span className="border-l border-slate-300 h-6 mx-1"></span>

        {/* Lists */}
        <button className="ql-list" value="ordered" title="Numbered List"></button>
        <button className="ql-list" value="bullet" title="Bullet List"></button>

        <span className="border-l border-slate-300 h-6 mx-1"></span>

        {/* Alignment */}
        <button className="ql-align" value="" title="Align Left"></button>
        <button className="ql-align" value="center" title="Align Center"></button>
        <button className="ql-align" value="right" title="Align Right"></button>
        <button className="ql-align" value="justify" title="Justify"></button>

        <span className="border-l border-slate-300 h-6 mx-1"></span>

        {/* Extras */}
        <button className="ql-blockquote" title="Blockquote"></button>
        <button className="ql-code-block" title="Code Block"></button>
        <button className="ql-link" title="Insert Link"></button>
        <button className="ql-image" title="Insert Image"></button>

        <span className="border-l border-slate-300 h-6 mx-1"></span>

        <button className="ql-clean" title="Clear Formatting"></button>
      </div>

      {/* Editor Container with Scrolling */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-hidden bg-slate-100 rounded-lg p-4"
      >
        <div
          className="mx-auto bg-white shadow-lg"
          style={{
            width: PAGE_WIDTH,
            minHeight: PAGE_HEIGHT,
            padding: `${actualMargins.top}px ${actualMargins.right}px ${actualMargins.bottom}px ${actualMargins.left}px`,
            position: 'relative',
          }}
        >
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
          />

          {/* Page Number Badge */}
          <PageNumberBadge pageIndex={pageIndex} pageCount={pageCount} />
        </div>
      </div>

      {/* Custom Styles */}
      <style>{`
        /* Hide default Quill toolbar since we use custom */
        .ql-toolbar.ql-snow {
          display: none !important;
        }
        
        /* Editor styling */
        .ql-container.ql-snow {
          border: none !important;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 12pt;
          line-height: 1.8;
        }
        
        .ql-editor {
          padding: 0 !important;
          min-height: ${PAGE_HEIGHT - actualMargins.top - actualMargins.bottom}px;
          max-height: none;
          overflow-y: auto !important;
        }
        
        /* Scrollbar styling */
        .ql-editor::-webkit-scrollbar {
          width: 12px;
        }
        
        .ql-editor::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 6px;
        }
        
        .ql-editor::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        
        .ql-editor::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Custom toolbar button styling */
        #quill-toolbar button {
          width: 28px;
          height: 28px;
          padding: 4px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: all 0.15s;
        }

        #quill-toolbar button:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }

        #quill-toolbar button.ql-active {
          background: #e0e7ff;
          border-color: #818cf8;
          color: #4f46e5;
        }

        #quill-toolbar select {
          height: 28px;
          padding: 0 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          background: white;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

