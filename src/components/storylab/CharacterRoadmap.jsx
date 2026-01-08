// src/components/storylab/CharacterRoadmap.jsx
// FIXED: Uses storage service (not localStorage directly)
// FIXED: Removed problematic projectStore import
// Supports Fiction, Non-Fiction, Poetry, and Memoir with genre-specific terminology

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
  Feather,
  BookMarked,
  Layers,
  MessageSquare,
  Compass,
  Music,
  Image,
  Quote,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { runAssistant } from "../../lib/api";
import { storage } from "../../lib/storage/storage";

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
   GENRE CONFIGURATIONS
---------------------------- */
const GENRE_CONFIG = {
  fiction: {
    id: "fiction",
    label: "Fiction",
    icon: BookOpen,
    pageTitle: "Character Roadmap",
    entityLabel: "Character",
    entityLabelPlural: "Characters",
    milestoneLabel: "Arc Milestone",
    milestoneLabelPlural: "Arc Milestones",
    journeyLabel: "Character Arc",
    roles: [
      { id: "protagonist", label: "Protagonist", icon: Star, color: BRAND.gold, description: "Main character - full arc (6-8 milestones)" },
      { id: "antagonist", label: "Antagonist", icon: Shield, color: "#ef4444", description: "Opposition - shorter arc (3-5 milestones)" },
      { id: "supporting", label: "Supporting", icon: Users, color: BRAND.mauve, description: "Supporting character" },
    ],
    phases: [
      { id: "beginning", label: "Beginning (Setup)" },
      { id: "rising", label: "Rising Action" },
      { id: "midpoint", label: "Midpoint" },
      { id: "falling", label: "Falling Action" },
      { id: "climax", label: "Climax" },
      { id: "resolution", label: "Resolution" },
    ],
    emotionalStates: [
      { id: "neutral", label: "😐 Neutral" },
      { id: "hopeful", label: "🌟 Hopeful" },
      { id: "determined", label: "💪 Determined" },
      { id: "conflicted", label: "😰 Conflicted" },
      { id: "defeated", label: "😔 Defeated" },
      { id: "triumphant", label: "🎉 Triumphant" },
      { id: "grieving", label: "💔 Grieving" },
      { id: "angry", label: "😠 Angry" },
      { id: "fearful", label: "😨 Fearful" },
      { id: "peaceful", label: "😌 Peaceful" },
    ],
    tagPattern: /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    viewLabels: {
      milestones: "Track character arcs and story beats",
      timeline: "Visualize character journeys across chapters",
      relationships: "Map connections between characters",
      goals: "Define motivations and conflicts",
    },
  },
  nonfiction: {
    id: "nonfiction",
    label: "Non-Fiction",
    icon: FileText,
    pageTitle: "Argument Roadmap",
    entityLabel: "Topic",
    entityLabelPlural: "Topics",
    milestoneLabel: "Key Point",
    milestoneLabelPlural: "Key Points",
    journeyLabel: "Argument Flow",
    roles: [
      { id: "protagonist", label: "Main Thesis", icon: Target, color: BRAND.gold, description: "Central argument - full development" },
      { id: "antagonist", label: "Counter-Argument", icon: MessageSquare, color: "#ef4444", description: "Opposition to address" },
      { id: "supporting", label: "Supporting Point", icon: Layers, color: BRAND.mauve, description: "Evidence or sub-argument" },
    ],
    phases: [
      { id: "beginning", label: "Introduction" },
      { id: "rising", label: "Building Case" },
      { id: "midpoint", label: "Key Evidence" },
      { id: "falling", label: "Addressing Objections" },
      { id: "climax", label: "Strongest Point" },
      { id: "resolution", label: "Conclusion" },
    ],
    emotionalStates: [
      { id: "neutral", label: "📝 Informative" },
      { id: "hopeful", label: "💡 Insightful" },
      { id: "determined", label: "📊 Data-Driven" },
      { id: "conflicted", label: "🤔 Nuanced" },
      { id: "defeated", label: "⚠️ Cautionary" },
      { id: "triumphant", label: "✅ Conclusive" },
      { id: "grieving", label: "📉 Critical" },
      { id: "angry", label: "🔥 Urgent" },
      { id: "fearful", label: "⚡ Provocative" },
      { id: "peaceful", label: "🎯 Balanced" },
    ],
    tagPattern: /@topic:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    viewLabels: {
      milestones: "Track key points and argument structure",
      timeline: "Visualize argument flow across chapters",
      relationships: "Map connections between topics",
      goals: "Define thesis and evidence",
    },
  },
  poetry: {
    id: "poetry",
    label: "Poetry",
    icon: Feather,
    pageTitle: "Theme Roadmap",
    entityLabel: "Theme",
    entityLabelPlural: "Themes",
    milestoneLabel: "Beat",
    milestoneLabelPlural: "Beats",
    journeyLabel: "Thematic Arc",
    roles: [
      { id: "protagonist", label: "Central Image", icon: Image, color: BRAND.gold, description: "Dominant visual or metaphor" },
      { id: "antagonist", label: "Counter-Image", icon: Sparkles, color: "#ef4444", description: "Contrasting element" },
      { id: "supporting", label: "Motif", icon: Music, color: BRAND.mauve, description: "Recurring element" },
    ],
    phases: [
      { id: "beginning", label: "Opening Image" },
      { id: "rising", label: "Development" },
      { id: "midpoint", label: "Turn / Volta" },
      { id: "falling", label: "Deepening" },
      { id: "climax", label: "Emotional Peak" },
      { id: "resolution", label: "Closing Image" },
    ],
    emotionalStates: [
      { id: "neutral", label: "🌊 Flowing" },
      { id: "hopeful", label: "🌅 Luminous" },
      { id: "determined", label: "🔥 Intense" },
      { id: "conflicted", label: "🌪️ Turbulent" },
      { id: "defeated", label: "🌑 Dark" },
      { id: "triumphant", label: "✨ Transcendent" },
      { id: "grieving", label: "🍂 Elegiac" },
      { id: "angry", label: "⚡ Electric" },
      { id: "fearful", label: "🌫️ Haunting" },
      { id: "peaceful", label: "🌿 Serene" },
    ],
    tagPattern: /@theme:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    viewLabels: {
      milestones: "Track imagery and thematic beats",
      timeline: "Visualize thematic flow across stanzas",
      relationships: "Map connections between images",
      goals: "Define central vision and resonance",
    },
  },
  memoir: {
    id: "memoir",
    label: "Memoir",
    icon: BookMarked,
    pageTitle: "Life Thread Roadmap",
    entityLabel: "Person/Event",
    entityLabelPlural: "People & Events",
    milestoneLabel: "Moment",
    milestoneLabelPlural: "Moments",
    journeyLabel: "Personal Journey",
    roles: [
      { id: "protagonist", label: "Past Self", icon: Clock, color: BRAND.gold, description: "Who you were - full arc" },
      { id: "antagonist", label: "Challenge/Catalyst", icon: Compass, color: "#ef4444", description: "What changed you" },
      { id: "supporting", label: "Key Figure", icon: Users, color: BRAND.mauve, description: "Important person" },
    ],
    phases: [
      { id: "beginning", label: "Before" },
      { id: "rising", label: "Approaching Change" },
      { id: "midpoint", label: "The Moment" },
      { id: "falling", label: "Aftermath" },
      { id: "climax", label: "Realization" },
      { id: "resolution", label: "Who I Became" },
    ],
    emotionalStates: [
      { id: "neutral", label: "📖 Reflective" },
      { id: "hopeful", label: "🌱 Growing" },
      { id: "determined", label: "💪 Resilient" },
      { id: "conflicted", label: "😰 Struggling" },
      { id: "defeated", label: "💔 Broken" },
      { id: "triumphant", label: "🦋 Transformed" },
      { id: "grieving", label: "😢 Mourning" },
      { id: "angry", label: "😠 Raging" },
      { id: "fearful", label: "😨 Afraid" },
      { id: "peaceful", label: "🙏 At Peace" },
    ],
    tagPattern: /@person:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    viewLabels: {
      milestones: "Track key moments and revelations",
      timeline: "Visualize your journey across chapters",
      relationships: "Map connections between people",
      goals: "Define what you learned and became",
    },
  },
};

/* ---------------------------
   BASE Storage Keys
---------------------------- */
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const ROADMAP_KEY_BASE = "dahtruth-character-roadmap";
const GENRE_KEY_BASE = "dahtruth-project-genre";
const PRIORITIES_KEY_BASE = "dahtruth-priorities-v2";

/* ============================================
   PROJECT-AWARE STORAGE UTILITIES (using storage service)
   ============================================ */

function getSelectedProjectId() {
  try {
    const stored = storage.getItem("dahtruth-selected-project-id");
    if (stored) return stored;
    
    const projectData = storage.getItem("dahtruth-project-store");
    if (projectData) {
      const parsed = JSON.parse(projectData);
      return parsed.selectedProjectId || parsed.currentProjectId || "default";
    }
    
    return "default";
  } catch {
    return "default";
  }
}

function getProjectKey(baseKey) {
  const projectId = getSelectedProjectId();
  return projectId === "default" ? baseKey : `${baseKey}-${projectId}`;
}

function loadProjectGenre() {
  try {
    const key = getProjectKey(GENRE_KEY_BASE);
    const raw = storage.getItem(key);
    if (raw && GENRE_CONFIG[raw]) return raw;
    return "fiction";
  } catch {
    return "fiction";
  }
}

function uid() {
  try {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {}
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
}

function extractEntitiesFromChapters(chapters = [], pattern) {
  const entitySet = new Set();

  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) entitySet.add(name);
    }
  });

  return Array.from(entitySet).sort();
}

function loadAllPriorities() {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
    const raw = storage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function loadStoryLabData() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = storage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[Roadmap] Failed to load StoryLab data:", err);
  }
  return null;
}

function loadRoadmapData() {
  try {
    const key = getProjectKey(ROADMAP_KEY_BASE);
    const raw = storage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[Roadmap] Failed to load roadmap data:", err);
  }
  return { characters: [], relationships: [] };
}

function saveRoadmapData(data) {
  try {
    const key = getProjectKey(ROADMAP_KEY_BASE);
    storage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("[Roadmap] Failed to save roadmap data:", err);
  }
}

/* ---------------------------
   Page Banner
---------------------------- */
const PageBanner = ({ activeView, bookTitle, currentProjectId, genreConfig }) => {
  const Icon = genreConfig.icon;
  
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
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${BRAND.gold}30` }}>
            <Icon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{genreConfig.pageTitle}</h1>
            <p className="text-white/80 text-sm">{genreConfig.viewLabels[activeView]}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-white/70">Working on:</span>
            <span className="font-semibold text-amber-300">{bookTitle || "Untitled"}</span>
          </div>
          <span className="text-white/50 text-xs px-2 py-1 rounded-full bg-white/10">
            {genreConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   Tab Navigation
---------------------------- */
const ViewTabs = ({ activeView, setActiveView, genreConfig }) => {
  const tabs = [
    { id: "milestones", label: genreConfig.milestoneLabelPlural, icon: Sparkles },
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
              boxShadow: isActive ? `0 4px 12px ${BRAND.navy}30` : "0 2px 4px rgba(0,0,0,0.05)",
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
   Role Selector Component
---------------------------- */
const RoleSelector = ({ role, onChange, genreConfig }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedRole = genreConfig.roles.find(r => r.id === role) || genreConfig.roles[2];
  const Icon = selectedRole.icon;

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
        <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-2 z-50 rounded-xl shadow-xl overflow-hidden min-w-[220px]"
          style={{ background: "white", border: `1px solid ${BRAND.navy}15` }}
        >
          {genreConfig.roles.map((r) => {
            const RoleIcon = r.icon;
            return (
              <button
                key={r.id}
                onClick={() => { onChange(r.id); setIsOpen(false); }}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                style={{ background: role === r.id ? `${r.color}10` : "transparent" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}20` }}>
                  <RoleIcon size={16} style={{ color: r.color }} />
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: BRAND.navy }}>{r.label}</div>
                  <div className="text-xs text-slate-500">{r.description}</div>
                </div>
                {role === r.id && <Check size={16} className="ml-auto flex-shrink-0" style={{ color: r.color }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ---------------------------
   Entity Selector with Role
---------------------------- */
const EntitySelector = ({
  entities,
  storyEntities,
  selectedId,
  onSelect,
  onAddEntity,
  onImportEntity,
  onUpdateRole,
  onGenerateMilestones,
  isGenerating,
  allPriorities,
  genreConfig,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selected = entities.find((c) => c.id === selectedId);

  const unimportedEntities = storyEntities.filter(
    (name) => !entities.some((c) => c.name === name)
  );

  const entityPriorities = selected 
    ? allPriorities.filter(p => (p.character || p.entity)?.toLowerCase() === selected.name?.toLowerCase())
    : [];

  const canGenerateMilestones = selected && 
    (selected.role === "protagonist" || selected.role === "antagonist") &&
    entityPriorities.length > 0;

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
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <label className="text-sm font-medium" style={{ color: BRAND.navy }}>
          {genreConfig.entityLabel}:
        </label>
        
        <div className="relative w-64" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-left transition-all"
            style={{ background: "rgba(255, 255, 255, 0.95)", border: `1px solid ${BRAND.navy}20` }}
          >
            <div className="flex items-center gap-2">
              <User size={16} style={{ color: BRAND.mauve }} />
              <span style={{ color: BRAND.navy }}>{selected?.name || `Select a ${genreConfig.entityLabel.toLowerCase()}`}</span>
            </div>
            <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: BRAND.navy }} />
          </button>

          {isOpen && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto"
              style={{ background: "rgba(255, 255, 255, 0.98)", backdropFilter: "blur(10px)", border: `1px solid ${BRAND.navy}15` }}
            >
              {entities.length === 0 && unimportedEntities.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No {genreConfig.entityLabelPlural.toLowerCase()} yet. Add one or tag in your chapters.
                </div>
              ) : (
                <>
                  {entities.map((entity) => {
                    const roleInfo = genreConfig.roles.find(r => r.id === entity.role);
                    return (
                      <button
                        key={entity.id}
                        onClick={() => { onSelect(entity.id); setIsOpen(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                        style={{ background: entity.id === selectedId ? `${BRAND.gold}15` : "transparent" }}
                      >
                        <User size={14} style={{ color: BRAND.mauve }} />
                        <span style={{ color: BRAND.navy }}>{entity.name}</span>
                        {roleInfo && (
                          <span className="text-xs px-2 py-0.5 rounded-full ml-auto" style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}>
                            {roleInfo.label}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {unimportedEntities.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 border-t border-gray-100">
                        From your manuscript (tags)
                      </div>
                      {unimportedEntities.map((name) => (
                        <button
                          key={name}
                          onClick={() => { onImportEntity(name); setIsOpen(false); }}
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

        {selected && (
          <RoleSelector
            role={selected.role || "supporting"}
            onChange={(newRole) => onUpdateRole(selected.id, newRole)}
            genreConfig={genreConfig}
          />
        )}

        <button
          onClick={onAddEntity}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`, color: "#fff", boxShadow: `0 4px 12px ${BRAND.gold}40` }}
        >
          <Plus size={16} />
          New {genreConfig.entityLabel}
        </button>
      </div>

      {selected && (selected.role === "protagonist" || selected.role === "antagonist") && (
        <div className="flex justify-center items-center gap-3">
          <button
            onClick={onGenerateMilestones}
            disabled={!canGenerateMilestones || isGenerating}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: canGenerateMilestones ? `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` : "#e2e8f0",
              color: canGenerateMilestones ? "#fff" : "#94a3b8",
            }}
          >
            {isGenerating ? (
              <><Loader2 size={18} className="animate-spin" /> Generating...</>
            ) : (
              <><Wand2 size={18} /> Generate {genreConfig.milestoneLabelPlural} from Priorities</>
            )}
          </button>
          
          {!canGenerateMilestones && selected && entityPriorities.length === 0 && (
            <div className="flex items-center text-sm text-slate-500">
              <AlertCircle size={14} className="mr-1" />
              <span>Add priorities for {selected.name} first</span>
              <Link to="/story-lab/workshop/priorities" className="ml-1 underline" style={{ color: BRAND.gold }}>→</Link>
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
const ItemTypes = { MILESTONE: "MILESTONE" };

/* ---------------------------
   Draggable Milestone Row
---------------------------- */
function DraggableMilestone({ item, index, moveItem, update, remove, chapters, genreConfig }) {
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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`rounded-xl px-4 py-3 transition-all duration-200 ${isDragging ? "opacity-60 scale-[0.98]" : ""}`}
      style={{
        background: item.done ? `${BRAND.gold}08` : "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${item.done ? BRAND.gold + "40" : "rgba(30, 58, 95, 0.12)"}`,
        boxShadow: isDragging ? "none" : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center pt-1 cursor-grab active:cursor-grabbing select-none" title="Drag to reorder">
          <GripVertical className="h-5 w-5" style={{ color: BRAND.mauve }} />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}>
              {index + 1}
            </span>
            <input
              value={item.title}
              onChange={(e) => update(item.id, { title: e.target.value })}
              className="flex-1 text-base font-medium bg-transparent border-none outline-none focus:ring-0"
              style={{ color: BRAND.navy }}
              placeholder={`${genreConfig.milestoneLabel} title`}
            />
          </div>

          <textarea
            value={item.description || ""}
            onChange={(e) => update(item.id, { description: e.target.value })}
            className="w-full text-sm bg-transparent border-none outline-none resize-none focus:ring-0"
            style={{ color: "#64748b" }}
            placeholder={`Describe this ${genreConfig.milestoneLabel.toLowerCase()}...`}
            rows={2}
          />

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <select
              value={item.chapterId || ""}
              onChange={(e) => update(item.id, { chapterId: e.target.value || null })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: "rgba(255, 255, 255, 0.8)", border: `1px solid ${BRAND.navy}15`, color: BRAND.navy }}
            >
              <option value="">Link to chapter...</option>
              {chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.id}>{ch.title || `Chapter ${idx + 1}`}</option>
              ))}
            </select>

            <select
              value={item.phase || "beginning"}
              onChange={(e) => update(item.id, { phase: e.target.value })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: "rgba(255, 255, 255, 0.8)", border: `1px solid ${BRAND.navy}15`, color: BRAND.navy }}
            >
              {genreConfig.phases.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>

            <select
              value={item.emotionalState || "neutral"}
              onChange={(e) => update(item.id, { emotionalState: e.target.value })}
              className="text-xs rounded-lg px-2 py-1.5"
              style={{ background: "rgba(255, 255, 255, 0.8)", border: `1px solid ${BRAND.navy}15`, color: BRAND.navy }}
            >
              {genreConfig.emotionalStates.map(es => (
                <option key={es.id} value={es.id}>{es.label}</option>
              ))}
            </select>
            
            {item.source === "AI Generated" && (
              <span className="text-xs px-2 py-1 rounded-lg flex items-center gap-1" style={{ background: `${BRAND.gold}15`, color: BRAND.gold }}>
                <Sparkles size={10} /> AI Generated
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
            <span className="text-xs" style={{ color: BRAND.navy }}>Done</span>
          </label>

          <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" onClick={() => remove(item.id)} title="Delete">
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
  <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(255, 255, 255, 0.6)", border: `1px dashed ${BRAND.navy}20` }}>
    <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${BRAND.mauve}20` }}>
      <Icon size={24} style={{ color: BRAND.mauve }} />
    </div>
    <h4 className="font-semibold mb-1" style={{ color: BRAND.navy }}>{title}</h4>
    <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
    {action}
  </div>
);

/* ---------------------------
   Milestones View
---------------------------- */
const MilestonesView = ({ entity, milestones, chapters, onAdd, onUpdate, onRemove, onMove, allPriorities, genreConfig }) => {
  if (!entity) {
    return (
      <EmptyState
        icon={User}
        title={`Select a ${genreConfig.entityLabel}`}
        description={`Choose a ${genreConfig.entityLabel.toLowerCase()} from the dropdown above to view and edit their ${genreConfig.milestoneLabelPlural.toLowerCase()}.`}
      />
    );
  }

  const roleInfo = genreConfig.roles.find(r => r.id === entity.role);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>{entity.name}'s {genreConfig.journeyLabel}</h3>
            {roleInfo && (
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${roleInfo.color}15`, color: roleInfo.color }}>
                {roleInfo.label}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {milestones.length} {genreConfig.milestoneLabel.toLowerCase()}{milestones.length !== 1 ? "s" : ""} • {milestones.filter((m) => m.done).length} completed
          </p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`, color: "#fff", boxShadow: `0 4px 12px ${BRAND.gold}40` }}
        >
          <Plus size={16} /> Add {genreConfig.milestoneLabel}
        </button>
      </div>

      {milestones.length > 0 && (
        <div className="h-2 rounded-full overflow-hidden" style={{ background: `${BRAND.navy}10` }}>
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
            title={`No ${genreConfig.milestoneLabelPlural} Yet`}
            description={`Start mapping ${entity.name}'s journey by adding ${genreConfig.milestoneLabelPlural.toLowerCase()}.`}
            action={
              <button
                onClick={onAdd}
                className="mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                style={{ background: `${BRAND.gold}20`, color: BRAND.navy, border: `1px solid ${BRAND.gold}40` }}
              >
                <Plus size={16} /> Add First {genreConfig.milestoneLabel}
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
              genreConfig={genreConfig}
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
const TimelineView = ({ entities, chapters, genreConfig }) => {
  const timelineData = useMemo(() => {
    return chapters.map((chapter, idx) => {
      const entityEvents = entities
        .map((entity) => {
          const milestones = (entity.milestones || []).filter((m) => m.chapterId === chapter.id);
          return milestones.length > 0 ? { entity, milestones } : null;
        })
        .filter(Boolean);

      return { chapter, index: idx, events: entityEvents };
    });
  }, [entities, chapters]);

  if (chapters.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No Chapters Yet"
        description={`Create chapters in your manuscript first, then link ${genreConfig.milestoneLabelPlural.toLowerCase()} to see them on the timeline.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>Story Timeline</h3>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5" style={{ background: `${BRAND.navy}15` }} />

        <div className="space-y-6">
          {timelineData.map(({ chapter, index, events }) => (
            <div key={chapter.id} className="relative pl-16">
              <div
                className="absolute left-4 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: events.length > 0 ? `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.goldLight} 100%)` : "white",
                  border: `2px solid ${events.length > 0 ? BRAND.gold : BRAND.navy}30`,
                  color: events.length > 0 ? "#fff" : BRAND.navy,
                }}
              >
                {index + 1}
              </div>

              <div className="rounded-xl p-4" style={{ background: "rgba(255, 255, 255, 0.95)", border: `1px solid ${BRAND.navy}12` }}>
                <h4 className="font-semibold mb-2" style={{ color: BRAND.navy }}>{chapter.title || `Chapter ${index + 1}`}</h4>

                {events.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No {genreConfig.milestoneLabelPlural.toLowerCase()} linked to this chapter</p>
                ) : (
                  <div className="space-y-2">
                    {events.map(({ entity, milestones }) => {
                      const roleInfo = genreConfig.roles.find(r => r.id === entity.role);
                      return (
                        <div key={entity.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: roleInfo ? `${roleInfo.color}30` : `${BRAND.mauve}30` }}>
                            <User size={12} style={{ color: roleInfo?.color || BRAND.mauve }} />
                          </div>
                          <div className="flex-1">
                            <span className="text-sm font-medium" style={{ color: BRAND.navy }}>{entity.name}</span>
                            <div className="mt-1 space-y-1">
                              {milestones.map((m) => (
                                <div key={m.id} className="text-sm flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.done ? "bg-green-400" : "bg-gray-300"}`} />
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
const RelationshipsView = ({ entities, relationships, onAddRelationship, onUpdateRelationship, onRemoveRelationship, genreConfig }) => {
  const relationshipTypes = [
    { id: "ally", label: "Ally", icon: Heart, color: "#22c55e" },
    { id: "rival", label: "Rival", icon: Swords, color: "#ef4444" },
    { id: "family", label: "Family", icon: Users, color: "#8b5cf6" },
    { id: "romantic", label: "Romantic", icon: Heart, color: "#ec4899" },
    { id: "mentor", label: "Mentor/Mentee", icon: Sparkles, color: BRAND.gold },
    { id: "neutral", label: "Neutral", icon: HelpCircle, color: "#6b7280" },
    { id: "complex", label: "Complex", icon: Network, color: BRAND.mauve },
  ];

  if (entities.length < 2) {
    return (
      <EmptyState
        icon={Users}
        title={`Need More ${genreConfig.entityLabelPlural}`}
        description={`Add at least two ${genreConfig.entityLabelPlural.toLowerCase()} to start mapping their relationships.`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>{genreConfig.entityLabel} Relationships</h3>
          <p className="text-sm text-gray-500">{relationships.length} connection{relationships.length !== 1 ? "s" : ""} mapped</p>
        </div>
        <button
          onClick={onAddRelationship}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105"
          style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`, color: "#fff" }}
        >
          <Link2 size={16} /> Add Relationship
        </button>
      </div>

      <div className="space-y-3">
        {relationships.length === 0 ? (
          <EmptyState icon={Network} title="No Relationships Defined" description={`Start mapping how your ${genreConfig.entityLabelPlural.toLowerCase()} connect to each other.`} />
        ) : (
          relationships.map((rel) => {
            const entity1 = entities.find((c) => c.id === rel.from);
            const entity2 = entities.find((c) => c.id === rel.to);
            const typeData = relationshipTypes.find((t) => t.id === rel.type) || relationshipTypes[5];
            const Icon = typeData.icon;

            return (
              <div key={rel.id} className="rounded-xl p-4" style={{ background: "rgba(255, 255, 255, 0.95)", border: `1px solid ${typeData.color}30` }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${typeData.color}20` }}>
                    <Icon size={16} style={{ color: typeData.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: BRAND.navy }}>{entity1?.name || "Unknown"}</span>
                      <ArrowRight size={14} className="text-gray-400" />
                      <span className="font-medium" style={{ color: BRAND.navy }}>{entity2?.name || "Unknown"}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${typeData.color}15`, color: typeData.color }}>{typeData.label}</span>
                    </div>
                    {rel.description && <p className="text-sm text-gray-500 mt-1">{rel.description}</p>}
                  </div>
                  <button onClick={() => onRemoveRelationship(rel.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
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
const GoalsView = ({ entity, onUpdate, allPriorities, genreConfig }) => {
  if (!entity) {
    return (
      <EmptyState
        icon={User}
        title={`Select a ${genreConfig.entityLabel}`}
        description={`Choose a ${genreConfig.entityLabel.toLowerCase()} from the dropdown above to define their goals and conflicts.`}
      />
    );
  }

  const goals = entity.goals || {};

  const updateGoal = (key, value) => {
    onUpdate(entity.id, { goals: { ...goals, [key]: value } });
  };

  const fieldsConfig = {
    fiction: [
      { key: "want", label: "External Want", placeholder: "What does this character consciously pursue?", icon: Target, color: BRAND.gold },
      { key: "need", label: "Internal Need", placeholder: "What do they actually need (often unknown to them)?", icon: Heart, color: "#ec4899" },
      { key: "fear", label: "Greatest Fear", placeholder: "What are they most afraid of?", icon: Swords, color: "#ef4444" },
      { key: "flaw", label: "Fatal Flaw", placeholder: "What weakness holds them back?", icon: X, color: "#f97316" },
      { key: "strength", label: "Core Strength", placeholder: "What's their greatest asset?", icon: Sparkles, color: "#22c55e" },
      { key: "lie", label: "The Lie They Believe", placeholder: "What false belief shapes their worldview?", icon: HelpCircle, color: BRAND.mauve },
      { key: "truth", label: "The Truth", placeholder: "What must they learn by story's end?", icon: Check, color: BRAND.navy },
      { key: "stakes", label: "Stakes", placeholder: "What happens if they fail?", icon: Target, color: "#dc2626" },
    ],
    nonfiction: [
      { key: "thesis", label: "Central Thesis", placeholder: "What is the main argument?", icon: Target, color: BRAND.gold },
      { key: "evidence", label: "Key Evidence", placeholder: "What facts support this?", icon: Layers, color: "#22c55e" },
      { key: "counter", label: "Counter-Arguments", placeholder: "What objections must be addressed?", icon: MessageSquare, color: "#ef4444" },
      { key: "audience", label: "Target Audience", placeholder: "Who needs to hear this?", icon: Users, color: BRAND.mauve },
      { key: "impact", label: "Desired Impact", placeholder: "What change should this create?", icon: Lightbulb, color: "#f97316" },
      { key: "sources", label: "Key Sources", placeholder: "What authorities support this?", icon: Quote, color: BRAND.navy },
    ],
    poetry: [
      { key: "image", label: "Central Image", placeholder: "What visual anchors the poem?", icon: Image, color: BRAND.gold },
      { key: "emotion", label: "Core Emotion", placeholder: "What feeling drives this?", icon: Heart, color: "#ec4899" },
      { key: "sound", label: "Sound Pattern", placeholder: "What sonic qualities define it?", icon: Music, color: "#8b5cf6" },
      { key: "tension", label: "Central Tension", placeholder: "What conflict or contrast exists?", icon: Swords, color: "#ef4444" },
      { key: "symbol", label: "Symbolism", placeholder: "What deeper meaning is present?", icon: Sparkles, color: BRAND.navy },
      { key: "turn", label: "The Turn/Volta", placeholder: "Where does the perspective shift?", icon: TrendingUp, color: "#22c55e" },
    ],
    memoir: [
      { key: "memory", label: "Key Memory", placeholder: "What specific moment matters most?", icon: Eye, color: BRAND.gold },
      { key: "emotion", label: "Core Emotion", placeholder: "What did you feel?", icon: Heart, color: "#ec4899" },
      { key: "before", label: "Before", placeholder: "Who were you before this?", icon: Clock, color: BRAND.mauve },
      { key: "after", label: "After", placeholder: "Who did you become?", icon: Compass, color: "#22c55e" },
      { key: "lesson", label: "The Lesson", placeholder: "What did you learn?", icon: Lightbulb, color: BRAND.navy },
      { key: "universal", label: "Universal Truth", placeholder: "What does this mean for others?", icon: Users, color: "#f97316" },
    ],
  };

  const fields = fieldsConfig[genreConfig.id] || fieldsConfig.fiction;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>{entity.name}'s Goals & Conflicts</h3>
        <p className="text-sm text-gray-500">Define what drives this {genreConfig.entityLabel.toLowerCase()} and what stands in their way.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(({ key, label, placeholder, icon: Icon, color }) => (
          <div key={key} className="rounded-xl p-4 transition-all" style={{ background: "rgba(255, 255, 255, 0.95)", border: `1px solid ${color}25` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={14} style={{ color }} />
              </div>
              <label className="text-sm font-semibold" style={{ color: BRAND.navy }}>{label}</label>
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
   Main Component
------------------------------------------------- */
export default function CharacterRoadmap() {
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [genre, setGenre] = useState(() => loadProjectGenre());
  const [activeView, setActiveView] = useState("milestones");
  const [roadmapData, setRoadmapData] = useState(() => loadRoadmapData());
  const [storyLabData, setStoryLabData] = useState(() => loadStoryLabData());
  const [selectedEntityId, setSelectedEntityId] = useState(null);
  const [allPriorities, setAllPriorities] = useState(() => loadAllPriorities());
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [milestoneSuggestions, setMilestoneSuggestions] = useState([]);
  const [generationError, setGenerationError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const genreConfig = GENRE_CONFIG[genre] || GENRE_CONFIG.fiction;

  const storyEntities = useMemo(() => {
    if (!storyLabData?.chapters) return [];
    return extractEntitiesFromChapters(storyLabData.chapters, genreConfig.tagPattern);
  }, [storyLabData, genreConfig.tagPattern]);

  const entities = roadmapData.characters || [];
  const relationships = roadmapData.relationships || [];
  const chapters = storyLabData?.chapters || [];
  const bookTitle = storyLabData?.book?.title || "Untitled";

  const selectedEntity = entities.find((c) => c.id === selectedEntityId);
  const selectedMilestones = selectedEntity?.milestones || [];

  useEffect(() => {
    if (!selectedEntityId && entities.length > 0) {
      setSelectedEntityId(entities[0].id);
    }
  }, [entities, selectedEntityId]);

  useEffect(() => {
    const reloadAllData = () => {
      const pid = getSelectedProjectId();
      console.log(`[Roadmap] Reloading data for project: ${pid}`);
      setGenre(loadProjectGenre());
      setStoryLabData(loadStoryLabData());
      setRoadmapData(loadRoadmapData());
      setAllPriorities(loadAllPriorities());
      setSelectedEntityId(null);
      setShowSuggestions(false);
      setMilestoneSuggestions([]);
    };

    const handleProjectSwitch = () => {
      const newProjectId = getSelectedProjectId();
      
      if (newProjectId !== currentProjectId) {
        console.log(`[Roadmap] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };
    
    const handleDataChange = () => {
      setStoryLabData(loadStoryLabData());
      setRoadmapData(loadRoadmapData());
      setAllPriorities(loadAllPriorities());
      setGenre(loadProjectGenre());
    };
    
    window.addEventListener("project:change", handleProjectSwitch);
    window.addEventListener("storage", handleProjectSwitch);
    
    return () => {
      window.removeEventListener("project:change", handleProjectSwitch);
      window.removeEventListener("storage", handleProjectSwitch);
    };
  }, [currentProjectId]);

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

  const addEntity = () => {
    const newId = uid();
    commit((data) => {
      data.characters.push({
        id: newId,
        name: `New ${genreConfig.entityLabel}`,
        role: "supporting",
        milestones: [],
        goals: {},
      });
    });
    setSelectedEntityId(newId);
  };

  const importEntity = (name) => {
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
    setSelectedEntityId(newId);
  };

  const updateEntity = (id, patch) => {
    commit((data) => {
      const entity = data.characters.find((c) => c.id === id);
      if (entity) Object.assign(entity, patch);
    });
  };

  const updateEntityRole = (id, role) => {
    commit((data) => {
      const entity = data.characters.find((c) => c.id === id);
      if (entity) entity.role = role;
    });
  };

  const generateMilestones = async () => {
    if (!selectedEntity) return;
    
    const entityPriorities = allPriorities.filter(p => 
      (p.character || p.entity)?.toLowerCase() === selectedEntity.name?.toLowerCase()
    );
    
    if (entityPriorities.length === 0) {
      alert(`No priorities found for ${selectedEntity.name}. Add priorities in Priority Cards first.`);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setMilestoneSuggestions([]);
    setShowSuggestions(true);

    const isMain = selectedEntity.role === "protagonist";
    const milestoneCount = isMain ? "6-8" : "3-5";
    
    const prioritiesText = entityPriorities.map(p => {
      const type = p.priorityType || "Priority";
      return `- ${type}: ${p.title}`;
    }).join("\n");

    const phasesList = genreConfig.phases.map(p => p.id).join("|");

    const prompt = `You are a ${genreConfig.label.toLowerCase()} structure expert. Generate ${milestoneCount} ${genreConfig.milestoneLabelPlural.toLowerCase()} for a ${isMain ? genreConfig.roles[0].label : genreConfig.roles[1].label}.

${genreConfig.entityLabel.toUpperCase()}: ${selectedEntity.name}
ROLE: ${isMain ? genreConfig.roles[0].label : genreConfig.roles[1].label}

PRIORITIES (from the author):
${prioritiesText}

Create a ${genreConfig.journeyLabel.toLowerCase()} that develops across the narrative.

For each ${genreConfig.milestoneLabel.toLowerCase()}, specify which priority it connects to.

Respond with a JSON array:
[
  {
    "title": "Brief ${genreConfig.milestoneLabel.toLowerCase()} title",
    "description": "2-3 sentence description",
    "phase": "${phasesList}",
    "basedOn": "Which priority this connects to"
  }
]

Return ONLY the JSON array, no other text.`;

    try {
      const result = await runAssistant(prompt, "clarify", "", "anthropic");
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      let parsed = [];
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse milestones:", e);
        setGenerationError("Couldn't parse AI response. Please try again.");
        return;
      }

      if (Array.isArray(parsed) && parsed.length > 0) {
        setMilestoneSuggestions(parsed);
      } else {
        setGenerationError(`No ${genreConfig.milestoneLabelPlural.toLowerCase()} generated. Please try again.`);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerationError(`Failed to generate ${genreConfig.milestoneLabelPlural.toLowerCase()}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const acceptMilestone = (suggestion) => {
    if (!selectedEntityId) return;
    
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity) {
        entity.milestones.push({
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

  const rejectMilestone = (index) => {
    setMilestoneSuggestions(prev => prev.filter((_, i) => i !== index));
  };

  const acceptAllMilestones = () => {
    if (!selectedEntityId) return;
    
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity) {
        milestoneSuggestions.forEach(suggestion => {
          entity.milestones.push({
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

  const closeSuggestions = () => {
    setShowSuggestions(false);
    setMilestoneSuggestions([]);
    setGenerationError(null);
  };

  const addMilestone = () => {
    if (!selectedEntityId) return;
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity) {
        entity.milestones.push({
          id: uid(),
          title: `New ${genreConfig.milestoneLabel}`,
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
    if (!selectedEntityId) return;
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity) {
        const m = entity.milestones.find((x) => x.id === milestoneId);
        if (m) Object.assign(m, patch);
      }
    });
  };

  const removeMilestone = (milestoneId) => {
    if (!selectedEntityId) return;
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity) {
        entity.milestones = entity.milestones.filter((m) => m.id !== milestoneId);
      }
    });
  };

  const moveMilestone = (fromIndex, toIndex) => {
    if (!selectedEntityId) return;
    commit((data) => {
      const entity = data.characters.find((c) => c.id === selectedEntityId);
      if (entity?.milestones) {
        const list = entity.milestones;
        if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length) return;
        const [m] = list.splice(fromIndex, 1);
        list.splice(toIndex, 0, m);
      }
    });
  };

  const addRelationship = () => {
    if (entities.length < 2) return;
    commit((data) => {
      data.relationships.push({
        id: uid(),
        from: entities[0].id,
        to: entities[1].id,
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
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/story-lab" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors">
              <ArrowLeft size={16} /> Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>{genreConfig.pageTitle}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{genreConfig.label}</span>
          </div>
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`, color: "#fff" }}
          >
            Workshop Hub
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <PageBanner activeView={activeView} bookTitle={bookTitle} currentProjectId={currentProjectId} genreConfig={genreConfig} />

        <ViewTabs activeView={activeView} setActiveView={setActiveView} genreConfig={genreConfig} />

        {(activeView === "milestones" || activeView === "goals") && (
          <EntitySelector
            entities={entities}
            storyEntities={storyEntities}
            selectedId={selectedEntityId}
            onSelect={(id) => { setSelectedEntityId(id); setShowSuggestions(false); }}
            onAddEntity={addEntity}
            onImportEntity={importEntity}
            onUpdateRole={updateEntityRole}
            onGenerateMilestones={generateMilestones}
            isGenerating={isGenerating}
            allPriorities={allPriorities}
            genreConfig={genreConfig}
          />
        )}

        <div
          className="rounded-2xl p-6"
          style={{ background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)", border: `1px solid ${BRAND.navy}10`, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
        >
          {activeView === "milestones" && (
            <MilestonesView
              entity={selectedEntity}
              milestones={selectedMilestones}
              chapters={chapters}
              onAdd={addMilestone}
              onUpdate={updateMilestone}
              onRemove={removeMilestone}
              onMove={moveMilestone}
              allPriorities={allPriorities}
              genreConfig={genreConfig}
            />
          )}

          {activeView === "timeline" && (
            <TimelineView entities={entities} chapters={chapters} genreConfig={genreConfig} />
          )}

          {activeView === "relationships" && (
            <RelationshipsView
              entities={entities}
              relationships={relationships}
              onAddRelationship={addRelationship}
              onUpdateRelationship={updateRelationship}
              onRemoveRelationship={removeRelationship}
              genreConfig={genreConfig}
            />
          )}

          {activeView === "goals" && (
            <GoalsView entity={selectedEntity} onUpdate={updateEntity} allPriorities={allPriorities} genreConfig={genreConfig} />
          )}
        </div>
      </div>
    </div>
  );
}

