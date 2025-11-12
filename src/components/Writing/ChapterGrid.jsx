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
  onDeleteChapter,

  // multi-select props (may be undefined if not used)
  selectMode,
  selectedIds,
  onToggleSelect,
  onRangeSelect,
  lastClickedIndexRef,
}) {
  // Extra safety: filter out bad entries so `.id` is never read on undefined
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter((ch) => ch && ch.id != null)
    : [];

  const handleOpen = (chapterId, index) => (event) => {
    if (!chapterId) return;

    // When not in select mode: normal open -> editor
    if (!selectMode) {
      onSelectChapter && onSelectChapter(chapterId);
      return;
    }

    // In select mode: support Ctrl/Cmd + Shift
    const isShift = event.shiftKey;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isShift && typeof onRangeSelect === "function") {
      onRangeSelect(index);
    } else if (typeof onToggleSelect === "function") {
      onToggleSelect(chapterId, { additive: isCtrlOrCmd });
      if (lastClickedIndexRef) lastClickedIndexRef.current = index;
    }
  };

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
        {safeChapters.map((chapter, idx) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={idx}
            moveCard={onMoveChapter}
            active={chapter.id === selectedId}
            onOpen={handleOpen(chapter.id, idx)}
            onDelete={onDeleteChapter}
            // pass selection info down if your card uses it
            selected={selectedIds?.has(chapter.id)}
            selectMode={!!selectMode}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </div>

      {/* Empty state */}
      {safeChapters.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg mb-2">No chapters yet</p>
          <p className="text-sm">Click "+ Add Chapter" to get started</p>
        </div>
      )}
    </div>
  );
}
