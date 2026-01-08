// src/components/storylab/NarrativeArc.jsx
// FIXED: Uses storage service (not localStorage directly)
// Characters displayed as Trello-style cards at bottom (not sidebar)

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, Users, Plane, Sparkles, BookOpen, MapPin, 
  ArrowLeft, ArrowRight, Plus, Trash2, Save, Upload, Download,
  User, Star, Shield, Zap, Target, Clock, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, Check, X, GripVertical, Edit3,
  HelpCircle, Lightbulb
} from "lucide-react";
import { storage } from "../../lib/storage/storage";

/* ============================================
   Brand Colors
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldLight: "#f5e6b3",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  ink: "#0F172A",
  cream: "#fefdfb",
};

/* ============================================
   Icon registry
   ============================================ */
const ICONS = { 
  Heart, Users, Plane, Sparkles, BookOpen, MapPin,
  Star, Shield, Zap, Target, Clock, AlertCircle, User
};

const ICON_OPTIONS = [
  { key: "Heart", label: "Heart" },
  { key: "Star", label: "Star" },
  { key: "Target", label: "Target" },
  { key: "Users", label: "Users" },
  { key: "Shield", label: "Shield" },
  { key: "Zap", label: "Lightning" },
  { key: "Sparkles", label: "Sparkles" },
  { key: "BookOpen", label: "Book" },
  { key: "Plane", label: "Plane" },
  { key: "MapPin", label: "Location" },
  { key: "Clock", label: "Clock" },
  { key: "AlertCircle", label: "Alert" },
];

/* ============================================
   Color Classes
   ============================================ */
const COLOR_CLASSES = {
  primary: { bg: "bg-[#1e3a5f]", border: "border-[#1e3a5f]", text: "text-white" },
  accent:  { bg: "bg-[#e8b4b8]", border: "border-[#e8b4b8]", text: "text-[#0F172A]" },
  gold:    { bg: "bg-[#d4af37]", border: "border-[#d4af37]", text: "text-[#0F172A]" },
  muted:   { bg: "bg-[#b8a9c9]", border: "border-[#b8a9c9]", text: "text-white" },
  ink:     { bg: "bg-[#0F172A]", border: "border-[#0F172A]", text: "text-white" },
};

const COLOR_OPTIONS = [
  { key: "primary", label: "Navy" },
  { key: "gold", label: "Gold" },
  { key: "accent", label: "Rose" },
  { key: "muted", label: "Mauve" },
  { key: "ink", label: "Ink" },
];

/* ============================================
   Character Role Colors
   ============================================ */
const ROLE_COLORS = {
  "Protagonist": { bg: BRAND.navy, text: "#fff" },
  "Antagonist": { bg: "#7c3aed", text: "#fff" },
  "Love Interest": { bg: BRAND.rose, text: BRAND.ink },
  "Mentor": { bg: BRAND.gold, text: BRAND.ink },
  "Sidekick": { bg: "#059669", text: "#fff" },
  "Catalyst": { bg: "#dc2626", text: "#fff" },
  "Secondary": { bg: BRAND.mauve, text: "#fff" },
  "Character": { bg: "#64748b", text: "#fff" },
};

const ROLE_OPTIONS = [
  "Protagonist",
  "Antagonist", 
  "Love Interest",
  "Mentor",
  "Sidekick",
  "Catalyst",
  "Secondary",
  "Character",
];

/* ============================================
   PROJECT-AWARE STORAGE (using storage service)
   ============================================ */
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const ARC_BEATS_KEY_BASE = "dt_arc_beats_v2";
const ARC_CHARS_KEY_BASE = "dt_arc_chars_v2";

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

const loadLocal = (key, fallback) => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key, value) => {
  try {
    storage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

function loadStoryLabData() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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

/**
 * Extract which chapters each character appears in
 * Returns: { "Marcus": [0, 2, 5], "Grace": [1, 3, 4] }
 */
function extractCharacterAppearances(chapters = []) {
  const appearances = {};
  const charPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi;
  
  chapters.forEach((ch, chapterIndex) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    let match;
    while ((match = charPattern.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) {
        if (!appearances[name]) {
          appearances[name] = [];
        }
        if (!appearances[name].includes(chapterIndex)) {
          appearances[name].push(chapterIndex);
        }
      }
    }
  });
  
  return appearances;
}

/**
 * Map a chapter index to a story phase based on position in manuscript
 */
function mapChapterToPhase(chapterIndex, totalChapters, storyBeats) {
  if (totalChapters === 0) return null;
  
  // Calculate position as percentage through the story
  const position = (chapterIndex / Math.max(1, totalChapters - 1)) * 100;
  
  // Find the closest beat based on x position
  let closestBeat = storyBeats[0];
  let closestDistance = Math.abs(position - (storyBeats[0]?.position?.x || 0));
  
  storyBeats.forEach(beat => {
    const distance = Math.abs(position - (beat.position?.x || 0));
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBeat = beat;
    }
  });
  
  return closestBeat;
}

/**
 * Get the first appearance phase for a character
 */
function getFirstAppearancePhase(characterName, chapters, storyBeats) {
  const appearances = extractCharacterAppearances(chapters);
  const charAppearances = appearances[characterName] || [];
  
  if (charAppearances.length === 0 || storyBeats.length === 0) return null;
  
  const firstChapter = Math.min(...charAppearances);
  const beat = mapChapterToPhase(firstChapter, chapters.length, storyBeats);
  
  return beat ? { beat, chapterIndex: firstChapter } : null;
}

/**
 * Get all phases a character appears in
 */
function getCharacterPhases(characterName, chapters, storyBeats) {
  const appearances = extractCharacterAppearances(chapters);
  const charAppearances = appearances[characterName] || [];
  
  const phases = new Set();
  const beatIds = new Set();
  
  charAppearances.forEach(chapterIndex => {
    const beat = mapChapterToPhase(chapterIndex, chapters.length, storyBeats);
    if (beat) {
      phases.add(beat.phase || beat.title);
      beatIds.add(beat.id);
    }
  });
  
  return { phases: Array.from(phases), beatIds: Array.from(beatIds), chapterIndices: charAppearances };
}

function getInitials(name) {
  return name.split(/\s+/).map(word => word[0]).join('').toUpperCase().slice(0, 2);
}

function getCharacterColorByIndex(index) {
  const colors = [
    { bg: BRAND.navy, text: "#fff" },
    { bg: BRAND.gold, text: BRAND.ink },
    { bg: BRAND.mauve, text: "#fff" },
    { bg: BRAND.rose, text: BRAND.ink },
    { bg: "#7c3aed", text: "#fff" },
    { bg: "#059669", text: "#fff" },
  ];
  return colors[index % colors.length];
}

/* ============================================
   Helpers
   ============================================ */
const snap = (val, step = 5, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Math.round(val / step) * step));

const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;

const uid = () => {
  try {
    if (typeof window !== "undefined" && window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
  } catch {}
  return String(Date.now()) + "_" + Math.random().toString(36).slice(2);
};

const useDebouncedCallback = (fn, delay = 250) => {
  const tRef = useRef(null);
  return (v) => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => fn(v), delay);
  };
};

function reviveBeats(beats) {
  return (beats || []).map((b) => {
    const iconKey = b.iconKey || b.icon?.name || "Heart";
    const { icon, ...rest } = b;
    return { ...rest, iconKey, id: b.id || uid() };
  });
}

/* ============================================
   Default Beats
   ============================================ */
const DEFAULT_BEATS = [
  { id: uid(), title: "Opening Hook", iconKey: "Star", position: { x: 10, y: 70 }, content: "The inciting incident that draws readers in.", color: "primary", size: "large", phase: "beginning" },
  { id: uid(), title: "Rising Action", iconKey: "Target", position: { x: 30, y: 50 }, content: "The protagonist pursues their goal.", color: "gold", size: "medium", phase: "rising" },
  { id: uid(), title: "Midpoint", iconKey: "Zap", position: { x: 50, y: 25 }, content: "A major turning point.", color: "accent", size: "xlarge", phase: "midpoint" },
  { id: uid(), title: "Crisis", iconKey: "AlertCircle", position: { x: 70, y: 50 }, content: "The darkest moment.", color: "muted", size: "medium", phase: "falling" },
  { id: uid(), title: "Climax", iconKey: "Shield", position: { x: 85, y: 30 }, content: "The final confrontation.", color: "ink", size: "large", phase: "climax" },
  { id: uid(), title: "Resolution", iconKey: "Heart", position: { x: 95, y: 70 }, content: "The new normal.", color: "primary", size: "medium", phase: "resolution" },
];

function loadBeats() {
  const key = getProjectKey(ARC_BEATS_KEY_BASE);
  const saved = loadLocal(key, null);
  return saved?.length > 0 ? reviveBeats(saved) : DEFAULT_BEATS.map(b => ({ ...b, id: uid() }));
}

function loadCharacters() {
  const key = getProjectKey(ARC_CHARS_KEY_BASE);
  return loadLocal(key, []);
}

function saveBeats(beats) {
  const key = getProjectKey(ARC_BEATS_KEY_BASE);
  saveLocal(key, beats);
}

function saveCharacters(chars) {
  const key = getProjectKey(ARC_CHARS_KEY_BASE);
  saveLocal(key, chars);
}

/* ============================================
   Character Card (Trello-style) - With Arc Integration
   ============================================ */
function CharacterCard({ 
  char, 
  index, 
  onUpdate, 
  onDelete, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  isDragging,
  isSelected,
  onSelect,
  assignedBeats = []
}) {
  const [isEditing, setIsEditing] = useState(false);
  const roleColor = ROLE_COLORS[char.role] || ROLE_COLORS["Character"];

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={(e) => { e.preventDefault(); onDrop(index); }}
      onClick={() => onSelect && onSelect(char.id)}
      className={`rounded-2xl shadow-lg overflow-hidden transition-all cursor-pointer ${
        isDragging ? "opacity-50 scale-95" : "hover:scale-[1.02]"
      } ${isSelected ? "ring-4 ring-offset-2 shadow-xl scale-[1.02]" : "hover:shadow-xl"}`}
      style={{ 
        border: `3px solid ${roleColor.bg}`,
        background: `linear-gradient(180deg, ${roleColor.bg}08 0%, ${roleColor.bg}15 100%)`,
        ringColor: BRAND.gold,
      }}
    >
      {/* Header - Bolder gradient */}
      <div 
        className="px-4 py-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${roleColor.bg} 0%, ${roleColor.bg}cc 50%, ${roleColor.bg}99 100%)` }}
      >
        {/* Decorative circle */}
        <div 
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20"
          style={{ background: "#fff" }}
        />
        
        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 bg-white/30 rounded-full p-1">
            <Check size={14} className="text-white" />
          </div>
        )}
        
        <div className="relative flex items-center gap-3">
          <div className="cursor-grab active:cursor-grabbing text-white/60 hover:text-white/90">
            <GripVertical size={18} />
          </div>
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-xl"
            style={{ 
              background: "rgba(255,255,255,0.25)", 
              color: "#fff",
              border: "3px solid rgba(255,255,255,0.4)",
              backdropFilter: "blur(4px)",
            }}
          >
            {char.initials}
          </div>
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                value={char.name}
                onChange={(e) => onUpdate(char.id, { 
                  name: e.target.value,
                  initials: getInitials(e.target.value),
                })}
                onBlur={() => setIsEditing(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(false)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                className="w-full bg-white/30 rounded-lg px-3 py-1.5 text-white font-bold outline-none text-lg"
                placeholder="Character name"
              />
            ) : (
              <h4 
                className="font-bold text-lg truncate cursor-pointer hover:underline text-white"
                onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              >
                {char.name}
              </h4>
            )}
            <div 
              className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ 
                background: "rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              {char.role}
            </div>
          </div>
        </div>
      </div>

      {/* Arc Assignments Banner */}
      {assignedBeats.length > 0 ? (
        <div 
          className="px-4 py-3"
          style={{ background: `${BRAND.gold}15`, borderBottom: `2px solid ${BRAND.gold}30` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} style={{ color: BRAND.gold }} />
            <span className="text-xs font-bold" style={{ color: BRAND.gold }}>
              Appears in {assignedBeats.length} beat{assignedBeats.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {assignedBeats.map(beat => (
              <span 
                key={beat.id}
                className="text-[10px] font-medium px-2 py-1 rounded-full"
                style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}
              >
                {beat.title}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div 
          className="px-4 py-2 text-center"
          style={{ background: `${BRAND.mauve}10`, borderBottom: `1px solid ${BRAND.mauve}20` }}
        >
          <span className="text-[10px] text-slate-400">Not assigned to any beats yet</span>
        </div>
      )}

      {/* Body - Tinted background */}
      <div className="px-4 py-4">
        {/* Role selector with colored accent */}
        <div className="mb-4">
          <label 
            className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block"
            style={{ color: roleColor.bg }}
          >
            Role
          </label>
          <select
            value={char.role}
            onChange={(e) => onUpdate(char.id, { role: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none font-medium transition-all"
            style={{ 
              background: "#fff",
              border: `2px solid ${roleColor.bg}30`,
              color: BRAND.ink,
            }}
          >
            {ROLE_OPTIONS.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Notes with colored border */}
        <div className="mb-4">
          <label 
            className="text-[10px] uppercase tracking-wider font-bold mb-1.5 block"
            style={{ color: roleColor.bg }}
          >
            Notes
          </label>
          <textarea
            value={char.notes || ""}
            onChange={(e) => onUpdate(char.id, { notes: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            placeholder="Character notes..."
            className="w-full text-sm rounded-xl px-3 py-2.5 outline-none resize-none h-20 transition-all"
            style={{ 
              background: "#fff",
              border: `2px solid ${roleColor.bg}30`,
              color: BRAND.ink,
            }}
          />
        </div>

        {/* Action buttons with role color */}
        <div 
          className="flex items-center justify-between pt-3 mt-2"
          style={{ borderTop: `2px solid ${roleColor.bg}20` }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ 
              background: `${roleColor.bg}15`,
              color: roleColor.bg,
            }}
          >
            <Edit3 size={12} />
            Edit
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(char.id); }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-all hover:scale-105"
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Instructions Panel (Collapsible)
   ============================================ */
function InstructionsPanel() {
  const [isOpen, setIsOpen] = useState(true);

  const steps = [
    {
      number: 1,
      title: "Understand the Arc",
      description: "The Narrative Arc represents your protagonist's emotional journey through the story. Each beat is a pivotal moment where they grow or change.",
      icon: BookOpen,
    },
    {
      number: 2,
      title: "Define Your Beats",
      description: "Click on each beat in the canvas or timeline. Describe what happens in that scene. Think about the external events AND internal shifts.",
      icon: Target,
    },
    {
      number: 3,
      title: "Assign Characters to Beats",
      description: "Add characters to each scene and define their PURPOSE. Ask: Why is this character here? How do they impact the protagonist?",
      icon: Users,
    },
    {
      number: 4,
      title: "Track Protagonist Growth",
      description: "For each beat, capture your protagonist's internal state BEFORE and AFTER. What did they believe? What changed? This is the heart of character development.",
      icon: Heart,
    },
    {
      number: 5,
      title: "See the Full Picture",
      description: "Click any character card below to see which beats they appear in (highlighted in gold). This helps you ensure every character serves your story's arc.",
      icon: Sparkles,
    },
  ];

  return (
    <div 
      className="rounded-2xl mb-8 overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${BRAND.gold}08 0%, ${BRAND.mauve}12 100%)`,
        border: `2px solid ${BRAND.gold}30`,
      }}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.gold}25` }}
          >
            <Lightbulb size={20} style={{ color: BRAND.gold }} />
          </div>
          <div className="text-left">
            <h3 className="font-bold" style={{ color: BRAND.navy }}>How to Use the Narrative Arc</h3>
            <p className="text-xs text-slate-500">A guide to mapping your protagonist's journey</p>
          </div>
        </div>
        <div 
          className="p-2 rounded-lg"
          style={{ background: `${BRAND.navy}10` }}
        >
          {isOpen ? (
            <ChevronUp size={20} style={{ color: BRAND.navy }} />
          ) : (
            <ChevronDown size={20} style={{ color: BRAND.navy }} />
          )}
        </div>
      </button>

      {/* Content - Collapsible */}
      {isOpen && (
        <div className="px-6 pb-6">
          {/* Key Concept */}
          <div 
            className="rounded-xl p-4 mb-6"
            style={{ background: `${BRAND.navy}08`, border: `1px solid ${BRAND.navy}15` }}
          >
            <div className="flex items-start gap-3">
              <HelpCircle size={20} style={{ color: BRAND.navy }} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold" style={{ color: BRAND.navy }}>The Core Idea</p>
                <p className="text-sm text-slate-600 mt-1">
                  Every story is about <strong>transformation</strong>. Your protagonist starts the story believing one thing, 
                  and through the events of the plot, they're forced to grow, change, and become someone new. 
                  The other characters in your story exist to <strong>catalyze that transformation</strong> — 
                  each one should push your protagonist closer to (or further from) their ultimate growth.
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div 
                key={step.number}
                className="rounded-xl p-4 bg-white"
                style={{ border: `1px solid ${BRAND.mauve}30` }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${BRAND.gold}20` }}
                  >
                    <span className="text-sm font-bold" style={{ color: BRAND.gold }}>{step.number}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <step.icon size={14} style={{ color: BRAND.navy }} />
                      <span className="text-sm font-bold" style={{ color: BRAND.navy }}>{step.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Example */}
          <div 
            className="rounded-xl p-4 mt-6"
            style={{ background: `linear-gradient(135deg, ${BRAND.rose}15 0%, ${BRAND.mauve}15 100%)`, border: `1px solid ${BRAND.rose}30` }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.navy }}>
              Example: Midpoint Beat
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <p className="font-semibold text-slate-600 mb-1">Scene:</p>
                <p className="text-slate-500">"Elena discovers Marcus has been lying about his past. The truth shatters her trust."</p>
              </div>
              <div>
                <p className="font-semibold text-slate-600 mb-1">Marcus's Purpose:</p>
                <p className="text-slate-500">"His betrayal forces Elena to question everything she thought she knew about love."</p>
              </div>
              <div>
                <p className="font-semibold text-slate-600 mb-1">Elena's Growth:</p>
                <p className="text-slate-500"><strong>Before:</strong> "Trust is given freely." <strong>After:</strong> "Trust must be earned."</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   Main Component
   ============================================ */
export default function NarrativeArc() {
  // ===== Project ID tracking =====
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [storyLabData, setStoryLabData] = useState(() => loadStoryLabData());
  const [activeNode, setActiveNode] = useState(null);
  const [storyBeats, setStoryBeats] = useState(() => loadBeats());
  const [characters, setCharacters] = useState(() => loadCharacters());
  const [dragIndex, setDragIndex] = useState(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  const bookTitle = storyLabData?.book?.title || "Untitled Story";
  const chapters = storyLabData?.chapters || [];
  
  const storyCharacters = useMemo(() => extractCharactersFromChapters(chapters), [chapters]);
  
  // Character appearances in chapters
  const characterAppearances = useMemo(() => extractCharacterAppearances(chapters), [chapters]);
  
  // Get highlighted beat IDs when a character is selected (uses manual assignments)
  const highlightedBeatIds = useMemo(() => {
    if (!selectedCharacterId) return new Set();
    
    // Find beats where this character has been manually assigned
    const beatIds = storyBeats
      .filter(beat => {
        const assigned = beat.assignedCharacters || [];
        return assigned.some(ac => ac.characterId === selectedCharacterId);
      })
      .map(beat => beat.id);
    
    return new Set(beatIds);
  }, [selectedCharacterId, storyBeats]);
  
  // Get beats a character is assigned to (for character card display)
  const getCharacterBeats = useCallback((characterId) => {
    return storyBeats.filter(beat => {
      const assigned = beat.assignedCharacters || [];
      return assigned.some(ac => ac.characterId === characterId);
    });
  }, [storyBeats]);

  // ===== Project switching with correct event names =====
  useEffect(() => {
    const reloadAllData = () => {
      const pid = getSelectedProjectId();
      console.log(`[NarrativeArc] Reloading data for project: ${pid}`);
      setStoryLabData(loadStoryLabData());
      setStoryBeats(loadBeats());
      setCharacters(loadCharacters());
      setActiveNode(null);
      setSelectedCharacterId(null);
    };

    const handleProjectChange = () => {
      const newProjectId = getSelectedProjectId();
      if (newProjectId !== currentProjectId) {
        console.log(`[NarrativeArc] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };

    const handleDataChange = () => {
      // Reload story lab data (chapters) when other modules update
      setStoryLabData(loadStoryLabData());
    };
    
    // Listen for project changes and data updates
    window.addEventListener("project:change", handleProjectChange);
    window.addEventListener("storage", handleProjectChange);
    
    return () => {
      window.removeEventListener("project:change", handleProjectChange);
      window.removeEventListener("storage", handleProjectChange);
    };
  }, [currentProjectId]);

  // Save beats when they change
  useEffect(() => { 
    saveBeats(storyBeats); 
  }, [storyBeats]);
  
  // Save characters when they change
  useEffect(() => { 
    saveCharacters(characters); 
  }, [characters]);

  // Import characters
  const importCharactersFromStory = useCallback(() => {
    const existingNames = characters.map(c => c.name.toLowerCase());
    const newChars = storyCharacters
      .filter(name => !existingNames.includes(name.toLowerCase()))
      .map((name, idx) => {
        const color = getCharacterColorByIndex(characters.length + idx);
        return { id: uid(), name, initials: getInitials(name), role: "Character", notes: "", bg: color.bg, textColor: color.text };
      });
    if (newChars.length > 0) setCharacters(prev => [...prev, ...newChars]);
    return newChars.length;
  }, [characters, storyCharacters]);

  // Export/Import
  const fileInputRef = useRef(null);
  
  const exportJSON = () => {
    const data = { beats: storyBeats, characters, bookTitle, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${bookTitle.replace(/\s+/g, '-').toLowerCase()}-story-arc.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImportClick = () => fileInputRef.current?.click();
  
  const handleImportChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const parsed = JSON.parse(await f.text());
      if (parsed.beats) setStoryBeats(reviveBeats(parsed.beats));
      if (parsed.characters) setCharacters(parsed.characters);
    } catch {}
    e.target.value = "";
  };

  // Beat CRUD
  const addBeat = () => {
    const newBeat = { id: uid(), title: "New Beat", iconKey: "Star", position: { x: 50, y: 50 }, content: "", color: "primary", size: "medium", phase: "rising" };
    setStoryBeats(prev => [...prev, newBeat]);
    setActiveNode(newBeat.id);
  };

  const updateBeat = (id, updates) => {
    setStoryBeats(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBeat = (id) => {
    setStoryBeats(prev => prev.filter(b => b.id !== id));
    if (activeNode === id) setActiveNode(null);
  };

  const debouncedUpdate = useDebouncedCallback(({ id, content }) => updateBeat(id, { content }), 250);

  const nudgeBeat = (id, dx, dy, fast = false) => {
    const step = fast ? 5 : 1;
    setStoryBeats(prev => prev.map(b => b.id === id ? { ...b, position: { x: snap(b.position.x + dx * step, 5, 5, 95), y: snap(b.position.y + dy * step, 5, 10, 85) } } : b));
  };

  // Character CRUD
  const addCharacter = () => {
    const color = getCharacterColorByIndex(characters.length);
    setCharacters(prev => [...prev, { id: uid(), name: "New Character", initials: "NC", role: "Character", notes: "", bg: color.bg, textColor: color.text }]);
  };

  const updateCharacter = (id, updates) => setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCharacter = (id) => setCharacters(prev => prev.filter(c => c.id !== id));

  // Character drag
  const handleCharDragStart = (index) => setDragIndex(index);
  const handleCharDragOver = () => {};
  const handleCharDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) { setDragIndex(null); return; }
    setCharacters(prev => {
      const copy = [...prev];
      const [moved] = copy.splice(dragIndex, 1);
      copy.splice(dropIndex, 0, moved);
      return copy;
    });
    setDragIndex(null);
  };

  // UI helpers
  const getNodeSize = (size) => ({ small: "w-16 h-16", medium: "w-20 h-20", large: "w-24 h-24", xlarge: "w-28 h-28" }[size] || "w-20 h-20");
  const getColorClasses = (color) => { const c = COLOR_CLASSES[color] || COLOR_CLASSES.primary; return `${c.bg} ${c.border} ${c.text}`; };

  const pathD = useMemo(() => {
    if (storyBeats.length < 2) return "";
    const pts = storyBeats.map(b => b.position);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const midX = (pts[i - 1].x + pts[i].x) / 2;
      d += ` Q ${midX} ${pts[i - 1].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }, [storyBeats]);

  const unimportedCount = storyCharacters.filter(name => !characters.some(c => c.name.toLowerCase() === name.toLowerCase())).length;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/story-lab" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">
              <ArrowLeft size={16} /> Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Narrative Arc</span>
          </div>
          <Link to="/story-lab/workshop" className="rounded-xl px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
            Workshop Hub
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)` }}>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: 'blur(100px)' }} />
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <BookOpen size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{bookTitle}</h1>
                <p className="text-white/70">{storyBeats.length} beats · {characters.length} characters</p>
                <p className="text-white/50 text-xs mt-1">Project: {currentProjectId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={addBeat} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/20 hover:bg-white/30">
                <Plus size={16} /> Add Beat
              </button>
              <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/20 hover:bg-white/30">
                <Download size={16} /> Export
              </button>
              <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/20 hover:bg-white/30">
                <Upload size={16} /> Import
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportChange} />
            </div>
          </div>
        </div>

        {/* HOW TO USE THIS TOOL - Instructions */}
        <InstructionsPanel />

        {/* Canvas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>Story Arc Canvas</h2>
            <p className="text-xs text-slate-500">Drag beats to arrange · Click to edit</p>
          </div>

          <div
            className="relative h-80 rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}05 0%, ${BRAND.mauve}10 100%)` }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("beatId");
              const rect = e.currentTarget.getBoundingClientRect();
              const x = snap(((e.clientX - rect.left) / rect.width) * 100, 5, 5, 95);
              const y = snap(((e.clientY - rect.top) / rect.height) * 100, 5, 10, 85);
              updateBeat(id, { position: { x, y } });
            }}
          >
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: BRAND.navy, stopOpacity: 0.3 }} />
                  <stop offset="50%" style={{ stopColor: BRAND.gold, stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: BRAND.ink, stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>
              <path d={pathD} fill="none" stroke="url(#arcGradient)" strokeWidth={0.5} strokeDasharray="2,1" vectorEffect="non-scaling-stroke" />
            </svg>

            {storyBeats.map((beat, index) => {
              const Icon = ICONS[beat.iconKey] || Heart;
              const isActive = activeNode === beat.id;
              const isHighlighted = highlightedBeatIds.has(beat.id);
              return (
                <div
                  key={beat.id}
                  className="absolute cursor-move group"
                  style={{ left: `${beat.position.x}%`, top: `${beat.position.y}%`, transform: "translate(-50%, -50%)", zIndex: isActive ? 20 : (isHighlighted ? 15 : 10) }}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("beatId", beat.id); e.currentTarget.style.opacity = "0.5"; }}
                  onDragEnd={(e) => { e.currentTarget.style.opacity = "1"; }}
                  onClick={() => setActiveNode(beat.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "ArrowLeft") nudgeBeat(beat.id, -1, 0, ev.shiftKey);
                    if (ev.key === "ArrowRight") nudgeBeat(beat.id, 1, 0, ev.shiftKey);
                    if (ev.key === "ArrowUp") nudgeBeat(beat.id, 0, -1, ev.shiftKey);
                    if (ev.key === "ArrowDown") nudgeBeat(beat.id, 0, 1, ev.shiftKey);
                  }}
                  tabIndex={0}
                >
                  {/* Highlight glow when character is selected */}
                  {isHighlighted && (
                    <div 
                      className="absolute inset-0 rounded-2xl animate-pulse"
                      style={{ 
                        background: `radial-gradient(circle, ${BRAND.gold}60 0%, transparent 70%)`,
                        transform: 'scale(1.8)',
                        zIndex: -1,
                      }}
                    />
                  )}
                  <div 
                    className={`${getNodeSize(beat.size)} ${getColorClasses(beat.color)} rounded-2xl flex flex-col items-center justify-center shadow-lg border-4 transition-all group-hover:scale-110 ${isActive ? "scale-110 ring-4 ring-offset-2" : ""} ${isHighlighted ? "scale-115 ring-4 ring-offset-2" : ""}`} 
                    style={{ 
                      ringColor: isHighlighted ? BRAND.gold : BRAND.gold,
                      borderColor: isHighlighted ? BRAND.gold : "rgba(255,255,255,0.5)",
                      boxShadow: isHighlighted ? `0 0 20px ${BRAND.gold}80, 0 4px 15px rgba(0,0,0,0.2)` : undefined,
                    }}
                  >
                    <Icon size={isActive ? 24 : 18} />
                    <span className="text-[8px] font-bold mt-1 text-center px-1">{beat.title.split(" ")[0]}</span>
                  </div>
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg bg-white" style={{ color: BRAND.navy }}>{beat.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline - Centered */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <h3 className="text-center text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">Story Timeline</h3>
          <div className="flex items-center justify-center gap-3 overflow-x-auto pb-2 flex-wrap">
            {storyBeats.map((beat, index) => {
              const Icon = ICONS[beat.iconKey] || Heart;
              const isActive = activeNode === beat.id;
              const isHighlighted = highlightedBeatIds.has(beat.id);
              return (
                <React.Fragment key={beat.id}>
                  <button 
                    onClick={() => setActiveNode(beat.id)} 
                    className={`flex-shrink-0 ${getColorClasses(beat.color)} px-4 py-3 rounded-xl transition-all hover:scale-105 shadow-md ${isActive ? "ring-2 ring-offset-2 scale-105 shadow-lg" : ""} ${isHighlighted ? "ring-4 ring-offset-2 scale-110" : ""}`} 
                    style={{ 
                      ringColor: BRAND.gold, 
                      minWidth: 110,
                      boxShadow: isHighlighted ? `0 0 15px ${BRAND.gold}80` : undefined,
                    }}
                  >
                    {isHighlighted && (
                      <div className="flex items-center justify-center mb-1">
                        <Sparkles size={12} style={{ color: BRAND.gold }} />
                      </div>
                    )}
                    <Icon size={20} className="mx-auto mb-1.5" />
                    <div className="text-xs font-bold text-center truncate">{beat.title}</div>
                  </button>
                  {index < storyBeats.length - 1 && <div className="w-8 h-1 flex-shrink-0 rounded-full" style={{ background: `linear-gradient(90deg, ${BRAND.mauve}, ${BRAND.gold})` }} />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* BEAT EDITOR - Story Craft Focus */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          {activeNode ? (() => {
            const beat = storyBeats.find(b => b.id === activeNode);
            if (!beat) return null;
            const Icon = ICONS[beat.iconKey] || Heart;
            const assignedChars = beat.assignedCharacters || [];
            
            // Get characters not yet assigned to this beat
            const availableChars = characters.filter(c => 
              !assignedChars.some(ac => ac.characterId === c.id)
            );
            
            return (
              <div className="space-y-6">
                {/* Beat Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${getColorClasses(beat.color)} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <input 
                        value={beat.title} 
                        onChange={(e) => updateBeat(beat.id, { title: e.target.value })} 
                        className="text-xl font-bold bg-transparent border-none outline-none" 
                        style={{ color: BRAND.navy }} 
                      />
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${BRAND.mauve}30`, color: BRAND.navy }}>
                          {beat.phase || "rising"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Beat {storyBeats.findIndex(b => b.id === beat.id) + 1} of {storyBeats.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={beat.color} onChange={(e) => updateBeat(beat.id, { color: e.target.value })} className="text-xs rounded-lg px-2 py-1.5 bg-slate-50 border border-slate-200">
                      {COLOR_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                    </select>
                    <button onClick={() => deleteBeat(beat.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* What Happens - Scene Description */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold mb-2 block" style={{ color: BRAND.navy }}>
                    What Happens in This Scene
                  </label>
                  <textarea 
                    defaultValue={beat.content} 
                    onChange={(e) => debouncedUpdate({ id: beat.id, content: e.target.value })} 
                    className="w-full h-24 p-4 rounded-xl text-sm bg-slate-50 border border-slate-200 outline-none resize-none" 
                    placeholder="Describe what happens at this beat..." 
                  />
                </div>

                {/* Horizontal Divider */}
                <div className="border-t-2 border-dashed" style={{ borderColor: `${BRAND.gold}40` }} />

                {/* CHARACTERS IN THIS SCENE */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs uppercase tracking-wider font-bold" style={{ color: BRAND.navy }}>
                      Characters in This Scene
                    </label>
                    {availableChars.length > 0 && (
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            const newAssigned = [...assignedChars, { characterId: e.target.value, purpose: "" }];
                            updateBeat(beat.id, { assignedCharacters: newAssigned });
                          }
                        }}
                        className="text-xs rounded-lg px-3 py-1.5 border border-slate-200"
                        style={{ background: `${BRAND.gold}10` }}
                      >
                        <option value="">+ Add Character</option>
                        {availableChars.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {assignedChars.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                      <Users size={32} className="mx-auto mb-2" style={{ color: BRAND.mauve }} />
                      <p className="text-sm text-slate-500">No characters assigned to this beat yet</p>
                      <p className="text-xs text-slate-400 mt-1">Add characters to define their purpose in this scene</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedChars.map((ac, idx) => {
                        const char = characters.find(c => c.id === ac.characterId);
                        if (!char) return null;
                        const roleColor = ROLE_COLORS[char.role] || ROLE_COLORS["Character"];
                        
                        return (
                          <div 
                            key={ac.characterId} 
                            className="rounded-xl p-4 border-2"
                            style={{ 
                              background: `linear-gradient(135deg, ${roleColor.bg}08 0%, ${roleColor.bg}15 100%)`,
                              borderColor: `${roleColor.bg}30`,
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: roleColor.bg, color: roleColor.text }}
                              >
                                {char.initials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <span className="font-bold text-sm" style={{ color: BRAND.navy }}>{char.name}</span>
                                    <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{ background: `${roleColor.bg}20`, color: roleColor.bg }}>
                                      {char.role}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const newAssigned = assignedChars.filter(a => a.characterId !== ac.characterId);
                                      updateBeat(beat.id, { assignedCharacters: newAssigned });
                                    }}
                                    className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                                    Purpose in this scene
                                  </label>
                                  <input
                                    value={ac.purpose}
                                    onChange={(e) => {
                                      const newAssigned = assignedChars.map(a => 
                                        a.characterId === ac.characterId 
                                          ? { ...a, purpose: e.target.value }
                                          : a
                                      );
                                      updateBeat(beat.id, { assignedCharacters: newAssigned });
                                    }}
                                    placeholder="What is their role here? How do they impact the protagonist?"
                                    className="w-full mt-1 text-sm rounded-lg px-3 py-2 bg-white border border-slate-200 outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Horizontal Divider */}
                <div className="border-t-2 border-dashed" style={{ borderColor: `${BRAND.gold}40` }} />

                {/* PROTAGONIST'S GROWTH */}
                <div>
                  <label className="text-xs uppercase tracking-wider font-bold mb-4 block flex items-center gap-2" style={{ color: BRAND.navy }}>
                    <Heart size={14} style={{ color: BRAND.rose }} />
                    Protagonist's Internal Journey
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Before */}
                    <div 
                      className="rounded-xl p-4"
                      style={{ background: `linear-gradient(135deg, ${BRAND.navy}08 0%, ${BRAND.navy}15 100%)`, border: `2px solid ${BRAND.navy}20` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: BRAND.navy, color: "#fff" }}>
                          B
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.navy }}>Before This Beat</span>
                      </div>
                      <textarea
                        value={beat.protagonistBefore || ""}
                        onChange={(e) => updateBeat(beat.id, { protagonistBefore: e.target.value })}
                        placeholder="What does the protagonist believe? What are they unaware of? What's their emotional state?"
                        className="w-full h-24 text-sm rounded-lg px-3 py-2 bg-white border border-slate-200 outline-none resize-none"
                      />
                    </div>

                    {/* After */}
                    <div 
                      className="rounded-xl p-4"
                      style={{ background: `linear-gradient(135deg, ${BRAND.gold}08 0%, ${BRAND.gold}15 100%)`, border: `2px solid ${BRAND.gold}30` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: BRAND.gold, color: BRAND.ink }}>
                          A
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND.gold }}>After This Beat</span>
                      </div>
                      <textarea
                        value={beat.protagonistAfter || ""}
                        onChange={(e) => updateBeat(beat.id, { protagonistAfter: e.target.value })}
                        placeholder="How have they changed? What new awareness do they have? What shift occurred?"
                        className="w-full h-24 text-sm rounded-lg px-3 py-2 bg-white border border-slate-200 outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Growth Arrow */}
                  <div className="flex items-center justify-center mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: `${BRAND.mauve}20` }}>
                      <span className="text-xs font-medium" style={{ color: BRAND.navy }}>Growth</span>
                      <ArrowRight size={14} style={{ color: BRAND.gold }} />
                      <span className="text-xs font-medium" style={{ color: BRAND.gold }}>Transformation</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-16">
              <div 
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: `linear-gradient(135deg, ${BRAND.mauve}30 0%, ${BRAND.rose}30 100%)` }}
              >
                <BookOpen size={40} style={{ color: BRAND.navy }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: BRAND.navy }}>Select a Story Beat</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Click on a beat in the arc above or timeline to define which characters appear and how they impact your protagonist's journey.
              </p>
            </div>
          )}
        </div>

        {/* CHARACTER CAST - Trello Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>Character Cast</h2>
              <p className="text-sm text-slate-500">Click a character to see where they appear in the arc</p>
            </div>
            <div className="flex items-center gap-2">
              {selectedCharacterId && (
                <button 
                  onClick={() => setSelectedCharacterId(null)} 
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-all bg-slate-100 text-slate-600"
                >
                  <X size={14} /> Clear Selection
                </button>
              )}
              {unimportedCount > 0 && (
                <button onClick={() => { const c = importCharactersFromStory(); if (c > 0) alert(`Imported ${c} character(s)!`); }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:scale-105 transition-all" style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}>
                  <RefreshCw size={14} /> Import {unimportedCount}
                </button>
              )}
              <button onClick={addCharacter} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:scale-105 transition-all" style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}>
                <Plus size={16} /> Add Character
              </button>
            </div>
          </div>

          {characters.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
              <Users size={48} className="mx-auto mb-4" style={{ color: BRAND.mauve }} />
              <p className="text-slate-500 font-medium mb-2">No characters yet</p>
              {storyCharacters.length > 0 ? (
                <button onClick={importCharactersFromStory} className="text-sm font-medium" style={{ color: BRAND.gold }}>Import {storyCharacters.length} from manuscript →</button>
              ) : (
                <button onClick={addCharacter} className="text-sm font-medium" style={{ color: BRAND.gold }}>Add your first character →</button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {characters.map((char, idx) => {
                const assignedBeats = getCharacterBeats(char.id);
                return (
                  <CharacterCard 
                    key={char.id} 
                    char={char} 
                    index={idx} 
                    onUpdate={updateCharacter} 
                    onDelete={deleteCharacter} 
                    onDragStart={handleCharDragStart} 
                    onDragOver={handleCharDragOver} 
                    onDrop={handleCharDrop} 
                    isDragging={dragIndex === idx}
                    isSelected={selectedCharacterId === char.id}
                    onSelect={(id) => setSelectedCharacterId(selectedCharacterId === id ? null : id)}
                    assignedBeats={assignedBeats}
                  />
                );
              })}
            </div>
          )}

          {storyCharacters.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">{storyCharacters.length} character{storyCharacters.length !== 1 ? 's' : ''} found via @char: tags</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
