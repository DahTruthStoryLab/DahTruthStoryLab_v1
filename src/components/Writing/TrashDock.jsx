import React from "react";
import { useDrop } from "react-dnd";

/**
 * Drag payload contract:
 *  { type: "chapter" | "section", ids: string[] }
 *
 * Example from ChapterSidebar useDrag:
 *  item: { type: "chapter", ids: Array.from(selectedSet.size ? selectedSet : new Set([chapter.id])) }
 */
export default function TrashDock({
  onDelete,
  accept = ["chapter", "section"], // extensible
  confirm = true,
}) {
  const [{ isOver, canDrop, count }, drop] = useDrop(() => ({
    accept,
    drop: (item) => {
      const ids = Array.isArray(item?.ids) ? item.ids : [];
      if (!ids.length) return;
      if (!confirm || window.confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) {
        onDelete(ids);
      }
    },
    collect: (monitor) => {
      const item = monitor.getItem();
      const ids = Array.isArray(item?.ids) ? item.ids : [];
      return {
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
        count: ids.length || 0,
      };
    },
  }));

  return (
    <div
      ref={drop}
      role="button"
      aria-label="Trash. Drag items here to delete."
      tabIndex={0}
      onKeyDown={(e) => {
        // Allow keyboard delete when focused and user presses Delete/Backspace
        if ((e.key === "Delete" || e.key === "Backspace") && count > 0 && canDrop) {
          onDelete(Array.from(count)); // noop unless you wire keyboard selection globally
        }
      }}
      className={[
        "fixed right-6 bottom-6 z-50 rounded-2xl border shadow-2xl",
        "w-24 h-24 flex flex-col items-center justify-center",
        "bg-white/90 backdrop-blur-sm transition-all duration-200",
        isOver && canDrop ? "bg-red-100 border-red-400 scale-110" : "border-slate-200",
      ].join(" ")}
      title="Drag items here to delete"
    >
      <div className="relative">
        <div className="text-3xl leading-none mb-1">🗑️</div>
        {/* Count badge while dragging */}
        {count > 0 && (
          <span className="absolute -top-2 -right-3 min-w-6 h-6 px-1 rounded-full bg-red-600 text-white text-xs font-semibold flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
      <div className="text-xs font-medium text-slate-700">
        {isOver && canDrop ? "Drop to delete" : "Trash"}
      </div>
    </div>
  );
}
