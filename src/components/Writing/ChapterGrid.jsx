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

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Top header above the paper */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#f5e4ff]/20 border border-[#f5e4ff]/40 backdrop-blur-sm">
              <List className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                Story Outline
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-[#fcecff] border border-[#f5e4ff]/60 rounded-full px-2 py-0.5 bg-[#2b143f]/60">
                  <BookOpen className="w-3 h-3" />
                  Table of Contents
                </span>
              </h1>
              <p className="text-xs text-white/70 mt-1">
                See your chapters at a glance. Click any page to open and keep
                writing.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#f5e4ff] text-[#2b143f] border border-[#D4AF37]/60 hover:bg-[#fff0ff] shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New chapter</span>
        </button>
      </div>

      {/* "Paper" container for the grid */}
      <div className="relative">
        {/* subtle shadow behind the sheet */}
        <div className="absolute inset-0 translate-y-1 translate-x-1 rounded-3xl bg-black/40 opacity-40 blur-md pointer-events-none" />
        <div className="relative bg-[#fdf9ff]/95 text-[#1b1034] backdrop-blur-xl rounded-3xl border border-[#ead7ff] shadow-[0_18px_45px_rgba(8,4,24,0.45)] p-4 sm:p-6">
          {/* Top strip on the “paper” */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-[#ead7ff]/70 pb-2">
            <div className="flex flex-col gap-0.5">
              <p className="text-[11px] uppercase tracking-wide text-[#7d5a9e] font-semibold">
                {chapterCountLabel}
              </p>
              <p className="text-[11px] text-[#9a7bc0]">
                {totalWords.toLocaleString()} words across all chapters
              </p>
            </div>
            {safeChapters.length > 0 && (
              <p className="text-[11px] text-[#a488c7]">
                Tip: Drag to reorder pages. Use Shift to select a range.
              </p>
            )}
          </div>

          {safeChapters.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {safeChapters.map((chapter, idx) => (
                <div
                  key={chapter.id}
                  className="relative group"
                >
                  {/* little “stacked page” shadow */}
                  <div className="absolute inset-0 translate-y-1 translate-x-1 rounded-2xl bg-[#e9d4ff]/80 opacity-70 group-hover:opacity-90 transition" />
                  <div className="relative rounded-2xl bg-white shadow-[0_10px_25px_rgba(23,10,44,0.18)] border border-[#f0e2ff] overflow-hidden">
                    {/* Top bar of each page */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-[#f5e9ff] bg-[#f8f1ff]">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e9d4ff] text-[10px] font-semibold text-[#2b143f]">
                          {chapter.order ?? idx + 1}
                        </span>
                        <span className="text-[11px] font-semibold text-[#2b143f] truncate max-w-[9rem]">
                          {chapter.title || `Chapter ${idx + 1}`}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#9a7bc0]">
                        {(chapter.wordCount || 0).toLocaleString()}w
                      </span>
                    </div>

                    {/* Body: your existing ChapterCard content */}
                    <div className="p-3">
                      <ChapterCard
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-[#2b143f]/80">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl border border-dashed border-[#d2b8ff] bg-[#f8f1ff] flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-[#D4AF37]" />
              </div>
              <p className="text-sm font-semibold mb-1">
                No chapters yet
              </p>
              <p className="text-xs text-[#7d5a9e] mb-4">
                Create your first page to begin building your outline.
              </p>
              <button
                onClick={onAddChapter}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#f5e4ff] px-3 py-1.5 text-xs font-medium text-[#2b143f] hover:bg-[#fff0ff] border border-[#D4AF37]/60"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create first chapter</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
