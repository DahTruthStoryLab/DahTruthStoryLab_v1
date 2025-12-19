// src/components/Editor/EditorPane.jsx
import React, { useMemo, useEffect, useState, useRef } from "react";
import ReactQuill from "react-quill";

function stripHtml(html = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || "";
}

function countWords(text = "") {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

export default function EditorPane({
  title,
  setTitle,
  html,
  setHtml,
  onSave,
  onAI, // (kept for compatibility even if not used directly here)
  aiBusy,
  pageWidth = 850,
  onHeadingsChange,
}) {
  const quillRef = useRef(null);

  // Line spacing state ("1", "1.5", "2")
  const [lineSpacing, setLineSpacing] = useState("1.5");

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

  // Word + page count
  const plainText = useMemo(() => stripHtml(html), [html]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const pageCount = useMemo(() => Math.max(1, Math.ceil(wordCount / 300)), [wordCount]);

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

  // Spacing class + line height
  const spacingClass = `storylab-lh-${lineSpacing.replace(".", "_")}`;
  const lineHeightValue =
    lineSpacing === "1" ? "1.4" : lineSpacing === "1.5" ? "1.8" : "2.4";

  return (
    // IMPORTANT: min-w-0 / min-h-0 keeps the editor constrained inside the grid cell
    <div className="relative flex flex-col h-full min-h-0 min-w-0">
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

        {/* Word + page info */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
            ~{pageCount} page{pageCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Line spacing selector */}
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

        {/* Undo / Redo buttons */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            title="Undo (Ctrl+Z)"
          >
            ↩ Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="px-3 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 font-medium"
            title="Redo (Ctrl+Y)"
          >
            ↪ Redo
          </button>
        </div>
      </div>

      {/* Quill styling */}
      <style>{`
        .word-style-editor .ql-toolbar {
          border: none !important;
          border-bottom: 1px solid #e2e8f0 !important;
          background: #f8fafc;
          border-radius: 8px 8px 0 0;
        }
        .word-style-editor .ql-container {
          border: none !important;
          font-family: 'Times New Roman', Georgia, serif;
          font-size: 12pt;
        }
        .word-style-editor .ql-editor {
          padding: 60px 72px;
          min-height: 600px;
          line-height: ${lineHeightValue};
        }
        .word-style-editor .ql-editor:focus {
          outline: none;
        }

        /* Responsive padding to prevent horizontal overflow on smaller screens */
        @media (max-width: 1024px) {
          .word-style-editor .ql-editor {
            padding: 40px 36px;
          }
        }
        @media (max-width: 640px) {
          .word-style-editor .ql-editor {
            padding: 28px 18px;
          }
        }
      `}</style>

      {/* 
        KEY FIX:
        - outer wrapper prevents the editor from "spilling" into the sidebar
        - inner container is full width of the grid cell, with a centered maxWidth "page"
      */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          className="h-full w-full overflow-auto bg-white rounded-lg border border-slate-200 shadow-sm mx-auto"
          style={{
            maxWidth: pageWidth, // keep your page width
            width: "100%",       // but never exceed the grid cell
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={html}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            className={`word-style-editor ${spacingClass}`}
          />
        </div>
      </div>

      {/* AI busy indicator */}
      {aiBusy && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-lg flex items-center gap-2 z-50">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          AI is working...
        </div>
      )}
    </div>
  );
}
