// src/components/storylab/NarrativeArc.jsx
// UPDATED: Project-aware storage + manuscript integration for multi-project support

import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, Users, Plane, Sparkles, BookOpen, MapPin, 
  ArrowLeft, Plus, Trash2, Save, Upload, Download,
  User, Star, Shield, Zap, Target, Clock, AlertCircle,
  RefreshCw, ChevronDown, Check, X
} from "lucide-react";

/* ============================================
   Brand Colors
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  ink: "#0F172A",
  navyLight: "#2d4a6f",
};

/* ============================================
   Icon registry (string key -> component)
   ============================================ */
const ICONS = { 
  Heart, Users, Plane, Sparkles, BookOpen, MapPin,
  Star, Shield, Zap, Target, Clock, AlertCircle, User
};

const ICON_OPTIONS = [
  { key: "Heart", label: "Heart", icon: Heart },
  { key: "Star", label: "Star", icon: Star },
  { key: "Target", label: "Target", icon: Target },
  { key: "Users", label: "Users", icon: Users },
  { key: "Shield", label: "Shield", icon: Shield },
  { key: "Zap", label: "Lightning", icon: Zap },
  { key: "Sparkles", label: "Sparkles", icon: Sparkles },
  { key: "BookOpen", label: "Book", icon: BookOpen },
  { key: "Plane", label: "Plane", icon: Plane },
  { key: "MapPin", label: "Location", icon: MapPin },
  { key: "Clock", label: "Clock", icon: Clock },
  { key: "AlertCircle", label: "Alert", icon: AlertCircle },
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
  { key: "primary", label: "Navy", sample: BRAND.navy },
  { key: "gold", label: "Gold", sample: BRAND.gold },
  { key: "accent", label: "Rose", sample: BRAND.rose },
  { key: "muted", label: "Mauve", sample: BRAND.mauve },
  { key: "ink", label: "Ink", sample: BRAND.ink },
];

/* ============================================
   PROJECT-AWARE STORAGE UTILITIES
   ============================================ */

const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const ARC_BEATS_KEY_BASE = "dt_arc_beats_v2";
const ARC_CHARS_KEY_BASE = "dt_arc_chars_v2";

/**
 * Get the currently selected project ID from localStorage
 */
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

/**
 * Get project-specific storage key
 */
function getProjectKey(baseKey) {
  const projectId = getSelectedProjectId();
  if (projectId === 'default') {
    return baseKey;
  }
  return `${baseKey}-${projectId}`;
}

/* ============================================
   Storage Helpers
   ============================================ */
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

/* ============================================
   Load StoryLab Data (chapters, book info)
   ============================================ */
function loadStoryLabData() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[NarrativeArc] Failed to load StoryLab data:", err);
  }
  return null;
}

/**
 * Extract characters from chapter content (@char: tags)
 */
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
 * Generate initials from a name
 */
function getInitials(name) {
  return name
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a color class based on index
 */
function getCharacterColor(index) {
  const colors = ["bg-[#1e3a5f]", "bg-[#d4af37] text-[#0F172A]", "bg-[#b8a9c9]", "bg-[#e8b4b8] text-[#0F172A]", "bg-[#0F172A]"];
  return colors[index % colors.length];
}

/* ============================================
   Small Helpers
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

/* Migrate beats to use iconKey (never store functions) */
function reviveBeats(beats) {
  return (beats || []).map((b) => {
    const iconKey = b.iconKey || b.icon?.name || "Heart";
    const { icon, ...rest } = b;
    return { ...rest, iconKey, id: b.id || uid() };
  });
}

/* ============================================
   Default Story Beats (empty for new projects)
   ============================================ */
const DEFAULT_BEATS = [
  { id: uid(), title: "Opening Hook", iconKey: "Star", position: { x: 10, y: 70 }, content: "The inciting incident that draws readers in. What disrupts the protagonist's ordinary world?", color: "primary", size: "large", phase: "beginning" },
  { id: uid(), title: "Rising Action", iconKey: "Target", position: { x: 30, y: 50 }, content: "The protagonist pursues their goal. What obstacles emerge? How do stakes escalate?", color: "gold", size: "medium", phase: "rising" },
  { id: uid(), title: "Midpoint", iconKey: "Zap", position: { x: 50, y: 25 }, content: "A major revelation or turning point. Everything changes here.", color: "accent", size: "xlarge", phase: "midpoint" },
  { id: uid(), title: "Crisis", iconKey: "AlertCircle", position: { x: 70, y: 50 }, content: "The darkest moment. All seems lost. What forces the protagonist to their limit?", color: "muted", size: "medium", phase: "falling" },
  { id: uid(), title: "Climax", iconKey: "Shield", position: { x: 85, y: 30 }, content: "The final confrontation. How does the protagonist face their greatest challenge?", color: "ink", size: "large", phase: "climax" },
  { id: uid(), title: "Resolution", iconKey: "Heart", position: { x: 95, y: 70 }, content: "The new normal. How has the protagonist been transformed?", color: "primary", size: "medium", phase: "resolution" },
];

/* ============================================
   Load Functions (Project-Aware)
   ============================================ */
function loadBeats() {
  const key = getProjectKey(ARC_BEATS_KEY_BASE);
  const saved = loadLocal(key, null);
  if (saved && saved.length > 0) {
    return reviveBeats(saved);
  }
  // Return default beats for new projects
  return DEFAULT_BEATS.map(b => ({ ...b, id: uid() }));
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
   Component
   ============================================ */
export default function NarrativeArc() {
  // Project tracking
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  
  // Story data
  const [storyLabData, setStoryLabData] = useState(() => loadStoryLabData());
  const [activeNode, setActiveNode] = useState(null);
  const [storyBeats, setStoryBeats] = useState(() => loadBeats());
  const [characters, setCharacters] = useState(() => loadCharacters());
  const [dragIndex, setDragIndex] = useState(null);
  const [editingBeat, setEditingBeat] = useState(null);

  // Derived data
  const bookTitle = storyLabData?.book?.title || "Untitled Story";
  const chapters = storyLabData?.chapters || [];
  
  // Characters discovered from manuscript
  const storyCharacters = useMemo(() => {
    return extractCharactersFromChapters(chapters);
  }, [chapters]);

  // ============================================
  // Project switching detection
  // ============================================
  useEffect(() => {
    const handleProjectSwitch = () => {
      const newProjectId = getSelectedProjectId();
      
      if (newProjectId !== currentProjectId) {
        console.log(`[NarrativeArc] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        
        // Reload ALL data from new project
        setStoryLabData(loadStoryLabData());
        setStoryBeats(loadBeats());
        setCharacters(loadCharacters());
        setActiveNode(null);
        setEditingBeat(null);
      }
    };
    
    const handleDataChange = () => {
      setStoryLabData(loadStoryLabData());
    };
    
    window.addEventListener("project:switch", handleProjectSwitch);
    window.addEventListener("project:change", handleDataChange);
    window.addEventListener("storage", handleProjectSwitch);
    
    return () => {
      window.removeEventListener("project:switch", handleProjectSwitch);
      window.removeEventListener("project:change", handleDataChange);
      window.removeEventListener("storage", handleProjectSwitch);
    };
  }, [currentProjectId]);

  // Persist to localStorage when data changes
  useEffect(() => { saveBeats(storyBeats); }, [storyBeats]);
  useEffect(() => { saveCharacters(characters); }, [characters]);

  // ============================================
  // Import characters from manuscript
  // ============================================
  const importCharactersFromStory = useCallback(() => {
    const existingNames = characters.map(c => c.name.toLowerCase());
    const newChars = storyCharacters
      .filter(name => !existingNames.includes(name.toLowerCase()))
      .map((name, idx) => ({
        id: uid(),
        name,
        initials: getInitials(name),
        role: "Character",
        bg: getCharacterColor(characters.length + idx),
      }));
    
    if (newChars.length > 0) {
      setCharacters(prev => [...prev, ...newChars]);
    }
    
    return newChars.length;
  }, [characters, storyCharacters]);

  // ============================================
  // Export / Import JSON
  // ============================================
  const fileInputRef = useRef(null);
  
  const exportJSON = () => {
    const data = { 
      beats: storyBeats, 
      characters,
      bookTitle,
      exportedAt: new Date().toISOString(),
    };
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
    const text = await f.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.beats) setStoryBeats(reviveBeats(parsed.beats));
      if (parsed.characters) setCharacters(parsed.characters);
    } catch (err) {
      console.error("Import failed:", err);
    }
    e.target.value = "";
  };

  // ============================================
  // Beat CRUD operations
  // ============================================
  const addBeat = () => {
    const newBeat = {
      id: uid(),
      title: "New Beat",
      iconKey: "Star",
      position: { x: 50, y: 50 },
      content: "Describe this story beat...",
      color: "primary",
      size: "medium",
      phase: "rising",
    };
    setStoryBeats(prev => [...prev, newBeat]);
    setActiveNode(newBeat.id);
    setEditingBeat(newBeat.id);
  };

  const updateBeat = (id, updates) => {
    setStoryBeats(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBeat = (id) => {
    setStoryBeats(prev => prev.filter(b => b.id !== id));
    if (activeNode === id) setActiveNode(null);
    if (editingBeat === id) setEditingBeat(null);
  };

  // Debounced content update
  const debouncedUpdate = useDebouncedCallback(({ id, content }) => {
    updateBeat(id, { content });
  }, 250);

  // Keyboard nudging
  const nudgeBeat = (id, dx, dy, fast = false) => {
    const step = fast ? 5 : 1;
    setStoryBeats(prev =>
      prev.map(b =>
        b.id === id
          ? {
              ...b,
              position: {
                x: snap(b.position.x + dx * step, 5, 5, 95),
                y: snap(b.position.y + dy * step, 5, 10, 85),
              },
            }
          : b
      )
    );
  };

  // ============================================
  // Character CRUD
  // ============================================
  const addCharacter = () => {
    const newChar = {
      id: uid(),
      name: "New Character",
      initials: "NC",
      role: "Role",
      bg: getCharacterColor(characters.length),
    };
    setCharacters(prev => [...prev, newChar]);
  };

  const updateCharacter = (id, updates) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCharacter = (id) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  // ============================================
  // UI Helpers
  // ============================================
  const getNodeSize = (size) => {
    switch (size) {
      case "small":  return "w-16 h-16";
      case "medium": return "w-20 h-20";
      case "large":  return "w-24 h-24";
      case "xlarge": return "w-28 h-28";
      default:       return "w-20 h-20";
    }
  };

  const getColorClasses = (color) => {
    const c = COLOR_CLASSES[color] || COLOR_CLASSES.primary;
    return `${c.bg} ${c.border} ${c.text}`;
  };

  // SVG path through beats
  const pathD = useMemo(() => {
    if (storyBeats.length < 2) return "";
    const pts = storyBeats.map(b => b.position);
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const midX = (prev.x + curr.x) / 2;
      d += ` Q ${midX} ${prev.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }, [storyBeats]);

  // Count unimported characters
  const unimportedCount = storyCharacters.filter(
    name => !characters.some(c => c.name.toLowerCase() === name.toLowerCase())
  ).length;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
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
              Narrative Arc
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

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div 
          className="rounded-2xl p-6 mb-6 text-white"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.gold}30` }}
              >
                <BookOpen size={28} style={{ color: BRAND.gold }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{bookTitle}</h1>
                <p className="text-white/70 text-sm">
                  Story Arc · {storyBeats.length} beats · {characters.length} characters
                </p>
                <p className="text-white/50 text-xs mt-1">Project: {currentProjectId}</p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={addBeat}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Plus size={16} />
                Add Beat
              </button>
              <button
                onClick={exportJSON}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
              <button
                onClick={handleImportClick}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Upload size={16} />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportChange}
              />
            </div>
          </div>
        </div>

        {/* Master Arc Canvas */}
        <div 
          className="rounded-2xl p-6 mb-6"
          style={{
            background: "rgba(255, 255, 255, 0.9)",
            border: `1px solid ${BRAND.navy}15`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold" style={{ color: BRAND.navy }}>
              Story Arc Canvas
            </h2>
            <p className="text-xs text-slate-500">Drag beats to arrange · Click to edit</p>
          </div>

          <div
            className="relative h-80 rounded-xl overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}05 0%, ${BRAND.mauve}10 100%)` }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData("beatId");
              const rect = e.currentTarget.getBoundingClientRect();
              const xRaw = ((e.clientX - rect.left) / rect.width) * 100;
              const yRaw = ((e.clientY - rect.top) / rect.height) * 100;
              const x = snap(xRaw, 5, 5, 95);
              const y = snap(yRaw, 5, 10, 85);
              updateBeat(draggedId, { position: { x, y } });
            }}
          >
            {/* SVG Path */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: BRAND.navy, stopOpacity: 0.3 }} />
                  <stop offset="50%" style={{ stopColor: BRAND.gold, stopOpacity: 0.5 }} />
                  <stop offset="100%" style={{ stopColor: BRAND.ink, stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>
              <path
                d={pathD}
                fill="none"
                stroke="url(#arcGradient)"
                strokeWidth={0.5}
                strokeDasharray="2,1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* Beat Nodes */}
            {storyBeats.map((beat, index) => {
              const Icon = ICONS[beat.iconKey] || Heart;
              const isActive = activeNode === beat.id;

              return (
                <div
                  key={beat.id}
                  className="absolute cursor-move group"
                  style={{
                    left: `${beat.position.x}%`,
                    top: `${beat.position.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isActive ? 20 : 10,
                  }}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("beatId", beat.id);
                    e.currentTarget.style.opacity = "0.5";
                  }}
                  onDragEnd={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onClick={() => setActiveNode(beat.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === "ArrowLeft") nudgeBeat(beat.id, -1, 0, ev.shiftKey);
                    if (ev.key === "ArrowRight") nudgeBeat(beat.id, 1, 0, ev.shiftKey);
                    if (ev.key === "ArrowUp") nudgeBeat(beat.id, 0, -1, ev.shiftKey);
                    if (ev.key === "ArrowDown") nudgeBeat(beat.id, 0, 1, ev.shiftKey);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Beat ${index + 1}: ${beat.title}`}
                >
                  <div
                    className={`${getNodeSize(beat.size)} ${getColorClasses(beat.color)} rounded-2xl flex flex-col items-center justify-center shadow-lg border-4 border-white/50 transition-all duration-200 group-hover:scale-110 ${isActive ? "scale-110 ring-4 ring-offset-2" : ""}`}
                    style={{ ringColor: BRAND.gold }}
                  >
                    <Icon size={isActive ? 24 : 18} />
                    <span className="text-[8px] font-bold mt-1 text-center px-1 leading-tight">
                      {beat.title.split(" ")[0]}
                    </span>
                  </div>

                  {/* Hover tooltip */}
                  <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div 
                      className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap"
                      style={{ background: "white", color: BRAND.navy, boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}
                    >
                      {beat.title}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Beat List & Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* Timeline Strip */}
            <div 
              className="rounded-xl p-4"
              style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}15` }}
            >
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {storyBeats.map((beat, index) => {
                  const Icon = ICONS[beat.iconKey] || Heart;
                  const isActive = activeNode === beat.id;
                  return (
                    <React.Fragment key={beat.id}>
                      <button
                        onClick={() => setActiveNode(beat.id)}
                        className={`flex-shrink-0 ${getColorClasses(beat.color)} px-3 py-2 rounded-xl transition-all hover:scale-105 ${isActive ? "ring-2 ring-offset-1 scale-105" : ""}`}
                        style={{ ringColor: BRAND.gold, minWidth: 100 }}
                      >
                        <Icon size={16} className="mx-auto mb-1" />
                        <div className="text-[10px] font-bold text-center leading-tight truncate">
                          {beat.title}
                        </div>
                      </button>
                      {index < storyBeats.length - 1 && (
                        <div className="w-6 h-0.5 flex-shrink-0 rounded" style={{ background: BRAND.mauve }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Beat Editor */}
            <div 
              className="rounded-xl p-6"
              style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}15` }}
            >
              {activeNode ? (
                (() => {
                  const beat = storyBeats.find(b => b.id === activeNode);
                  if (!beat) return null;
                  const Icon = ICONS[beat.iconKey] || Heart;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${getColorClasses(beat.color)} rounded-xl flex items-center justify-center`}>
                            <Icon size={24} />
                          </div>
                          <div>
                            <input
                              value={beat.title}
                              onChange={(e) => updateBeat(beat.id, { title: e.target.value })}
                              className="text-lg font-bold bg-transparent border-none outline-none"
                              style={{ color: BRAND.navy }}
                            />
                            <div className="text-xs text-slate-500">
                              Beat {storyBeats.findIndex(b => b.id === beat.id) + 1} of {storyBeats.length}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteBeat(beat.id)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete beat"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Beat properties */}
                      <div className="flex flex-wrap gap-3">
                        {/* Icon selector */}
                        <select
                          value={beat.iconKey}
                          onChange={(e) => updateBeat(beat.id, { iconKey: e.target.value })}
                          className="text-sm rounded-lg px-3 py-2"
                          style={{ background: "white", border: `1px solid ${BRAND.navy}20` }}
                        >
                          {ICON_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>

                        {/* Color selector */}
                        <select
                          value={beat.color}
                          onChange={(e) => updateBeat(beat.id, { color: e.target.value })}
                          className="text-sm rounded-lg px-3 py-2"
                          style={{ background: "white", border: `1px solid ${BRAND.navy}20` }}
                        >
                          {COLOR_OPTIONS.map(opt => (
                            <option key={opt.key} value={opt.key}>{opt.label}</option>
                          ))}
                        </select>

                        {/* Size selector */}
                        <select
                          value={beat.size}
                          onChange={(e) => updateBeat(beat.id, { size: e.target.value })}
                          className="text-sm rounded-lg px-3 py-2"
                          style={{ background: "white", border: `1px solid ${BRAND.navy}20` }}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                          <option value="xlarge">X-Large</option>
                        </select>

                        {/* Phase selector */}
                        <select
                          value={beat.phase || "rising"}
                          onChange={(e) => updateBeat(beat.id, { phase: e.target.value })}
                          className="text-sm rounded-lg px-3 py-2"
                          style={{ background: "white", border: `1px solid ${BRAND.navy}20` }}
                        >
                          <option value="beginning">Beginning</option>
                          <option value="rising">Rising Action</option>
                          <option value="midpoint">Midpoint</option>
                          <option value="falling">Falling Action</option>
                          <option value="climax">Climax</option>
                          <option value="resolution">Resolution</option>
                        </select>
                      </div>

                      {/* Content editor */}
                      <textarea
                        defaultValue={beat.content}
                        onChange={(e) => debouncedUpdate({ id: beat.id, content: e.target.value })}
                        className="w-full h-40 p-4 rounded-xl text-sm leading-relaxed resize-none"
                        style={{ 
                          background: "white", 
                          border: `1px solid ${BRAND.navy}15`,
                          color: BRAND.ink,
                        }}
                        placeholder="Describe this story beat..."
                      />

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{countWords(beat.content)} words</span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-32 h-1.5 rounded-full overflow-hidden"
                            style={{ background: `${BRAND.navy}15` }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, (countWords(beat.content) / 250) * 100)}%`,
                                background: BRAND.gold,
                              }}
                            />
                          </div>
                          <span>{Math.min(100, Math.round((countWords(beat.content) / 250) * 100))}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto mb-4" style={{ color: BRAND.mauve }} />
                  <p className="text-slate-500">Click on a story beat to edit its content</p>
                </div>
              )}
            </div>
          </div>

          {/* Character Board */}
          <div className="lg:col-span-1">
            <div 
              className="rounded-xl p-6 sticky top-20"
              style={{ background: "rgba(255, 255, 255, 0.9)", border: `1px solid ${BRAND.navy}15` }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: BRAND.navy }}>Characters</h3>
                <div className="flex items-center gap-2">
                  {unimportedCount > 0 && (
                    <button
                      onClick={() => {
                        const count = importCharactersFromStory();
                        if (count > 0) {
                          alert(`Imported ${count} character(s) from your manuscript!`);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
                      style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
                      title={`Import ${unimportedCount} character(s) from @char: tags`}
                    >
                      <RefreshCw size={12} />
                      +{unimportedCount}
                    </button>
                  )}
                  <button
                    onClick={addCharacter}
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Add character"
                  >
                    <Plus size={16} style={{ color: BRAND.navy }} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {characters.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={32} className="mx-auto mb-2" style={{ color: BRAND.mauve }} />
                    <p className="text-sm text-slate-500 mb-2">No characters yet</p>
                    {storyCharacters.length > 0 ? (
                      <button
                        onClick={importCharactersFromStory}
                        className="text-sm font-medium"
                        style={{ color: BRAND.gold }}
                      >
                        Import {storyCharacters.length} from manuscript →
                      </button>
                    ) : (
                      <button
                        onClick={addCharacter}
                        className="text-sm font-medium"
                        style={{ color: BRAND.gold }}
                      >
                        Add first character →
                      </button>
                    )}
                  </div>
                ) : (
                  characters.map((char, idx) => (
                    <div
                      key={char.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-all hover:shadow-md cursor-move"
                      style={{ background: "white", border: `1px solid ${BRAND.navy}10` }}
                      draggable
                      onDragStart={() => setDragIndex(idx)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === idx) return;
                        setCharacters(prev => {
                          const next = [...prev];
                          const [moved] = next.splice(dragIndex, 1);
                          next.splice(idx, 0, moved);
                          return next;
                        });
                        setDragIndex(null);
                      }}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${char.bg}`}>
                        {char.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          value={char.name}
                          onChange={(e) => updateCharacter(char.id, { 
                            name: e.target.value,
                            initials: getInitials(e.target.value),
                          })}
                          className="w-full text-sm font-semibold bg-transparent border-none outline-none truncate"
                          style={{ color: BRAND.navy }}
                        />
                        <input
                          value={char.role}
                          onChange={(e) => updateCharacter(char.id, { role: e.target.value })}
                          className="w-full text-xs text-slate-500 bg-transparent border-none outline-none truncate"
                          placeholder="Role..."
                        />
                      </div>
                      <button
                        onClick={() => deleteCharacter(char.id)}
                        className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {storyCharacters.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-400">
                    {storyCharacters.length} character{storyCharacters.length !== 1 ? 's' : ''} found in manuscript via @char: tags
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

