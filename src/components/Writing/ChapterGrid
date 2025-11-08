// src/components/Chapters/ChapterGrid.jsx
// 4-column grid view of all chapters with drag-drop reordering

import React from "react";
import ChapterCard from "./ChapterCard";

export default function ChapterGrid({
  chapters,
  selectedId,
  onSelectChapter,
  onAddChapter,
  onMoveChapter,
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-semibold">Chapters</h1>
        <button
          onClick={onAddChapter}
          className="text-sm px-3 py-1.5 rounded-md border bg-white hover:bg-slate-50"
        >
          + Add Chapter
        </button>
      </div>

      {/* 4-column grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {chapters.map((chapter, idx) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            index={idx}
            moveCard={onMoveChapter}
            active={chapter.id === selectedId}
            onOpen={() => onSelectChapter(chapter.id)}
          />
        ))}
      </div>

      {/* Empty state */}
      {chapters.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p className="text-lg mb-2">No chapters yet</p>
          <p className="text-sm">Click "+ Add Chapter" to get started</p>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import ChapterCard from './ChapterCard';

const ChapterGrid = ({ chapters, onAddChapter, onSelectChapter, onUpdateChapter, onDeleteChapter }) => {
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (e, chapterId) => {
    setDraggedId(chapterId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetChapterId) => {
    e.preventDefault();
    
    if (draggedId === targetChapterId) {
      setDraggedId(null);
      return;
    }

    const draggedIndex = chapters.findIndex(ch => ch.id === draggedId);
    const targetIndex = chapters.findIndex(ch => ch.id === targetChapterId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedId(null);
      return;
    }

    const newChapters = [...chapters];
    const [draggedChapter] = newChapters.splice(draggedIndex, 1);
    newChapters.splice(targetIndex, 0, draggedChapter);

    // Update order numbers
    const reorderedChapters = newChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1
    }));

    // This will trigger the parent's handleReorderChapters
    onUpdateChapter(draggedId, { order: targetIndex + 1 });
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <div className="p-6">
      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            draggable
            onDragStart={(e) => handleDragStart(e, chapter.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, chapter.id)}
            onDragEnd={handleDragEnd}
          >
            <ChapterCard
              chapter={chapter}
              onSelect={onSelectChapter}
              onUpdate={onUpdateChapter}
              onDelete={onDeleteChapter}
              isDragging={draggedId === chapter.id}
            />
          </div>
        ))}

        {/* Add Chapter Card */}
        <button
          onClick={onAddChapter}
          className="group relative bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-2xl p-6 border-2 border-dashed border-white/20 hover:border-[#D4AF37]/50 transition-all duration-300 hover:scale-[1.02] min-h-[300px] flex flex-col items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1a237e]/40 to-[#0d47a1]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform border border-[#D4AF37]/30">
            <Plus className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <span className="text-lg font-semibold text-white mb-1">Add New Chapter</span>
          <span className="text-sm text-white/60">Start writing your next chapter</span>
        </button>
      </div>

      {/* Grid Stats Footer */}
      {chapters.length > 0 && (
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">{chapters.length}</div>
              <div className="text-sm text-white/60">Total Chapters</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#D4AF37] mb-1">
                {chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-white/60">Total Words</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">
                {chapters.filter(ch => ch.status === 'complete').length}
              </div>
              <div className="text-sm text-white/60">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#B4A7C6] mb-1">
                {chapters.filter(ch => ch.status === 'in-progress').length}
              </div>
              <div className="text-sm text-white/60">In Progress</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterGrid;

