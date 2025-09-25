import React, { useState, useEffect, useMemo } from 'react';
import { 
  Copy, Eye, Check, Filter, Timer, User, TrendingUp, 
  Feather, Globe, Star, X, Pin, Edit3, Lightbulb, ArrowLeft
} from 'lucide-react';

/* =========================================================
   STORAGE HELPERS
========================================================= */
const STORAGE_KEY = 'dahtruth-story-lab-toc-v3';

const getProject = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { 
    return null; 
  }
};

const setProject = (project) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

const updateChapterById = (id, updater) => {
  const proj = getProject();
  if (!proj || !Array.isArray(proj.chapters)) return;
  const i = proj.chapters.findIndex(c => c.id === id);
  if (i === -1) return;
  const current = proj.chapters[i] || {};
  const next = updater(current) || current;
  proj.chapters[i] = next;
  setProject(proj);
};

function loadChaptersFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = parsed?.chapters ?? [];
    return list.map((c, idx) => ({
      id: c.id ?? idx,
      title: c.title ?? `Chapter ${idx + 1}`,
      text: c.text ?? c.content ?? c.body ?? '',
      storyLab: c.storyLab || {},
    }));
  } catch {
    return [];
  }
}

/* =========================================================
   NLP HELPERS
========================================================= */
const splitSentences = (txt) =>
  (txt || '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens = (text || '').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach(t => {
    if (!['I', 'The', 'A', 'And', 'But', 'Then', 'Now', 'When', 'Where'].includes(t)) {
      names.add(t.trim());
    }
  });
  return Array.from(names).slice(0, 50);
}

function extractConflicts(text) {
  const hits = [];
  const needles = ['conflict', 'tension', 'argument', 'fight', 'feud', 'rivalry', 'obstacle', 'problem', 'challenge', 'struggle', 'battle'];
  const sentences = splitSentences(text);
  sentences.forEach(s => {
    if (needles.some(n => s.toLowerCase().includes(n))) {
      hits.push(s.trim());
    }
  });
  return hits;
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter(s => s.toLowerCase().includes(k));
}

function extractEmotions(text) {
  const emotions = ['fear', 'hope', 'love', 'anger', 'joy', 'sadness', 'worry', 'excitement', 'disappointment', 'relief'];
  const found = [];
  emotions.forEach(emotion => {
    const sentences = extractKeywordSentences(text, emotion);
    if (sentences.length > 0) {
      found.push({ emotion, sentences: sentences.slice(0, 2) });
    }
  });
  return found;
}

function analyzeStoryStructure(chapters) {
  const total = chapters.length;
  if (total === 0) return { act: 'setup', phase: 'beginning' };
  
  const currentIndex = 0;
  const progress = currentIndex / total;
  
  if (progress < 0.25) return { act: 'setup', phase: 'beginning' };
  if (progress < 0.75) return { act: 'confrontation', phase: 'middle' };
  return { act: 'resolution', phase: 'ending' };
}

/* =========================================================
   PROMPT CATEGORIES & GENERATION
========================================================= */
const PROMPT_CATEGORIES = {
  'sprint': { 
    label: 'Quick Sprints', 
    icon: Timer, 
    color: 'emerald',
    time: '5-15 min',
    description: 'Fast writing exercises to get unstuck'
  },
  'character': { 
    label: 'Character Deep Dive', 
    icon: User, 
    color: 'blue',
    time: '20-30 min',
    description: 'Explore your characters more deeply'
  },
  'plot': { 
    label: 'Plot Development', 
    icon: TrendingUp, 
    color: 'purple',
    time: '15-45 min',
    description: 'Advance your story and raise stakes'
  },
  'craft': { 
    label: 'Writing Craft', 
    icon: Feather, 
    color: 'orange',
    time: '10-20 min',
    description: 'Improve dialogue, description, pacing'
  },
  'worldbuilding': { 
    label: 'World Building', 
    icon: Globe, 
    color: 'teal',
    time: '20-40 min',
    description: 'Develop setting and atmosphere'
  }
};

function generateEnhancedPrompts(chapters, characters, selectedChapter) {
  const fullText = chapters.map(c => c.text).join('\n\n');
  const structure = analyzeStoryStructure(chapters);
  const emotions = extractEmotions(fullText);
  const conflicts = extractConflicts(fullText);
  
  const prompts = [];

  // Sprint prompts (5-15 min)
  prompts.push(
    { category: 'sprint', text: 'Write a 100-word scene showing (don\'t tell) your protagonist\'s biggest fear.', difficulty: 1 },
    { category: 'sprint', text: 'Describe your setting through the five senses in exactly 50 words.', difficulty: 1 },
    { category: 'sprint', text: 'Write a piece of dialogue that reveals a secret without stating it directly.', difficulty: 2 }
  );

  // Character prompts
  characters.forEach(char => {
    prompts.push(
      { category: 'character', text: `Write ${char}'s origin story in 200 words. What shaped them?`, difficulty: 2 },
      { category: 'character', text: `What does ${char} want most? Write a scene where they almost get it.`, difficulty: 3 },
      { category: 'character', text: `Give ${char} a quirky habit that reveals their personality.`, difficulty: 1 }
    );
  });

  // Plot development based on story structure
  if (structure.phase === 'beginning') {
    prompts.push(
      { category: 'plot', text: 'Introduce a problem that will drive your entire story in the next scene.', difficulty: 3 },
      { category: 'plot', text: 'Write the moment when ordinary life ends and the adventure begins.', difficulty: 3 }
    );
  } else if (structure.phase === 'middle') {
    prompts.push(
      { category: 'plot', text: 'Write a scene where everything goes wrong at the worst possible moment.', difficulty: 3 },
      { category: 'plot', text: 'Introduce a complication that makes your protagonist\'s goal seem impossible.', difficulty: 3 }
    );
  } else {
    prompts.push(
      { category: 'plot', text: 'Write the confrontation scene where your protagonist faces their greatest fear.', difficulty: 4 },
      { category: 'plot', text: 'Show how your protagonist has changed since the beginning.', difficulty: 3 }
    );
  }

  // Craft prompts
  prompts.push(
    { category: 'craft', text: 'Rewrite your last dialogue scene using only subtext - characters say everything except what they mean.', difficulty: 3 },
    { category: 'craft', text: 'Write a paragraph of pure action with no adjectives or adverbs.', difficulty: 2 },
    { category: 'craft', text: 'Describe an emotional moment using only physical sensations and actions.', difficulty: 2 }
  );

  // World building
  prompts.push(
    { category: 'worldbuilding', text: 'Create a location that reflects your protagonist\'s internal state.', difficulty: 2 },
    { category: 'worldbuilding', text: 'Write about a cultural tradition or rule that creates conflict in your story.', difficulty: 3 },
    { category: 'worldbuilding', text: 'Design a place where your characters go to feel safe. What makes it special?', difficulty: 2 }
  );

  // Contextual prompts based on found emotions/conflicts
  emotions.forEach(({ emotion, sentences }) => {
    if (sentences[0]) {
      prompts.push({
        category: 'character',
        text: `Expand on this emotion: "${sentences[0].substring(0, 60)}..." Write what happens next.`,
        difficulty: 2,
        contextual: true
      });
    }
  });

  conflicts.forEach((conflict, i) => {
    if (i < 2) {
      prompts.push({
        category: 'plot',
        text: `Escalate this conflict: "${conflict.substring(0, 60)}..." What's the next step?`,
        difficulty: 3,
        contextual: true
      });
    }
  });

  return prompts.map((p, i) => ({ ...p, id: i }));
}

/* =========================================================
   PROMPT CARD COMPONENT
========================================================= */
const PromptCard = ({ prompt, onPin, onUnpin, onUse, onMarkTried, isPinned, status }) => {
  const category = PROMPT_CATEGORIES[prompt.category];
  const colorClasses = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    blue: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
    purple: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
    orange: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
    teal: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  };

  const statusIcons = {
    'tried': { icon: Check, color: 'text-green-400', label: 'Tried' },
    'helpful': { icon: Star, color: 'text-yellow-400', label: 'Helpful' },
    'skip': { icon: X, color: 'text-gray-400', label: 'Skip' }
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-cyan-500/20 hover:border-cyan-400/40 transition-all group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-md text-xs border backdrop-blur-sm ${colorClasses[category.color]}`}>
            <category.icon size={12} className="inline mr-1" />
            {category.label}
          </div>
          {prompt.difficulty && (
            <div className="flex gap-0.5">
              {Array.from({ length: 4 }, (_, i) => (
                <div 
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i < prompt.difficulty ? 'bg-cyan-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          )}
          <span className="text-xs text-cyan-300/70">{category.time}</span>
        </div>
        {status && statusIcons[status] && (
          <div className={`flex items-center gap-1 text-xs ${statusIcons[status].color}`}>
            <statusIcons[status].icon size={14} />
            {statusIcons[status].label}
          </div>
        )}
      </div>

      {/* Prompt text */}
      <div className="text-cyan-100/90 text-sm leading-relaxed mb-4">
        {prompt.text}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard?.writeText(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 border border-white/20 hover:bg-white/15 text-xs transition-all"
            title="Copy to clipboard"
          >
            <Copy size={12} />
            Copy
          </button>
          
          <button
            onClick={() => onUse(prompt.text)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-xs transition-all"
            title="Add to scratchpad"
          >
            <Edit3 size={12} />
            Use
          </button>

          {isPinned ? (
            <button
              onClick={() => onUnpin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-yellow-600/30 border border-yellow-400/30 hover:bg-yellow-600/40 text-yellow-100 text-xs transition-all"
              title="Unpin prompt"
            >
              <Check size={12} />
              Pinned
            </button>
          ) : (
            <button
              onClick={() => onPin(prompt.text)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 border border-white/20 hover:bg-white/15 text-xs transition-all"
              title="Pin prompt"
            >
              <Pin size={12} />
              Pin
            </button>
          )}
        </div>

        {/* Status buttons */}
        <div className="flex items-center gap-1">
          {!status && (
            <>
              <button
                onClick={() => onMarkTried(prompt.id, 'tried')}
                className="p-1.5 rounded hover:bg-green-500/20 text-green-400 transition-all"
                title="Mark as tried"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, 'helpful')}
                className="p-1.5 rounded hover:bg-yellow-500/20 text-yellow-400 transition-all"
                title="Mark as helpful"
              >
                <Star size={14} />
              </button>
              <button
                onClick={() => onMarkTried(prompt.id, 'skip')}
                className="p-1.5 rounded hover:bg-gray-500/20 text-gray-400 transition-all"
                title="Skip this prompt"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN STORY PROMPTS COMPONENT
========================================================= */
export default function StoryPromptsWorkshop() {
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showContextual, setShowContextual] = useState(true);
  
  // Enhanced state
  const [pinned, setPinned] = useState([]);
  const [promptStatuses, setPromptStatuses] = useState({});

  useEffect(() => {
    const loadedChapters = loadChaptersFromLocalStorage();
    setChapters(loadedChapters);
    if (loadedChapters.length > 0) {
      setSelectedChapter(loadedChapters[0]);
      // Extract characters from all chapters
      const allText = loadedChapters.map(c => c.text).join('\n\n');
      setCharacters(guessCharacters(allText));
    }
  }, []);

  // Load chapter's lab data when selection changes
  useEffect(() => {
    if (!selectedChapter) return;
    const proj = getProject();
    const ch = proj?.chapters?.find(c => c.id === selectedChapter.id);
    const lab = ch?.storyLab || {};
    setPinned(Array.isArray(lab.pinned) ? lab.pinned : []);
    setPromptStatuses(lab.promptStatuses || {});
  }, [selectedChapter]);

  // Save pinned when it changes
  useEffect(() => {
    if (!selectedChapter) return;
    updateChapterById(selectedChapter.id, (c) => ({
      ...c,
      storyLab: { ...(c.storyLab || {}), pinned }
    }));
  }, [pinned, selectedChapter]);

  // Save prompt statuses
  useEffect(() => {
    if (!selectedChapter) return;
    updateChapterById(selectedChapter.id, (c) => ({
      ...c,
      storyLab: { ...(c.storyLab || {}), promptStatuses }
    }));
  }, [promptStatuses, selectedChapter]);

  // Helpers
  const pinPrompt = (text) => {
    setPinned(p => (p.includes(text) ? p : [...p, text]));
  };

  const unpinPrompt = (text) => {
    setPinned(p => p.filter(t => t !== text));
  };

  const updatePromptStatus = (promptId, status) => {
    setPromptStatuses(prev => ({ ...prev, [promptId]: status }));
  };

  const allPrompts = useMemo(() => 
    generateEnhancedPrompts(chapters, characters, selectedChapter), 
    [chapters, characters, selectedChapter]
  );

  const filteredPrompts = useMemo(() => {
    return allPrompts.filter(prompt => {
      if (activeCategory !== 'all' && prompt.category !== activeCategory) return false;
      if (difficultyFilter !== 'all') {
        const difficulty = parseInt(difficultyFilter);
        if (prompt.difficulty !== difficulty) return false;
      }
      if (!showContextual && prompt.contextual) return false;
      if (promptStatuses[prompt.id] === 'skip') return false;
      return true;
    });
  }, [allPrompts, activeCategory, difficultyFilter, showContextual, promptStatuses]);

  const stats = useMemo(() => {
    const total = allPrompts.length;
    const tried = Object.values(promptStatuses).filter(s => s === 'tried').length;
    const helpful = Object.values(promptStatuses).filter(s => s === 'helpful').length;
    const skipped = Object.values(promptStatuses).filter(s => s === 'skip').length;
    return { total, tried, helpful, skipped };
  }, [allPrompts, promptStatuses]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Top Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between">
            <div className="font-extrabold tracking-wide">Story Prompts Workshop</div>
            <div className="text-center">
              <div className="text-sm opacity-90">Enhanced Prompts</div>
              <div className="text-lg font-semibold">DahTruth Story Lab</div>
            </div>
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium border border-white/20"
            >
              <ArrowLeft size={16} />
              Back to Story Lab
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Chapter Selection */}
        {chapters.length > 1 && (
          <div className="mb-8 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300">Working with chapter:</span>
              <select
                value={selectedChapter?.id || ''}
                onChange={(e) => {
                  const ch = chapters.find(c => c.id === parseInt(e.target.value));
                  setSelectedChapter(ch);
                }}
                className="px-3 py-2 bg-slate-900/40 border border-cyan-500/20 rounded-lg text-white text-sm"
              >
                {chapters.map(ch => (
                  <option key={ch.id} value={ch.id}>{ch.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Enhanced Prompts Interface */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-cyan-300 mb-2">Interactive Story Prompts</h1>
              <p className="text-cyan-200/80 text-sm">
                Smart prompts that adapt to your story structure, characters, and writing style
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{filteredPrompts.length}</div>
              <div className="text-xs text-cyan-300">Available prompts</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 rounded-lg bg-slate-900/30 border border-slate-700/40">
              <div className="text-lg font-bold text-white">{stats.tried}</div>
              <div className="text-xs text-green-400">Tried</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/30 border border-slate-700/40">
              <div className="text-lg font-bold text-white">{stats.helpful}</div>
              <div className="text-xs text-yellow-400">Helpful</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/30 border border-slate-700/40">
              <div className="text-lg font-bold text-white">{pinned.length}</div>
              <div className="text-xs text-cyan-400">Pinned</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-900/30 border border-slate-700/40">
              <div className="text-lg font-bold text-white">{stats.total - stats.tried - stats.helpful - stats.skipped}</div>
              <div className="text-xs text-cyan-300">New</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-cyan-400" />
              <span className="text-sm text-cyan-300">Filters:</span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  activeCategory === 'all' 
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' 
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                All Categories
              </button>
              {Object.entries(PROMPT_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    activeCategory === key 
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' 
                      : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <category.icon size={12} className="inline mr-1" />
                  {category.label}
                </button>
              ))}
            </div>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-900/40 border border-slate-600/40 text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="1">Easy (●○○○)</option>
              <option value="2">Medium (●●○○)</option>
              <option value="3">Hard (●●●○)</option>
              <option value="4">Expert (●●●●)</option>
            </select>

            <label className="flex items-center gap-2 text-xs text-cyan-300">
              <input
                type="checkbox"
                checked={showContextual}
                onChange={(e) => setShowContextual(e.target.checked)}
                className="accent-cyan-500"
              />
              Show story-specific prompts
            </label>
          </div>

          {/* Prompts Grid */}
          {filteredPrompts.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb size={48} className="mx-auto mb-4 text-cyan-400/50" />
              <div className="text-lg font-semibold text-white mb-2">No prompts match your filters</div>
              <div className="text-cyan-200/70">Try adjusting your filters or add more chapters to generate personalized prompts</div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onPin={pinPrompt}
                  onUnpin={unpinPrompt}
                  onUse={(text) => alert(`Feature coming soon: Add "${text.substring(0, 30)}..." to scratchpad`)}
                  onMarkTried={updatePromptStatus}
                  isPinned={pinned.includes(prompt.text)}
                  status={promptStatuses[prompt.id]}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
