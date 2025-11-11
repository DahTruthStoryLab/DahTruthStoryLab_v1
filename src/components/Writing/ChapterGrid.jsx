// src/components/Writing/ChapterGrid.jsx
// Grid of chapter cards with lifted multi-select + drag-to-trash support

import React from "react";
import ChapterCard from "./ChapterCard";

export default function ChapterGrid({
  chapters,
  selectedId,
  onSelectChapter,       // (id) => void
  onAddChapter,          // () => void
  onMoveChapter,         // (fromIdx, toIdx) => void (optional; unchanged)
  onDeleteChapter,       // (id) => void (optional; unchanged)
  // Lifted selection from ComposePage:
  selectMode,            // boolean
  selectedIds,           // Set<string>
  onToggleSelect,        // (id, { additive?: boolean }) => void
  onRangeSelect,         // (index) => void
  lastClickedIndexRef,   // React.useRef<number|null>
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">Your Chapters</h3>
        <button
          onClick={onAddChapter}
          className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-slate-50"
          title="Add Chapter"
        >
          + Add Chapter
        </button>
      </div>

      {/* Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {/* New chapter tile */}
        <button
          onClick={onAddChapter}
          className="rounded-xl border-2 border-dashed p-4 bg-white text-left hover:bg-slate-50"
          title="Add Chapter"
        >
          <div className="text-sm font-medium">Create new chapter</div>
          <div className="text-xs text-slate-500">Start fresh from a blank page</div>
        </button>

        {chapters.map((ch, idx) => (
          <ChapterCard
            key={ch.id}
            chapter={ch}
            index={idx}
            isActive={ch.id === selectedId}
            isSelected={selectedIds?.has(ch.id)}
            selectMode={!!selectMode}
            selectedIds={selectedIds}
            onOpen={() => onSelectChapter?.(ch.id)}
            onSelectToggle={(additive) => {
              onToggleSelect?.(ch.id, { additive });
              if (lastClickedIndexRef) lastClickedIndexRef.current = idx;
            }}
            onRange={() => {
              onRangeSelect?.(idx);
              if (lastClickedIndexRef) lastClickedIndexRef.current = idx;
            }}
            // Keep existing hooks available
            onMoveChapter={onMoveChapter}
            onDeleteChapter={onDeleteChapter}
          />
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-10 text-sm text-slate-500">
          No chapters yet. Click “Add Chapter” to get started.
        </div>
      )}

      {selectMode && (
        <div className="mt-4 text-xs text-slate-600">
          💡 Tip: Click to select, Shift+Click for range, Ctrl/Cmd+Click to toggle. Drag selected
          cards to the Trash in the bottom-right to delete.
        </div>
      )}
    </div>
  );
}
