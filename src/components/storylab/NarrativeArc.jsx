// src/components/storylab/NarrativeArc.jsx
// UPDATED: Characters displayed as Trello-style cards at bottom (not sidebar)

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, Users, Plane, Sparkles, BookOpen, MapPin, 
  ArrowLeft, Plus, Trash2, Save, Upload, Download,
  User, Star, Shield, Zap, Target, Clock, AlertCircle,
  RefreshCw, ChevronDown, Check, X, GripVertical, Edit3
} from "lucide-react";

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
   PROJECT-AWARE STORAGE
   ============================================ */
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const ARC_BEATS_KEY_BASE = "dt_arc_beats_v2";
const ARC_CHARS_KEY_BASE = "dt_arc_chars_v2";

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

const loadLocal = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveLocal = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

function loadStoryLabData() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = localStorage.getItem(key);
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
  firstAppearance,
  appearanceCount,
  totalChapters
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

      {/* Arc Appearance Banner */}
      {firstAppearance && (
        <div 
          className="px-4 py-2 flex items-center justify-between"
          style={{ background: `${BRAND.gold}20`, borderBottom: `2px solid ${BRAND.gold}30` }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: BRAND.gold }} />
            <span className="text-xs font-bold" style={{ color: BRAND.gold }}>
              Enters at {firstAppearance.beat?.title || firstAppearance.beat?.phase}
            </span>
          </div>
          {appearanceCount > 0 && totalChapters > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white" style={{ color: BRAND.navy }}>
              {appearanceCount}/{totalChapters} chapters
            </span>
          )}
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
   Main Component
   ============================================ */
export default function NarrativeArc() {
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
  
  // Get highlighted beat IDs when a character is selected
  const highlightedBeatIds = useMemo(() => {
    if (!selectedCharacterId) return new Set();
    const selectedChar = characters.find(c => c.id === selectedCharacterId);
    if (!selectedChar) return new Set();
    
    const { beatIds } = getCharacterPhases(selectedChar.name, chapters, storyBeats);
    return new Set(beatIds);
  }, [selectedCharacterId, characters, chapters, storyBeats]);

  // Project switching
  useEffect(() => {
    const handleSwitch = () => {
      const newId = getSelectedProjectId();
      if (newId !== currentProjectId) {
        setCurrentProjectId(newId);
        setStoryLabData(loadStoryLabData());
        setStoryBeats(loadBeats());
        setCharacters(loadCharacters());
        setActiveNode(null);
      }
    };
    
    window.addEventListener("project:switch", handleSwitch);
    window.addEventListener("storage", handleSwitch);
    return () => {
      window.removeEventListener("project:switch", handleSwitch);
      window.removeEventListener("storage", handleSwitch);
    };
  }, [currentProjectId]);

  useEffect(() => { saveBeats(storyBeats); }, [storyBeats]);
  useEffect(() => { saveCharacters(characters); }, [characters]);

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
                <h1 className="text-3xl font-bold">{bookTitle}</h1>
                <p className="text-white/70">{storyBeats.length} beats · {characters.length} characters</p>
                <p className="text-white/40 text-xs mt-1">Project: {currentProjectId}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={addBeat} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30">
                <Plus size={16} /> Add Beat
              </button>
              <button onClick={exportJSON} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30">
                <Download size={16} /> Export
              </button>
              <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30">
                <Upload size={16} /> Import
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportChange} />
            </div>
          </div>
        </div>

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

        {/* Beat Editor */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          {activeNode ? (() => {
            const beat = storyBeats.find(b => b.id === activeNode);
            if (!beat) return null;
            const Icon = ICONS[beat.iconKey] || Heart;
            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${getColorClasses(beat.color)} rounded-xl flex items-center justify-center`}><Icon size={24} /></div>
                    <div>
                      <input value={beat.title} onChange={(e) => updateBeat(beat.id, { title: e.target.value })} className="text-lg font-bold bg-transparent border-none outline-none" style={{ color: BRAND.navy }} />
                      <div className="text-xs text-slate-500">Beat {storyBeats.findIndex(b => b.id === beat.id) + 1} of {storyBeats.length}</div>
                    </div>
                  </div>
                  <button onClick={() => deleteBeat(beat.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <select value={beat.iconKey} onChange={(e) => updateBeat(beat.id, { iconKey: e.target.value })} className="text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">
                    {ICON_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                  </select>
                  <select value={beat.color} onChange={(e) => updateBeat(beat.id, { color: e.target.value })} className="text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">
                    {COLOR_OPTIONS.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                  </select>
                  <select value={beat.size} onChange={(e) => updateBeat(beat.id, { size: e.target.value })} className="text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">
                    <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="xlarge">X-Large</option>
                  </select>
                  <select value={beat.phase || "rising"} onChange={(e) => updateBeat(beat.id, { phase: e.target.value })} className="text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200">
                    <option value="beginning">Beginning</option><option value="rising">Rising Action</option><option value="midpoint">Midpoint</option><option value="falling">Falling Action</option><option value="climax">Climax</option><option value="resolution">Resolution</option>
                  </select>
                </div>
                <textarea defaultValue={beat.content} onChange={(e) => debouncedUpdate({ id: beat.id, content: e.target.value })} className="w-full h-40 p-4 rounded-xl text-sm bg-slate-50 border border-slate-200 outline-none resize-none" placeholder="Describe this story beat..." />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{countWords(beat.content)} words</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-1.5 rounded-full overflow-hidden bg-slate-200">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (countWords(beat.content) / 250) * 100)}%`, background: BRAND.gold }} />
                    </div>
                    <span>{Math.min(100, Math.round((countWords(beat.content) / 250) * 100))}%</span>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="text-center py-12">
              <BookOpen size={48} className="mx-auto mb-4" style={{ color: BRAND.mauve }} />
              <p className="text-slate-500">Click on a story beat to edit</p>
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
                const firstAppearance = getFirstAppearancePhase(char.name, chapters, storyBeats);
                const appearances = characterAppearances[char.name] || [];
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
                    firstAppearance={firstAppearance}
                    appearanceCount={appearances.length}
                    totalChapters={chapters.length}
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

