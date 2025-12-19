// src/components/Editor/EditorToolbar.jsx
import React from "react";
import { Upload, Save, Trash2, Sparkles } from "lucide-react";

export default function EditorToolbar({
  onAI,
  onSave,
  onImport,
  onExport,
  onDelete,
  aiBusy,
  saveStatus,
  activeAiTab,
  setActiveAiTab,
  onToggleAssistant,
  assistantOpen,
}) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && typeof onImport === "function") {
      onImport(file);
    }
    // reset so selecting same file again still fires
    e.target.value = "";
  };

  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";

  const aiButtons = [
    { id: "grammar", label: "Grammar", title: "Check grammar and punctuation" },
    { id: "clarify", label: "Clarify", title: "Tighten and clarify wording" },
    { id: "readability", label: "Readability", title: "Improve flow and readability" },
    { id: "rewrite", label: "Rewrite", title: "Stronger revision of the selection" },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* AI mode buttons */}
      <div className="flex items-center gap-1">
        {aiButtons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => onAI && onAI(btn.id)}
            disabled={aiBusy}
            title={btn.title}
            className={[
              "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px]",
              activeAiTab === btn.id
                ? "bg-indigo-50 border-indigo-300 text-indigo-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
              aiBusy ? "opacity-60 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {btn.id === "grammar" && (
              <Sparkles className="w-3 h-3 text-amber-500" />
            )}
            <span>{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Save button + status */}
      <button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        className={[
          "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px]",
          "bg-emerald-600 text-white hover:bg-emerald-700",
          isSaving ? "opacity-60 cursor-not-allowed" : "",
        ].join(" ")}
        title="Save chapter"
      >
        <Save className="w-3 h-3" />
        <span>{isSaving ? "Saving…" : "Save"}</span>
      </button>
      {isSaved && <span className="text-[11px] text-emerald-700">Saved</span>}

      {/* Import (Word / Text) */}
      <label
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] bg-white hover:bg-slate-50 cursor-pointer"
        title="Import .docx, .doc, .txt, or .md"
      >
        <Upload className="w-3 h-3" />
        <span>Import</span>
        <input
          type="file"
          accept=".doc,.docx,.txt,.md"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* Export current chapter as HTML */}
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] bg-white hover:bg-slate-50"
        title="Download this chapter as HTML"
      >
        <span>Export</span>
      </button>

      {/* Delete current chapter */}
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px] bg-white text-red-700 border-red-200 hover:bg-red-50"
        title="Delete current chapter"
      >
        <Trash2 className="w-3 h-3" />
        <span>Delete</span>
      </button>

      {/* Optional: AI Assistant toggle (right-hand chat) */}
      {typeof onToggleAssistant === "function" && (
        <button
          type="button"
          onClick={onToggleAssistant}
          className={[
            "ml-2 inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[12px]",
            assistantOpen
              ? "bg-indigo-600 text-white border-indigo-700"
              : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50",
          ].join(" ")}
          title={assistantOpen ? "Hide AI Assistant chat" : "Open AI Assistant chat panel"}
        >
          <Sparkles className="w-3 h-3" />
          <span>{assistantOpen ? "Hide Assistant" : "AI Assistant"}</span>
        </button>
      )}
    </div>
  );
}
