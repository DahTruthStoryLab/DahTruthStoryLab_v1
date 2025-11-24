// src/components/Writing/ChapterCard.jsx
// Individual chapter card with drag-and-drop, writerly design
import React, { useRef } from "react";
import { useDrag, useDrop } from "react-dnd";
import { Trash2, PenSquare } from "lucide-react";

const DND_TYPE = "CHAPTER_CARD";

// Extract first N words from HTML
const getFirstWords = (html = "", wordCount = 20) => {
  // Strip HTML tags
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "—";
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

  const previewText =
    chapter.summary && chapter.summary.trim().length > 0
      ? chapter.summary.trim()
      : getFirstWords(chapter.content, 24);

  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      className={[
        "group relative w-full text-left rounded-xl border border-transparent",
        "bg-transparent px-1 py-1.5",
        "transition-all duration-150",
        active ? "bg-[#f8f1ff] border-[#e1cffe]" : "hover:bg-[#faf3ff]",
        isDragging ? "opacity-50" : "",
      ].join(" ")}
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={handleDelete}
        className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 hover:bg-red-50 text-[#9a7bc0] hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
        title="Delete chapter"
        type="button"
      >
        <Trash2 size={12} />
      </button>

      {/* Progress bar / accent line */}
      <div className="h-1.5 rounded-full bg-gradient-to-r from-[#f5e4ff] via-[#D4AF37]/70 to-[#f5e4ff] mb-2 opacity-80" />

      {/* Main content */}
      <div className="flex items-start gap-2">
        {/* Icon bubble */}
        <div className="mt-0.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-[#f5e4ff] flex items-center justify-center shadow-sm">
            <PenSquare className="w-3.5 h-3.5 text-[#2b143f]" />
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          {/* Status pill */}
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f8f1ff] text-[10px] font-medium text-[#5a3d7a] border border-[#e6d3ff]">
              {chapter.status || "draft"}
            </span>
          </div>

          {/* Preview text */}
          <p className="text-[12px] leading-snug text-[#2b143f] line-clamp-3">
            {previewText || "No outline or text yet. Start writing this chapter."}
          </p>

          {/* Meta row */}
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#5a4070]">
            <span>{(chapter.wordCount || 0).toLocaleString()} words</span>
            <span>{chapter.lastEdited || "Last edited —"}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

