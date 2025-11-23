// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation with multi-select, drag, and rename support

import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { BookOpen, Plus } from "lucide-react";

const META_KEY = "dahtruth_project_meta";

function ChapterItem({
  chapter,
  index,
  isSelected,
  isActive,
  selectMode,
  selectedIds,
  onRowClick,
  onRenameChapter,
}) {
  if (!chapter || chapter.id == null) return null;

  const selectedArray =
    selectedIds && selectedIds.size > 0
      ? Array.from(selectedIds)
      : [chapter.id];

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "chapter",
      item: { ids: selectedArray },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [chapter.id, selectedIds]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState(chapter.title || "");

  const startEdit = (event) => {
    event.stopPropagation();
    setTempTitle(chapter.title || "");
    setIsEditing(true);
  };

  const finishEdit = () => {
    const trimmed = (tempTitle || "").trim();
    if (
      trimmed &&
      trimmed !== chapter.title &&
      typeof onRenameChapter === "function"
    ) {
      onRenameChapter(chapter.id, trimmed);
    }
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setTempTitle(chapter.title || "");
    setIsEditing(false);
  };

  const isMultiSelected = isSelected && selectedIds?.size > 1;

  return (
    <button
      ref={drag}
      onClick={onRowClick}
      type="button"
      className={[
        "w-full text-left rounded-xl text-xs transition",
        "cursor-grab active:cursor-grabbing",
        "flex items-stretch gap-2 group border",
        isActive
          ? "bg-[#1a237e]/90 border-[#D4AF37]/60 text-white shadow-md"
          : isSelected
          ? "bg-white/10 border-[#D4AF37]/50 text-white"
          : "bg-white/5 border-white/10 text-white/80 hover:bg-white/10",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Icon bubble */}
      <div className="w-7 h-7 mt-2 ml-2 flex items-center justify-center rounded-full bg-black/30 flex-shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2 pr-2">
        {isEditing ? (
          <input
            className="w-full text-xs border border-[#D4AF37]/60 rounded px-1.5 py-0.5 bg-black/40 text-white outline-none"
            autoFocus
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onBlur={finishEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") finishEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              {isMultiSelected && (
                <span className="inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-[#D4AF37]/80 text-[10px] font-semibold text-black">
                  {selectedIds.size}
                </span>
              )}
              {/* 📕 full manuscript vs 📖 normal chapter */}
              <span className="text-[11px]">
                {chapter.isFullManuscript ? "📕" : "📖"}
              </span>
              <p className="truncate font-semibold text-[11px]">
                {chapter.title || `Chapter ${index + 1}`}
              </p>
            </div>
            <div className="text-[10px] text-white/50 mt-0.5">
              {(chapter.wordCount || 0).toLocaleString()} words
            </div>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex flex-col items-end justify-between py-2 pr-2 gap-1">
        {isActive && (
          <span className="text-[10px] text-[#D4AF37] font-semibold">
            ●
          </span>
        )}

        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-[10px] text-[#D4AF37] opacity-60 hover:opacity-100"
            onMouseDown={(e) => e.stopPropagation()}
          >
            ✏️
          </button>
        )}
      </div>
    </button>
  );
}

export default function ChapterSidebar({
  chapters,
  selectedId,
  onSelectChapter,
  onAddChapter,
  onDeleteMultiple,
  selectMode,
  selectedIds,
  onToggleSelect,
  onRangeSelect,
  lastClickedIndexRef,
  onRenameChapter,
}) {
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter((ch) => ch && ch.id != null)
    : [];

  // 🔹 Pull project title from shared meta so the sidebar can say "Project – X chapters"
  const [projectTitle, setProjectTitle] = useState("My Project");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(META_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.title) {
        setProjectTitle(parsed.title);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleRowClick = (chapterId, index) => (event) => {
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

  const handleDeleteSelected = () => {
    if (!selectedIds || selectedIds.size === 0 || !onDeleteMultiple) return;
    onDeleteMultiple(Array.from(selectedIds));
  };

  return (
    <aside className="w-60 lg:w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl px-3 py-4 flex flex-col gap-3">
      {/* Header: project + count */}
      <div className="px-2">
        <p className="text-[11px] text-white/60 font-semibold truncate">
          {projectTitle || "My Project"}
        </p>
        <p className="text-[10px] text-white/40">
          {safeChapters.length} chapter{safeChapters.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-2 mt-1">
        <p className="text-[10px] uppercase tracking-wide text-white/40">
          Table of Contents
        </p>
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#1a237e] px-2 py-1 text-[10px] font-medium text-white border border-[#D4AF37]/50 hover:bg-[#0d47a1] transition"
          title="Add New Chapter"
          type="button"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Multi-select status */}
      {selectMode && selectedIds?.size > 0 && (
        <div className="mx-1 mb-1 mt-1 p-2 bg-[#0b102b] border border-[#D4AF37]/40 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-medium text-white">
            {selectedIds.size} selected
          </span>
          {onDeleteMultiple && (
            <button
              onClick={handleDeleteSelected}
              className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white hover:bg-red-700"
              title="Delete Selected"
              type="button"
            >
              🗑 Delete
            </button>
          )}
        </div>
      )}

      {/* Chapters list */}
      <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
        {safeChapters.map((ch, idx) => (
          <ChapterItem
            key={ch.id}
            chapter={ch}
            index={idx}
            isSelected={selectedIds?.has(ch.id)}
            isActive={ch.id === selectedId}
            selectMode={!!selectMode}
            selectedIds={selectedIds}
            onRowClick={handleRowClick(ch.id, idx)}
            onRenameChapter={onRenameChapter}
          />
        ))}

        {safeChapters.length === 0 && (
          <div className="text-center py-6 text-xs text-white/50">
            No chapters yet
          </div>
        )}
      </div>

      {/* Tips */}
      {selectMode && (
        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/45 px-1">
          💡 Click to select, Shift+Click for range, Ctrl/Cmd+Click to toggle.
        </div>
      )}
    </aside>
  );
}
