// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation with multi-select, drag, and rename support

import React, { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import { BookOpen, Plus } from "lucide-react";

const META_KEY = "dahtruth_project_meta";
const DND_TYPE = "SIDEBAR_CHAPTER";

function ChapterItem({
  chapter,
  index,
  isSelected,
  isActive,
  selectMode,
  selectedIds,
  onRowClick,
  onRenameChapter,
  onMoveChapter,
}) {
  if (!chapter || chapter.id == null) return null;

  const selectedArray =
    selectedIds && selectedIds.size > 0
      ? Array.from(selectedIds)
      : [chapter.id];

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: DND_TYPE,
      item: { id: chapter.id, index, ids: selectedArray },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [chapter.id, selectedIds, index]
  );

  // Drop target so other items can be moved above/below this one
  const [, drop] = useDrop(
    () => ({
      accept: DND_TYPE,
      hover(item) {
        if (!onMoveChapter) return;
        const dragIndex = item.index;
        const hoverIndex = index;
        if (dragIndex === hoverIndex) return;
        onMoveChapter(dragIndex, hoverIndex);
        item.index = hoverIndex;
      },
    }),
    [index, onMoveChapter]
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
      ref={(node) => drag(drop(node))}
      onClick={onRowClick}
      type="button"
      className={[
        "w-full text-left rounded-xl text-xs transition",
        "cursor-grab active:cursor-grabbing",
        "flex items-stretch gap-2 group border",
        isActive
          ? "bg-[#9b7bc9] border-[#D4AF37] text-black shadow-md"
          : isSelected
          ? "bg-[#b89dd6] border-[#D4AF37] text-black"
          : "bg-white/40 border-[#c4afd9]/50 text-black hover:bg-white/60",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Icon bubble */}
      <div className="w-7 h-7 mt-2 ml-2 flex items-center justify-center rounded-full bg-[#D4AF37]/30 flex-shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-[#2b143f]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-2 pr-2">
        {isEditing ? (
          <input
            className="w-full text-xs border border-[#D4AF37] rounded px-1.5 py-0.5 bg-white text-black outline-none"
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
                <span className="inline-flex items-center justify-center px-1.5 h-5 rounded-full bg-[#D4AF37] text-[10px] font-semibold text-black">
                  {selectedIds.size}
                </span>
              )}
              <p className="truncate font-semibold text-[11px]">
                {chapter.title || `Chapter ${index + 1}`}
              </p>
            </div>
            <div className="text-[10px] text-black/60 mt-0.5">
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
            className="text-[10px] text-black/70 hover:text-black"
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
  onMoveChapter,
}) {
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter((ch) => ch && ch.id != null)
    : [];

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
    <aside className="w-60 lg:w-64 border-r border-[#c4afd9] bg-[#d4c5e8] backdrop-blur-xl px-3 py-4 flex flex-col gap-3">
      {/* Header: project + count */}
      <div className="px-2">
        <p className="text-[11px] text-black/80 font-semibold truncate">
          {projectTitle || "My Project"}
        </p>
        <p className="text-[10px] text-black/60">
          {safeChapters.length} chapter{safeChapters.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between px-2 mt-1">
        <p className="text-[10px] uppercase tracking-wide text-black/60">
          Table of Contents
        </p>
        <button
          onClick={onAddChapter}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#9b7bc9] px-2 py-1 text-[10px] font-medium text-white border border-[#D4AF37] hover:bg-[#8668b3] transition"
          title="Add New Chapter"
          type="button"
        >
          <Plus className="w-3 h-3" />
          <span>Add</span>
        </button>
      </div>

      {/* Multi-select status */}
      {selectMode && selectedIds?.size > 0 && (
        <div className="mx-1 mb-1 mt-1 p-2 bg-[#b89dd6] border border-[#D4AF37] rounded-xl flex items-center justify-between">
          <span className="text-[10px] font-medium text-black">
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
            onMoveChapter={onMoveChapter}
          />
        ))}

        {safeChapters.length === 0 && (
          <div className="text-center py-6 text-xs text-black/50">
            No chapters yet
          </div>
        )}
      </div>

      {/* Tips */}
      {selectMode && (
        <div className="mt-2 pt-2 border-t border-black/20 text-[10px] text-black/60 px-1">
          💡 Click to select, Shift+Click for range, Ctrl/Cmd+Click to toggle.
        </div>
      )}
    </aside>
  );
}

// src/components/Writing/ChapterCard.jsx
// Individual chapter card styled as a sheet of paper with drag-and-drop
import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Trash2, GripVertical } from "lucide-react";

const DND_TYPE = "CHAPTER_CARD";

// Extract first N words from HTML content
const getFirstWords = (html = "", wordCount = 20) => {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const words = text.split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "...";
};

export default function ChapterCard({
  chapter,
  index,
  moveCard,
  onOpen,
  active,
  onDelete,
  selected,
  selectMode,
  onToggleSelect,
}) {
  const ref = useRef(null);

  // Drop zone - allows cards to be dropped here
  const [, drop] = useDrop({
    accept: DND_TYPE,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      if (dragIndex === index) return;
      moveCard(dragIndex, index);
      item.index = index;
    },
  });

  // Drag source - makes this card draggable
  const [{ isDragging }, drag] = useDrag({
    type: DND_TYPE,
    item: { id: chapter.id, index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${chapter.title}"?`)) {
      onDelete?.(chapter.id);
    }
  };

  // Get preview text - first 20 words from content
  const previewText = getFirstWords(chapter.content, 20);

  return (
    <div
      ref={ref}
      onClick={onOpen}
      className={[
        "group relative cursor-pointer",
        "w-full aspect-[8.5/11]", // Standard paper ratio
        "rounded-sm shadow-md hover:shadow-xl",
        "transition-all duration-200",
        "bg-white",
        active ? "ring-2 ring-[#D4AF37] shadow-xl" : "",
        selected ? "ring-2 ring-blue-400" : "",
        isDragging ? "opacity-50 scale-95" : "hover:scale-[1.02]",
      ].join(" ")}
    >
      {/* Paper texture overlay */}
      <div className="absolute inset-0 rounded-sm bg-gradient-to-br from-white via-[#fffef8] to-[#faf9f0] opacity-60 pointer-events-none" />
      
      {/* Drag handle - top center */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>

      {/* Delete Button - Top Right */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
        title="Delete chapter"
        type="button"
      >
        <Trash2 size={14} />
      </button>

      {/* Chapter number badge */}
      <div className="absolute top-3 left-3">
        <div className="px-2 py-1 rounded bg-[#f5e4ff] text-[10px] font-semibold text-[#5a3d7a] shadow-sm">
          Ch. {index + 1}
        </div>
      </div>

      {/* Main content area */}
      <div className="relative h-full p-6 pt-12 flex flex-col">
        {/* Chapter title */}
        <h3 className="text-sm font-bold text-[#2b143f] mb-3 line-clamp-2 font-serif">
          {chapter.title || `Chapter ${index + 1}`}
        </h3>

        {/* Decorative line */}
        <div className="h-px bg-gradient-to-r from-[#D4AF37]/50 via-[#D4AF37] to-[#D4AF37]/50 mb-3" />

        {/* Preview text - first 20 words */}
        <div className="flex-1 overflow-hidden">
          <p className="text-[11px] leading-relaxed text-gray-700 font-serif line-clamp-6">
            {previewText || "This chapter is empty. Click to start writing."}
          </p>
        </div>

        {/* Footer info */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          <span className="font-medium">
            {(chapter.wordCount || 0).toLocaleString()} words
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-gray-50 text-gray-600">
            {chapter.status || "draft"}
          </span>
        </div>
      </div>

      {/* Paper edge shadow effect */}
      <div className="absolute inset-0 rounded-sm shadow-inner pointer-events-none opacity-20" />
    </div>
  );
}

