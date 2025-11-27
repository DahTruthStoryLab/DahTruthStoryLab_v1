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
  pageWidth = 1000,
  onHeadingsChange,
}) {
  const quillRef = useRef(null);

  // 🔹 NEW: line spacing state ("1", "1.5", "2")
  const [lineSpacing, setLineSpacing] = useState("1.5");

  // Quill modules (including history for undo/redo)
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
    ],
    []
  );

  // Word + page count
  const plainText = useMemo(() => stripHtml(html), [html]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(wordCount / 300)), // simple estimate
    [wordCount]
  );

  // Headings → TOC in sidebar
  useEffect(() => {
    if (!onHeadingsChange) return;
    try {
      const tmp = document.createElement("div");
      tmp.innerHTML = html || "";
      const hs = Array.from(tmp.querySelectorAll("h1, h2, h3")).map((el) => ({
        level: el.tagName.toLowerCase(), // "h1" | "h2" | "h3"
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

  // 🔹 NEW: Undo / Redo using Quill history
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

  // Build a class for line spacing: "storylab-lh-1", "storylab-lh-1_5", "storylab-lh-2"
  const spacingClass = `storylab-lh-${lineSpacing.replace(".", "_")}`;

  return (
    <div className="relative flex flex-col gap-3">
      {/* Title row + stats + spacing + undo/redo */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onSave}
          placeholder="Untitled chapter"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
        />

        {/* Left: word + page info */}
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm">
            Pg ~{pageCount}
          </span>
        </div>

        {/* 🔹 Line spacing selector */}
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Spacing:</span>
          <select
            value={lineSpacing}
            onChange={(e) => setLineSpacing(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
          >
            <option value="1">Single</option>
            <option value="1.5">1.5</option>
            <option value="2">Double</option>
          </select>
        </div>

        {/* 🔹 Undo / Redo buttons */}
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={handleUndo}
            className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            className="px-2 py-1 rounded border border-slate-200 bg-white hover:bg-slate-50"
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>
      </div>

      {/* Editor "page" */}
      <div className="flex justify-center">
        <div
          className="relative bg-white shadow-lg border border-slate-200 rounded-md overflow-hidden"
          style={{
            width: pageWidth,
            minHeight: "80vh",
          }}
        >
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={html}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            className={`h-full storylab-editor ${spacingClass}`}
          />

          {/* Optional footer inside the page (AI busy indicator) */}
          {aiBusy && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-slate-500 bg-white/80 px-2 py-1 rounded border border-slate-200 shadow-sm">
              AI working…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
