// src/hooks/useProject.ts
// React hook for managing the current project

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Project,
  Chapter,
  ComposeData,
  PublishingData,
  CoverData,
  SyncStatus,
} from "../types/project";
import {
  getCurrentProject,
  setCurrentProject,
  loadProject,
  saveProject,
  queueAutoSave,
  cancelAutoSave,
  flushAutoSave,
  getSyncStatus,
  setSyncStatus,
  onSyncStatusChange,
} from "../lib/projectsService";
import { getLocalAuthorId } from "../lib/authorService";

export interface UseProjectReturn {
  // State
  project: Project | null;
  isLoading: boolean;
  isSaving: boolean;
  syncStatus: SyncStatus;
  error: string | null;
  hasUnsavedChanges: boolean;
  
  // Project actions
  loadProject: (projectId: string) => Promise<void>;
  saveNow: () => Promise<void>;
  closeProject: () => void;
  
  // Update helpers (auto-save enabled)
  updateProject: (updates: Partial<Project>) => void;
  updateCompose: (updates: Partial<ComposeData>) => void;
  updatePublishing: (updates: Partial<PublishingData>) => void;
  updateCover: (updates: Partial<CoverData>) => void;
  
  // Chapter helpers
  addChapter: (title?: string) => Chapter;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  reorderChapters: (fromIndex: number, toIndex: number) => void;
  
  // Utility
  getWordCount: () => number;
  getChapterCount: () => number;
}

export function useProject(): UseProjectReturn {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const projectRef = useRef<Project | null>(null);
  
  // Keep ref in sync
  useEffect(() => {
    projectRef.current = project;
  }, [project]);
  
  // Initialize from localStorage on mount
  useEffect(() => {
    const current = getCurrentProject();
    if (current) {
      setProject(current);
    }
    setIsLoading(false);
    
    // Subscribe to sync status changes
    const unsubscribe = onSyncStatusChange((status) => {
      setSyncStatusState(status);
      if (status === "saved") {
        setHasUnsavedChanges(false);
      }
    });
    
    return () => {
      unsubscribe();
      // Flush any pending saves on unmount
      flushAutoSave();
    };
  }, []);
  
  // Load a project by ID
  const loadProjectById = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authorId = getLocalAuthorId();
      const loaded = await loadProject(projectId, { authorId: authorId || undefined });
      
      if (loaded) {
        setProject(loaded);
        setHasUnsavedChanges(false);
      } else {
        setError("Project not found");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load project";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Save immediately
  const saveNow = useCallback(async () => {
    if (!projectRef.current) return;
    
    setIsSaving(true);
    setSyncStatus("syncing");
    
    try {
      await saveProject(projectRef.current, { updateIndex: true, cloudSync: true });
      setSyncStatus("saved");
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("[useProject] Save failed:", err);
      setSyncStatus("error");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);
  
  // Close project
  const closeProject = useCallback(() => {
    // Flush any pending saves
    flushAutoSave();
    
    setCurrentProject(null);
    setProject(null);
    setHasUnsavedChanges(false);
  }, []);
  
  // Generic update with auto-save
  const updateProject = useCallback((updates: Partial<Project>) => {
    setProject((prev) => {
      if (!prev) return prev;
      
      const updated: Project = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      // Queue auto-save
      setHasUnsavedChanges(true);
      queueAutoSave(
        updated,
        () => setSyncStatus("syncing"),
        (success) => setSyncStatus(success ? "saved" : "error")
      );
      
      return updated;
    });
  }, []);
  
  // Update compose data
  const updateCompose = useCallback((updates: Partial<ComposeData>) => {
    updateProject({
      compose: {
        ...(projectRef.current?.compose || { chapters: [], characters: [] }),
        ...updates,
      },
    });
  }, [updateProject]);
  
  // Update publishing data
  const updatePublishing = useCallback((updates: Partial<PublishingData>) => {
    updateProject({
      publishing: {
        ...(projectRef.current?.publishing || {
          chapters: [],
          matter: {},
          meta: {},
          format: {},
          platform: {},
        } as PublishingData),
        ...updates,
      },
    });
  }, [updateProject]);
  
  // Update cover data
  const updateCover = useCallback((updates: Partial<CoverData>) => {
    updateProject({
      cover: {
        ...(projectRef.current?.cover || {} as CoverData),
        ...updates,
      },
    });
  }, [updateProject]);
  
  // Add chapter
  const addChapter = useCallback((title?: string): Chapter => {
    const chapters = projectRef.current?.compose.chapters || [];
    const newOrder = chapters.length;
    
    const newChapter: Chapter = {
      id: crypto?.randomUUID?.() || `ch_${Date.now()}`,
      title: title || `Chapter ${newOrder + 1}`,
      order: newOrder,
      text: "",
      textHTML: "",
      included: true,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    updateCompose({
      chapters: [...chapters, newChapter],
      activeChapterId: newChapter.id,
    });
    
    return newChapter;
  }, [updateCompose]);
  
  // Update chapter
  const updateChapter = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    const chapters = projectRef.current?.compose.chapters || [];
    const updatedChapters = chapters.map((ch) =>
      ch.id === chapterId
        ? { ...ch, ...updates, updatedAt: new Date().toISOString() }
        : ch
    );
    
    updateCompose({ chapters: updatedChapters });
  }, [updateCompose]);
  
  // Delete chapter
  const deleteChapter = useCallback((chapterId: string) => {
    const chapters = projectRef.current?.compose.chapters || [];
    const filtered = chapters.filter((ch) => ch.id !== chapterId);
    
    // Reorder remaining chapters
    const reordered = filtered.map((ch, idx) => ({ ...ch, order: idx }));
    
    // Update active chapter if needed
    const activeId = projectRef.current?.compose.activeChapterId;
    const newActiveId =
      activeId === chapterId
        ? reordered[0]?.id || ""
        : activeId;
    
    updateCompose({
      chapters: reordered,
      activeChapterId: newActiveId,
    });
  }, [updateCompose]);
  
  // Reorder chapters
  const reorderChapters = useCallback((fromIndex: number, toIndex: number) => {
    const chapters = [...(projectRef.current?.compose.chapters || [])];
    
    if (fromIndex < 0 || fromIndex >= chapters.length) return;
    if (toIndex < 0 || toIndex >= chapters.length) return;
    
    const [moved] = chapters.splice(fromIndex, 1);
    chapters.splice(toIndex, 0, moved);
    
    // Update order values
    const reordered = chapters.map((ch, idx) => ({ ...ch, order: idx }));
    
    updateCompose({ chapters: reordered });
  }, [updateCompose]);
  
  // Get word count
  const getWordCount = useCallback((): number => {
    const chapters = projectRef.current?.compose.chapters || [];
    return chapters.reduce((sum, ch) => {
      const text = ch.text || "";
      return sum + text.split(/\s+/).filter(Boolean).length;
    }, 0);
  }, []);
  
  // Get chapter count
  const getChapterCount = useCallback((): number => {
    return projectRef.current?.compose.chapters.length || 0;
  }, []);
  
  return {
    project,
    isLoading,
    isSaving,
    syncStatus,
    error,
    hasUnsavedChanges,
    
    loadProject: loadProjectById,
    saveNow,
    closeProject,
    
    updateProject,
    updateCompose,
    updatePublishing,
    updateCover,
    
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    
    getWordCount,
    getChapterCount,
  };
}

export default useProject;
