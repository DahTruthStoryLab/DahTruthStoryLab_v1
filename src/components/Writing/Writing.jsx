// src/components/Writing.js (or Writer.js)
import React, { useState, useEffect, useMemo } from "react";
import { BookOpen, LayoutGrid, List, Plus, Edit3 } from "lucide-react";
import ChapterGrid from "./ChapterGrid";
import ChapterSidebar from "./ChapterSidebar";

import {
  computeWordsFromChapters,
  syncProjectForCurrentStory,
} from "../lib/projectsSync";

const STORAGE_KEY = "dahtruth_chapters";

const Writing = () => {
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load chapters from localStorage on mount
  useEffect(() => {
    const savedChapters = localStorage.getItem(STORAGE_KEY);
    if (savedChapters) {
      try {
        const parsed = JSON.parse(savedChapters);
        if (Array.isArray(parsed)) {
          setChapters(parsed);
          if (parsed.length > 0) {
            setSelectedChapterId(parsed[0].id);
          }
        }
      } catch {
        // ignore bad JSON
      }
    }
  }, []);

  // Save chapters to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
    } catch {
      // ignore
    }
  }, [chapters]);

  // 🔢 Compute total words across all chapters
  const totalWords = useMemo(
    () => computeWordsFromChapters(chapters),
    [chapters]
  );

  // 🔗 Keep currentStory + userProjects in sync with this writer’s word count
  useEffect(() => {
    syncProjectForCurrentStory({
      wordCount: totalWords,
      // If/when you track targetWords for this book, pass it here too.
    });
  }, [totalWords]);

  const handleAddChapter = () => {
    const now = new Date().toISOString();
    const newChapter = {
      id: `chapter-${Date.now()}`,
      order: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      summary: "",
      content: "",
      wordCount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapterId(newChapter.id);
  };

  const handleReorderChapters = (reorderedChapters) => {
    const updatedChapters = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
      updatedAt: new Date().toISOString(),
    }));
    setChapters(updatedChapters);
  };

  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
    console.log("Selected chapter:", chapterId);
  };

  const handleUpdateChapter = (chapterId, updates) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, ...updates, updatedAt: new Date().toISOString() }
          : ch
      )
    );
  };

  // ✅ Rename handler that keeps everything in sync
  const handleRenameChapter = (chapterId, newTitle) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === chapterId
          ? { ...ch, title: newTitle, updatedAt: new Date().toISOString() }
          : ch
      )
    );
  };

  // ✅ Delete handler (used by ChapterGrid)
  const handleDeleteChapter = (chapterId) => {
    setChapters((prev) => {
      const filtered = prev.filter((ch) => ch.id !== chapterId);
      return filtered.map((ch, index) => ({
        ...ch,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
    });

    if (selectedChapterId === chapterId) {
      setSelectedChapterId(null);
    }
  };

  // 🔍 Lookup selected chapter for outline editor
  const selectedChapter = useMemo(
    () => chapters.find((ch) => ch.id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );

  const handleOutlineChange = (newOutline) => {
    if (!selectedChapter) return;
    handleUpdateChapter(selectedChapter.id, { summary: newOutline });
  };

  const handleTitleChangeFromEditor = (newTitle) => {
    if (!selectedChapter) return;
    handleRenameChapter(selectedChapter.id, newTitle);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#050819]/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Title + subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#10163a] border border-[#D4AF37]/40">
              <BookOpen className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-white tracking-tight">
                My Writing
              </h1>
              <p className="text-xs text-white/60">
                Chapters, drafts, and manuscripts in one place
              </p>
              <p className="text-[10px] text-white/40 mt-0.5">
                Total words: {totalWords.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Sidebar toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 hover:border-[#D4AF37]/40 transition"
            >
              <List className="w-3.5 h-3.5" />
              <span>{showSidebar ? "Hide chapters" : "Show chapters"}</span>
            </button>

            {/* View toggle */}
            <div className="inline-flex items-center rounded-md border border-white/15 bg-white/5 p-0.5 text-xs">
              <button
                onClick={() => setViewMode("grid")}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm ${
                  viewMode === "grid"
                    ? "bg-[#1a237e] text-[#D4AF37]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm ${
                  viewMode === "list"
                    ? "bg-[#1a237e] text-[#D4AF37]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* New chapter */}
            <button
              onClick={handleAddChapter}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#1a237e] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0d47a1] border border-[#D4AF37]/40 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New chapter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        {showSidebar && (
          <ChapterSidebar
            chapters={chapters}
            onReorder={handleReorderChapters}
            onAddChapter={handleAddChapter}
            selectedId={selectedChapterId}
            onSelectChapter={handleSelectChapter}
            onRenameChapter={handleRenameChapter}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {viewMode === "grid" ? (
            // Grid view + small outline editor
            <div className="h-full grid grid-rows-[minmax(0,1.5fr),minmax(0,1fr)] lg:grid-rows-none lg:grid-cols-[minmax(0,2fr),minmax(0,1.3fr)]">
              {/* Left: Chapters grid */}
              <div className="p-4 lg:p-6 overflow-auto">
                <ChapterGrid
                  chapters={chapters}
                  onAddChapter={handleAddChapter}
                  onSelectChapter={handleSelectChapter}
                  onUpdateChapter={handleUpdateChapter}
                  onDeleteChapter={handleDeleteChapter}
                  selectedId={selectedChapterId}
                />
              </div>

              {/* Right: Small Chapter Outline editor */}
              <div className="border-t border-white/10 lg:border-t-0 lg:border-l border-white/10 bg-white/5/40 backdrop-blur-xl px-4 py-4 lg:px-6 lg:py-6 flex flex-col">
                {selectedChapter ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/15">
                          <Edit3 className="w-4 h-4 text-[#D4AF37]" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-white/50">
                            Chapter {selectedChapter.order ?? ""}
                          </p>
                          <input
                            className="mt-0.5 w-full bg-transparent border-0 border-b border-white/10 focus:border-[#D4AF37]/60 text-sm font-semibold text-white outline-none placeholder:text-white/40"
                            value={selectedChapter.title || ""}
                            onChange={(e) =>
                              handleTitleChangeFromEditor(e.target.value)
                            }
                            placeholder="Chapter title..."
                          />
                        </div>
                      </div>
                    </div>

                    <label className="text-[11px] text-white/60 mb-1 block">
                      Small Chapter Outline
                    </label>
                    <textarea
                      className="flex-1 w-full rounded-lg border border-white/15 bg-[#050819]/60 px-3 py-2 text-sm text-white outline-none resize-none min-h-[140px] placeholder:text-white/40"
                      placeholder="Briefly describe what happens in this chapter..."
                      value={selectedChapter.summary || ""}
                      onChange={(e) => handleOutlineChange(e.target.value)}
                    />
                    <p className="mt-2 text-[11px] text-white/50">
                      This short outline is shared with your Table of Contents,
                      so you can see each chapter’s purpose at a glance.
                    </p>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-white/70">
                    <Edit3 className="w-8 h-8 mb-3 opacity-70" />
                    <p className="text-sm mb-1">
                      Select a chapter to add a small outline.
                    </p>
                    <p className="text-xs text-white/60">
                      Your outline stays synced with the Table of Contents view.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // List view placeholder
            <div className="p-6">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                <List className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  List View
                </h3>
                <p className="text-white/60">
                  Coming soon! Use grid view for now.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {chapters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center pointer-events-auto">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1a237e]/20 to-[#0d47a1]/20 flex items-center justify-center mx-auto mb-6 border-2 border-[#D4AF37]/20">
              <BookOpen className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Start Your Story
            </h2>
            <p className="text-white/60 mb-6 max-w-md">
              Create your first chapter and bring your narrative to life.
            </p>
            <button
              onClick={handleAddChapter}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#1a237e]/80 to-[#0d47a1]/80 hover:from-[#1a237e] hover:to-[#0d47a1] text-white flex items-center space-x-2 transition-all duration-300 border border-[#D4AF37]/30 backdrop-blur-sm mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Chapter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writing;
