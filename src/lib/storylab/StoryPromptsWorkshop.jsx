import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy, Check, Filter, Timer, User, TrendingUp, Feather, Globe, Star, X, Pin, Edit3,
  Lightbulb, ArrowLeft, Save, Trash2, Send, FileText, Shuffle, Download
} from "lucide-react";

import BackToLanding, { BackToLandingFab } from "../../components/storylab/BackToLanding";

export default function StoryPromptsWorkshop() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <BackToLanding title="Story Prompts" />
      {/* existing content */}
      <BackToLandingFab />
    </div>
  );
}

/* =========================================================
   STORAGE HELPERS (updated to use shared store)
========================================================= */
// ⬇️ REPLACE your storage helpers with these imports + one helper
import {
  loadProject as getProject,
  saveProject as setProject,
  ensureWorkshopFields
} from "../../lib/storylab/projectStore";

/** Update a chapter by id, using the shared store */
function updateChapterById(id, updater) {
  const proj = ensureWorkshopFields(getProject());
  if (!proj || !Array.isArray(proj.chapters)) return;
  const i = proj.chapters.findIndex((c) => c.id === id);
  if (i === -1) return;
  // Normalize the text field so all views see the same content
  const current = proj.chapters[i] || {};
  const normalized = {
    ...current,
    text: current.text ?? current.content ?? current.body ?? ""
  };
  const next = updater(normalized) || normalized;
  // Always write to `text` (single source of truth)
  proj.chapters[i] = { ...next, text: next.text ?? "" };
  setProject(proj);
  try { window.dispatchEvent(new Event("project:change")); } catch {}
}

function loadChaptersFromLocalStorage() {
  const proj = ensureWorkshopFields(getProject());
  if (!proj) return [];
  const list = proj?.chapters ?? [];
  return list.map((c, idx) => ({
    id: c.id ?? idx,
    title: c.title ?? `Chapter ${idx + 1}`,
    text: c.text ?? c.content ?? c.body ?? "",
    storyLab: c.storyLab || {},
  }));
}

/* =========================================================
   NLP HELPERS (unchanged)
========================================================= */
const splitSentences = (txt) =>
  (txt || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens =
    (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach((t) => {
    if (!["I", "The", "A", "And", "But", "Then", "Now", "When", "Where"].includes(t)) {
      names.add(t.trim());
    }
  });
  return Array.from(names).slice(0, 50);
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}

function extractEmotions(text) {
  const emotions = [
    "fear","hope","love","anger","joy","sadness","worry","excitement","disappointment","relief"
  ];
  const found = [];
  emotions.forEach((emotion) => {
    const sentences = extractKeywordSentences(text, emotion);
    if (sentences.length > 0) found.push({ emotion, sentences: sentences.slice(0, 2) });
  });
  return found;
}

function extractConflicts(text) {
  const hits = [];
  const needles = [
    "conflict","tension","argument","fight","feud","rivalry","obstacle","problem","challenge","struggle","battle"
  ];
  const sentences = splitSentences(text);
  sentences.forEach((s) => {
    if (needles.some((n) => s.toLowerCase().includes(n))) hits.push(s.trim());
  });
  return hits;
}

function analyzeStoryStructure(chapters, selectedChapter) {
  const total = chapters.length || 1;
  const idx = selectedChapter
    ? Math.max(0, chapters.findIndex((c) => c.id === selectedChapter.id))
    : 0;
  const progress = idx / total;
  if (progress < 0.25) return { act: "setup", phase: "beginning" };
  if (progress < 0.75) return { act: "confrontation", phase: "middle" };
  return { act: "resolution", phase: "ending" };
}

/* =========================================================
   PROMPT CATEGORIES & GENERATION (unchanged logic)
========================================================= */
const PROMPT_CATEGORIES = {
  sprint: { label: "Quick Sprints", icon: Timer, color: "emerald", time: "5–15 min" },
  character: { label: "Character Deep Dive", icon: User, color: "blue", time: "20–30 min" },
  plot: { label: "Plot Development", icon: TrendingUp, color: "purple", time: "15–45 min" },
  craft: { label: "Writing Craft", icon: Feather, color: "orange", time: "10–20 min" },
  worldbuilding: { label: "World Building", icon: Globe, color: "teal", time: "20–40 min" },
};

function generateEnhancedPrompts(chapters, characters, selectedChapter) {
  const fullText = chapters.map((c) => c.text).join("\n\n");
  const selectedText = selectedChapter?.text || fullText;
  const structure = analyzeStoryStructure(chapters, selectedChapter);
  const emotions = extractEmotions(selectedText);
  const conflicts = extractConflicts(selectedText);

  const prompts = [];

  // Sprint prompts
  prompts.push(
    { category: "sprint", text: "Write a 100-word scene showing (don't tell) your protagonist's biggest fear.", difficulty: 1 },
    { category: "sprint", text: "Describe your current setting through the five senses in exactly 50 words.", difficulty: 1 },
    { category: "sprint", text: "Write dialogue that reveals a secret without stating it directly.", difficulty: 2 }
  );

  // Character prompts from current story
  const storyCharacters = guessCharacters(selectedText);
  const charPool = storyCharacters.length ? storyCharacters : characters;
  charPool.slice(0, 5).forEach((char) => {
    prompts.push(
      { category: "character", text: `Write ${char}'s origin story in 200 words. What shaped them?`, difficulty: 2, contextual: true },
      { category: "character", text: `What does ${char} want most in this scene? Write a moment where they almost get it.`, difficulty: 3, contextual: true },
      { category: "character", text: `Give ${char} a quirky habit that reveals their inner state. Show it in action.`, difficulty: 1, contextual: true }
    );
  });

  // Plot by structure
  if (structure.phase === "beginning") {
    prompts.push(
      { category: "plot", text: "Introduce a problem that will drive your entire story in the next scene.", difficulty: 3 },
      { category: "plot", text: "Write the moment when ordinary life ends and the adventure begins.", difficulty: 3 }
    );
  } else if (structure.phase === "middle") {
    prompts.push(
      { category: "plot", text: "Write a scene where everything goes wrong at the worst possible moment.", difficulty: 3 },
      { category: "plot", text: "Introduce a complication that makes your protagonist's goal seem impossible.", difficulty: 3 }
    );
  } else {
    prompts.push(
      { category: "plot", text: "Write the confrontation scene where your protagonist faces their greatest fear.", difficulty: 4 },
      { category: "plot", text: "Show how your protagonist has changed since the beginning.", difficulty: 3 }
    );
  }

  // Craft
  prompts.push(
    { category: "craft", text: "Rewrite your last dialogue scene using only subtext—characters say everything except what they mean.", difficulty: 3 },
    { category: "craft", text: "Write a paragraph of pure action with no adjectives or adverbs.", difficulty: 2 },
    { category: "craft", text: "Describe an emotional moment using only physical sensations and actions.", difficulty: 2 }
  );

  // Worldbuilding
  prompts.push(
    { category: "worldbuilding", text: "Create a location that reflects your protagonist's internal state.", difficulty: 2 },
    { category: "worldbuilding", text: "Write about a cultural tradition or rule that creates conflict in your story.", difficulty: 3 },
    { category: "worldbuilding", text: "Design a place where your characters go to feel safe. What makes it special?", difficulty: 2 }
  );

  // Contextual: emotions from your story
  emotions.forEach(({ sentences }) => {
    if (sentences[0]) {
      prompts.push({
        category: "character",
        text: `Expand on this emotion: "${sentences[0].slice(0, 140)}${sentences[0].length > 140 ? "…" : ""}"`,
        difficulty: 2,
        contextual: true,
      });
    }
  });

  // Contextual: conflicts from your story
  conflicts.slice(0, 2).forEach((conflict) => {
    prompts.push({
      category: "plot",
      text: `Escalate this conflict: "${conflict.slice(0, 140)}${conflict.length > 140 ? "…" : ""}". What's the next step?`,
      difficulty: 3,
      contextual: true,
    });
  });

  return prompts.map((p, i) => ({ ...p, id: i }));
}

/* =========================================================
   MODALS (converted to light / glass)
========================================================= */
function Scratchpad({ isOpen, onClose, content, onChange, onSave, onSendToChapter, onClear }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-white/60 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/60">
          <h3 className="text-lg font-semibold text-ink">Writing Scratchpad</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
            <X size={20} className="text-ink/70" />
          </button>
        </div>
        <div className="flex-1 p-4">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing from the prompt…"
            className="w-full h-64 p-3 border border-white/60 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-ink bg-white"
          />
        </div>
        <div className="flex items-center justify-between p-4 border-t border-white/60">
          <div className="flex gap-2">
            <button onClick={onSave} className="flex items-center gap-2 px-4 py-2 bg-accent text-ink rounded-lg hover:bg-accent/90 transition-colors border border-white/60">
              <Save size={16} />
              Save Work
            </button>
            <button onClick={onSendToChapter} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/80 text-ink rounded-lg hover:bg-emerald-500 transition-colors border border-white/60">
              <Send size={16} />
              Send to Chapter
            </button>
          </div>
          <button onClick={onClear} className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedPromptsMenu({ savedPrompts, isOpen, onClose, onLoadPrompt }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-white/60 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-white/60">
          <h3 className="text-lg font-semibold text-ink">Saved Prompt Work</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/60 rounded-lg transition-colors">
            <X size={20} className="text-ink/70" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {savedPrompts.length === 0 ? (
            <div className="text-center py-8 text-ink/70">
              <FileText size={48} className="mx-auto mb-4 text-ink/50" />
              <p>No saved prompt work yet</p>
              <p className="text-sm">Write with prompts and save them to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPrompts.map((item) => (
                <div key={item.id} className="bg-white rounded-lg p-4 border border-white/60">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-ink text-sm">{item.prompt.slice(0, 80)}…</h4>
                    <span className="text-xs text-ink/60">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-ink/80 text-sm mb-3">{item.content.slice(0, 150)}…</p>
                  <button onClick={() => onLoadPrompt(item)} className="text-primary/90 hover:text-primary font-medium text-sm">
                    Load &amp; Edit
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROMPT CARD (light/glass)
========================================================= */
function PromptCard({ prompt, onPin, onUnpin, onUse, onMarkTried, isPinned, status }) {
  const cat = PROMPT_CATEGORIES[prompt.category];
  const CatIcon = cat?.icon;

  const chipByColor = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    purple: "border-purple-300 bg-purple-50 text-purple-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    teal: "border-teal-300 bg-teal-50 text-teal-800",
  };

  const statusIcons = {
    tried: { icon: Check, color: "text-emerald-600", label: "Tried" },
    helpful: { icon: Star, color: "text-amber-500", label: "Helpful" },
    skip: { icon: X, color: "text-slate-400", label: "Skip" },
  };
  const StatusIcon = status ? statusIcons[status]?.icon : null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/60 hover:bg-white/90 transition-colors shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-md text-xs border ${cat ? chipByColor[cat.color] : "border-slate-200 bg-slate-50 text-slate-700"}`}>
            {CatIcon ? <CatIcon size={12} className="inline mr-1" /> : null}
            {cat?.label || "Prompt"}
          </div>
          {prompt.difficulty ? (
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < prompt.difficulty ? "bg-ink" : "bg-slate-300"}`} />
              ))}
            </div>
          ) : null}
          {cat?.time ? <span className="text-xs text-ink/60">{cat.time}</span> : null}
        </div>
        {status && StatusIcon ? (
          <div className={`flex items-center gap-1 text-xs ${statusIcons[status].color}`}>
            <StatusIcon size={14} />
            {statusIcons[status].label}
          </div>
        ) : null}
      </div>

      {/* Prompt text */}
      <div className="text-ink text-sm leading-relaxed mb-4">{prompt.text}</div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard && navigator.clipboard.writeText(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/70 border border-white/60 hover:bg-white text-xs text-ink transition-all"
            title="Copy"
          >
            <Copy size={12} />
            Copy
          </button>

          <button
            onClick={() => onUse(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-accent text-ink text-xs hover:bg-accent/90 transition-all border border-white/60"
            title="Use in scratchpad"
          >
            <Edit3 size={12} />
            Use
          </button>

          {isPinned ? (
            <button
              onClick={() => onUnpin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-100 border border-amber-200 hover:bg-amber-200 text-amber-800 text-xs transition-all"
              title="Remove from Session Pack"
            >
              <Check size={12} />
              In Pack
            </button>
          ) : (
            <button
              onClick={() => onPin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/70 border border-white/60 hover:bg-white text-xs text-ink transition-all"
              title="Add to Session Pack"
            >
              <Pin size={12} />
              Add to Pack
            </button>
          )}
        </div>

        {/* Status quick marks */}
        <div className="flex items-center gap-1">
          {!status && (
            <>
              <button
                onClick={() => onMarkTried(prompt.id, "tried")}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-all"
                title="Mark as tried"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, "helpful")}
                className="p-1.5 rounded hover:bg-amber-50 text-amber-500 transition-all"
                title="Mark as helpful"
              >
                <Star size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, "skip")}
                className="p-1.5 rounded hover:bg-slate-50 text-slate-400 transition-all"
                title="Skip this prompt"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN — light/glass layout with sidebar + grid
========================================================= */
export default function StoryPromptsWorkshop() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showContextual, setShowContextual] = useState(true);

  // Enhanced state
  const [pinned, setPinned] = useState([]);
  const [promptStatuses, setPromptStatuses] = useState({});
  const [toast, setToast] = useState("");
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [savedPromptsMenuOpen, setSavedPromptsMenuOpen] = useState(false);

  useEffect(() => {
    const loadedChapters = loadChaptersFromLocalStorage();
    setChapters(loadedChapters);
    if (loadedChapters.length > 0) {
      const first = loadedChapters[0];
      setSelectedChapter(first);
      const allText = loadedChapters.map((c) => c.text).join("\n\n");
      setCharacters(guessCharacters(allText));
    }
  }, []);

  // Live refresh when project changes (from other views or tabs)
  useEffect(() => {
    const refresh = () => setChapters(loadChaptersFromLocalStorage());
    window.addEventListener("project:change", refresh);
    window.addEventListener("storage", refresh); // cross-tab refresh
    return () => {
      window.removeEventListener("project:change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Load chapter's lab data
  useEffect(() => {
    if (!selectedChapter) return;
    const proj = ensureWorkshopFields(getProject());
    const ch = proj?.chapters?.find((c) => c.id === selectedChapter.id);
    const lab = ch?.storyLab || {};
    setPinned(Array.isArray(lab.pinned) ? lab.pinned : []);
    setPromptStatuses(lab.promptStatuses || {});
    setScratchpadContent(lab.scratchpad || "");
    setSavedPrompts(lab.savedPrompts || []);
  }, [selectedChapter]);

  // Persist lab data
  useEffect(() => {
    if (!selectedChapter) return;
    updateChapterById(selectedChapter.id, (c) => ({
      ...c,
      storyLab: {
        ...(c.storyLab || {}),
        pinned,
        promptStatuses,
        scratchpad: scratchpadContent,
        savedPrompts,
      },
    }));
  }, [pinned, promptStatuses, scratchpadContent, savedPrompts, selectedChapter]);

  // Actions
  const pinPrompt = (text) => setPinned((p) => (p.includes(text) ? p : [...p, text]));
  const unpinPrompt = (text) => setPinned((p) => p.filter((t) => t !== text));
  const updatePromptStatus = (id, status) => setPromptStatuses((prev) => ({ ...prev, [id]: status }));

  const usePrompt = (text) => {
    setCurrentPrompt(text);
    setScratchpadContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n\n" : "";
      return `${prev}${prefix}> Prompt: ${text}\n\n`;
    });
    setScratchpadOpen(true);
    setToast("Prompt added to scratchpad");
    setTimeout(() => setToast(""), 1200);
  };

  const savePromptWork = () => {
    if (!currentPrompt || !scratchpadContent) return;
    const promptWork = {
      id: Date.now(),
      prompt: currentPrompt,
      content: scratchpadContent,
      timestamp: new Date().toISOString(),
      chapterId: selectedChapter?.id,
    };
    setSavedPrompts((prev) => [promptWork, ...prev]);
    setToast("Prompt work saved");
    setTimeout(() => setToast(""), 1200);
  };

  const sendToChapter = () => {
    if (!selectedChapter || !scratchpadContent.trim()) return;
    updateChapterById(selectedChapter.id, (c) => {
      const existing = c.text || "";
      const sep = existing && !/\n$/.test(existing) ? "\n\n" : "";
      // Add a bold marker so it's clearly a prompt-driven insert
      const block = `**[WRITING PROMPT]** ${currentPrompt || "Session Work"}\n\n${scratchpadContent}\n\n`;
      return {
        ...c,
        text: `${existing}${sep}${block}`,
        lastEdited: new Date().toISOString(),
      };
    });
    setToast("Sent to chapter");
    setTimeout(() => setToast(""), 1200);
  };

  const clearScratchpad = () => {
    setScratchpadContent("");
    setCurrentPrompt("");
  };

  const loadSavedPrompt = (item) => {
    setCurrentPrompt(item.prompt);
    setScratchpadContent(item.content);
    setScratchpadOpen(true);
    setSavedPromptsMenuOpen(false);
    setToast("Loaded saved work");
    setTimeout(() => setToast(""), 1200);
  };

  // Generate + filter
  const allPrompts = useMemo(
    () => generateEnhancedPrompts(chapters, characters, selectedChapter),
    [chapters, characters, selectedChapter]
  );

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => {
      if (activeCategory !== "all" && prompt.category !== activeCategory) return false;
      if (difficultyFilter !== "all") {
        const d = parseInt(difficultyFilter, 10);
        if (prompt.difficulty !== d) return false;
      }
      if (!showContextual && prompt.contextual) return false;
      if (promptStatuses[prompt.id] === "skip") return false;
      return true;
    });
  }, [allPrompts, activeCategory, difficultyFilter, showContextual, promptStatuses]);

  // Stats
  const stats = useMemo(() => {
    const total = allPrompts.length;
    const tried = Object.values(promptStatuses).filter((s) => s === "tried").length;
    const helpful = Object.values(promptStatuses).filter((s) => s === "helpful").length;
    const skipped = Object.values(promptStatuses).filter((s) => s === "skip").length;
    return { total, tried, helpful, skipped };
  }, [allPrompts, promptStatuses]);

  // Session pack helpers (uses pinned)
  const shufflePack = (count = 12) => {
    const pool = [...filteredPrompts];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, count).map((p) => p.text);
    setPinned(chosen);
    setToast(`Session Pack: ${chosen.length} prompts`);
    setTimeout(() => setToast(""), 1200);
  };

  const sendPackToScratchpad = () => {
    if (!pinned.length) return;
    const lines = pinned.map((t, i) => `(${i + 1}) ${t}`).join("\n");
    setCurrentPrompt("Session Pack");
    setScratchpadContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n\n" : "";
      return `${prev}${prefix}> Session Pack\n\n${lines}\n\n`;
    });
    setScratchpadOpen(true);
  };

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      {/* Top glass bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="leading-tight">
              <div className="text-lg font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
                Story Prompts Workshop
              </div>
              <div className="text-xs text-muted -mt-0.5">Collaborative session tool</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSavedPromptsMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-white/60 hover:bg-white"
                title="Open Saved Work"
              >
                <FileText size={16} />
                Saved Work
              </button>
              <button
                onClick={() => navigate("/story-lab")}
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-white/60 hover:bg-white"
                title="Back to Story Lab"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-20 z-50 px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white shadow">
          {toast}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT SIDEBAR (sticky) */}
        <aside className="lg:col-span-4 xl:col-span-3">
          {/* Chapter picker */}
          {chapters.length > 1 && (
            <div className="mb-6 p-4 bg-white/70 backdrop-blur-xl rounded-xl border border-white/60">
              <div className="flex items-center justify-between">
                <span className="text-sm">Working with chapter:</span>
                <select
                  value={selectedChapter?.id ?? ""}
                  onChange={(e) => {
                    const idVal = e.target.value; // keep as string
                    const ch = chapters.find((c) => String(c.id) === String(idVal));
                    setSelectedChapter(ch || null);
                  }}
                  className="px-3 py-2 bg-white border border-white/60 rounded-lg text-ink text-sm"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Session Pack (uses pinned) */}
          <div className="mb-6 p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Session Pack</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => shufflePack(12)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-white/70 border border-white/60 hover:bg-white"
                  title="Shuffle 12"
                >
                  <Shuffle size={12} /> Shuffle 12
                </button>
                <button
                  onClick={sendPackToScratchpad}
                  disabled={!pinned.length}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-accent text-ink border border-white/60 disabled:opacity-50"
                  title="Send to Scratchpad"
                >
                  <Send size={12} /> Use Pack
                </button>
              </div>
            </div>
            {pinned.length === 0 ? (
              <div className="text-sm text-ink/60">Pin prompts to build your session pack.</div>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                {pinned.map((t, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-ink/50">{i + 1}.</span>
                    <span className="flex-1">{t}</span>
                    <button
                      onClick={() => unpinPrompt(t)}
                      className="text-ink/50 hover:text-ink"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="text-center p-3 rounded-lg bg-white/70 border border-white/60">
              <div className="text-lg font-bold">{stats.tried}</div>
              <div className="text-[11px] text-emerald-700">Tried</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/70 border border-white/60">
              <div className="text-lg font-bold">{stats.helpful}</div>
              <div className="text-[11px] text-amber-600">Helpful</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/70 border border-white/60">
              <div className="text-lg font-bold">{pinned.length}</div>
              <div className="text-[11px] text-primary">In Pack</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/70 border border-white/60">
              <div className="text-lg font-bold">
                {stats.total - stats.tried - stats.helpful - stats.skipped}
              </div>
              <div className="text-[11px] text-ink/60">New</div>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/60 sticky top-[6.5rem]">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-ink/70" />
              <span className="text-sm">Filters</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  activeCategory === "all" ? "bg-white border-white/60" : "bg-white/70 border-white/60 hover:bg-white"
                }`}
              >
                All
              </button>
              {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                      active ? "bg-white border-white/60" : "bg-white/70 border-white/60 hover:bg-white"
                    }`}
                    title={category.label}
                  >
                    {Icon ? <Icon size={12} className="inline mr-1" /> : null}
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <label className="block text-xs mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/70 border border-white/60"
              >
                <option value="all">All</option>
                <option value="1">Easy (●○○○)</option>
                <option value="2">Medium (●●○○)</option>
                <option value="3">Hard (●●●○)</option>
                <option value="4">Expert (●●●●)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={showContextual}
                onChange={(e) => setShowContextual(e.target.checked)}
                className="accent-current"
              />
              Show story-specific prompts
            </label>
          </div>
        </aside>

        {/* RIGHT: PROMPTS GRID */}
        <main className="lg:col-span-8 xl:col-span-9">
          {/* Header block */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 border border-white/60 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Interactive Story Prompts</h1>
                <p className="text-sm text-ink/70">
                  Smart prompts that adapt to your chapters, characters, and structure.
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{filteredPrompts.length}</div>
                <div className="text-xs text-ink/60">Available prompts</div>
              </div>
            </div>
          </div>

          {/* Pinned (compact row) */}
          {pinned.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 border border-white/60 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Pinned (Session Pack)</div>
                <div className="flex gap-2">
                  <button
                    onClick={sendPackToScratchpad}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-accent text-ink border border-white/60"
                  >
                    <Send size={12} />
                    Use Pack
                  </button>
                  <button
                    onClick={() => setPinned([])}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-white/70 border border-white/60 hover:bg-white"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pinned.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-md bg-white border border-white/60"
                    title={t}
                  >
                    {i + 1}. {t.length > 64 ? `${t.slice(0, 64)}…` : t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Prompts grid */}
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-16 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/60">
              <Lightbulb size={48} className="mx-auto mb-4 text-ink/50" />
              <div className="text-lg font-semibold mb-2">No prompts match your filters</div>
              <div className="text-ink/70">Adjust filters or add more chapters for personalized prompts.</div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onPin={pinPrompt}
                  onUnpin={unpinPrompt}
                  onUse={usePrompt}
                  onMarkTried={updatePromptStatus}
                  isPinned={pinned.includes(prompt.text)}
                  status={promptStatuses[prompt.id]}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Scratchpad Modal */}
      <Scratchpad
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        content={scratchpadContent}
        onChange={setScratchpadContent}
        onSave={savePromptWork}
        onSendToChapter={sendToChapter}
        onClear={clearScratchpad}
      />

      {/* Saved Prompts Modal */}
      <SavedPromptsMenu
        savedPrompts={savedPrompts}
        isOpen={savedPromptsMenuOpen}
        onClose={() => setSavedPromptsMenuOpen(false)}
        onLoadPrompt={loadSavedPrompt}
      />
    </div>
  );
}
