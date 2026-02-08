// src/components/Writing/NonFictionSidebar.jsx
import React from "react";

export default function NonFictionSidebar({ chapters = [], hasAnyChapters, onRefresh }) {
  return (
    <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">StoryLab • Nonfiction</div>
      <div className="text-xs text-slate-500 mt-1">
        Thesis, structure, argument, evidence, clarity, transitions.
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
          Sections: <span className="font-medium">{chapters.length}</span>
        </div>
      </div>
    </aside>
  );
}
