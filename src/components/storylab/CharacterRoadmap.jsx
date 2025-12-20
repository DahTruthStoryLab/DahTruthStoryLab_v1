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
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import { runAssistant } from "../../lib/api";

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
   Extract character passages from chapters
---------------------------- */
function extractCharacterPassages(chapters = [], characterName) {
  if (!characterName) return [];
  
  const passages = [];
  const namePattern = new RegExp(characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const charTagPattern = new RegExp(`@char:\\s*${characterName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
  
  chapters.forEach((ch, idx) => {
    const content = ch.content || ch.text || ch.textHTML || "";
    const plainText = stripHtml(content);
    
    // Check if character is mentioned in this chapter
    if (namePattern.test(plainText) || charTagPattern.test(content)) {
      // Extract sentences/paragraphs containing the character
      const sentences = plainText.split(/[.!?]+/).filter(s => s.trim());
      const relevantSentences = sentences.filter(s => 
        namePattern.test(s) || s.toLowerCase().includes(characterName.toLowerCase())
      );
      
      if (relevantSentences.length > 0) {
        passages.push({
          chapterId: ch.id,
          chapterTitle: ch.title || `Chapter ${idx + 1}`,
          chapterIndex: idx + 1,
          excerpts: relevantSentences.slice(0, 5).map(s => s.trim()), // Limit to 5 excerpts per chapter
        });
      }
    }
  });
  
  return passages;
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
   AI Analysis Panel
---------------------------- */
const AnalysisPanel = ({ analysis, isOpen, onClose, characterName }) => {
  if (!isOpen || !analysis) return null;

  return (
    <div
      className="mb-6 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.95)",
        border: `1px solid ${BRAND.gold}40`,
        boxShadow: `0 4px 20px ${BRAND.gold}20`,
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{
          background: `linear-gradient(135deg, ${BRAND.navy}08 0%, ${BRAND.gold}12 100%)`,
          borderBottom: `1px solid ${BRAND.gold}20`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `${BRAND.gold}20` }}
          >
            <Wand2 size={20} style={{ color: BRAND.gold }} />
          </div>
          <div>
            <h3 className="font-bold" style={{ color: BRAND.navy }}>
              AI Analysis: {characterName}
            </h3>
            <p className="text-xs text-gray-500">Based on your chapter content</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-5">
        {/* Summary */}
        {analysis.summary && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <User size={16} style={{ color: BRAND.navy }} />
              <h4 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                Character Summary
              </h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
          </div>
        )}

        {/* Arc So Far */}
        {analysis.arcSoFar && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} style={{ color: BRAND.mauve }} />
              <h4 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                Arc So Far
              </h4>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.arcSoFar}</p>
          </div>
        )}

        {/* Suggested Directions */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={16} style={{ color: BRAND.gold }} />
              <h4 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                Where They Could Go Next
              </h4>
            </div>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                    style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
                  >
                    {idx + 1}
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Chapter Appearances */}
        {analysis.chapterAppearances && analysis.chapterAppearances.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText size={16} style={{ color: "#6b7280" }} />
              <h4 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                Appears In
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.chapterAppearances.map((ch, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ background: `${BRAND.navy}10`, color: BRAND.navy }}
                >
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------------------
   Character Selector (CENTERED)
---------------------------- */
const CharacterSelector = ({
  characters,
  storyCharacters,
  selectedId,
  onSelect,
  onAddCharacter,
  onImportCharacter,
  onAnalyzeCharacter,
  isAnalyzing,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selected = characters.find((c) => c.id === selectedId);

  // Characters from story that aren't in roadmap yet
  const unimportedChars = storyCharacters.filter(
    (name) => !characters.some((c) => c.name === name)
  );

  return (
    <div className="mb-6">
      {/* CENTERED row */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <label className="text-sm font-medium" style={{ color: BRAND.navy }}>
          Character:
        </label>
        <div className="relative w-64">
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
                  {characters.map((char) => (
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
                      {char.role && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {char.role}
                        </span>
                      )}
                    </button>
                  ))}

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
                          <span className="text-xs text-amber-600">Import</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Analyze Character Button */}
        <button
          onClick={onAnalyzeCharacter}
          disabled={!selected || isAnalyzing}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{
            background: selected ? `${BRAND.mauve}20` : "#f1f5f9",
            color: selected ? BRAND.navy : "#94a3b8",
            border: `1px solid ${selected ? BRAND.mauve + "40" : "#e2e8f0"}`,
          }}
        >
          {isAnalyzing ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Wand2 size={16} />
          )}
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>

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
          <input
            value={item.title}
            onChange={(e) => update(item.id, { title: e.target.value })}
            className="w-full text-base font-medium bg-transparent border-none outline-none focus:ring-0"
            style={{ color: BRAND.navy }}
            placeholder="Milestone title"
          />

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: BRAND.navy }}>
            {character.name}'s Arc
          </h3>
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
            description={`Start mapping ${character.name}'s journey by adding arc milestones.`}
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
                    {events.map(({ character, milestones }) => (
                      <div key={character.id} className="flex items-start gap-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                          style={{ background: `${BRAND.mauve}30` }}
                        >
                          <User size={12} style={{ color: BRAND.mauve }} />
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
                    ))}
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
            boxShadow: `0 4px 12px ${BRAND.gold}40`,
          }}
        >
          <Link2 size={16} />
          Add Relationship
        </button>
      </div>

      {/* Relationship web visual */}
      <div
        className="relative rounded-2xl p-8 min-h-[300px]"
        style={{
          background: "rgba(255, 255, 255, 0.7)",
          border: `1px solid ${BRAND.navy}10`,
        }}
      >
        <div className="relative w-full aspect-square max-w-md mx-auto">
          {characters.map((char, idx) => {
            const angle = (idx / characters.length) * 2 * Math.PI - Math.PI / 2;
            const radius = 40;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);

            return (
              <div
                key={char.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 100%)`,
                    border: `3px solid white`,
                  }}
                  title={char.name}
                >
                  <span className="text-white text-xs font-bold text-center px-1 truncate max-w-[50px]">
                    {char.name.split(" ")[0]}
                  </span>
                </div>
              </div>
            );
          })}

          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
            {relationships.map((rel) => {
              const char1Idx = characters.findIndex((c) => c.id === rel.from);
              const char2Idx = characters.findIndex((c) => c.id === rel.to);
              if (char1Idx === -1 || char2Idx === -1) return null;

              const angle1 = (char1Idx / characters.length) * 2 * Math.PI - Math.PI / 2;
              const angle2 = (char2Idx / characters.length) * 2 * Math.PI - Math.PI / 2;
              const radius = 40;

              const x1 = 50 + radius * Math.cos(angle1);
              const y1 = 50 + radius * Math.sin(angle1);
              const x2 = 50 + radius * Math.cos(angle2);
              const y2 = 50 + radius * Math.sin(angle2);

              const typeData = relationshipTypes.find((t) => t.id === rel.type) || relationshipTypes[5];

              return (
                <line
                  key={rel.id}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={typeData.color}
                  strokeWidth="2"
                  strokeDasharray={rel.type === "complex" ? "5,5" : "none"}
                  opacity="0.6"
                />
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {relationshipTypes.map((type) => (
            <div key={type.id} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ background: type.color }} />
              <span className="text-gray-600">{type.label}</span>
            </div>
          ))}
        </div>
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
            const isEditing = editingId === rel.id;

            return (
              <div
                key={rel.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: "rgba(255, 255, 255, 0.95)",
                  border: `1px solid ${typeData.color}30`,
                }}
              >
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={rel.from}
                        onChange={(e) => onUpdateRelationship(rel.id, { from: e.target.value })}
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ border: `1px solid ${BRAND.navy}20` }}
                      >
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={rel.to}
                        onChange={(e) => onUpdateRelationship(rel.id, { to: e.target.value })}
                        className="rounded-lg px-3 py-2 text-sm"
                        style={{ border: `1px solid ${BRAND.navy}20` }}
                      >
                        {characters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={rel.type}
                      onChange={(e) => onUpdateRelationship(rel.id, { type: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm"
                      style={{ border: `1px solid ${BRAND.navy}20` }}
                    >
                      {relationshipTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={rel.description || ""}
                      onChange={(e) => onUpdateRelationship(rel.id, { description: e.target.value })}
                      placeholder="Describe this relationship..."
                      className="w-full rounded-lg px-3 py-2 text-sm resize-none"
                      style={{ border: `1px solid ${BRAND.navy}20` }}
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg text-sm"
                        style={{ background: "#f1f5f9" }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
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
                        onClick={() => setEditingId(rel.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                      >
                        <Edit3 size={14} className="text-gray-400" />
                      </button>
                      <button
                        onClick={() => onRemoveRelationship(rel.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                )}
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
const GoalsView = ({ character, onUpdate }) => {
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

      {/* Arc Summary */}
      <div
        className="rounded-xl p-5"
        style={{
          background: `linear-gradient(135deg, ${BRAND.navy}08 0%, ${BRAND.gold}08 100%)`,
          border: `1px solid ${BRAND.navy}10`,
        }}
      >
        <h4 className="font-semibold mb-3" style={{ color: BRAND.navy }}>
          Arc Summary
        </h4>
        <div className="text-sm space-y-2" style={{ color: "#4b5563" }}>
          {goals.want && goals.need && (
            <p>
              <strong>{character.name}</strong> wants{" "}
              <em className="text-gray-700">{goals.want.toLowerCase()}</em>, but what they
              really need is <em className="text-gray-700">{goals.need.toLowerCase()}</em>.
            </p>
          )}
          {goals.lie && goals.truth && (
            <p>
              They believe <em className="text-gray-700">{goals.lie.toLowerCase()}</em>, but
              must learn that <em className="text-gray-700">{goals.truth.toLowerCase()}</em>.
            </p>
          )}
          {goals.fear && goals.flaw && (
            <p>
              Their fear of <em className="text-gray-700">{goals.fear.toLowerCase()}</em> and
              their <em className="text-gray-700">{goals.flaw.toLowerCase()}</em> stand in
              their way.
            </p>
          )}
          {goals.stakes && (
            <p>
              If they fail, <em className="text-gray-700">{goals.stakes.toLowerCase()}</em>.
            </p>
          )}
          {!goals.want && !goals.need && !goals.lie && !goals.fear && (
            <p className="italic text-gray-400">
              Fill in the fields above to generate an arc summary.
            </p>
          )}
        </div>
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
  
  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Extract characters from story chapters using @char: pattern
  const storyCharacters = useMemo(() => {
    if (!storyLabData?.chapters) return [];
    return extractCharactersFromChapters(storyLabData.chapters);
  }, [storyLabData]);

  // Roadmap characters (with milestones and goals)
  const characters = roadmapData.characters || [];
  const relationships = roadmapData.relationships || [];
  const chapters = storyLabData?.chapters || [];
  const bookTitle = storyLabData?.book?.title || "Untitled";

  // Selected character
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId);
  const selectedMilestones = selectedCharacter?.milestones || [];

  // Auto-select first character if none selected
  useEffect(() => {
    if (!selectedCharacterId && characters.length > 0) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);

  // Listen for project changes
  useEffect(() => {
    const handleChange = () => {
      setStoryLabData(loadStoryLabData());
      setRoadmapData(loadRoadmapData());
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
        role: "",
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
        role: "",
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

  // AI Character Analysis
  const analyzeCharacter = async () => {
    if (!selectedCharacter || !chapters.length) return;
    
    setIsAnalyzing(true);
    setShowAnalysis(false);
    
    try {
      // Extract passages where this character appears
      const passages = extractCharacterPassages(chapters, selectedCharacter.name);
      
      // Build context for AI
      const chapterAppearances = passages.map(p => p.chapterTitle);
      const excerptText = passages
        .map(p => `[${p.chapterTitle}]: ${p.excerpts.join(" ... ")}`)
        .join("\n\n")
        .slice(0, 3000); // Limit context size
      
      // Get existing goals if any
      const goalsContext = selectedCharacter.goals 
        ? Object.entries(selectedCharacter.goals)
            .filter(([k, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")
        : "";
      
      const prompt = `Analyze this character from a fiction manuscript:

CHARACTER NAME: ${selectedCharacter.name}
${selectedCharacter.role ? `ROLE: ${selectedCharacter.role}` : ""}
${goalsContext ? `AUTHOR'S NOTES: ${goalsContext}` : ""}

EXCERPTS FROM THE STORY:
${excerptText || "No specific excerpts found - character may be newly introduced."}

Please provide:
1. CHARACTER SUMMARY: A 2-3 sentence summary of who this character is based on their appearances
2. ARC SO FAR: What has happened to this character emotionally/narratively across the chapters they appear in?
3. SUGGESTED DIRECTIONS: Give 3 specific, actionable suggestions for where this character's arc could go next. Consider unresolved tensions, growth opportunities, and narrative potential.

Respond in this exact JSON format:
{
  "summary": "...",
  "arcSoFar": "...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

      const result = await runAssistant(prompt, "clarify", "", "anthropic");
      
      // Parse the response
      let parsed = null;
      const responseText = result?.result || result?.text || result?.output || result || "";
      
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Failed to parse AI response as JSON:", e);
        }
      }
      
      // If parsing failed, create a structured response from the text
      if (!parsed) {
        parsed = {
          summary: "Analysis completed. See the AI response for details.",
          arcSoFar: responseText,
          suggestions: ["Review the character's core motivation", "Consider adding a pivotal scene", "Explore relationships with other characters"],
        };
      }
      
      // Add chapter appearances
      parsed.chapterAppearances = chapterAppearances;
      
      setAnalysisResult(parsed);
      setShowAnalysis(true);
      
    } catch (error) {
      console.error("Character analysis failed:", error);
      alert("Failed to analyze character. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
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
          <>
            <CharacterSelector
              characters={characters}
              storyCharacters={storyCharacters}
              selectedId={selectedCharacterId}
              onSelect={(id) => {
                setSelectedCharacterId(id);
                setShowAnalysis(false); // Hide analysis when switching characters
              }}
              onAddCharacter={addCharacter}
              onImportCharacter={importCharacter}
              onAnalyzeCharacter={analyzeCharacter}
              isAnalyzing={isAnalyzing}
            />
            
            {/* AI Analysis Panel */}
            <AnalysisPanel
              analysis={analysisResult}
              isOpen={showAnalysis}
              onClose={() => setShowAnalysis(false)}
              characterName={selectedCharacter?.name}
            />
          </>
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
            <GoalsView character={selectedCharacter} onUpdate={updateCharacter} />
          )}
        </div>
      </div>
    </div>
  );
}
