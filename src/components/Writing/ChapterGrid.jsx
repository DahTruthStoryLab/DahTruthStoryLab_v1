// src/components/Writing/ChapterGrid.jsx
// 4-column grid view of all chapters with drag-drop reordering

import React from "react";
import { List, BookOpen, Plus } from "lucide-react";
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

  const chapterCountLabel =
    safeChapters.length === 1
      ? "1 chapter in outline"
      : `${safeChapters.length || 0} chapters in outline`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* TOC Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-white/5 border border-white/15 backdrop-blur-sm">
              <List className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              Table of Contents
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/60 border border-white/15 rounded-full px-2 py-0.5 bg-white/5">
                <BookOpen className="w-3 h-3" />
                Outline
              </span>
            </h1>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Drag and drop chapters to reorder your story. Click a card to open it.
          </p>
        </div>

        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1a237e] text-white border border-[#D4AF37]/40 hover:bg-[#0d47a1] shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chapter</span>
        </button>
      </div>

      {/* "Paper" container for the grid */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_18px_45px_rgba(0,0,0,0.45)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-wide text-white/60">
            {chapterCountLabel}
          </p>
          {safeChapters.length > 0 && (
            <p className="text-[11px] text-white/50">
              Tip: Use Shift to select a range of chapters
            </p>
          )}
        </div>

        {safeChapters.length > 0 ? (
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
                selected={selectedIds?.has?.(chapter.id)}
                selectMode={!!selectMode}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-white/70">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-dashed border-white/25 bg-white/5 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[#D4AF37]" />
            </div>
            <p className="text-sm font-medium mb-1">No chapters yet</p>
            <p className="text-xs text-white/60 mb-4">
              Use the button above to create your first chapter and begin your outline.
            </p>
            <button
              onClick={onAddChapter}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1a237e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d47a1] border border-[#D4AF37]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create first chapter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
