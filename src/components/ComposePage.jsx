// src/components/ComposePage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import TrashDock from "./Writing/TrashDock";

import { useChapterManager } from "../hooks/useChapterManager";
import { GoldButton, WritingCrumb } from "./UI/UIComponents";

import { documentParser } from "../utils/documentParser";
import { rateLimiter } from "../utils/rateLimiter";

import { runAssistant } from "../lib/api";
import { Sparkles } from "lucide-react";

import {
  computeWordsFromChapters,
  syncProjectForCurrentStory,
  computeCharactersFromChapters, // 🔹 character helper
} from "../lib/projectsSync";

const CURRENT_STORY_KEY = "currentStory";
const USER_PROJECTS_KEY = "userProjects";
const PUBLISHING_DRAFT_KEY = "publishingDraft";

function saveCurrentStorySnapshot({ title }) {
  if (!title) return;
  try {
    const snapshot = {
      id: "main",
      title: title.trim(),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CURRENT_STORY_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.error("Failed to save currentStory:", err);
  }
}

function upsertUserProject({ title, ...rest }) {
  if (!title) return;
  try {
    const t = title.trim();
    if (!t) return;

    const raw = localStorage.getItem(USER_PROJECTS_KEY);
    let arr = [];
    try {
      arr = raw ? JSON.parse(raw) : [];
    } catch {
      arr = [];
    }
    if (!Array.isArray(arr)) arr = [];

    const index = arr.findIndex((p) => p && p.title === t);

    const base = {
      title: t,
      status: "Draft",
      source: "Project",
      updatedAt: new Date().toISOString(),
      ...rest,
    };

    if (index >= 0) {
      arr[index] = { ...arr[index], ...base };
    } else {
      arr.push(base);
    }

    localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(arr));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to update userProjects:", err);
  }
}

const DEBUG_IMPORT = false;

const applyDoubleSpacing = (text = "") => {
  if (!text) return "";

  if (text.includes("<p")) {
    return text
      .replace(/\r\n/g, "\n")
      .replace(/<\/p>/g, "</p><p>&nbsp;</p>")
      .replace(/(<p>&nbsp;<\/p>){3,}/g, "<p>&nbsp;</p><p>&nbsp;</p>");
  }

  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n");
};

export default function ComposePage() {
  const navigate = useNavigate();

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

  const [aiBusy, setAiBusy] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [instructions, setInstructions] = useState("");

  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const chapters = useMemo(
    () =>
      Array.isArray(rawChapters)
        ? rawChapters.filter((c) => c && c.id != null)
        : [],
    [rawChapters]
  );

  const [view, setView] = useState("grid");

  const [title, setTitle] = useState(selectedChapter?.title ?? "");
  const [html, setHtml] = useState(selectedChapter?.content ?? "");

  const [author, setAuthor] = useState("Jacqueline Session Ausby");
  const [bookTitle, setBookTitle] = useState(book?.title || "Raising Daisy");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const lastClickedIndexRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [queueLength, setQueueLength] = useState(0);

  const [saveStatus, setSaveStatus] = useState("idle");

  const [headings, setHeadings] = useState([]);

  const [activeAiTab, setActiveAiTab] = useState("proofread");

  const hasChapter = !!selectedId && !!selectedChapter;

  // 🔹 Characters detected from @char: tags across all chapters
  const { characters, characterCount } = useMemo(
    () => computeCharactersFromChapters(chapters || []),
    [chapters]
  );

  const chapterPlainText = useMemo(() => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }, [html]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(rateLimiter.getQueueLength());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dt_activeAiTab");
      if (stored) setActiveAiTab(stored);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      if (activeAiTab) {
        localStorage.setItem("dt_activeAiTab", activeAiTab);
      }
    } catch {
      // ignore
    }
  }, [activeAiTab]);

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

  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    }
    setHeadings([]);
  }, [selectedId, selectedChapter]);

  // Save with visual feedback
  const handleSave = async () => {
    if (!hasChapter) return;
    if (saveStatus === "saving") return;

    setSaveStatus("saving");

    try {
      updateChapter(selectedId, {
        title: title || selectedChapter?.title || "",
        content: html,
      });

      const totalWords = computeWordsFromChapters(chapters || []);
      const chapterCount = Array.isArray(chapters) ? chapters.length : 0;

      // 🔹 compute characters from @char: tags
      const { characterCount: computedCharacterCount } =
        computeCharactersFromChapters(chapters || []);

      await Promise.resolve(
        saveProject({
          book: { ...book, title: bookTitle },
          stats: {
            wordCount: totalWords,
            chapterCount,
            characterCount: computedCharacterCount,
          },
        })
      );

      const safeTitle =
        (bookTitle && bookTitle.trim()) ||
        (book?.title && book.title.trim()) ||
        "Untitled Book";

      saveCurrentStorySnapshot({ title: safeTitle });

      upsertUserProject({
        title: safeTitle,
        wordCount: totalWords,
        chapterCount,
        characterCount: computedCharacterCount,
      });

      syncProjectForCurrentStory({
        wordCount: totalWords,
        targetWords: 50000,
        characterCount: computedCharacterCount,
      });

      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("idle");
    }
  };

  const handleRenameChapter = (chapterId, newTitle) => {
    if (!chapterId || !newTitle) return;
    updateChapter(chapterId, {
      title: newTitle,
    });
  };

  const resolveAIMode = (mode) => {
    switch (mode) {
      case "proofread":
        return "proofread";
      case "clarify":
        return "clarify";
      case "readability":
        return "readability";
      case "rewrite":
        return "rewrite";
      default:
        return "improve";
    }
  };

  const handleAI = async (mode, targetHtmlOverride) => {
    if (!hasChapter) return;

    const MAX_CHARS = 3000;
    const action = resolveAIMode(mode);

    const fullHtml = (html || "").toString();
    let target = "";
    let useSelection = false;

    let prevScrollTop = 0;
    if (typeof window !== "undefined") {
      try {
        const editorEl = document.querySelector(".ql-editor");
        const scroller =
          editorEl?.parentElement ||
          editorEl?.closest(".ql-container") ||
          null;

        if (scroller) {
          prevScrollTop = scroller.scrollTop || 0;
        }
      } catch (err) {
        console.warn("Could not read editor scroll position:", err);
      }
    }

    if (!targetHtmlOverride && typeof window !== "undefined") {
      try {
        const selection = window.getSelection();
        const editorEl = document.querySelector(".ql-editor");

        if (
          selection &&
          selection.rangeCount > 0 &&
          editorEl &&
          editorEl.contains(selection.getRangeAt(0).commonAncestorContainer)
        ) {
          const range = selection.getRangeAt(0);
          const container = document.createElement("div");
          container.appendChild(range.cloneContents());
          const selectedHtml = container.innerHTML.trim();

          if (selectedHtml) {
            useSelection = true;
            target = selectedHtml.slice(0, MAX_CHARS);
          }
        }
      } catch (err) {
        console.warn("AI selection detection failed, falling back:", err);
      }
    }

    if (!useSelection) {
      const raw = (targetHtmlOverride ?? fullHtml) || "";
      target = raw.slice(0, MAX_CHARS);
    }

    if (!target || !target.trim()) return;

    try {
      setAiBusy(true);

      const result = await rateLimiter.addToQueue(async () =>
        runAssistant(target, action, instructions || "", provider)
      );

      const resultTextRaw =
        (result &&
          (result.result || result.text || result.output || result.data)) ||
        result ||
        "";

      if (!resultTextRaw) {
        alert(
          "The AI did not return any text. Please try again with a smaller section or a different mode."
        );
        return;
      }

      const resultText = applyDoubleSpacing(resultTextRaw);

      let combinedHtml = fullHtml;

      if (useSelection) {
        const idx = fullHtml.indexOf(target);

        if (idx !== -1) {
          combinedHtml =
            fullHtml.slice(0, idx) +
            resultText +
            fullHtml.slice(idx + target.length);
        } else {
          const replacedOnce = fullHtml.replace(target, resultText);
          combinedHtml =
            replacedOnce === fullHtml ? resultText + fullHtml : replacedOnce;
        }
      } else {
        const remainder = fullHtml.slice(target.length);
        combinedHtml = resultText + remainder;
      }

      setHtml(combinedHtml);
      updateChapter(selectedId, {
        title: title || selectedChapter?.title || "",
        content: combinedHtml,
      });

      if (typeof window !== "undefined") {
        setTimeout(() => {
          try {
            const editorEl = document.querySelector(".ql-editor");
            const scroller =
              editorEl?.parentElement ||
              editorEl?.closest(".ql-container") ||
              null;

            if (scroller && typeof prevScrollTop === "number") {
              scroller.scrollTop = prevScrollTop;
            }
          } catch (err) {
            console.warn("Could not restore editor scroll position:", err);
          }
        }, 50);
      }
    } catch (error) {
      console.error("AI request error:", error);
      alert(
        "There was an error calling the AI service. Please try again in a moment."
      );
    } finally {
      setAiBusy(false);
    }
  };

  const handleAssistantSend = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage = {
      role: "user",
      content: text,
      id: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatBusy(true);

    try {
      const snippet = chapterPlainText.slice(0, 1500) || "";

      const instructionsText = [
        `You are the DahTruth StoryLab writing assistant.`,
        `The user is working on a chapter titled "${title || "Untitled Chapter"}".`,
        `When you suggest edits, please quote or clearly separate your suggested text so it can be copy-pasted into the manuscript.`,
        snippet
          ? `Here is an excerpt of the chapter for context:\n\n${snippet}`
          : `There is no chapter text yet; answer based on the question only.`,
      ].join("\n\n");

      const res = await rateLimiter.addToQueue(() =>
        runAssistant(text, "clarify", instructionsText, provider)
      );

      const replyText =
        (res && (res.result || res.text || res.output || res.data)) || "";

      const assistantMessage = {
        role: "assistant",
        content:
          replyText ||
          "I couldn't generate a response. Please try asking your question in a different way.",
        id: Date.now() + 1,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error reaching the assistant. Please try again in a moment.",
          id: Date.now() + 2,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const handleAssistantKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAssistantSend();
    }
  };

  const handleImport = async (file, options = {}) => {
    if (!file) return;

    const { splitByHeadings = true } = options;

    setIsImporting(true);
    setImportProgress("Parsing document...");

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
        console.log("Parsed document:", {
          title: parsed.title,
          chapters: parsed.chapters?.length,
          totalWordCount: parsed.totalWordCount,
        });
      }

      if (parsed.title && parsed.title !== bookTitle) {
        setBookTitle(parsed.title);
      }

      if (splitByHeadings && parsed.chapters && parsed.chapters.length > 0) {
        setImportProgress(
          `Creating ${parsed.chapters.length} chapter(s) from "${file.name}"...`
        );

        for (const c of parsed.chapters) {
          const newId = addChapter();
          const doubleSpacedContent = applyDoubleSpacing(c.content || "");
          updateChapter(newId, {
            title: c.title || "Untitled Chapter",
            content: doubleSpacedContent,
          });
        }

        alert(
          `✅ Imported ${parsed.chapters.length} chapter(s) from "${file.name}".`
        );
      } else {
        setImportProgress("Importing manuscript into a single chapter...");

        const fullContentRaw =
          parsed.fullContent ||
          (parsed.chapters && parsed.chapters.length
            ? parsed.chapters.map((c) => c.content || "").join("\n\n")
            : "");

        const fullContent = applyDoubleSpacing(fullContentRaw);

        if (hasChapter) {
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
          const newId = addChapter();
          updateChapter(newId, {
            title: parsed.title || "Imported Manuscript",
            content: fullContent,
          });
          setSelectedId(newId);
          setView("editor");
        }

        alert(
          `✅ Document imported into a single chapter from "${file.name}".`
        );
      }

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

  const handleSendToPublishing = async () => {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      alert("You need at least one chapter before sending to Publishing.");
      return;
    }

    await handleSave();

    try {
      const payload = {
        book: {
          ...book,
          title: bookTitle,
          status: "ReadyForPublishing",
          updatedAt: new Date().toISOString(),
        },
        chapters,
      };

      localStorage.setItem(PUBLISHING_DRAFT_KEY, JSON.stringify(payload));

      upsertUserProject({
        title: bookTitle || book?.title || "Untitled Book",
      });

      navigate("/publishing");
    } catch (err) {
      console.error("Failed to send manuscript to publishing:", err);
      alert("Something went wrong sending this to Publishing. Please try again.");
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
    if (
      window.confirm(
        `Delete "${title || selectedChapter.title}"?\n\nThis cannot be undone.`
      )
    ) {
      deleteChapter(selectedId);
      setTimeout(() => setView("grid"), 100);
    }
  };

  const handleDeleteMultiple = (ids) => {
    if (!ids?.length) return;
    if (
      !window.confirm(`Delete ${ids.length} chapter(s)? This cannot be undone.`)
    )
      return;

    ids.forEach((id) => deleteChapter(id));
    clearSelection();
    if (ids.includes(selectedId)) {
      setTimeout(() => setView("grid"), 100);
    }
  };

  const goBack = () => navigate("/dashboard");

  if (!Array.isArray(chapters)) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-lg">Loading chapters...</div>
      </div>
    );
  }

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
                view === "editor"
                  ? "bg-slate-100"
                  : "bg-white hover:bg-slate-50"
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
              selectMode
                ? "bg-blue-100 border-blue-300"
                : "bg-white hover:bg-slate-50",
            ].join(" ")}
            title="Toggle Select Mode"
          >
            {selectMode ? "✓ Select" : "Select"}
          </button>

          {/* Quick AI run button */}
          <button
            onClick={() => handleAI(activeAiTab || "proofread")}
            disabled={!hasChapter || aiBusy || isImporting}
            className={[
              "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[13px]",
              "bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}
            title="Run AI on the current chapter or selected text"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Run AI</span>
          </button>

          {/* Send to Publishing */}
          <button
            type="button"
            onClick={handleSendToPublishing}
            disabled={!hasChapter || saveStatus === "saving"}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] bg-[var(--brand-gold)] text-white hover:bg-amber-600 disabled:opacity-60"
            title="Lock in this manuscript and open the Publishing workspace"
          >
            <span>Send to Publishing</span>
          </button>

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
            aiBusy={aiBusy || isImporting || chatBusy}
            saveStatus={saveStatus}
            activeAiTab={activeAiTab}
            setActiveAiTab={setActiveAiTab}
            onToggleAssistant={() => setShowAssistant((prev) => !prev)}
            assistantOpen={showAssistant}
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
          style={{
            gridTemplateColumns: showAssistant
              ? "280px minmax(0, 1fr) 320px"
              : "280px minmax(0, 1fr)",
            minWidth: showAssistant ? 1280 : 1024,
          }}
        >
          {/* Left Sidebar */}
          <aside className="sticky top-16 space-y-3" style={{ zIndex: 10 }}>
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
              onRenameChapter={handleRenameChapter}
            />

            {/* TOC */}
            {headings.length > 0 && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Table of Contents
                </div>
                <ul className="space-y-1 max-h-64 overflow-auto text-xs">
                  {headings.map((h, idx) => (
                    <li
                      key={`${h.level}-${idx}-${h.text}`}
                      className="text-slate-700"
                    >
                      <span
                        className={
                          h.level === "h1"
                            ? "font-semibold"
                            : h.level === "h2"
                            ? "ml-2"
                            : "ml-4 text-slate-500"
                        }
                      >
                        {h.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Character Manager – based on @char: tags */}
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                <span>Characters</span>
                <span className="text-[11px] text-slate-500">
                  {characterCount} tagged
                </span>
              </div>

              {characterCount === 0 ? (
                <p className="text-[11px] text-slate-500 leading-snug">
                  No characters tagged yet.
                  <br />
                  Introduce a character in your manuscript as{" "}
                  <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                    @char: John Smith
                  </span>{" "}
                  the first time they appear.
                </p>
              ) : (
                <ul className="space-y-1 max-h-40 overflow-auto text-xs">
                  {characters.map((name) => (
                    <li
                      key={name}
                      className="flex items-center justify-between text-slate-700"
                    >
                      <span className="truncate">{name}</span>
                      {/* placeholder for future: role / arc badges */}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* Main Editor */}
          <EditorPane
            title={title}
            setTitle={setTitle}
            html={html}
            setHtml={setHtml}
            onSave={handleSave}
            onAI={handleAI}
            aiBusy={aiBusy || chatBusy}
            pageWidth={1000}
            onHeadingsChange={setHeadings}
          />

          {/* Right-hand AI Assistant chat panel */}
          {showAssistant && (
            <section className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-[calc(100vh-8rem)]">
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    AI Assistant
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ask questions about your chapter. Copy any suggestions you
                    like into the editor.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssistant(false)}
                  className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
                {chatMessages.length === 0 && (
                  <p className="text-[12px] text-slate-500 mt-2">
                    Example questions:
                    <br />
                    • “Help me tighten this opening paragraph.”
                    <br />
                    • “Is this dialogue too on the nose?”
                    <br />
                    • “Suggest a stronger closing sentence.”
                  </p>
                )}

                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={
                      msg.role === "user"
                        ? "self-end max-w-[80%] rounded-lg bg-indigo-50 px-3 py-2 text-xs"
                        : "self-start max-w-[80%] rounded-lg bg-slate-50 px-3 py-2 text-xs"
                    }
                  >
                    <div className="whitespace-pre-wrap text-slate-800">
                      {msg.content}
                    </div>

                    {msg.role === "assistant" && (
                      <div className="mt-1 flex gap-2 text-[10px] text-slate-500">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(msg.content);
                              alert("Copied to clipboard");
                            } catch (e) {
                              alert(
                                "Could not copy. You can still select and copy manually."
                              );
                            }
                          }}
                          className="px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100"
                        >
                          Copy
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAssistantSend();
                }}
                className="border-t border-slate-200 p-2 space-y-2"
              >
                <textarea
                  rows={3}
                  className="w-full resize-none rounded-md border border-slate-300 px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                  placeholder="Ask the assistant a question about your scene, character, or sentence..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleAssistantKeyDown}
                  disabled={chatBusy}
                />
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Press Enter to send, Shift+Enter for a new line.
                  </div>
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || chatBusy}
                    className="text-[13px] px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {chatBusy ? "Thinking…" : "Send"}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
