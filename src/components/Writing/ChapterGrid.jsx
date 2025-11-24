// src/components/Writing/ChapterGrid.jsx
// 4-column grid view of all chapters with drag-drop reordering
import React, { useState, useEffect } from "react";
import { List, Plus } from "lucide-react";
import ChapterCard from "./ChapterCard";

const META_KEY = "dahtruth_project_meta";

export default function ChapterGrid({
  chapters,
  selectedId,
  onSelectChapter,
  onMoveChapter,
  onDeleteChapter,
  onAddChapter, // 👈 NEW: needed for Add Chapter button
  // multi-select props (may be undefined if not used)
  selectMode,
  selectedIds,
  onToggleSelect,
  onRangeSelect,
  lastClickedIndexRef,
}) {
  // Load project meta to get novel name and author
  const [meta, setMeta] = useState({
    title: "Working Title",
    author: "Your Name",
  });

  useEffect(() => {
    try {
      const savedMeta = localStorage.getItem(META_KEY);
      if (savedMeta) {
        const parsed = JSON.parse(savedMeta);
        if (parsed && typeof parsed === "object") {
          setMeta((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch (err) {
      console.warn("Failed to load project meta", err);
    }
  }, []);

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
      {/* Header: Story Outline | Table of Contents | Novel Name */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/70 shadow-sm flex items-center justify-center">
            <List className="w-4 h-4 text-[#7e55c4]" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-[#4b2a63] uppercase">
              Story Outline | Table of Contents | {meta.title || "Working Title"}
            </p>
            <p className="text-[11px] text-[#7c5c9b]">
              {meta.author && `by ${meta.author} • `}
              See your chapters at a glance. Click any card to open and keep writing.
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Add Chapter Button */}
          <button
            onClick={onAddChapter}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#9b7bc9] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#8668b3] border border-[#D4AF37] shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Chapter</span>
          </button>

          {/* Chapter count and tips */}
          <div className="hidden sm:flex flex-col items-end text-[11px] text-[#7c5c9b]">
            <span>{chapterCountLabel}</span>
            {safeChapters.length > 0 && (
              <span>Tip: Drag cards to reorder.</span>
            )}
          </div>
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
        // Empty state with Add Chapter CTA
        <div className="rounded-2xl border border-[#f0e4ff] bg-white/70 px-4 py-8 text-center">
          <p className="text-[12px] text-[#7c5c9b] mb-4">
            No chapters in your outline yet.
          </p>
          <button
            onClick={onAddChapter}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#9b7bc9] px-4 py-2 text-sm font-medium text-white hover:bg-[#8668b3] border border-[#D4AF37] shadow-sm transition mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Chapter</span>
          </button>
        </div>
      )}
    </div>
  );
}

