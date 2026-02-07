// src/components/ComposePage.jsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

import EditorPane from "./Editor/EditorPane";
import ChapterGrid from "./Writing/ChapterGrid";
import TrashDock from "./Writing/TrashDock";
import SearchPanel from "./Writing/SearchPanel";
import PaginatedView from "./Writing/PaginatedView";
import SidebarRouter from "./Writing/SidebarRouter";
import EditorToolbar from "./Editor/EditorToolbar";

import { useChapterManager } from "../hooks/useChapterManager";
import { useProjectStore } from "../hooks/useProjectStore";
import { documentParser } from "../utils/documentParser";
import { rateLimiter } from "../utils/rateLimiter";
import { storage } from "../lib/storage";
import { runAssistant } from "../lib/api";

import {
  Sparkles,
  Search,
  FileText,
  ChevronDown,
  FolderOpen,
  Download,
  Save,
  Grid3X3,
  Edit3,
  CheckSquare,
  Wand2,
  BookCheck,
  MessageSquare,
  RefreshCw,
  Eye,
  Send,
  ArrowLeft,
  PenLine,
  Trash2,
  BookOpen,
  Plus,
  Upload,
  Check,
  FolderPlus,
  Users,
  User,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  computeWordsFromChapters,
  syncProjectForCurrentStory,
  computeCharactersFromChapters,
  upsertProjectMeta,
  chaptersKeyForProject,
  getSelectedProjectId,
} from "../lib/projectsSync";

/* =============================================================================
   Constants
============================================================================= */
const CURRENT_STORY_KEY = "currentStory";
const DEBUG_IMPORT = false;

// Brand colors
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
};

/* =============================================================================
   Helpers
============================================================================= */

// Strip @char: markers for final output (but keep the names)
function stripCharacterTags(html = "") {
  if (!html) return "";
  return html.replace(/@char:\s*/g, "");
}

// Remove spacer paragraphs like <p>&nbsp;</p> that you don't want in Publishing
function stripSpacerParagraphs(html = "") {
  if (!html) return "";
  return html.replace(/<p>(?:&nbsp;|\s|<br\s*\/?>)*<\/p>/gi, "");
}

// Helper: normalize to "double spaced" paragraphs on import / AI
// NOW: 3 blank lines between paragraphs
const applyDoubleSpacing = (text = "") => {
  if (!text) return "";

  // If it already looks like HTML, convert paragraph breaks
  if (/<\/p>/i.test(text)) {
    return text
      .replace(/<\/p>\s*<p>/gi, "</p>\n\n\n\n<p>")
      .replace(/(<p>)/gi, "$1");
  }

  // Plain text → use 3 blank lines between paragraphs
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n{2,}/g, "\n\n\n\n")
    .replace(/\n{5,}/g, "\n\n\n\n")
    .trim();
};

// Generate preview text from HTML content
function generatePreview(html = "", maxWords = 20) {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const text = (tmp.textContent || tmp.innerText || "").trim();
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const preview = words.slice(0, maxWords).join(" ");
  return words.length > maxWords ? preview + "..." : preview;
}

// Save a simple "current story" snapshot for StoryLab + ProjectPage to read
function saveCurrentStorySnapshot({ id, title, primaryGenre }) {
  if (!title) return;
  try {
    const snapshot = {
      id: id || getSelectedProjectId() || "unknown",
      title: title.trim(),
      primaryGenre: primaryGenre || "General / Undeclared",
      status: "Draft",
      updatedAt: new Date().toISOString(),
    };

    storage.setItem(CURRENT_STORY_KEY, JSON.stringify(snapshot));

    // keep selected project id in sync for any page that reads it
    storage.setItem("dahtruth-current-project-id", snapshot.id);

    // notify StoryLab/other pages
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save currentStory:", err);
  }
}

// Helper to strip HTML to text (for detecting blank chapters)
const stripHtml = (html = "") => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Convert cleaned HTML → plain text for Publishing AI + exports
function htmlToPlainText(html = "") {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  let text = tmp.textContent || tmp.innerText || "";
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const SELECTED_CHAPTER_KEY_PREFIX = "dt_selected_chapter_";

function selectedChapterKeyForProject(projectId) {
  const pid = projectId || getSelectedProjectId() || "unknown";
  return `${SELECTED_CHAPTER_KEY_PREFIX}${pid}`;
}

// Clean/normalize html for publishing stability
function normalizeHtmlForPublishing(html = "") {
  let out = String(html || "");

  // Remove spacer paragraphs
  out = stripSpacerParagraphs(out);

  // Normalize multiple <br> runs inside paragraphs
  out = out.replace(/(<br\s*\/?>\s*){4,}/gi, "<br/><br/><br/>");

  // Remove trailing empty paragraphs again after normalization
  out = stripSpacerParagraphs(out);

  return out;
}

/* =============================================================================
   Regex Character Scan (shared by modal + refresh button)
============================================================================= */

// Common words to exclude (not character names)
const EXCLUDED_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "but",
  "or",
  "for",
  "nor",
  "on",
  "at",
  "to",
  "from",
  "by",
  "in",
  "of",
  "with",
  "as",
  "is",
  "was",
  "were",
  "been",
  "be",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "ought",
  "used",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "me",
  "him",
  "her",
  "us",
  "them",
  "my",
  "your",
  "his",
  "its",
  "our",
  "their",
  "mine",
  "yours",
  "hers",
  "ours",
  "theirs",
  "this",
  "that",
  "these",
  "those",
  "who",
  "whom",
  "which",
  "what",
  "whose",
  "where",
  "when",
  "why",
  "how",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "other",
  "some",
  "such",
  "no",
  "not",
  "only",
  "own",
  "same",
  "so",
  "than",
  "too",
  "very",
  "just",
  "also",
  "now",
  "here",
  "there",
  "then",
  // Days & months
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  // Common titles
  "mr",
  "mrs",
  "ms",
  "miss",
  "dr",
  "prof",
  "sir",
  "lord",
  "lady",
  // Common places/things often capitalized
  "church",
  "hospital",
  "school",
  "university",
  "street",
  "avenue",
  "road",
  "building",
  "house",
  "room",
  "office",
  "god",
  "lord",
  "bible",
  "chapter",
  // Story-related words
  "part",
  "book",
  "story",
  "page",
  "said",
  "asked",
  "replied",
  "answered",
  "whispered",
  "shouted",
  "cried",
  "called",
  "thought",
  "knew",
  "felt",
  "saw",
  "heard",
  "looked",
  "turned",
  "walked",
  "ran",
  "came",
  "went",
  "got",
  "made",
  "took",
  "gave",
  "found",
  "told",
  "let",
  "put",
  "seemed",
  "left",
  "kept",
  "began",
  "started",
  "tried",
  "wanted",
  "needed",
  "liked",
]);

// Common place indicators
const PLACE_INDICATORS = [
  "street",
  "avenue",
  "road",
  "drive",
  "lane",
  "way",
  "boulevard",
  "court",
  "place",
  "park",
  "city",
  "town",
  "county",
  "state",
  "building",
  "tower",
  "center",
  "mall",
  "hospital",
  "church",
  "school",
];

function regexScanForCharacters(chapterList = []) {
  const nameStats = new Map(); // name -> { count, inDialogue, chapters, contexts }

  // Get already tagged characters
  const existingTags = new Set();
  const tagPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*)/gi;
  chapterList.forEach((ch) => {
    let match;
    const content = ch?.content || "";
    while ((match = tagPattern.exec(content)) !== null) {
      existingTags.add((match[1] || "").trim().toLowerCase());
    }
  });

  chapterList.forEach((chapter, chIdx) => {
    const content = stripHtml(chapter?.content || "");
    const chapterTitle = chapter?.title || `Chapter ${chIdx + 1}`;

    // Pattern 1: Names in dialogue tags
    const dialoguePatterns = [
      /(?:said|asked|replied|answered|whispered|shouted|called|cried|muttered|murmured|exclaimed|demanded|insisted|suggested|continued|added|agreed|admitted|announced|argued|began|begged|bellowed|blurted|boasted|bragged|breathed|chimed|choked|claimed|coaxed|commanded|commented|complained|conceded|concluded|confessed|confirmed|corrected|countered|croaked|declared|denied|drawled|echoed|encouraged|ended|explained|finished|gasped|giggled|groaned|growled|grumbled|grunted|guessed|gulped|hinted|hissed|huffed|hummed|informed|inquired|instructed|interrupted|interjected|joked|laughed|lectured|lied|mentioned|moaned|mocked|mumbled|mused|nagged|nodded|noted|objected|observed|offered|ordered|panted|persisted|piped|pleaded|pointed|pondered|pouted|praised|prayed|pressed|proclaimed|promised|proposed|protested|provoked|purred|questioned|quipped|quoted|ranted|reasoned|reassured|recalled|recited|refused|reminded|repeated|reported|requested|responded|retorted|revealed|roared|sang|scoffed|scolded|screamed|sighed|smiled|snapped|snarled|sneered|sobbed|spoke|spluttered|squeaked|squealed|stammered|started|stated|stormed|stressed|stuttered|suggested|summarized|taunted|teased|thanked|threatened|thundered|urged|uttered|vowed|wailed|warned|wept|whimpered|whined|wondered|yawned|yelled|yelped)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|asked|replied|answered|whispered|shouted|called|cried|muttered|murmured|exclaimed|demanded|insisted|suggested|continued|added|agreed|admitted|announced|argued|began|begged|bellowed|blurted|boasted|bragged|breathed|chimed|choked|claimed|coaxed|commanded|commented|complained|conceded|concluded|confessed|confirmed|corrected|countered|croaked|declared|denied|drawled|echoed|encouraged|ended|explained|finished|gasped|giggled|groaned|growled|grumbled|grunted|guessed|gulped|hinted|hissed|huffed|hummed|informed|inquired|instructed|interrupted|interjected|joked|laughed|lectured|lied|mentioned|moaned|mocked|mumbled|mused|nagged|nodded|noted|objected|observed|offered|ordered|panted|persisted|piped|pleaded|pointed|pondered|pouted|praised|prayed|pressed|proclaimed|promised|proposed|protested|provoked|purred|questioned|quipped|quoted|ranted|reasoned|reassured|recalled|recited|refused|reminded|repeated|reported|requested|responded|retorted|revealed|roared|sang|scoffed|scolded|screamed|sighed|smiled|snapped|snarled|sneered|sobbed|spoke|spluttered|squeaked|squealed|stammered|started|stated|stormed|stressed|stuttered|suggested|summarized|taunted|teased|thanked|threatened|thundered|urged|uttered|vowed|wailed|warned|wept|whimpered|whined|wondered|yawned|yelled|yelped)/gi,
    ];

    dialoguePatterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 1) {
          const key = name.toLowerCase();
          if (!EXCLUDED_WORDS.has(key) && !existingTags.has(key)) {
            if (!nameStats.has(name)) {
              nameStats.set(name, {
                count: 0,
                inDialogue: 0,
                chapters: new Set(),
                contexts: [],
              });
            }
            const stats = nameStats.get(name);
            stats.count++;
            stats.inDialogue++;
            stats.chapters.add(chapterTitle);
            if (stats.contexts.length < 3) stats.contexts.push("dialogue");
          }
        }
      }
    });

    // Pattern 2: Names with titles
    const titlePattern =
      /(?:Mr\.|Mrs\.|Ms\.|Miss|Dr\.|Pastor|Father|Mother|Sister|Brother|Uncle|Aunt|Grandma|Grandpa|Coach|Officer|Detective|Agent|Captain|Professor|Prof\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;
    let match;
    while ((match = titlePattern.exec(content)) !== null) {
      const fullMatch = match[0].trim();
      const name = fullMatch;
      const key = name.toLowerCase();
      if (!existingTags.has(key)) {
        if (!nameStats.has(name)) {
          nameStats.set(name, {
            count: 0,
            inDialogue: 0,
            chapters: new Set(),
            contexts: [],
          });
        }
        const stats = nameStats.get(name);
        stats.count++;
        stats.chapters.add(chapterTitle);
        if (stats.contexts.length < 3) stats.contexts.push("titled");
      }
    }

    // Pattern 3: Proper nouns
    const properNounPattern = /[a-z,;:]\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]+)?)/g;
    while ((match = properNounPattern.exec(content)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length > 2) {
        const key = name.toLowerCase();
        const firstWord = key.split(/\s+/)[0];

        if (EXCLUDED_WORDS.has(firstWord)) continue;
        if (existingTags.has(key)) continue;

        const isPlace = PLACE_INDICATORS.some((p) => key.includes(p));
        if (isPlace) continue;

        if (!nameStats.has(name)) {
          nameStats.set(name, {
            count: 0,
            inDialogue: 0,
            chapters: new Set(),
            contexts: [],
          });
        }
        const stats = nameStats.get(name);
        stats.count++;
        stats.chapters.add(chapterTitle);
      }
    }

    // Pattern 4: Action patterns
    const actionPattern =
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:walked|ran|looked|turned|smiled|frowned|nodded|shook|stood|sat|leaned|reached|grabbed|pulled|pushed|opened|closed|picked|put|took|gave|held|felt|watched|stared|glanced|gazed|noticed|saw|heard|listened|moved|stepped|entered|left|arrived|returned|approached|followed|led|stopped|started|continued|began|tried|wanted|needed|decided|thought|knew|remembered|forgot|realized|understood|believed|hoped|wished|feared|loved|hated|liked)/gi;

    while ((match = actionPattern.exec(content)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length > 1) {
        const key = name.toLowerCase();
        if (!EXCLUDED_WORDS.has(key) && !existingTags.has(key)) {
          if (!nameStats.has(name)) {
            nameStats.set(name, {
              count: 0,
              inDialogue: 0,
              chapters: new Set(),
              contexts: [],
            });
          }
          const stats = nameStats.get(name);
          stats.count++;
          stats.chapters.add(chapterTitle);
          if (stats.contexts.length < 3) stats.contexts.push("action");
        }
      }
    }
  });

  // Convert to array and calculate confidence
  const results = [];
  nameStats.forEach((stats, name) => {
    if (stats.count < 2 && !name.includes(" ") && stats.inDialogue === 0) return;

    let confidence = "low";
    if (stats.inDialogue >= 2 || (stats.count >= 5 && stats.chapters.size >= 2)) {
      confidence = "high";
    } else if (stats.inDialogue >= 1 || stats.count >= 3 || name.includes(" ")) {
      confidence = "medium";
    }

    results.push({
      name,
      count: stats.count,
      inDialogue: stats.inDialogue,
      chapters: Array.from(stats.chapters),
      confidence,
      verified: false,
      role: null,
    });
  });

  results.sort((a, b) => {
    const confOrder = { high: 0, medium: 1, low: 2, rejected: 3 };
    if (confOrder[a.confidence] !== confOrder[b.confidence]) {
      return confOrder[a.confidence] - confOrder[b.confidence];
    }
    return (b.count || 0) - (a.count || 0);
  });

  return results;
}

/* =============================================================================
   CHARACTER SUGGESTION MODAL (Hybrid: Regex + Optional AI)
============================================================================= */
function CharacterSuggestionModal({
  isOpen,
  onClose,
  chapters,
  onAddCharacterTags,
  provider,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [selectedChars, setSelectedChars] = useState(new Set());
  const [hasScanned, setHasScanned] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState(null);

  useEffect(() => {
    if (isOpen && chapters && chapters.length > 0) {
      setSuggestions([]);
      setSelectedChars(new Set());
      setHasScanned(false);
      setIsVerifying(false);
      setVerifyError(null);

      const results = regexScanForCharacters(chapters);
      setSuggestions(results);
      setHasScanned(true);

      const autoSelected = new Set();
      results.forEach((c) => {
        if (c.confidence === "high" || c.confidence === "medium") {
          autoSelected.add(c.name);
        }
      });
      setSelectedChars(autoSelected);
    }
  }, [isOpen, chapters]);

  const verifyWithAI = async () => {
    if (suggestions.length === 0) return;

    setIsVerifying(true);
    setVerifyError(null);

    try {
      const candidateList = suggestions
        .map((s) => `${s.name} (${s.count} mentions)`)
        .join("\n");

      const prompt = `I found these potential character names in a manuscript. For each one, tell me:
1. Is this likely a CHARACTER (person in the story) or NOT (place, thing, or false positive)?
2. If it's a character, classify as: "major" (central to story), "minor" (supporting), or "mentioned" (referenced only)

Candidates:
${candidateList}

Respond with ONLY a JSON array:
[
  {"name": "Grace Thompson", "isCharacter": true, "role": "major"},
  {"name": "Downtown", "isCharacter": false, "role": null},
  {"name": "Pastor Davis", "isCharacter": true, "role": "minor"}
]

Return ONLY the JSON array, no other text.`;

      const result = await rateLimiter.addToQueue(() =>
        runAssistant(prompt, "clarify", "", provider)
      );

      const responseText =
        result?.result || result?.text || result?.output || result || "";

      let parsed = [];
      try {
        const jsonMatch = String(responseText).match(/\[[\s\S]*\]/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("Failed to parse AI verification:", e);
        setVerifyError("Couldn't parse AI response. Your selections are still valid.");
        return;
      }

      if (Array.isArray(parsed)) {
        const verificationMap = new Map();
        parsed.forEach((v) => {
          if (v?.name) verificationMap.set(String(v.name).toLowerCase(), v);
        });

        const updatedSuggestions = suggestions.map((s) => {
          const verification = verificationMap.get(s.name.toLowerCase());
          if (verification) {
            return {
              ...s,
              verified: true,
              isCharacter: verification.isCharacter !== false,
              role: verification.role || null,
              confidence:
                verification.isCharacter === false
                  ? "rejected"
                  : verification.role === "major"
                  ? "high"
                  : verification.role === "minor"
                  ? "medium"
                  : s.confidence,
            };
          }
          return { ...s, verified: true };
        });

        const filtered = updatedSuggestions.filter((s) => s.isCharacter !== false);
        filtered.sort((a, b) => {
          const confOrder = { high: 0, medium: 1, low: 2, rejected: 3 };
          if (confOrder[a.confidence] !== confOrder[b.confidence]) {
            return confOrder[a.confidence] - confOrder[b.confidence];
          }
          return (b.count || 0) - (a.count || 0);
        });

        setSuggestions(filtered);

        const newSelected = new Set();
        filtered.forEach((s) => {
          if (s.role === "major" || s.role === "minor" || s.confidence === "high") {
            newSelected.add(s.name);
          }
        });
        setSelectedChars(newSelected);
      }
    } catch (err) {
      console.error("AI verification failed:", err);
      setVerifyError("AI verification failed. Your selections are still valid.");
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleCharacter = (name) => {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => setSelectedChars(new Set(suggestions.map((s) => s.name)));
  const selectNone = () => setSelectedChars(new Set());

  const handleAddTags = () => {
    if (selectedChars.size === 0) {
      onClose();
      return;
    }
    onAddCharacterTags(Array.from(selectedChars));
    onClose();
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case "high":
        return { bg: `${BRAND.gold}20`, color: BRAND.gold, label: "High confidence" };
      case "medium":
        return { bg: `${BRAND.mauve}20`, color: BRAND.mauve, label: "Medium" };
      case "rejected":
        return { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" };
      default:
        return { bg: "#f1f5f9", color: "#94a3b8", label: "Low" };
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy}08 0%, ${BRAND.gold}08 100%)`,
            borderBottom: `1px solid ${BRAND.navy}10`,
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${BRAND.gold}20` }}
            >
              <Users size={20} style={{ color: BRAND.gold }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
                Discover Characters
              </h2>
              <p className="text-xs text-slate-500">
                {hasScanned
                  ? `Found ${suggestions.length} potential character${
                      suggestions.length !== 1 ? "s" : ""
                    }`
                  : "Scanning..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!hasScanned && (
            <div className="text-center py-12">
              <Loader2
                size={32}
                className="animate-spin mx-auto mb-4"
                style={{ color: BRAND.gold }}
              />
              <p className="text-slate-600">Scanning manuscript...</p>
            </div>
          )}

          {verifyError && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl text-amber-700 mb-4">
              <AlertCircle size={20} />
              <span className="text-sm">{verifyError}</span>
            </div>
          )}

          {hasScanned && suggestions.length === 0 && (
            <div className="text-center py-8">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "#f1f5f9" }}
              >
                <User size={32} className="text-slate-400" />
              </div>
              <h3 className="font-semibold mb-2" style={{ color: BRAND.navy }}>
                No New Characters Found
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Either all characters are already tagged with @char:, or no character
                names were detected.
              </p>
            </div>
          )}

          {suggestions.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold" style={{ color: BRAND.navy }}>
                    {suggestions.length} Potential Character
                    {suggestions.length !== 1 ? "s" : ""}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedChars.size} selected • Confidence based on dialogue tags &
                    frequency
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs px-2 py-1 rounded hover:bg-slate-100"
                    style={{ color: BRAND.navy }}
                  >
                    All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={selectNone}
                    className="text-xs px-2 py-1 rounded hover:bg-slate-100"
                    style={{ color: BRAND.navy }}
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {suggestions.map((char) => {
                  const conf = getConfidenceColor(char.confidence);
                  return (
                    <label
                      key={char.name}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: selectedChars.has(char.name)
                          ? `${BRAND.gold}10`
                          : "white",
                        border: `1px solid ${
                          selectedChars.has(char.name) ? BRAND.gold : "#e2e8f0"
                        }`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedChars.has(char.name)}
                        onChange={() => toggleCharacter(char.name)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: BRAND.gold }}
                      />
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: conf.bg }}
                      >
                        <User size={16} style={{ color: conf.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-medium text-sm truncate"
                          style={{ color: BRAND.navy }}
                        >
                          {char.name}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                          <span>
                            {char.count} mention{char.count !== 1 ? "s" : ""}
                          </span>
                          {char.inDialogue > 0 && (
                            <span className="text-emerald-600">
                              • {char.inDialogue} in dialogue
                            </span>
                          )}
                          {char.role && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{ background: conf.bg, color: conf.color }}
                            >
                              {char.role}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="text-[10px] px-2 py-1 rounded-full flex-shrink-0"
                        style={{ background: conf.bg, color: conf.color }}
                      >
                        {char.verified ? (char.role || conf.label) : conf.label}
                      </div>
                      {selectedChars.has(char.name) && (
                        <Check size={16} style={{ color: BRAND.gold }} />
                      )}
                    </label>
                  );
                })}
              </div>

              {!suggestions.some((s) => s.verified) && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={verifyWithAI}
                    disabled={isVerifying}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                    style={{
                      background: `${BRAND.mauve}15`,
                      color: BRAND.navy,
                      border: `1px solid ${BRAND.mauve}30`,
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Verifying with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Verify with AI (Optional)
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2">
                    AI will confirm which names are characters and classify their roles
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: `1px solid ${BRAND.navy}10` }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
          >
            Skip
          </button>

          {suggestions.length > 0 && (
            <button
              onClick={handleAddTags}
              disabled={selectedChars.size === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
              }}
            >
              <Check size={16} />
              Add @char: Tags ({selectedChars.size})
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* =============================================================================
   PROJECT DROPDOWN COMPONENT
============================================================================= */
function ProjectDropdown({
  currentProject,
  projects,
  onSwitch,
  onCreate,
  onImportNew,
  onRename,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEditTitle = () => {
    if (!currentProject) return;
    const newTitle = window.prompt(
      "Enter new title for your manuscript:",
      currentProject.title || "Untitled"
    );
    if (newTitle && newTitle.trim() && newTitle !== currentProject.title) {
      onRename(currentProject.id, newTitle.trim());
    }
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
      >
        <BookOpen size={16} />
        <span className="max-w-[180px] truncate">
          {currentProject?.title || "No Project"}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border min-w-[280px] py-2">
          {currentProject && (
            <>
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Current Project
              </div>
              <div className="px-3 py-2 mb-2 border-b border-slate-100">
                <div className="font-medium text-sm truncate" style={{ color: BRAND.navy }}>
                  {currentProject.title || "Untitled"}
                </div>
                <button
                  onClick={handleEditTitle}
                  className="mt-1 text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <Edit3 size={12} />
                  Edit Title
                </button>
              </div>
            </>
          )}

          <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide">
            My Manuscripts
          </div>

          <div className="max-h-64 overflow-y-auto">
            {projects.length === 0 ? (
              <div className="px-3 py-4 text-sm text-slate-500 text-center">
                No projects yet
              </div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onSwitch(project.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 flex items-center gap-3 ${
                    project.id === currentProject?.id ? "bg-amber-50" : ""
                  }`}
                >
                  <BookOpen
                    size={16}
                    style={{
                      color: project.id === currentProject?.id ? BRAND.gold : BRAND.navy,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: BRAND.navy }}>
                      {project.title}
                    </div>
                    <div className="text-xs text-slate-500">
                      {project.chapterCount || 0} chapters •{" "}
                      {project.wordCount?.toLocaleString() || 0} words
                    </div>
                  </div>
                  {project.id === currentProject?.id && (
                    <Check size={16} style={{ color: BRAND.gold }} />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 mt-1 pt-1">
            <button
              onClick={() => {
                onCreate();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3"
              style={{ color: BRAND.navy }}
            >
              <Plus size={16} />
              <span>New Empty Manuscript</span>
            </button>
            <button
              onClick={() => {
                onImportNew();
                setIsOpen(false);
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-3"
              style={{ color: BRAND.gold }}
            >
              <FolderPlus size={16} />
              <span className="font-medium">Import as New Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   IMPORT OPTIONS MODAL
============================================================================= */
function ImportOptionsModal({
  isOpen,
  onClose,
  onImportCurrent,
  onImportNew,
  fileName,
}) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-2" style={{ color: BRAND.navy }}>
          Import Manuscript
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          You selected: <strong>{fileName}</strong>
        </p>

        <div className="space-y-3">
          <button
            onClick={onImportNew}
            className="w-full p-4 rounded-xl text-left transition-all hover:scale-[1.02] hover:shadow-md"
            style={{
              background: `linear-gradient(135deg, ${BRAND.gold}15, ${BRAND.gold}05)`,
              border: `2px solid ${BRAND.gold}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: BRAND.gold }}
              >
                <FolderPlus size={20} className="text-white" />
              </div>
              <div>
                <div className="font-semibold" style={{ color: BRAND.navy }}>
                  Create New Project
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  Import as a separate manuscript. Your current work stays safe.
                </div>
                <div
                  className="text-xs font-medium mt-2 px-2 py-1 rounded-full inline-block"
                  style={{ background: `${BRAND.gold}20`, color: BRAND.gold }}
                >
                  ✓ Recommended
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={onImportCurrent}
            className="w-full p-4 rounded-xl text-left transition-all hover:shadow-md"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "#e2e8f0" }}
              >
                <Upload size={20} className="text-slate-500" />
              </div>
              <div>
                <div className="font-semibold" style={{ color: BRAND.navy }}>
                  Add to Current Project
                </div>
                <div className="text-sm text-slate-600 mt-0.5">
                  Append chapters to your current manuscript.
                </div>
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2 text-sm text-slate-500 hover:text-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body
  );
}

/* =============================================================================
   DROPDOWN MENU COMPONENTS
============================================================================= */
function DropdownMenu({ label, icon: Icon, children, disabled = false }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 180 });

  const close = () => setOpen(false);

  const computePos = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 8,
      left: r.left,
      width: Math.max(180, r.width),
    });
  };

  useEffect(() => {
    if (!open) return;

    computePos();

    const onDocMouseDown = (e) => {
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (!btn || !menu) return;
      if (btn.contains(e.target) || menu.contains(e.target)) return;
      close();
    };

    const onScrollOrResize = () => computePos();

    document.addEventListener("mousedown", onDocMouseDown, true);
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", onDocMouseDown, true);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (disabled) return;
          setOpen((v) => !v);
        }}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
          border border-slate-200 bg-white hover:bg-slate-50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${open ? "bg-slate-100 border-slate-300" : ""}
        `}
      >
        {Icon && <Icon size={16} className="text-slate-600" />}
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              minWidth: pos.width,
              zIndex: 999999,
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-lg py-1"
          >
            {React.Children.map(children, (child) =>
              child ? React.cloneElement(child, { closeMenu: close }) : null
            )}
          </div>,
          document.body
        )}
    </>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  shortcut,
  closeMenu,
}) {
  const handleClick = (e) => {
    if (disabled) return;
    if (onClick) onClick(e);
    if (closeMenu) closeMenu();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full flex items-center gap-2 px-3 py-2 text-sm text-left
        hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed
        ${active ? "bg-amber-50 text-amber-800" : "text-slate-700"}
      `}
    >
      {Icon && <Icon size={16} className={active ? "text-amber-600" : "text-slate-500"} />}
      <span className="flex-1">{label}</span>
      {shortcut && <span className="text-xs text-slate-400">{shortcut}</span>}
      {active && <span className="text-amber-500">✓</span>}
    </button>
  );
}

function DropdownDivider() {
  return <div className="my-1 border-t border-slate-100" />;
}

/* =============================================================================
   MAIN COMPONENT
============================================================================= */
export default function ComposePage() {
  const navigate = useNavigate();

  // Project management
  const {
    projects,
    currentProjectId,
    currentProject,
    createProject,
    createProjectFromImport,
    switchProject,
    renameProject,
  } = useProjectStore();

  const {
    book,
    chapters: rawChapters = [],
    selectedId,
    selectedChapter,
    setSelectedId,
    addChapter,
    updateChapter,
    deleteChapter,
    moveChapter,
    saveProject,
  } = useChapterManager();

  const chapters = useMemo(
    () =>
      Array.isArray(rawChapters)
        ? rawChapters
            .filter((c) => c && c.id != null)
            .map((ch) => ({
              ...ch,
              preview: ch.preview || generatePreview(ch.content, 20),
            }))
        : [],
    [rawChapters]
  );

  const [bookTitle, setBookTitle] = useState(book?.title || "Untitled Story");
  const [author, setAuthor] = useState("Jacqueline Session Ausby");

  // Genre from project (always safe)
  const primaryGenre =
    currentProject?.primaryGenre || currentProject?.genre || "General / Undeclared";

  // ✅ Selected chapter key (project-scoped)
  const selectedChapterStorageKey = useMemo(
    () => selectedChapterKeyForProject(currentProjectId),
    [currentProjectId]
  );

  // Update bookTitle when project changes
  useEffect(() => {
    if (currentProject?.title) setBookTitle(currentProject.title);
    else if (book?.title) setBookTitle(book.title);

    const pid = currentProject?.id || currentProjectId || getSelectedProjectId();
    const safeTitle = (currentProject?.title || book?.title || bookTitle || "Untitled Book").trim();
    if (pid) {
      saveCurrentStorySnapshot({ id: pid, title: safeTitle, primaryGenre });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjectId, currentProject?.id, currentProject?.title, primaryGenre]);

  const { characters, characterCount } = useMemo(
    () => computeCharactersFromChapters(chapters || []),
    [chapters]
  );

  const totalWordCount = useMemo(() => computeWordsFromChapters(chapters || []), [chapters]);

  const currentChapterIndex = useMemo(() => {
    if (!selectedId) return 0;
    const idx = chapters.findIndex((c) => c.id === selectedId);
    return idx >= 0 ? idx + 1 : 0;
  }, [chapters, selectedId]);

  const [aiBusy, setAiBusy] = useState(false);
  const [provider, setProvider] = useState("anthropic");
  const [instructions, setInstructions] = useState("");

  const [showAssistant, setShowAssistant] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);

  const [view, setView] = useState("grid");
  const [showSearch, setShowSearch] = useState(false);
  const [editorViewMode, setEditorViewMode] = useState("editor");

  const [title, setTitle] = useState(selectedChapter?.title ?? "");
  const [html, setHtml] = useState(selectedChapter?.content ?? "");

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const lastClickedIndexRef = useRef(null);

  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
  const [queueLength, setQueueLength] = useState(0);

  const [saveStatus, setSaveStatus] = useState("idle");
  const [headings, setHeadings] = useState([]);
  const [activeAiTab, setActiveAiTab] = useState("proofread");

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState(null);

  // Character suggestion modal state
  const [showCharacterSuggestion, setShowCharacterSuggestion] = useState(false);

  // detected characters state
  const [detectedCharacters, setDetectedCharacters] = useState([]);

  const hasChapter = !!selectedId && !!selectedChapter;
  const hasAnyChapters = Array.isArray(chapters) && chapters.length > 0;

  const fileInputRef = useRef(null);
  const newProjectFileInputRef = useRef(null);

  const chapterPlainText = useMemo(() => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }, [html]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueLength(rateLimiter.getQueueLength());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = storage.getItem("dt_activeAiTab");
      if (stored) setActiveAiTab(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (activeAiTab) storage.setItem("dt_activeAiTab", activeAiTab);
    } catch {}
  }, [activeAiTab]);

  // ✅ Auto-select a chapter when entering editor view
  useEffect(() => {
    if (view !== "editor") return;
    if (selectedId) return;
    if (!chapters?.length) return;

    try {
      const saved = storage.getItem(selectedChapterStorageKey);
      const exists = saved && chapters.some((c) => c.id === saved);
      if (exists) {
        setSelectedId(saved);
        return;
      }
    } catch {}

    setSelectedId(chapters[0].id);
  }, [view, selectedId, chapters, selectedChapterStorageKey, setSelectedId]);

  // Check for pending character scan after reload
  useEffect(() => {
    const pending = storage.getItem("dt_pending_character_scan");
    if (pending === "true" && chapters.length > 0) {
      storage.removeItem("dt_pending_character_scan");
      setTimeout(() => {
        if (
          window.confirm(
            "Would you like AI to scan for character names in your imported manuscript?"
          )
        ) {
          setShowCharacterSuggestion(true);
        }
      }, 500);
    }
  }, [chapters]);

  const clearSelection = () => setSelectedIds(new Set());

  function toggleSelect(id, { additive = false } = {}) {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(additive ? prev : []);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function rangeSelect(toIdx) {
    if (!Number.isInteger(toIdx) || toIdx < 0 || toIdx >= chapters.length) {
      lastClickedIndexRef.current = null;
      return;
    }
    const fromIdx = lastClickedIndexRef.current;
    if (fromIdx == null || fromIdx < 0 || fromIdx >= chapters.length) {
      const chapterId = chapters[toIdx]?.id;
      if (chapterId) {
        setSelectedIds(new Set([chapterId]));
        lastClickedIndexRef.current = toIdx;
      }
      return;
    }
    const [a, b] = [Math.min(fromIdx, toIdx), Math.max(fromIdx, toIdx)];
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (let i = a; i <= b; i++) {
        const cid = chapters[i]?.id;
        if (cid) next.add(cid);
      }
      return next;
    });
    lastClickedIndexRef.current = toIdx;
  }

  function toggleSelectMode() {
    setSelectMode((s) => {
      if (s) clearSelection();
      return !s;
    });
  }

  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (/input|textarea|select/i.test(tag)) return;

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIds.size) {
        e.preventDefault();
        handleDeleteMultiple(Array.from(selectedIds));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, selectedId, chapters, hasChapter, saveStatus, html, title]);

  useEffect(() => {
    if (selectedChapter) {
      setTitle(selectedChapter.title || "");
      setHtml(selectedChapter.content || "");
    }
    setHeadings([]);
  }, [selectedId, selectedChapter]);

  const handleSave = async () => {
    if (!hasChapter) return;
    if (saveStatus === "saving") return;

    setSaveStatus("saving");

    try {
      const preview = generatePreview(html, 20);

      updateChapter(selectedId, {
        title: title || selectedChapter?.title || "",
        content: html,
        preview,
      });

      const nextChapters = (chapters || []).map((c) =>
        c.id === selectedId
          ? {
              ...c,
              title: title || c.title || "",
              content: html,
              preview,
            }
          : c
      );

      const totalWords = computeWordsFromChapters(nextChapters);
      const chapterCount = Array.isArray(nextChapters) ? nextChapters.length : 0;
      const { characterCount: computedCharacterCount } =
        computeCharactersFromChapters(nextChapters);

      await Promise.resolve(
        saveProject({
          book: { ...book, title: bookTitle },
          stats: {
            wordCount: totalWords,
            chapterCount,
            characterCount: computedCharacterCount,
          },
        })
      );

      const safeTitle = bookTitle?.trim() || book?.title?.trim() || "Untitled Book";
      const projectId = currentProjectId || getSelectedProjectId() || "unknown";

      if (currentProjectId && safeTitle) {
        renameProject(currentProjectId, safeTitle);
      }

      saveCurrentStorySnapshot({ id: projectId, title: safeTitle, primaryGenre });

      upsertProjectMeta({
        id: projectId,
        title: safeTitle,
        primaryGenre,
        wordCount: totalWords,
        targetWords: 50000,
        characterCount: computedCharacterCount,
      });

      syncProjectForCurrentStory({
        wordCount: totalWords,
        targetWords: 50000,
        characterCount: computedCharacterCount,
      });

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("Save failed:", error);
      setSaveStatus("idle");
    }
  };

  const resolveAIMode = (mode) => {
    switch (mode) {
      case "grammar":
      case "proofread":
        return "proofread";
      case "clarify":
        return "clarify";
      case "readability":
        return "readability";
      case "rewrite":
        return "rewrite";
      default:
        return "improve";
    }
  };

  const handleAI = async (mode) => {
    if (!hasChapter) return;

    const action = resolveAIMode(mode);
    if (typeof window === "undefined") return;

    const editorEl = document.querySelector(".ql-editor");
    const selection = window.getSelection();

    if (
      !editorEl ||
      !selection ||
      selection.rangeCount === 0 ||
      selection.isCollapsed ||
      !editorEl.contains(selection.getRangeAt(0).commonAncestorContainer)
    ) {
      alert("Please highlight the text you want the AI to revise, then click the AI button again.");
      return;
    }

    const range = selection.getRangeAt(0);
    const container = document.createElement("div");
    container.appendChild(range.cloneContents());
    const selectedHtml = container.innerHTML.trim();

    if (!selectedHtml) {
      alert(
        "I couldn't read any content from your selection. Please select the exact sentence or paragraph you want revised and try again."
      );
      return;
    }

    const selectedPlain = selectedHtml.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    if (!selectedPlain) {
      alert(
        "The selected content seems to be empty or only formatting. Please select normal text and try again."
      );
      return;
    }

    const MAX_CHARS = 3000;
    const targetText = selectedPlain.slice(0, MAX_CHARS);

    const wrapAsHtml = (text) => {
      let cleaned = String(text || "");
      cleaned = cleaned.replace(/<\/?p>/gi, "");
      const safe = cleaned
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      const parts = safe
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length === 0) return `<p>${safe}</p>`;
      return parts.map((p) => `<p>${p}</p>`).join("");
    };

    try {
      setAiBusy(true);
      const result = await rateLimiter.addToQueue(() =>
        runAssistant(targetText, action, instructions || "", provider)
      );

      const resultTextRaw =
        (result && (result.result || result.text || result.output || result.data)) || result || "";

      if (!resultTextRaw) {
        alert("The AI did not return any text. Please try again with a smaller selection or a different mode.");
        return;
      }

      const processedText = applyDoubleSpacing(resultTextRaw);
      const replacementHtml = wrapAsHtml(processedText);
      const fullHtml = (html || "").toString();

      if (!fullHtml.includes(selectedHtml)) {
        alert("I couldn't safely locate that selection in the chapter. No changes were made.");
        return;
      }

      const updatedHtml = fullHtml.replace(selectedHtml, replacementHtml);
      setHtml(updatedHtml);

      updateChapter(selectedId, {
        title: title || selectedChapter?.title || "",
        content: updatedHtml,
        preview: generatePreview(updatedHtml, 20),
      });

      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "AI revision applied to your selection:\n\n" + processedText,
          id: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("AI request error:", error);
      alert("There was an error calling the AI service. Please try again in a moment.");
    } finally {
      setAiBusy(false);
    }
  };

  const handleAssistantSend = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMessage = { role: "user", content: text, id: Date.now() };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatBusy(true);

    try {
      const snippet = chapterPlainText.slice(0, 1500) || "";
      const instructionsText = [
        `You are the DahTruth StoryLab writing assistant.`,
        `The user is working on a chapter titled "${title || "Untitled Chapter"}".`,
        `When you suggest edits, please quote or clearly separate your suggested text so it can be copy-pasted into the manuscript.`,
        snippet
          ? `Here is an excerpt of the chapter for context:\n\n${snippet}`
          : `There is no chapter text yet; answer based on the question only.`,
      ].join("\n\n");

      const res = await rateLimiter.addToQueue(() =>
        runAssistant(text, "clarify", instructionsText, provider)
      );

      const replyText = (res && (res.result || res.text || res.output || res.data)) || "";
      const assistantMessage = {
        role: "assistant",
        content:
          replyText ||
          "I couldn't generate a response. Please try asking your question in a different way.",
        id: Date.now() + 1,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Assistant chat error:", err);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error reaching the assistant. Please try again in a moment.",
          id: Date.now() + 2,
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  };

  const handleAssistantKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAssistantSend();
    }
  };

  const parseFile = async (file) => {
    const name = file.name.toLowerCase();
    let parsed;

    if (name.endsWith(".doc") || name.endsWith(".docx")) {
      parsed = await rateLimiter.addToQueue(() => documentParser.parseWordDocument(file));
    } else if (name.endsWith(".txt") || name.endsWith(".md")) {
      parsed = await documentParser.parseTextDocument(file);
    } else {
      throw new Error("Unsupported file type. Please use .docx, .doc, .txt, or .md");
    }

    return parsed;
  };

  const handleAddCharacterTags = (characterNames) => {
    if (!characterNames || characterNames.length === 0) return;

    const updatedChapters = [];
    const taggedNames = new Set();

    chapters.forEach((chapter) => {
      let content = chapter.content || "";
      let modified = false;

      characterNames.forEach((name) => {
        if (taggedNames.has(name.toLowerCase())) return;

        const nameRegex = new RegExp(
          `\\b(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`,
          "i"
        );
        const match = content.match(nameRegex);

        if (match) {
          content = content.replace(nameRegex, `@char: ${match[1]}`);
          taggedNames.add(name.toLowerCase());
          modified = true;
        }
      });

      if (modified) updatedChapters.push({ id: chapter.id, content });
    });

    updatedChapters.forEach(({ id, content }) => {
      updateChapter(id, { content, preview: generatePreview(content, 20) });
    });

    const currentUpdate = updatedChapters.find((u) => u.id === selectedId);
    if (currentUpdate) setHtml(currentUpdate.content);

    alert(`✅ Added @char: tags for ${taggedNames.size} character(s).`);
  };

  const handleImportIntoCurrent = async (file) => {
    if (!file) return;

    setIsImporting(true);
    setImportProgress("Parsing document...");
    setShowImportModal(false);

    try {
      const parsed = await parseFile(file);
      if (!parsed) {
        alert("Could not parse this document.");
        return;
      }

      if (parsed.title && parsed.title !== bookTitle) setBookTitle(parsed.title);

      const existing = Array.isArray(chapters) ? chapters : [];
      const isSingleBlank =
        existing.length === 1 &&
        !stripHtml(existing[0].content || "").trim() &&
        !(existing[0].title || "").trim();

      if (parsed.chapters && parsed.chapters.length > 0) {
        setImportProgress(`Creating ${parsed.chapters.length} chapter(s)...`);

        parsed.chapters.forEach((c, index) => {
          const content = applyDoubleSpacing(c.content || "");
          const preview = generatePreview(content, 20);

          if (isSingleBlank && index === 0) {
            const firstId = existing[0].id;
            updateChapter(firstId, {
              title: c.title || "Untitled Chapter",
              content,
              preview,
            });
            setSelectedId(firstId);
          } else {
            const newId = addChapter();
            updateChapter(newId, {
              title: c.title || "Untitled Chapter",
              content,
              preview,
            });
          }
        });

        alert(`✅ Imported ${parsed.chapters.length} chapter(s) into current project.`);

        if (window.confirm("Would you like AI to scan for character names in the imported chapters?")) {
          setShowCharacterSuggestion(true);
        }
      }

      saveProject({ book: { ...book, title: parsed.title || bookTitle } });
    } catch (error) {
      console.error("Import failed:", error);
      alert(`❌ Failed to import: ${error.message || "Unknown error"}`);
    } finally {
      setIsImporting(false);
      setImportProgress("");
      setPendingImportFile(null);
    }
  };

  const handleImportAsNewProject = async (file) => {
    if (!file) return;

    setIsImporting(true);
    setImportProgress("Parsing document...");
    setShowImportModal(false);

    try {
      const parsed = await parseFile(file);
      if (!parsed) {
        alert("Could not parse this document.");
        return;
      }

      setImportProgress(`Creating new project "${parsed.title}"...`);

      const chaptersWithPreview = (parsed.chapters || []).map((ch) => ({
        ...ch,
        preview: generatePreview(ch.content, 20),
      }));

      createProjectFromImport({
        ...parsed,
        chapters: chaptersWithPreview,
      });

      setBookTitle(parsed.title);

      storage.setItem("dt_pending_character_scan", "true");

      alert(`✅ Created new project "${parsed.title}" with ${parsed.chapters.length} chapter(s).`);
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      alert(`❌ Failed to import: ${error.message || "Unknown error"}`);
    } finally {
      setIsImporting(false);
      setImportProgress("");
      setPendingImportFile(null);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingImportFile(file);
      setShowImportModal(true);
    }
    e.target.value = "";
  };

  const handleNewProjectFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file) await handleImportAsNewProject(file);
    e.target.value = "";
  };

  const triggerImport = () => fileInputRef.current?.click();
  const triggerNewProjectImport = () => newProjectFileInputRef.current?.click();

  const handleCreateNewProject = () => {
    const t = window.prompt("Enter a title for your new manuscript:", "Untitled Book");
    if (t) {
      createProject(t);
      setBookTitle(t);

      const pid = getSelectedProjectId() || currentProjectId || "unknown";
      saveCurrentStorySnapshot({ id: pid, title: t, primaryGenre });
    }
  };

  const handleSwitchProject = (projectId) => {
    switchProject(projectId);

    try {
      storage.setItem("dahtruth-current-project-id", projectId);
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  };

  const handleExport = () => {
    const cleanHtml = stripCharacterTags(html);
    const blob = new Blob([cleanHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "chapter"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Updated delete: stay in editor, clear selection + stored key
  const handleDeleteCurrent = () => {
    if (!hasChapter) {
      alert("Please select a chapter first.");
      return;
    }

    const label = title || selectedChapter?.title || "Untitled Chapter";

    if (window.confirm(`Delete "${label}"?\n\nThis cannot be undone.`)) {
      deleteChapter(selectedId);

      setSelectedId("");
      try {
        storage.removeItem(selectedChapterStorageKey);
      } catch {}

      setView("editor");
      setEditorViewMode("editor");
    }
  };

  const handleDeleteMultiple = (ids) => {
    if (!ids?.length) return;
    if (!window.confirm(`Delete ${ids.length} chapter(s)? This cannot be undone.`)) return;

    ids.forEach((id) => deleteChapter(id));
    clearSelection();

    if (ids.includes(selectedId)) {
      setSelectedId("");
      try {
        storage.removeItem(selectedChapterStorageKey);
      } catch {}
      setView("editor");
      setEditorViewMode("editor");
    }
  };

  const handleScanForCharacters = () => {
    if (!hasAnyChapters) {
      alert("Import a manuscript first to scan for characters.");
      return;
    }
    setShowCharacterSuggestion(true);
  };

  const goBack = () => navigate("/dashboard");

  // ✅ Writer navigation: always persist selection per-project
  const goToWriter = (chapterId) => {
    const idToUse =
      chapterId ||
      selectedId ||
      (() => {
        try {
          const saved = storage.getItem(selectedChapterStorageKey);
          if (saved && chapters.some((c) => c.id === saved)) return saved;
        } catch {}
        return chapters?.[0]?.id;
      })();

    if (idToUse) {
      setSelectedId(idToUse);
      try {
        storage.setItem(selectedChapterStorageKey, idToUse);
      } catch {}
    }

    setView("editor");
    setEditorViewMode("editor");
  };

  const goToGrid = () => {
    setView("grid");
    setEditorViewMode("editor");
  };

  const switchToEditor = () => {
    if (!selectedId && chapters.length > 0) setSelectedId(chapters[0].id);
    setView("editor");
    setEditorViewMode("editor");
  };

  const switchToPageView = () => {
    if (!selectedId && chapters.length > 0) setSelectedId(chapters[0].id);
    setView("editor");
    setEditorViewMode("pages");
  };

  const refreshDetectedCharacters = useCallback(() => {
    const results = regexScanForCharacters(chapters || []);
    setDetectedCharacters(results || []);
  }, [chapters]);

  useEffect(() => {
    refreshDetectedCharacters();
  }, [refreshDetectedCharacters]);

  const handleSendToPublishing = async () => {
    if (!Array.isArray(chapters) || chapters.length === 0) {
      alert("You need at least one chapter before sending to Publishing.");
      return;
    }

    await handleSave();

    try {
      const cleanedChapters = chapters.map((ch, idx) => {
        const raw = ch.content || ch.body || ch.text || "";
        const noChars = stripCharacterTags(raw);
        const noSpacers = stripSpacerParagraphs(noChars);

        return {
          ...ch,
          content: noSpacers,
          _plainForPublishing: htmlToPlainText(noSpacers),
          _index: idx,
        };
      });

      const normalizedForPublishing = cleanedChapters.map((ch, index) => {
        const htmlForPublishing = ch.content || "";
        const plainForPublishing = htmlToPlainText(htmlForPublishing);

        return {
          id: ch.id || `c_${index + 1}`,
          title: ch.title || `Chapter ${index + 1}`,
          included: typeof ch.included === "boolean" ? ch.included : true,

          html: htmlForPublishing,
          textHTML: htmlForPublishing,
          text: plainForPublishing,
        };
      });

      const safeBookTitle = bookTitle?.trim() || book?.title?.trim() || "Untitled Book";

      const meta = {
        title: safeBookTitle,
        author: author || "Unknown Author",
        year: new Date().getFullYear().toString(),
        authorLast: (author || "").split(" ").slice(-1)[0] || "Author",
        primaryGenre,
      };

      const payload = {
        book: {
          ...book,
          title: safeBookTitle,
          primaryGenre,
          status: "ReadyForPublishing",
          updatedAt: new Date().toISOString(),
        },
        chapters: cleanedChapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          content: ch.content,
        })),
      };

      const projectId = currentProjectId || getSelectedProjectId() || "unknown";
      const keyChapters = chaptersKeyForProject(projectId);
      const metaKey = `dahtruth_project_meta_${projectId}`;
      const draftKey = `publishingDraft_${projectId}`;

      storage.setItem(keyChapters, JSON.stringify(normalizedForPublishing));
      storage.setItem(metaKey, JSON.stringify(meta));
      storage.setItem(draftKey, JSON.stringify(payload));

      saveCurrentStorySnapshot({ id: projectId, title: safeBookTitle, primaryGenre });

      navigate("/publishing");
    } catch (err) {
      console.error("Failed to send manuscript to publishing:", err);
      alert("Something went wrong sending this to Publishing. Please try again.");
    }
  };

  if (!Array.isArray(chapters)) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-lg">Loading chapters...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900 flex flex-col">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={newProjectFileInputRef}
        type="file"
        accept=".doc,.docx,.txt,.md"
        onChange={handleNewProjectFileSelect}
        className="hidden"
      />

      {/* Import Options Modal */}
      <ImportOptionsModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setPendingImportFile(null);
        }}
        onImportCurrent={() => handleImportIntoCurrent(pendingImportFile)}
        onImportNew={() => handleImportAsNewProject(pendingImportFile)}
        fileName={pendingImportFile?.name || ""}
      />

      {/* Character Suggestion Modal */}
      <CharacterSuggestionModal
        isOpen={showCharacterSuggestion}
        onClose={() => setShowCharacterSuggestion(false)}
        chapters={chapters}
        onAddCharacterTags={handleAddCharacterTags}
        provider={provider}
      />

      {/* Banner */}
      <div
        className="text-white flex-shrink-0"
        style={{
          background: "linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 40%, #9b7bc9 100%)",
        }}
      >
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <PenLine size={24} className="text-amber-300" />
                <h1 className="text-xl font-bold text-white">Compose</h1>
              </div>

              <ProjectDropdown
                currentProject={currentProject}
                projects={projects}
                onSwitch={handleSwitchProject}
                onCreate={handleCreateNewProject}
                onImportNew={triggerNewProjectImport}
                onRename={(id, newTitle) => {
                  renameProject(id, newTitle);
                  setBookTitle(newTitle);
                  saveCurrentStorySnapshot({ id, title: newTitle, primaryGenre });
                }}
              />
            </div>

            <div className="flex items-center gap-4 md:gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-white/70">Chapter:</span>
                <span className="font-medium text-white">
                  {currentChapterIndex > 0
                    ? `${currentChapterIndex} / ${chapters.length}`
                    : `${chapters.length} total`}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Words:</span>
                <span className="font-medium text-white">
                  {totalWordCount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Characters:</span>
                <span className="font-medium text-white">{characterCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-white/70">AI:</label>
              <select
                className="bg-white/20 border border-white/30 rounded px-2 py-1 text-xs text-white"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <option value="anthropic" className="text-slate-800">
                  Claude
                </option>
                <option value="openai" className="text-slate-800">
                  GPT
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center gap-3 overflow-x-auto overflow-y-visible">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #B8960C)" }}
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>

          {view === "grid" ? (
            <button
              type="button"
              onClick={() => goToWriter()}
              disabled={!hasAnyChapters}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                border border-slate-200 bg-white hover:bg-slate-50 text-slate-700
                disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Edit3 size={16} />
              Writer
            </button>
          ) : (
            <button
              type="button"
              onClick={goToGrid}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex-shrink-0"
            >
              <Grid3X3 size={16} />
              Grid
            </button>
          )}

          <DropdownMenu label="File" icon={FolderOpen}>
            <DropdownItem
              icon={FolderPlus}
              label="Import as New Project"
              onClick={triggerNewProjectImport}
            />
            <DropdownItem icon={Upload} label="Import into Current Project" onClick={triggerImport} />
            <DropdownDivider />
            <DropdownItem
              icon={Users}
              label="Scan for Characters"
              onClick={handleScanForCharacters}
              disabled={!hasAnyChapters}
            />
            <DropdownDivider />
            <DropdownItem icon={Download} label="Export Chapter" onClick={handleExport} disabled={!hasChapter} />
            <DropdownDivider />
            <DropdownItem
              icon={Save}
              label={
                saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved ✓"
                  : "Save"
              }
              onClick={handleSave}
              disabled={!hasChapter || saveStatus === "saving"}
              shortcut="Ctrl+S"
            />
            <DropdownDivider />
            <DropdownItem icon={Trash2} label="Delete Chapter" onClick={handleDeleteCurrent} disabled={!hasChapter} />
          </DropdownMenu>

          <DropdownMenu label="View" icon={Eye}>
            <DropdownItem icon={Grid3X3} label="Chapter Grid" onClick={() => setView("grid")} active={view === "grid"} />
            <DropdownItem icon={Edit3} label="Editor" onClick={switchToEditor} active={view === "editor" && editorViewMode === "editor"} />
            <DropdownItem icon={FileText} label="Page View (8.5 × 11)" onClick={switchToPageView} active={view === "editor" && editorViewMode === "pages"} />
            <DropdownDivider />
            <DropdownItem icon={CheckSquare} label="Select Mode" onClick={toggleSelectMode} active={selectMode} />
          </DropdownMenu>

          <DropdownMenu label="AI Tools" icon={Sparkles} disabled={!hasChapter || aiBusy}>
            <DropdownItem icon={BookCheck} label="Proofread" onClick={() => { setActiveAiTab("proofread"); handleAI("proofread"); }} active={activeAiTab === "proofread"} />
            <DropdownItem icon={Wand2} label="Clarify" onClick={() => { setActiveAiTab("clarify"); handleAI("clarify"); }} active={activeAiTab === "clarify"} />
            <DropdownItem icon={RefreshCw} label="Rewrite" onClick={() => { setActiveAiTab("rewrite"); handleAI("rewrite"); }} active={activeAiTab === "rewrite"} />
            <DropdownItem icon={Eye} label="Readability" onClick={() => { setActiveAiTab("readability"); handleAI("readability"); }} active={activeAiTab === "readability"} />
            <DropdownDivider />
            <DropdownItem
              icon={MessageSquare}
              label={showAssistant ? "Hide Assistant" : "Show Assistant"}
              onClick={() => setShowAssistant((prev) => !prev)}
              active={showAssistant}
            />
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setShowSearch((s) => !s)}
            className={`
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
              border transition-all flex-shrink-0
              ${
                showSearch
                  ? "bg-amber-100 border-amber-300 text-amber-800"
                  : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
              }
            `}
          >
            <Search size={16} />
            Search
          </button>

          <div className="flex-1" />

          {queueLength > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded border border-blue-200 flex-shrink-0">
              <span className="text-xs text-blue-700">
                ⏳ {queueLength} AI request{queueLength !== 1 ? "s" : ""} queued
              </span>
            </div>
          )}

          {isImporting && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded border border-amber-200 flex-shrink-0">
              <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-amber-700">{importProgress}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSendToPublishing}
            disabled={!hasAnyChapters || saveStatus === "saving"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37, #B8960C)" }}
          >
            <Send size={16} />
            Send to Publishing
          </button>
        </div>
      </div>

      {/* GRID VIEW */}
      {view === "grid" && (
        <div className="flex-1">
          {showSearch && (
            <div className="max-w-[1800px] mx-auto px-4 pt-4">
              <SearchPanel
                chapters={chapters}
                onSelectChapter={(id) => {
                  setSelectedId(id);
                  setView("editor");
                  setShowSearch(false);
                }}
                onClose={() => setShowSearch(false)}
              />
            </div>
          )}

          <ChapterGrid
            chapters={chapters}
            selectedId={selectedId}
            onSelectChapter={(id) => {
              if (!id) return;
              if (selectMode) toggleSelect(id);
              else goToWriter(id);
            }}
            onAddChapter={addChapter}
            onMoveChapter={moveChapter}
            onDeleteChapter={deleteChapter}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onRangeSelect={(idx) => rangeSelect(idx)}
            lastClickedIndexRef={lastClickedIndexRef}
          />

          <TrashDock onDelete={handleDeleteMultiple} />
        </div>
      )}

      {/* EDITOR VIEW */}
      {view === "editor" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="max-w-[1800px] mx-auto px-4 py-4 flex-1 flex flex-col min-h-0 w-full">
            <div className="mb-4 flex-shrink-0">
              <EditorToolbar
                onAI={handleAI}
                onSave={handleSave}
                onImport={handleImportIntoCurrent}
                onExport={handleExport}
                onDelete={handleDeleteCurrent}
                aiBusy={aiBusy || isImporting || chatBusy}
                saveStatus={saveStatus}
                activeAiTab={activeAiTab}
                setActiveAiTab={setActiveAiTab}
                onToggleAssistant={() => setShowAssistant((prev) => !prev)}
                assistantOpen={showAssistant}
              />
            </div>

            <div
              className="grid gap-6 flex-1 min-h-0 overflow-hidden items-stretch"
              style={{
                gridTemplateColumns: showAssistant
                  ? "300px minmax(0, 1fr) 320px"
                  : "300px minmax(0, 1fr)",
                alignItems: "stretch",
              }}
            >
              {/* LEFT SIDEBAR */}
              <aside className="min-h-0 flex flex-col gap-4 overflow-y-auto pr-1">
                {/* ✅ ONLY ONE SidebarRouter (duplicate removed) */}
                <SidebarRouter
                  genre={primaryGenre}
                  chapters={chapters}
                  selectedChapterId={selectedId}
                  projectId={currentProjectId}
                  projectTitle={bookTitle}
                  wordCount={totalWordCount}
                  targetWords={50000}
                  hasAnyChapters={hasAnyChapters}
                  onSelectChapter={(id) => {
                    if (!id) return;
                    setSelectedId(id);
                    setView("editor");
                    setEditorViewMode("editor");
                    try {
                      storage.setItem(selectedChapterStorageKey, id);
                    } catch {}
                  }}
                  onRefresh={() => window.dispatchEvent(new Event("project:change"))}
                />

                {headings.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      Table of Contents
                    </div>
                    <ul className="space-y-1 max-h-64 overflow-auto text-xs">
                      {headings.map((h, idx) => (
                        <li key={`${h.level}-${idx}-${h.text}`} className="text-slate-700">
                          <span
                            className={
                              h.level === "h1"
                                ? "font-semibold"
                                : h.level === "h2"
                                ? "ml-2"
                                : "ml-4 text-slate-500"
                            }
                          >
                            {h.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Characters Card */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm min-h-[140px]">
                  <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between gap-2">
                    <span>Characters</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">{characterCount} tagged</span>
                      <button
                        type="button"
                        onClick={refreshDetectedCharacters}
                        disabled={!hasAnyChapters}
                        className="text-[11px] px-2 py-1 rounded border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        title="Refresh detected character list"
                      >
                        Refresh Detected
                      </button>
                    </div>
                  </div>

                  {characterCount === 0 ? (
                    <div>
                      <p className="text-[11px] text-slate-500 leading-snug mb-2">
                        No characters tagged yet.
                        <br />
                        Introduce a character as{" "}
                        <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">
                          @char: John Smith
                        </span>
                      </p>
                      <button
                        onClick={handleScanForCharacters}
                        disabled={!hasAnyChapters}
                        className="text-[11px] px-2 py-1 rounded border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                      >
                        ✨ Scan for Characters
                      </button>

                      {detectedCharacters?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="text-[11px] font-semibold text-slate-600 mb-2">
                            Detected (candidates)
                          </div>
                          <ul className="space-y-1 max-h-40 overflow-auto text-xs">
                            {detectedCharacters.slice(0, 25).map((c) => (
                              <li key={c.name} className="text-slate-700 truncate">
                                {c.name}
                              </li>
                            ))}
                          </ul>
                          {detectedCharacters.length > 25 && (
                            <div className="text-[11px] text-slate-400 mt-2">
                              Showing 25 of {detectedCharacters.length}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <ul className="space-y-1 max-h-40 overflow-auto text-xs">
                        {characters.map((name) => (
                          <li key={name} className="text-slate-700 truncate">
                            {name}
                          </li>
                        ))}
                      </ul>

                      {detectedCharacters?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <div className="text-[11px] font-semibold text-slate-600 mb-2">
                            Detected (candidates)
                          </div>
                          <ul className="space-y-1 max-h-40 overflow-auto text-xs">
                            {detectedCharacters.slice(0, 25).map((c) => (
                              <li key={c.name} className="text-slate-700 truncate">
                                {c.name}
                              </li>
                            ))}
                          </ul>
                          {detectedCharacters.length > 25 && (
                            <div className="text-[11px] text-slate-400 mt-2">
                              Showing 25 of {detectedCharacters.length}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </aside>

              {/* Main Editor/Paginated View */}
              <main className="min-h-0 min-w-0 overflow-hidden relative z-10">
                <div className="min-h-0 min-w-0 w-full h-full overflow-x-auto">
                  {editorViewMode === "pages" ? (
                    <PaginatedView
                      html={html}
                      title={title}
                      author={author}
                      chapterNumber={chapters.findIndex((c) => c.id === selectedId) + 1}
                      onEdit={() => setEditorViewMode("editor")}
                    />
                  ) : (
                    <EditorPane
                      title={title}
                      setTitle={setTitle}
                      html={html}
                      setHtml={setHtml}
                      onSave={handleSave}
                      onAI={handleAI}
                      aiBusy={aiBusy || chatBusy}
                      pageWidth={1000}
                      onHeadingsChange={setHeadings}
                    />
                  )}
                </div>
              </main>

              {/* Right-hand AI Assistant */}
              {showAssistant && (
                <section
                  className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm h-full overflow-hidden relative z-20"
                  style={{ minHeight: "400px", maxHeight: "calc(100vh - 180px)" }}
                >
                  <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">AI Assistant</div>
                      <div className="text-[11px] text-slate-500">Ask questions, get suggestions</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAssistant(false)}
                      className="text-[11px] px-2 py-1 rounded border border-slate-200 hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 text-sm">
                    {chatMessages.length === 0 && (
                      <p className="text-[12px] text-slate-500 mt-2">
                        Example questions:
                        <br />• "Help me tighten this opening."
                        <br />• "Is this dialogue natural?"
                        <br />• "Suggest a stronger ending."
                      </p>
                    )}

                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={
                          msg.role === "user"
                            ? "self-end max-w-[80%] rounded-lg bg-indigo-50 px-3 py-2 text-xs"
                            : "self-start max-w-[80%] rounded-lg bg-slate-50 px-3 py-2 text-xs"
                        }
                      >
                        <div className="whitespace-pre-wrap text-slate-800">{msg.content}</div>
                        {msg.role === "assistant" && (
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="mt-1 text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100"
                          >
                            Copy
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAssistantSend();
                    }}
                    className="border-t border-slate-200 p-2 space-y-2 flex-shrink-0"
                  >
                    <textarea
                      rows={3}
                      className="w-full resize-none rounded-md border border-slate-300 px-2 py-1 text-[13px] focus:outline-none focus:ring-2 focus:ring-amber-400"
                      placeholder="Ask a question..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleAssistantKeyDown}
                      disabled={chatBusy}
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-slate-500">Enter to send</div>
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || chatBusy}
                        className="text-[13px] px-3 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                      >
                        {chatBusy ? "Thinking…" : "Send"}
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
