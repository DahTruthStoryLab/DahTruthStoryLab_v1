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

  const baseClasses = [
    "w-full text-left rounded-xl text-xs transition",
    "cursor-grab active:cursor-grabbing",
    "flex items-stretch gap-2 group border",
    isDragging ? "opacity-50" : "",
  ];

  const stateClasses = isActive
    ? // Active chapter: light lilac card with dark text
      "bg-[#f9e7ff] border-[#D4AF37]/70 text-[#2b143f] shadow-md"
    : isSelected
    ? // Selected but not active
      "bg-[#f5e4ff]/40 border-[#D4AF37]/60 text-white"
    : // Default
      "bg-white/5 border-white/10 text-white/85 hover:bg-white/10 hover:border-white/25";

  return (
    <button
      ref={drag}
      onClick={onRowClick}
      type="button"
      className={[...baseClasses, stateClasses].join(" ")}
    >
      {/* Icon bubble */}
      <div className="w-7 h-7 mt-2 ml-2 flex items-center justify-center rounded-full bg-[#f5e4ff]/40 flex-shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2 pr-2">
        {isEditing ? (
          <input
            className="w-full text-xs border border-[#D4AF37]/60 rounded px-1.5 py-0.5 bg-[#2b143f]/60 text-white outline-none"
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
                <span className="inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-[#D4AF37]/90 text-[10px] font-semibold text-black">
                  {selectedIds.size}
                </span>
              )}
              <p
                className={`truncate font-semibold text-[11px] ${
                  isActive ? "text-[#2b143f]" : "text-white"
                }`}
              >
                {chapter.title || `Chapter ${index + 1}`}
              </p>
            </div>
            <div
              className={`text-[10px] mt-0.5 ${
                isActive ? "text-[#4b295f]" : "text-white/60"
              }`}
            >
              {(chapter.wordCount || 0).toLocaleString()} words
            </div>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex flex-col items-end justify-between py-2 pr-2 gap-1">
        {isActive && (
          <span className="text-[10px] text-[#b66cff] font-semibold">●</span>
        )}

        {!isEditing && (
          <button
            type="button"
            onClick={startEdit}
            className={`text-[10px] ${
              isActive ? "text-[#7b3bb8]" : "text-[#D4AF37]"
            } opacity-70 hover:opacity-100`}
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
    <aside className="w-60 lg:w-64 border-r border-white/10 bg-[#1b1034]/80 backdrop-blur-xl px-3 py-4 flex flex-col gap-3">
      {/* Header: project + count */}
      <div className="px-2">
        <p className="text-[11px] text-[#f9e7ff] font-semibold truncate">
          {projectTitle || "My Project"}
        </p>
        <p className="text-[10px] text-[#e2c7ff]/80">
          {safeChapters.length} chapter
          {safeChapters.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-2 mt-1">
        <p className="text-[10px] uppercase tracking-wide text-[#c6a5ff]/80">
          Table of Contents
        </p>
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#f5e4ff]/90 px-2 py-1 text-[10px] font-medium text-[#2b143f] border border-[#D4AF37]/60 hover:bg-[#fff0ff] transition"
          title="Add New Chapter"
          type="button"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Multi-select status */}
      {selectMode && selectedIds?.size > 0 && (
        <div className="mx-1 mb-1 mt-1 p-2 bg-[#2b143f]/70 border border-[#D4AF37]/50 rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-medium text-[#fbeaff]">
            {selectedIds.size} selected
          </span>
          {onDeleteMultiple && (
            <button
              onClick={handleDeleteSelected}
              className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white hover:bg-red-600"
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
          <div className="text-center py-6 text-xs text-[#fbeaff]/70">
            No chapters yet
          </div>
        )}
      </div>

      {/* Tips */}
      {selectMode && (
        <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#dcc3ff]/80 px-1">
          💡 Click to select, Shift+Click for range, Ctrl/Cmd+Click to toggle.
        </div>
      )}
    </aside>
  );
}
