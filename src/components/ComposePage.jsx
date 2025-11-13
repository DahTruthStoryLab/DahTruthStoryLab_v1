// src/components/ComposePage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import PublishingMeta from "./Editor/PublishingMeta";
import AIInstructions from "./Editor/AIInstructions";
import TrashDock from "./Writing/TrashDock";

import { useChapterManager } from "../hooks/useChapterManager";
import { useAIAssistant } from "../hooks/useAIAssistant";
import { GoldButton, WritingCrumb } from "./UI/UIComponents";

// NEW: Import the document parser and rate limiter
import { documentParser } from "../utils/documentParser";
import { rateLimiter } from "../utils/rateLimiter";
import { documentParser } from "../lib/documentParser"; // adjust path if needed


/* ============================
   Debug + import helpers
============================= */
const DEBUG_IMPORT = true; // Set to true to see detailed import logs
const HEADING_MATCH = /(chapter|ch\.?)\s*\d+|^chapter\b/i;

function isHeadingEl(el) {
  if (!el?.tagName) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "h1" || tag === "h2" || tag === "h3") return true;

  const cls = (el.getAttribute("class") || "").toLowerCase();
  if (/\b(msoheading|heading|title)\b/.test(cls)) return true;

  const styles = (el.getAttribute("style") || "").toLowerCase();
  if (/page-break|break-before|break-after/.test(styles)) return true;

  return false;
}

function isPageBreakNode(node) {
  if (node.nodeType === 8) return /pagebreak/i.test(node.nodeValue || "");
  if (node.nodeType === 1) {
    const tag = node.tagName.toLowerCase();
    if (tag === "hr") return true;
    const styles = (node.getAttribute("style") || "").toLowerCase();
    if (/page-break/.test(styles)) return true;
  }
  return false;
}

const textOf = (el) => (el.textContent || "").trim();

/* ============================
   Main Component
============================= */
export default function ComposePage() {
  const navigate = useNavigate();

  // Chapter management (state, CRUD operations)
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
        ? rawChapters.filter((c) => c && typeof c.id === "string")
        : [],
    [rawChapters]
  );

  // View state: 'grid' or 'editor'
  const [view, setView] = useState("grid");

  // Editor state
  const [title, setTitle] = useState(selectedChapter?.title ?? "");
  const [html, setHtml] = useState(selectedChapter?.content ?? "");

  // Publishing metadata
  const [author, setAuthor] = useState("Jacqueline Session Ausby");
  const [bookTitle, setBookTitle] = useState(book?.title || "Raising Daisy");

  // Multi-select state shared with grid + sidebar + trash
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const lastClickedIndexRef = useRef(null);

  // NEW: Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [queueLength, setQueueLength] = useState(0);

  const hasChapter = !!selectedId && !!selectedChapter;

  /* ============================
     NEW: Monitor rate limiter queue
  ============================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(rateLimiter.getQueueLength());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /* ============================
     Selection helpers
  ============================= */
  const clearSelection = () => setSelectedIds(new Set());

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

  /* ============================
     Keyboard delete
  ============================= */
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
  }, [selectedIds]);

  /* ============================
     Sync editor when chapter changes
  ============================= */
  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    }
  }, [selectedId, selectedChapter]);

  /* ============================
     Actions
  ============================= */
  const handleSave = () => {
    if (!hasChapter) return;
    updateChapter(selectedId, {
      title: title || selectedChapter?.title || "",
      content: html,
    });
    saveProject({ book: { ...book, title: bookTitle }, chapters });
  };

  const handleAI = async (mode) => {
    if (!hasChapter) return;
    
    // NEW: Use rate limiter for AI requests
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
      // Error is already handled by useAIAssistant
    }
  };

  /* ============================
     NEW: Enhanced Import with Document Parser
     Handles both .docx and HTML files
  ============================= */
  const handleImport = async (fileOrHtml, shouldSplit) => {
    setIsImporting(true);
    setImportProgress("Starting import...");

    try {
      let htmlContent;
      let parsedDocument = null;

      // Check if this is a File object (from file input) or HTML string
      if (fileOrHtml instanceof File) {
        const file = fileOrHtml;
        setImportProgress(`Processing ${file.name}...`);

        // Check file type
        if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          // Use document parser for Word files
          if (DEBUG_IMPORT) console.log("Parsing Word document with mammoth...");
          parsedDocument = await documentParser.parseWordDocument(file);
          
        } else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          // Use document parser for text files
          if (DEBUG_IMPORT) console.log("Parsing text document...");
          parsedDocument = await documentParser.parseTextDocument(file);
          
        } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          // Read HTML file
          htmlContent = await file.text();
          
        } else {
          throw new Error('Unsupported file type. Please upload .docx, .doc, .txt, .md, or .html files.');
        }

      } else if (typeof fileOrHtml === 'string') {
        // HTML string passed directly
        htmlContent = fileOrHtml;
      } else {
        throw new Error('Invalid import format');
      }

      // If we have a parsed document from documentParser, use it
      if (parsedDocument) {
        setImportProgress(`Importing ${parsedDocument.chapters.length} chapters...`);
        
        if (DEBUG_IMPORT) {
          console.log("Parsed document:", {
            title: parsedDocument.title,
            chapters: parsedDocument.chapters.length,
            wordCount: parsedDocument.totalWordCount,
          });
        }

        // Create chapters from parsed document
        for (let i = 0; i < parsedDocument.chapters.length; i++) {
          const chapter = parsedDocument.chapters[i];
          setImportProgress(`Creating chapter ${i + 1}/${parsedDocument.chapters.length}...`);
          
          const newId = addChapter();
          await new Promise((resolve) => setTimeout(resolve, 50));
          
          updateChapter(newId, {
            title: chapter.title,
            content: chapter.content,
          });
        }

        setImportProgress("");
        setIsImporting(false);
        
        alert(
          `✅ Document imported successfully!\n\n` +
          `• ${parsedDocument.chapters.length} chapters detected\n` +
          `• ${parsedDocument.totalWordCount.toLocaleString()} total words\n` +
          `• Table of contents generated`
        );
        
        setView("grid");
        return;
      }

      // Fall back to original HTML-based import logic
      if (!htmlContent) {
        throw new Error('No content to import');
      }

      if (!shouldSplit) {
        // Import into current chapter
        if (hasChapter) {
          setHtml(htmlContent);
          updateChapter(selectedId, {
            title: title || selectedChapter?.title || "",
            content: htmlContent,
          });
        }
        setImportProgress("");
        setIsImporting(false);
        alert("✅ Document imported into current chapter!");
        return;
      }

      // Split HTML into chapters (original logic)
      setImportProgress("Detecting chapters...");
      
      const root = document.createElement("div");
      root.innerHTML = htmlContent;

      const nodes = [];
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
        null
      );
      while (walker.nextNode()) nodes.push(walker.currentNode);

      const out = [];
      let buffer = "";
      let currentTitle = "";
      let n = 1;

      const push = () => {
        if (!buffer.trim()) return;
        out.push({ title: currentTitle || `Chapter ${n}`, content: buffer });
        n += 1;
        buffer = "";
        currentTitle = "";
      };

      for (const node of nodes) {
        if (isPageBreakNode(node)) {
          push();
          continue;
        }
        if (node.nodeType === 1) {
          if (isHeadingEl(node)) {
            const t = textOf(node);
            if (buffer.trim()) push();
            currentTitle = HEADING_MATCH.test(t) ? t : t || `Chapter ${n}`;
            continue;
          }
          if (node.tagName.toLowerCase() === "p") {
            const t = textOf(node);
            if (HEADING_MATCH.test(t)) {
              if (buffer.trim()) push();
              currentTitle = t;
              continue;
            }
          }
          buffer += node.outerHTML || "";
        }
      }
      if (buffer.trim()) push();

      if (out.length === 0) {
        setImportProgress("");
        setIsImporting(false);
        alert("No chapters detected. Use H1/H2/H3 or 'Chapter 1', 'Chapter 2', etc.");
        return;
      }

      // Create chapters
      for (let i = 0; i < out.length; i++) {
        const c = out[i];
        setImportProgress(`Creating chapter ${i + 1}/${out.length}...`);
        
        const newId = addChapter();
        await new Promise((r) => setTimeout(r, 30));
        updateChapter(newId, { title: c.title, content: c.content });
      }

      if (DEBUG_IMPORT) console.log("Imported chapters:", out.map((c) => c.title));
      
      setImportProgress("");
      setIsImporting(false);
      alert(`✅ Successfully imported ${out.length} chapters!`);
      setView("grid");

    } catch (error) {
      console.error("Import error:", error);
      setImportProgress("");
      setIsImporting(false);
      alert(`Error importing document:\n\n${error.message}\n\nPlease try again or check the file format.`);
    }
  };

  const handleExport = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chapter"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteCurrent = () => {
    if (!hasChapter) return;
    if (window.confirm(`Delete "${title || selectedChapter.title}"?\n\nThis cannot be undone.`)) {
      deleteChapter(selectedId);
      setTimeout(() => setView("grid"), 100);
    }
  };

  const handleDeleteMultiple = (ids) => {
    if (!ids?.length) return;
    if (!window.confirm(`Delete ${ids.length} chapter(s)? This cannot be undone.`)) return;

    ids.forEach((id) => deleteChapter(id));
    clearSelection();
    if (ids.includes(selectedId)) {
      setTimeout(() => setView("grid"), 100);
    }
  };

  const goBack = () => navigate("/dashboard");

  /* ============================
     Simple "loading" guard
  ============================= */
  if (!Array.isArray(chapters)) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-lg">Loading chapters...</div>
      </div>
    );
  }

  /* ============================
     Render
  ============================= */
  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      {/* ========== TOP BAR ========== */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 h-auto py-2 flex items-center gap-3 overflow-x-auto">
          {/* Gold Dashboard Button */}
          <GoldButton onClick={goBack} title="Back to Dashboard">
            ← Dashboard
          </GoldButton>

          {/* Breadcrumb */}
          <WritingCrumb view={view} />

          {/* View Toggle */}
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

          {/* Select Mode Toggle */}
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

          {/* Selection toolbar */}
          {selectMode && selectedIds.size > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-md border border-blue-200">
              <span className="text-xs font-medium text-blue-900">
                {selectedIds.size} selected
              </span>
              <button
                onClick={() => handleDeleteMultiple(Array.from(selectedIds))}
                className="text-xs px-2 py-0.5 rounded bg-red-500 text-white hover:bg-red-600"
                title="Delete Selected"
              >
                🗑️ Delete
              </button>
              <button
                onClick={clearSelection}
                className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-white hover:bg-slate-50"
                title="Clear Selection"
              >
                Clear
              </button>
            </div>
          )}

          {/* Provider Selector */}
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

          {/* NEW: Queue status indicator */}
          {queueLength > 0 && (
            <div className="ml-2 flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200">
              <span className="text-xs text-blue-700">
                ⏳ {queueLength} AI request{queueLength !== 1 ? 's' : ''} queued
              </span>
            </div>
          )}

          {/* NEW: Import progress indicator */}
          {isImporting && (
            <div className="ml-2 flex items-center gap-2 px-3 py-1 bg-amber-50 rounded border border-amber-200">
              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-amber-700">{importProgress}</span>
            </div>
          )}

          <div className="w-full sm:flex-1" />

          {/* Editor Toolbar */}
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

      {/* ========== GRID VIEW ========== */}
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
          {/* Trash Dock for grid view */}
          <TrashDock onDelete={handleDeleteMultiple} />
        </>
      )}

      {/* ========== EDITOR VIEW ========== */}
      {view === "editor" && (
        <div
          className="max-w-7xl mx-auto px-4 py-6 grid gap-6"
          style={{ gridTemplateColumns: "280px minmax(0, 1fr)", minWidth: 1024 }}
        >
          {/* Left Sidebar */}
          <aside className="sticky top-16 space-y-3" style={{ zIndex: 10 }}>
            {/* Publishing Meta */}
            <PublishingMeta
              bookTitle={bookTitle}
              setBookTitle={setBookTitle}
              author={author}
              setAuthor={setAuthor}
              onPublishingPrep={() => {}}
              aiBusy={aiBusy}
              aiError={aiError}
            />

            {/* AI Instructions */}
            <AIInstructions
              instructions={instructions}
              setInstructions={setInstructions}
              chapterTitle={selectedChapter?.title}
              onGeneratePrompt={() => {
                if (hasChapter) generateChapterPrompt(selectedChapter);
              }}
              aiBusy={aiBusy}
            />

            {/* Chapters List */}
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

          {/* Trash Dock - Drag chapters here to delete */}
          <TrashDock onDelete={handleDeleteMultiple} />
        </div>
      )}
    </div>
  );
}

