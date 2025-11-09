// src/components/Writing/ChapterCard.jsx
// Individual chapter card with drag-and-drop, glassmorphic design

import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Trash2 } from "lucide-react";

const DND_TYPE = "CHAPTER_CARD";

// Extract first N words from HTML
const getFirstWords = (html = "", wordCount = 20) => {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  
  if (!text) return "—";
  
  // Split into words and take first N words
  const words = text.split(/\s+/);
  
  if (words.length <= wordCount) {
    return text;
  }
  
  return words.slice(0, wordCount).join(" ") + "...";
};

export default function ChapterCard({ chapter, index, moveCard, onOpen, active, onDelete }) {
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

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${chapter.title}"?`)) {
      onDelete?.(chapter.id);
    }
  };

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
      {/* Delete Button - Top Right */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10"
        title="Delete chapter"
      >
        <Trash2 size={14} />
      </button>

      {/* Progress bar decoration */}
      <div className="h-2 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 mb-3" />
      
      {/* Title and Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold line-clamp-2 pr-6">{chapter.title}</div>
        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          {chapter.status || "draft"}
        </span>
      </div>

      {/* Preview Text - First 20 Words */}
      <p className="mt-2 text-[12px] text-slate-600 line-clamp-3">
        {getFirstWords(chapter.content, 20)}
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
