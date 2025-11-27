// src/components/Editor/EditorPane.jsx
import React, { useMemo, useEffect, useState } from "react";
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
  onAI,       // still available for toolbar buttons, but not used here
  aiBusy,
  pageWidth = 1000,
  onHeadingsChange,
}) {
  // ✅ Simple line spacing state (applies to the whole page)
  const [lineSpacing, setLineSpacing] = useState("1.5");

  // Quill modules – keep them simple and stable
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

  return (
    <div className="relative flex flex-col gap-3">
      {/* Title row + stats */}
      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={onSave}
          placeholder="Untitled chapter"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
        />

        {/* ✅ Stats + line spacing control over on the right, away from the trash can */}
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 shadow-sm">
            Pg ~{pageCount}
          </span>

          {/* Line spacing select – NOT inside the Quill toolbar, so it can't disappear */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-600">Line</span>
            <select
              value={lineSpacing}
              onChange={(e) => setLineSpacing(e.target.value)}
              className="border rounded px-2 py-[2px] text-[11px] bg-white"
            >
              <option value="1">Single</option>
              <option value="1.5">1.5</option>
              <option value="2">Double</option>
            </select>
          </div>
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
            theme="snow"
            value={html}
            onChange={handleChange}
            modules={modules}
            formats={formats}
            className="h-full"
            // ✅ This actually changes line spacing
            style={{ height: "100%", lineHeight: lineSpacing }}
          />

          {/* No bottom AI bar here – all AI is handled by the top toolbar + right-hand panel */}
        </div>
      </div>
    </div>
  );
}
