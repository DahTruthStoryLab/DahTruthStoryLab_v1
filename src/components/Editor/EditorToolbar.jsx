// src/components/Editor/EditorToolbar.jsx
import React, { useRef } from "react";
import {
  Save,
  Wand2,
  Upload,
  Download,
  Trash2,
} from "lucide-react";

export default function EditorToolbar({
  onAI,
  onSave,
  onImport,
  onExport,
  onDelete,
  aiBusy,
  saveStatus = "idle",
}) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (!onImport) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    if (!onImport) return;
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
  };

  const handleAIRewrite = () => {
    if (!onAI || aiBusy) return;
    // You can change "rewrite" to another mode if needed
    onAI("rewrite");
  };

  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";

  return (
    <div className="flex items-center gap-2 text-xs text-slate-800">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.md"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Save button */}
      <button
        onClick={onSave}
        disabled={isSaving}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
        title="Save current chapter"
      >
        {isSaving && (
          <span className="inline-block w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        )}
        {!isSaving && <Save className="w-3.5 h-3.5" />}
        <span>
          {isSaving
            ? "Saving..."
            : isSaved
            ? "Saved"
            : "Save"}
        </span>
      </button>

      {/* AI Rewrite */}
      <button
        onClick={handleAIRewrite}
        disabled={aiBusy}
        className="inline-flex items-center gap-1 rounded-md border border-[#D4AF37]/40 bg-[#1a237e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d47a1] disabled:opacity-60 disabled:cursor-not-allowed"
        title="Use AI to rewrite or polish this chapter"
      >
        <Wand2 className="w-3.5 h-3.5" />
        <span>{aiBusy ? "AI working..." : "AI Rewrite"}</span>
      </button>

      {/* Import */}
      <button
        onClick={handleImportClick}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        title="Import a Word or text document"
      >
        <Upload className="w-3.5 h-3.5" />
        <span>Import</span>
      </button>

      {/* Export */}
      <button
        onClick={onExport}
        className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
        title="Export current chapter as HTML"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Export</span>
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
        title="Delete current chapter"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Delete</span>
      </button>
    </div>
  );
}
