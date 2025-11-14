// src/components/ComposePage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import PublishingMeta from "./Editor/PublishingMeta";
// AIInstructions intentionally removed on this page
// import AIInstructions from "./Editor/AIInstructions";
import TrashDock from "./Writing/TrashDock";

import { useChapterManager } from "../hooks/useChapterManager";
import { useAIAssistant } from "../hooks/useAIAssistant";
import { GoldButton, WritingCrumb } from "./UI/UIComponents";

// NEW: Import the document parser and rate limiter
import { documentParser } from "../utils/documentParser";
import { rateLimiter } from "../utils/rateLimiter";

const DEBUG_IMPORT = false;

export default function ComposePage() {
  const navigate = useNavigate();

  // Chapter management
  const {
    book,
    chapters: rawChapters = [],
    selectedId,
    selectedChapter,
    setSelectedId,
    addChapter,
    updateChapter,
    deleteChapter,
    moveChapter,
    saveProject,
  } = useChapterManager();

  // AI operations
  const {
    runAI,
    aiBusy,
    aiError,
    instructions,
    setInstructions,
    provider,
    setProvider,
    generateChapterPrompt,
  } = useAIAssistant();

  // Guard + normalize chapters
  const chapters = useMemo(
    () =>
      Array.isArray(rawChapters)
        ? rawChapters.filter((c) => c && c.id != null)
        : [],
    [rawChapters]
  );

  // View state
  const [view, setView] = useState("grid");

  // Editor state
  const [title, setTitle] = useState(selectedChapter?.title ?? "");
  const [html, setHtml] = useState(selectedChapter?.content ?? "");

  // Book metadata
  const [author, setAuthor] = useState("Jacqueline Session Ausby");
  const [bookTitle, setBookTitle] = useState(book?.title || "Raising Daisy");

  // Selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const lastClickedIndexRef = useRef(null);

  // Import + AI indicators
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [queueLength, setQueueLength] = useState(0);

  const hasChapter = !!selectedId && !!selectedChapter;

  // Monitor rate limiter queue (for AI)
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(rateLimiter.getQueueLength());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Selection helpers
  const clearSelection = () => setSelectedIds(new Set());

  const selectAllChapters = () => {
    setSelectedIds(new Set(chapters.map((c) => c.id)));
  };

  function toggleSelect(id, { additive = false } = {}) {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(additive ? prev : []);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function rangeSelect(toIdx) {
    if (!Number.isInteger(toIdx) || toIdx < 0 || toIdx >= chapters.length) {
      lastClickedIndexRef.current = null;
      return;
    }
    const fromIdx = lastClickedIndexRef.current;
    if (fromIdx == null || fromIdx < 0 || fromIdx >= chapters.length) {
      const chapterId = chapters[toIdx]?.id;
      if (chapterId) {
        setSelectedIds(new Set([chapterId]));
        lastClickedIndexRef.current = toIdx;
      }
      return;
    }
    const [a, b] = [Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx)];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (let i = a; i <= b; i++) {
        const cid = chapters[i]?.id;
        if (cid) next.add(cid);
      }
      return next;
    });
    lastClickedIndexRef.current = toIdx;
  }

  function toggleSelectMode() {
    setSelectMode((s) => {
      if (s) clearSelection();
      return !s;
    });
  }

  // Keyboard delete for multi-select
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (/input|textarea|select/i.test(tag)) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size) {
        e.preventDefault();
        handleDeleteMultiple(Array.from(selectedIds));
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
  }, [selectedIds, chapters, selectedId]);

  // Sync editor with selected chapter
  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    } else {
      // If no chapter is selected, clear editor fields
      setTitle("");
      setHtml("");
    }
  }, [selectedId, selectedChapter]);

  const handleSave = () => {
  if (!hasChapter) return;
  updateChapter(selectedId, {
    title: title || selectedChapter?.title || "",
    content: html,
  });
  // Only update book metadata, let the hook keep chapters internally
  saveProject({ book: { ...book, title: bookTitle } });
};

  // AI (rewrite only)
  const handleAI = async (mode) => {
    if (!hasChapter) return;

    try {
      const result = await rateLimiter.addToQueue(async () => {
        return await runAI(mode, html, instructions, provider);
      });

      if (result) {
        setHtml(result);
        updateChapter(selectedId, {
          title: title || selectedChapter?.title || "",
          content: result,
        });
      }
    } catch (error) {
      console.error("AI request error:", error);
    }
  };

  /* ============================
     Simplified Import
  ============================= */
  const handleImport = async (file, options = {}) => {
    if (!file) return;

    const { splitByHeadings = true } = options;

    setIsImporting(true);
    setImportProgress("Importing document...");

    try {
      const name = file.name.toLowerCase();
      let parsed;

      if (name.endsWith(".doc") || name.endsWith(".docx")) {
        parsed = await rateLimiter.addToQueue(() =>
          documentParser.parseWordDocument(file)
        );
      } else if (name.endsWith(".txt") || name.endsWith(".md")) {
        parsed = await documentParser.parseTextDocument(file);
      } else {
        alert("Unsupported file type. Please use .doc, .docx, .txt, or .md");
        return;
      }

      if (!parsed) {
        alert("Could not parse this document.");
        return;
      }

      if (DEBUG_IMPORT) {
        console.log("Parsed document:", parsed);
      }

      // Optional: sync book title
      if (parsed.title && parsed.title !== bookTitle) {
        setBookTitle(parsed.title);
      }

      // Split into multiple chapters if possible
      if (splitByHeadings && parsed.chapters && parsed.chapters.length > 0) {
        parsed.chapters.forEach((c) => {
          const newId = addChapter();
          updateChapter(newId, {
            title: c.title || "Untitled Chapter",
            content: c.content || "",
          });
        });

        alert(`✅ Imported ${parsed.chapters.length} chapter(s) from "${file.name}".`);
      } else {
        // Single-chapter import
        const fullContent =
          parsed.fullContent ||
          (parsed.chapters && parsed.chapters.length
            ? parsed.chapters.map((c) => c.content || "").join("\n\n")
            : "");

        if (hasChapter) {
          // Overwrite current chapter
          setHtml(fullContent);
          updateChapter(selectedId, {
            title:
              title ||
              selectedChapter?.title ||
              parsed.title ||
              "Imported Manuscript",
            content: fullContent,
          });
        } else {
          // Create a new chapter
          const newId = addChapter();
          updateChapter(newId, {
            title: parsed.title || "Imported Manuscript",
            content: fullContent,
          });
          setSelectedId(newId);
          setView("editor");
        }

        alert(`✅ Document imported into a single chapter from "${file.name}".`);
      }

     // 4) Save snapshot (only book; chapters are already in hook state)
        saveProject({
          book: { ...book, title: parsed.title || bookTitle },
        });

    } catch (error) {
      console.error("Import failed:", error);
      alert(
        `❌ Failed to import document: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsImporting(false);
      setImportProgress("");
    }
  };

  // Export current chapter as HTML
  const handleExport = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chapter"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete single chapter WITHOUT forcing view change
  const handleDeleteCurrent = () => {
    if (!hasChapter) return;
    if (
      !window.confirm(
        `Delete "${title || selectedChapter.title}"?\n\nThis cannot be undone.`
      )
    ) {
      return;
    }

    // Compute next chapter selection before delete
    const idx = chapters.findIndex((c) => c.id === selectedId);
    const remaining = chapters.filter((c) => c.id !== selectedId);

    deleteChapter(selectedId);

    if (remaining.length > 0) {
      const nextIdx = Math.min(idx, remaining.length - 1);
      const nextId = remaining[nextIdx].id;
      setSelectedId(nextId);
    } else {
      // No chapters left
      setSelectedId(null);
      setTitle("");
      setHtml("");
    }
  };

  // Bulk delete WITHOUT forcing view change
  const handleDeleteMultiple = (ids) => {
    if (!ids?.length) return;
    if (!window.confirm(`Delete ${ids.length} chapter(s)? This cannot be undone.`))
      return;

    const idsSet = new Set(ids);
    const remaining = chapters.filter((c) => !idsSet.has(c.id));

    ids.forEach((id) => deleteChapter(id));
    clearSelection();

    if (idsSet.has(selectedId)) {
      if (remaining.length > 0) {
        setSelectedId(remaining[0].id);
      } else {
        setSelectedId(null);
        setTitle("");
        setHtml("");
      }
    }
  };

  const goBack = () => navigate("/dashboard");

  // Simple guard
  if (!Array.isArray(chapters)) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-lg">Loading chapters...</div>
      </div>
    );
  }

  // Render
  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      {/* TOP BAR */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 h-auto py-2 flex items-center gap-3 overflow-x-auto">
          <GoldButton onClick={goBack} title="Back to Dashboard">
            ← Dashboard
          </GoldButton>

          <WritingCrumb view={view} />

          {/* View toggle */}
          <div className="ml-1 flex items-center gap-1">
            <button
              onClick={() => setView("grid")}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] ${
                view === "grid" ? "bg-slate-100" : "bg-white hover:bg-slate-50"
              }`}
              title="Chapter Grid"
            >
              Grid
            </button>
            <button
              onClick={() => setView("editor")}
              className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px] ${
                view === "editor" ? "bg-slate-100" : "bg-white hover:bg-slate-50"
              }`}
              title="Open Editor"
            >
              Editor
            </button>
          </div>

          {/* Select mode toggle */}
          <button
            onClick={toggleSelectMode}
            className={[
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px]",
              selectMode ? "bg-blue-100 border-blue-300" : "bg-white hover:bg-slate-50",
            ].join(" ")}
            title="Toggle Select Mode"
          >
            {selectMode ? "✓ Select" : "Select"}
          </button>

          {/* Selection toolbar (now always visible in select mode) */}
          {selectMode && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-md border border-blue-200">
              <span className="text-xs font-medium text-blue-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => handleDeleteMultiple(Array.from(selectedIds))}
                className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                title="Delete Selected"
                disabled={selectedIds.size === 0}
              >
                🗑️ Delete selected
              </button>
              <button
                onClick={clearSelection}
                className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50"
                title="Clear Selection"
              >
                Clear
              </button>
              <button
                onClick={selectAllChapters}
                className="text-xs px-2 py-0.5 rounded border border-blue-300 bg-white hover:bg-blue-50"
                title="Select All Chapters"
              >
                Select all
              </button>
            </div>
          )}

          {/* Provider selector */}
          <div className="ml-2 flex items-center gap-1">
            <label className="text-[12px] text-slate-600">Provider:</label>
            <select
              className="border rounded px-2 py-1 text-[12px]"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="anthropic">Anthropic</option>
              <option value="openai">OpenAI</option>
            </select>
          </div>

          {/* AI queue indicator */}
          {queueLength > 0 && (
            <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
              <span className="text-xs text-blue-700">
                ⏳ {queueLength} AI request{queueLength !== 1 ? "s" : ""} queued
              </span>
            </div>
          )}

          {/* Import progress */}
          {isImporting && (
            <div className="ml-2 flex items-center gap-2 px-3 py-1 bg-amber-50 rounded border border-amber-200">
              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-amber-700">{importProgress}</span>
            </div>
          )}

          <div className="w-full sm:flex-1" />

          {/* Toolbar */}
          <EditorToolbar
            onAI={handleAI}
            onSave={handleSave}
            onImport={handleImport}
            onExport={handleExport}
            onDelete={handleDeleteCurrent}
            aiBusy={aiBusy || isImporting}
          />
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <>
          <ChapterGrid
            chapters={chapters}
            selectedId={selectedId}
            onSelectChapter={(id) => {
              if (!id) return;
              if (selectMode) {
                toggleSelect(id);
              } else {
                setSelectedId(id);
                setView("editor");
              }
            }}
            onAddChapter={addChapter}
            onMoveChapter={moveChapter}
            onDeleteChapter={deleteChapter}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onRangeSelect={(idx) => rangeSelect(idx)}
            lastClickedIndexRef={lastClickedIndexRef}
          />
          <TrashDock onDelete={handleDeleteMultiple} />
        </>
      )}

      {/* EDITOR VIEW */}
      {view === "editor" && (
        <div
          className="max-w-7xl mx-auto px-4 py-6 grid gap-6"
          style={{ gridTemplateColumns: "280px minmax(0, 1fr)", minWidth: 1024 }}
        >
          {/* Left Sidebar */}
          <aside className="sticky top-16 space-y-3" style={{ zIndex: 10 }}>
            <PublishingMeta
              bookTitle={bookTitle}
              setBookTitle={setBookTitle}
              author={author}
              setAuthor={setAuthor}
              onPublishingPrep={() => {}}
              aiBusy={aiBusy}
              aiError={aiError}
            />

            <ChapterSidebar
              chapters={chapters}
              selectedId={selectedId}
              onSelectChapter={setSelectedId}
              onAddChapter={addChapter}
              onDeleteMultiple={handleDeleteMultiple}
              selectMode={selectMode}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onRangeSelect={(idx) => rangeSelect(idx)}
              lastClickedIndexRef={lastClickedIndexRef}
            />
          </aside>

          {/* Main Editor */}
          <EditorPane
            title={title}
            setTitle={setTitle}
            html={html}
            setHtml={setHtml}
            onSave={handleSave}
            onAI={handleAI}
            aiBusy={aiBusy}
            pageWidth={1000}
          />

          <TrashDock onDelete={handleDeleteMultiple} />
        </div>
      )}
    </div>
  );
}
