// src/components/storylab/PriorityCards.jsx
// Genre-aware Priority Cards with project-switching support
// COMPLETE FILE - Replace your entire PriorityCards.jsx with this

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Target,
  AlertTriangle,
  Heart,
  Lock,
  Lightbulb,
  FileText,
  Quote,
  Eye,
  Music,
  Palette,
  Clock,
  Sparkles,
  BookOpen,
  ChevronDown,
  Search,
  Filter,
  BarChart3,
  RefreshCw,
  Loader2,
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
   GENRE CONFIGURATION
   ============================================ */
const GENRE_CONFIG = {
  fiction: {
    id: "fiction",
    label: "Fiction",
    icon: BookOpen,
    tagPattern: /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    entityLabel: "Character",
    entityPlural: "Characters",
    priorityTypes: [
      { key: "want", label: "Want", icon: Target, color: "#059669", description: "What the character desires" },
      { key: "fear", label: "Fear", icon: AlertTriangle, color: "#dc2626", description: "What the character dreads" },
      { key: "need", label: "Need", icon: Heart, color: "#7c3aed", description: "What the character truly needs" },
      { key: "secret", label: "Secret", icon: Lock, color: "#0284c7", description: "What the character hides" },
    ],
    aiPrompt: "Analyze this fiction manuscript for character wants, fears, needs, and secrets.",
  },
  nonfiction: {
    id: "nonfiction",
    label: "Non-Fiction",
    icon: FileText,
    tagPattern: /@topic:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    entityLabel: "Topic",
    entityPlural: "Topics",
    priorityTypes: [
      { key: "argument", label: "Argument", icon: Target, color: "#059669", description: "Key arguments to make" },
      { key: "evidence", label: "Evidence", icon: FileText, color: "#0284c7", description: "Supporting evidence needed" },
      { key: "counterpoint", label: "Counter-Point", icon: AlertTriangle, color: "#dc2626", description: "Objections to address" },
      { key: "keyquote", label: "Key Quote", icon: Quote, color: "#7c3aed", description: "Important quotations" },
    ],
    aiPrompt: "Analyze this non-fiction manuscript for key arguments, evidence needs, counter-points to address, and important quotes.",
  },
  poetry: {
    id: "poetry",
    label: "Poetry",
    icon: Sparkles,
    tagPattern: /@theme:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    entityLabel: "Theme",
    entityPlural: "Themes",
    priorityTypes: [
      { key: "image", label: "Image", icon: Eye, color: "#059669", description: "Visual imagery to develop" },
      { key: "sound", label: "Sound", icon: Music, color: "#7c3aed", description: "Sound patterns and rhythm" },
      { key: "emotion", label: "Emotion", icon: Heart, color: "#dc2626", description: "Emotional resonance" },
      { key: "symbol", label: "Symbol", icon: Palette, color: "#0284c7", description: "Symbolic elements" },
    ],
    aiPrompt: "Analyze this poetry for imagery, sound patterns, emotional resonance, and symbolic elements.",
  },
  memoir: {
    id: "memoir",
    label: "Memoir",
    icon: Clock,
    tagPattern: /@person:\s*([A-Za-z][A-Za-z\s.'-]*)/gi,
    entityLabel: "Person/Event",
    entityPlural: "People & Events",
    priorityTypes: [
      { key: "memory", label: "Memory", icon: Clock, color: "#059669", description: "Key memories to explore" },
      { key: "emotion", label: "Emotion", icon: Heart, color: "#dc2626", description: "Emotional truth to capture" },
      { key: "meaning", label: "Meaning", icon: Lightbulb, color: "#7c3aed", description: "Deeper significance" },
      { key: "connection", label: "Connection", icon: Target, color: "#0284c7", description: "Links to universal themes" },
    ],
    aiPrompt: "Analyze this memoir for key memories, emotional truths, deeper meanings, and universal connections.",
  },
};

/* ============================================
   PROJECT-AWARE STORAGE
   ============================================ */
const PRIORITIES_KEY_BASE = "dahtruth-priorities-v2";
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
const GENRE_KEY_BASE = "dahtruth-project-genre";

function getSelectedProjectId() {
  try {
    const stored = localStorage.getItem("dahtruth-selected-project-id");
    if (stored) return stored;
    const projectData = localStorage.getItem("dahtruth-project-store");
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

function loadPriorities() {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePriorities(data) {
  try {
    const key = getProjectKey(PRIORITIES_KEY_BASE);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event("project:change"));
  } catch (e) {
    console.error("[PriorityCards] Save failed:", e);
  }
}

function loadGenre() {
  try {
    const key = getProjectKey(GENRE_KEY_BASE);
    const raw = localStorage.getItem(key);
    return raw || "fiction";
  } catch {
    return "fiction";
  }
}

function saveGenre(genre) {
  try {
    const key = getProjectKey(GENRE_KEY_BASE);
    localStorage.setItem(key, genre);
    window.dispatchEvent(new Event("project:change"));
  } catch (e) {
    console.error("[PriorityCards] Genre save failed:", e);
  }
}

function loadStoryLabData() {
  try {
    const key = getProjectKey(STORYLAB_KEY_BASE);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
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

const uid = () =>
  crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;

/* ============================================
   PRIORITY CARD COMPONENT
   ============================================ */
function PriorityCard({ card, genreConfig, onEdit, onDelete, onDragStart, onDragOver, onDragEnd, isDragging }) {
  const typeConfig = genreConfig.priorityTypes.find((t) => t.key === card.type) || genreConfig.priorityTypes[0];
  const TypeIcon = typeConfig.icon;

  return (
    <div
      draggable
      onDragStart={() => onDragStart(card.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(card.id);
      }}
      onDragEnd={onDragEnd}
      className={`bg-white rounded-xl border-2 p-4 shadow-sm hover:shadow-md transition-all cursor-grab ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
      style={{ borderColor: `${typeConfig.color}30` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={14} className="text-slate-300" />
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}
          >
            <TypeIcon size={12} />
            {typeConfig.label}
          </div>
        </div>
        <button
          onClick={() => onDelete(card.id)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Entity */}
      {card.entity && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <span
            className="px-2 py-0.5 rounded-full"
            style={{ background: `${BRAND.navy}10`, color: BRAND.navy }}
          >
            {card.entity}
          </span>
        </div>
      )}

      {/* Content */}
      <textarea
        value={card.content || ""}
        onChange={(e) => onEdit(card.id, { content: e.target.value })}
        placeholder={typeConfig.description}
        className="w-full text-sm text-slate-700 bg-transparent border-none focus:outline-none resize-none min-h-[60px]"
      />

      {/* Priority */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <select
          value={card.priority || "Medium"}
          onChange={(e) => onEdit(card.id, { priority: e.target.value })}
          className="text-xs rounded-lg px-2 py-1 bg-slate-50 border border-slate-200 outline-none"
        >
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <input
            type="checkbox"
            checked={card.done || false}
            onChange={(e) => onEdit(card.id, { done: e.target.checked })}
            className="rounded"
          />
          Done
        </label>
      </div>
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function PriorityCards() {
  // Project tracking
  const [currentProjectId, setCurrentProjectId] = useState(getSelectedProjectId);
  const [priorities, setPriorities] = useState(() => loadPriorities());
  const [genre, setGenre] = useState(() => loadGenre());
  const [storyLabData, setStoryLabData] = useState(() => loadStoryLabData());

  // UI state
  const [filterType, setFilterType] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [showDone, setShowDone] = useState(true);
  const [draggingId, setDraggingId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const genreConfig = GENRE_CONFIG[genre] || GENRE_CONFIG.fiction;
  const chapters = storyLabData?.chapters || [];
  const entities = extractEntitiesFromChapters(chapters, genreConfig.tagPattern);
  const bookTitle = storyLabData?.book?.title || "Untitled";

  // Project switching
  useEffect(() => {
    const reloadAllData = () => {
      console.log(`[PriorityCards] Reloading for project: ${getSelectedProjectId()}`);
      setPriorities(loadPriorities());
      setGenre(loadGenre());
      setStoryLabData(loadStoryLabData());
      setFilterType("all");
      setFilterEntity("all");
      setDraggingId(null);
    };

    const handleProjectChange = () => {
      const newProjectId = getSelectedProjectId();
      if (newProjectId !== currentProjectId) {
        console.log(`[PriorityCards] Project switched: ${currentProjectId} → ${newProjectId}`);
        setCurrentProjectId(newProjectId);
        reloadAllData();
      }
    };

    const handleDataChange = () => {
      setStoryLabData(loadStoryLabData());
    };

    window.addEventListener("project:change", handleDataChange);
    window.addEventListener("storage", handleProjectChange);

    return () => {
      window.removeEventListener("project:change", handleDataChange);
      window.removeEventListener("storage", handleProjectChange);
    };
  }, [currentProjectId]);

  // Auto-save
  useEffect(() => {
    savePriorities(priorities);
  }, [priorities]);

  // Genre change handler
  const handleGenreChange = (newGenre) => {
    setGenre(newGenre);
    saveGenre(newGenre);
  };

  // Card operations
  const addCard = (type, entity = "") => {
    const newCard = {
      id: uid(),
      type,
      entity,
      content: "",
      priority: "Medium",
      done: false,
      createdAt: Date.now(),
    };
    setPriorities((prev) => [newCard, ...prev]);
  };

  const editCard = (id, updates) => {
    setPriorities((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCard = (id) => {
    setPriorities((prev) => prev.filter((c) => c.id !== id));
  };

  // Drag and drop
  const handleDragStart = (id) => setDraggingId(id);
  const handleDragEnd = () => setDraggingId(null);
  const handleDragOver = (overId) => {
    if (!draggingId || draggingId === overId) return;
    setPriorities((prev) => {
      const cards = [...prev];
      const fromIdx = cards.findIndex((c) => c.id === draggingId);
      const toIdx = cards.findIndex((c) => c.id === overId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = cards.splice(fromIdx, 1);
        cards.splice(toIdx, 0, moved);
      }
      return cards;
    });
  };

  // Filter cards
  const filteredCards = priorities.filter((card) => {
    if (!showDone && card.done) return false;
    if (filterType !== "all" && card.type !== filterType) return false;
    if (filterEntity !== "all" && card.entity !== filterEntity) return false;
    return true;
  });

  // Stats
  const stats = genreConfig.priorityTypes.map((type) => ({
    ...type,
    count: priorities.filter((c) => c.type === type.key && !c.done).length,
  }));

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
              Priority Cards
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

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div
          className="rounded-3xl p-8 mb-8 text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
          }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(80px)" }}
          />

          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
              >
                <BarChart3 size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Priority Cards</h1>
                <p className="text-white/70">
                  {bookTitle} · {priorities.length} cards
                </p>
                <p className="text-white/40 text-xs mt-1">Project: {currentProjectId}</p>
              </div>
            </div>

            {/* Genre Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/60 uppercase tracking-wide">Writing Type:</label>
              <select
                value={genre}
                onChange={(e) => handleGenreChange(e.target.value)}
                className="rounded-xl px-4 py-2 text-sm font-medium bg-white/20 text-white border border-white/30 outline-none cursor-pointer"
              >
                {Object.values(GENRE_CONFIG).map((g) => (
                  <option key={g.id} value={g.id} className="text-slate-800">
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <button
              key={stat.key}
              onClick={() => setFilterType(filterType === stat.key ? "all" : stat.key)}
              className={`rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                filterType === stat.key ? "scale-105 shadow-lg" : ""
              }`}
              style={{
                borderColor: filterType === stat.key ? stat.color : `${stat.color}30`,
                background: filterType === stat.key ? `${stat.color}10` : "white",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}15` }}
                >
                  <stat.icon size={20} style={{ color: stat.color }} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.count}
                  </p>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Filters & Add */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            {/* Entity Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={filterEntity}
                onChange={(e) => setFilterEntity(e.target.value)}
                className="text-sm rounded-lg px-3 py-2 border border-slate-200 bg-white outline-none"
              >
                <option value="all">All {genreConfig.entityPlural}</option>
                {entities.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Done Toggle */}
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showDone}
                onChange={(e) => setShowDone(e.target.checked)}
                className="rounded"
              />
              Show completed
            </label>
          </div>

          {/* Add Buttons */}
          <div className="flex items-center gap-2">
            {genreConfig.priorityTypes.map((type) => (
              <button
                key={type.key}
                onClick={() => addCard(type.key, filterEntity !== "all" ? filterEntity : "")}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: `${type.color}15`, color: type.color }}
              >
                <Plus size={14} />
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards Grid */}
        {filteredCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BarChart3 size={48} className="mx-auto mb-4" style={{ color: BRAND.mauve }} />
            <p className="text-slate-500 font-medium mb-2">No priority cards yet</p>
            <p className="text-sm text-slate-400">
              Add cards to track {genreConfig.entityLabel.toLowerCase()} priorities
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => (
              <PriorityCard
                key={card.id}
                card={card}
                genreConfig={genreConfig}
                onEdit={editCard}
                onDelete={deleteCard}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                isDragging={draggingId === card.id}
              />
            ))}
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between text-sm text-slate-500">
          <div>
            {priorities.filter((c) => c.done).length} of {priorities.length} completed
          </div>
          <div className="flex items-center gap-4">
            {entities.length > 0 && (
              <span>
                {entities.length} {genreConfig.entityPlural.toLowerCase()} found via tags
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

