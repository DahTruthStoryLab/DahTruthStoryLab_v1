// src/components/ComposePage.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import ChapterSidebar from "./Writing/ChapterSidebar";
import EditorToolbar from "./Editor/EditorToolbar";
import TrashDock from "./Writing/TrashDock";
import SearchPanel from "./Writing/SearchPanel";
import PaginatedView from "./Writing/PaginatedView";

import { useChapterManager } from "../hooks/useChapterManager";
import { documentParser } from "../utils/documentParser";
import { rateLimiter } from "../utils/rateLimiter";
import { createPortal } from "react-dom";

import { runAssistant } from "../lib/api";
import {
  Sparkles,
  Search,
  FileText,
  ChevronDown,
  FolderOpen,
  Download,
  Save,
  Grid3X3,
  Edit3,
  CheckSquare,
  Wand2,
  BookCheck,
  MessageSquare,
  RefreshCw,
  Eye,
  Send,
  ArrowLeft,
  PenLine,
  Trash2,
} from "lucide-react";

import {
  computeWordsFromChapters,
  syncProjectForCurrentStory,
  computeCharactersFromChapters,
  ensureSelectedProject,
  upsertProjectMeta,
  chaptersKeyForProject,
  setSelectedProjectId,
  getSelectedProjectId,
} from "../lib/projectsSync";

const CURRENT_STORY_KEY = "currentStory";
const USER_PROJECTS_KEY = "userProjects";
const PUBLISHING_DRAFT_KEY = "publishingDraft";

const DEBUG_IMPORT = false;

// Strip @char: markers for final output (but keep the names)
function stripCharacterTags(html = "") {
  if (!html) return "";
  return html.replace(/@char:\s*/g, "");
}

// Remove spacer paragraphs like <p>&nbsp;</p> that you don't want in Publishing
function stripSpacerParagraphs(html = "") {
  if (!html) return "";
  return html.replace(/<p>(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, "");
}

// Helper: normalize to "double spaced" paragraphs on import / AI
// NOW: 3 blank lines between paragraphs
const applyDoubleSpacing = (text = "") => {
  if (!text) return "";

  // If it already looks like HTML, convert paragraph breaks
  if (/<\/p>/i.test(text)) {
    return text
      .replace(/<\/p>\s*<p>/gi, "</p>\n\n\n\n<p>")
      .replace(/(<p>)/gi, "$1");
  }

  // Plain text → use 3 blank lines between paragraphs
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n\n\n")
    .replace(/\n{5,}/g, "\n\n\n\n")
    .trim();
};

// Save a simple "current story" snapshot for ProjectPage to read
function saveCurrentStorySnapshot({ id, title }) {
  if (!title) return;
  try {
    const snapshot = {
      id: id || getSelectedProjectId() || "unknown",
      title: title.trim(),
      status: "Draft",
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(CURRENT_STORY_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.error("Failed to save currentStory:", err);
  }
}

// Maintain a small list of projects/novels in localStorage
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

// Helper to strip HTML to text (for detecting blank chapters)
const stripHtml = (html = "") => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Convert cleaned HTML → plain text for Publishing AI + exports
function htmlToPlainText(html = "") {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* =========================================================
   DROPDOWN MENU COMPONENTS
========================================================= */
function DropdownMenu({ label, icon: Icon, children, disabled = false }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 180 });

  const close = () => setOpen(false);

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 8,
      left: r.left,
      width: Math.max(180, r.width),
    });
  };

  useEffect(() => {
    if (!open) return;

    computePos();

    const onDocMouseDown = (e) => {
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;
      if (btn.contains(e.target) || menu.contains(e.target)) return;
      close();
    };

    const onScrollOrResize = () => computePos();

    document.addEventListener("mousedown", onDocMouseDown, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (disabled) return;
          console.log(`[Dropdown] ${label} clicked`);
          setOpen((v) => !v);
        }}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          border border-slate-200 bg-white hover:bg-slate-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? "bg-slate-100 border-slate-300" : ""}
        `}
      >
        {Icon && <Icon size={16} className="text-slate-600" />}
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 999999,
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-lg py-1"
          >
            {React.Children.map(children, (child) =>
              child ? React.cloneElement(child, { closeMenu: close }) : null
            )}
          </div>,
          document.body
        )}
    </>
  );
}

// FIXED: Execute action immediately (preserves user gesture), then close menu
function DropdownItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  shortcut,
  closeMenu,
}) {
  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (closeMenu) closeMenu();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left
        hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
        ${active ? "bg-amber-50 text-amber-800" : "text-slate-700"}
      `}
    >
      {Icon && (
        <Icon size={16} className={active ? "text-amber-600" : "text-slate-500"} />
      )}
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-slate-400">{shortcut}</span>}
      {active && <span className="text-amber-500">✓</span>}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function ComposePage() {
  const navigate = useNavigate();

  const [activeProject, setActiveProject] = useState(null);

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

  const chapters = useMemo(
    () =>
      Array.isArray(rawChapters)
        ? rawChapters.filter((c) => c && c.id != null)
        : [],
    [rawChapters]
  );

  const [bookTitle, setBookTitle] = useState(book?.title || "Untitled Story");
  const [author, setAuthor] = useState("Jacqueline Session Ausby");

  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      if (p?.id) {
        setActiveProject(p);
        setSelectedProjectId(p.id);
        if (p.title && p.title !== bookTitle) setBookTitle(p.title);
      }
    } catch (e) {
      console.error("Failed to ensure selected project:", e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { characters, characterCount } = useMemo(
    () => computeCharactersFromChapters(chapters || []),
    [chapters]
  );

  const totalWordCount = useMemo(
    () => computeWordsFromChapters(chapters || []),
    [chapters]
  );

  const currentChapterIndex = useMemo(() => {
    if (!selectedId) return 0;
    const idx = chapters.findIndex((c) => c.id === selectedId);
    return idx >= 0 ? idx + 1 : 0;
  }, [chapters, selectedId]);

  const [aiBusy, setAiBusy] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [instructions, setInstructions] = useState("");

  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const [view, setView] = useState("grid"); // "grid" | "editor"
  const [showSearch, setShowSearch] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState("editor"); // "editor" | "pages"

  const [title, setTitle] = useState(selectedChapter?.title ?? "");
  const [html, setHtml] = useState(selectedChapter?.content ?? "");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const lastClickedIndexRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [queueLength, setQueueLength] = useState(0);

  const [saveStatus, setSaveStatus] = useState("idle"); // "idle" | "saving" | "saved"
  const [headings, setHeadings] = useState([]);
  const [activeAiTab, setActiveAiTab] = useState("proofread");

  const hasChapter = !!selectedId && !!selectedChapter;
  const hasAnyChapters = Array.isArray(chapters) && chapters.length > 0;

  const fileInputRef = useRef(null);

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
      if (activeAiTab) localStorage.setItem("dt_activeAiTab", activeAiTab);
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
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, selectedId, chapters, hasChapter, saveStatus, html, title]);

  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    }
    setHeadings([]);
  }, [selectedId, selectedChapter]);

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

      const projectId =
        activeProject?.id || getSelectedProjectId() || book?.id || "unknown";

      saveCurrentStorySnapshot({ id: projectId, title: safeTitle });

      upsertProjectMeta({
        id: projectId,
        title: safeTitle,
        wordCount: totalWords,
        targetWords: 50000,
        characterCount: computedCharacterCount,
      });

      syncProjectForCurrentStory({
        wordCount: totalWords,
        targetWords: 50000,
        characterCount: computedCharacterCount,
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("idle");
    }
  };

  const handleRenameChapter = (chapterId, newTitle) => {
    if (!chapterId || !newTitle) return;
    updateChapter(chapterId, { title: newTitle });
  };

  const resolveAIMode = (mode) => {
    switch (mode) {
      case "grammar":
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

  const handleAI = async (mode) => {
    if (!hasChapter) return;

    const action = resolveAIMode(mode);
    if (typeof window === "undefined") return;

    const editorEl = document.querySelector(".ql-editor");
    const selection = window.getSelection();

    if (
      !editorEl ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !editorEl.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      alert(
        "Please highlight the text you want the AI to revise, then click the AI button again."
      );
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());
    const selectedHtml = container.innerHTML.trim();

    if (!selectedHtml) {
      alert(
        "I couldn't read any content from your selection. Please select the exact sentence or paragraph you want revised and try again."
      );
      return;
    }

    const selectedPlain = selectedHtml
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!selectedPlain) {
      alert(
        "The selected content seems to be empty or only formatting. Please select normal text and try again."
      );
      return;
    }

    const MAX_CHARS = 3000;
    const targetText = selectedPlain.slice(0, MAX_CHARS);

    const wrapAsHtml = (text) => {
      let cleaned = String(text || "");
      cleaned = cleaned.replace(/<\/?p>/gi, "");
      const safe = cleaned
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const parts = safe
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return `<p>${safe}</p>`;
      return parts.map((p) => `<p>${p}</p>`).join("");
    };

    try {
      setAiBusy(true);
      const result = await rateLimiter.addToQueue(() =>
        runAssistant(targetText, action, instructions || "", provider)
      );

      const resultTextRaw =
        (result && (result.result || result.text || result.output || result.data)) ||
        result ||
        "";

      if (!resultTextRaw) {
        alert(
          "The AI did not return any text. Please try again with a smaller selection or a different mode."
        );
        return;
      }

      const processedText = applyDoubleSpacing(resultTextRaw);
      const replacementHtml = wrapAsHtml(processedText);
      const fullHtml = (html || "").toString();

      if (!fullHtml.includes(selectedHtml)) {
        alert("I couldn't safely locate that selection in the chapter. No changes were made.");
        return;
      }

      const updatedHtml = fullHtml.replace(selectedHtml, replacementHtml);
      setHtml(updatedHtml);

      updateChapter(selectedId, {
        title: title || selectedChapter?.title || "",
        content: updatedHtml,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AI revision applied to your selection:\n\n" + processedText,
          id: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("AI request error:", error);
      alert("There was an error calling the AI service. Please try again in a moment.");
    } finally {
      setAiBusy(false);
    }
  };

  const handleAssistantSend = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage = { role: "user", content: text, id: Date.now() };
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

      const replyText = (res && (res.result || res.text || res.output || res.data)) || "";
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
          content: "Sorry, there was an error reaching the assistant. Please try again in a moment.",
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

      if (DEBUG_IMPORT) console.log("Parsed import:", parsed);

      if (parsed.title && parsed.title !== bookTitle) {
        setBookTitle(parsed.title);
      }

      const existing = Array.isArray(chapters) ? chapters : [];
      const isSingleBlank =
        existing.length === 1 &&
        !stripHtml(existing[0].content || "").trim() &&
        !(existing[0].title || "").trim();

      if (splitByHeadings && parsed.chapters && parsed.chapters.length > 0) {
        setImportProgress(
          `Creating ${parsed.chapters.length} chapter(s) from "${file.name}"...`
        );

        parsed.chapters.forEach((c, index) => {
          const doubleSpacedContent = applyDoubleSpacing(c.content || "");

          if (isSingleBlank && index === 0) {
            const firstId = existing[0].id;
            updateChapter(firstId, {
              title: c.title || "Untitled Chapter",
              content: doubleSpacedContent,
            });
            setSelectedId(firstId);
          } else {
            const newId = addChapter();
            updateChapter(newId, {
              title: c.title || "Untitled Chapter",
              content: doubleSpacedContent,
            });
          }
        });

        alert(`✅ Imported ${parsed.chapters.length} chapter(s) from "${file.name}".`);
      } else {
        setImportProgress("Importing manuscript into a single chapter...");

        const fullContentRaw =
          parsed.fullContent ||
          (parsed.chapters && parsed.chapters.length
            ? parsed.chapters.map((c) => c.content || "").join("\n\n")
            : "");

        const fullContent = applyDoubleSpacing(fullContentRaw);

        if (isSingleBlank) {
          const firstId = existing[0].id;
          updateChapter(firstId, {
            title: parsed.title || "Imported Manuscript",
            content: fullContent,
          });
          setSelectedId(firstId);
        } else if (hasChapter) {
          setHtml(fullContent);
          updateChapter(selectedId, {
            title:
              title || selectedChapter?.title || parsed.title || "Imported Manuscript",
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

        alert(`✅ Document imported into a single chapter from "${file.name}".`);
      }

      saveProject({ book: { ...book, title: parsed.title || bookTitle } });
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

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const cleanHtml = stripCharacterTags(html);
    const blob = new Blob([cleanHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chapter"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteCurrent = () => {
    if (!hasChapter) {
      alert("Please select a chapter first by clicking on a chapter card or from the sidebar.");
      return;
    }
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
    if (!window.confirm(`Delete ${ids.length} chapter(s)? This cannot be undone.`))
      return;

    ids.forEach((id) => deleteChapter(id));
    clearSelection();
    if (ids.includes(selectedId)) {
      setTimeout(() => setView("grid"), 100);
    }
  };

  const goBack = () => navigate("/dashboard");

  // View switching helpers
  const switchToEditor = () => {
    if (!selectedId && chapters.length > 0) {
      setSelectedId(chapters[0].id);
    }
    setView("editor");
    setEditorViewMode("editor");
  };

  const switchToPageView = () => {
    if (!selectedId && chapters.length > 0) {
      setSelectedId(chapters[0].id);
    }
    setView("editor");
    setEditorViewMode("pages");
  }; 

  const goToTOC = () => {
  setView("grid");              // table of contents
  setEditorViewMode("editor");  // optional reset
};

const goToWriter = (chapterId) => {
  const idToUse = chapterId || selectedId || chapters?.[0]?.id;
  if (idToUse) setSelectedId(idToUse);
  setView("editor");            // writer/editor view
  setEditorViewMode("editor");
};

  // Explicit Grid <-> Writer buttons
  const goToGrid = () => {
    setView("grid");
    setEditorViewMode("editor");
  };

    const handleSendToPublishing = async () => {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      alert("You need at least one chapter before sending to Publishing.");
      return;
    }

    await handleSave();

    try {
      const cleanedChapters = chapters.map((ch, idx) => {
        const raw = ch.content || ch.body || ch.text || "";
        const noChars = stripCharacterTags(raw);
        const noSpacers = stripSpacerParagraphs(noChars);
        const safeHtml = noSpacers;
        const plain = htmlToPlainText(safeHtml);

        return {
          ...ch,
          content: safeHtml,
          _plainForPublishing: plain,
          textHTML: safeHtml,
          _index: idx,
        };
      });

      const normalizedForPublishing = cleanedChapters.map((ch, index) => {
        const htmlForPublishing = ch.content || "";
        const plainForPublishing = stripHtml(htmlForPublishing).trim();

        return {
          id: ch.id || `c_${index + 1}`,
          title: ch.title || `Chapter ${index + 1}`,
          included: typeof ch.included === "boolean" ? ch.included : true,
          text: plainForPublishing,
          textHTML: htmlForPublishing || undefined,
        };
      });

      const safeBookTitle =
        (bookTitle && bookTitle.trim()) ||
        (book?.title && book.title.trim()) ||
        "Untitled Book";

      const meta = {
        title: safeBookTitle,
        author: author || "Unknown Author",
        year: new Date().getFullYear().toString(),
        authorLast: (author || "").split(" ").slice(-1)[0] || "Author",
      };

      const payload = {
        book: {
          ...book,
          title: safeBookTitle,
          status: "ReadyForPublishing",
          updatedAt: new Date().toISOString(),
        },
        chapters: cleanedChapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
        })),
      };

      const projectId =
        activeProject?.id || getSelectedProjectId() || book?.id || "unknown";
      const chaptersKey = chaptersKeyForProject(projectId);
      const metaKey = `dahtruth_project_meta_${projectId}`;
      const draftKey = `publishingDraft_${projectId}`;

      localStorage.setItem(chaptersKey, JSON.stringify(normalizedForPublishing));
      localStorage.setItem(metaKey, JSON.stringify(meta));
      localStorage.setItem(draftKey, JSON.stringify(payload));

      // Back-compat keys
      localStorage.setItem("dahtruth_chapters", JSON.stringify(normalizedForPublishing));
      localStorage.setItem("dahtruth_project_meta", JSON.stringify(meta));
      localStorage.setItem(PUBLISHING_DRAFT_KEY, JSON.stringify(payload));

      upsertUserProject({ title: safeBookTitle });
      navigate("/publishing");
    } catch (err) {
      console.error("Failed to send manuscript to publishing:", err);
      alert("Something went wrong sending this to Publishing. Please try again.");
    }
  };

  // Defensive: if chapter manager returns non-array, show loading
  if (!Array.isArray(chapters)) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-lg">Loading chapters...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900 flex flex-col">
      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* ═══════════════════════════════════════════════════════════════
          BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <div
        className="text-white flex-shrink-0"
        style={{
          background:
            "linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 40%, #9b7bc9 100%)",
        }}
      >
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <PenLine size={24} className="text-amber-300" />
              <h1 className="text-xl font-bold text-white">Compose</h1>
            </div>

            {/* Center: Story Info */}
            <div className="flex items-center gap-4 md:gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-white/70">Story:</span>
                <span className="font-semibold text-amber-300">
                  {bookTitle || "Untitled"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Chapter:</span>
                <span className="font-medium text-white">
                  {currentChapterIndex > 0
                    ? `${currentChapterIndex} / ${chapters.length}`
                    : `${chapters.length} total`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Words:</span>
                <span className="font-medium text-white">
                  {totalWordCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Characters:</span>
                <span className="font-medium text-white">{characterCount}</span>
              </div>
            </div>

            {/* Right: Provider selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/70">AI:</label>
              <select
                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="anthropic" className="text-slate-800">
                  Claude
                </option>
                <option value="openai" className="text-slate-800">
                  GPT-4
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          TOOLBAR (dropdown fix: allow Y overflow)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto overflow-y-visible">
          {/* Dashboard Button */}
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #B8960C)" }}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          {/* Grid <-> Writer quick buttons */}
          {view === "grid" ? (
            <button
              type="button"
              onClick={goToWriter}
              disabled={!hasAnyChapters}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                border border-slate-200 bg-white hover:bg-slate-50 text-slate-700
                disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
              title="Go to Writer"
            >
              <Edit3 size={16} />
              Writer
            </button>
          ) : (
            <button
              type="button"
              onClick={goToGrid}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex-shrink-0"
              title="Back to Chapter Grid"
            >
              <Grid3X3 size={16} />
              Grid
            </button>
          )}

          {/* File Dropdown */}
          <DropdownMenu label="File" icon={FolderOpen}>
            <DropdownItem
              icon={FolderOpen}
              label="Import Manuscript"
              onClick={triggerImport}
              shortcut="Ctrl+O"
            />
            <DropdownItem
              icon={Download}
              label="Export Chapter"
              onClick={handleExport}
              disabled={!hasChapter}
            />
            <DropdownDivider />
            <DropdownItem
              icon={Save}
              label={
                saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved ✓"
                  : "Save"
              }
              onClick={handleSave}
              disabled={!hasChapter || saveStatus === "saving"}
              shortcut="Ctrl+S"
            />
            <DropdownDivider />
            <DropdownItem
              icon={Trash2}
              label="Delete Chapter"
              onClick={handleDeleteCurrent}
              disabled={!hasChapter}
            />
          </DropdownMenu>

          {/* View Dropdown */}
          <DropdownMenu label="View" icon={Eye}>
            <DropdownItem
              icon={Grid3X3}
              label="Chapter Grid"
              onClick={() => setView("grid")}
              active={view === "grid"}
            />
            <DropdownItem
              icon={Edit3}
              label="Editor"
              onClick={switchToEditor}
              active={view === "editor" && editorViewMode === "editor"}
            />
            <DropdownItem
              icon={FileText}
              label="Page View (8.5 × 11)"
              onClick={switchToPageView}
              active={view === "editor" && editorViewMode === "pages"}
            />
            <DropdownDivider />
            <DropdownItem
              icon={CheckSquare}
              label="Select Mode"
              onClick={toggleSelectMode}
              active={selectMode}
            />
          </DropdownMenu>

          {/* AI Dropdown (sets activeAiTab + runs action) */}
          <DropdownMenu label="AI Tools" icon={Sparkles} disabled={!hasChapter || aiBusy}>
            <DropdownItem
              icon={BookCheck}
              label="Proofread"
              onClick={() => {
                setActiveAiTab("proofread");
                handleAI("proofread");
              }}
              active={activeAiTab === "proofread"}
            />
            <DropdownItem
              icon={Wand2}
              label="Clarify"
              onClick={() => {
                setActiveAiTab("clarify");
                handleAI("clarify");
              }}
              active={activeAiTab === "clarify"}
            />
            <DropdownItem
              icon={RefreshCw}
              label="Rewrite"
              onClick={() => {
                setActiveAiTab("rewrite");
                handleAI("rewrite");
              }}
              active={activeAiTab === "rewrite"}
            />
            <DropdownItem
              icon={Eye}
              label="Readability"
              onClick={() => {
                setActiveAiTab("readability");
                handleAI("readability");
              }}
              active={activeAiTab === "readability"}
            />
            <DropdownDivider />
            <DropdownItem
              icon={MessageSquare}
              label={showAssistant ? "Hide Assistant" : "Show Assistant"}
              onClick={() => setShowAssistant((prev) => !prev)}
              active={showAssistant}
            />
          </DropdownMenu>

          {/* Search Button */}
          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              border transition-all flex-shrink-0
              ${
                showSearch
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }
            `}
            title="Search manuscript (Ctrl+F)"
          >
            <Search size={16} />
            Search
          </button>

          <div className="flex-1" />

          {queueLength > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200 flex-shrink-0">
              <span className="text-xs text-blue-700">
                ⏳ {queueLength} AI request{queueLength !== 1 ? "s" : ""} queued
              </span>
            </div>
          )}

          {isImporting && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded border border-amber-200 flex-shrink-0">
              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-amber-700">{importProgress}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSendToPublishing}
            disabled={!hasAnyChapters || saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #B8960C)" }}
          >
            <Send size={16} />
            Send to Publishing
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          GRID VIEW
      ═══════════════════════════════════════════════════════════════ */}
      {view === "grid" && (
        <div className="flex-1">
          {showSearch && (
            <div className="max-w-[1800px] mx-auto px-4 pt-4">
              <SearchPanel
                chapters={chapters}
                onSelectChapter={(id) => {
                  setSelectedId(id);
                  setView("editor");
                  setShowSearch(false);
                }}
                onClose={() => setShowSearch(false)}
              />
            </div>
          )}

         <ChapterGrid
            chapters={chapters}
            selectedId={selectedId}
            onSelectChapter={(id) => {
              if (!id) return;
              if (selectMode) {
                toggleSelect(id);
              } else {
                goToWriter(id);
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
        </div>
      )}

           {/* ═══════════════════════════════════════════════════════════════
          EDITOR VIEW
      ═══════════════════════════════════════════════════════════════ */}
      {view === "editor" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="max-w-[1800px] mx-auto px-4 py-4 flex-1 flex flex-col min-h-0 w-full">
            {/* Editor Formatting Toolbar */}
            <div className="mb-4 flex-shrink-0">
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

            {/* Main layout */}
            <div
              className="grid gap-6 flex-1 min-h-0 overflow-hidden"
              style={{
                gridTemplateColumns: showAssistant
                  ? "minmax(220px, 220px) minmax(0, 1fr) minmax(320px, 320px)"
                  : "minmax(220px, 220px) minmax(0, 1fr)",
              }}
            >
              {/* Left Sidebar */}
              <aside className="space-y-3 overflow-y-auto min-w-0 relative z-30 pr-1">
                {showSearch && (
                  <SearchPanel
                    chapters={chapters}
                    onSelectChapter={(id) => {
                      setSelectedId(id);
                      setShowSearch(false);
                    }}
                    onClose={() => setShowSearch(false)}
                  />
                )}

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

                {headings.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Table of Contents
                    </div>
                    <ul className="space-y-1 max-h-64 overflow-auto text-xs">
                      {headings.map((h, idx) => (
                        <li key={`${h.level}-${idx}-${h.text}`} className="text-slate-700">
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

                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
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
                      Introduce a character as{" "}
                      <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                        @char: John Smith
                      </span>
                    </p>
                  ) : (
                    <ul className="space-y-1 max-h-40 overflow-auto text-xs">
                      {characters.map((name) => (
                        <li key={name} className="text-slate-700 truncate">
                          {name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </aside>

              {/* Main Editor/Paginated View */}
              <div className="min-h-0 min-w-0 overflow-hidden relative z-10">
                <div className="min-h-0 min-w-0 w-full h-full overflow-x-auto overflow-y-hidden">
                  {editorViewMode === "pages" ? (
                    <PaginatedView
                      html={html}
                      title={title}
                      author={author}
                      chapterNumber={chapters.findIndex((c) => c.id === selectedId) + 1}
                      onEdit={() => setEditorViewMode("editor")}
                    />
                  ) : (
                    <EditorPane
                      title={title}
                      setTitle={setTitle}
                      html={html}
                      setHtml={setHtml}
                      onSave={handleSave}
                      onAI={handleAI}
                      aiBusy={aiBusy || chatBusy}
                      pageWidth={850}
                      onHeadingsChange={setHeadings}
                    />
                  )}
                </div>
              </div>

              {/* Right-hand AI Assistant */}
              {showAssistant && (
                <section className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm min-h-0 max-h-full overflow-hidden relative z-20">
                  <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">AI Assistant</div>
                      <div className="text-[11px] text-slate-500">Ask questions, get suggestions</div>
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
                        <br />• "Help me tighten this opening."
                        <br />• "Is this dialogue natural?"
                        <br />• "Suggest a stronger ending."
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
                        <div className="whitespace-pre-wrap text-slate-800">{msg.content}</div>
                        {msg.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="mt-1 text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAssistantSend();
                    }}
                    className="border-t border-slate-200 p-2 space-y-2 flex-shrink-0"
                  >
                    <textarea
                      rows={3}
                      className="w-full resize-none rounded-md border border-slate-300 px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Ask a question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleAssistantKeyDown}
                      disabled={chatBusy}
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">Enter to send</div>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatBusy}
                        className="text-[13px] px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {chatBusy ? "Thinking…" : "Send"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
