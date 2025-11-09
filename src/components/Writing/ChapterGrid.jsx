// src/components/Writing/ChapterGrid.jsx
// 4-column grid view of all chapters with drag-drop reordering

import React from "react";
import ChapterCard from "./ChapterCard";

export default function ChapterGrid({
  chapters,
  selectedId,
  onSelectChapter,
  onAddChapter,
  onMoveChapter,
  onDeleteChapter,  // ← ADD THIS LINE
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Chapters</h1>
        <button
          onClick={onAddChapter}
          className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50"
        >
          + Add Chapter
        </button>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {chapters.map((chapter, idx) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={idx}
            moveCard={onMoveChapter}
            active={chapter.id === selectedId}
            onOpen={() => onSelectChapter(chapter.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {chapters.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg mb-2">No chapters yet</p>
          <p className="text-sm">Click "+ Add Chapter" to get started</p>
        </div>
      )}
    </div>
  );
}
