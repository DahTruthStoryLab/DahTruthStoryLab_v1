// src/components/ProjectSwitcher.jsx
// UI component for managing multiple manuscripts/projects

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderOpen,
  Plus,
  Upload,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  BookOpen,
  FileText,
  Clock,
  MoreVertical,
} from "lucide-react";
import { useProjectStore } from "../hooks/useProjectStore";
import { documentParser } from "../utils/documentParser";

// Brand colors
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
};

// Format date nicely
function formatDate(isoString) {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Format word count
function formatWords(count) {
  if (!count) return "0 words";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k words`;
  return `${count} words`;
}

// ============ Project Card ============
function ProjectCard({ project, isActive, onSelect, onDelete, onRename }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(project.title);
  const inputRef = useRef(null);

  const handleRename = () => {
    if (newTitle.trim() && newTitle !== project.title) {
      onRename(project.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  return (
    <div
      className={`relative rounded-xl p-4 transition-all cursor-pointer ${
        isActive
          ? "ring-2 ring-offset-2"
          : "hover:shadow-md"
      }`}
      style={{
        background: isActive ? `${BRAND.gold}10` : "white",
        border: `1px solid ${isActive ? BRAND.gold : "#e2e8f0"}`,
        ringColor: BRAND.gold,
      }}
      onClick={() => !isRenaming && onSelect(project.id)}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ background: BRAND.gold }}
        />
      )}

      {/* Menu button */}
      <button
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        style={{ opacity: showMenu || isActive ? 0 : undefined }}
      >
        <MoreVertical size={16} className="text-slate-400" />
      </button>

      {/* Title */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${BRAND.navy}10` }}
        >
          <BookOpen size={20} style={{ color: BRAND.navy }} />
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                className="flex-1 px-2 py-1 text-sm font-semibold rounded border focus:outline-none focus:ring-2"
                style={{ borderColor: BRAND.navy, ringColor: BRAND.gold }}
                autoFocus
              />
              <button
                onClick={handleRename}
                className="p-1 rounded hover:bg-green-100"
              >
                <Check size={16} className="text-green-600" />
              </button>
              <button
                onClick={() => setIsRenaming(false)}
                className="p-1 rounded hover:bg-red-100"
              >
                <X size={16} className="text-red-500" />
              </button>
            </div>
          ) : (
            <h3
              className="font-semibold truncate"
              style={{ color: BRAND.navy }}
            >
              {project.title}
            </h3>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FileText size={12} />
              {project.chapterCount || 0} chapters
            </span>
            <span>{formatWords(project.wordCount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDate(project.updatedAt)}
        </span>
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={{
            background:
              project.source === "Imported"
                ? `${BRAND.mauve}20`
                : `${BRAND.navy}10`,
            color: BRAND.navy,
          }}
        >
          {project.source || "Project"}
        </span>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <div
          className="absolute top-10 right-2 z-20 bg-white rounded-lg shadow-lg border py-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
            onClick={() => {
              setIsRenaming(true);
              setShowMenu(false);
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
          >
            <Edit3 size={14} />
            Rename
          </button>
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            onClick={() => {
              if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                onDelete(project.id);
              }
              setShowMenu(false);
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ============ Main ProjectSwitcher Component ============
export default function ProjectSwitcher({ onProjectChange }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState(null);

  const {
    projects,
    currentProjectId,
    createProject,
    createProjectFromImport,
    switchProject,
    deleteProject,
    renameProject,
  } = useProjectStore();

  // Handle file import
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      let parsed;
      const ext = file.name.split(".").pop()?.toLowerCase();

      if (ext === "docx" || ext === "doc") {
        parsed = await documentParser.parseWordDocument(file);
      } else if (ext === "txt" || ext === "md") {
        parsed = await documentParser.parseTextDocument(file);
      } else {
        throw new Error("Unsupported file format. Please use .docx, .doc, .txt, or .md");
      }

      // Create a NEW project from the import
      const projectId = createProjectFromImport(parsed);

      // Notify parent if callback provided
      if (onProjectChange) {
        onProjectChange(projectId);
      }

      // Navigate to compose page
      navigate("/compose");
    } catch (err) {
      console.error("Import error:", err);
      setImportError(err.message || "Failed to import document");
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle creating new project
  const handleNewProject = () => {
    const title = window.prompt("Enter a title for your new manuscript:", "Untitled Book");
    if (title) {
      const projectId = createProject(title);
      if (onProjectChange) {
        onProjectChange(projectId);
      }
      navigate("/compose");
    }
  };

  // Handle switching projects
  const handleSelectProject = (projectId) => {
    if (projectId !== currentProjectId) {
      switchProject(projectId);
      if (onProjectChange) {
        onProjectChange(projectId);
      }
    }
    navigate("/compose");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.gold}20` }}
          >
            <FolderOpen size={20} style={{ color: BRAND.gold }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
              My Manuscripts
            </h2>
            <p className="text-sm text-slate-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleNewProject}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{
              background: "white",
              border: `1px solid ${BRAND.navy}20`,
              color: BRAND.navy,
            }}
          >
            <Plus size={16} />
            New
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            }}
          >
            <Upload size={16} />
            {isImporting ? "Importing..." : "Import"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.doc,.txt,.md"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Error message */}
      {importError && (
        <div className="rounded-xl p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          {importError}
        </div>
      )}

      {/* Projects grid */}
      {projects.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${BRAND.mauve}15` }}
          >
            <BookOpen size={40} style={{ color: BRAND.mauve }} />
          </div>
          <h3 className="font-semibold mb-2" style={{ color: BRAND.navy }}>
            No Manuscripts Yet
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Start a new manuscript from scratch or import an existing document.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleNewProject}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              style={{
                background: `${BRAND.navy}10`,
                color: BRAND.navy,
              }}
            >
              <Plus size={16} />
              Start New
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
              style={{ background: BRAND.gold }}
            >
              <Upload size={16} />
              Import Document
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              isActive={project.id === currentProjectId}
              onSelect={handleSelectProject}
              onDelete={deleteProject}
              onRename={renameProject}
            />
          ))}
        </div>
      )}

      {/* Helper text */}
      {projects.length > 0 && (
        <p className="text-xs text-center text-slate-400">
          Click a manuscript to open it. Import creates a new project — your current work won't be overwritten.
        </p>
      )}
    </div>
  );
}

// ============ Compact Dropdown Version ============
// For use in headers/toolbars
export function ProjectDropdown({ className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const {
    projects,
    currentProjectId,
    currentProject,
    switchProject,
    createProject,
  } = useProjectStore();

  const handleSwitch = (projectId) => {
    switchProject(projectId);
    setIsOpen(false);
    navigate("/compose");
  };

  const handleNew = () => {
    const title = window.prompt("Title for new manuscript:", "Untitled Book");
    if (title) {
      createProject(title);
      setIsOpen(false);
      navigate("/compose");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
        style={{ color: BRAND.navy }}
      >
        <BookOpen size={16} />
        <span className="max-w-[150px] truncate">
          {currentProject?.title || "No Project"}
        </span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border min-w-[240px] py-2">
            <div className="px-3 py-1 text-xs font-medium text-slate-400 uppercase">
              My Manuscripts
            </div>

            <div className="max-h-64 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSwitch(project.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 ${
                    project.id === currentProjectId ? "bg-slate-50" : ""
                  }`}
                >
                  <BookOpen
                    size={14}
                    style={{
                      color:
                        project.id === currentProjectId
                          ? BRAND.gold
                          : BRAND.navy,
                    }}
                  />
                  <span className="flex-1 truncate">{project.title}</span>
                  {project.id === currentProjectId && (
                    <Check size={14} style={{ color: BRAND.gold }} />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t mt-1 pt-1">
              <button
                onClick={handleNew}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                style={{ color: BRAND.gold }}
              >
                <Plus size={14} />
                New Manuscript
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
