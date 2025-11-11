

// src/components/ComposePage.jsx
// Main Container - Orchestrates all components
// Preserves all visual design, brand colors, and functionality

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// At the top of ComposePage.jsx, you should have:
import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import PublishingMeta from "./Editor/PublishingMeta";
import AIInstructions from "./Editor/AIInstructions";

// Custom hooks
import { useChapterManager } from "../hooks/useChapterManager";
import { useAIAssistant } from "../hooks/useAIAssistant";

// Utils
import { GoldButton, WritingCrumb } from "./UI/UIComponents";

/* ============================
   Main Compose Page
============================ */
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
    deleteChapter,  // ← ADDED THIS
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
    updateChapter(selectedId, {
      title: title || selectedChapter.title,
      content: html,
    });
    saveProject({ book: { ...book, title: bookTitle }, chapters });
  };

  // Handle AI operations
  const handleAI = async (mode) => {
    const result = await runAI(mode, html, instructions, provider);
    if (result) {
      setHtml(result);
      updateChapter(selectedId, {
        title: title || selectedChapter.title,
        content: result,
      });
    }
  };

  // Handle import - COMPLETELY REWRITTEN
  const handleImport = async (htmlContent, shouldSplit) => {
    console.log("📥 Import started, shouldSplit:", shouldSplit);
    
    if (shouldSplit) {
      // Split into chapters by headings
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      console.log("📄 Total elements in document:", tempDiv.children.length);
      
      const chapterData = [];
      let currentChapter = { content: "", title: "" };
      let chapterNumber = 1;
      
      // Process each element
      Array.from(tempDiv.children).forEach((element, idx) => {
        const tagName = element.tagName.toLowerCase();
        console.log(`Element ${idx}: ${tagName}`, element.textContent.substring(0, 50));
        
        // If we hit a heading, save previous chapter and start new one
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          // Save previous chapter if it has content
          if (currentChapter.content.trim()) {
            console.log(`✅ Saving chapter: "${currentChapter.title}"`);
            chapterData.push({
              title: currentChapter.title || `Chapter ${chapterNumber}`,
              content: currentChapter.content,
            });
            chapterNumber++;
          }
          
          // Start new chapter with this heading as title
          currentChapter = {
            title: element.textContent.trim() || `Chapter ${chapterNumber}`,
            content: "",
          };
          console.log(`📖 New chapter started: "${currentChapter.title}"`);
        } else {
          // Add content to current chapter
          currentChapter.content += element.outerHTML;
        }
      });
      
      // Don't forget the last chapter
      if (currentChapter.content.trim()) {
        console.log(`✅ Saving final chapter: "${currentChapter.title}"`);
        chapterData.push({
          title: currentChapter.title || `Chapter ${chapterNumber}`,
          content: currentChapter.content,
        });
      }
      
      console.log(`📊 Total chapters to create: ${chapterData.length}`);
      
      if (chapterData.length === 0) {
        alert("No chapters found. The document may not have proper headings (H1, H2, or H3).");
        return;
      }
      
      // Create chapters one at a time with proper delay
      for (let i = 0; i < chapterData.length; i++) {
        const data = chapterData[i];
        console.log(`Creating chapter ${i + 1}/${chapterData.length}: "${data.title}"`);
        
        const newId = addChapter();
        
        // Wait a tiny bit before updating
        await new Promise(resolve => setTimeout(resolve, 50));
        
        updateChapter(newId, {
          title: data.title,
          content: data.content,
        });
      }
      
      alert(`✅ Successfully imported ${chapterData.length} chapters!`);
      setView("grid");
      
    } else {
      // Import into current chapter (no splitting)
      console.log("📥 Importing into current chapter");
      setHtml(htmlContent);
      updateChapter(selectedId, {
        title: title || selectedChapter.title,
        content: htmlContent,
      });
      alert("✅ Document imported into current chapter!");
    }
  };

  // Handle export
  const handleExport = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'chapter'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle delete current chapter
  const handleDeleteCurrent = () => {
    if (!selectedChapter) {
      console.log("❌ No chapter selected");
      return;
    }
    
    console.log("🗑️ Delete button clicked for:", selectedChapter.title);
    
    if (window.confirm(`Delete "${title || selectedChapter.title}"?\n\nThis cannot be undone.`)) {
      console.log("✅ User confirmed delete");
      deleteChapter(selectedId);
      
      // Switch to grid view after delete
      setTimeout(() => {
        setView("grid");
      }, 100);
    } else {
      console.log("❌ User cancelled delete");
    }
  };

  const goBack = () => navigate("/dashboard");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
        {/* ========== TOP BAR ========== */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-3 h-auto py-2 flex flex-wrap items-center gap-3">
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
      // Force two columns at all sizes (no responsive collapse)
      gridTemplateColumns: "280px minmax(0, 1fr)",
      // Optional guard if your work setup embeds in a narrow panel
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
        onPublishingPrep={() => {}}
        aiBusy={aiBusy}
        aiError={aiError}
      />

      {/* AI Instructions */}
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
      pageWidth={1000}  // optional: wider canvas
    />
  </div>
)}
