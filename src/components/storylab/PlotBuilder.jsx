// src/components/storylab/PlotBuilder.jsx
// FIXED: Correct project-switching logic with project:change event
// Plot Builder - Build story blocks organized by plot function

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Flame,
  Zap,
  Star,
  Sparkles,
  Plus,
  GripVertical,
  Trash2,
  User,
  ChevronDown,
  Check,
  X,
  ArrowLeft,
  Send,
  BookOpen,
  Save,
  Loader2,
  AlertCircle,
  Flag,
  Eye,
  Layers,
  Heart,
  Target,
  RefreshCw,
} from "lucide-react";
import { runAssistant } from "../../lib/api";

/* ============================================
   BRAND COLORS (matching StoryLab)
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldLight: "#f5e6b3",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  roseDark: "#c97b7b",
  ink: "#0F172A",
  cream: "#fefdfb",
};

/* ============================================
   PLOT GROUPS CONFIG
   ============================================ */
const PLOT_GROUPS = [
  {
    id: "heat",
    title: "Raise the Heat",
    icon: Flame,
    color: "#dc2626",
    lightColor: "#fef2f2",
    gradient: "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)",
    description: "Stakes, Tension, Pressure",
    prompt: "How can you raise the stakes and build tension for this character? Think about what they could lose, what pressures are mounting, and what makes the situation more urgent.",
    examples: ["Life-or-death consequences", "Ticking clock", "Personal stakes revealed", "Point of no return"]
  },
  {
    id: "obstacles",
    title: "Obstacles",
    icon: Zap,
    color: "#7c3aed",
    lightColor: "#f5f3ff",
    gradient: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 50%, #a855f7 100%)",
    description: "Complications, Conflicts, Barriers",
    prompt: "What obstacles, complications, or conflicts can block this character's path? Think about external barriers, interpersonal conflicts, and self-sabotage.",
    examples: ["Betrayal discovered", "Resource lost", "Ally turns enemy", "Hidden truth emerges"]
  },
  {
    id: "turning",
    title: "Turning Points",
    icon: Star,
    color: BRAND.gold,
    lightColor: BRAND.goldLight,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 50%, #f59e0b 100%)`,
    description: "Key Beats, Climax, Reveals",
    prompt: "What turning points or revelations could shift this character's journey? Think about moments where everything changes, secrets revealed, or climactic confrontations.",
    examples: ["The big reveal", "Point of no return", "Climactic confrontation", "Everything changes"]
  },
  {
    id: "transformation",
    title: "Transformation",
    icon: Sparkles,
    color: BRAND.navy,
    lightColor: "#e8f4fc",
    gradient: `linear-gradient(135deg, #0f172a 0%, ${BRAND.navy} 50%, ${BRAND.navyLight} 100%)`,
    description: "Inner Journey, Growth, Arc",
    prompt: "How does this character transform internally? Think about their growth, what they learn, how their beliefs shift, and who they become.",
    examples: ["Overcomes fear", "Accepts truth", "Makes sacrifice", "Becomes who they need to be"]
  }
];

const STATUS_OPTIONS = ["Planned", "Drafted", "Complete"];

/* ============================================
   PROJECT-AWARE STORAGE
   ============================================ */
const PLOT_KEY_BASE = "dahtruth-plot-builder-v1";
const NARRATIVE_ARC_KEY_BASE = "dt_arc_chars_v2";
const CHAPTERS_KEY_BASE = "dahtruth-story-lab-toc-v3";
const PRIORITIES_KEY_BASE = "dahtruth-priorities-v2";

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

function loadPlotData() {
  try {
    const key = getProjectKey(PLOT_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return { blocks: [] };
    return JSON.parse(raw);
  } catch {
    return { blocks: [] };
  }
}

function savePlotData(data) {
  try {
    const key = getProjectKey(PLOT_KEY_BASE);
    localStorage.setItem(key, JSON.stringify(data));
    console.log(`[PlotBuilder] Saved to key: ${key}`);
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch {
    return false;
  }
}

function loadCharactersFromNarrativeArc() {
  try {
    const key = getProjectKey(NARRATIVE_ARC_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
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

function saveChapters(chapters) {
  try {
    const key = getProjectKey(CHAPTERS_KEY_BASE);
    const existing = localStorage.getItem(key);
    const data = existing ? JSON.parse(existing) : {};
    data.chapters = chapters;
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch {
    return false;
  }
}

function loadPriorities() {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
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
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch {
    return false;
  }
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
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
   CHARACTER SELECTOR
   ============================================ */
function CharacterSelector({ value, onChange, characters, accentColor }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border-2 hover:shadow-md text-sm transition-all"
        style={{ borderColor: value ? accentColor : '#e2e8f0' }}
      >
        <User size={16} style={{ color: accentColor || '#94a3b8' }} />
        <span className={value ? "text-slate-800 font-medium" : "text-slate-400"}>
          {value || "Select character"}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 min-w-[200px] max-h-[250px] overflow-y-auto">
          {characters.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              <User size={20} className="mx-auto mb-2 opacity-50" />
              No characters found
            </div>
          ) : (
            characters.map((char) => (
              <button
                key={char.id || char.name}
                onClick={() => { onChange(char.name); setIsOpen(false); }}
                className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between ${
                  char.name === value ? 'bg-amber-50' : ''
                }`}
              >
                <span className="font-medium">{char.name}</span>
                {char.name === value && <Check size={16} style={{ color: BRAND.gold }} />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================
   STATUS SELECTOR
   ============================================ */
function StatusSelector({ value, onChange }) {
  const colors = {
    "Planned": "bg-slate-100 text-slate-600 border-slate-200",
    "Drafted": "bg-amber-100 text-amber-700 border-amber-200",
    "Complete": "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`text-xs px-2.5 py-1 rounded-full border font-medium cursor-pointer ${colors[value] || colors["Planned"]}`}
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}

/* ============================================
   PLOT BLOCK CARD
   ============================================ */
function PlotBlockCard({ block, onEdit, onDelete, onSendToPriorities, characters, isDragging, groupColor }) {
  return (
    <div
      draggable
      className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-lg transition-all cursor-grab ${
        isDragging ? 'opacity-50 scale-95' : ''
      }`}
      style={{ borderColor: `${groupColor}30` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300" />
          <StatusSelector value={block.status} onChange={(s) => onEdit(block.id, { status: s })} />
        </div>
        <button
          onClick={() => onDelete(block.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Title */}
      <input
        type="text"
        value={block.title}
        onChange={(e) => onEdit(block.id, { title: e.target.value })}
        placeholder="Block title..."
        className="w-full text-sm font-semibold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 mb-2"
      />

      {/* Character */}
      <div className="flex items-center gap-2 mb-2">
        <User size={12} style={{ color: groupColor }} />
        <select
          value={block.character || ""}
          onChange={(e) => onEdit(block.id, { character: e.target.value })}
          className="text-xs text-slate-600 bg-transparent border-none focus:outline-none cursor-pointer"
        >
          <option value="">No character</option>
          {characters.map((c) => (
            <option key={c.id || c.name} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Chapter link indicator */}
      {block.chapterId && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 mb-2 bg-emerald-50 px-2 py-1 rounded-lg inline-flex">
          <BookOpen size={12} />
          <span>Linked to chapter</span>
        </div>
      )}

      {/* Send to Priorities button */}
      <button
        onClick={() => onSendToPriorities(block)}
        className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border-2 border-dashed border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 transition-colors"
      >
        <Send size={12} />
        Send to Priorities
      </button>
    </div>
  );
}

/* ============================================
   PLOT GROUP COLUMN
   ============================================ */
function PlotGroupColumn({ group, blocks, characters, onAddBlock, onEditBlock, onDeleteBlock, onSendToPriorities, onOpenExercise, onDragStart, onDragOver, onDragEnd, draggingId }) {
  const GroupIcon = group.icon;
  const groupBlocks = blocks.filter(b => b.groupId === group.id);

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden shadow-lg border border-slate-200/50">
      {/* Column Header */}
      <div 
        className="px-5 py-5"
        style={{ background: group.gradient }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
              <GroupIcon size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">{group.title}</h3>
              <p className="text-xs text-white/70">{group.description}</p>
            </div>
          </div>
          <span className="text-sm font-bold bg-white/25 px-3 py-1.5 rounded-full text-white">
            {groupBlocks.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <div 
        className="flex-1 p-3 space-y-3 min-h-[320px] overflow-y-auto"
        style={{ background: `linear-gradient(180deg, ${group.lightColor} 0%, #ffffff 100%)` }}
        onDragOver={(e) => e.preventDefault()}
      >
        {groupBlocks.map((block) => (
          <div
            key={block.id}
            draggable
            onDragStart={() => onDragStart(block.id)}
            onDragOver={(e) => { e.preventDefault(); onDragOver(block.id); }}
            onDragEnd={onDragEnd}
          >
            <PlotBlockCard
              block={block}
              onEdit={onEditBlock}
              onDelete={onDeleteBlock}
              onSendToPriorities={onSendToPriorities}
              characters={characters}
              isDragging={draggingId === block.id}
              groupColor={group.color}
            />
          </div>
        ))}

        {groupBlocks.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            <GroupIcon size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No blocks yet</p>
            <p className="text-xs mt-1">Add blocks or try the exercise</p>
          </div>
        )}
      </div>

      {/* Column Footer */}
      <div className="bg-white border-t border-slate-100 p-3 space-y-2">
        <button
          onClick={() => onAddBlock(group.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 text-sm font-medium transition-all"
        >
          <Plus size={16} />
          Add Block
        </button>
        <button
          onClick={() => onOpenExercise(group.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:scale-[1.02] shadow-md"
          style={{ background: group.gradient }}
        >
          <Sparkles size={16} />
          Open Exercise
        </button>
      </div>
    </div>
  );
}

/* ============================================
   EXERCISE PAGE
   ============================================ */
function ExercisePage({ group, blocks, characters, chapters, onBack, onAddBlock, onEditBlock, onDeleteBlock, onSendToChapter, onSendToPriorities }) {
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState("");

  const GroupIcon = group.icon;
  const groupBlocks = blocks.filter(b => b.groupId === group.id);

  // Filter blocks by character if selected
  const displayBlocks = selectedCharacter 
    ? groupBlocks.filter(b => b.character === selectedCharacter)
    : groupBlocks;

  const handleAnalyze = async () => {
    if (!selectedCharacter) {
      setError("Please select a character first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setSuggestions([]);

    const prompt = `You are helping a fiction writer develop their plot. 

CHARACTER: ${selectedCharacter}
PLOT ELEMENT: ${group.title} - ${group.description}

CONTEXT: ${group.prompt}

Examples of this type of plot element:
${group.examples.map(e => `- ${e}`).join('\n')}

Generate 3-4 specific, actionable plot block suggestions for this character. Each suggestion should be:
- Specific to this character
- Related to ${group.title.toLowerCase()}
- Something that could happen in a scene

Respond ONLY with a JSON array. Each item should have:
- "title": A brief description (under 15 words)
- "description": A bit more detail about what happens (under 30 words)

Example format:
[
  {"title": "Discovery of betrayal", "description": "Character finds evidence that their trusted ally has been working against them"},
  {"title": "Time runs out", "description": "The deadline arrives and they must act without full information"}
]

JSON array only, no other text.`;

    try {
      const result = await runAssistant(prompt, "clarify", "", "openai");
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setSuggestions(parsed);
      } else {
        setError("Couldn't parse AI suggestions. Please try again.");
      }
    } catch (err) {
      console.error("AI analysis error:", err);
      setError("Failed to get suggestions. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const acceptSuggestion = (suggestion, sendToChapter = false) => {
    const newBlock = {
      id: uid(),
      groupId: group.id,
      title: suggestion.title,
      description: suggestion.description,
      character: selectedCharacter,
      status: "Planned",
      chapterId: sendToChapter ? selectedChapterId : null,
      createdAt: Date.now(),
    };
    
    onAddBlock(group.id, newBlock);

    // If sending to chapter, add highlighted text
    if (sendToChapter && selectedChapterId) {
      onSendToChapter(newBlock, selectedChapterId);
    }

    // Remove from suggestions
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 font-medium"
          >
            <ArrowLeft size={18} />
            Back to Plot Builder
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Exercise Hero Banner */}
        <div 
          className="rounded-3xl p-10 mb-8 text-white relative overflow-hidden"
          style={{ background: group.gradient }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20" style={{ background: 'white', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'white', filter: 'blur(60px)' }} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                <GroupIcon size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{group.title}</h1>
                <p className="text-white/80 text-lg">{group.description}</p>
              </div>
            </div>
            <p className="text-white/90 text-lg max-w-2xl">{group.prompt}</p>
            
            <div className="mt-6 flex flex-wrap gap-2">
              {group.examples.map((ex, i) => (
                <span key={i} className="text-xs bg-white/20 px-3 py-1.5 rounded-full text-white/90">
                  {ex}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggestion Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${BRAND.gold}20` }}
            >
              <Sparkles size={20} style={{ color: BRAND.gold }} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">AI-Powered Suggestions</h3>
              <p className="text-sm text-slate-500">Get ideas tailored to your character</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <CharacterSelector
              value={selectedCharacter}
              onChange={setSelectedCharacter}
              characters={characters}
              accentColor={group.color}
            />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedCharacter}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100 shadow-lg"
              style={{ background: group.gradient }}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Generate Ideas
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 rounded-xl text-red-700 text-sm mb-4 border border-red-200">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-3 p-3 bg-slate-50 rounded-xl">
                <span className="text-sm font-medium text-slate-600">Send to chapter:</span>
                <select
                  value={selectedChapterId}
                  onChange={(e) => setSelectedChapterId(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Don't send to chapter</option>
                  {chapters.map((ch, idx) => (
                    <option key={ch.id} value={ch.id}>
                      Ch {idx + 1}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>

              {suggestions.map((suggestion, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl p-5 border-2 transition-all hover:shadow-md"
                  style={{ borderColor: `${group.color}30`, background: `${group.color}05` }}
                >
                  <h4 className="font-semibold text-slate-800 mb-1">{suggestion.title}</h4>
                  <p className="text-sm text-slate-600 mb-4">{suggestion.description}</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => acceptSuggestion(suggestion, false)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <Plus size={16} />
                      Add Block
                    </button>
                    {selectedChapterId && (
                      <button
                        onClick={() => acceptSuggestion(suggestion, true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-md transition-all hover:scale-105"
                        style={{ background: group.gradient }}
                      >
                        <Send size={16} />
                        Add & Send to Chapter
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Blocks */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg">
              Your {group.title} Blocks ({displayBlocks.length})
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500">Filter:</span>
              <select
                value={selectedCharacter}
                onChange={(e) => setSelectedCharacter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2"
              >
                <option value="">All characters</option>
                {characters.map((c) => (
                  <option key={c.id || c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {displayBlocks.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <GroupIcon size={48} className="mx-auto mb-4 opacity-30" />
              <p className="font-medium text-lg">No blocks yet</p>
              <p className="text-sm mt-1">Use AI suggestions above or add manually below</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {displayBlocks.map((block) => (
                <div 
                  key={block.id} 
                  className="rounded-xl p-4 border-2"
                  style={{ borderColor: `${group.color}25`, background: `${group.color}05` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <StatusSelector 
                      value={block.status} 
                      onChange={(s) => onEditBlock(block.id, { status: s })} 
                    />
                    <button
                      onClick={() => onDeleteBlock(block.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={block.title}
                    onChange={(e) => onEditBlock(block.id, { title: e.target.value })}
                    className="w-full font-semibold text-slate-800 bg-transparent border-none focus:outline-none mb-2"
                  />
                  {block.character && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <User size={12} style={{ color: group.color }} />
                      {block.character}
                    </div>
                  )}
                  {block.chapterId && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 mb-2 bg-emerald-50 px-2 py-1 rounded-lg inline-flex">
                      <BookOpen size={12} />
                      Linked to chapter
                    </div>
                  )}
                  <button
                    onClick={() => onSendToPriorities(block)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-white transition-colors"
                  >
                    <Send size={12} />
                    Send to Priorities
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Manual Block */}
          <button
            onClick={() => onAddBlock(group.id, {
              id: uid(),
              groupId: group.id,
              title: "New block",
              character: selectedCharacter || "",
              status: "Planned",
              createdAt: Date.now(),
            })}
            className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 font-medium transition-all"
          >
            <Plus size={20} />
            Add Block Manually
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function PlotBuilder() {
  // ===== FIXED: Project ID tracking =====
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [plotData, setPlotData] = useState(() => loadPlotData());
  const [characters, setCharacters] = useState(() => loadCharactersFromNarrativeArc());
  const [chapters, setChapters] = useState(() => loadChapters());
  const [saving, setSaving] = useState("idle");
  const [activeExercise, setActiveExercise] = useState(null); // group id or null
  const [draggingId, setDraggingId] = useState(null);
  const [viewMode, setViewMode] = useState("group"); // "group" or "character"

  const blocks = plotData.blocks || [];

  // ===== FIXED: Project switching with correct event names =====
  useEffect(() => {
    const reloadAllData = () => {
      console.log(`[PlotBuilder] Reloading data for project: ${getSelectedProjectId()}`);
      setPlotData(loadPlotData());
      setCharacters(loadCharactersFromNarrativeArc());
      setChapters(loadChapters());
      setActiveExercise(null);
      setDraggingId(null);
    };

    const handleProjectChange = () => {
      const newProjectId = getSelectedProjectId();
      if (newProjectId !== currentProjectId) {
        console.log(`[PlotBuilder] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };

    const handleDataChange = () => {
      // Reload chapters and characters when other modules update
      setChapters(loadChapters());
      setCharacters(loadCharactersFromNarrativeArc());
    };

    // Listen for project changes and data updates
    window.addEventListener("project:change", handleDataChange);
    window.addEventListener("storage", handleProjectChange);
    
    return () => {
      window.removeEventListener("project:change", handleDataChange);
      window.removeEventListener("storage", handleProjectChange);
    };
  }, [currentProjectId]);

  // Auto-save with debounce
  useEffect(() => {
    setSaving("saving");
    const id = setTimeout(() => {
      savePlotData(plotData);
      setSaving("idle");
    }, 500);
    return () => clearTimeout(id);
  }, [plotData]);

  // Refresh characters
  const refreshCharacters = () => {
    setCharacters(loadCharactersFromNarrativeArc());
  };

  // Block operations
  const addBlock = useCallback((groupId, blockData = null) => {
    const newBlock = blockData || {
      id: uid(),
      groupId,
      title: "New block",
      character: "",
      status: "Planned",
      createdAt: Date.now(),
    };
    setPlotData(prev => ({
      ...prev,
      blocks: [...(prev.blocks || []), newBlock]
    }));
  }, []);

  const editBlock = useCallback((id, patch) => {
    setPlotData(prev => ({
      ...prev,
      blocks: (prev.blocks || []).map(b => b.id === id ? { ...b, ...patch } : b)
    }));
  }, []);

  const deleteBlock = useCallback((id) => {
    setPlotData(prev => ({
      ...prev,
      blocks: (prev.blocks || []).filter(b => b.id !== id)
    }));
  }, []);

  // Drag and drop
  const handleDragStart = useCallback((id) => setDraggingId(id), []);
  const handleDragEnd = useCallback(() => setDraggingId(null), []);
  const handleDragOver = useCallback((overId) => {
    if (!draggingId || draggingId === overId) return;
    setPlotData(prev => {
      const blocks = [...(prev.blocks || [])];
      const fromIdx = blocks.findIndex(b => b.id === draggingId);
      const toIdx = blocks.findIndex(b => b.id === overId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = blocks.splice(fromIdx, 1);
        blocks.splice(toIdx, 0, moved);
      }
      return { ...prev, blocks };
    });
  }, [draggingId]);

  // Send to chapter (with highlight)
  const sendToChapter = useCallback((block, chapterId) => {
    const chaptersCopy = [...chapters];
    const idx = chaptersCopy.findIndex(c => c.id === chapterId);
    if (idx !== -1) {
      const highlightedText = `<p><mark style="background-color: ${BRAND.goldLight}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">📊 [PLOT: ${block.title}]</mark></p>`;
      chaptersCopy[idx].content = (chaptersCopy[idx].content || "") + highlightedText;
      saveChapters(chaptersCopy);
      setChapters(chaptersCopy);
      
      // Update block with chapter link
      editBlock(block.id, { chapterId });
    }
  }, [chapters, editBlock]);

  // Send to priorities
  const sendToPriorities = useCallback((block) => {
    const priorities = loadPriorities();
    priorities.push({
      id: uid(),
      title: block.title,
      character: block.character,
      scope: "Plot",
      priority: "Medium",
      status: "Open",
      done: false,
      source: "Plot Builder",
    });
    savePriorities(priorities);
    alert(`"${block.title}" sent to Priority Cards!`);
  }, []);

  const saveNow = () => {
    setSaving("saving");
    savePlotData(plotData);
    setTimeout(() => setSaving("idle"), 300);
  };

  // Exercise page
  if (activeExercise) {
    const group = PLOT_GROUPS.find(g => g.id === activeExercise);
    return (
      <ExercisePage
        group={group}
        blocks={blocks}
        characters={characters}
        chapters={chapters}
        onBack={() => setActiveExercise(null)}
        onAddBlock={addBlock}
        onEditBlock={editBlock}
        onDeleteBlock={deleteBlock}
        onSendToChapter={sendToChapter}
        onSendToPriorities={sendToPriorities}
      />
    );
  }

  // Main view
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Plot Builder
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SavingBadge state={saving} />
            <Link
              to="/story-lab/workshop"
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 shadow-md"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              Workshop Hub
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div 
          className="rounded-3xl p-10 mb-10 text-white text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 30%, ${BRAND.mauve} 70%, ${BRAND.rose} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: 'blur(100px)' }} />
          
          <div className="relative z-10">
            {/* Icon Quartet */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#dc262640' }}>
                <Flame size={24} className="text-red-300" />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#7c3aed40' }}>
                <Zap size={24} className="text-purple-300" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <Layers size={28} className="text-white" />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.gold}40` }}>
                <Star size={24} style={{ color: BRAND.goldLight }} />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.navy}60` }}>
                <Sparkles size={24} style={{ color: BRAND.cream }} />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">
              <span className="text-red-300">Heat</span>
              <span className="mx-2 opacity-50">•</span>
              <span className="text-purple-300">Obstacles</span>
              <span className="mx-2 opacity-50">•</span>
              <span style={{ color: BRAND.goldLight }}>Turns</span>
              <span className="mx-2 opacity-50">•</span>
              <span style={{ color: BRAND.cream }}>Transform</span>
            </h1>
            
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Build your story's architecture block by block. Raise the stakes, create obstacles, design turning points, and track character transformation.
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/60 flex-wrap">
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-red-400" />
                <span>Raise stakes</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-400" />
                <span>Create barriers</span>
              </div>
              <div className="flex items-center gap-2">
                <Star size={14} style={{ color: BRAND.gold }} />
                <span>Key moments</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: BRAND.mauve }} />
                <span>Inner growth</span>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/40">
              Project: {currentProjectId} · {blocks.length} blocks
            </div>
          </div>
        </div>

        {/* View Toggle & Character Count */}
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 font-medium">View:</span>
            <button
              onClick={() => setViewMode("group")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === "group" 
                  ? "text-white shadow-md" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
              style={viewMode === "group" ? { background: BRAND.navy } : {}}
            >
              By Group
            </button>
            <button
              onClick={() => setViewMode("character")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                viewMode === "character" 
                  ? "text-white shadow-md" 
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
              }`}
              style={viewMode === "character" ? { background: BRAND.navy } : {}}
            >
              By Character
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User size={16} style={{ color: BRAND.gold }} />
              <span><strong>{characters.length}</strong> characters from Narrative Arc</span>
            </div>
            <button
              onClick={refreshCharacters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>

        {/* Trello-style Columns */}
        {viewMode === "group" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLOT_GROUPS.map(group => (
              <PlotGroupColumn
                key={group.id}
                group={group}
                blocks={blocks}
                characters={characters}
                onAddBlock={addBlock}
                onEditBlock={editBlock}
                onDeleteBlock={deleteBlock}
                onSendToPriorities={sendToPriorities}
                onOpenExercise={setActiveExercise}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                draggingId={draggingId}
              />
            ))}
          </div>
        )}

        {/* By Character View */}
        {viewMode === "character" && (
          <div className="space-y-6">
            {characters.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <User size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium text-lg mb-2">No characters found</p>
                <p className="text-sm text-slate-400">Add characters in Narrative Arc first</p>
                <Link
                  to="/story-lab/narrative-arc"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                  style={{ background: BRAND.navy }}
                >
                  Go to Narrative Arc →
                </Link>
              </div>
            ) : (
              characters.map(char => {
                const charBlocks = blocks.filter(b => b.character === char.name);
                return (
                  <div key={char.id || char.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div 
                      className="px-6 py-5 border-b border-slate-100 flex items-center justify-between"
                      style={{ background: `linear-gradient(135deg, ${char.color || BRAND.navy}15 0%, white 100%)` }}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md"
                          style={{ background: char.color || BRAND.navy }}
                        >
                          {char.initials || char.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">{char.name}</h3>
                          <p className="text-sm text-slate-500">{char.role || "Character"}</p>
                        </div>
                      </div>
                      <span className="text-sm font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">
                        {charBlocks.length} blocks
                      </span>
                    </div>
                    <div className="p-5">
                      {charBlocks.length === 0 ? (
                        <p className="text-center py-8 text-slate-400 text-sm">No blocks for this character yet</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          {PLOT_GROUPS.map(group => {
                            const groupCharBlocks = charBlocks.filter(b => b.groupId === group.id);
                            if (groupCharBlocks.length === 0) return null;
                            return (
                              <div key={group.id}>
                                <div className="flex items-center gap-2 mb-3">
                                  <group.icon size={16} style={{ color: group.color }} />
                                  <span className="text-sm font-semibold text-slate-600">{group.title}</span>
                                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                                    {groupCharBlocks.length}
                                  </span>
                                </div>
                                {groupCharBlocks.map(block => (
                                  <div 
                                    key={block.id} 
                                    className="rounded-xl p-3 mb-2 border-l-4"
                                    style={{ background: group.lightColor, borderColor: group.color }}
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium text-slate-700 text-sm truncate">{block.title}</span>
                                    </div>
                                    <StatusSelector 
                                      value={block.status} 
                                      onChange={(s) => editBlock(block.id, { status: s })} 
                                    />
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Save Button Footer */}
        <div className="mt-10 flex items-center justify-between">
          <SavingBadge state={saving} />
          <button
            onClick={saveNow}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}
          >
            <Save size={18} />
            Save Now
          </button>
        </div>

        {/* Integration Note */}
        <div className="mt-8 p-6 rounded-2xl border border-slate-200 bg-white/80">
          <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Layers size={18} style={{ color: BRAND.gold }} />
            How Plot Builder Connects
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <span style={{ color: BRAND.navy }}>←</span>
              <span>Characters from <strong>Narrative Arc</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: BRAND.gold }}>→</span>
              <span>Blocks to <strong>Priority Cards</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: BRAND.rose }}>→</span>
              <span>Highlights to <strong>Chapters</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span style={{ color: BRAND.mauve }}>↔</span>
              <span>View by <strong>Character</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

