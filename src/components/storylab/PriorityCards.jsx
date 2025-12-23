// src/components/storylab/PriorityCards.jsx
// Priority Cards - Track character wants, fears, needs, and secrets
// Uses direct localStorage with project-aware keys

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Flag, 
  Tag, 
  CheckCircle, 
  ListChecks,
  Sparkles,
  BookOpen,
  ChevronDown,
  Check,
  X,
  Loader2,
  User,
  Target,
  AlertCircle,
  Save,
} from "lucide-react";
import { runAssistant } from "../../lib/api";

/* ============================================
   BRAND COLORS
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldLight: "#f5e6b3",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  cream: "#fefdfb",
};

/* ============================================
   PROJECT-AWARE STORAGE
   ============================================ */
const PRIORITIES_KEY_BASE = "dahtruth-priorities-v2";
const CHAPTERS_KEY_BASE = "dahtruth-story-lab-toc-v3";

function getSelectedProjectId() {
  try {
    const stored = localStorage.getItem('dahtruth-selected-project-id');
    if (stored) return stored;
    const projectData = localStorage.getItem('dahtruth-project-store');
    if (projectData) {
      const parsed = JSON.parse(projectData);
      return parsed.selectedProjectId || parsed.currentProjectId || 'default';
    }
    return 'default';
  } catch {
    return 'default';
  }
}

function getProjectKey(baseKey) {
  const projectId = getSelectedProjectId();
  return projectId === 'default' ? baseKey : `${baseKey}-${projectId}`;
}

function loadPriorities() {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
    console.log(`[PriorityCards] Loading from key: ${key}`);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function savePriorities(priorities) {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
    localStorage.setItem(key, JSON.stringify(priorities));
    console.log(`[PriorityCards] Saved to key: ${key}`);
    return true;
  } catch {
    return false;
  }
}

function loadChapters() {
  try {
    const key = getProjectKey(CHAPTERS_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.chapters) ? data.chapters : [];
  } catch {
    return [];
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Extract plain text from HTML
function stripHtml(html = "") {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

// Extract character names from text (looks for @char: tags)
function extractCharacters(text = "") {
  const matches = text.match(/@char:\s*([A-Za-z0-9 .'-]+)/gi) || [];
  const names = matches.map(m => m.replace(/@char:\s*/i, "").trim());
  return [...new Set(names)];
}

/* ============================================
   SAVING BADGE
   ============================================ */
function SavingBadge({ state }) {
  return (
    <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
      state === "saving" 
        ? "bg-amber-100 text-amber-700 border border-amber-200" 
        : "bg-emerald-100 text-emerald-700 border border-emerald-200"
    }`}>
      {state === "saving" ? "Saving…" : "✓ Saved"}
    </span>
  );
}

/* ============================================
   PAGE BANNER
   ============================================ */
const PageBanner = ({ projectId, cardCount }) => (
  <div 
    className="rounded-3xl p-8 mb-8 text-white text-center relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 30%, ${BRAND.mauve} 70%, ${BRAND.rose} 100%)`,
    }}
  >
    {/* Decorative elements */}
    <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
    <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: 'blur(100px)' }} />
    
    <div className="relative z-10">
      {/* Icon trio */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.gold}40` }}>
          <Target size={24} style={{ color: BRAND.goldLight }} />
        </div>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
          <ListChecks size={28} className="text-white" />
        </div>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.mauve}50` }}>
          <Sparkles size={24} style={{ color: BRAND.cream }} />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2">Priority Cards</h1>
      <p className="text-white/70 max-w-xl mx-auto">
        Track character wants, fears, needs, and secrets. Use AI to analyze chapters or add cards manually.
      </p>
      
      <div className="mt-4 text-xs text-white/40">
        Project: {projectId} · {cardCount} cards
      </div>
    </div>
  </div>
);

/* ============================================
   AI SUGGESTIONS PANEL
   ============================================ */
const SuggestionsPanel = ({ suggestions, onAccept, onReject, onAcceptAll, onClose, isLoading, error }) => {
  if (!isLoading && !error && suggestions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-2xl p-5 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${BRAND.gold}20` }}
          >
            <Sparkles size={18} style={{ color: BRAND.gold }} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">AI Suggestions</h3>
            <p className="text-xs text-slate-500">Review and accept priorities for your characters</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-amber-500 mr-3" />
          <span className="text-slate-600">Analyzing chapter for character priorities...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!isLoading && !error && suggestions.length > 0 && (
        <>
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {suggestions.map((suggestion, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User size={14} className="text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">{suggestion.character}</span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          background: suggestion.type === "Want" ? `${BRAND.gold}20` :
                                     suggestion.type === "Fear" ? "#fef2f2" :
                                     suggestion.type === "Need" ? "#f0fdf4" :
                                     `${BRAND.mauve}30`,
                          color: suggestion.type === "Want" ? BRAND.gold :
                                 suggestion.type === "Fear" ? "#dc2626" :
                                 suggestion.type === "Need" ? "#16a34a" :
                                 BRAND.navy
                        }}
                      >
                        {suggestion.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{suggestion.title}</p>
                    {suggestion.reason && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{suggestion.reason}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAccept(suggestion)}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Accept this suggestion"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={() => onReject(idx)}
                      className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      title="Dismiss"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-amber-200">
            <span className="text-sm text-slate-500">{suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}</span>
            <button
              onClick={onAcceptAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              <Check size={16} />
              Accept All
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/* ============================================
   CHAPTER ANALYZER
   ============================================ */
const AIAnalyzer = ({ onAnalyze, isAnalyzing }) => {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const loaded = loadChapters();
    setChapters(loaded);
    if (loaded.length > 0) {
      setSelectedChapterId(loaded[0].id);
    }
  }, []);

  useEffect(() => {
    const handleChange = () => {
      const loaded = loadChapters();
      setChapters(loaded);
    };
    window.addEventListener("project:change", handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener("project:change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedChapter = chapters.find(c => c.id === selectedChapterId);

  const handleAnalyze = () => {
    if (!selectedChapter) return;
    const plainText = stripHtml(selectedChapter.content || "");
    const characters = extractCharacters(selectedChapter.content || "");
    onAnalyze(plainText, selectedChapter.title, characters);
  };

  if (chapters.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center mb-6">
        <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500 mb-2">No chapters found</p>
        <Link 
          to="/compose" 
          className="text-sm font-medium"
          style={{ color: BRAND.gold }}
        >
          Go to Writer →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${BRAND.navy}15` }}
        >
          <Sparkles size={20} style={{ color: BRAND.navy }} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">AI Chapter Analysis</h3>
          <p className="text-sm text-slate-500">Select a chapter to extract character priorities</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Chapter Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-sm font-medium text-slate-700 min-w-[220px] justify-between"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-slate-400" />
              <span className="truncate max-w-[150px]">
                {selectedChapter?.title || "Select chapter"}
              </span>
            </div>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-slate-200 min-w-[280px] max-h-[300px] overflow-y-auto">
              {chapters.map((chapter, idx) => (
                <button
                  key={chapter.id}
                  onClick={() => {
                    setSelectedChapterId(chapter.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${
                    chapter.id === selectedChapterId ? 'bg-amber-50' : ''
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-700 truncate">{chapter.title}</div>
                  </div>
                  {chapter.id === selectedChapterId && (
                    <Check size={16} style={{ color: BRAND.gold }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!selectedChapter || isAnalyzing}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Analyze Chapter
            </>
          )}
        </button>
      </div>
    </div>
  );
};

/* ============================================
   PRIORITY CARD
   ============================================ */
function PriorityCard({ card, index, onEdit, onDelete, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const priorityColor = card.priority === "High" ? "text-red-500" :
                        card.priority === "Medium" ? "text-amber-500" : "text-slate-400";

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm transition-all ${
        isDragging ? "opacity-50 scale-95" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing pt-1 text-slate-300" title="Drag to reorder">
          <GripVertical size={18} />
        </div>

        <div className="flex-1">
          {/* Character badge */}
          {card.character && (
            <div className="flex items-center gap-1 mb-2">
              <User size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500">{card.character}</span>
            </div>
          )}
          
          <input
            value={card.title}
            onChange={(e) => onEdit(card.id, { title: e.target.value })}
            className="w-full bg-transparent border-b border-slate-200 focus:border-amber-400 outline-none text-slate-800 font-medium"
            placeholder="Priority title"
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs bg-slate-50">
              <Tag size={12} className="text-slate-400" />
              <select
                value={card.scope}
                onChange={(e) => onEdit(card.id, { scope: e.target.value })}
                className="bg-transparent outline-none text-slate-600"
              >
                <option>Character</option>
                <option>Plot</option>
                <option>World</option>
                <option>Craft</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs bg-slate-50">
              <Flag size={12} className={priorityColor} />
              <select
                value={card.priority}
                onChange={(e) => onEdit(card.id, { priority: e.target.value })}
                className="bg-transparent outline-none text-slate-600"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs bg-slate-50">
              <CheckCircle size={12} className="text-emerald-500" />
              <select
                value={card.status}
                onChange={(e) => onEdit(card.id, { status: e.target.value })}
                className="bg-transparent outline-none text-slate-600"
              >
                <option>Open</option>
                <option>In Session</option>
                <option>Done</option>
              </select>
            </span>

            {/* Priority type badge */}
            {card.priorityType && (
              <span 
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
                style={{ 
                  background: card.priorityType === "Want" ? `${BRAND.gold}15` :
                             card.priorityType === "Fear" ? "#fef2f2" :
                             card.priorityType === "Need" ? "#f0fdf4" :
                             `${BRAND.mauve}20`,
                  color: card.priorityType === "Want" ? BRAND.gold :
                         card.priorityType === "Fear" ? "#dc2626" :
                         card.priorityType === "Need" ? "#16a34a" :
                         BRAND.navy
                }}
              >
                {card.priorityType}
              </span>
            )}

            {/* AI source badge */}
            {card.source === "AI Suggestion" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <Sparkles size={10} />
                AI
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function PriorityCards() {
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [priorities, setPriorities] = useState(() => loadPriorities());
  const [saving, setSaving] = useState("idle");
  const [draggingIndex, setDraggingIndex] = useState(null);
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisError, setAnalysisError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Project switch listener
  useEffect(() => {
    const handleSwitch = () => {
      const newId = getSelectedProjectId();
      if (newId !== currentProjectId) {
        setCurrentProjectId(newId);
        setPriorities(loadPriorities());
      }
    };
    window.addEventListener("project:switch", handleSwitch);
    window.addEventListener("storage", handleSwitch);
    return () => {
      window.removeEventListener("project:switch", handleSwitch);
      window.removeEventListener("storage", handleSwitch);
    };
  }, [currentProjectId]);

  // Auto-save with debounce
  useEffect(() => {
    setSaving("saving");
    const id = setTimeout(() => {
      savePriorities(priorities);
      setSaving("idle");
    }, 500);
    return () => clearTimeout(id);
  }, [priorities]);

  // Add new card
  const addCard = useCallback(() => {
    setPriorities(prev => [...prev, {
      id: uid(),
      title: "New priority",
      scope: "Character",
      priority: "Medium",
      status: "Open",
      done: false,
    }]);
  }, []);

  // Delete card
  const deleteCard = useCallback((id) => {
    setPriorities(prev => prev.filter(c => c.id !== id));
  }, []);

  // Edit card
  const editCard = useCallback((id, patch) => {
    setPriorities(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((index) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((overIndex) => {
    if (draggingIndex === null || draggingIndex === overIndex) return;
    setPriorities(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(draggingIndex, 1);
      copy.splice(overIndex, 0, moved);
      return copy;
    });
    setDraggingIndex(overIndex);
  }, [draggingIndex]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  // AI Analysis
  const analyzeChapter = useCallback(async (chapterText, chapterTitle, characters) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSuggestions([]);
    setShowSuggestions(true);

    const truncatedText = chapterText.slice(0, 4000);
    const charList = characters.length > 0 ? characters.join(", ") : "any characters you can identify";

    const prompt = `Analyze this chapter excerpt and suggest character priorities. For each main character, identify:

1. **WANT** - What they consciously desire or are pursuing
2. **FEAR** - What they're afraid of or trying to avoid  
3. **NEED** - What they truly need for growth (may differ from want)
4. **SECRET** - What they're hiding or not revealing

Characters to focus on: ${charList}

Chapter: "${chapterTitle}"
---
${truncatedText}
---

Respond ONLY with a JSON array. Each suggestion should have:
- "character": character name
- "type": "Want", "Fear", "Need", or "Secret"
- "title": brief description (under 15 words)
- "reason": short quote or evidence (under 20 words)

Return 4-8 suggestions. JSON array only.`;

    try {
      const result = await runAssistant(prompt, "clarify", "", "anthropic");
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSuggestions(parsed);
        } else {
          setAnalysisError("No character priorities found in this chapter.");
        }
      } else {
        setAnalysisError("Couldn't parse AI suggestions. Please try again.");
      }
    } catch (err) {
      console.error("AI analysis error:", err);
      setAnalysisError("Failed to analyze chapter. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const acceptSuggestion = useCallback((suggestion) => {
    setPriorities(prev => [...prev, {
      id: uid(),
      title: suggestion.title,
      character: suggestion.character,
      priorityType: suggestion.type,
      scope: "Character",
      priority: suggestion.type === "Fear" ? "High" : "Medium",
      status: "Open",
      done: false,
      source: "AI Suggestion",
    }]);
    setSuggestions(prev => prev.filter(s => 
      !(s.character === suggestion.character && s.type === suggestion.type && s.title === suggestion.title)
    ));
  }, []);

  const rejectSuggestion = useCallback((index) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const acceptAllSuggestions = useCallback(() => {
    const newCards = suggestions.map(suggestion => ({
      id: uid(),
      title: suggestion.title,
      character: suggestion.character,
      priorityType: suggestion.type,
      scope: "Character",
      priority: suggestion.type === "Fear" ? "High" : "Medium",
      status: "Open",
      done: false,
      source: "AI Suggestion",
    }));
    setPriorities(prev => [...prev, ...newCards]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [suggestions]);

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    setAnalysisError(null);
  }, []);

  const saveNow = () => {
    setSaving("saving");
    savePriorities(priorities);
    setTimeout(() => setSaving("idle"), 300);
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Priority Cards
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SavingBadge state={saving} />
            <Link
              to="/story-lab/workshop"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              Workshop Hub
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageBanner projectId={currentProjectId} cardCount={priorities.length} />

        {/* AI Analyzer */}
        <AIAnalyzer onAnalyze={analyzeChapter} isAnalyzing={isAnalyzing} />

        {/* AI Suggestions */}
        {showSuggestions && (
          <SuggestionsPanel
            suggestions={suggestions}
            onAccept={acceptSuggestion}
            onReject={rejectSuggestion}
            onAcceptAll={acceptAllSuggestions}
            onClose={closeSuggestions}
            isLoading={isAnalyzing}
            error={analysisError}
          />
        )}

        {/* Add Card Button */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-slate-500">{priorities.length} priority cards</span>
          <button
            onClick={addCard}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} />
            Add Card
          </button>
        </div>

        {/* Cards Grid */}
        <div className="space-y-3">
          {priorities.map((card, index) => (
            <PriorityCard
              key={card.id}
              card={card}
              index={index}
              onEdit={editCard}
              onDelete={deleteCard}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              isDragging={draggingIndex === index}
            />
          ))}

          {priorities.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
              <ListChecks size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium mb-2">No priority cards yet</p>
              <p className="text-sm text-slate-400 mb-4">
                Use AI to analyze a chapter, or add cards manually
              </p>
              <button
                onClick={addCard}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
              >
                <Plus size={16} />
                Add Card Manually
              </button>
            </div>
          )}
        </div>

        {/* Stats Footer */}
        {priorities.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl border border-slate-200 px-5 py-4">
            <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
              <div className="flex items-center gap-4 text-slate-500">
                <span>{priorities.filter(c => c.status === "Done").length} Done</span>
                <span>{priorities.filter(c => c.status === "In Session").length} In Session</span>
                <span>{priorities.filter(c => c.status === "Open").length} Open</span>
              </div>
              {priorities.some(c => c.source === "AI Suggestion") && (
                <span className="flex items-center gap-1 text-amber-600">
                  <Sparkles size={14} />
                  {priorities.filter(c => c.source === "AI Suggestion").length} from AI
                </span>
              )}
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveNow}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}
          >
            <Save size={16} />
            Save Now
          </button>
        </div>
      </div>
    </div>
  );
}
