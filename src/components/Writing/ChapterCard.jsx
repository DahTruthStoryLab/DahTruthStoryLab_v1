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
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter((ch) => ch && ch.id != null)
    : [];

  const handleOpen = (chapterId, index) => (event) => {
    if (!chapterId) return;

    if (!selectMode) {
      onSelectChapter && onSelectChapter(chapterId);
      return;
    }

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
            <div className="p-2 rounded-lg bg-white border border-[#e3d0ff] shadow-sm">
              <List className="w-4 h-4 text-[#7b4fd6]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                Story Outline
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                See your chapters at a glance. Click any page to open and keep writing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2">
            <span className="inline-flex items-center text-[11px] font-medium text-slate-700">
              TABLE OF CONTENTS
            </span>
          </div>

          <button
            onClick={onAddChapter}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#7b4fd6] text-white border border-[#d4af37]/50 hover:bg-[#6b3fcb] shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New chapter</span>
          </button>
        </div>
      </div>

      {/* “Paper” container for the grid */}
      <div className="bg-[#f6edf9]/90 backdrop-blur-xl rounded-2xl border border-[#ead8ff] shadow-[0_18px_45px_rgba(0,0,0,0.15)] p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold text-slate-800 uppercase tracking-wide">
              {chapterCountLabel}
            </span>
            <span className="text-[11px] text-slate-600">
              0 words across all chapters
            </span>
          </div>

          {safeChapters.length > 0 && (
            <p className="text-[11px] text-slate-500">
              Tip: Drag to reorder pages. Use Shift to select a range.
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
                selected={selectedIds?.has?.(chapter.id)}
                selectMode={!!selectMode}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-dashed border-[#e3d0ff] bg-white flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[#7b4fd6]" />
            </div>
            <p className="text-sm font-medium mb-1">No chapters yet</p>
            <p className="text-xs text-slate-600 mb-4">
              Use the button above to create your first chapter and begin your outline.
            </p>
            <button
              onClick={onAddChapter}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7b4fd6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#6b3fcb] border border-[#d4af37]/50"
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
