// src/components/storylab/HopesFearsLegacy.jsx
// FIXED: Uses storage service (not localStorage directly)
// Hopes • Fears • Legacy - Character/Subject motivation tracker
// Supports Fiction, Non-Fiction, Poetry, and Memoir genres

import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Heart, 
  Save, 
  Star, 
  Shield, 
  Users, 
  ChevronDown, 
  Check,
  Sparkles,
  Target,
  BookOpen,
  User,
  RefreshCw,
  Plus,
  X,
  Flame,
  Gem,
  Swords,
  FileText,
  Feather,
  BookMarked,
  Lightbulb,
  AlertTriangle,
  Award,
  Eye,
  MessageSquare,
  Compass,
  Clock,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { storage } from "../../lib/storage/storage";

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
  roseDark: "#c97b7b",
  ink: "#0F172A",
  cream: "#fefdfb",
};

/* ============================================
   GENRE CONFIGURATIONS
   ============================================ */
const GENRE_CONFIG = {
  fiction: {
    id: "fiction",
    label: "Fiction",
    icon: BookOpen,
    description: "Novels, short stories, creative writing",
    entityLabel: "Character",
    entityLabelPlural: "Characters",
    roles: [
      { id: "protagonist", label: "Protagonist", icon: Star, description: "The hero driving the story" },
      { id: "antagonist", label: "Antagonist / Catalyst", icon: Swords, description: "The opposing force or change agent" },
      { id: "secondary", label: "Secondary Lead", icon: Users, description: "Key supporting character" },
    ],
    columns: [
      { id: "hopes", label: "Hopes", icon: Sparkles, color: BRAND.gold, bgColor: `${BRAND.goldLight}30`, placeholder: "What are they dreaming of?" },
      { id: "fears", label: "Fears", icon: Flame, color: BRAND.roseDark, bgColor: `${BRAND.rose}25`, placeholder: "What terrifies them?" },
      { id: "legacy", label: "Legacy", icon: Gem, color: BRAND.navy, bgColor: `${BRAND.mauve}20`, placeholder: "What will they leave behind?" },
    ],
    tagPattern: /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag characters in your chapters with @char: Name",
  },
  nonfiction: {
    id: "nonfiction",
    label: "Non-Fiction",
    icon: FileText,
    description: "Essays, guides, research, arguments",
    entityLabel: "Subject",
    entityLabelPlural: "Subjects",
    roles: [
      { id: "main", label: "Main Thesis", icon: Target, description: "Your central argument or claim" },
      { id: "supporting", label: "Supporting Point", icon: Layers, description: "Key evidence or sub-argument" },
      { id: "counter", label: "Counter-Argument", icon: MessageSquare, description: "Opposing view to address" },
    ],
    columns: [
      { id: "purpose", label: "Purpose", icon: Lightbulb, color: BRAND.gold, bgColor: `${BRAND.goldLight}30`, placeholder: "What change do you want to create?" },
      { id: "obstacles", label: "Obstacles", icon: AlertTriangle, color: BRAND.roseDark, bgColor: `${BRAND.rose}25`, placeholder: "What resistance will readers have?" },
      { id: "impact", label: "Impact", icon: Award, color: BRAND.navy, bgColor: `${BRAND.mauve}20`, placeholder: "What will readers take away?" },
    ],
    tagPattern: /@topic:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag key topics with @topic: Subject Name",
  },
  poetry: {
    id: "poetry",
    label: "Poetry",
    icon: Feather,
    description: "Poems, verse, lyrical writing",
    entityLabel: "Theme",
    entityLabelPlural: "Themes",
    roles: [
      { id: "central", label: "Central Image", icon: Eye, description: "The dominant visual or metaphor" },
      { id: "voice", label: "Voice / Speaker", icon: MessageSquare, description: "Who is speaking and why" },
      { id: "form", label: "Form / Structure", icon: Layers, description: "The shape and constraints" },
    ],
    columns: [
      { id: "vision", label: "Vision", icon: Eye, color: BRAND.gold, bgColor: `${BRAND.goldLight}30`, placeholder: "What image or feeling do you want to evoke?" },
      { id: "tension", label: "Tension", icon: Flame, color: BRAND.roseDark, bgColor: `${BRAND.rose}25`, placeholder: "What conflict or contrast drives the piece?" },
      { id: "resonance", label: "Resonance", icon: Sparkles, color: BRAND.navy, bgColor: `${BRAND.mauve}20`, placeholder: "What will linger with the reader?" },
    ],
    tagPattern: /@theme:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag themes with @theme: Theme Name",
  },
  memoir: {
    id: "memoir",
    label: "Memoir",
    icon: BookMarked,
    description: "Personal narrative, autobiography, essays",
    entityLabel: "Life Thread",
    entityLabelPlural: "Life Threads",
    roles: [
      { id: "self", label: "Past Self", icon: Clock, description: "Who you were at that time" },
      { id: "others", label: "Key Figure", icon: Users, description: "Important person in your story" },
      { id: "present", label: "Present Self", icon: Compass, description: "Who you are now, looking back" },
    ],
    columns: [
      { id: "aspirations", label: "Aspirations", icon: Sparkles, color: BRAND.gold, bgColor: `${BRAND.goldLight}30`, placeholder: "What did you hope for then?" },
      { id: "fears", label: "Fears", icon: Flame, color: BRAND.roseDark, bgColor: `${BRAND.rose}25`, placeholder: "What were you afraid of?" },
      { id: "lessons", label: "Lessons", icon: Lightbulb, color: BRAND.navy, bgColor: `${BRAND.mauve}20`, placeholder: "What did you learn?" },
    ],
    tagPattern: /@person:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag key people with @person: Name",
  },
};

/* ============================================
   PROJECT-AWARE STORAGE UTILITIES (using storage service)
   ============================================ */

const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const HFL_KEY_BASE = "dahtruth-hfl-data-v2";
const GENRE_KEY_BASE = "dahtruth-project-genre";

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

function saveProjectGenre(genre) {
  try {
    const key = getProjectKey(GENRE_KEY_BASE);
    storage.setItem(key, genre);
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch {
    return false;
  }
}

function loadHflData() {
  try {
    const key = getProjectKey(HFL_KEY_BASE);
    const raw = storage.getItem(key);
    console.log(`[HFL] Loading from key: ${key}`, raw);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[HFL] Error loading data:", e);
    return null;
  }
}

function saveHflData(data) {
  try {
    const key = getProjectKey(HFL_KEY_BASE);
    const json = JSON.stringify(data);
    storage.setItem(key, json);
    console.log(`[HFL] Saved to key: ${key}`, data);
    return true;
  } catch (e) {
    console.error("[HFL] Error saving data:", e);
    return false;
  }
}

function loadChapters() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = storage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.chapters) ? data.chapters : [];
  } catch {
    return [];
  }
}

function extractEntitiesFromChapters(chapters = [], pattern) {
  const entitySet = new Set();

  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) entitySet.add(name);
    }
  });

  return Array.from(entitySet).sort();
}

/* ============================================
   SAVING BADGE
   ============================================ */
function SavingBadge({ state }) {
  if (state === "saving") {
    return (
      <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-amber-100 text-amber-700 border border-amber-200">
        Saving…
      </span>
    );
  }
  return (
    <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
      ✓ Saved
    </span>
  );
}

/* ============================================
   GENRE SELECTOR
   ============================================ */
function GenreSelector({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = GENRE_CONFIG[value] || GENRE_CONFIG.fiction;
  const Icon = current.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 transition-all hover:shadow-md"
        style={{ 
          borderColor: `${BRAND.gold}60`,
          background: `${BRAND.gold}15`,
        }}
      >
        <Icon size={18} style={{ color: BRAND.gold }} />
        <span className="font-semibold" style={{ color: BRAND.navy }}>{current.label}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} style={{ color: BRAND.navy }} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden min-w-[280px]">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Writing Type</span>
          </div>
          {Object.values(GENRE_CONFIG).map((genre) => {
            const GenreIcon = genre.icon;
            const isSelected = value === genre.id;
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => {
                  onChange(genre.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                  isSelected ? "bg-amber-50" : "hover:bg-slate-50"
                }`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: isSelected ? `${BRAND.gold}25` : "#f1f5f9" }}
                >
                  <GenreIcon size={20} style={{ color: isSelected ? BRAND.gold : "#64748b" }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                    {genre.label}
                  </div>
                  <div className="text-xs text-slate-500">{genre.description}</div>
                </div>
                {isSelected && <Check size={18} style={{ color: BRAND.gold }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================
   ENTITY SELECTOR (Character/Subject/Theme)
   ============================================ */
function EntitySelector({ value, onChange, entities, placeholder, accentColor, genreConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (name) => {
    onChange(name);
    setIsOpen(false);
    setCustomInput("");
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customInput.trim()) {
      onChange(customInput.trim());
      setCustomInput("");
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border-2 text-left transition-all shadow-sm"
        style={{ 
          borderColor: value ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <User size={18} className="text-white/70" />
          <span className={value ? "text-white font-semibold" : "text-white/60"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={18} className={`text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleCustomSubmit} className="p-3 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={`Type custom ${genreConfig.entityLabel.toLowerCase()} + Enter`}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 text-slate-800"
              autoFocus
            />
          </form>

          <div className="max-h-[200px] overflow-y-auto">
            {entities.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-400 text-center">
                <BookOpen size={20} className="mx-auto mb-2 opacity-50" />
                No {genreConfig.entityLabelPlural.toLowerCase()} found via tags
                <div className="text-xs mt-1">{genreConfig.tagInstruction}</div>
              </div>
            ) : (
              entities.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors ${
                    name === value ? "bg-amber-50" : ""
                  }`}
                >
                  <span className="font-medium text-slate-700">{name}</span>
                  {name === value && <Check size={16} style={{ color: accentColor }} />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================
   BULLET LIST SECTION
   ============================================ */
function BulletSection({ title, icon: Icon, items = [], onUpdate, accentColor, bgColor, placeholder, disabled = false }) {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (newItem.trim() && !disabled) {
      onUpdate([...items, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeItem = (index) => {
    if (!disabled) {
      onUpdate(items.filter((_, i) => i !== index));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addItem();
    }
  };

  return (
    <div 
      className="rounded-xl overflow-hidden h-full"
      style={{ background: bgColor, opacity: disabled ? 0.6 : 1 }}
    >
      {/* Section Header */}
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{ 
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          borderBottom: `2px solid ${accentColor}40`
        }}
      >
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${accentColor}25` }}
        >
          <Icon size={16} style={{ color: accentColor }} />
        </div>
        <h4 className="font-bold text-sm uppercase tracking-wide" style={{ color: accentColor }}>
          {title}
        </h4>
      </div>

      {/* Bullet Items */}
      <div className="p-4 space-y-2 min-h-[180px]">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic">{placeholder}</p>
        ) : (
          items.map((item, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-2 group bg-white/80 rounded-lg px-3 py-2 shadow-sm"
            >
              <span 
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" 
                style={{ background: accentColor }}
              />
              <span className="flex-1 text-sm text-slate-700">{item}</span>
              <button
                onClick={() => removeItem(idx)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded"
              >
                <X size={14} className="text-red-400" />
              </button>
            </div>
          ))
        )}

        {/* Add New Item */}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 disabled:bg-slate-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim() || disabled}
            className="px-3 py-2 rounded-lg text-white font-medium text-sm disabled:opacity-40 transition-all hover:scale-105 disabled:hover:scale-100"
            style={{ background: accentColor }}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================
   ENTITY CARD (Character/Subject/Theme)
   ============================================ */
function EntityCard({ 
  roleKey, 
  role,
  entityName,
  entityData,
  allEntities,
  onAssignEntity,
  onEditEntity,
  genreConfig,
}) {
  const columns = genreConfig.columns;
  
  const col1Data = Array.isArray(entityData[columns[0].id]) ? entityData[columns[0].id] : [];
  const col2Data = Array.isArray(entityData[columns[1].id]) ? entityData[columns[1].id] : [];
  const col3Data = Array.isArray(entityData[columns[2].id]) ? entityData[columns[2].id] : [];

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const RoleIcon = role.icon;
  const roleGradient = roleKey === "protagonist" || roleKey === "main" || roleKey === "central" || roleKey === "self"
    ? `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`
    : roleKey === "antagonist" || roleKey === "counter" || roleKey === "voice" || roleKey === "others"
    ? "linear-gradient(135deg, #4a3a5c 0%, #6b5a7e 100%)"
    : `linear-gradient(135deg, #7a4a5a 0%, #9b6a7a 100%)`;

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/50">
      {/* Header */}
      <div className="px-6 py-6 text-center" style={{ background: roleGradient }}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <RoleIcon size={22} className="text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-xl text-white">{role.label}</h3>
            <p className="text-white/70 text-xs">{role.description}</p>
          </div>
        </div>

        {/* Name Display */}
        <div className="flex flex-col items-center gap-3">
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ 
              background: entityName ? "white" : "rgba(255,255,255,0.2)",
              color: entityName ? BRAND.navy : "rgba(255,255,255,0.5)"
            }}
          >
            {getInitials(entityName)}
          </div>
          
          <div className="w-full max-w-xs">
            <EntitySelector
              value={entityName}
              onChange={(name) => onAssignEntity(roleKey, name)}
              entities={allEntities}
              placeholder={`Select ${genreConfig.entityLabel.toLowerCase()}...`}
              accentColor={BRAND.gold}
              genreConfig={genreConfig}
            />
          </div>
        </div>
      </div>

      {/* Three Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-gradient-to-b from-slate-50 to-white">
        <div className="border-r border-slate-100">
          <BulletSection
            title={columns[0].label}
            icon={columns[0].icon}
            items={col1Data}
            onUpdate={(items) => onEditEntity(entityName, columns[0].id, items)}
            accentColor={columns[0].color}
            bgColor={columns[0].bgColor}
            placeholder={entityName ? columns[0].placeholder : `Select a ${genreConfig.entityLabel.toLowerCase()} first...`}
            disabled={!entityName}
          />
        </div>

        <div className="border-r border-slate-100">
          <BulletSection
            title={columns[1].label}
            icon={columns[1].icon}
            items={col2Data}
            onUpdate={(items) => onEditEntity(entityName, columns[1].id, items)}
            accentColor={columns[1].color}
            bgColor={columns[1].bgColor}
            placeholder={entityName ? columns[1].placeholder : `Select a ${genreConfig.entityLabel.toLowerCase()} first...`}
            disabled={!entityName}
          />
        </div>

        <div>
          <BulletSection
            title={columns[2].label}
            icon={columns[2].icon}
            items={col3Data}
            onUpdate={(items) => onEditEntity(entityName, columns[2].id, items)}
            accentColor={columns[2].color}
            bgColor={columns[2].bgColor}
            placeholder={entityName ? columns[2].placeholder : `Select a ${genreConfig.entityLabel.toLowerCase()} first...`}
            disabled={!entityName}
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function HopesFearsLegacy() {
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [genre, setGenre] = useState(() => loadProjectGenre());
  const [chapters, setChapters] = useState(() => loadChapters());
  const [saving, setSaving] = useState("idle");

  const genreConfig = GENRE_CONFIG[genre] || GENRE_CONFIG.fiction;

  const DEFAULT_ROLES = {};
  genreConfig.roles.forEach(r => { DEFAULT_ROLES[r.id] = ""; });

  const DEFAULT_DATA = {
    roles: { ...DEFAULT_ROLES },
    entities: {},
    genre: genre,
  };

  const [data, setData] = useState(() => {
    const saved = loadHflData();
    
    if (!saved) {
      console.log("[HFL] No saved data, using defaults");
      return { ...DEFAULT_DATA };
    }
    
    if (saved.roles && saved.entities) {
      return {
        roles: saved.roles,
        entities: saved.entities,
        genre: saved.genre || genre,
      };
    }
    
    if (saved.roles && saved.characters) {
      return {
        roles: saved.roles,
        entities: saved.characters,
        genre: saved.genre || "fiction",
      };
    }
    
    if (saved.protagonist && typeof saved.protagonist === "object" && "name" in saved.protagonist) {
      console.log("[HFL] Migrating legacy format...");
      const migratedEntities = {};
      const migratedRoles = { protagonist: "", antagonist: "", secondary: "" };
      
      ["protagonist", "antagonist", "secondary"].forEach(role => {
        const oldData = saved[role];
        if (oldData && oldData.name) {
          migratedRoles[role] = oldData.name;
          migratedEntities[oldData.name] = {
            hopes: Array.isArray(oldData.hopes) ? oldData.hopes : [],
            fears: Array.isArray(oldData.fears) ? oldData.fears : [],
            legacy: Array.isArray(oldData.legacy) ? oldData.legacy : [],
          };
        }
      });
      
      return { roles: migratedRoles, entities: migratedEntities, genre: "fiction" };
    }
    
    return { ...DEFAULT_DATA };
  });

  const manuscriptEntities = useMemo(() => {
    return extractEntitiesFromChapters(chapters, genreConfig.tagPattern);
  }, [chapters, genreConfig.tagPattern]);

  const commit = (next) => {
    saveHflData(next);
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  };

  const handleGenreChange = (newGenre) => {
    setGenre(newGenre);
    saveProjectGenre(newGenre);
    
    const newConfig = GENRE_CONFIG[newGenre];
    const newRoles = {};
    newConfig.roles.forEach(r => { newRoles[r.id] = ""; });
    
    setData(prev => ({
      ...prev,
      roles: newRoles,
      genre: newGenre,
    }));
  };

  useEffect(() => {
    const reloadAllData = () => {
      const pid = getSelectedProjectId();
      console.log(`[HFL] Reloading data for project: ${pid}`);
      
      const loadedGenre = loadProjectGenre();
      setGenre(loadedGenre);
      
      const saved = loadHflData();
      if (!saved) {
        const cfg = GENRE_CONFIG[loadedGenre];
        const roles = {};
        cfg.roles.forEach(r => { roles[r.id] = ""; });
        setData({ roles, entities: {}, genre: loadedGenre });
      } else if (saved.roles && saved.entities) {
        setData({ roles: saved.roles, entities: saved.entities, genre: saved.genre || loadedGenre });
      } else if (saved.roles && saved.characters) {
        setData({ roles: saved.roles, entities: saved.characters, genre: saved.genre || "fiction" });
      } else {
        const cfg = GENRE_CONFIG[loadedGenre];
        const roles = {};
        cfg.roles.forEach(r => { roles[r.id] = ""; });
        setData({ roles, entities: {}, genre: loadedGenre });
      }
      
      setChapters(loadChapters());
    };

    const handleProjectSwitch = () => {
      const newProjectId = getSelectedProjectId();
      
      if (newProjectId !== currentProjectId) {
        console.log(`[HFL] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };
    
    window.addEventListener("project:change", handleProjectSwitch);
    window.addEventListener("storage", handleProjectSwitch);
    
    return () => {
      window.removeEventListener("project:change", handleProjectSwitch);
      window.removeEventListener("storage", handleProjectSwitch);
    };
  }, [currentProjectId]);

  useEffect(() => {
    setSaving("saving");
    const id = setTimeout(() => {
      commit(data);
      setSaving("idle");
    }, 600);
    return () => clearTimeout(id);
  }, [data]);

  const assignRole = (role, entityName) => {
    setData((prev) => {
      const newState = { ...prev, roles: { ...prev.roles } };
      newState.roles[role] = entityName;
      
      if (entityName && !newState.entities[entityName]) {
        const defaultEntity = {};
        genreConfig.columns.forEach(col => { defaultEntity[col.id] = []; });
        newState.entities = { ...newState.entities, [entityName]: defaultEntity };
      }
      
      return newState;
    });
  };

  const editEntity = (entityName, field, value) => {
    if (!entityName) return;
    
    setData((prev) => {
      const defaultEntity = {};
      genreConfig.columns.forEach(col => { defaultEntity[col.id] = []; });
      
      return {
        ...prev,
        entities: {
          ...prev.entities,
          [entityName]: {
            ...(prev.entities[entityName] || defaultEntity),
            [field]: value,
          }
        }
      };
    });
  };

  const saveNow = () => {
    setSaving("saving");
    commit(data);
    setTimeout(() => setSaving("idle"), 300);
  };

  const refreshEntities = () => {
    setChapters(loadChapters());
  };

  const allEntities = useMemo(() => {
    const fromData = Object.keys(data.entities || {});
    const combined = new Set([...manuscriptEntities, ...fromData]);
    return Array.from(combined).sort();
  }, [manuscriptEntities, data.entities]);

  const GenreIcon = genreConfig.icon;

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} /> Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              {genreConfig.columns[0].label} • {genreConfig.columns[1].label} • {genreConfig.columns[2].label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SavingBadge state={saving} />
            <Link
              to="/story-lab/workshop"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105"
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
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: "blur(100px)" }} />
          
          <div className="relative z-10">
            {/* Genre Selector */}
            <div className="flex justify-center mb-6">
              <GenreSelector value={genre} onChange={handleGenreChange} />
            </div>

            {/* Icon trio */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${genreConfig.columns[0].color}40` }}>
                {React.createElement(genreConfig.columns[0].icon, { size: 26, style: { color: BRAND.goldLight } })}
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <Heart size={30} className="text-white" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${genreConfig.columns[2].color}30` }}>
                {React.createElement(genreConfig.columns[2].icon, { size: 26, style: { color: BRAND.cream } })}
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3 text-white">
              <span style={{ color: BRAND.goldLight }}>{genreConfig.columns[0].label}</span>
              <span className="mx-3 opacity-50">•</span>
              <span style={{ color: BRAND.rose }}>{genreConfig.columns[1].label}</span>
              <span className="mx-3 opacity-50">•</span>
              <span style={{ color: BRAND.cream }}>{genreConfig.columns[2].label}</span>
            </h1>
            
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              {genre === "fiction" && "Define what drives your characters. Their dreams, their obstacles, and what they leave behind."}
              {genre === "nonfiction" && "Clarify your purpose. What change do you want to create, and what impact will your work have?"}
              {genre === "poetry" && "Explore your themes. What vision are you creating, what tension drives it, and what will resonate?"}
              {genre === "memoir" && "Reflect on your journey. What did you hope for, fear, and ultimately learn?"}
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/60">
              {genreConfig.columns.map((col, idx) => (
                <div key={col.id} className="flex items-center gap-2">
                  {React.createElement(col.icon, { size: 14, style: { color: idx === 0 ? BRAND.gold : idx === 1 ? BRAND.rose : BRAND.mauve } })}
                  <span>{col.placeholder.split("?")[0]}?</span>
                </div>
              ))}
            </div>

            <div className="mt-6 text-xs text-white/50">
              Project: {currentProjectId} · {genreConfig.label}
            </div>
          </div>
        </div>

        {/* Entity count */}
        {manuscriptEntities.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BookOpen size={16} />
              <span>
                <strong>{manuscriptEntities.length}</strong> {genreConfig.entityLabelPlural.toLowerCase()} found via tags
              </span>
            </div>
            <button
              onClick={refreshEntities}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}

        {/* Entity Cards */}
        <div className="space-y-8">
          {genreConfig.roles.map((role) => (
            <EntityCard
              key={role.id}
              roleKey={role.id}
              role={role}
              entityName={data.roles[role.id] || ""}
              entityData={data.entities[data.roles[role.id]] || {}}
              allEntities={allEntities}
              onAssignEntity={assignRole}
              onEditEntity={editEntity}
              genreConfig={genreConfig}
            />
          ))}
        </div>

        {/* Connection Info */}
        <div 
          className="mt-10 p-6 rounded-2xl border-2"
          style={{ 
            background: `linear-gradient(135deg, ${BRAND.goldLight}20, ${BRAND.cream})`,
            borderColor: `${BRAND.gold}30`
          }}
        >
          <div className="flex items-start gap-4">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
            >
              <Sparkles size={22} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">How This Powers Your Writing</h4>
              <p className="text-sm text-slate-600 mb-3">
                The {genreConfig.entityLabel.toLowerCase()} motivations you define here flow into every other StoryLab module:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                  <strong className="block text-slate-700">Roadmap</strong>
                  <span className="text-slate-500">Milestones from arcs</span>
                </div>
                <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                  <strong className="block text-slate-700">Priority Cards</strong>
                  <span className="text-slate-500">AI-powered goals</span>
                </div>
                <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                  <strong className="block text-slate-700">Narrative Arc</strong>
                  <span className="text-slate-500">Story beat alignment</span>
                </div>
                <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                  <strong className="block text-slate-700">Clothesline</strong>
                  <span className="text-slate-500">Scene planning</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tagging Help */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-semibold text-sm mb-2" style={{ color: BRAND.navy }}>
            💡 How to tag {genreConfig.entityLabelPlural.toLowerCase()}
          </h4>
          <p className="text-sm text-slate-600">
            {genreConfig.tagInstruction}. For example: <code className="bg-white px-1.5 py-0.5 rounded border text-xs">
              {genre === "fiction" && "@char: Grace Thompson"}
              {genre === "nonfiction" && "@topic: Climate Change"}
              {genre === "poetry" && "@theme: Loss and Renewal"}
              {genre === "memoir" && "@person: Grandmother Rose"}
            </code>
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={saveNow}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})` }}
          >
            <Save size={18} />
            Save Now
          </button>
        </div>
      </div>
    </div>
  );
}

