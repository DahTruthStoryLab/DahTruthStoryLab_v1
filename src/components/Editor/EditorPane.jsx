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
  onAI,
  aiBusy,
  pageWidth = 850,
  onHeadingsChange,
}) {
  const quillRef = useRef(null);

  // Line spacing state ("1", "1.5", "2")
  const [lineSpacing, setLineSpacing] = useState("1.5");

  // FIXED: Standard Quill toolbar (NOT external)
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
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(wordCount / 300)),
    [wordCount]
  );

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

  const handleChange = (value) => {
    setHtml(value);
  };

  // Undo / Redo using Quill history
  const handleUndo = () => {
    const editor = quillRef.current?.getEditor?.();
    if (editor && editor.history) {
      editor.history.undo();
    }
  };

  const handleRedo = () => {
    const editor = quillRef.current?.getEditor?.();
    if (editor && editor.history) {
      editor.history.redo();
    }
  };

  // Build a class for line spacing
  const spacingClass = `storylab-lh-${lineSpacing.replace(".", "_")}`;

  return (
    <div className="relative flex flex-col gap-4">
      {/* Row 1: Title + stats + spacing + undo/redo */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
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

      {/* ═══════════════════════════════════════════════════════════════
          WORD DOCUMENT LOOK - Gray background with white page
          Quill toolbar will appear at top of the white page area
      ═══════════════════════════════════════════════════════════════ */}
      <div 
        className="rounded-lg p-8"
        style={{ 
          backgroundColor: "#c0c0c0",
          minHeight: "calc(100vh - 340px)",
        }}
      >
        {/* White "page" - like a Word document */}
        <div
          className="mx-auto bg-white shadow-xl"
          style={{
            maxWidth: pageWidth,
            minHeight: "calc(100vh - 400px)",
            padding: "72px", // 1 inch margins like Word
            boxShadow: "0 4px 24px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)",
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={html}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            className={`storylab-editor ${spacingClass}`}
            style={{
              minHeight: "calc(100vh - 540px)",
            }}
          />
        </div>

        {/* AI busy indicator */}
        {aiBusy && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-sm text-slate-700 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-lg flex items-center gap-2 z-50">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            AI is working...
          </div>
        )}
      </div>
    </div>
  );
}
