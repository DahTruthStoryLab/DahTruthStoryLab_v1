// src/components/ComposePage.jsx
// Main Container - Orchestrates all components
// Preserves all visual design, brand colors, and functionality

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import PublishingMeta from "./Editor/PublishingMeta";
import AIInstructions from "./Editor/AIInstructions";

import { useChapterManager } from "../hooks/useChapterManager";
import { useAIAssistant } from "../hooks/useAIAssistant";

import { GoldButton, WritingCrumb } from "./UI/UIComponents";

/* ============================
   Debug toggle for import logs
============================= */
const DEBUG_IMPORT = false; // set true to see detailed console logs during import/split

export default function ComposePage() {
  const navigate = useNavigate();

  // Chapter management (state, CRUD operations)
  const {
    book,
    setBook,
    chapters,
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
    setAiError,
    instructions,
    setInstructions,
    provider,
    setProvider,
    generateChapterPrompt,
  } = useAIAssistant();

  // View state: 'grid' or 'editor'
  const [view, setView] = useState("grid");

  // Editor state
  const [title, setTitle] = useState(selectedChapter?.title || "");
  const [html, setHtml] = useState(selectedChapter?.content || "");

  // Publishing metadata
  const [author, setAuthor] = useState("Jacqueline Session Ausby");
  const [bookTitle, setBookTitle] = useState(book?.title || "Raising Daisy");

  // Sync editor when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    }
  }, [selectedId, selectedChapter]);

  // Handle save
  const handleSave = () => {
    if (!selectedId) return;
    updateChapter(selectedId, {
      title: title || selectedChapter?.title || "",
      content: html,
    });
    saveProject({ book: { ...book, title: bookTitle }, chapters });
  };

  // Handle AI operations
  const handleAI = async (mode) => {
    const result = await runAI(mode, html, instructions, provider);
    if (result) {
      setHtml(result);
      if (selectedId) {
        updateChapter(selectedId, {
          title: title || selectedChapter?.title || "",
          content: result,
        });
      }
    }
  };

  // Handle import (with optional split by headings)
  const handleImport = async (htmlContent, shouldSplit) => {
    if (DEBUG_IMPORT) console.log("📥 Import started, shouldSplit:", shouldSplit);

    if (shouldSplit) {
      const t0 = performance.now();
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;

      if (DEBUG_IMPORT) {
        console.log("📄 Total elements in document:", tempDiv.children.length);
      }

      const chapterData = [];
      let currentChapter = { content: "", title: "" };
      let chapterNumber = 1;

      Array.from(tempDiv.children).forEach((element, idx) => {
        const tagName = element.tagName.toLowerCase();
        if (DEBUG_IMPORT) {
          console.log(
            `Element ${idx}: <${tagName}>`,
            (element.textContent || "").trim().slice(0, 120)
          );
        }

        // Heading starts a new chapter
        if (tagName === "h1" || tagName === "h2" || tagName === "h3") {
          if (currentChapter.content.trim()) {
            if (DEBUG_IMPORT) {
              console.log(`✅ Saving chapter: "${currentChapter.title}"`);
            }
            chapterData.push({
              title: currentChapter.title || `Chapter ${chapterNumber}`,
              content: currentChapter.content,
            });
            chapterNumber++;
          }
          currentChapter = {
            title: (element.textContent || "").trim() || `Chapter ${chapterNumber}`,
            content: "",
          };
          if (DEBUG_IMPORT) console.log(`📖 New chapter started: "${currentChapter.title}"`);
        } else {
          // Accumulate content
          currentChapter.content += element.outerHTML;
        }
      });

      // Final chapter
      if (currentChapter.content.trim()) {
        if (DEBUG_IMPORT) console.log(`✅ Saving final chapter: "${currentChapter.title}"`);
        chapterData.push({
          title: currentChapter.title || `Chapter ${chapterNumber}`,
          content: currentChapter.content,
        });
      }

      if (DEBUG_IMPORT) console.log(`📊 Total chapters to create: ${chapterData.length}`);

      if (chapterData.length === 0) {
        alert("No chapters found. The document may not have proper headings (H1, H2, or H3).");
        return;
      }

      // Create chapters one at a time (small delay for UI responsiveness)
      for (let i = 0; i < chapterData.length; i++) {
        const data = chapterData[i];
        if (DEBUG_IMPORT) {
          console.log(`🛠️ Creating chapter ${i + 1}/${chapterData.length}: "${data.title}"`);
        }
        const newId = addChapter();
        await new Promise((resolve) => setTimeout(resolve, 50));
        updateChapter(newId, { title: data.title, content: data.content });
      }

      const t1 = performance.now();
      if (DEBUG_IMPORT) console.log(`⏱️ Import complete in ${(t1 - t0).toFixed(0)} ms`);
      alert(`✅ Successfully imported ${chapterData.length} chapters!`);
      setView("grid");
    } else {
      if (DEBUG_IMPORT) console.log("📥 Importing into current chapter");
      setHtml(htmlContent);
      if (selectedId) {
        updateChapter(selectedId, {
          title: title || selectedChapter?.title || "",
          content: htmlContent,
        });
      }
      alert("✅ Document imported into current chapter!");
    }
  };

  // Handle export
  const handleExport = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chapter"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle delete current chapter
  const handleDeleteCurrent = () => {
    if (!selectedChapter || !selectedId) return;
    if (window.confirm(`Delete "${title || selectedChapter.title}"?\n\nThis cannot be undone.`)) {
      deleteChapter(selectedId);
      setTimeout(() => setView("grid"), 100);
    }
  };

  const goBack = () => navigate("/dashboard");

  return (
    <DndProvider backend={HTML5Backend}>
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

            <div className="w-full sm:flex-1" />

            {/* Editor Toolbar - All AI buttons, Save, etc. */}
            <EditorToolbar
              onAI={handleAI}
              onSave={handleSave}
              onImport={handleImport}
              onExport={handleExport}
              onDelete={handleDeleteCurrent}
              aiBusy={aiBusy}
            />
          </div>
        </div>

        {/* ========== GRID VIEW ========== */}
        {view === "grid" && (
          <ChapterGrid
            chapters={chapters}
            selectedId={selectedId}
            onSelectChapter={(id) => {
              setSelectedId(id);
              setView("editor");
            }}
            onAddChapter={addChapter}
            onMoveChapter={moveChapter}
            onDeleteChapter={deleteChapter}
          />
        )}

        {/* ========== EDITOR VIEW ========== */}
        {view === "editor" && (
          <div
            className="max-w-7xl mx-auto px-4 py-6 grid gap-6"
            style={{
              // Force two columns at all widths (prevents sidebar from becoming a top bar)
              gridTemplateColumns: "280px minmax(0, 1fr)",
              // Guard for narrow work panels/iframes
              minWidth: 1024,
            }}
          >
            {/* Left Sidebar */}
            <aside className="sticky top-16 space-y-3" style={{ zIndex: 10 }}>
              {/* Publishing Meta */}
              <PublishingMeta
                bookTitle={bookTitle}
                setBookTitle={setBookTitle}
                author={author}
                setAuthor={setAuthor}
                onPublishingPrep={() => {
                  // reserved for publishing prep flow
                }}
                aiBusy={aiBusy}
                aiError={aiError}
              />

              {/* AI Instructions / prompt button */}
              <AIInstructions
                instructions={instructions}
                setInstructions={setInstructions}
                chapterTitle={selectedChapter?.title}
                onGeneratePrompt={() => generateChapterPrompt(selectedChapter)}
                aiBusy={aiBusy}
              />

              {/* Chapters List */}
              <ChapterSidebar
                chapters={chapters}
                selectedId={selectedId}
                onSelectChapter={setSelectedId}
                onAddChapter={addChapter}
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
              pageWidth={1000} // wider canvas; adjust if you like
            />
          </div>
        )}
      </div>
    </DndProvider>
  );
}
