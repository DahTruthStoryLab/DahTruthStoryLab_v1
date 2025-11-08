// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation

import React from "react";

export default function ChapterSidebar({
  chapters,
  selectedId,
  onSelectChapter,
  onAddChapter,
}) {
  return (
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4"
      style={{
        boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Chapters</h3>
        <button
          onClick={onAddChapter}
          className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
          title="Add New Chapter"
        >
          + Add
        </button>
      </div>

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {chapters.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onSelectChapter(ch.id)}
            className={[
              "w-full text-left px-3 py-2 rounded-lg text-sm transition",
              ch.id === selectedId
                ? "bg-slate-100 font-medium"
                : "hover:bg-slate-50",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="truncate">{ch.title}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {(ch.wordCount || 0).toLocaleString()} words
                </div>
              </div>
              {ch.id === selectedId && (
                <div className="text-xs">▶</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">
          No chapters yet
        </div>
      )}
    </div>
  );
}

