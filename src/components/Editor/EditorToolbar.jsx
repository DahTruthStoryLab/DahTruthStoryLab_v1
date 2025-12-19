// src/components/Editor/EditorToolbar.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  Upload,
  Save,
  Trash2,
  Sparkles,
  FolderOpen,
  Download,
  Eye,
  Grid3X3,
  Edit3,
  FileText,
  CheckSquare,
  ChevronDown,
  MessageSquare,
  Wand2,
  BookCheck,
  RefreshCw,
} from "lucide-react";

/* =========================================================
   Small Dropdown Components (self-contained)
========================================================= */
function DropdownMenu({ label, icon: Icon, disabled = false, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) {
            console.log(`[Dropdown] ${label} clicked`);
            setOpen((v) => !v);
          }
        }}
        className={[
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
          "border border-slate-200 bg-white hover:bg-slate-50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          open ? "bg-slate-100 border-slate-300" : "",
        ].join(" ")}
      >
        {Icon ? <Icon size={16} className="text-slate-600" /> : null}
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={[
            "text-slate-400 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
          {React.Children.map(children, (child) =>
            child
              ? React.cloneElement(child, { closeMenu: () => setOpen(false) })
              : null
          )}
        </div>
      ) : null}
    </div>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  closeMenu,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled) return;
        if (typeof onClick === "function") onClick(e);
        if (typeof closeMenu === "function") closeMenu();
      }}
      className={[
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left",
        "hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed",
        active ? "bg-amber-50 text-amber-800" : "text-slate-700",
      ].join(" ")}
    >
      {Icon ? (
        <Icon
          size={16}
          className={active ? "text-amber-600" : "text-slate-500"}
        />
      ) : null}
      <span className="flex-1">{label}</span>
      {active ? <span className="text-amber-500">✓</span> : null}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

/* =========================================================
   MAIN TOOLBAR
========================================================= */
export default function EditorToolbar({
  // existing props
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

  // NEW: pass these from ComposePage to enable View switching
  onGoGrid, // () => setView("grid")
  onGoEditor, // () => { setView("editor"); setEditorViewMode("editor"); }
  onGoPages, // () => { setView("editor"); setEditorViewMode("pages"); }
  onToggleSelectMode, // () => toggleSelectMode()
  view, // "grid" | "editor"
  editorViewMode, // "editor" | "pages"
  selectMode, // boolean
}) {
  const isSaving = saveStatus === "saving";
  const isSaved = saveStatus === "saved";

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && typeof onImport === "function") onImport(file);
    e.target.value = "";
  };

  const canUseAI = typeof onAI === "function" && !aiBusy;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* FILE dropdown */}
      <DropdownMenu label="File" icon={FolderOpen}>
        <DropdownItem
          icon={FolderOpen}
          label="Import Manuscript"
          onClick={() => {
            // trigger hidden file input by clicking label input below
            const el = document.getElementById("dt-editor-toolbar-import");
            el?.click?.();
          }}
        />
        <DropdownItem
          icon={Download}
          label="Export Chapter"
          onClick={onExport}
          disabled={typeof onExport !== "function"}
        />
        <DropdownDivider />
        <DropdownItem
          icon={Save}
          label={isSaving ? "Saving..." : isSaved ? "Saved ✓" : "Save"}
          onClick={onSave}
          disabled={typeof onSave !== "function" || isSaving}
        />
        <DropdownDivider />
        <DropdownItem
          icon={Trash2}
          label="Delete Chapter"
          onClick={onDelete}
          disabled={typeof onDelete !== "function"}
        />
      </DropdownMenu>

      {/* Hidden import input (activated by menu item) */}
      <input
        id="dt-editor-toolbar-import"
        type="file"
        accept=".doc,.docx,.txt,.md"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* VIEW dropdown */}
      <DropdownMenu label="View" icon={Eye}>
        <DropdownItem
          icon={Grid3X3}
          label="Chapter Grid"
          onClick={onGoGrid}
          disabled={typeof onGoGrid !== "function"}
          active={view === "grid"}
        />
        <DropdownItem
          icon={Edit3}
          label="Editor"
          onClick={onGoEditor}
          disabled={typeof onGoEditor !== "function"}
          active={view === "editor" && editorViewMode === "editor"}
        />
        <DropdownItem
          icon={FileText}
          label="Page View (8.5 × 11)"
          onClick={onGoPages}
          disabled={typeof onGoPages !== "function"}
          active={view === "editor" && editorViewMode === "pages"}
        />
        <DropdownDivider />
        <DropdownItem
          icon={CheckSquare}
          label="Select Mode"
          onClick={onToggleSelectMode}
          disabled={typeof onToggleSelectMode !== "function"}
          active={!!selectMode}
        />
      </DropdownMenu>

      {/* AI TOOLS dropdown */}
      <DropdownMenu label="AI Tools" icon={Sparkles} disabled={!canUseAI}>
        <DropdownItem
          icon={BookCheck}
          label="Proofread"
          onClick={() => {
            setActiveAiTab?.("proofread");
            onAI?.("proofread");
          }}
          active={activeAiTab === "proofread"}
        />
        <DropdownItem
          icon={Wand2}
          label="Clarify"
          onClick={() => {
            setActiveAiTab?.("clarify");
            onAI?.("clarify");
          }}
          active={activeAiTab === "clarify"}
        />
        <DropdownItem
          icon={RefreshCw}
          label="Rewrite"
          onClick={() => {
            setActiveAiTab?.("rewrite");
            onAI?.("rewrite");
          }}
          active={activeAiTab === "rewrite"}
        />
        <DropdownItem
          icon={Eye}
          label="Readability"
          onClick={() => {
            setActiveAiTab?.("readability");
            onAI?.("readability");
          }}
          active={activeAiTab === "readability"}
        />
        <DropdownDivider />
        <DropdownItem
          icon={MessageSquare}
          label={assistantOpen ? "Hide Assistant" : "Show Assistant"}
          onClick={onToggleAssistant}
          disabled={typeof onToggleAssistant !== "function"}
          active={!!assistantOpen}
        />
      </DropdownMenu>

      {/* Optional quick status */}
      {isSaved ? (
        <span className="text-[11px] text-emerald-700 ml-1">Saved</span>
      ) : null}
    </div>
  );
}
