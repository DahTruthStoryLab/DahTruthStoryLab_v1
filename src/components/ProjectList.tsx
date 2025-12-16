// src/components/ProjectList.tsx
// Component for displaying and managing the project list

import React, { useState } from "react";
import type { ProjectIndexEntry, ProjectStatus } from "../types/project";

interface ProjectListProps {
  projects: ProjectIndexEntry[];
  currentProjectId: string | null;
  isLoading: boolean;
  onOpen: (projectId: string) => void;
  onCreate: (title: string) => void;
  onDelete: (projectId: string) => void;
  onDuplicate: (projectId: string) => void;
  onRefresh: () => void;
}

const theme = {
  bg: "var(--brand-bg, #f8fafc)",
  surface: "var(--brand-surface, #ffffff)",
  border: "var(--brand-border, #e2e8f0)",
  borderStrong: "var(--brand-border-strong, #cbd5e1)",
  text: "var(--brand-text, #0f172a)",
  subtext: "var(--brand-subtext, #64748b)",
  accent: "var(--brand-accent, #6366f1)",
  white: "var(--brand-white, #ffffff)",
  gold: "var(--brand-gold, #facc15)",
  navy: "var(--brand-navy, #1e3a5f)",
};

const STATUS_LABELS: Record<ProjectStatus, { label: string; color: string }> = {
  draft: { label: "Draft", color: "#94a3b8" },
  writing: { label: "Writing", color: "#3b82f6" },
  editing: { label: "Editing", color: "#f59e0b" },
  publishing: { label: "Publishing", color: "#8b5cf6" },
  completed: { label: "Completed", color: "#22c55e" },
  archived: { label: "Archived", color: "#6b7280" },
};

const styles = {
  container: {
    background: theme.surface,
    borderRadius: 16,
    border: `1px solid ${theme.border}`,
    overflow: "hidden",
  },
  header: {
    padding: "16px 20px",
    borderBottom: `1px solid ${theme.border}`,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: theme.text,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  btn: {
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.text,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    transition: "background-color 0.15s",
  },
  btnPrimary: {
    background: theme.accent,
    color: theme.white,
    border: "none",
  },
  list: {
    maxHeight: 400,
    overflowY: "auto" as const,
  },
  item: {
    padding: "14px 20px",
    borderBottom: `1px solid ${theme.border}`,
    display: "flex",
    alignItems: "center",
    gap: 16,
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  itemHover: {
    background: "rgba(99, 102, 241, 0.05)",
  },
  itemActive: {
    background: "rgba(99, 102, 241, 0.1)",
    borderLeft: `3px solid ${theme.accent}`,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: theme.text,
    marginBottom: 4,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  itemMeta: {
    fontSize: 11,
    color: theme.subtext,
    display: "flex",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 500,
    textTransform: "uppercase" as const,
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  actionBtn: {
    padding: "4px 8px",
    fontSize: 11,
    borderRadius: 6,
    border: `1px solid ${theme.border}`,
    background: theme.white,
    color: theme.subtext,
    cursor: "pointer",
  },
  empty: {
    padding: "48px 20px",
    textAlign: "center" as const,
    color: theme.subtext,
  },
  newProjectInput: {
    padding: "12px 14px",
    fontSize: 14,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    width: "100%",
    outline: "none",
  },
};

export default function ProjectList({
  projects,
  currentProjectId,
  isLoading,
  onOpen,
  onCreate,
  onDelete,
  onDuplicate,
  onRefresh,
}: ProjectListProps): JSX.Element {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    
    onCreate(newTitle.trim());
    setNewTitle("");
    setShowNewForm(false);
  };
  
  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirmDelete === projectId) {
      onDelete(projectId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(projectId);
      // Auto-clear after 3 seconds
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };
  
  const formatDate = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "";
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>
          <span>📚</span>
          Your Projects
          {isLoading && (
            <span style={{ fontSize: 11, fontWeight: 400, color: theme.subtext }}>
              Loading...
            </span>
          )}
        </h3>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onRefresh}
            style={styles.btn}
            title="Refresh from cloud"
          >
            🔄 Sync
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            style={{ ...styles.btn, ...styles.btnPrimary }}
          >
            + New Project
          </button>
        </div>
      </div>
      
      {/* New Project Form */}
      {showNewForm && (
        <form
          onSubmit={handleCreate}
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.bg,
            display: "flex",
            gap: 10,
          }}
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter project title..."
            style={styles.newProjectInput}
            autoFocus
          />
          <button
            type="submit"
            style={{ ...styles.btn, ...styles.btnPrimary, whiteSpace: "nowrap" }}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => {
              setShowNewForm(false);
              setNewTitle("");
            }}
            style={styles.btn}
          >
            Cancel
          </button>
        </form>
      )}
      
      {/* Project List */}
      <div style={styles.list}>
        {projects.length === 0 ? (
          <div style={styles.empty}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📝</div>
            <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
              No projects yet
            </div>
            <div style={{ fontSize: 13 }}>
              Click "New Project" to start your first manuscript
            </div>
          </div>
        ) : (
          projects.map((project) => {
            const isActive = project.id === currentProjectId;
            const isHovered = project.id === hoveredId;
            const status = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
            
            return (
              <div
                key={project.id}
                onClick={() => onOpen(project.id)}
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...styles.item,
                  ...(isActive ? styles.itemActive : {}),
                  ...(isHovered && !isActive ? styles.itemHover : {}),
                }}
              >
                {/* Status indicator */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: status.color,
                    flexShrink: 0,
                  }}
                />
                
                {/* Content */}
                <div style={styles.itemContent}>
                  <div style={styles.itemTitle}>
                    {project.title}
                    {isActive && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 10,
                          color: theme.accent,
                          fontWeight: 500,
                        }}
                      >
                        (Open)
                      </span>
                    )}
                  </div>
                  <div style={styles.itemMeta}>
                    <span>
                      {project.chapterCount || 0} chapter
                      {project.chapterCount !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {(project.wordCount || 0).toLocaleString()} words
                    </span>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div
                  style={{
                    ...styles.statusBadge,
                    background: `${status.color}20`,
                    color: status.color,
                  }}
                >
                  {status.label}
                </div>
                
                {/* Actions */}
                {isHovered && (
                  <div
                    style={styles.actions}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onDuplicate(project.id)}
                      style={styles.actionBtn}
                      title="Duplicate"
                    >
                      📋
                    </button>
                    <button
                      onClick={(e) => handleDelete(project.id, e)}
                      style={{
                        ...styles.actionBtn,
                        color: confirmDelete === project.id ? "#dc2626" : theme.subtext,
                        borderColor:
                          confirmDelete === project.id ? "#fecaca" : theme.border,
                        background:
                          confirmDelete === project.id ? "#fef2f2" : theme.white,
                      }}
                      title={
                        confirmDelete === project.id
                          ? "Click again to confirm"
                          : "Delete"
                      }
                    >
                      {confirmDelete === project.id ? "❌" : "🗑️"}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

