// src/components/Editor/EditorToolbar.jsx
// Toolbar with all AI operations, Import, Export, Save buttons
// Preserves all brand styling and functionality

import React from "react";
import { Bot, Save, RotateCcw, RotateCw, Download, Upload } from "lucide-react";

export default function EditorToolbar({ onAI, onSave, aiBusy, compact = false }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Undo/Redo - only show if not compact */}
      {!compact && (
        <>
          <button
            onClick={() => {
              // Undo will be handled by EditorPane
            }}
            className="rounded-lg border px-2 py-1.5 bg-white hover:bg-slate-50"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => {
              // Redo will be handled by EditorPane
            }}
            className="rounded-lg border px-2 py-1.5 bg-white hover:bg-slate-50"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RotateCw size={16} />
          </button>
        </>
      )}

      {/* Import/Export - will be implemented later */}
      <button
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
        title="Import Word Document"
        disabled
      >
        <Upload size={16} /> Import
      </button>

      <button
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
        title="Export to Word"
        disabled
      >
        <Download size={16} /> Export
      </button>

      {/* AI Actions */}
      <button
        onClick={() => onAI("proofread")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Proofread"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : "Proofread"}
      </button>

      <button
        onClick={() => onAI("clarify")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Clarify"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : "Clarify"}
      </button>

      <button
        onClick={() => onAI("rewrite")}
        className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
        disabled={aiBusy}
        title="AI Rewrite"
      >
        <Bot size={16} />
        {aiBusy ? "AI…" : "Rewrite"}
      </button>

      {/* Extra AI buttons - only show if not compact */}
      {!compact && (
        <>
          <button
            onClick={() => onAI("grammar")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Grammar Check"
          >
            🔤 Grammar
          </button>

          <button
            onClick={() => onAI("style")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Style Improvement"
          >
            🪶 Style
          </button>

          <button
            onClick={() => onAI("readability")}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
            disabled={aiBusy}
            title="AI Readability Check"
          >
            📊 Readability
          </button>
        </>
      )}

      {/* Save Button (Gold) */}
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-white hover:opacity-90"
        style={{ backgroundColor: "#D4AF37" }}
        title="Save Chapter (Ctrl+S)"
      >
        <Save size={16} /> Save
      </button>
    </div>
  );
}

