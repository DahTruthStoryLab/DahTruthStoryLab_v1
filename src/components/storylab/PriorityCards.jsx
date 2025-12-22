// src/components/storylab/PriorityCards.jsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
  Heart,
  Eye,
  RefreshCw,
} from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields, uid } from "../../lib/storylab/projectStore";
import { runAssistant } from "../../lib/api";
import BackToLanding, { BackToLandingFab } from "./BackToLanding";

// Brand colors
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
};

// Load chapters from localStorage
function loadChapters() {
  try {
    const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.chapters) ? data.chapters : [];
  } catch {
    return [];
  }
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

/* ---------------------------
   Page banner (light/glass)
---------------------------- */
const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-4 py-1.5">
          <ListChecks size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Priority Cards</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          Drag to reorder · Inline edit · Autosave · <span style={{ color: BRAND.gold }}>✨ AI-powered suggestions</span>
        </p>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------
   AI Suggestions Panel
------------------------------------------------- */
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
                        {suggestion.type === "Want" && <Target size={10} className="inline mr-1" />}
                        {suggestion.type === "Fear" && <AlertCircle size={10} className="inline mr-1" />}
                        {suggestion.type === "Need" && <Heart size={10} className="inline mr-1" />}
                        {suggestion.type === "Secret" && <Eye size={10} className="inline mr-1" />}
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
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
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

/* ------------------------------------------------
   Chapter Selector + AI Analyze Button
------------------------------------------------- */
const AIAnalyzer = ({ onAnalyze, isAnalyzing }) => {
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Load chapters on mount
  useEffect(() => {
    const loaded = loadChapters();
    setChapters(loaded);
    if (loaded.length > 0) {
      setSelectedChapterId(loaded[0].id);
    }
  }, []);

  // Listen for project changes
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

  // Close dropdown when clicking outside
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
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
        <BookOpen size={24} className="mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-500">No chapters found. Import a manuscript first.</p>
        <Link 
          to="/compose" 
          className="text-sm font-medium mt-2 inline-block"
          style={{ color: BRAND.gold }}
        >
          Go to Writer →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Chapter Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-sm font-medium text-slate-700 min-w-[200px] justify-between"
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
                    <div className="text-xs text-slate-400">{chapter.wordCount || 0} words</div>
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
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}, #2d4a6f)` }}
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

        {/* Help text */}
        <span className="text-xs text-slate-500">
          AI will suggest character priorities based on the selected chapter
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------
   DraggableCard - Internal component for cards
------------------------------------------------- */
const DraggableCard = ({ card, index, isDragging, onEdit, onDelete, moveCard }) => {
  const dragRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (e) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e) => {
    dragOverItem.current = index;
    if (dragItem.current !== null && dragItem.current !== dragOverItem.current) {
      moveCard(dragItem.current, dragOverItem.current);
      dragItem.current = dragOverItem.current;
    }
  };

  const handleDragEnd = (e) => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Priority color coding
  const priorityColor = card.priority === "High" ? "text-red-500" :
                        card.priority === "Medium" ? "text-amber-500" : "text-slate-400";

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={handleDragEnd}
      className={`bg-white/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm transition-all ${
        isDragging ? "opacity-50 rotate-[0.5deg] shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing pt-1 text-muted" title="Drag to reorder">
          <GripVertical />
        </div>

        <div className="flex-1">
          {/* Character badge if present */}
          {card.character && (
            <div className="flex items-center gap-1 mb-2">
              <User size={12} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500">{card.character}</span>
            </div>
          )}
          
          <input
            value={card.title}
            onChange={(e) => onEdit(card.id, { title: e.target.value })}
            className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-ink text-base"
            placeholder="Priority title"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <Tag className="h-3 w-3" />
              <select
                value={card.scope}
                onChange={(e) => onEdit(card.id, { scope: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>Character</option>
                <option>Plot</option>
                <option>World</option>
                <option>Craft</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <Flag className={`h-3 w-3 ${priorityColor}`} />
              <select
                value={card.priority}
                onChange={(e) => onEdit(card.id, { priority: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              <select
                value={card.status}
                onChange={(e) => onEdit(card.id, { status: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>Open</option>
                <option>In Session</option>
                <option>Done</option>
              </select>
            </span>

            {/* Priority type badge */}
            {card.priorityType && (
              <span 
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs"
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
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="bg-white/70 border border-border p-2 rounded-lg text-muted hover:text-ink transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------
   PriorityCards (single export — no duplicates)
------------------------------------------------- */
export default function PriorityCards() {
  // Initialize project state with workshop fields (memoized)
  const initialProject = useMemo(() => ensureWorkshopFields(loadProject()), []);
  const [project, setProject] = useState(initialProject);
  const [dragging, setDragging] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [analysisError, setAnalysisError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Memoized items array
  const items = useMemo(() => 
    Array.isArray(project.priorities) ? project.priorities : [], 
    [project.priorities]
  );

  // Commit changes to project store and trigger updates (memoized callback)
  const commit = useCallback((mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try { 
      window.dispatchEvent(new Event("project:change")); 
    } catch {}
  }, [project]);

  // Persist whenever project changes
  useEffect(() => {
    saveProject(project);
  }, [project]);

  // Add new priority card (memoized)
  const add = useCallback(() => {
    commit((p) => {
      p.priorities.push({
        id: uid(),
        title: "New priority",
        scope: "Character",
        priority: "Medium",
        status: "Open",
        done: false,
      });
    });
  }, [commit]);

  // Delete priority card by id (memoized)
  const del = useCallback((id) => {
    commit((p) => { 
      p.priorities = p.priorities.filter((c) => c.id !== id); 
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [commit, selectedId]);

  // Edit priority card fields (memoized)
  const edit = useCallback((id, patch) => {
    commit((p) => {
      const it = p.priorities.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    });
  }, [commit]);

  // Enhanced moveCard function for drag-and-drop reordering (memoized)
  const moveCard = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    commit((p) => {
      const result = [...p.priorities];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      p.priorities = result;
    });
  }, [commit]);

  // Drag & drop handlers (keeping for compatibility)
  const onDragStart = useCallback((id) => {
    setDragging(id);
    setSelectedId(id);
  }, []);

  const onDragOver = useCallback((e, overId) => {
    e.preventDefault();
    if (!dragging || dragging === overId) return;
    commit((p) => {
      const a = p.priorities.findIndex((c) => c.id === dragging);
      const b = p.priorities.findIndex((c) => c.id === overId);
      if (a !== -1 && b !== -1) {
        const [moved] = p.priorities.splice(a, 1);
        p.priorities.splice(b, 0, moved);
      }
    });
  }, [dragging, commit]);

  const onDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // Select card handler
  const selectCard = useCallback((id) => {
    setSelectedId(id);
  }, []);

  // ============ AI Analysis Functions ============
  
  const analyzeChapter = useCallback(async (chapterText, chapterTitle, characters) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setSuggestions([]);
    setShowSuggestions(true);

    // Limit text to ~4000 chars for API
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

Respond ONLY with a JSON array of suggestions. Each suggestion should have:
- "character": character name
- "type": "Want", "Fear", "Need", or "Secret"
- "title": brief description of the priority (under 15 words)
- "reason": a short quote or evidence from the text (under 20 words)

Example format:
[
  {"character": "Grace", "type": "Want", "title": "To protect her family from financial ruin", "reason": "She counted the bills again, hands trembling"},
  {"character": "Marcus", "type": "Fear", "title": "Being seen as weak by his community", "reason": "He couldn't let them see him break"}
]

Return 4-8 suggestions total. JSON array only, no other text.`;

    try {
      const result = await runAssistant(prompt, "clarify", "", "anthropic");
      
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      // Try to parse JSON from response
      let parsed = [];
      try {
        // Find JSON array in response
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.error("Failed to parse AI response:", parseErr);
        setAnalysisError("Couldn't parse AI suggestions. Please try again.");
        return;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        setSuggestions(parsed);
      } else {
        setAnalysisError("No character priorities found in this chapter. Try a chapter with more character development.");
      }
    } catch (err) {
      console.error("AI analysis error:", err);
      setAnalysisError("Failed to analyze chapter. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Accept a single suggestion
  const acceptSuggestion = useCallback((suggestion) => {
    commit((p) => {
      p.priorities.push({
        id: uid(),
        title: suggestion.title,
        character: suggestion.character,
        priorityType: suggestion.type,
        scope: "Character",
        priority: suggestion.type === "Fear" ? "High" : "Medium",
        status: "Open",
        done: false,
        source: "AI Suggestion",
      });
    });
    
    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => 
      !(s.character === suggestion.character && s.type === suggestion.type && s.title === suggestion.title)
    ));
  }, [commit]);

  // Reject a suggestion
  const rejectSuggestion = useCallback((index) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Accept all suggestions
  const acceptAllSuggestions = useCallback(() => {
    commit((p) => {
      suggestions.forEach(suggestion => {
        p.priorities.push({
          id: uid(),
          title: suggestion.title,
          character: suggestion.character,
          priorityType: suggestion.type,
          scope: "Character",
          priority: suggestion.type === "Fear" ? "High" : "Medium",
          status: "Open",
          done: false,
          source: "AI Suggestion",
        });
      });
    });
    setSuggestions([]);
    setShowSuggestions(false);
  }, [commit, suggestions]);

  // Close suggestions panel
  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSuggestions([]);
    setAnalysisError(null);
  }, []);

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to Workshop Hub */}
      <BackToLanding
        title="Priority Cards"
        rightSlot={
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-border hover:bg-white"
            title="Open Workshop Hub"
          >
            Workshop Hub
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageBanner />

        <div className="space-y-4">
          {/* AI Chapter Analyzer */}
          <AIAnalyzer onAnalyze={analyzeChapter} isAnalyzing={isAnalyzing} />

          {/* AI Suggestions Panel */}
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

          {/* Controls */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-border rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl px-3 py-1 border border-border bg-white/60">
                Priority Cards
                {selectedId && <span className="ml-2 text-xs text-muted">• Selected</span>}
              </div>
              <span className="text-sm text-muted">Drag to reorder · Inline edit</span>
            </div>
            <button
              onClick={add}
              className="rounded-lg px-3 py-2 border border-border bg-white hover:bg-white/90 text-sm transition-colors"
              title="Add card"
            >
              <Plus className="h-4 w-4 inline mr-1" /> Add Card
            </button>
          </div>

          {/* Cards Grid - Using DraggableCard component */}
          <div className="grid gap-3">
            {items.map((card, index) => (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                isDragging={dragging === card.id}
                onEdit={edit}
                onDelete={del}
                moveCard={moveCard}
              />
            ))}

            {items.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-2xl border border-dashed border-slate-300">
                <ListChecks size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 mb-2">No priority cards yet</p>
                <p className="text-sm text-slate-400 mb-4">
                  Use AI to analyze a chapter, or add cards manually
                </p>
                <button
                  onClick={add}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50"
                >
                  <Plus size={16} />
                  Add Card Manually
                </button>
              </div>
            )}
          </div>

          {/* Stats footer */}
          {items.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 text-sm text-muted">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span>Total Cards: {items.length}</span>
                <div className="flex items-center gap-4">
                  <span>
                    {items.filter(c => c.status === "Done").length} Done · {" "}
                    {items.filter(c => c.status === "In Session").length} In Session · {" "}
                    {items.filter(c => c.status === "Open").length} Open
                  </span>
                  {items.some(c => c.source === "AI Suggestion") && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Sparkles size={12} />
                      {items.filter(c => c.source === "AI Suggestion").length} from AI
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile "Back to Landing" button */}
      <BackToLandingFab />
    </div>
  );
}
