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

  const totalWords = safeChapters.reduce(
    (sum, ch) => sum + (ch.wordCount || 0),
    0
  );
  const totalWordsLabel = `${totalWords.toLocaleString()} words across all chapters`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Header row: Story Outline + toggle pill */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/40 border border-white/70 shadow-sm">
              <BookOpen className="w-4 h-4 text-[#7b4aa8]" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-[#3b1e55]">
              Story Outline
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#4a305f] border border-[#e4c9ff] rounded-full px-2 py-0.5 bg-[#f7ecff]">
              <List className="w-3 h-3" />
              Table of Contents
            </span>
          </div>
          <p className="text-xs text-[#4a305f] mt-1">
            See your chapters at a glance. Click any page to open and keep
            writing.
          </p>
        </div>

        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#7b4aa8] text-white border border-[#D4AF37]/40 hover:bg-[#5d2f8a] shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chapter</span>
        </button>
      </div>

      {/* Small stats / tip row */}
      <div className="flex items-center justify-between text-[11px]">
        <div>
          <p className="font-semibold tracking-wide text-[#5c3f7a]">
            {chapterCountLabel}
          </p>
          <p className="text-[#4a305f] mt-0.5">{totalWordsLabel}</p>
        </div>
        {safeChapters.length > 0 && (
          <p className="text-[#4a305f]">
            Tip: Drag to reorder pages. Use Shift to select a range.
          </p>
        )}
      </div>

      {/* 👉 No more big lilac “sheet” — just the cards floating on the page */}
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
        <div className="py-10 flex justify-center">
          <div className="w-full max-w-xs rounded-3xl bg-white shadow-[0_18px_45px_rgba(0,0,0,0.18)] border border-[#f1ddff] p-5 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-dashed border-[#e2c9ff] bg-[#fbf4ff] flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-[#7b4aa8]" />
            </div>
            <p className="text-sm font-medium text-[#3b1e55] mb-1">
              No chapters yet
            </p>
            <p className="text-xs text-[#5a3b73] mb-4">
              Use the button above to create your first chapter and begin your
              outline.
            </p>
            <button
              onClick={onAddChapter}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#7b4aa8] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5d2f8a] border border-[#D4AF37]/40"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create first chapter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
