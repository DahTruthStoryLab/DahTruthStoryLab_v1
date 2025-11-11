// src/components/Writing/ChapterCard.jsx
// A single chapter card that supports lifted multi-select, checkbox, and multi-drag

import React from "react";
import { useDrag } from "react-dnd";

export default function ChapterCard({
  chapter,
  index,
  isActive,
  isSelected,
  selectMode,
  selectedIds,           // Set<string>
  onOpen,                // () => void
  onSelectToggle,        // (additive:boolean) => void
  onRange,               // () => void
  // optional existing callbacks
  onMoveChapter,
  onDeleteChapter,
}) {
  // Drag payload: all selected if any, else just this card
  const selectedArray =
    selectedIds && selectedIds.size > 0 ? Array.from(selectedIds) : [chapter.id];

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "chapter",
      item: { ids: selectedArray },
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [chapter.id, selectedIds]
  );

  return (
    <div
      ref={drag}
      onClick={(e) => {
        if (!selectMode) {
          onOpen?.();
          return;
        }
        if (e.shiftKey) {
          onRange?.();
          return;
        }
        const additive = e.ctrlKey || e.metaKey;
        onSelectToggle?.(additive);
      }}
      className={[
        "relative rounded-xl border p-4 bg-white transition cursor-pointer",
        isActive ? "border-slate-900/20 shadow" : "border-slate-200 hover:border-slate-300",
        isSelected ? "ring-2 ring-blue-300" : "",
        isDragging ? "opacity-60" : "",
      ].join(" ")}
      title={chapter.title}
    >
      {/* Checkbox appears only in select mode */}
      {selectMode && (
        <label
          className="absolute top-2 left-2 inline-flex items-center gap-1 text-xs bg-white/90 rounded px-1.5 py-0.5 border border-slate-200"
          onClick={(e) => e.stopPropagation()} // don't let card click fire
        >
          <input
            type="checkbox"
            className="mr-1 accent-blue-600"
            checked={!!isSelected}
            onChange={() => onSelectToggle?.(true /* additive */)}
          />
          <span className="sr-only">
            {isSelected ? "Deselect" : "Select"} {chapter.title}
          </span>
          {/* Count badge if multi-selected */}
          {isSelected && selectedIds?.size > 1 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
              {selectedIds.size}
            </span>
          )}
        </label>
      )}

      {/* Active indicator */}
      {isActive && (
        <span className="absolute top-2 right-2 text-[11px] text-slate-500">Active</span>
      )}

      <div className="text-sm font-semibold truncate pr-8">{chapter.title}</div>
      <div className="mt-1 text-xs text-slate-500">
        {(chapter.wordCount || 0).toLocaleString()} words
      </div>

      {chapter.preview && (
        <div className="mt-2 text-[12px] text-slate-600 line-clamp-3">{chapter.preview}</div>
      )}
    </div>
  );
}
