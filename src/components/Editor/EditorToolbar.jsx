// src/components/Editor/EditorToolbar.jsx
import React, { useRef } from "react";

export default function EditorToolbar({
  onAI,
  onSave,
  onImport,
  onExport,
  onDelete,
  aiBusy = false,
  saveStatus = "idle", // "idle" | "saving" | "saved"
  activeAiTab = "proofread",
  setActiveAiTab, // optional; ComposePage passes this in
  onToggleAssistant, // optional; toggles right-hand AI chat panel
  assistantOpen = false, // optional; whether the chat panel is open
}) {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file, { splitByHeadings: true });
    }
  };

  const handleAiClick = (mode) => {
    // remember active tab (if the parent provided the setter)
    if (typeof setActiveAiTab === "function") {
      setActiveAiTab(mode);
    }
    if (onAI) {
      onAI(mode);
    }
  };

  const renderSaveLabel = () => {
    if (saveStatus === "saving") return "Saving...";
    if (saveStatus === "saved") return "Saved ✓";
    return "Save";
  };

  const renderSaveClass = () => {
    if (saveStatus === "saving") return "bg-slate-200 cursor-wait";
    if (saveStatus === "saved")
      return "bg-emerald-100 text-emerald-800";
    return "bg-slate-900 text-white hover:bg-slate-800";
  };

  const aiButtonBase =
    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors";
  const aiInactive =
    "bg-white text-slate-700 border-slate-200 hover:bg-slate-50";
  const aiActive =
    "bg-slate-900 text-white border-slate-900 shadow-sm";

  const aiDisabled = aiBusy ? "opacity-60 cursor-not-allowed" : "";

  return (
    <div className="flex items-center gap-3">
      {/* AI Actions (modes) */}
      <div className="flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-1 py-1">
        <button
          type="button"
          disabled={aiBusy}
          onClick={() => handleAiClick("proofread")}
          className={[
            aiButtonBase,
            activeAiTab === "proofread" ? aiActive : aiInactive,
            aiDisabled,
          ].join(" ")}
          title="Check grammar and fix basic errors"
        >
          {aiBusy && activeAiTab === "proofread"
            ? "Working…"
            : "Proofread"}
        </button>

        <button
          type="button"
          disabled={aiBusy}
          onClick={() => handleAiClick("clarify")}
          className={[
            aiButtonBase,
            activeAiTab === "clarify" ? aiActive : aiInactive,
            aiDisabled,
          ].join(" ")}
          title="Improve clarity and flow"
        >
          {aiBusy && activeAiTab === "clarify"
            ? "Working…"
            : "Clarify"}
        </button>

        <button
          type="button"
          disabled={aiBusy}
          onClick={() => handleAiClick("readability")}
          className={[
            aiButtonBase,
            activeAiTab === "readability" ? aiActive : aiInactive,
            aiDisabled,
          ].join(" ")}
          title="Enhance readability and pacing"
        >
          {aiBusy && activeAiTab === "readability"
            ? "Working…"
            : "Readability"}
        </button>

        <button
          type="button"
          disabled={aiBusy}
          onClick={() => handleAiClick("rewrite")}
          className={[
            aiButtonBase,
            activeAiTab === "rewrite" ? aiActive : aiInactive,
            aiDisabled,
          ].join(" ")}
          title="Rewrite or polish the selected section"
        >
          {aiBusy && activeAiTab === "rewrite"
            ? "Working…"
            : "Rewrite"}
        </button>
      </div>

      {/* Optional: AI Assistant toggle (right-hand chat) */}
      {typeof onToggleAssistant === "function" && (
        <button
          type="button"
          onClick={onToggleAssistant}
          disabled={aiBusy}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
            assistantOpen
              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            aiDisabled,
          ].join(" ")}
          title={
            assistantOpen
              ? "Hide AI chat assistant"
              : "Show AI chat assistant"
          }
        >
          {assistantOpen ? "Assistant Open" : "AI Assistant"}
        </button>
      )}

      {/* Import / Export */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleFileClick}
          className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs hover:bg-slate-50"
          title="Import manuscript (.docx, .txt, .md)"
        >
          Import
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".doc,.docx,.txt,.md"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={onExport}
          className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs hover:bg-slate-50"
          title="Export current chapter as HTML"
        >
          Export
        </button>
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={onSave}
        disabled={saveStatus === "saving"}
        className={[
          "ml-2 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm",
          renderSaveClass(),
        ].join(" ")}
        title="Save project"
      >
        {renderSaveLabel()}
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        className="px-3 py-1.5 rounded-full text-xs border border-red-200 text-red-700 bg-red-50 hover:bg-red-100"
        title="Delete current chapter"
      >
        Delete
      </button>
    </div>
  );
}
