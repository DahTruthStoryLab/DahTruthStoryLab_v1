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

