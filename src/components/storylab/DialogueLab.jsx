// src/components/storylab/DialogueLab.jsx
// Dialogue Lab - Write, Analyze, and Enhance Character Dialogue

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  MessageSquare,
  Users,
  BookOpen,
  Sparkles,
  Zap,
  RefreshCw,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Eye,
  EyeOff,
  Target,
  Heart,
  Shield,
  HelpCircle,
  Copy,
  Wand2,
  Search,
  X,
  FileText,
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
   Role Colors (matching NarrativeArc)
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

/* ============================================
   Storage Keys
   ============================================ */
const DIALOGUE_LAB_KEY_BASE = "dahtruth-dialogue-lab-v1";
const STORYLAB_KEY_BASE = "dahtruth-story-lab-toc-v3";
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
  } catch {}
};

function loadChapters() {
  const key = getProjectKey(STORYLAB_KEY_BASE);
  const data = loadLocal(key, null);
  return data?.chapters || [];
}

function loadCharacters() {
  const key = getProjectKey(ARC_CHARS_KEY_BASE);
  return loadLocal(key, []);
}

function loadDialogueSessions() {
  const key = getProjectKey(DIALOGUE_LAB_KEY_BASE);
  return loadLocal(key, []);
}

function saveDialogueSessions(sessions) {
  const key = getProjectKey(DIALOGUE_LAB_KEY_BASE);
  saveLocal(key, sessions);
}

const uid = () => crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`;

function getInitials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ============================================
   AI Analysis Hook (mock - can connect to real API)
   ============================================ */
function useDialogueAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeDialogue = async (dialogue, characterA, characterB, stakes) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{
            role: "user",
            content: `You are a dialogue coach for fiction writers. Analyze this dialogue between two characters.

CHARACTER A: ${characterA.name} (${characterA.role})
- WANTS: ${stakes.characterA.wants || "Not specified"}
- HIDING: ${stakes.characterA.hiding || "Not specified"}

CHARACTER B: ${characterB.name} (${characterB.role})
- WANTS: ${stakes.characterB.wants || "Not specified"}
- HIDING: ${stakes.characterB.hiding || "Not specified"}

DIALOGUE:
${dialogue}

Provide analysis in this exact JSON format:
{
  "overallScore": 1-10,
  "strengths": ["strength 1", "strength 2"],
  "issues": [
    {"type": "on-the-nose", "line": "the problematic line", "suggestion": "how to fix it"},
    {"type": "voice", "line": "line where voice slips", "suggestion": "how to fix it"}
  ],
  "subtextNotes": "What's happening beneath the surface",
  "powerDynamics": "Who has power and how it shifts",
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Respond ONLY with the JSON, no other text.`
          }]
        })
      });
      
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setIsLoading(false);
      return parsed;
    } catch (err) {
      console.error("AI Analysis error:", err);
      setError("Failed to analyze dialogue. Please try again.");
      setIsLoading(false);
      return null;
    }
  };

  const enhanceDialogue = async (dialogue, characterA, characterB, stakes, instruction) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `You are a dialogue coach for fiction writers. Enhance this dialogue.

CHARACTER A: ${characterA.name} (${characterA.role})
- WANTS: ${stakes.characterA.wants || "Not specified"}
- HIDING: ${stakes.characterA.hiding || "Not specified"}

CHARACTER B: ${characterB.name} (${characterB.role})
- WANTS: ${stakes.characterB.wants || "Not specified"}
- HIDING: ${stakes.characterB.hiding || "Not specified"}

ORIGINAL DIALOGUE:
${dialogue}

INSTRUCTION: ${instruction || "Enhance the subtext, make it less on-the-nose, and ensure each character has a distinct voice."}

Provide the enhanced dialogue. Keep the same format and approximate length. Just output the enhanced dialogue, nothing else.`
          }]
        })
      });
      
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      setIsLoading(false);
      return text;
    } catch (err) {
      console.error("AI Enhancement error:", err);
      setError("Failed to enhance dialogue. Please try again.");
      setIsLoading(false);
      return null;
    }
  };

  const generateDialogue = async (characterA, characterB, stakes, sceneContext) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [{
            role: "user",
            content: `You are a fiction writer. Generate a dialogue scene between two characters.

CHARACTER A: ${characterA.name} (${characterA.role})
- WANTS: ${stakes.characterA.wants || "Something from the other character"}
- HIDING: ${stakes.characterA.hiding || "Their true feelings"}
- Notes: ${characterA.notes || "None"}

CHARACTER B: ${characterB.name} (${characterB.role})
- WANTS: ${stakes.characterB.wants || "Something from the other character"}
- HIDING: ${stakes.characterB.hiding || "Their true feelings"}
- Notes: ${characterB.notes || "None"}

SCENE CONTEXT:
Location: ${sceneContext.location || "Not specified"}
What just happened: ${sceneContext.justHappened || "Not specified"}

Write a compelling dialogue scene (10-15 exchanges) that:
- Shows conflict through subtext
- Gives each character a distinct voice
- Builds tension
- Reveals character through what they DON'T say

Format as:
${characterA.name}: "dialogue"
${characterB.name}: "dialogue"

Just output the dialogue, nothing else.`
          }]
        })
      });
      
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      setIsLoading(false);
      return text;
    } catch (err) {
      console.error("AI Generation error:", err);
      setError("Failed to generate dialogue. Please try again.");
      setIsLoading(false);
      return null;
    }
  };

  return { analyzeDialogue, enhanceDialogue, generateDialogue, isLoading, error };
}

/* ============================================
   Character Selector Component
   ============================================ */
function CharacterSelector({ characters, selectedId, onSelect, label, exclude }) {
  const available = characters.filter(c => c.id !== exclude);
  const selected = characters.find(c => c.id === selectedId);
  const roleColor = selected ? (ROLE_COLORS[selected.role] || ROLE_COLORS["Character"]) : null;

  return (
    <div>
      <label className="text-xs uppercase tracking-wider font-bold mb-2 block" style={{ color: BRAND.navy }}>
        {label}
      </label>
      {selected ? (
        <div 
          className="rounded-xl p-3 flex items-center gap-3"
          style={{ background: `${roleColor.bg}15`, border: `2px solid ${roleColor.bg}30` }}
        >
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: roleColor.bg, color: roleColor.text }}
          >
            {getInitials(selected.name)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm" style={{ color: BRAND.navy }}>{selected.name}</p>
            <p className="text-xs text-slate-500">{selected.role}</p>
          </div>
          <button
            onClick={() => onSelect(null)}
            className="p-1.5 rounded-lg hover:bg-white/50 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <select
          value=""
          onChange={(e) => onSelect(e.target.value)}
          className="w-full text-sm rounded-xl px-4 py-3 border-2 border-dashed border-slate-300 bg-white outline-none"
        >
          <option value="">Select a character...</option>
          {available.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
          ))}
        </select>
      )}
    </div>
  );
}

/* ============================================
   Stakes Input Component
   ============================================ */
function StakesInput({ character, stakes, onChange }) {
  if (!character) return null;
  const roleColor = ROLE_COLORS[character.role] || ROLE_COLORS["Character"];

  return (
    <div 
      className="rounded-xl p-4"
      style={{ background: `${roleColor.bg}08`, border: `2px solid ${roleColor.bg}20` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: roleColor.bg, color: roleColor.text }}
        >
          {getInitials(character.name)}
        </div>
        <span className="font-bold text-sm" style={{ color: BRAND.navy }}>{character.name}'s Stakes</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium flex items-center gap-1">
            <Target size={10} /> What do they WANT in this scene?
          </label>
          <input
            value={stakes.wants || ""}
            onChange={(e) => onChange({ ...stakes, wants: e.target.value })}
            placeholder="Their goal, desire, or need..."
            className="w-full mt-1 text-sm rounded-lg px-3 py-2 bg-white border border-slate-200 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium flex items-center gap-1">
            <EyeOff size={10} /> What are they HIDING?
          </label>
          <input
            value={stakes.hiding || ""}
            onChange={(e) => onChange({ ...stakes, hiding: e.target.value })}
            placeholder="Secret, fear, vulnerability..."
            className="w-full mt-1 text-sm rounded-lg px-3 py-2 bg-white border border-slate-200 outline-none"
          />
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Analysis Results Component
   ============================================ */
function AnalysisResults({ analysis, onClose }) {
  if (!analysis) return null;

  const scoreColor = analysis.overallScore >= 7 ? "#059669" : analysis.overallScore >= 5 ? BRAND.gold : "#dc2626";

  return (
    <div 
      className="rounded-2xl p-6 mb-6"
      style={{ background: `linear-gradient(135deg, ${BRAND.mauve}15 0%, ${BRAND.rose}15 100%)`, border: `2px solid ${BRAND.mauve}30` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Sparkles size={20} style={{ color: BRAND.gold }} />
          <h3 className="font-bold" style={{ color: BRAND.navy }}>AI Analysis</h3>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1 rounded-full text-sm font-bold"
            style={{ background: scoreColor, color: "#fff" }}
          >
            Score: {analysis.overallScore}/10
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/50">
            <X size={16} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Strengths */}
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2 flex items-center gap-1">
            <CheckCircle size={12} /> Strengths
          </h4>
          <ul className="space-y-1">
            {analysis.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-green-500 mt-1">•</span> {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Issues */}
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-2 flex items-center gap-1">
            <AlertCircle size={12} /> Issues to Address
          </h4>
          {analysis.issues?.length > 0 ? (
            <ul className="space-y-2">
              {analysis.issues.map((issue, i) => (
                <li key={i} className="text-sm">
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{issue.type}</span>
                  <p className="text-slate-500 mt-1 text-xs italic">"{issue.line}"</p>
                  <p className="text-slate-600 mt-1">→ {issue.suggestion}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">No major issues found!</p>
          )}
        </div>
      </div>

      {/* Subtext & Power */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: BRAND.navy }}>
            <Eye size={12} /> Subtext
          </h4>
          <p className="text-sm text-slate-600">{analysis.subtextNotes}</p>
        </div>
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: BRAND.navy }}>
            <Shield size={12} /> Power Dynamics
          </h4>
          <p className="text-sm text-slate-600">{analysis.powerDynamics}</p>
        </div>
      </div>

      {/* Suggestions */}
      {analysis.suggestions?.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <h4 className="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1" style={{ color: BRAND.gold }}>
            <Lightbulb size={12} /> Suggestions
          </h4>
          <ul className="space-y-1">
            {analysis.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                <span style={{ color: BRAND.gold }} className="mt-1">→</span> {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================================
   Main Component
   ============================================ */
export default function DialogueLab() {
  const [characters, setCharacters] = useState(() => loadCharacters());
  const [chapters, setChapters] = useState(() => loadChapters());
  const [sessions, setSessions] = useState(() => loadDialogueSessions());
  
  // Current session state
  const [selectedChapterIdx, setSelectedChapterIdx] = useState(null);
  const [characterAId, setCharacterAId] = useState(null);
  const [characterBId, setCharacterBId] = useState(null);
  const [stakesA, setStakesA] = useState({ wants: "", hiding: "" });
  const [stakesB, setStakesB] = useState({ wants: "", hiding: "" });
  const [sceneContext, setSceneContext] = useState({ location: "", justHappened: "" });
  const [dialogue, setDialogue] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const { analyzeDialogue, enhanceDialogue, generateDialogue, isLoading, error } = useDialogueAI();

  const characterA = characters.find(c => c.id === characterAId);
  const characterB = characters.find(c => c.id === characterBId);
  const selectedChapter = selectedChapterIdx !== null ? chapters[selectedChapterIdx] : null;

  // Save sessions when they change
  useEffect(() => {
    saveDialogueSessions(sessions);
  }, [sessions]);

  // Reload data on project switch
  useEffect(() => {
    const handleSwitch = () => {
      setCharacters(loadCharacters());
      setChapters(loadChapters());
      setSessions(loadDialogueSessions());
    };
    window.addEventListener("project:switch", handleSwitch);
    window.addEventListener("storage", handleSwitch);
    return () => {
      window.removeEventListener("project:switch", handleSwitch);
      window.removeEventListener("storage", handleSwitch);
    };
  }, []);

  const handleAnalyze = async () => {
    if (!characterA || !characterB || !dialogue.trim()) return;
    const result = await analyzeDialogue(dialogue, characterA, characterB, { characterA: stakesA, characterB: stakesB });
    if (result) setAnalysis(result);
  };

  const handleEnhance = async () => {
    if (!characterA || !characterB || !dialogue.trim()) return;
    const result = await enhanceDialogue(dialogue, characterA, characterB, { characterA: stakesA, characterB: stakesB });
    if (result) setDialogue(result);
  };

  const handleGenerate = async () => {
    if (!characterA || !characterB) return;
    const result = await generateDialogue(characterA, characterB, { characterA: stakesA, characterB: stakesB }, sceneContext);
    if (result) setDialogue(result);
  };

  const handleSaveSession = () => {
    const session = {
      id: uid(),
      createdAt: new Date().toISOString(),
      chapterIdx: selectedChapterIdx,
      characterAId,
      characterBId,
      stakesA,
      stakesB,
      sceneContext,
      dialogue,
    };
    setSessions(prev => [session, ...prev]);
  };

  const handleLoadSession = (session) => {
    setSelectedChapterIdx(session.chapterIdx);
    setCharacterAId(session.characterAId);
    setCharacterBId(session.characterBId);
    setStakesA(session.stakesA || { wants: "", hiding: "" });
    setStakesB(session.stakesB || { wants: "", hiding: "" });
    setSceneContext(session.sceneContext || { location: "", justHappened: "" });
    setDialogue(session.dialogue || "");
    setAnalysis(null);
  };

  const handleClear = () => {
    setSelectedChapterIdx(null);
    setCharacterAId(null);
    setCharacterBId(null);
    setStakesA({ wants: "", hiding: "" });
    setStakesB({ wants: "", hiding: "" });
    setSceneContext({ location: "", justHappened: "" });
    setDialogue("");
    setAnalysis(null);
  };

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
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>Dialogue Lab</span>
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
          style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)` }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
          
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
              >
                <MessageSquare size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Dialogue Lab</h1>
                <p className="text-white/70">Write, analyze, and enhance character dialogue</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30"
              >
                <RefreshCw size={16} /> New Session
              </button>
              <button
                onClick={handleSaveSession}
                disabled={!dialogue.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/20 hover:bg-white/30 disabled:opacity-50"
              >
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Instructions Toggle */}
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full mb-6 rounded-xl p-4 flex items-center justify-between hover:bg-white/50 transition-colors"
          style={{ background: `${BRAND.gold}10`, border: `2px solid ${BRAND.gold}30` }}
        >
          <div className="flex items-center gap-3">
            <Lightbulb size={20} style={{ color: BRAND.gold }} />
            <span className="font-bold" style={{ color: BRAND.navy }}>How to Use the Dialogue Lab</span>
          </div>
          {showInstructions ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showInstructions && (
          <div className="bg-white rounded-2xl p-6 mb-8 border border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND.navy}15` }}>
                  <span className="text-sm font-bold" style={{ color: BRAND.navy }}>1</span>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: BRAND.navy }}>Set the Scene</p>
                  <p className="text-xs text-slate-500 mt-1">Choose two characters and optionally link to a chapter. Define where they are and what just happened.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND.gold}20` }}>
                  <span className="text-sm font-bold" style={{ color: BRAND.gold }}>2</span>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: BRAND.navy }}>Define Stakes</p>
                  <p className="text-xs text-slate-500 mt-1">What does each character WANT? What are they HIDING? Great dialogue comes from conflicting agendas.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${BRAND.rose}30` }}>
                  <span className="text-sm font-bold" style={{ color: BRAND.navy }}>3</span>
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: BRAND.navy }}>Write & Refine</p>
                  <p className="text-xs text-slate-500 mt-1">Write your dialogue, then use AI to analyze for subtext, or enhance to make it stronger.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Setup */}
          <div className="lg:col-span-1 space-y-6">
            {/* Chapter Link */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <label className="text-xs uppercase tracking-wider font-bold mb-3 block flex items-center gap-2" style={{ color: BRAND.navy }}>
                <FileText size={14} /> Link to Chapter (Optional)
              </label>
              <select
                value={selectedChapterIdx ?? ""}
                onChange={(e) => setSelectedChapterIdx(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full text-sm rounded-xl px-4 py-3 border border-slate-200 bg-slate-50 outline-none"
              >
                <option value="">No chapter linked</option>
                {chapters.map((ch, idx) => (
                  <option key={idx} value={idx}>Ch {idx + 1}: {ch.title || "Untitled"}</option>
                ))}
              </select>
            </div>

            {/* Character Selection */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style={{ color: BRAND.navy }}>
                <Users size={14} /> Select Characters
              </h3>
              
              {characters.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="mx-auto mb-2" style={{ color: BRAND.mauve }} />
                  <p className="text-sm text-slate-500 mb-2">No characters found</p>
                  <Link to="/story-lab/narrative-arc" className="text-sm font-medium" style={{ color: BRAND.gold }}>
                    Add characters in Narrative Arc →
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <CharacterSelector
                    characters={characters}
                    selectedId={characterAId}
                    onSelect={setCharacterAId}
                    label="Character A"
                    exclude={characterBId}
                  />
                  <CharacterSelector
                    characters={characters}
                    selectedId={characterBId}
                    onSelect={setCharacterBId}
                    label="Character B"
                    exclude={characterAId}
                  />
                </div>
              )}
            </div>

            {/* Scene Context */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style={{ color: BRAND.navy }}>
                <BookOpen size={14} /> Scene Context
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Location</label>
                  <input
                    value={sceneContext.location}
                    onChange={(e) => setSceneContext(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where does this scene take place?"
                    className="w-full mt-1 text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">What Just Happened?</label>
                  <textarea
                    value={sceneContext.justHappened}
                    onChange={(e) => setSceneContext(prev => ({ ...prev, justHappened: e.target.value }))}
                    placeholder="The event or moment that led to this conversation..."
                    className="w-full mt-1 text-sm rounded-lg px-3 py-2 bg-slate-50 border border-slate-200 outline-none resize-none h-20"
                  />
                </div>
              </div>
            </div>

            {/* Stakes */}
            {(characterA || characterB) && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style={{ color: BRAND.navy }}>
                  <Target size={14} /> Character Stakes
                </h3>
                <div className="space-y-4">
                  <StakesInput character={characterA} stakes={stakesA} onChange={setStakesA} />
                  <StakesInput character={characterB} stakes={stakesB} onChange={setStakesB} />
                </div>
              </div>
            )}

            {/* Saved Sessions */}
            {sessions.length > 0 && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200">
                <h3 className="text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2" style={{ color: BRAND.navy }}>
                  <Save size={14} /> Saved Sessions
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sessions.slice(0, 5).map(session => {
                    const charA = characters.find(c => c.id === session.characterAId);
                    const charB = characters.find(c => c.id === session.characterBId);
                    return (
                      <button
                        key={session.id}
                        onClick={() => handleLoadSession(session)}
                        className="w-full text-left p-3 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors"
                      >
                        <p className="text-sm font-medium" style={{ color: BRAND.navy }}>
                          {charA?.name || "?"} & {charB?.name || "?"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Dialogue Workspace */}
          <div className="lg:col-span-2">
            {/* Analysis Results */}
            {analysis && (
              <AnalysisResults analysis={analysis} onClose={() => setAnalysis(null)} />
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Dialogue Editor */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div 
                className="px-6 py-4 flex items-center justify-between"
                style={{ background: `linear-gradient(135deg, ${BRAND.navy}08 0%, ${BRAND.mauve}08 100%)`, borderBottom: `1px solid ${BRAND.navy}10` }}
              >
                <h3 className="font-bold" style={{ color: BRAND.navy }}>Dialogue</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={!characterA || !characterB || isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all hover:scale-105"
                    style={{ background: `${BRAND.mauve}20`, color: BRAND.navy }}
                  >
                    <Wand2 size={14} /> Generate
                  </button>
                  <button
                    onClick={handleEnhance}
                    disabled={!dialogue.trim() || !characterA || !characterB || isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition-all hover:scale-105"
                    style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
                  >
                    <Zap size={14} /> Enhance
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={!dialogue.trim() || !characterA || !characterB || isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-all hover:scale-105"
                    style={{ background: BRAND.navy }}
                  >
                    <Search size={14} /> Analyze
                  </button>
                </div>
              </div>

              <div className="p-6">
                {isLoading && (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={24} className="animate-spin" style={{ color: BRAND.gold }} />
                    <span className="ml-2 text-sm text-slate-500">Processing...</span>
                  </div>
                )}
                
                {!isLoading && (
                  <textarea
                    value={dialogue}
                    onChange={(e) => setDialogue(e.target.value)}
                    placeholder={characterA && characterB 
                      ? `${characterA.name}: "..."\n${characterB.name}: "..."\n\nWrite your dialogue here. Each line should start with the character's name followed by their dialogue in quotes.`
                      : "Select two characters to begin writing dialogue..."
                    }
                    className="w-full h-96 text-sm leading-relaxed outline-none resize-none font-mono"
                    style={{ color: BRAND.ink }}
                    disabled={!characterA || !characterB}
                  />
                )}
              </div>

              {/* Word Count */}
              <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {dialogue.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(dialogue)}
                  disabled={!dialogue.trim()}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 disabled:opacity-50"
                >
                  <Copy size={12} /> Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
