// src/components/storylab/Clothesline.jsx
// UPDATED: Now uses project-specific storage keys for multi-manuscript support

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Pin, 
  Users, 
  Plus, 
  Trash2, 
  BookOpen, 
  User,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Search,
  ArrowRight,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import {
  loadProject,
  saveProject,
  ensureWorkshopFields,
  uid,
} from "../../lib/storylab/projectStore";
import BackToLanding, { BackToLandingFab } from "./BackToLanding";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
  navyLight: "#2d4a6f",
};

/* ---------------------------
   DnD type
---------------------------- */
const ITEM = "CHAR_CARD";

/* ---------------------------
   BASE Storage key for chapters (will be made project-specific)
---------------------------- */
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";

/* ============================================
   PROJECT-AWARE STORAGE UTILITIES
   ============================================ */

/**
 * Get the currently selected project ID from localStorage
 */
function getSelectedProjectId() {
  try {
    // Check direct key first
    const stored = localStorage.getItem('dahtruth-selected-project-id');
    if (stored) return stored;
    
    // Fallback: check project store
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
 * For 'default' project, returns base key (backwards compatibility)
 * For other projects, returns baseKey-projectId
 */
function getProjectKey(baseKey) {
  const projectId = getSelectedProjectId();
  if (projectId === 'default') {
    return baseKey; // Backwards compatibility
  }
  return `${baseKey}-${projectId}`;
}

/* ---------------------------
   Load chapters from localStorage (PROJECT-AWARE)
---------------------------- */
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
   Extract characters from chapters with @char: tags
   Returns: { name: string, mentions: number, chapters: string[] }[]
---------------------------- */
function extractCharactersFromChapters(chapters = []) {
  const charMap = new Map(); // name -> { mentions, chapters Set }
  const charPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi;

  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    const chapterTitle = ch.title || "Untitled Chapter";
    let match;
    
    while ((match = charPattern.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) {
        if (!charMap.has(name)) {
          charMap.set(name, { mentions: 0, chapters: new Set() });
        }
        const data = charMap.get(name);
        data.mentions += 1;
        data.chapters.add(chapterTitle);
      }
    }
  });

  // Convert to array and sort by mentions (descending)
  return Array.from(charMap.entries())
    .map(([name, data]) => ({
      name,
      mentions: data.mentions,
      chapters: Array.from(data.chapters),
    }))
    .sort((a, b) => b.mentions - a.mentions);
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
          <Pin size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">
            DahTruth · StoryLab
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Clothesline</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          View characters from your manuscript · Drag to reorder · Build your cast
        </p>
      </div>
    </div>
  </div>
);

/* ---------------------------
   Character Card (on the board)
---------------------------- */
function CharacterCard({ c, onRemove }) {
  return (
    <div 
      className="rounded-xl border bg-white/90 p-4 shadow-sm transition-all hover:shadow-md"
      style={{ borderColor: `${BRAND.navy}20` }}
    >
      <div className="flex items-start gap-3">
        <div 
          className="rounded-lg p-2 flex-shrink-0"
          style={{ background: `${BRAND.mauve}20` }}
        >
          <User className="h-5 w-5" style={{ color: BRAND.mauve }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: BRAND.navy }}>
            {c.name || "Unnamed"}
          </div>
          {c.role && (
            <span 
              className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
              style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
            >
              {c.role}
            </span>
          )}
          {c.mentions && (
            <div className="text-xs text-slate-400 mt-1">
              {c.mentions} mention{c.mentions !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(c.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            title="Remove from board"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        )}
      </div>
      
      {/* Relationship */}
      {c.rel && (
        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
          {c.rel}
        </div>
      )}
      
      {/* Traits */}
      {c.traits && c.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {c.traits.map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-md border bg-white"
              style={{ borderColor: `${BRAND.navy}15`, color: BRAND.navy }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      
      {/* Chapter appearances */}
      {c.chapters && c.chapters.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 mb-1">Appears in:</div>
          <div className="flex flex-wrap gap-1">
            {c.chapters.slice(0, 3).map((ch, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
              >
                {ch.length > 20 ? ch.slice(0, 20) + '...' : ch}
              </span>
            ))}
            {c.chapters.length > 3 && (
              <span className="text-[10px] text-slate-400">
                +{c.chapters.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Draggable + Droppable Card
---------------------------- */
function DraggableCard({ index, c, move, onDropPersist, onRemove }) {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ITEM,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      move(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop() {
      onDropPersist();
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "opacity-50 scale-95" : "opacity-100"
      }`}
    >
      <CharacterCard c={c} onRemove={onRemove} />
    </div>
  );
}

/* ---------------------------
   Character Discovery Panel
   Shows characters found via @char: tags
---------------------------- */
function CharacterDiscoveryPanel({ 
  discoveredCharacters, 
  boardCharacters, 
  onAddToBoard,
  isExpanded,
  onToggle,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Filter out characters already on the board
  const boardNames = new Set(boardCharacters.map(c => c.name?.toLowerCase()));
  const availableCharacters = discoveredCharacters.filter(
    c => !boardNames.has(c.name.toLowerCase())
  );
  
  // Apply search filter
  const filteredCharacters = searchTerm
    ? availableCharacters.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableCharacters;

  return (
    <div 
      className="rounded-2xl border overflow-hidden mb-6"
      style={{ 
        background: "rgba(255, 255, 255, 0.9)",
        borderColor: `${BRAND.navy}15`,
      }}
    >
      {/* Header - clickable to expand/collapse */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.gold}15` }}
          >
            <Sparkles size={20} style={{ color: BRAND.gold }} />
          </div>
          <div className="text-left">
            <h3 className="font-bold" style={{ color: BRAND.navy }}>
              Characters in Your Manuscript
            </h3>
            <p className="text-xs text-slate-500">
              {discoveredCharacters.length} character{discoveredCharacters.length !== 1 ? 's' : ''} found via @char: tags
              {availableCharacters.length > 0 && (
                <span className="ml-1">
                  · {availableCharacters.length} not on board yet
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableCharacters.length > 0 && (
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
            >
              {availableCharacters.length} available
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={20} className="text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {discoveredCharacters.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">
                No characters found yet.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                Tag characters in your chapters with @char: Name
              </p>
              <Link 
                to="/compose" 
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: BRAND.gold }}
              >
                Go to Writer <ArrowRight size={14} />
              </Link>
            </div>
          ) : availableCharacters.length === 0 ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">
                All discovered characters are on your board!
              </p>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative mt-4 mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search characters..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  style={{ 
                    background: "white",
                    border: `1px solid ${BRAND.navy}15`,
                  }}
                />
              </div>

              {/* Character list */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredCharacters.map((char, idx) => (
                  <div
                    key={char.name}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    style={{ border: `1px solid ${BRAND.navy}10` }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${BRAND.mauve}20` }}
                      >
                        <User size={16} style={{ color: BRAND.mauve }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: BRAND.navy }}>
                          {char.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {char.mentions} mention{char.mentions !== 1 ? 's' : ''} in {char.chapters.length} chapter{char.chapters.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToBoard(char)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                      style={{ 
                        background: `${BRAND.gold}15`,
                        color: BRAND.gold,
                      }}
                    >
                      <Plus size={14} />
                      Add
                    </button>
                  </div>
                ))}
                
                {filteredCharacters.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No characters match "{searchTerm}"
                  </div>
                )}
              </div>

              {/* Add all button */}
              {filteredCharacters.length > 1 && (
                <button
                  onClick={() => filteredCharacters.forEach(c => onAddToBoard(c))}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ 
                    background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})`,
                  }}
                >
                  Add All {filteredCharacters.length} Characters to Board
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------
   Clothesline (main export)
------------------------------------------------- */
export default function Clothesline() {
  // ============================================
  // KEY FIX: Track current project ID for multi-manuscript support
  // ============================================
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  
  // Load project
  const [project, setProject] = useState(() =>
    ensureWorkshopFields(loadProject())
  );
  
  // Load chapters for character discovery (now project-aware)
  const [chapters, setChapters] = useState(() => loadChapters());
  
  // Discovery panel state
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  // ============================================
  // KEY FIX: Listen for project changes and reload ALL data
  // ============================================
  useEffect(() => {
    const handleProjectChange = () => {
      const newProjectId = getSelectedProjectId();
      
      if (newProjectId !== currentProjectId) {
        console.log(`[Clothesline] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        
        // Reload ALL data from new project's storage
        setChapters(loadChapters());
        setProject(ensureWorkshopFields(loadProject()));
      }
    };
    
    const handleDataChange = () => {
      // Data changed within same project - reload
      setChapters(loadChapters());
      setProject(ensureWorkshopFields(loadProject()));
    };
    
    // Listen for project switch events
    window.addEventListener("project:switch", handleProjectChange);
    window.addEventListener("project:change", handleDataChange);
    window.addEventListener("storage", handleProjectChange);
    
    return () => {
      window.removeEventListener("project:switch", handleProjectChange);
      window.removeEventListener("project:change", handleDataChange);
      window.removeEventListener("storage", handleProjectChange);
    };
  }, [currentProjectId]);

  // Discover characters from @char: tags
  const discoveredCharacters = useMemo(() => {
    return extractCharactersFromChapters(chapters);
  }, [chapters]);

  // Board characters (from project.characters)
  const boardCharacters = useMemo(() => {
    const arr = Array.isArray(project.characters) ? project.characters : [];
    return arr.map((ch) => (ch.id ? ch : { ...ch, id: uid() }));
  }, [project]);

  // Local working order for DnD
  const [order, setOrder] = useState(boardCharacters);
  
  // Sync order when board characters change
  useEffect(() => {
    setOrder(boardCharacters);
  }, [boardCharacters]);

  // Reorder in-memory
  const move = useCallback((from, to) => {
    setOrder((prev) => {
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }, []);

  // Persist new order
  const persistOrder = useCallback(() => {
    const copy = JSON.parse(JSON.stringify(project));
    copy.characters = order;
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  }, [order, project]);

  // Add character to board
  const addToBoard = useCallback((char) => {
    const copy = JSON.parse(JSON.stringify(project));
    if (!Array.isArray(copy.characters)) {
      copy.characters = [];
    }
    
    // Check if already on board
    const exists = copy.characters.some(
      c => c.name?.toLowerCase() === char.name?.toLowerCase()
    );
    if (exists) return;
    
    // Add new character
    copy.characters.push({
      id: uid(),
      name: char.name,
      role: "",
      rel: "",
      traits: [],
      mentions: char.mentions,
      chapters: char.chapters,
    });
    
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    setOrder(copy.characters);
    
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  }, [project]);

  // Remove character from board
  const removeFromBoard = useCallback((id) => {
    const copy = JSON.parse(JSON.stringify(project));
    copy.characters = (copy.characters || []).filter(c => c.id !== id);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    setOrder(copy.characters);
    
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  }, [project]);

  // Grid classes
  const gridCls =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start";

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar */}
      <BackToLanding
        title="Clothesline"
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

        {/* Character Discovery Panel */}
        <CharacterDiscoveryPanel
          discoveredCharacters={discoveredCharacters}
          boardCharacters={boardCharacters}
          onAddToBoard={addToBoard}
          isExpanded={isPanelExpanded}
          onToggle={() => setIsPanelExpanded(!isPanelExpanded)}
        />

        {/* Board */}
        <div 
          className="rounded-2xl border backdrop-blur-xl p-5"
          style={{ 
            background: "rgba(255, 255, 255, 0.8)",
            borderColor: `${BRAND.navy}15`,
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold" style={{ color: BRAND.navy }}>
                Character Board
              </h3>
              <p className="text-xs text-slate-500">
                {order.length} character{order.length !== 1 ? 's' : ''} · Drag to reorder
                {/* Debug: show current project */}
                <span className="ml-2 text-slate-400">(Project: {currentProjectId})</span>
              </p>
            </div>
            {discoveredCharacters.length > 0 && order.length === 0 && (
              <button
                onClick={() => setIsPanelExpanded(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: `${BRAND.gold}15`, color: BRAND.gold }}
              >
                Add characters from manuscript ↑
              </button>
            )}
          </div>

          <div className={gridCls}>
            {order.map((c, i) => (
              <DraggableCard
                key={c.id || `${c.name}-${i}`}
                index={i}
                c={c}
                move={move}
                onDropPersist={persistOrder}
                onRemove={removeFromBoard}
              />
            ))}
          </div>
          
          {order.length === 0 && (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                No characters on your board yet.
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {discoveredCharacters.length > 0 
                  ? "Add characters from the discovery panel above."
                  : "Tag characters in your chapters with @char: Name"}
              </p>
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-semibold text-sm mb-2" style={{ color: BRAND.navy }}>
            💡 How to tag characters
          </h4>
          <p className="text-sm text-slate-600">
            In your manuscript, tag characters by writing <code className="bg-white px-1.5 py-0.5 rounded border text-xs">@char: Grace Thompson</code> when they first appear or at key moments. 
            The Clothesline will automatically discover them and track where they appear.
          </p>
        </div>
      </div>

      {/* Mobile "Back to Landing" button */}
      <BackToLandingFab />
    </div>
  );
}
