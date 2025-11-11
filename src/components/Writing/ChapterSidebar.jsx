// src/components/Writing/ChapterSidebar.jsx
// Sidebar list of chapters for navigation with multi-select and drag support
import React from "react";
import { useDrag } from "react-dnd";

function ChapterItem({ chapter, isSelected, isActive, onSelect, selectedCount }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "chapter",
    item: { ids: isSelected ? "multi" : [chapter.id] }, // marker for multi-drag
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <button
      ref={drag}
      onClick={(e) => onSelect(chapter.id, e)}
      className={[
        "w-full text-left px-3 py-2 rounded-lg text-sm transition",
        isActive
          ? "bg-slate-100 font-medium"
          : isSelected
          ? "bg-blue-50 border-2 border-blue-300"
          : "hover:bg-slate-50",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="truncate">
            {isSelected && selectedCount > 1 && (
              <span className="inline-block w-5 h-5 rounded bg-blue-500 text-white text-xs leading-5 text-center mr-2">
                {selectedCount}
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
  onDeleteMultiple, // NEW: callback for multi-delete
}) {
  const [selectedSet, setSelectedSet] = React.useState(new Set());
  const [selectMode, setSelectMode] = React.useState(false);
  const lastClickedRef = React.useRef(null);

  // Handle chapter selection with keyboard modifiers
  const handleSelect = (id, event) => {
    if (!selectMode) {
      // Normal mode: just navigate
      onSelectChapter(id);
      return;
    }

    // Select mode: multi-select logic
    const isShift = event.shiftKey;
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    if (isShift && lastClickedRef.current) {
      // Shift-click: select range
      const startIdx = chapters.findIndex((ch) => ch.id === lastClickedRef.current);
      const endIdx = chapters.findIndex((ch) => ch.id === id);
      const [from, to] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
      
      setSelectedSet((prev) => {
        const next = new Set(prev);
        for (let i = from; i <= to; i++) {
          next.add(chapters[i].id);
        }
        return next;
      });
    } else if (isCtrlOrCmd) {
      // Ctrl/Cmd-click: toggle individual
      setSelectedSet((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    } else {
      // Plain click: select only this one
      setSelectedSet(new Set([id]));
    }

    lastClickedRef.current = id;
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      // Exiting select mode: clear selection
      setSelectedSet(new Set());
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedSet(new Set());
  };

  // Delete selected chapters
  const handleDeleteSelected = () => {
    if (selectedSet.size === 0) return;
    if (!window.confirm(`Delete ${selectedSet.size} chapter(s)? This cannot be undone.`)) return;
    
    if (onDeleteMultiple) {
      onDeleteMultiple(Array.from(selectedSet));
    }
    setSelectedSet(new Set());
  };

  return (
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4"
      style={{
        boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Chapters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSelectMode}
            className={[
              "text-xs px-2 py-1 rounded border transition",
              selectMode ? "bg-blue-100 border-blue-300" : "hover:bg-slate-50",
            ].join(" ")}
            title="Toggle Select Mode"
          >
            {selectMode ? "✓ Select" : "Select"}
          </button>
          <button
            onClick={onAddChapter}
            className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
            title="Add New Chapter"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Selection toolbar */}
      {selectMode && selectedSet.size > 0 && (
        <div className="mb-3 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-xs font-medium text-blue-900">
            {selectedSet.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
              title="Delete Selected"
            >
              🗑️ Delete
            </button>
            <button
              onClick={clearSelection}
              className="text-xs px-2 py-1 rounded border hover:bg-white"
              title="Clear Selection"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {chapters.map((ch) => (
          <ChapterItem
            key={ch.id}
            chapter={ch}
            isSelected={selectedSet.has(ch.id)}
            isActive={ch.id === selectedId}
            onSelect={handleSelect}
            selectedCount={selectedSet.size}
          />
        ))}
      </div>

      {chapters.length === 0 && (
        <div className="text-center py-6 text-sm text-slate-500">
          No chapters yet
        </div>
      )}

      {selectMode && (
        <div className="mt-3 pt-3 border-t text-xs text-slate-500">
          💡 Tip: Click to select, Shift+Click for range, Ctrl/Cmd+Click to toggle
        </div>
      )}
    </div>
  );
}
