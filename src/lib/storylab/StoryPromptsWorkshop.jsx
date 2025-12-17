import React, { useState, useEffect, useMemo } from "react";
import {
  Copy, Check, Filter, Timer, User, TrendingUp, Feather, Globe, Star, X, Pin, Edit3,
  Lightbulb, Save, Trash2, Send, FileText, Shuffle, ChevronDown, Sparkles, RefreshCw, Loader2
} from "lucide-react";

import BackToLanding, { BackToLandingFab } from "../../components/storylab/BackToLanding";

// Import the AI runner - adjust path if file is in lib/storylab/
import { runAssistant } from "../api";

/* =========================================================
   STORAGE HELPERS - Read from ComposePage's storage
========================================================= */

const LEGACY_CHAPTERS_KEY = "dahtruth_chapters";
const LEGACY_META_KEY = "dahtruth_project_meta";
const CURRENT_PROJECT_KEY = "dahtruth_current_project";
const STORYLAB_KEY = "dahtruth-story-lab-toc-v3";
const AI_PROMPTS_CACHE_KEY = "dahtruth_ai_prompts_cache";

/** Load chapters from ComposePage's storage */
function loadChaptersFromStorage() {
  try {
    // 1. Try unified project system first
    const currentProjectRaw = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentProjectRaw) {
      const project = JSON.parse(currentProjectRaw);
      if (project?.compose?.chapters && Array.isArray(project.compose.chapters)) {
        return project.compose.chapters.map((c, idx) => ({
          id: c.id ?? idx,
          title: c.title ?? `Chapter ${idx + 1}`,
          text: c.text ?? c.textHTML ?? c.content ?? "",
          content: c.content ?? c.text ?? c.textHTML ?? "",
          storyLab: c.storyLab || {},
        }));
      }
    }

    // 2. Try dahtruth_chapters (ComposePage writes here)
    const chaptersRaw = localStorage.getItem(LEGACY_CHAPTERS_KEY);
    if (chaptersRaw) {
      const chapters = JSON.parse(chaptersRaw);
      if (Array.isArray(chapters) && chapters.length > 0) {
        return chapters.map((c, idx) => ({
          id: c.id ?? idx,
          title: c.title ?? `Chapter ${idx + 1}`,
          text: c.text ?? c.textHTML ?? c.content ?? "",
          content: c.content ?? c.text ?? c.textHTML ?? "",
          storyLab: c.storyLab || {},
        }));
      }
    }

    // 3. Fallback to StoryLab's own key
    const storyLabRaw = localStorage.getItem(STORYLAB_KEY);
    if (storyLabRaw) {
      const project = JSON.parse(storyLabRaw);
      if (project?.chapters && Array.isArray(project.chapters)) {
        return project.chapters.map((c, idx) => ({
          id: c.id ?? idx,
          title: c.title ?? `Chapter ${idx + 1}`,
          text: c.text ?? c.content ?? c.body ?? "",
          content: c.content ?? c.text ?? "",
          storyLab: c.storyLab || {},
        }));
      }
    }

    return [];
  } catch (err) {
    console.error("[StoryPrompts] Failed to load chapters:", err);
    return [];
  }
}

/** Load project metadata */
function loadProjectMeta() {
  try {
    const metaRaw = localStorage.getItem(LEGACY_META_KEY);
    if (metaRaw) return JSON.parse(metaRaw);
  } catch {}
  return { title: "My Story", author: "Author" };
}

/** Save/update a chapter back to ComposePage's storage */
function updateChapterInStorage(chapterId, updater) {
  try {
    const chaptersRaw = localStorage.getItem(LEGACY_CHAPTERS_KEY);
    if (chaptersRaw) {
      const chapters = JSON.parse(chaptersRaw);
      if (Array.isArray(chapters)) {
        const idx = chapters.findIndex((c) => String(c.id) === String(chapterId));
        if (idx !== -1) {
          const current = chapters[idx];
          const updated = updater(current);
          chapters[idx] = { ...current, ...updated };
          localStorage.setItem(LEGACY_CHAPTERS_KEY, JSON.stringify(chapters));
        }
      }
    }

    const currentProjectRaw = localStorage.getItem(CURRENT_PROJECT_KEY);
    if (currentProjectRaw) {
      const project = JSON.parse(currentProjectRaw);
      if (project?.compose?.chapters) {
        const idx = project.compose.chapters.findIndex((c) => String(c.id) === String(chapterId));
        if (idx !== -1) {
          const current = project.compose.chapters[idx];
          const updated = updater(current);
          project.compose.chapters[idx] = { ...current, ...updated };
          project.updatedAt = new Date().toISOString();
          localStorage.setItem(CURRENT_PROJECT_KEY, JSON.stringify(project));
        }
      }
    }

    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("[StoryPrompts] Failed to update chapter:", err);
  }
}

/** Save StoryLab-specific data for a chapter */
function saveStoryLabData(chapterId, storyLabData) {
  updateChapterInStorage(chapterId, (ch) => ({
    ...ch,
    storyLab: { ...(ch.storyLab || {}), ...storyLabData },
  }));
}

/** Cache AI prompts */
function saveAIPromptsCache(prompts, storyHash) {
  try {
    localStorage.setItem(AI_PROMPTS_CACHE_KEY, JSON.stringify({
      prompts,
      storyHash,
      timestamp: Date.now(),
    }));
  } catch {}
}

function loadAIPromptsCache() {
  try {
    const raw = localStorage.getItem(AI_PROMPTS_CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/** Simple hash for cache invalidation */
function hashStory(chapters) {
  const text = chapters.map(c => c.text || c.content || "").join("");
  let hash = 0;
  for (let i = 0; i < Math.min(text.length, 1000); i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString();
}

/* =========================================================
   NLP HELPERS (for local prompts)
========================================================= */
const splitSentences = (txt) =>
  (txt || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];

/**
 * Extract characters from @char: tags in the manuscript
 * Example: "@char: Marcus Johnson" or "@char:Sarah"
 * Returns deduplicated, normalized character names
 */
function extractCharactersFromTags(text) {
  if (!text) return [];
  
  // Match @char: followed by the character name (until end of line or next tag)
  const pattern = /@char:\s*([A-Za-z][A-Za-z'\-\s]{0,50}?)(?=\s*[@<\n]|$)/gi;
  const matches = text.matchAll(pattern);
  
  const seen = new Map(); // lowercase -> original casing
  
  for (const match of matches) {
    const name = (match[1] || "").trim();
    if (name && name.length > 1) {
      const key = name.toLowerCase();
      // Keep the first occurrence's casing
      if (!seen.has(key)) {
        seen.set(key, name);
      }
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Fallback: guess characters from capitalized names
 * Only used if no @char: tags found
 */
function guessCharactersFromText(text) {
  const names = new Set();
  const skipWords = new Set([
    "I", "The", "A", "An", "And", "But", "Then", "Now", "When", "Where", 
    "What", "How", "Why", "She", "He", "They", "It", "This", "That",
    "My", "Your", "Our", "His", "Her", "Its", "Their", "Who", "Which",
    "There", "Here", "Just", "Only", "Even", "Still", "Also", "Very",
    "Chapter", "Part", "Book", "Section", "Scene", "Act", "Note"
  ]);
  
  const tokens = (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  
  tokens.forEach((t) => {
    const parts = t.split(/\s+/);
    // Skip if any part is a common word
    if (parts.some(p => skipWords.has(p))) return;
    names.add(t.trim());
  });
  
  return Array.from(names).slice(0, 20);
}

/**
 * Get characters - prefers @char: tags, falls back to guessing
 */
function getCharacters(text) {
  // First try @char: tags
  const taggedChars = extractCharactersFromTags(text);
  if (taggedChars.length > 0) {
    return { characters: taggedChars, source: "tagged" };
  }
  
  // Fall back to guessing
  const guessedChars = guessCharactersFromText(text);
  return { characters: guessedChars, source: "guessed" };
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}

function extractEmotions(text) {
  const emotions = [
    "fear","hope","love","anger","joy","sadness","worry","excitement","disappointment","relief"
  ];
  const found = [];
  emotions.forEach((emotion) => {
    const sentences = extractKeywordSentences(text, emotion);
    if (sentences.length > 0) found.push({ emotion, sentences: sentences.slice(0, 2) });
  });
  return found;
}

function extractConflicts(text) {
  const hits = [];
  const needles = [
    "conflict","tension","argument","fight","feud","rivalry","obstacle","problem","challenge","struggle","battle"
  ];
  const sentences = splitSentences(text);
  sentences.forEach((s) => {
    if (needles.some((n) => s.toLowerCase().includes(n))) hits.push(s.trim());
  });
  return hits;
}

function analyzeStoryStructure(chapters, selectedChapter) {
  const total = chapters.length || 1;
  const idx = selectedChapter
    ? Math.max(0, chapters.findIndex((c) => c.id === selectedChapter.id))
    : 0;
  const progress = idx / total;
  if (progress < 0.25) return { act: "setup", phase: "beginning" };
  if (progress < 0.75) return { act: "confrontation", phase: "middle" };
  return { act: "resolution", phase: "ending" };
}

/* =========================================================
   PROMPT CATEGORIES & GENERATION
========================================================= */
const PROMPT_CATEGORIES = {
  sprint: { label: "Quick Sprints", icon: Timer, color: "emerald", time: "5–15 min" },
  character: { label: "Character", icon: User, color: "blue", time: "20–30 min" },
  plot: { label: "Plot", icon: TrendingUp, color: "purple", time: "15–45 min" },
  craft: { label: "Craft", icon: Feather, color: "orange", time: "10–20 min" },
  worldbuilding: { label: "World", icon: Globe, color: "teal", time: "20–40 min" },
  ai: { label: "AI Generated", icon: Sparkles, color: "amber", time: "varies" },
};

function generateLocalPrompts(chapters, characters, selectedChapter) {
  const fullText = chapters.map((c) => c.text || c.content || "").join("\n\n");
  const selectedText = selectedChapter?.text || selectedChapter?.content || fullText;
  const structure = analyzeStoryStructure(chapters, selectedChapter);
  const emotions = extractEmotions(selectedText);
  const conflicts = extractConflicts(selectedText);

  const prompts = [];
  const usedPromptKeys = new Set(); // Track used prompts to avoid duplicates

  // Helper to add prompt only if not duplicate
  const addPrompt = (prompt) => {
    const key = prompt.text.toLowerCase().trim();
    if (!usedPromptKeys.has(key)) {
      usedPromptKeys.add(key);
      prompts.push(prompt);
    }
  };

  // Sprint prompts (generic)
  addPrompt({ category: "sprint", text: "Write a 100-word scene showing (don't tell) your protagonist's biggest fear.", difficulty: 1 });
  addPrompt({ category: "sprint", text: "Describe your current setting through the five senses in exactly 50 words.", difficulty: 1 });
  addPrompt({ category: "sprint", text: "Write dialogue that reveals a secret without stating it directly.", difficulty: 2 });
  addPrompt({ category: "sprint", text: "Write a scene where two characters want opposite things.", difficulty: 2 });
  addPrompt({ category: "sprint", text: "Describe an object that holds emotional significance to your main character.", difficulty: 1 });

  // Character prompts - use @char: tagged characters
  // Different prompt templates to rotate through (one per character)
  const characterPromptTemplates = [
    { template: (name) => `What secret is ${name} keeping from everyone? Write the moment they almost reveal it.`, difficulty: 3 },
    { template: (name) => `Write ${name}'s internal monologue during a moment of decision.`, difficulty: 2 },
    { template: (name) => `What does ${name} want more than anything? Show them pursuing it.`, difficulty: 2 },
    { template: (name) => `Write a scene showing ${name}'s relationship with their family or past.`, difficulty: 3 },
    { template: (name) => `Give ${name} an unexpected moment of vulnerability. How do they handle it?`, difficulty: 2 },
    { template: (name) => `What would ${name} never forgive? Write a scene that tests this.`, difficulty: 3 },
    { template: (name) => `Show ${name} in a moment of joy. What brings them happiness?`, difficulty: 1 },
    { template: (name) => `Write ${name} confronting someone who wronged them.`, difficulty: 3 },
    { template: (name) => `What lie does ${name} tell themselves? Show it in action.`, difficulty: 3 },
    { template: (name) => `Describe ${name}'s morning routine. What does it reveal about them?`, difficulty: 1 },
  ];

  // Assign ONE unique prompt to each character
  characters.forEach((charName, idx) => {
    const templateIdx = idx % characterPromptTemplates.length;
    const { template, difficulty } = characterPromptTemplates[templateIdx];
    addPrompt({
      category: "character",
      text: template(charName),
      difficulty,
      contextual: true,
      characterName: charName,
    });
  });

  // If we have multiple characters, add relationship prompts
  if (characters.length >= 2) {
    const [char1, char2] = characters;
    addPrompt({
      category: "character",
      text: `Write a scene where ${char1} and ${char2} disagree about something important.`,
      difficulty: 2,
      contextual: true,
    });
    
    if (characters.length >= 3) {
      const char3 = characters[2];
      addPrompt({
        category: "character",
        text: `How does ${char3} view the relationship between ${char1} and ${char2}? Show their perspective.`,
        difficulty: 3,
        contextual: true,
      });
    }
  }

  // Plot by structure
  if (structure.phase === "beginning") {
    addPrompt({ category: "plot", text: "Introduce a problem that will drive your entire story in the next scene.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Write the moment when ordinary life ends and the adventure begins.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Plant a detail now that will pay off later in the story.", difficulty: 2 });
  } else if (structure.phase === "middle") {
    addPrompt({ category: "plot", text: "Write a scene where everything goes wrong at the worst possible moment.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Introduce a complication that makes your protagonist's goal seem impossible.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Write a moment where your protagonist must choose between two bad options.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Add a twist that changes how the reader sees a previous scene.", difficulty: 4 });
  } else {
    addPrompt({ category: "plot", text: "Write the confrontation scene where your protagonist faces their greatest fear.", difficulty: 4 });
    addPrompt({ category: "plot", text: "Show how your protagonist has changed since the beginning.", difficulty: 3 });
    addPrompt({ category: "plot", text: "Write the moment of truth where everything comes together.", difficulty: 4 });
  }

  // Craft prompts
  addPrompt({ category: "craft", text: "Rewrite your last dialogue scene using only subtext—characters say everything except what they mean.", difficulty: 3 });
  addPrompt({ category: "craft", text: "Write a paragraph of pure action with no adjectives or adverbs.", difficulty: 2 });
  addPrompt({ category: "craft", text: "Describe an emotional moment using only physical sensations and actions.", difficulty: 2 });
  addPrompt({ category: "craft", text: "Write a scene where the weather reflects the emotional state of the characters.", difficulty: 2 });
  addPrompt({ category: "craft", text: "Take a slow scene and rewrite it with urgency and tension.", difficulty: 3 });

  // Worldbuilding prompts
  addPrompt({ category: "worldbuilding", text: "Create a location that reflects your protagonist's internal state.", difficulty: 2 });
  addPrompt({ category: "worldbuilding", text: "Write about a cultural tradition or rule that creates conflict in your story.", difficulty: 3 });
  addPrompt({ category: "worldbuilding", text: "Design a place where your characters go to feel safe. What makes it special?", difficulty: 2 });
  addPrompt({ category: "worldbuilding", text: "What does money, power, or status look like in your story's world?", difficulty: 2 });

  // Contextual: emotions from your story (limit to 2)
  emotions.slice(0, 2).forEach(({ emotion, sentences }) => {
    if (sentences[0]) {
      addPrompt({
        category: "character",
        text: `Expand on this ${emotion}: "${sentences[0].slice(0, 100)}${sentences[0].length > 100 ? "…" : ""}"`,
        difficulty: 2,
        contextual: true,
      });
    }
  });

  // Contextual: conflicts from your story (limit to 2)
  conflicts.slice(0, 2).forEach((conflict) => {
    addPrompt({
      category: "plot",
      text: `Escalate this conflict: "${conflict.slice(0, 100)}${conflict.length > 100 ? "…" : ""}"`,
      difficulty: 3,
      contextual: true,
    });
  });

  return prompts.map((p, i) => ({ ...p, id: `local_${i}`, source: "local" }));
}

/* =========================================================
   AI PROMPT GENERATION
========================================================= */

async function generateAIPrompts(chapters, projectMeta, characters, provider = "anthropic") {
  // Build story summary for AI
  const chapterSummaries = chapters.slice(0, 10).map((ch, idx) => {
    const text = (ch.text || ch.content || "").replace(/<[^>]*>/g, " ").trim();
    const preview = text.slice(0, 500);
    return `Chapter ${idx + 1}: "${ch.title || 'Untitled'}"\n${preview}${text.length > 500 ? "..." : ""}`;
  }).join("\n\n---\n\n");

  const fullText = chapters.map(c => (c.text || c.content || "").replace(/<[^>]*>/g, " ")).join(" ");
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  // Include character list if available
  const characterInfo = characters.length > 0 
    ? `\n\nKnown characters in this story: ${characters.join(", ")}`
    : "";

  const systemPrompt = `You are a creative writing coach analyzing a manuscript to generate personalized writing prompts.

The story is titled "${projectMeta.title || 'Untitled'}" by ${projectMeta.author || 'the author'}.
It currently has ${chapters.length} chapters and approximately ${wordCount.toLocaleString()} words.${characterInfo}

Based on the content provided, generate 12-15 specific, actionable writing prompts that will help the author:
1. Deepen their characters (use the actual character names from the story)
2. Strengthen their plot
3. Improve pacing and tension
4. Enhance world-building
5. Refine their craft

IMPORTANT RULES:
- Each prompt should reference SPECIFIC elements from their story (character names, plot points, settings, themes)
- Use the actual character names provided - do NOT make up character names
- Each prompt should be UNIQUE - do not repeat similar prompts
- Give each character at most ONE prompt focused on them
- Mix up the categories (character, plot, craft, worldbuilding, sprint)

Return your response as a JSON array with this exact format:
[
  {
    "text": "The specific prompt text",
    "category": "character|plot|craft|worldbuilding|sprint",
    "difficulty": 1-4,
    "reason": "Brief explanation of why this prompt is relevant to their story"
  }
]

Only return the JSON array, no other text.`;

  const userMessage = `Here is the manuscript to analyze:

${chapterSummaries}

Generate personalized writing prompts based on this story's characters, plot, themes, and areas that could be developed further.`;

  try {
    const result = await runAssistant(userMessage, "clarify", systemPrompt, provider);
    
    const responseText = result?.result || result?.text || result?.output || result || "";
    
    // Parse JSON from response
    let prompts = [];
    try {
      // Try to find JSON array in response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        prompts = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("[AI Prompts] Failed to parse JSON:", parseError);
      // Try line-by-line parsing as fallback
      const lines = responseText.split("\n").filter(l => l.trim());
      prompts = lines.slice(0, 15).map((line, i) => ({
        text: line.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "").trim(),
        category: "ai",
        difficulty: 2,
        reason: "AI-generated prompt",
      }));
    }

    // Validate and normalize prompts
    return prompts
      .filter(p => p && p.text && p.text.length > 10)
      .map((p, i) => ({
        id: `ai_${i}`,
        text: p.text,
        category: p.category || "ai",
        difficulty: Math.min(4, Math.max(1, p.difficulty || 2)),
        reason: p.reason || "",
        source: "ai",
        contextual: true,
      }));
  } catch (error) {
    console.error("[AI Prompts] Generation failed:", error);
    throw error;
  }
}

/* =========================================================
   MODALS
========================================================= */

function Scratchpad({ 
  isOpen, 
  onClose, 
  content, 
  onChange, 
  onSave, 
  onSendToChapter, 
  onClear,
  chapters,
  selectedChapterId,
  onChapterSelect 
}) {
  const [insertPosition, setInsertPosition] = useState("top");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col border border-white/60 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Writing Scratchpad</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Start writing from the prompt… Your work here can be sent directly to any chapter."
            className="w-full h-72 p-4 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-slate-800 bg-white text-[15px] leading-relaxed"
          />
        </div>

        {/* Send to Chapter Section */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-slate-600 font-medium">Send to:</span>
            
            <div className="relative">
              <select
                value={selectedChapterId || ""}
                onChange={(e) => onChapterSelect(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer min-w-[200px]"
              >
                <option value="">Select a chapter...</option>
                {chapters.map((ch, idx) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title || `Chapter ${idx + 1}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setInsertPosition("top")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  insertPosition === "top" 
                    ? "bg-amber-100 text-amber-800" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                At Top
              </button>
              <button
                onClick={() => setInsertPosition("bottom")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  insertPosition === "bottom" 
                    ? "bg-amber-100 text-amber-800" 
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                At Bottom
              </button>
            </div>

            <button
              onClick={() => onSendToChapter(insertPosition)}
              disabled={!selectedChapterId || !content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Send size={16} />
              Send to Chapter
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200">
          <div className="flex gap-2">
            <button 
              onClick={onSave} 
              disabled={!content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Save size={16} />
              Save Work
            </button>
            <button
              onClick={() => {
                if (content.trim()) {
                  navigator.clipboard?.writeText(content);
                }
              }}
              disabled={!content.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <Copy size={16} />
              Copy All
            </button>
          </div>
          <button 
            onClick={onClear} 
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedPromptsMenu({ savedPrompts, isOpen, onClose, onLoadPrompt }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col border border-white/60 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Saved Prompt Work</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          {savedPrompts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p className="font-medium">No saved prompt work yet</p>
              <p className="text-sm mt-1">Write with prompts and save them to see them here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPrompts.map((item) => (
                <div key={item.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-slate-800 text-sm">{item.prompt.slice(0, 80)}…</h4>
                    <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{item.content.slice(0, 150)}…</p>
                  <button 
                    onClick={() => onLoadPrompt(item)} 
                    className="text-amber-600 hover:text-amber-700 font-medium text-sm"
                  >
                    Load &amp; Edit →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROMPT CARD
========================================================= */
function PromptCard({ prompt, onPin, onUnpin, onUse, onMarkTried, isPinned, status }) {
  const cat = PROMPT_CATEGORIES[prompt.category] || PROMPT_CATEGORIES.ai;
  const CatIcon = cat?.icon;

  const chipByColor = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-800",
    blue: "border-blue-300 bg-blue-50 text-blue-800",
    purple: "border-purple-300 bg-purple-50 text-purple-800",
    orange: "border-orange-300 bg-orange-50 text-orange-800",
    teal: "border-teal-300 bg-teal-50 text-teal-800",
    amber: "border-amber-300 bg-amber-50 text-amber-800",
  };

  const statusIcons = {
    tried: { icon: Check, color: "text-emerald-600", label: "Tried" },
    helpful: { icon: Star, color: "text-amber-500", label: "Helpful" },
    skip: { icon: X, color: "text-slate-400", label: "Skip" },
  };
  const StatusIcon = status ? statusIcons[status]?.icon : null;

  return (
    <div className={`bg-white rounded-xl p-4 border hover:shadow-md transition-all ${
      prompt.source === "ai" ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200 hover:border-slate-300"
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className={`px-2 py-1 rounded-md text-xs border ${cat ? chipByColor[cat.color] : "border-slate-200 bg-slate-50 text-slate-700"}`}>
            {CatIcon ? <CatIcon size={12} className="inline mr-1" /> : null}
            {cat?.label || "Prompt"}
          </div>
          {prompt.source === "ai" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-gradient-to-r from-amber-400 to-orange-400 text-white font-medium">
              AI
            </span>
          )}
          {prompt.difficulty ? (
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < prompt.difficulty ? "bg-slate-600" : "bg-slate-200"}`} />
              ))}
            </div>
          ) : null}
        </div>
        {status && StatusIcon ? (
          <div className={`flex items-center gap-1 text-xs ${statusIcons[status].color}`}>
            <StatusIcon size={14} />
            {statusIcons[status].label}
          </div>
        ) : null}
      </div>

      {/* Prompt text */}
      <div className="text-slate-700 text-sm leading-relaxed mb-3">{prompt.text}</div>

      {/* AI reason */}
      {prompt.reason && prompt.source === "ai" && (
        <div className="mb-3 text-xs text-amber-700 bg-amber-50 px-2 py-1.5 rounded-md border border-amber-100">
          💡 {prompt.reason}
        </div>
      )}

      {/* Contextual badge */}
      {prompt.contextual && prompt.source !== "ai" && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
            <Lightbulb size={12} />
            From your story
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard && navigator.clipboard.writeText(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 transition-all"
            title="Copy"
          >
            <Copy size={12} />
            Copy
          </button>

          <button
            onClick={() => onUse(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-50 text-amber-700 text-xs hover:bg-amber-100 transition-all border border-amber-200"
            title="Use in scratchpad"
          >
            <Edit3 size={12} />
            Use
          </button>

          {isPinned ? (
            <button
              onClick={() => onUnpin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-100 border border-amber-300 hover:bg-amber-200 text-amber-800 text-xs transition-all"
              title="Remove from Session Pack"
            >
              <Check size={12} />
              In Pack
            </button>
          ) : (
            <button
              onClick={() => onPin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 text-xs text-slate-600 transition-all"
              title="Add to Session Pack"
            >
              <Pin size={12} />
              Pack
            </button>
          )}
        </div>

        {/* Status quick marks */}
        <div className="flex items-center gap-1">
          {!status && (
            <>
              <button
                onClick={() => onMarkTried(prompt.id, "tried")}
                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 transition-all"
                title="Mark as tried"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, "helpful")}
                className="p-1.5 rounded hover:bg-amber-50 text-amber-500 transition-all"
                title="Mark as helpful"
              >
                <Star size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, "skip")}
                className="p-1.5 rounded hover:bg-slate-50 text-slate-400 transition-all"
                title="Skip"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function StoryPromptsWorkshop() {
  const [chapters, setChapters] = useState([]);
  const [projectMeta, setProjectMeta] = useState({ title: "", author: "" });
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [characterSource, setCharacterSource] = useState("none"); // "tagged" | "guessed" | "none"
  const [activeCategory, setActiveCategory] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [showContextual, setShowContextual] = useState(true);
  const [promptSource, setPromptSource] = useState("all"); // "all" | "local" | "ai"

  // AI state
  const [aiPrompts, setAiPrompts] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiProvider, setAiProvider] = useState("anthropic");

  // Enhanced state
  const [pinned, setPinned] = useState([]);
  const [promptStatuses, setPromptStatuses] = useState({});
  const [toast, setToast] = useState("");
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [scratchpadContent, setScratchpadContent] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [savedPrompts, setSavedPrompts] = useState([]);
  const [savedPromptsMenuOpen, setSavedPromptsMenuOpen] = useState(false);
  const [targetChapterId, setTargetChapterId] = useState(null);

  // Load chapters on mount
  useEffect(() => {
    const loaded = loadChaptersFromStorage();
    const meta = loadProjectMeta();
    
    console.log("[StoryPrompts] Loaded chapters:", loaded.length);
    
    setChapters(loaded);
    setProjectMeta(meta);
    
    if (loaded.length > 0) {
      setSelectedChapter(loaded[0]);
      setTargetChapterId(loaded[0].id);
      
      // Extract characters using @char: tags
      const allText = loaded.map((c) => c.text || c.content || "").join("\n\n");
      const { characters: foundChars, source } = getCharacters(allText);
      console.log(`[StoryPrompts] Found ${foundChars.length} characters via ${source}:`, foundChars);
      setCharacters(foundChars);
      setCharacterSource(source);
    }

    // Load cached AI prompts
    const cache = loadAIPromptsCache();
    if (cache && cache.prompts && loaded.length > 0) {
      const currentHash = hashStory(loaded);
      if (cache.storyHash === currentHash) {
        setAiPrompts(cache.prompts);
      }
    }
  }, []);

  // Refresh when project changes
  useEffect(() => {
    const refresh = () => {
      const loaded = loadChaptersFromStorage();
      setChapters(loaded);
      if (loaded.length > 0 && !selectedChapter) {
        setSelectedChapter(loaded[0]);
        setTargetChapterId(loaded[0].id);
      }
    };
    window.addEventListener("project:change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("project:change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [selectedChapter]);

  // Load StoryLab data for selected chapter
  useEffect(() => {
    if (!selectedChapter) return;
    const ch = chapters.find((c) => c.id === selectedChapter.id);
    const lab = ch?.storyLab || {};
    setPinned(Array.isArray(lab.pinned) ? lab.pinned : []);
    setPromptStatuses(lab.promptStatuses || {});
    setScratchpadContent(lab.scratchpad || "");
    setSavedPrompts(lab.savedPrompts || []);
  }, [selectedChapter, chapters]);

  // Persist StoryLab data
  useEffect(() => {
    if (!selectedChapter) return;
    saveStoryLabData(selectedChapter.id, {
      pinned,
      promptStatuses,
      scratchpad: scratchpadContent,
      savedPrompts,
    });
  }, [pinned, promptStatuses, scratchpadContent, savedPrompts, selectedChapter]);

  // Generate AI prompts
  const handleGenerateAIPrompts = async () => {
    if (chapters.length === 0) {
      showToast("No chapters to analyze. Write some content first!");
      return;
    }

    setAiLoading(true);
    setAiError("");

    try {
      const prompts = await generateAIPrompts(chapters, projectMeta, characters, aiProvider);
      setAiPrompts(prompts);
      
      // Cache the results
      saveAIPromptsCache(prompts, hashStory(chapters));
      
      showToast(`✨ Generated ${prompts.length} AI prompts!`);
    } catch (error) {
      console.error("[AI Prompts] Error:", error);
      setAiError("Failed to generate AI prompts. Please check your API key and try again.");
      showToast("Failed to generate prompts");
    } finally {
      setAiLoading(false);
    }
  };

  // Actions
  const pinPrompt = (text) => setPinned((p) => (p.includes(text) ? p : [...p, text]));
  const unpinPrompt = (text) => setPinned((p) => p.filter((t) => t !== text));
  const updatePromptStatus = (id, status) => setPromptStatuses((prev) => ({ ...prev, [id]: status }));

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  const usePrompt = (text) => {
    setCurrentPrompt(text);
    setScratchpadContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n\n" : "";
      return `${prev}${prefix}✨ Prompt: ${text}\n\n`;
    });
    setScratchpadOpen(true);
    showToast("Prompt added to scratchpad");
  };

  const savePromptWork = () => {
    if (!currentPrompt || !scratchpadContent) return;
    const promptWork = {
      id: Date.now(),
      prompt: currentPrompt,
      content: scratchpadContent,
      timestamp: new Date().toISOString(),
      chapterId: selectedChapter?.id,
    };
    setSavedPrompts((prev) => [promptWork, ...prev]);
    showToast("Work saved!");
  };

  const sendToChapter = (position = "top") => {
    if (!targetChapterId || !scratchpadContent.trim()) {
      showToast("Please select a chapter and add some content");
      return;
    }

    const targetChapter = chapters.find((c) => String(c.id) === String(targetChapterId));
    if (!targetChapter) {
      showToast("Chapter not found");
      return;
    }

    const timestamp = new Date().toLocaleString();
    const block = `<div class="storylab-insertion" style="background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #f59e0b;">
<div style="font-size: 11px; color: #92400e; margin-bottom: 8px; font-weight: 600;">📝 WRITING PROMPT WORK — ${timestamp}</div>
<div style="font-style: italic; color: #78350f; margin-bottom: 12px; font-size: 13px;">"${currentPrompt || "Session Work"}"</div>
<div style="color: #1f2937; white-space: pre-wrap;">${scratchpadContent.replace(/\n/g, "<br>")}</div>
</div>`;

    updateChapterInStorage(targetChapterId, (ch) => {
      const existing = ch.content || ch.text || ch.textHTML || "";
      
      if (position === "top") {
        return {
          ...ch,
          content: block + "\n\n" + existing,
          text: block + "\n\n" + existing,
          textHTML: block + "\n\n" + existing,
        };
      } else {
        const sep = existing && !existing.endsWith("\n") ? "\n\n" : "";
        return {
          ...ch,
          content: existing + sep + block,
          text: existing + sep + block,
          textHTML: existing + sep + block,
        };
      }
    });

    showToast(`✅ Sent to "${targetChapter.title}" (${position})`);
  };

  const clearScratchpad = () => {
    setScratchpadContent("");
    setCurrentPrompt("");
  };

  const loadSavedPrompt = (item) => {
    setCurrentPrompt(item.prompt);
    setScratchpadContent(item.content);
    setScratchpadOpen(true);
    setSavedPromptsMenuOpen(false);
    showToast("Loaded saved work");
  };

  // Generate + filter prompts
  const localPrompts = useMemo(
    () => generateLocalPrompts(chapters, characters, selectedChapter),
    [chapters, characters, selectedChapter]
  );

  const allPrompts = useMemo(() => {
    return [...localPrompts, ...aiPrompts];
  }, [localPrompts, aiPrompts]);

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter((prompt) => {
      // Source filter
      if (promptSource === "local" && prompt.source === "ai") return false;
      if (promptSource === "ai" && prompt.source !== "ai") return false;

      // Category filter
      if (activeCategory !== "all" && prompt.category !== activeCategory) return false;
      
      // Difficulty filter
      if (difficultyFilter !== "all") {
        const d = parseInt(difficultyFilter, 10);
        if (prompt.difficulty !== d) return false;
      }
      
      // Contextual filter
      if (!showContextual && prompt.contextual && prompt.source !== "ai") return false;
      
      // Skip filter
      if (promptStatuses[prompt.id] === "skip") return false;
      
      return true;
    });
  }, [allPrompts, activeCategory, difficultyFilter, showContextual, promptStatuses, promptSource]);

  // Stats
  const stats = useMemo(() => {
    const total = allPrompts.length;
    const tried = Object.values(promptStatuses).filter((s) => s === "tried").length;
    const helpful = Object.values(promptStatuses).filter((s) => s === "helpful").length;
    const skipped = Object.values(promptStatuses).filter((s) => s === "skip").length;
    const aiCount = aiPrompts.length;
    return { total, tried, helpful, skipped, aiCount };
  }, [allPrompts, promptStatuses, aiPrompts]);

  // Session pack helpers
  const shufflePack = (count = 12) => {
    const pool = [...filteredPrompts];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const chosen = pool.slice(0, count).map((p) => p.text);
    setPinned(chosen);
    showToast(`Session Pack: ${chosen.length} prompts`);
  };

  const sendPackToScratchpad = () => {
    if (!pinned.length) return;
    const lines = pinned.map((t, i) => `(${i + 1}) ${t}`).join("\n\n");
    setCurrentPrompt("Session Pack");
    setScratchpadContent((prev) => {
      const prefix = prev && !prev.endsWith("\n") ? "\n\n" : "";
      return `${prev}${prefix}📋 Session Pack\n\n${lines}\n\n`;
    });
    setScratchpadOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/30 text-slate-800">
      {/* Header */}
      <BackToLanding
        title="Story Prompts"
        rightSlot={
          <button
            onClick={() => setSavedPromptsMenuOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white border border-slate-200 hover:bg-slate-50 shadow-sm"
            title="Open Saved Work"
          >
            <FileText size={16} />
            Saved Work
          </button>
        }
      />

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 top-24 z-50 px-4 py-2 text-sm rounded-lg bg-emerald-600 text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Story Info Banner + AI Generate Button */}
      {chapters.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="text-sm text-slate-500">Working on</div>
                <div className="text-lg font-semibold text-slate-800">
                  {projectMeta.title || "Your Story"}
                </div>
                <div className="text-sm text-slate-500">
                  {chapters.length} chapter{chapters.length !== 1 ? "s" : ""} • {characters.length} character{characters.length !== 1 ? "s" : ""} 
                  {characterSource === "tagged" && <span className="text-emerald-600 ml-1">(from @char: tags)</span>}
                  {characterSource === "guessed" && <span className="text-amber-600 ml-1">(detected)</span>}
                </div>
              </div>
              
              {/* AI Generate Section */}
              <div className="flex items-center gap-3">
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white"
                >
                  <option value="anthropic">Claude</option>
                  <option value="openai">GPT-4</option>
                </select>
                
                <button
                  onClick={handleGenerateAIPrompts}
                  disabled={aiLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-md"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzing Story...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate AI Prompts
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {aiError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {aiError}
              </div>
            )}
            
            {stats.aiCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md font-medium">
                  ✨ {stats.aiCount} AI prompts generated
                </span>
                <button
                  onClick={handleGenerateAIPrompts}
                  disabled={aiLoading}
                  className="text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Regenerate
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Story Warning */}
      {chapters.length === 0 && (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 text-center">
            <Lightbulb size={48} className="mx-auto mb-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-800 mb-2">No Story Found</h2>
            <p className="text-amber-700 mb-4">
              Start writing in the Compose section first, then come back here for personalized prompts.
            </p>
            <button
              onClick={() => window.location.href = "/compose"}
              className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
            >
              Go to Compose →
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT SIDEBAR */}
        <aside className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Chapter picker */}
          {chapters.length > 1 && (
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Working with chapter:
              </label>
              <select
                value={selectedChapter?.id ?? ""}
                onChange={(e) => {
                  const ch = chapters.find((c) => String(c.id) === e.target.value);
                  setSelectedChapter(ch || null);
                  if (ch) setTargetChapterId(ch.id);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {chapters.map((ch, idx) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.title || `Chapter ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Session Pack */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Session Pack</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => shufflePack(12)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600"
                  title="Shuffle 12"
                >
                  <Shuffle size={12} /> Shuffle
                </button>
                <button
                  onClick={sendPackToScratchpad}
                  disabled={!pinned.length}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs bg-amber-50 text-amber-700 border border-amber-200 disabled:opacity-50"
                  title="Send to Scratchpad"
                >
                  <Send size={12} /> Use
                </button>
              </div>
            </div>
            {pinned.length === 0 ? (
              <div className="text-sm text-slate-500">Pin prompts to build your session pack.</div>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-auto">
                {pinned.map((t, i) => (
                  <li key={i} className="text-sm flex items-start gap-2 text-slate-600">
                    <span className="text-slate-400 font-mono text-xs">{i + 1}.</span>
                    <span className="flex-1 line-clamp-2">{t}</span>
                    <button
                      onClick={() => unpinPrompt(t)}
                      className="text-slate-400 hover:text-red-500 flex-shrink-0"
                      title="Remove"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: stats.tried, label: "Tried", color: "text-emerald-600" },
              { value: stats.helpful, label: "Helpful", color: "text-amber-600" },
              { value: pinned.length, label: "In Pack", color: "text-blue-600" },
              { value: stats.aiCount, label: "AI", color: "text-orange-600" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-3 rounded-lg bg-white border border-slate-200">
                <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-[10px] text-slate-500 uppercase">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm sticky top-20">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Filters</span>
            </div>

            {/* Source filter */}
            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Source</label>
              <div className="flex gap-1">
                {[
                  { value: "all", label: "All" },
                  { value: "local", label: "Quick" },
                  { value: "ai", label: "AI ✨" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPromptSource(opt.value)}
                    className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${
                      promptSource === opt.value
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  activeCategory === "all" 
                    ? "bg-slate-800 text-white border-slate-800" 
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                }`}
              >
                All
              </button>
              {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => {
                const Icon = category.icon;
                const active = activeCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      active 
                        ? "bg-slate-800 text-white border-slate-800" 
                        : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                    title={category.label}
                  >
                    {Icon ? <Icon size={12} className="inline mr-1" /> : null}
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 mb-1">Difficulty</label>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg text-xs bg-slate-50 border border-slate-200 text-slate-700"
              >
                <option value="all">All Levels</option>
                <option value="1">Easy (●○○○)</option>
                <option value="2">Medium (●●○○)</option>
                <option value="3">Hard (●●●○)</option>
                <option value="4">Expert (●●●●)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showContextual}
                onChange={(e) => setShowContextual(e.target.checked)}
                className="accent-amber-500 w-4 h-4"
              />
              Show story-specific prompts
            </label>
          </div>
        </aside>

        {/* MAIN: PROMPTS GRID */}
        <main className="lg:col-span-8 xl:col-span-9">
          {/* Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Interactive Story Prompts</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {promptSource === "ai" 
                    ? "AI-generated prompts based on your story's characters, plot, and themes."
                    : promptSource === "local"
                    ? "Quick template-based prompts to spark your creativity."
                    : "Smart prompts that adapt to your chapters, characters, and story structure."
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-amber-600">{filteredPrompts.length}</div>
                <div className="text-xs text-slate-500">available prompts</div>
              </div>
            </div>
          </div>

          {/* Pinned row */}
          {pinned.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-amber-800">📌 Session Pack ({pinned.length})</div>
                <div className="flex gap-2">
                  <button
                    onClick={sendPackToScratchpad}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-amber-500 text-white hover:bg-amber-600"
                  >
                    <Send size={12} />
                    Use Pack
                  </button>
                  <button
                    onClick={() => setPinned([])}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs bg-white border border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {pinned.map((t, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-md bg-white border border-amber-200 text-amber-800"
                    title={t}
                  >
                    {i + 1}. {t.length > 50 ? `${t.slice(0, 50)}…` : t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Loading State */}
          {aiLoading && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-8 border border-amber-200 mb-6 text-center">
              <Loader2 size={40} className="mx-auto mb-4 text-amber-500 animate-spin" />
              <div className="text-lg font-semibold text-amber-800 mb-2">Analyzing Your Story...</div>
              <div className="text-sm text-amber-600">
                The AI is reading your chapters to generate personalized writing prompts.
              </div>
            </div>
          )}

          {/* Prompts grid */}
          {filteredPrompts.length === 0 && !aiLoading ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <Lightbulb size={48} className="mx-auto mb-4 text-slate-300" />
              <div className="text-lg font-semibold mb-2 text-slate-700">
                {promptSource === "ai" && stats.aiCount === 0 
                  ? "No AI prompts yet" 
                  : "No prompts match your filters"
                }
              </div>
              <div className="text-slate-500 mb-4">
                {promptSource === "ai" && stats.aiCount === 0 
                  ? "Click 'Generate AI Prompts' to have the AI analyze your story."
                  : "Adjust filters or add more chapters for personalized prompts."
                }
              </div>
              {promptSource === "ai" && stats.aiCount === 0 && (
                <button
                  onClick={handleGenerateAIPrompts}
                  disabled={aiLoading}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium"
                >
                  Generate AI Prompts
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onPin={pinPrompt}
                  onUnpin={unpinPrompt}
                  onUse={usePrompt}
                  onMarkTried={updatePromptStatus}
                  isPinned={pinned.includes(prompt.text)}
                  status={promptStatuses[prompt.id]}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Scratchpad Modal */}
      <Scratchpad
        isOpen={scratchpadOpen}
        onClose={() => setScratchpadOpen(false)}
        content={scratchpadContent}
        onChange={setScratchpadContent}
        onSave={savePromptWork}
        onSendToChapter={sendToChapter}
        onClear={clearScratchpad}
        chapters={chapters}
        selectedChapterId={targetChapterId}
        onChapterSelect={setTargetChapterId}
      />

      {/* Saved Prompts Modal */}
      <SavedPromptsMenu
        savedPrompts={savedPrompts}
        isOpen={savedPromptsMenuOpen}
        onClose={() => setSavedPromptsMenuOpen(false)}
        onLoadPrompt={loadSavedPrompt}
      />

      {/* Mobile FAB */}
      <BackToLandingFab />
    </div>
  );
}
