// src/components/storylab/Clothesline.jsx
// FIXED: Uses storage service (not localStorage directly)
// Supports Fiction, Non-Fiction, Poetry, and Memoir with genre-specific terminology

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
  ArrowLeft,
  FileText,
  Feather,
  BookMarked,
  Layers,
  Image,
  Clock,
  MessageSquare,
  GripVertical,
} from "lucide-react";
import { storage } from "../../lib/storage/storage";

/* ---------------------------
   Brand Colors
---------------------------- */
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

/* ---------------------------
   GENRE CONFIGURATIONS
---------------------------- */
const GENRE_CONFIG = {
  fiction: {
    id: "fiction",
    label: "Fiction",
    icon: BookOpen,
    pageTitle: "Clothesline",
    pageSubtitle: "View characters from your manuscript · Drag to reorder · Build your cast",
    entityLabel: "Character",
    entityLabelPlural: "Characters",
    boardTitle: "Character Board",
    tagPattern: /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag characters in your chapters with @char: Name",
    tagExample: "@char: Grace Thompson",
    emptyBoardMessage: "No characters on your board yet.",
    discoveryTitle: "Characters in Your Manuscript",
    roleOptions: [
      { id: "protagonist", label: "Protagonist" },
      { id: "antagonist", label: "Antagonist" },
      { id: "supporting", label: "Supporting" },
      { id: "minor", label: "Minor" },
    ],
  },
  nonfiction: {
    id: "nonfiction",
    label: "Non-Fiction",
    icon: FileText,
    pageTitle: "Topic Board",
    pageSubtitle: "Organize key topics and arguments · Drag to reorder · Build your structure",
    entityLabel: "Topic",
    entityLabelPlural: "Topics",
    boardTitle: "Topic Board",
    tagPattern: /@topic:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag key topics with @topic: Subject Name",
    tagExample: "@topic: Climate Policy",
    emptyBoardMessage: "No topics on your board yet.",
    discoveryTitle: "Topics in Your Manuscript",
    roleOptions: [
      { id: "protagonist", label: "Main Thesis" },
      { id: "antagonist", label: "Counter-Argument" },
      { id: "supporting", label: "Supporting Point" },
      { id: "minor", label: "Background" },
    ],
  },
  poetry: {
    id: "poetry",
    label: "Poetry",
    icon: Feather,
    pageTitle: "Image Board",
    pageSubtitle: "Organize themes and imagery · Drag to reorder · Build your collection",
    entityLabel: "Theme/Image",
    entityLabelPlural: "Themes & Images",
    boardTitle: "Theme & Image Board",
    tagPattern: /@theme:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag themes with @theme: Theme Name",
    tagExample: "@theme: Loss and Renewal",
    emptyBoardMessage: "No themes on your board yet.",
    discoveryTitle: "Themes in Your Manuscript",
    roleOptions: [
      { id: "protagonist", label: "Central Image" },
      { id: "antagonist", label: "Counter-Image" },
      { id: "supporting", label: "Motif" },
      { id: "minor", label: "Detail" },
    ],
  },
  memoir: {
    id: "memoir",
    label: "Memoir",
    icon: BookMarked,
    pageTitle: "People & Events",
    pageSubtitle: "Map key figures and moments · Drag to reorder · Build your story",
    entityLabel: "Person/Event",
    entityLabelPlural: "People & Events",
    boardTitle: "People & Events Board",
    tagPattern: /@person:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    tagInstruction: "Tag key people with @person: Name",
    tagExample: "@person: Grandmother Rose",
    emptyBoardMessage: "No people or events on your board yet.",
    discoveryTitle: "People in Your Manuscript",
    roleOptions: [
      { id: "protagonist", label: "Past Self" },
      { id: "antagonist", label: "Catalyst" },
      { id: "supporting", label: "Key Figure" },
      { id: "minor", label: "Background" },
    ],
  },
};

/* ---------------------------
   BASE Storage keys
---------------------------- */
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const GENRE_KEY_BASE = "dahtruth-project-genre";
const CLOTHESLINE_KEY_BASE = "dahtruth-clothesline-v2";

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

function loadClotheslineData() {
  try {
    const key = getProjectKey(CLOTHESLINE_KEY_BASE);
    const raw = storage.getItem(key);
    if (!raw) return { characters: [] };
    return JSON.parse(raw);
  } catch {
    return { characters: [] };
  }
}

function saveClotheslineData(data) {
  try {
    const key = getProjectKey(CLOTHESLINE_KEY_BASE);
    storage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
    return true;
  } catch (e) {
    console.error("[Clothesline] Save failed:", e);
    return false;
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
  const entityMap = new Map();

  chapters.forEach((ch) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    const chapterTitle = ch.title || "Untitled Chapter";
    const regex = new RegExp(pattern.source, pattern.flags);
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      if (name) {
        if (!entityMap.has(name)) {
          entityMap.set(name, { mentions: 0, chapters: new Set() });
        }
        const data = entityMap.get(name);
        data.mentions += 1;
        data.chapters.add(chapterTitle);
      }
    }
  });

  return Array.from(entityMap.entries())
    .map(([name, data]) => ({
      name,
      mentions: data.mentions,
      chapters: Array.from(data.chapters),
    }))
    .sort((a, b) => b.mentions - a.mentions);
}

/* ---------------------------
   Page banner
---------------------------- */
const PageBanner = ({ genreConfig, currentProjectId }) => {
  const Icon = genreConfig.icon;
  
  return (
    <div 
      className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: "blur(80px)" }} />
      
      <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
          >
            <Icon size={32} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{genreConfig.pageTitle}</h1>
            <p className="text-white/70">{genreConfig.pageSubtitle}</p>
            <p className="text-white/50 text-xs mt-1">Project: {currentProjectId}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span 
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}
          >
            {genreConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------
   Entity Card (on the board)
---------------------------- */
function EntityCard({ entity, onRemove, genreConfig, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const roleOption = genreConfig.roleOptions.find(r => r.id === entity.role);
  
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragEnd={onDragEnd}
      className={`rounded-xl border-2 bg-white p-4 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
      style={{ borderColor: `${BRAND.navy}20` }}
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300" />
          <div 
            className="rounded-lg p-2 flex-shrink-0"
            style={{ background: `${BRAND.mauve}20` }}
          >
            <User className="h-5 w-5" style={{ color: BRAND.mauve }} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: BRAND.navy }}>
            {entity.name || "Unnamed"}
          </div>
          {roleOption && (
            <span 
              className="inline-block text-xs mt-1 px-2 py-0.5 rounded-full"
              style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
            >
              {roleOption.label}
            </span>
          )}
          {entity.mentions && (
            <div className="text-xs text-slate-400 mt-1">
              {entity.mentions} mention{entity.mentions !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {onRemove && (
          <button
            onClick={() => onRemove(entity.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            title="Remove from board"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
          </button>
        )}
      </div>
      
      {entity.rel && (
        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
          {entity.rel}
        </div>
      )}
      
      {entity.traits && entity.traits.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entity.traits.map((t) => (
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
      
      {entity.chapters && entity.chapters.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 mb-1">Appears in:</div>
          <div className="flex flex-wrap gap-1">
            {entity.chapters.slice(0, 3).map((ch, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
              >
                {ch.length > 20 ? ch.slice(0, 20) + "..." : ch}
              </span>
            ))}
            {entity.chapters.length > 3 && (
              <span className="text-[10px] text-slate-400">
                +{entity.chapters.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Entity Discovery Panel
---------------------------- */
function EntityDiscoveryPanel({ 
  discoveredEntities, 
  boardEntities, 
  onAddToBoard,
  isExpanded,
  onToggle,
  genreConfig,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const boardNames = new Set(boardEntities.map(e => e.name?.toLowerCase()));
  const availableEntities = discoveredEntities.filter(
    e => !boardNames.has(e.name.toLowerCase())
  );
  
  const filteredEntities = searchTerm
    ? availableEntities.filter(e => 
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableEntities;

  return (
    <div 
      className="rounded-2xl border overflow-hidden mb-6"
      style={{ 
        background: "rgba(255, 255, 255, 0.9)",
        borderColor: `${BRAND.navy}15`,
      }}
    >
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
              {genreConfig.discoveryTitle}
            </h3>
            <p className="text-xs text-slate-500">
              {discoveredEntities.length} {genreConfig.entityLabelPlural.toLowerCase()} found via tags
              {availableEntities.length > 0 && (
                <span className="ml-1">
                  · {availableEntities.length} not on board yet
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {availableEntities.length > 0 && (
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
            >
              {availableEntities.length} available
            </span>
          )}
          {isExpanded ? (
            <ChevronUp size={20} className="text-slate-400" />
          ) : (
            <ChevronDown size={20} className="text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 border-t border-slate-100">
          {discoveredEntities.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 text-sm">
                No {genreConfig.entityLabelPlural.toLowerCase()} found yet.
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {genreConfig.tagInstruction}
              </p>
              <Link 
                to="/compose" 
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium"
                style={{ color: BRAND.gold }}
              >
                Go to Writer <ArrowRight size={14} />
              </Link>
            </div>
          ) : availableEntities.length === 0 ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-emerald-400 mb-2" />
              <p className="text-slate-500 text-sm">
                All discovered {genreConfig.entityLabelPlural.toLowerCase()} are on your board!
              </p>
            </div>
          ) : (
            <>
              <div className="relative mt-4 mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${genreConfig.entityLabelPlural.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  style={{ 
                    background: "white",
                    border: `1px solid ${BRAND.navy}15`,
                  }}
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredEntities.map((entity, idx) => (
                  <div
                    key={entity.name}
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
                          {entity.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {entity.mentions} mention{entity.mentions !== 1 ? "s" : ""} in {entity.chapters.length} chapter{entity.chapters.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => onAddToBoard(entity)}
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
                
                {filteredEntities.length === 0 && searchTerm && (
                  <div className="text-center py-4 text-slate-400 text-sm">
                    No {genreConfig.entityLabelPlural.toLowerCase()} match "{searchTerm}"
                  </div>
                )}
              </div>

              {filteredEntities.length > 1 && (
                <button
                  onClick={() => filteredEntities.forEach(e => onAddToBoard(e))}
                  className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{ 
                    background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyLight})`,
                  }}
                >
                  Add All {filteredEntities.length} {genreConfig.entityLabelPlural} to Board
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
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [genre, setGenre] = useState(() => loadProjectGenre());
  const [clotheslineData, setClotheslineData] = useState(() => loadClotheslineData());
  const [chapters, setChapters] = useState(() => loadChapters());
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [draggingIndex, setDraggingIndex] = useState(null);

  const genreConfig = GENRE_CONFIG[genre] || GENRE_CONFIG.fiction;
  const boardEntities = clotheslineData.characters || [];

  // Listen for project changes
  useEffect(() => {
    const reloadAllData = () => {
      const pid = getSelectedProjectId();
      console.log(`[Clothesline] Reloading data for project: ${pid}`);
      setGenre(loadProjectGenre());
      setChapters(loadChapters());
      setClotheslineData(loadClotheslineData());
    };

    const handleProjectChange = () => {
      const newProjectId = getSelectedProjectId();
      if (newProjectId !== currentProjectId) {
        console.log(`[Clothesline] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };
    
    const handleDataChange = () => {
      setChapters(loadChapters());
      setGenre(loadProjectGenre());
    };
    
    window.addEventListener("project:change", handleProjectChange);
    window.addEventListener("storage", handleProjectChange);
    
    return () => {
      window.removeEventListener("project:change", handleProjectChange);
      window.removeEventListener("storage", handleProjectChange);
    };
  }, [currentProjectId]);

  // Discover entities from tags
  const discoveredEntities = useMemo(() => {
    return extractEntitiesFromChapters(chapters, genreConfig.tagPattern);
  }, [chapters, genreConfig.tagPattern]);

  // Add entity to board
  const addToBoard = useCallback((entity) => {
    const exists = boardEntities.some(
      e => e.name?.toLowerCase() === entity.name?.toLowerCase()
    );
    if (exists) return;
    
    const newEntity = {
      id: uid(),
      name: entity.name,
      role: "",
      rel: "",
      traits: [],
      mentions: entity.mentions,
      chapters: entity.chapters,
    };
    
    const newData = {
      ...clotheslineData,
      characters: [...boardEntities, newEntity],
    };
    
    setClotheslineData(newData);
    saveClotheslineData(newData);
  }, [boardEntities, clotheslineData]);

  // Remove entity from board
  const removeFromBoard = useCallback((id) => {
    const newData = {
      ...clotheslineData,
      characters: boardEntities.filter(e => e.id !== id),
    };
    
    setClotheslineData(newData);
    saveClotheslineData(newData);
  }, [boardEntities, clotheslineData]);

  // Drag and drop
  const handleDragStart = useCallback((index) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((overIndex) => {
    if (draggingIndex === null || draggingIndex === overIndex) return;
    
    const newEntities = [...boardEntities];
    const [moved] = newEntities.splice(draggingIndex, 1);
    newEntities.splice(overIndex, 0, moved);
    
    const newData = { ...clotheslineData, characters: newEntities };
    setClotheslineData(newData);
    setDraggingIndex(overIndex);
  }, [draggingIndex, boardEntities, clotheslineData]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    saveClotheslineData(clotheslineData);
  }, [clotheslineData]);

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <ArrowLeft size={16} /> Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              {genreConfig.pageTitle}
            </span>
          </div>
          <Link
            to="/story-lab/workshop"
            className="rounded-xl px-3 py-2 text-sm font-medium text-white hover:scale-105 transition-all"
            style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
          >
            Workshop Hub
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <PageBanner genreConfig={genreConfig} currentProjectId={currentProjectId} />

        <EntityDiscoveryPanel
          discoveredEntities={discoveredEntities}
          boardEntities={boardEntities}
          onAddToBoard={addToBoard}
          isExpanded={isPanelExpanded}
          onToggle={() => setIsPanelExpanded(!isPanelExpanded)}
          genreConfig={genreConfig}
        />

        {/* Board */}
        <div 
          className="rounded-2xl border bg-white/90 backdrop-blur p-6"
          style={{ borderColor: `${BRAND.navy}15` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold" style={{ color: BRAND.navy }}>
                {genreConfig.boardTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {boardEntities.length} {genreConfig.entityLabel.toLowerCase()}{boardEntities.length !== 1 ? "s" : ""} · Drag to reorder
              </p>
            </div>
            {discoveredEntities.length > 0 && boardEntities.length === 0 && (
              <button
                onClick={() => setIsPanelExpanded(true)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{ background: `${BRAND.gold}15`, color: BRAND.gold }}
              >
                Add {genreConfig.entityLabelPlural.toLowerCase()} from manuscript ↑
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {boardEntities.map((entity, i) => (
              <EntityCard
                key={entity.id || `${entity.name}-${i}`}
                entity={entity}
                onRemove={removeFromBoard}
                genreConfig={genreConfig}
                onDragStart={() => handleDragStart(i)}
                onDragOver={() => handleDragOver(i)}
                onDragEnd={handleDragEnd}
                isDragging={draggingIndex === i}
              />
            ))}
          </div>
          
          {boardEntities.length === 0 && (
            <div className="text-center py-12">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">
                {genreConfig.emptyBoardMessage}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {discoveredEntities.length > 0 
                  ? `Add ${genreConfig.entityLabelPlural.toLowerCase()} from the discovery panel above.`
                  : genreConfig.tagInstruction}
              </p>
            </div>
          )}
        </div>

        {/* Helper text */}
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-semibold text-sm mb-2" style={{ color: BRAND.navy }}>
            💡 How to tag {genreConfig.entityLabelPlural.toLowerCase()}
          </h4>
          <p className="text-sm text-slate-600">
            In your manuscript, {genreConfig.tagInstruction.toLowerCase()}. For example:{" "}
            <code className="bg-white px-1.5 py-0.5 rounded border text-xs">{genreConfig.tagExample}</code>
          </p>
        </div>
      </div>
    </div>
  );
}

