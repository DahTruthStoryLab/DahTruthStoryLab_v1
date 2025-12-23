// src/components/storylab/HopesFearsLegacy.jsx
// REDESIGNED: Want • Wound • Worth framework with bullet points and rich colors

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
  Swords
} from "lucide-react";
import {
  loadProject,
  saveProject,
  ensureWorkshopFields,
} from "../../lib/storylab/projectStore";

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
   PROJECT-AWARE STORAGE UTILITIES
   ============================================ */

const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";

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
  if (projectId === 'default') {
    return baseKey;
  }
  return `${baseKey}-${projectId}`;
}

function loadChapters() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data.chapters) ? data.chapters : [];
  } catch {
    return [];
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
   CHARACTER SELECTOR
   ============================================ */
function CharacterSelector({ value, onChange, characters, placeholder = "Select character...", accentColor, darkBackground = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const dropdownRef = useRef(null);

  // Close on outside click
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
          borderColor: value ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.15)',
        }}
      >
        <div className="flex items-center gap-2">
          <User size={18} className="text-white/70" />
          <span className={value ? "text-white font-semibold" : "text-white/60"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown size={18} className={`text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <form onSubmit={handleCustomSubmit} className="p-3 border-b border-slate-100 bg-slate-50">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type custom name + Enter"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 text-slate-800"
              style={{ focusRingColor: accentColor }}
              autoFocus
            />
          </form>

          <div className="max-h-[200px] overflow-y-auto">
            {characters.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-400 text-center">
                <BookOpen size={20} className="mx-auto mb-2 opacity-50" />
                No @char: tags found
              </div>
            ) : (
              characters.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleSelect(name)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center justify-between transition-colors ${
                    name === value ? 'bg-amber-50' : ''
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
            style={{ '--tw-ring-color': accentColor }}
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
   CHARACTER CARD
   ============================================ */
function CharacterCard({ 
  roleKey, 
  roleLabel, 
  roleIcon: RoleIcon, 
  roleColor,
  roleGradient,
  characterName,
  characterData,
  characters,
  onAssignCharacter,
  onEditCharacter 
}) {
  // Ensure arrays exist
  const hopes = Array.isArray(characterData.hopes) ? characterData.hopes : [];
  const fears = Array.isArray(characterData.fears) ? characterData.fears : [];
  const legacy = Array.isArray(characterData.legacy) ? characterData.legacy : [];

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200/50">
      {/* Character Header - Centered */}
      <div 
        className="px-6 py-6 text-white text-center"
        style={{ background: roleGradient }}
      >
        {/* Role Icon & Label */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <RoleIcon size={22} />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-xl">{roleLabel}</h3>
            <p className="text-white/70 text-xs">
              {roleKey === "protagonist" && "The hero driving the story"}
              {roleKey === "antagonist" && "The opposing force or change agent"}
              {roleKey === "secondary" && "Key supporting character"}
            </p>
          </div>
        </div>

        {/* Character Name Display - Prominent */}
        <div className="flex flex-col items-center gap-3">
          {/* Avatar/Initials Circle */}
          <div 
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ 
              background: characterName ? 'white' : 'rgba(255,255,255,0.2)',
              color: characterName ? roleColor : 'rgba(255,255,255,0.5)'
            }}
          >
            {getInitials(characterName)}
          </div>
          
          {/* Name Selector */}
          <div className="w-full max-w-xs">
            <CharacterSelector
              value={characterName}
              onChange={(name) => onAssignCharacter(roleKey, name)}
              characters={characters}
              placeholder="Select character..."
              accentColor={roleColor}
            />
          </div>
        </div>
      </div>

      {/* Three Columns: Hopes | Fears | Legacy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-gradient-to-b from-slate-50 to-white">
        {/* HOPES */}
        <div className="border-r border-slate-100">
          <BulletSection
            title="Hopes"
            icon={Sparkles}
            items={hopes}
            onUpdate={(items) => onEditCharacter(characterName, "hopes", items)}
            accentColor={BRAND.gold}
            bgColor={`${BRAND.goldLight}30`}
            placeholder={characterName ? "What are they dreaming of?" : "Select a character first..."}
            disabled={!characterName}
          />
        </div>

        {/* FEARS */}
        <div className="border-r border-slate-100">
          <BulletSection
            title="Fears"
            icon={Flame}
            items={fears}
            onUpdate={(items) => onEditCharacter(characterName, "fears", items)}
            accentColor={BRAND.roseDark}
            bgColor={`${BRAND.rose}25`}
            placeholder={characterName ? "What terrifies them?" : "Select a character first..."}
            disabled={!characterName}
          />
        </div>

        {/* LEGACY */}
        <div>
          <BulletSection
            title="Legacy"
            icon={Gem}
            items={legacy}
            onUpdate={(items) => onEditCharacter(characterName, "legacy", items)}
            accentColor={BRAND.navy}
            bgColor={`${BRAND.mauve}20`}
            placeholder={characterName ? "What will they leave behind?" : "Select a character first..."}
            disabled={!characterName}
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
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));
  const [chapters, setChapters] = useState(() => loadChapters());
  const [saving, setSaving] = useState("idle");

  // NEW DATA STRUCTURE:
  // - roles: { protagonist: "name", antagonist: "name", secondary: "name" }
  // - characters: { "name": { hopes: [], fears: [], legacy: [] }, ... }
  
  const DEFAULT_ROLES = {
    protagonist: "",
    antagonist: "",
    secondary: "",
  };

  const [hfl, setHfl] = useState(() => {
    const saved = project.hfl || {};
    
    console.log("[HopesFearsLegacy] Loading saved data:", saved);
    
    // Check if this is the NEW format (has 'roles' key)
    if (saved.roles && saved.characters) {
      console.log("[HopesFearsLegacy] Detected NEW format");
      return {
        roles: saved.roles,
        characters: saved.characters,
      };
    }
    
    // Check if this is the OLD format (protagonist is an object with 'name' property)
    if (saved.protagonist && typeof saved.protagonist === 'object' && 'name' in saved.protagonist) {
      console.log("[HopesFearsLegacy] Detected OLD format, migrating...");
      const migratedCharacters = {};
      const migratedRoles = { protagonist: "", antagonist: "", secondary: "" };
      
      ['protagonist', 'antagonist', 'secondary'].forEach(role => {
        const oldData = saved[role];
        if (oldData && oldData.name) {
          migratedRoles[role] = oldData.name;
          migratedCharacters[oldData.name] = {
            hopes: Array.isArray(oldData.hopes) ? oldData.hopes : (oldData.hopes ? [oldData.hopes] : []),
            fears: Array.isArray(oldData.fears) ? oldData.fears : (oldData.fears ? [oldData.fears] : []),
            legacy: Array.isArray(oldData.legacy) ? oldData.legacy : (oldData.legacy ? [oldData.legacy] : []),
          };
        }
      });
      
      return {
        roles: migratedRoles,
        characters: migratedCharacters,
      };
    }
    
    // Empty/new - return defaults
    console.log("[HopesFearsLegacy] No saved data, using defaults");
    return {
      roles: { ...DEFAULT_ROLES },
      characters: {},
    };
  });

  const manuscriptCharacters = useMemo(() => {
    return extractCharactersFromChapters(chapters);
  }, [chapters]);

  const commit = (next) => {
    console.log("[HopesFearsLegacy] Saving data:", next);
    const copy = JSON.parse(JSON.stringify(project));
    copy.hfl = next;
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    console.log("[HopesFearsLegacy] Data saved to project");
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  };

  useEffect(() => {
    const handleProjectSwitch = () => {
      const newProjectId = getSelectedProjectId();
      
      if (newProjectId !== currentProjectId) {
        console.log(`[HopesFearsLegacy] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        
        const newProject = ensureWorkshopFields(loadProject());
        setProject(newProject);
        
        const saved = newProject.hfl || {};
        console.log("[HopesFearsLegacy] Project switch - loading:", saved);
        
        // Check if this is the NEW format (has 'roles' key)
        if (saved.roles && saved.characters) {
          setHfl({
            roles: saved.roles,
            characters: saved.characters,
          });
        }
        // Check if this is the OLD format
        else if (saved.protagonist && typeof saved.protagonist === 'object' && 'name' in saved.protagonist) {
          const migratedCharacters = {};
          const migratedRoles = { protagonist: "", antagonist: "", secondary: "" };
          
          ['protagonist', 'antagonist', 'secondary'].forEach(role => {
            const oldData = saved[role];
            if (oldData && oldData.name) {
              migratedRoles[role] = oldData.name;
              migratedCharacters[oldData.name] = {
                hopes: Array.isArray(oldData.hopes) ? oldData.hopes : [],
                fears: Array.isArray(oldData.fears) ? oldData.fears : [],
                legacy: Array.isArray(oldData.legacy) ? oldData.legacy : [],
              };
            }
          });
          
          setHfl({ roles: migratedRoles, characters: migratedCharacters });
        }
        // Empty/new
        else {
          setHfl({
            roles: { ...DEFAULT_ROLES },
            characters: {},
          });
        }
        
        setChapters(loadChapters());
      }
    };
    
    window.addEventListener("project:switch", handleProjectSwitch);
    window.addEventListener("storage", handleProjectSwitch);
    
    return () => {
      window.removeEventListener("project:switch", handleProjectSwitch);
      window.removeEventListener("storage", handleProjectSwitch);
    };
  }, [currentProjectId]);

  useEffect(() => {
    setSaving("saving");
    const id = setTimeout(() => {
      commit(hfl);
      setSaving("idle");
    }, 600);
    return () => clearTimeout(id);
  }, [hfl]);

  // Assign a character to a role
  const assignRole = (role, characterName) => {
    setHfl((prev) => {
      const newState = { ...prev, roles: { ...prev.roles } };
      newState.roles[role] = characterName;
      
      // If this character doesn't have data yet, initialize it
      if (characterName && !newState.characters[characterName]) {
        newState.characters = {
          ...newState.characters,
          [characterName]: { hopes: [], fears: [], legacy: [] }
        };
      }
      
      return newState;
    });
  };

  // Edit a character's data (by character name, not by role)
  const editCharacter = (characterName, field, value) => {
    if (!characterName) return;
    
    setHfl((prev) => ({
      ...prev,
      characters: {
        ...prev.characters,
        [characterName]: {
          ...(prev.characters[characterName] || { hopes: [], fears: [], legacy: [] }),
          [field]: value,
        }
      }
    }));
  };

  // Get character data for a role
  const getCharacterData = (role) => {
    const characterName = hfl.roles[role];
    if (!characterName) return { name: "", hopes: [], fears: [], legacy: [] };
    
    const charData = hfl.characters[characterName] || { hopes: [], fears: [], legacy: [] };
    return { name: characterName, ...charData };
  };

  const saveNow = () => {
    setSaving("saving");
    commit(hfl);
    setTimeout(() => setSaving("idle"), 300);
  };

  const refreshCharacters = () => {
    setChapters(loadChapters());
  };

  // Get list of all characters (from manuscript + any already in our data)
  const allCharacters = useMemo(() => {
    const fromData = Object.keys(hfl.characters || {});
    const combined = new Set([...manuscriptCharacters, ...fromData]);
    return Array.from(combined).sort();
  }, [manuscriptCharacters, hfl.characters]);

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
              ← Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Hopes • Fears • Legacy
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
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: 'blur(100px)' }} />
          
          <div className="relative z-10">
            {/* Icon trio */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.gold}40` }}>
                <Sparkles size={26} style={{ color: BRAND.goldLight }} />
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <Heart size={30} className="text-white" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.mauve}50` }}>
                <Gem size={26} style={{ color: BRAND.cream }} />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">
              <span style={{ color: BRAND.goldLight }}>Hopes</span>
              <span className="mx-3 opacity-50">•</span>
              <span style={{ color: BRAND.rose }}>Fears</span>
              <span className="mx-3 opacity-50">•</span>
              <span style={{ color: BRAND.cream }}>Legacy</span>
            </h1>
            
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Define what drives your characters. Their dreams, their obstacles, and what they leave behind.
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-8 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: BRAND.gold }} />
                <span>What they dream of</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame size={14} style={{ color: BRAND.rose }} />
                <span>What holds them back</span>
              </div>
              <div className="flex items-center gap-2">
                <Gem size={14} style={{ color: BRAND.mauve }} />
                <span>What they leave behind</span>
              </div>
            </div>

            <div className="mt-6 text-xs text-white/40">
              Project: {currentProjectId}
            </div>
          </div>
        </div>

        {/* Character count */}
        {manuscriptCharacters.length > 0 && (
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BookOpen size={16} />
              <span><strong>{manuscriptCharacters.length}</strong> characters found via @char: tags</span>
            </div>
            <button
              onClick={refreshCharacters}
              className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        )}

        {/* Character Cards */}
        <div className="space-y-8">
          {/* Protagonist */}
          <CharacterCard
            roleKey="protagonist"
            roleLabel="Protagonist"
            roleIcon={Star}
            roleColor={BRAND.navy}
            roleGradient={`linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`}
            characterName={hfl.roles.protagonist}
            characterData={hfl.characters[hfl.roles.protagonist] || { hopes: [], fears: [], legacy: [] }}
            characters={allCharacters}
            onAssignCharacter={assignRole}
            onEditCharacter={editCharacter}
          />

          {/* Antagonist/Catalyst */}
          <CharacterCard
            roleKey="antagonist"
            roleLabel="Antagonist / Catalyst"
            roleIcon={Swords}
            roleColor="#5c4a6e"
            roleGradient="linear-gradient(135deg, #4a3a5c 0%, #6b5a7e 100%)"
            characterName={hfl.roles.antagonist}
            characterData={hfl.characters[hfl.roles.antagonist] || { hopes: [], fears: [], legacy: [] }}
            characters={allCharacters}
            onAssignCharacter={assignRole}
            onEditCharacter={editCharacter}
          />

          {/* Secondary Lead */}
          <CharacterCard
            roleKey="secondary"
            roleLabel="Secondary Lead"
            roleIcon={Users}
            roleColor="#8b5a6a"
            roleGradient={`linear-gradient(135deg, #7a4a5a 0%, #9b6a7a 100%)`}
            characterName={hfl.roles.secondary}
            characterData={hfl.characters[hfl.roles.secondary] || { hopes: [], fears: [], legacy: [] }}
            characters={allCharacters}
            onAssignCharacter={assignRole}
            onEditCharacter={editCharacter}
          />
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
              <h4 className="font-bold text-slate-800 text-lg mb-2">How This Powers Your Story</h4>
              <p className="text-sm text-slate-600 mb-3">
                The character motivations you define here flow into every other StoryLab module:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/80 rounded-lg px-3 py-2 text-xs">
                  <strong className="block text-slate-700">Character Roadmap</strong>
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
