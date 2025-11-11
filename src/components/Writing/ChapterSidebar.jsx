// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation with multi-select and drag support

import React from "react";
import { useDrag } from "react-dnd";

function ChapterItem({
  chapter,
  index,
  isSelected,
  isActive,
  selectMode,
  selectedIds,          // Set<string>
  onRowClick,           // (event) => void
}) {
  // Build drag payload: all selected if any, else just me
  const selectedArray = (selectedIds && selectedIds.size > 0)
    ? Array.from(selectedIds)
    : [chapter.id];

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "chapter",
      item: { ids: selectedArray },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [chapter.id, selectedIds] // re-evaluate when selection changes
  );

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
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
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
        </div>
        {isActive && <div className="text-xs">▶</div>}
      </div>
    </button>
  );
}

export default function ChapterSidebar({
  chapters,
  selectedId,
  onSelectChapter,
  onAddChapter,
  onDeleteMultiple,      // optional: bulk delete callback
  // Lifted selection from ComposePage:
  selectMode,            // boolean
  selectedIds,           // Set<string>
  onToggleSelect,        // (id, { additive?: boolean }) => void
  onRangeSelect,         // (index) => void  (ComposePage will map index to id range)
  lastClickedIndexRef,   // React.useRef<number|null>
}) {
  const handleRowClick = (chapterId, index) => (event) => {
    if (!selectMode) {
      // Normal navigation
      onSelectChapter?.(chapterId);
      return;
    }

    const isShift = event.shiftKey;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isShift) {
      // Range select using lifted helper
      onRangeSelect?.(index);
    } else {
      // Toggle single with optional additive
      onToggleSelect?.(chapterId, { additive: isCtrlOrCmd });
      lastClickedIndexRef.current = index;
    }
  };

  return (
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4"
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

      {/* Selection toolbar (optional, complements top toolbar) */}
      {selectMode && selectedIds?.size > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2">
            {onDeleteMultiple && (
              <button
                onClick={() => onDeleteMultiple(Array.from(selectedIds))}
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
        {chapters.map((ch, idx) => (
          <ChapterItem
            key={ch.id}
            chapter={ch}
            index={idx}
            isSelected={selectedIds?.has(ch.id)}
            isActive={ch.id === selectedId}
            selectMode={!!selectMode}
            selectedIds={selectedIds}
            onRowClick={handleRowClick(ch.id, idx)}
          />
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">No chapters yet</div>
      )}

      {selectMode && (
