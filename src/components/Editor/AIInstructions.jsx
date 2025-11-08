// src/components/Editor/AIInstructions.jsx
// AI Instructions box - user-editable prompts with smart generation

import React, { useState } from "react";

export default function AIInstructions({
  instructions,
  setInstructions,
  chapterTitle,
  onGeneratePrompt,
  aiBusy,
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4"
      style={{
        boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">AI Instructions</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs px-2 py-1 rounded border hover:bg-slate-50"
          title={isEditing ? "Done editing" : "Edit instructions"}
        >
          {isEditing ? "✓ Done" : "✏️ Edit"}
        </button>
      </div>

      {/* Instructions Textarea */}
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Enter AI instructions for this project..."
            className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            rows={5}
          />
        ) : (
          <div className="px-3 py-2 text-sm border rounded-lg bg-slate-50 min-h-[80px] whitespace-pre-wrap">
            {instructions || "No instructions set"}
          </div>
        )}
      </div>

      {/* Generate Prompt Button */}
      <button
        onClick={onGeneratePrompt}
        disabled={aiBusy || !chapterTitle}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm bg-white hover:bg-slate-50 disabled:opacity-60"
        title="Generate AI prompt for current chapter"
      >
        ✨ {aiBusy ? "Generating..." : "Generate Prompt"}
      </button>

      {/* Helper Text */}
      <p className="mt-2 text-xs text-slate-500">
        {chapterTitle ? (
          <>For: <span className="font-medium">{chapterTitle}</span></>
        ) : (
          "Select a chapter to generate prompt"
        )}
      </p>
    </div>
  );
}
