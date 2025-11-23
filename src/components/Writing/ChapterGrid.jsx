// src/components/Writing/ChapterGrid.jsx
// 4-column grid view of all chapters with drag-drop reordering

import React from "react";
import { List } from "lucide-react";
import ChapterCard from "./ChapterCard";

export default function ChapterGrid({
  chapters,
  selectedId,
  onSelectChapter,
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
      {/* Header: Story Outline + TOC pill */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/70 shadow-sm flex items-center justify-center">
            {/* Table of contents icon */}
            <List className="w-4 h-4 text-[#7e55c4]" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#4b2a63] uppercase">
              Story Outline
            </p>
            <p className="text-[11px] text-[#7c5c9b]">
              See your chapters at a glance. Click any card to open and keep
              writing.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end text-[11px] text-[#7c5c9b]">
          <span>{chapterCountLabel}</span>
          {safeChapters.length > 0 && (
            <span>Tip: Drag cards to reorder. Shift+Click to select a range.</span>
          )}
        </div>
      </div>

      {/* Grid of chapter cards – all cards come from Writing chapters */}
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
        // Simple, quiet empty state – no "create first chapter" CTA
        <div className="rounded-2xl border border-[#f0e4ff] bg-white/70 px-4 py-6 text-center text-[12px] text-[#7c5c9b]">
          No chapters in your outline yet.  
          <br />
          Create chapters from the Writing view and they will appear here.
        </div>
      )}
    </div>
  );
}
