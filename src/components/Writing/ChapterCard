// src/components/Chapters/ChapterCard.jsx
// Individual chapter card with drag-and-drop, glassmorphic design

import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { getPreviewText } from "../../utils/textFormatting";

const DND_TYPE = "CHAPTER_CARD";

export default function ChapterCard({ chapter, index, moveCard, onOpen, active }) {
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

  // Combine drag and drop refs
  drag(drop(ref));

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={[
        "group relative rounded-2xl border p-4 text-left transition bg-white",
        active ? "ring-2 ring-primary/60" : "hover:shadow-md",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Progress bar decoration */}
      <div className="h-2 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 mb-3" />
      
      {/* Title and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold line-clamp-2">{chapter.title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          {chapter.status || "draft"}
        </span>
      </div>

      {/* Preview Text */}
      <p className="mt-2 text-[12px] text-slate-600 line-clamp-3">
        {getPreviewText(chapter.content, 180) || "—"}
      </p>

      {/* Word Count and Last Edited */}
      <div className="mt-3 text-[12px] text-slate-500 flex items-center justify-between">
        <span>{(chapter.wordCount || 0).toLocaleString()} words</span>
        <span>{chapter.lastEdited || "—"}</span>
      </div>

      {/* Hover ring effect */}
      <div className="absolute inset-0 rounded-2xl ring-0 ring-primary/0 group-hover:ring-2 group-hover:ring-primary/10 pointer-events-none" />
    </button>
  );
}

