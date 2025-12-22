// src/components/storylab/CharacterRoadmap.jsx
import React, { useState, useRef, useMemo, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  GripVertical,
  Users,
  Target,
  Clock,
  Network,
  ChevronDown,
  Link2,
  ArrowRight,
  Heart,
  Swords,
  HelpCircle,
  Sparkles,
  BookOpen,
  User,
  Edit3,
  Check,
  X,
  ArrowLeft,
  Wand2,
  Loader2,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  FileText,
  Star,
  Shield,
  AlertCircle,
  Eye,
  ListChecks,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { runAssistant } from "../../lib/api";
import { loadProject } from "../../lib/storylab/projectStore";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
  navyLight: "#2d4a6f",
  goldLight: "#e6c860",
  mauveLight: "#d4c8e0",
};

/* ---------------------------
   Character Roles
---------------------------- */
const CHARACTER_ROLES = [
  { id: "protagonist", label: "Protagonist", icon: Star, color: BRAND.gold, description: "Main character - full arc (6-8 milestones)" },
  { id: "antagonist", label: "Antagonist", icon: Shield, color: "#ef4444", description: "Opposition - shorter arc (3-5 milestones)" },
  { id: "supporting", label: "Supporting", icon: Users, color: BRAND.mauve, description: "Supporting character" },
];

/* ---------------------------
   Storage Keys (match ComposePage)
---------------------------- */
const STORYLAB_KEY = "dahtruth-story-lab-toc-v3";
const ROADMAP_KEY = "dahtruth-character-roadmap";

/* ---------------------------
   Utility: Generate unique ID
---------------------------- */
function uid() {
  try {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {}
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
}

/* ---------------------------
   Strip HTML to plain text
---------------------------- */
function stripHtml(html = "") {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/* ---------------------------
   Extract characters from chapter content (same as ComposePage)
---------------------------- */
function extractCharactersFromChapters(chapters = []) {
  const charSet = new Set();
  const charPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi;

  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    let match;
    while ((match = charPattern.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) charSet.add(name);
    }
  });

  return Array.from(charSet).sort();
}

/* ---------------------------
   Load all priorities from project store
---------------------------- */
function loadAllPriorities() {
  try {
    const project = loadProject();
    return project?.priorities || [];
  } catch {
    return [];
  }
}

/* ---------------------------
   Load data from localStorage
---------------------------- */
function loadStoryLabData() {
  try {
    const raw = localStorage.getItem(STORYLAB_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[CharacterRoadmap] Failed to load StoryLab data:", err);
  }
  return null;
}

function loadRoadmapData() {
  try {
    const raw = localStorage.getItem(ROADMAP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[CharacterRoadmap] Failed to load roadmap data:", err);
  }
  return { characters: [], relationships: [] };
}

function saveRoadmapData(data) {
  try {
    localStorage.setItem(ROADMAP_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("[CharacterRoadmap] Failed to save roadmap data:", err);
  }
}

/* ---------------------------
   Page Banner (matches other pages)
---------------------------- */
const PageBanner = ({ activeView, bookTitle }) => {
  const viewLabels = {
    milestones: "Track character arcs and story beats",
    timeline: "Visualize character journeys across chapters",
    relationships: "Map connections between characters",
    goals: "Define motivations and conflicts",
  };

  return (
    <div
      className="text-white mb-6"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
        borderRadius: "1rem",
        padding: "1.5rem 2rem",
      }}
    >
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Character Roadmap</h1>
          <p className="text-white/80 text-sm">{viewLabels[activeView]}</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Story:</span>
            <span className="font-semibold text-amber-300">{bookTitle || "Untitled"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   Tab Navigation (centered)
---------------------------- */
const ViewTabs = ({ activeView, setActiveView }) => {
  const tabs = [
    { id: "milestones", label: "Arc Milestones", icon: Sparkles },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "relationships", label: "Relationships", icon: Network },
    { id: "goals", label: "Goals & Conflicts", icon: Target },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`
                : "rgba(255, 255, 255, 0.9)",
              color: isActive ? "#fff" : BRAND.navy,
              border: `1px solid ${isActive ? BRAND.navy : "rgba(30, 58, 95, 0.2)"}`,
              boxShadow: isActive
                ? `0 4px 12px ${BRAND.navy}30`
                : "0 2px 4px rgba(0,0,0,0.05)",
            }}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

/* ---------------------------
   Character Priorities Panel
---------------------------- */
const PrioritiesPanel = ({ characterName, priorities }) => {
  if (!characterName) return null;
  
  const characterPriorities = priorities.filter(p => 
    p.character?.toLowerCase() === characterName?.toLowerCase()
  );

  if (characterPriorities.length === 0) {
    return (
      <div 
        className="rounded-xl p-4 mb-4"
        style={{ 
          background: `${BRAND.mauve}10`,
          border: `1px dashed ${BRAND.mauve}40`,
        }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ListChecks size={16} />
          <span>No priorities defined for {characterName} yet.</span>
          <Link 
            to="/story-lab/workshop/priorities" 
            className="font-medium underline"
            style={{ color: BRAND.gold }}
          >
            Add in Priority Cards →
          </Link>
        </div>
      </div>
    );
  }

  const typeStyles = {
    Want: { bg: `${BRAND.gold}15`, color: BRAND.gold, icon: Target },
    Fear: { bg: "#fef2f2", color: "#dc2626", icon: AlertCircle },
    Need: { bg: "#f0fdf4", color: "#16a34a", icon: Heart },
    Secret: { bg: `${BRAND.mauve}20`, color: BRAND.navy, icon: Eye },
  };

  return (
    <div 
      className="rounded-xl p-4 mb-4"
      style={{ 
        background: "rgba(255, 255, 255, 0.9)",
        border: `1px solid ${BRAND.navy}15`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ListChecks size={16} style={{ color: BRAND.navy }} />
          <span className="font-semibold text-sm" style={{ color: BRAND.navy }}>
            {characterName}'s Priorities
          </span>
          <span className="text-xs text-slate-400">
            ({characterPriorities.length} defined)
          </span>
        </div>
        <Link 
          to="/story-lab/workshop/priorities" 
          className="text-xs font-medium"
          style={{ color: BRAND.gold }}
        >
          Edit in Priority Cards →
        </Link>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {characterPriorities.map((priority, idx) => {
          const type = priority.priorityType || "Other";
          const style = typeStyles[type] || { bg: "#f1f5f9", color: "#64748b", icon: ListChecks };
          const Icon = style.icon;
          
          return (
            <div 
              key={priority.id || idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
              style={{ background: style.bg, color: style.color }}
            >
              <Icon size={12} />
              <span className="font-medium">{type}:</span>
              <span className="truncate max-w-[200px]">{priority.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------------
   Milestone Suggestions Panel
---------------------------- */
const MilestoneSuggestionsPanel = ({ 
  suggestions, 
  isLoading, 
  error, 
  onAccept, 
  onReject, 
  onAcceptAll, 
  onClose,
  characterName,
  characterRole,
}) => {
  if (!isLoading && !error && suggestions.length === 0) return null;

  const roleInfo = CHARACTER_ROLES.find(r => r.id === characterRole);

  return (
    <div 
      className="rounded-2xl overflow-hidden mb-6"
      style={{
        background: "rgba(255, 255, 255, 0.98)",
        border: `2px solid ${BRAND.gold}40`,
        boxShadow: `0 4px 20px ${BRAND.gold}15`,
      }}
    >
      {/* Header */}
      <div 
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${BRAND.gold}10 0%, ${BRAND.mauve}10 100%)`,
          borderBottom: `1px solid ${BRAND.gold}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.gold}20` }}
          >
            <Sparkles size={20} style={{ color: BRAND.gold }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: BRAND.navy }}>
              Suggested Arc Milestones for {characterName}
            </h3>
            <p className="text-xs text-slate-500">
              {roleInfo?.description || "Based on character priorities"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin mr-3" style={{ color: BRAND.gold }} />
          <span className="text-slate-600">Generating arc milestones from priorities...</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-5">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl text-red-700">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Suggestions list */}
      {!isLoading && !error && suggestions.length > 0 && (
        <div className="p-5">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {suggestions.map((suggestion, idx) => (
              <div 
                key={idx}
                className="rounded-xl p-4 transition-all hover:shadow-md"
                style={{
                  background: "white",
                  border: `1px solid ${BRAND.navy}15`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
                      >
                        {idx + 1}
                      </span>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          background: `${BRAND.navy}10`,
                          color: BRAND.navy,
                        }}
                      >
                        {suggestion.phase || "Story Beat"}
                      </span>
                    </div>
                    <p className="font-medium" style={{ color: BRAND.navy }}>
                      {suggestion.title}
                    </p>
                    {suggestion.description && (
                      <p className="text-sm text-slate-500 mt-1">
                        {suggestion.description}
                      </p>
                    )}
                    {suggestion.basedOn && (
                      <p className="text-xs text-slate-400 mt-2 italic">
                        Based on: {suggestion.basedOn}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAccept(suggestion)}
                      className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="Accept"
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

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <span className="text-sm text-slate-500">
              {suggestions.length} milestone{suggestions.length !== 1 ? "s" : ""} suggested
            </span>
            <button
              onClick={onAcceptAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
            >
              <Check size={16} />
              Accept All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Role Selector Component
---------------------------- */
const RoleSelector = ({ role, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedRole = CHARACTER_ROLES.find(r => r.id === role) || CHARACTER_ROLES[2];
  const Icon = selectedRole.icon;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: `${selectedRole.color}15`,
          border: `2px solid ${selectedRole.color}40`,
          color: selectedRole.color,
        }}
      >
        <Icon size={16} />
        {selectedRole.label}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 z-50 rounded-xl shadow-xl overflow-hidden min-w-[220px]"
          style={{
            background: "white",
            border: `1px solid ${BRAND.navy}15`,
          }}
        >
          {CHARACTER_ROLES.map((r) => {
            const RoleIcon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => {
                  onChange(r.id);
                  setIsOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                style={{
                  background: role === r.id ? `${r.color}10` : "transparent",
                }}
              >
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${r.color}20` }}
                >
                  <RoleIcon size={16} style={{ color: r.color }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                    {r.label}
                  </div>
                  <div className="text-xs text-slate-500">{r.description}</div>
                </div>
                {role === r.id && (
                  <Check size={16} className="ml-auto flex-shrink-0" style={{ color: r.color }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Character Selector with Role
---------------------------- */
const CharacterSelector = ({
  characters,
  storyCharacters,
  selectedId,
  onSelect,
  onAddCharacter,
  onImportCharacter,
  onUpdateRole,
  onGenerateMilestones,
  isGenerating,
  allPriorities,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = characters.find((c) => c.id === selectedId);

  const unimportedChars = storyCharacters.filter(
    (name) => !characters.some((c) => c.name === name)
  );

  // Get priorities for selected character
  const characterPriorities = selected 
    ? allPriorities.filter(p => p.character?.toLowerCase() === selected.name?.toLowerCase())
    : [];

  const canGenerateMilestones = selected && 
    (selected.role === "protagonist" || selected.role === "antagonist") &&
    characterPriorities.length > 0;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="mb-6 space-y-4">
      {/* Main row */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <label className="text-sm font-medium" style={{ color: BRAND.navy }}>
          Character:
        </label>
        
        {/* Character dropdown */}
        <div className="relative w-64" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-left transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${BRAND.navy}20`,
            }}
          >
            <div className="flex items-center gap-2">
              <User size={16} style={{ color: BRAND.mauve }} />
              <span style={{ color: BRAND.navy }}>
                {selected?.name || "Select a character"}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
              style={{ color: BRAND.navy }}
            />
          </button>

          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto"
              style={{
                background: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${BRAND.navy}15`,
              }}
            >
              {characters.length === 0 && unimportedChars.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No characters yet. Add one or tag characters in your chapters with @char: Name
                </div>
              ) : (
                <>
                  {characters.map((char) => {
                    const roleInfo = CHARACTER_ROLES.find(r => r.id === char.role);
                    return (
                      <button
                        key={char.id}
                        onClick={() => {
                          onSelect(char.id);
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        style={{
                          background: char.id === selectedId ? `${BRAND.gold}15` : "transparent",
                        }}
                      >
                        <User size={14} style={{ color: BRAND.mauve }} />
                        <span style={{ color: BRAND.navy }}>{char.name}</span>
                        {roleInfo && (
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full ml-auto"
                            style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}
                          >
                            {roleInfo.label}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {unimportedChars.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 border-t border-gray-100">
                        From your story (@char: tags)
                      </div>
                      {unimportedChars.map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            onImportCharacter(name);
                            setIsOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-amber-50 transition-colors"
                        >
                          <Plus size={14} style={{ color: BRAND.gold }} />
                          <span style={{ color: BRAND.navy }}>{name}</span>
                          <span className="text-xs text-amber-600 ml-auto">Import</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Role selector (if character selected) */}
        {selected && (
          <RoleSelector
            role={selected.role || "supporting"}
            onChange={(newRole) => onUpdateRole(selected.id, newRole)}
          />
        )}

        {/* New Character Button */}
        <button
          onClick={onAddCharacter}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            color: "#fff",
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <Plus size={16} />
          New Character
        </button>
      </div>

      {/* Generate Milestones Button (for protagonist/antagonist with priorities) */}
      {selected && (selected.role === "protagonist" || selected.role === "antagonist") && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={onGenerateMilestones}
            disabled={!canGenerateMilestones || isGenerating}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: canGenerateMilestones 
                ? `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})`
                : "#e2e8f0",
              color: canGenerateMilestones ? "#fff" : "#94a3b8",
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating Arc...
              </>
            ) : (
              <>
                <Wand2 size={18} />
                Generate Arc Milestones from Priorities
              </>
            )}
          </button>
          
          {!canGenerateMilestones && selected && characterPriorities.length === 0 && (
            <div className="flex items-center text-sm text-slate-500">
              <AlertCircle size={14} className="mr-1" />
              <span>Add priorities for {selected.name} first</span>
              <Link 
                to="/story-lab/workshop/priorities" 
                className="ml-1 underline"
                style={{ color: BRAND.gold }}
              >
                →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   DnD Types
---------------------------- */
const ItemTypes = {
  MILESTONE: "MILESTONE",
};

/* ---------------------------
   Draggable Milestone Row
---------------------------- */
function DraggableMilestone({ item, index, moveItem, update, remove, chapters }) {
  const ref = useRef(null);

  const [, drop] = useDrop({
    accept: ItemTypes.MILESTONE,
    hover(dragItem) {
      if (!ref.current) return;
      if (dragItem.index === index) return;
      moveItem(dragItem.index, index);
      dragItem.index = index;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MILESTONE,
    item: { id: item.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`rounded-xl px-4 py-3 transition-all duration-200 ${
        isDragging ? "opacity-60 scale-[0.98]" : ""
      }`}
      style={{
        background: item.done ? `${BRAND.gold}08` : "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${item.done ? BRAND.gold + "40" : "rgba(30, 58, 95, 0.12)"}`,
        boxShadow: isDragging ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex items-center justify-center pt-1 cursor-grab active:cursor-grabbing select-none"
          title="Drag to reorder"
        >
          <GripVertical className="h-5 w-5" style={{ color: BRAND.mauve }} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span 
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
            >
              {index + 1}
            </span>
            <input
              value={item.title}
              onChange={(e) => update(item.id, { title: e.target.value })}
              className="flex-1 text-base font-medium bg-transparent border-none outline-none focus:ring-0"
              style={{ color: BRAND.navy }}
              placeholder="Milestone title"
            />
          </div>

          <textarea
            value={item.description || ""}
            onChange={(e) => update(item.id, { description: e.target.value })}
            className="w-full text-sm bg-transparent border-none outline-none resize-none focus:ring-0"
            style={{ color: "#64748b" }}
            placeholder="Describe this beat in the character's arc..."
            rows={2}
          />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <select
              value={item.chapterId || ""}
              onChange={(e) => update(item.id, { chapterId: e.target.value || null })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: `1px solid ${BRAND.navy}15`,
                color: BRAND.navy,
              }}
            >
              <option value="">Link to chapter...</option>
              {chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.id}>
                  {ch.title || `Chapter ${idx + 1}`}
                </option>
              ))}
            </select>

            <select
              value={item.phase || "beginning"}
              onChange={(e) => update(item.id, { phase: e.target.value })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: `1px solid ${BRAND.navy}15`,
                color: BRAND.navy,
              }}
            >
              <option value="beginning">Beginning (Setup)</option>
              <option value="rising">Rising Action</option>
              <option value="midpoint">Midpoint</option>
              <option value="falling">Falling Action</option>
              <option value="climax">Climax</option>
              <option value="resolution">Resolution</option>
            </select>

            <select
              value={item.emotionalState || "neutral"}
              onChange={(e) => update(item.id, { emotionalState: e.target.value })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{
                background: "rgba(255, 255, 255, 0.8)",
                border: `1px solid ${BRAND.navy}15`,
                color: BRAND.navy,
              }}
            >
              <option value="neutral">😐 Neutral</option>
              <option value="hopeful">🌟 Hopeful</option>
              <option value="determined">💪 Determined</option>
              <option value="conflicted">😰 Conflicted</option>
              <option value="defeated">😔 Defeated</option>
              <option value="triumphant">🎉 Triumphant</option>
              <option value="grieving">💔 Grieving</option>
              <option value="angry">😠 Angry</option>
              <option value="fearful">😨 Fearful</option>
              <option value="peaceful">😌 Peaceful</option>
            </select>
            
            {item.source === "AI Generated" && (
              <span 
                className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                style={{ background: `${BRAND.gold}15`, color: BRAND.gold }}
              >
                <Sparkles size={10} />
                AI Generated
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={!!item.done}
              onChange={(e) => update(item.id, { done: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: BRAND.gold }}
            />
            <span className="text-xs" style={{ color: BRAND.navy }}>
              Done
            </span>
          </label>

          <button
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            onClick={() => remove(item.id)}
            title="Delete milestone"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------
   Empty State Component
---------------------------- */
const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div
    className="rounded-2xl p-8 text-center"
    style={{
      background: "rgba(255, 255, 255, 0.6)",
      border: `1px dashed ${BRAND.navy}20`,
    }}
  >
    <div
      className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
      style={{ background: `${BRAND.mauve}20` }}
    >
      <Icon size={24} style={{ color: BRAND.mauve }} />
    </div>
    <h4 className="font-semibold mb-1" style={{ color: BRAND.navy }}>
      {title}
    </h4>
    <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
    {action}
  </div>
);

/* ---------------------------
   Milestones View
---------------------------- */
const MilestonesView = ({
  character,
  milestones,
  chapters,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
  allPriorities,
}) => {
  if (!character) {
    return (
      <EmptyState
        icon={User}
        title="Select a Character"
        description="Choose a character from the dropdown above to view and edit their arc milestones."
      />
    );
  }

  const roleInfo = CHARACTER_ROLES.find(r => r.id === character.role);

  return (
    <div className="space-y-4">
      {/* Priorities panel */}
      <PrioritiesPanel 
        characterName={character.name} 
        priorities={allPriorities} 
      />
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
              {character.name}'s Arc
            </h3>
            {roleInfo && (
              <span 
                className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}
              >
                {roleInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {milestones.length} milestone{milestones.length !== 1 ? "s" : ""} •{" "}
            {milestones.filter((m) => m.done).length} completed
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            color: "#fff",
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <Plus size={16} />
          Add Milestone
        </button>
      </div>

      {milestones.length > 0 && (
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: `${BRAND.navy}10` }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(milestones.filter((m) => m.done).length / milestones.length) * 100}%`,
              background: `linear-gradient(90deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 100%)`,
            }}
          />
        </div>
      )}

      <div className="space-y-3">
        {milestones.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No Milestones Yet"
            description={
              character.role === "protagonist" || character.role === "antagonist"
                ? `Add priorities for ${character.name} in Priority Cards, then use "Generate Arc Milestones" to create their story arc.`
                : `Start mapping ${character.name}'s journey by adding arc milestones.`
            }
            action={
              <button
                onClick={onAdd}
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                style={{
                  background: `${BRAND.gold}20`,
                  color: BRAND.navy,
                  border: `1px solid ${BRAND.gold}40`,
                }}
              >
                <Plus size={16} />
                Add First Milestone
              </button>
            }
          />
        ) : (
          milestones.map((m, idx) => (
            <DraggableMilestone
              key={m.id}
              item={m}
              index={idx}
              moveItem={onMove}
              update={onUpdate}
              remove={onRemove}
              chapters={chapters}
            />
          ))
        )}
      </div>
    </div>
  );
};

/* ---------------------------
   Timeline View
---------------------------- */
const TimelineView = ({ characters, chapters }) => {
  const timelineData = useMemo(() => {
    return chapters.map((chapter, idx) => {
      const charEvents = characters
        .map((char) => {
          const milestones = (char.milestones || []).filter(
            (m) => m.chapterId === chapter.id
          );
          return milestones.length > 0 ? { character: char, milestones } : null;
        })
        .filter(Boolean);

      return { chapter, index: idx, events: charEvents };
    });
  }, [characters, chapters]);

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Chapters Yet"
        description="Create chapters in your story first, then link character milestones to see them on the timeline."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
        Story Timeline
      </h3>

      <div className="relative">
        <div
          className="absolute left-6 top-0 bottom-0 w-0.5"
          style={{ background: `${BRAND.navy}15` }}
        />

        <div className="space-y-6">
          {timelineData.map(({ chapter, index, events }) => (
            <div key={chapter.id} className="relative pl-16">
              <div
                className="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background:
                    events.length > 0
                      ? `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 100%)`
                      : "white",
                  border: `2px solid ${events.length > 0 ? BRAND.gold : BRAND.navy}30`,
                  color: events.length > 0 ? "#fff" : BRAND.navy,
                }}
              >
                {index + 1}
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: `1px solid ${BRAND.navy}12`,
                }}
              >
                <h4 className="font-semibold mb-2" style={{ color: BRAND.navy }}>
                  {chapter.title || `Chapter ${index + 1}`}
                </h4>

                {events.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No character events linked to this chapter
                  </p>
                ) : (
                  <div className="space-y-2">
                    {events.map(({ character, milestones }) => {
                      const roleInfo = CHARACTER_ROLES.find(r => r.id === character.role);
                      return (
                        <div key={character.id} className="flex items-start gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{ background: roleInfo ? `${roleInfo.color}30` : `${BRAND.mauve}30` }}
                          >
                            <User size={12} style={{ color: roleInfo?.color || BRAND.mauve }} />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium" style={{ color: BRAND.navy }}>
                              {character.name}
                            </span>
                            <div className="mt-1 space-y-1">
                              {milestones.map((m) => (
                                <div key={m.id} className="text-sm flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                      m.done ? "bg-green-400" : "bg-gray-300"
                                    }`}
                                  />
                                  <span className="text-gray-600">{m.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   Relationships View
---------------------------- */
const RelationshipsView = ({
  characters,
  relationships,
  onAddRelationship,
  onUpdateRelationship,
  onRemoveRelationship,
}) => {
  const [editingId, setEditingId] = useState(null);

  const relationshipTypes = [
    { id: "ally", label: "Ally", icon: Heart, color: "#22c55e" },
    { id: "rival", label: "Rival", icon: Swords, color: "#ef4444" },
    { id: "family", label: "Family", icon: Users, color: "#8b5cf6" },
    { id: "romantic", label: "Romantic", icon: Heart, color: "#ec4899" },
    { id: "mentor", label: "Mentor/Mentee", icon: Sparkles, color: BRAND.gold },
    { id: "neutral", label: "Neutral", icon: HelpCircle, color: "#6b7280" },
    { id: "complex", label: "Complex", icon: Network, color: BRAND.mauve },
  ];

  if (characters.length < 2) {
    return (
      <EmptyState
        icon={Users}
        title="Need More Characters"
        description="Add at least two characters to start mapping their relationships."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
            Character Relationships
          </h3>
          <p className="text-sm text-gray-500">
            {relationships.length} connection{relationships.length !== 1 ? "s" : ""} mapped
          </p>
        </div>
        <button
          onClick={onAddRelationship}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            color: "#fff",
          }}
        >
          <Link2 size={16} />
          Add Relationship
        </button>
      </div>

      {/* Relationship list */}
      <div className="space-y-3">
        {relationships.length === 0 ? (
          <EmptyState
            icon={Network}
            title="No Relationships Defined"
            description="Start mapping how your characters connect to each other."
          />
        ) : (
          relationships.map((rel) => {
            const char1 = characters.find((c) => c.id === rel.from);
            const char2 = characters.find((c) => c.id === rel.to);
            const typeData = relationshipTypes.find((t) => t.id === rel.type) || relationshipTypes[5];
            const Icon = typeData.icon;

            return (
              <div
                key={rel.id}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: `1px solid ${typeData.color}30`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${typeData.color}20` }}
                  >
                    <Icon size={16} style={{ color: typeData.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: BRAND.navy }}>
                        {char1?.name || "Unknown"}
                      </span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className="font-medium" style={{ color: BRAND.navy }}>
                        {char2?.name || "Unknown"}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${typeData.color}15`, color: typeData.color }}
                      >
                        {typeData.label}
                      </span>
                    </div>
                    {rel.description && (
                      <p className="text-sm text-gray-500 mt-1">{rel.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemoveRelationship(rel.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

/* ---------------------------
   Goals & Conflicts View
---------------------------- */
const GoalsView = ({ character, onUpdate, allPriorities }) => {
  if (!character) {
    return (
      <EmptyState
        icon={User}
        title="Select a Character"
        description="Choose a character from the dropdown above to define their goals and conflicts."
      />
    );
  }

  const goals = character.goals || {};

  const updateGoal = (key, value) => {
    onUpdate(character.id, {
      goals: { ...goals, [key]: value },
    });
  };

  const fields = [
    { key: "want", label: "External Want", placeholder: "What does this character consciously pursue?", icon: Target, color: BRAND.gold },
    { key: "need", label: "Internal Need", placeholder: "What do they actually need (often unknown to them)?", icon: Heart, color: "#ec4899" },
    { key: "fear", label: "Greatest Fear", placeholder: "What are they most afraid of?", icon: Swords, color: "#ef4444" },
    { key: "flaw", label: "Fatal Flaw", placeholder: "What weakness holds them back?", icon: X, color: "#f97316" },
    { key: "strength", label: "Core Strength", placeholder: "What's their greatest asset?", icon: Sparkles, color: "#22c55e" },
    { key: "lie", label: "The Lie They Believe", placeholder: "What false belief shapes their worldview?", icon: HelpCircle, color: BRAND.mauve },
    { key: "truth", label: "The Truth", placeholder: "What must they learn by story's end?", icon: Check, color: BRAND.navy },
    { key: "stakes", label: "Stakes", placeholder: "What happens if they fail?", icon: Target, color: "#dc2626" },
  ];

  return (
    <div className="space-y-6">
      {/* Priorities panel */}
      <PrioritiesPanel 
        characterName={character.name} 
        priorities={allPriorities} 
      />
      
      <div>
        <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
          {character.name}'s Goals & Conflicts
        </h3>
        <p className="text-sm text-gray-500">
          Define what drives this character and what stands in their way.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ key, label, placeholder, icon: Icon, color }) => (
          <div
            key={key}
            className="rounded-xl p-4 transition-all"
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              border: `1px solid ${color}25`,
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `${color}15` }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <label className="text-sm font-semibold" style={{ color: BRAND.navy }}>
                {label}
              </label>
            </div>
            <textarea
              value={goals[key] || ""}
              onChange={(e) => updateGoal(key, e.target.value)}
              placeholder={placeholder}
              className="w-full text-sm bg-transparent border-none outline-none resize-none focus:ring-0"
              style={{ color: "#374151" }}
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------
   Main CharacterRoadmap Component
------------------------------------------------- */
export default function CharacterRoadmap() {
  const [activeView, setActiveView] = useState("milestones");
  const [roadmapData, setRoadmapData] = useState(() => loadRoadmapData());
  const [storyLabData, setStoryLabData] = useState(() => loadStoryLabData());
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  const [allPriorities, setAllPriorities] = useState(() => loadAllPriorities());
  
  // Milestone generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [milestoneSuggestions, setMilestoneSuggestions] = useState([]);
  const [generationError, setGenerationError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract characters from story chapters
  const storyCharacters = useMemo(() => {
    if (!storyLabData?.chapters) return [];
    return extractCharactersFromChapters(storyLabData.chapters);
  }, [storyLabData]);

  const characters = roadmapData.characters || [];
  const relationships = roadmapData.relationships || [];
  const chapters = storyLabData?.chapters || [];
  const bookTitle = storyLabData?.book?.title || "Untitled";

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
  const selectedMilestones = selectedCharacter?.milestones || [];

  // Auto-select first character
  useEffect(() => {
    if (!selectedCharacterId && characters.length > 0) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);

  // Listen for changes
  useEffect(() => {
    const handleChange = () => {
      setStoryLabData(loadStoryLabData());
      setRoadmapData(loadRoadmapData());
      setAllPriorities(loadAllPriorities());
    };
    window.addEventListener("project:change", handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener("project:change", handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  // Save helper
  const commit = useCallback((mutator) => {
    setRoadmapData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      mutator(copy);
      if (!copy.characters) copy.characters = [];
      if (!copy.relationships) copy.relationships = [];
      saveRoadmapData(copy);
      return copy;
    });
  }, []);

  // Character CRUD
  const addCharacter = () => {
    const newId = uid();
    commit((data) => {
      data.characters.push({
        id: newId,
        name: "New Character",
        role: "supporting",
        milestones: [],
        goals: {},
      });
    });
    setSelectedCharacterId(newId);
  };

  const importCharacter = (name) => {
    const newId = uid();
    commit((data) => {
      data.characters.push({
        id: newId,
        name: name,
        role: "supporting",
        milestones: [],
        goals: {},
      });
    });
    setSelectedCharacterId(newId);
  };

  const updateCharacter = (id, patch) => {
    commit((data) => {
      const char = data.characters.find((c) => c.id === id);
      if (char) Object.assign(char, patch);
    });
  };

  const updateCharacterRole = (id, role) => {
    commit((data) => {
      const char = data.characters.find((c) => c.id === id);
      if (char) char.role = role;
    });
  };

  // Generate Milestones from Priorities
  const generateMilestones = async () => {
    if (!selectedCharacter) return;
    
    const characterPriorities = allPriorities.filter(p => 
      p.character?.toLowerCase() === selectedCharacter.name?.toLowerCase()
    );
    
    if (characterPriorities.length === 0) {
      alert(`No priorities found for ${selectedCharacter.name}. Add priorities in Priority Cards first.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setMilestoneSuggestions([]);
    setShowSuggestions(true);

    const isProtagonist = selectedCharacter.role === "protagonist";
    const milestoneCount = isProtagonist ? "6-8" : "3-5";
    
    // Format priorities for the prompt
    const prioritiesText = characterPriorities.map(p => {
      const type = p.priorityType || "Priority";
      return `- ${type}: ${p.title}`;
    }).join("\n");

    // Get character's goals if defined
    const goals = selectedCharacter.goals || {};
    const goalsText = Object.entries(goals)
      .filter(([k, v]) => v)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n");

    const prompt = `You are a story structure expert. Generate ${milestoneCount} arc milestones for a ${isProtagonist ? "protagonist" : "antagonist"} character.

CHARACTER: ${selectedCharacter.name}
ROLE: ${isProtagonist ? "Protagonist (main character)" : "Antagonist (opposition)"}

PRIORITIES (from the author):
${prioritiesText}

${goalsText ? `ADDITIONAL CHARACTER NOTES:\n${goalsText}` : ""}

Create a character arc that:
1. Starts with the character in their "normal world" or current state
2. Shows them pursuing what they WANT
3. Forces them to confront what they FEAR
4. Leads them toward what they NEED (or in the antagonist's case, their downfall)
5. ${isProtagonist ? "Ends with transformation or growth" : "Ends with defeat or partial victory"}

For each milestone, specify which priority it connects to.

Respond with a JSON array of milestones:
[
  {
    "title": "Brief milestone title",
    "description": "2-3 sentence description of this story beat",
    "phase": "beginning|rising|midpoint|falling|climax|resolution",
    "basedOn": "Which priority this connects to"
  }
]

Return ONLY the JSON array, no other text.`;

    try {
      const result = await runAssistant(prompt, "clarify", "", "anthropic");
      
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      // Parse JSON
      let parsed = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error("Failed to parse milestones:", e);
        setGenerationError("Couldn't parse AI response. Please try again.");
        return;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        setMilestoneSuggestions(parsed);
      } else {
        setGenerationError("No milestones generated. Please try again.");
      }
    } catch (error) {
      console.error("Milestone generation failed:", error);
      setGenerationError("Failed to generate milestones. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Accept a single milestone suggestion
  const acceptMilestone = (suggestion) => {
    if (!selectedCharacterId) return;
    
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char) {
        char.milestones.push({
          id: uid(),
          title: suggestion.title,
          description: suggestion.description || "",
          phase: suggestion.phase || "beginning",
          emotionalState: "neutral",
          chapterId: null,
          done: false,
          source: "AI Generated",
          basedOn: suggestion.basedOn,
        });
      }
    });
    
    setMilestoneSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
  };

  // Reject a milestone suggestion
  const rejectMilestone = (index) => {
    setMilestoneSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  // Accept all milestone suggestions
  const acceptAllMilestones = () => {
    if (!selectedCharacterId) return;
    
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char) {
        milestoneSuggestions.forEach(suggestion => {
          char.milestones.push({
            id: uid(),
            title: suggestion.title,
            description: suggestion.description || "",
            phase: suggestion.phase || "beginning",
            emotionalState: "neutral",
            chapterId: null,
            done: false,
            source: "AI Generated",
            basedOn: suggestion.basedOn,
          });
        });
      }
    });
    
    setMilestoneSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions panel
  const closeSuggestions = () => {
    setShowSuggestions(false);
    setMilestoneSuggestions([]);
    setGenerationError(null);
  };

  // Milestone CRUD
  const addMilestone = () => {
    if (!selectedCharacterId) return;
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char) {
        char.milestones.push({
          id: uid(),
          title: "New Milestone",
          description: "",
          phase: "beginning",
          emotionalState: "neutral",
          chapterId: null,
          done: false,
        });
      }
    });
  };

  const updateMilestone = (milestoneId, patch) => {
    if (!selectedCharacterId) return;
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char) {
        const m = char.milestones.find((x) => x.id === milestoneId);
        if (m) Object.assign(m, patch);
      }
    });
  };

  const removeMilestone = (milestoneId) => {
    if (!selectedCharacterId) return;
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char) {
        char.milestones = char.milestones.filter((m) => m.id !== milestoneId);
      }
    });
  };

  const moveMilestone = (fromIndex, toIndex) => {
    if (!selectedCharacterId) return;
    commit((data) => {
      const char = data.characters.find((c) => c.id === selectedCharacterId);
      if (char?.milestones) {
        const list = char.milestones;
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length)
          return;
        const [m] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, m);
      }
    });
  };

  // Relationship CRUD
  const addRelationship = () => {
    if (characters.length < 2) return;
    commit((data) => {
      data.relationships.push({
        id: uid(),
        from: characters[0].id,
        to: characters[1].id,
        type: "neutral",
        description: "",
      });
    });
  };

  const updateRelationship = (id, patch) => {
    commit((data) => {
      const rel = data.relationships.find((r) => r.id === id);
      if (rel) Object.assign(rel, patch);
    });
  };

  const removeRelationship = (id) => {
    commit((data) => {
      data.relationships = data.relationships.filter((r) => r.id !== id);
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} />
              Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Character Roadmap
            </span>
          </div>
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
              color: "#fff",
            }}
          >
            Workshop Hub
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <PageBanner activeView={activeView} bookTitle={bookTitle} />

        <ViewTabs activeView={activeView} setActiveView={setActiveView} />

        {(activeView === "milestones" || activeView === "goals") && (
          <CharacterSelector
            characters={characters}
            storyCharacters={storyCharacters}
            selectedId={selectedCharacterId}
            onSelect={(id) => {
              setSelectedCharacterId(id);
              setShowSuggestions(false);
            }}
            onAddCharacter={addCharacter}
            onImportCharacter={importCharacter}
            onUpdateRole={updateCharacterRole}
            onGenerateMilestones={generateMilestones}
            isGenerating={isGenerating}
            allPriorities={allPriorities}
          />
        )}

        {/* Milestone Suggestions Panel */}
        {showSuggestions && activeView === "milestones" && (
          <MilestoneSuggestionsPanel
            suggestions={milestoneSuggestions}
            isLoading={isGenerating}
            error={generationError}
            onAccept={acceptMilestone}
            onReject={rejectMilestone}
            onAcceptAll={acceptAllMilestones}
            onClose={closeSuggestions}
            characterName={selectedCharacter?.name}
            characterRole={selectedCharacter?.role}
          />
        )}

        <div
          className="rounded-2xl p-6"
          style={{
            background: "rgba(255, 255, 255, 0.8)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${BRAND.navy}10`,
            boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
          }}
        >
          {activeView === "milestones" && (
            <MilestonesView
              character={selectedCharacter}
              milestones={selectedMilestones}
              chapters={chapters}
              onAdd={addMilestone}
              onUpdate={updateMilestone}
              onRemove={removeMilestone}
              onMove={moveMilestone}
              allPriorities={allPriorities}
            />
          )}

          {activeView === "timeline" && (
            <TimelineView characters={characters} chapters={chapters} />
          )}

          {activeView === "relationships" && (
            <RelationshipsView
              characters={characters}
              relationships={relationships}
              onAddRelationship={addRelationship}
              onUpdateRelationship={updateRelationship}
              onRemoveRelationship={removeRelationship}
            />
          )}

          {activeView === "goals" && (
            <GoalsView 
              character={selectedCharacter} 
              onUpdate={updateCharacter}
              allPriorities={allPriorities}
            />
          )}
        </div>
      </div>
    </div>
  );
}
