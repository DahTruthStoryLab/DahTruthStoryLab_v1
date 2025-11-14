// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation with multi-select, drag, and rename support

import React, { useState } from "react";
import { useDrag } from "react-dnd";

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

  return (
    <button
      ref={drag}
      onClick={onRowClick}
      className={[
        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
        isActive
          ? "bg-slate-100 font-medium"
          : isSelected
          ? "bg-blue-50 border-2 border-blue-300"
          : "hover:bg-slate-50",
        isDragging ? "opacity-50" : "",
        "cursor-grab active:cursor-grabbing",
      ].join(" ")}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              className="w-full text-xs border border-blue-300 rounded px-1 py-0.5 bg-white"
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
              <div className="truncate">
                {isSelected && selectedIds?.size > 1 && (
                  <span className="inline-block w-5 h-5 rounded bg-blue-500 text-white text-xs leading-5 text-center mr-2">
                    {selectedIds.size}
                  </span>
                )}
                {chapter.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {(chapter.wordCount || 0).toLocaleString()} words
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          {isActive && <div className="text-xs">▶</div>}

          {!isEditing && (
            <button
              type="button"
              onClick={startEdit}
              className="text-[11px] text-blue-500 opacity-0 group-hover:opacity-100 hover:underline"
              onMouseDown={(e) => e.stopPropagation()}
            >
              ✏️
            </button>
          )}
        </div>
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
  onRenameChapter, // ✅ NEW PROP
}) {
  const safeChapters = Array.isArray(chapters)
    ? chapters.filter((ch) => ch && ch.id != null)
    : [];

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
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4 group"
      style={{ boxShadow: "0 8px 30px rgba(2,20,40,0.10)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Chapters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddChapter}
            className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
            title="Add New Chapter"
          >
            + Add
          </button>
        </div>
      </div>

      {selectMode && selectedIds?.size > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {onDeleteMultiple && (
              <button
                onClick={handleDeleteSelected}
                className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                title="Delete Selected"
              >
                🗑️ Delete
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
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
      </div>

      {safeChapters.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">
          No chapters yet
        </div>
      )}

      {selectMode && (
        <div className="mt-3 pt-3 border-t text-xs text-slate-500">
          💡 Tip: Click to select, Shift+Click for range, Ctrl/Cmd+Click to
          toggle
        </div>
      )}
    </div>
  );
}
