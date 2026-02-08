// src/components/Writing/PoetrySidebar.jsx
import React from "react";

export default function PoetrySidebar({ chapters = [], hasAnyChapters, onRefresh }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">StoryLab • Poetry</div>
      <div className="text-xs text-slate-500 mt-1">
        Imagery, sound, line breaks, form, rhythm, compression.
      </div>

      <div className="mt-4 space-y-2">
        <button
          type="button"
          onClick={onRefresh}
          className="w-full text-left text-sm px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50"
          disabled={!hasAnyChapters}
        >
          Refresh StoryLab
        </button>

        <div className="text-xs text-slate-500 mt-2">
          Poems: <span className="font-medium">{chapters.length}</span>
        </div>
      </div>
    </aside>
  );
}
