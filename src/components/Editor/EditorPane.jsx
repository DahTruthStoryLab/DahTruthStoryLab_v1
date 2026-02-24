// src/components/Editor/EditorPane.jsx
import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import ReactQuill from "react-quill";

function stripHtml(html = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || "";
}

function countWords(text = "") {
  const cleaned = String(text || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

export default function EditorPane({
  title,
  setTitle,
  html,
  setHtml,
  onSave,
  onAI, // compatibility
  aiBusy,
  pageWidth, // ignored for true 8.5x11 (kept for compatibility)
  onHeadingsChange,
}) {
  const quillRef = useRef(null);

  // Line spacing state ("1", "1.5", "2")
  const [lineSpacing, setLineSpacing] = useState("2");

  // ==========================
  // 8.5 x 11 PAGE CONSTANTS
  // ==========================
  // At 96dpi, 8.5in = 816px, 11in = 1056px
  const PAGE_W = 816;
  const PAGE_H = 1056;
  const PAGE_GAP = 28; // space between pages on the gray "desk"
  const MARGIN = 96; // ~1 inch at 96dpi

  const [measuredPages, setMeasuredPages] = useState(1);

  // Standard Quill toolbar
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }, { size: [] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ header: 1 }, { header: 2 }],
        [{ align: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote"],
        ["clean"],
      ],
      history: {
        delay: 500,
        maxStack: 500,
        userOnly: true,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "script",
      "header",
      "align",
      "list",
      "indent",
      "blockquote",
    ],
    []
  );

  // Word + page count (info only)
  const plainText = useMemo(() => stripHtml(html), [html]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const approxPages = useMemo(() => Math.max(1, Math.ceil(wordCount / 300)), [wordCount]);

  // Headings → TOC in sidebar
  useEffect(() => {
    if (!onHeadingsChange) return;
    try {
      const tmp = document.createElement("div");
      tmp.innerHTML = html || "";
      const hs = Array.from(tmp.querySelectorAll("h1, h2, h3")).map((el) => ({
        level: el.tagName.toLowerCase(),
        text: el.textContent || "",
        id: el.id || "",
      }));
      onHeadingsChange(hs);
    } catch {
      onHeadingsChange([]);
    }
  }, [html, onHeadingsChange]);

  const handleChange = (value) => setHtml(value);

  // Undo / Redo using Quill history
  const handleUndo = () => {
    const editor = quillRef.current?.getEditor?.();
    if (editor?.history) editor.history.undo();
  };

  const handleRedo = () => {
    const editor = quillRef.current?.getEditor?.();
    if (editor?.history) editor.history.redo();
  };

  // Keyboard shortcuts (Ctrl/Cmd+Z/Y)
  useEffect(() => {
    const onKey = (e) => {
      const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform);
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;

      const key = (e.key || "").toLowerCase();

      if (key === "s") {
        e.preventDefault();
        return;
      }
      if (key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
        return;
      }
      if (key === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (key === "y") {
        e.preventDefault();
        handleRedo();
        return;
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, []);

  // Line height value for inline styles
  const lineHeightValue =
    lineSpacing === "1" ? "1.4" : lineSpacing === "1.5" ? "1.8" : "2.4";

  // Measure actual rendered height -> number of pages
  const measurePages = useCallback(() => {
    const editor = quillRef.current?.getEditor?.();
    const root = editor?.root;
    if (!root) return;

    // root.scrollHeight is the true content height
    const contentH = Math.max(PAGE_H, root.scrollHeight + MARGIN * 2);
    const needed = Math.max(1, Math.ceil(contentH / PAGE_H));
    setMeasuredPages((prev) => (prev === needed ? prev : needed));
  }, [PAGE_H, MARGIN]);

  useEffect(() => {
    // measure after render
    const t = requestAnimationFrame(() => measurePages());
    return () => cancelAnimationFrame(t);
  }, [html, lineSpacing, measurePages]);

  const totalCanvasHeight = measuredPages * PAGE_H + (measuredPages - 1) * PAGE_GAP;

  return (
    <div className="relative flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
      {/* Row 1: Title + stats + spacing + undo/redo */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 p-3 shadow-sm flex-shrink-0 mb-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onSave}
          placeholder="Untitled chapter"
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        />

        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            ~{approxPages} page{approxPages !== 1 ? "s" : ""}
          </span>
          <span className="text-[11px] text-slate-400">
            (layout pages: {measuredPages})
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Spacing:</span>
          <select
            value={lineSpacing}
            onChange={(e) => setLineSpacing(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-amber-400"
          >
            <option value="1">Single</option>
            <option value="1.5">1.5</option>
            <option value="2">Double</option>
          </select>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            title="Undo (Ctrl/Cmd+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            title="Redo (Ctrl/Cmd+Y)"
          >
            ↪ Redo
          </button>
        </div>
      </div>

      <style>{`
        /* ===== Desk background ===== */
        .dt-desk {
          background: #f1f5f9; /* cool gray */
        }

        /* ===== Page stack ===== */
        .dt-page {
          width: ${PAGE_W}px;
          height: ${PAGE_H}px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow:
            0 10px 20px rgba(15, 23, 42, 0.08),
            0 2px 6px rgba(15, 23, 42, 0.06);
        }

        /* Page separator space */
        .dt-page + .dt-page {
          margin-top: ${PAGE_GAP}px;
        }

        /* ===== Quill hard clamps ===== */
        .dt-quill,
        .dt-quill * {
          box-sizing: border-box;
          max-width: 100%;
        }

        .dt-quill .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: rgba(248, 250, 252, 0.95);
          border-radius: 10px 10px 0 0;
        }

        .dt-quill .ql-container {
          border: none !important;
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 12pt;
          background: transparent !important;
        }

        .dt-quill .ql-editor {
        /* Ensure text always has white background */
        background: white !important;

          /* Standard manuscript margins */
          padding: ${MARGIN}px;

          /* IMPORTANT: let content flow across pages by height expansion */
          min-height: ${PAGE_H}px;
          line-height: ${lineHeightValue};

          overflow-wrap: anywhere;
          word-break: break-word;

          margin: 0 !important;
        }

        .dt-quill .ql-editor:focus {
          outline: none;
        }

        .dt-quill .ql-container,
        .dt-quill .ql-editor,
        .dt-quill .ql-toolbar {
          position: static !important;
          left: auto !important;
          right: auto !important;
          top: auto !important;
          bottom: auto !important;
          transform: none !important;
          width: 100% !important;
          max-width: 100% !important;
          z-index: auto !important;
        }
      `}</style>

      {/* ===== Paged editor surface ===== */}
      <div className="flex-1 min-h-0 min-w-0 overflow-auto dt-desk rounded-lg border border-slate-200">
        <div className="py-10">
          {/* Center column */}
          <div className="mx-auto" style={{ width: PAGE_W }}>
            {/* Relative canvas to stack page backdrops + editor */}
            <div className="relative" style={{ width: PAGE_W, minHeight: totalCanvasHeight }}>
              {/* Page backdrops */}
              <div aria-hidden="true">
                {Array.from({ length: measuredPages }).map((_, i) => (
                  <div key={i} className="dt-page" />
                ))}
              </div>

              {/* Editor overlay */}
              <div
                className="absolute inset-0"
                style={{
                  width: PAGE_W,
                  height: totalCanvasHeight,
                  paddingTop: 0,
                }}
              >
                <div className="dt-page overflow-hidden" style={{ height: totalCanvasHeight, border: "none", boxShadow: "none", background: "transparent" }}>
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={html}
                    onChange={handleChange}
                    modules={modules}
                    formats={formats}
                    className="dt-quill"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {aiBusy && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-lg flex items-center gap-2 z-50">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          AI is working...
        </div>
      )}
    </div>
  );
}
