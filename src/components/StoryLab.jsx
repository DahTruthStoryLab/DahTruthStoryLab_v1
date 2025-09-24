import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, Target, Zap, ArrowLeft, BookOpen, Users, Quote, Pin,
  Sparkles, Calendar, Clock, ChevronRight, X, Plus, Shuffle,
  PenTool, Layers, Edit3, Trash2, Save, Globe, Shield, Heart,
  Star, CheckCircle, AlertCircle, FileText, BarChart, MessageSquare,
  Feather, User, MapPin, Copy, Eye, Check, Filter, RotateCcw, Timer,
  Lightbulb, Flame, TrendingUp
} from 'lucide-react';

/* -----------------------------
   Storage helpers
--------------------------------*/
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

/* -----------------------------
   Enhanced NLP helpers
--------------------------------*/
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
   TOP BANNER
========================================================= */
const TopBanner = () => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="font-extrabold tracking-wide">Story Lab</div>

          <div className="text-center">
            <div className="text-sm opacity-90">Creative Workshop</div>
            <div className="text-lg font-semibold">DahTruth Platform</div>
          </div>

          <button className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium border border-white/20">
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   ENHANCED PROMPT CATEGORIES & GENERATION
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

  // Sprint prompts
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
   INTERACTIVE PROMPT CARD
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
   ENHANCED STORY PROMPTS WORKSHOP
========================================================= */
const StoryPromptsWorkshop = ({ 
  chapters, 
  characters, 
  selectedChapter,
  pinned,
  onPin,
  onUnpin,
  onUse,
  promptStatuses,
  onUpdatePromptStatus 
}) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showContextual, setShowContextual] = useState(true);

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
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-cyan-300 mb-2">Story Prompts Workshop</h3>
          <p className="text-cyan-200/80 text-sm">
            Personalized writing prompts based on your story content and structure
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

        <div className="flex gap-2">
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
        </div>

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
              onPin={onPin}
              onUnpin={onUnpin}
              onUse={onUse}
              onMarkTried={onUpdatePromptStatus}
              isPinned={pinned.includes(prompt.text)}
              status={promptStatuses[prompt.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* =========================================================
   OTHER WORKSHOP COMPONENTS
========================================================= */
const ClotheslineWorkshop = ({ characters }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      <h3 className="text-xl font-semibold text-cyan-300 mb-4">Clothes Pin Workshop</h3>
      <p className="text-cyan-200/80 mb-4">Pin quick synopses for each character.</p>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(characters?.length ? characters : ['Protagonist', 'Antagonist']).map((name, idx) => (
          <div key={idx} className="min-w-[220px] bg-slate-900/40 border border-cyan-500/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-cyan-300" />
              <div className="font-semibold text-white">{name}</div>
            </div>
            <p className="text-sm text-cyan-100/80">
              {name} plays a key role in the story. Summarize traits, goals, and obstacles here.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HopesFearsLegacyWorkshop = ({ chapters, characters }) => {
  const text = useMemo(() => chapters.map(c => c.text).join('\n\n'), [chapters]);

  const insights = useMemo(() => {
    const result = {};
    (characters || []).forEach(ch => {
      result[ch] = {
        Hopes: extractKeywordSentences(text, 'hope').slice(0, 3),
        Fears: extractKeywordSentences(text, 'fear').slice(0, 3),
        Legacy: extractKeywordSentences(text, 'legacy').slice(0, 3),
      };
    });
    return result;
  }, [text, characters]);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      <h3 className="text-xl font-semibold text-cyan-300 mb-4">Hopes, Fears & Legacy Workshop</h3>
      {(!characters || characters.length === 0) && (
        <div className="text-cyan-200/70 mb-3">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-cyan-500/10 bg-slate-900/40 p-4">
            <div className="font-semibold text-white mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {['Hopes','Fears','Legacy'].map(key => (
                <div key={key} className="rounded-lg bg-slate-900/60 p-3 border border-cyan-500/10">
                  <div className="text-cyan-300 text-sm font-medium mb-2">{key}</div>
                  {(data[key] && data[key].length) ? (
                    <ul className="space-y-2 text-cyan-100/85 text-sm">
                      {data[key].map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  ) : (
                    <div className="text-cyan-200/60 text-sm">No {key.toLowerCase()} found yet.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   SHARED UI COMPONENTS
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusColors = {
    'Ready': 'bg-green-500/20 text-green-300 border-green-400/30',
    'Beta': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
    'Coming Soon': 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  };

  return (
    <div 
      onClick={onClick}
      className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20 hover:border-cyan-400/40 transition-all cursor-pointer group hover:shadow-lg hover:shadow-cyan-500/10"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl group-hover:bg-cyan-500/20 transition-all backdrop-blur-sm border border-cyan-400/20">
            <Icon className="w-6 h-6 text-cyan-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            {status && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-300 transition-colors mt-1" />
      </div>
      <p className="text-cyan-100/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => {
  return (
    <div className="flex items-start gap-3 mb-8">
      <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-400/20">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-2">
          {title}
        </h2>
        {subtitle && <p className="text-cyan-200/70">{subtitle}</p>}
      </div>
    </div>
  );
};

/* =========================================================
   CHARACTER MANAGER
========================================================= */
const CharacterManager = ({ seedText = '', onChange }) => {
  const [characters, setCharacters] = useState(() => {
    const fromText = guessCharacters(seedText);
    return fromText.length ? fromText.map((n, i) => ({ id: i + 1, name: n })) : [];
  });
  const [newCharacter, setNewCharacter] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    onChange?.(characters.map(c => c.name));
  }, [characters, onChange]);

  const addCharacter = () => {
    const val = newCharacter.trim();
    if (!val) return;
    setCharacters(prev => [...prev, { id: Date.now(), name: val }]);
    setNewCharacter('');
  };

  const deleteCharacter = (id) => {
    setCharacters(prev => prev.filter(c => c.id !== id));
  };

  const updateCharacter = (id, name) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, name: name.trim() } : c));
    setEditingId(null);
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      <h3 className="text-lg font-semibold text-cyan-300 mb-4">Character Manager</h3>
      
      <div className="space-y-3 mb-4">
        {characters.length === 0 && (
          <div className="text-cyan-200/60 text-sm">No characters found yet. Add them below.</div>
        )}
        {characters.map(character => (
          <div key={character.id} className="flex items-center gap-3 bg-slate-900/40 rounded-lg p-3 border border-cyan-500/10">
            {editingId === character.id ? (
              <input
                type="text"
                defaultValue={character.name}
                onBlur={(e) => updateCharacter(character.id, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && updateCharacter(character.id, e.currentTarget.value)}
                className="flex-1 bg-transparent border-b border-cyan-400/50 text-white outline-none"
                autoFocus
              />
            ) : (
              <span 
                onClick={() => setEditingId(character.id)}
                className="flex-1 text-white cursor-pointer hover:text-cyan-300"
                title="Click to edit"
              >
                {character.name}
              </span>
            )}
            <button
              onClick={() => deleteCharacter(character.id)}
              className="text-red-400/60 hover:text-red-400 transition-colors"
              title="Delete character"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new character..."
          value={newCharacter}
          onChange={(e) => setNewCharacter(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addCharacter()}
          className="flex-1 px-4 py-2 bg-slate-900/40 border border-cyan-500/20 rounded-lg text-white placeholder-cyan-300/40 focus:border-cyan-400/40 focus:outline-none backdrop-blur-sm"
        />
        <button
          onClick={addCharacter}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-400/30 transition-all backdrop-blur-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   SCRATCHPAD WITH PINNED PROMPTS
========================================================= */
const Scratchpad = ({ scratch, setScratch, pinned, onUnpin, onUse }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      <h3 className="text-lg font-semibold text-cyan-300 mb-4">Writing Scratchpad</h3>
      
      {/* Pinned prompts */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <div className="text-sm text-cyan-300 mb-3 flex items-center gap-2">
            <Pin size={16} />
            Pinned Prompts ({pinned.length})
          </div>
          <div className="space-y-3 max-h-48 overflow-auto">
            {pinned.map((prompt, i) => (
              <div key={i} className="rounded-lg bg-slate-900/40 border border-cyan-500/10 p-3">
                <div className="text-sm text-cyan-100/90 leading-relaxed mb-2">{prompt}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUse(prompt)}
                    className="px-3 py-1 rounded-md bg-indigo-600/30 border border-indigo-400/30 hover:bg-indigo-600/40 text-indigo-100 text-xs transition-all"
                  >
                    Use This
                  </button>
                  <button
                    onClick={() => onUnpin(prompt)}
                    className="px-3 py-1 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 text-red-100 text-xs transition-all"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scratchpad */}
      <div className="mb-4">
        <div className="text-sm text-cyan-300 mb-2">Quick Notes & Ideas</div>
        <textarea
          value={scratch}
          onChange={(e) => setScratch(e.target.value)}
          placeholder="Jot down quick ideas, notes, or work on prompts here..."
          className="w-full h-48 px-4 py-3 bg-slate-900/40 border border-cyan-500/20 rounded-lg text-white placeholder-cyan-300/40 focus:border-cyan-400/40 focus:outline-none backdrop-blur-sm resize-none"
        />
      </div>
      
      <div className="flex items-center justify-between text-xs text-cyan-300/70">
        <span>{scratch.split(/\s+/).filter(Boolean).length} words</span>
        <span>Auto-saves as you type</span>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function StoryLab() {
  const [activeSection, setActiveSection] = useState('prompts');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [workshopCharacters, setWorkshopCharacters] = useState([]);
  
  // Enhanced state
  const [scratch, setScratch] = useState('');
  const [pinned, setPinned] = useState([]);
  const [promptStatuses, setPromptStatuses] = useState({});

  useEffect(() => {
    const loadedChapters = loadChaptersFromLocalStorage();
    setChapters(loadedChapters);
    if (loadedChapters.length > 0) {
      setSelectedChapter(loadedChapters[0]);
    }
  }, []);

  // Load chapter's lab data when selection changes
  useEffect(() => {
    if (!selectedChapter) return;
    const proj = getProject();
    const ch = proj?.chapters?.find(c => c.id === selectedChapter.id);
    const lab = ch?.storyLab || {};
    setScratch(lab.scratch || '');
    setPinned(Array.isArray(lab.pinned) ? lab.pinned : []);
    setPromptStatuses(lab.promptStatuses || {});
  }, [selectedChapter]);

  // Auto-save scratchpad
  useEffect(() => {
    if (!selectedChapter) return;
    const handle = setTimeout(() => {
      updateChapterById(selectedChapter.id, (c) => ({
        ...c,
        storyLab: { ...(c.storyLab || {}), scratch }
      }));
    }, 300);
    return () => clearTimeout(handle);
  }, [scratch, selectedChapter]);

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

  const addToScratch = (text) => {
    setScratch(prev => prev + (prev ? '\n\n' : '') + `📝 ${text}\n\n`);
  };

  const updatePromptStatus = (promptId, status) => {
    setPromptStatuses(prev => ({ ...prev, [promptId]: status }));
  };

  const aiFeatures = [
    { icon: Sparkles, title: 'Story Prompts', status: 'Ready', description: "Get creative AI-generated prompts when you're stuck, tailored to your story's theme and current chapter." },
    { icon: CheckCircle, title: 'Character Consistency', status: 'Coming Soon', description: 'AI checks your manuscript for character inconsistencies like changing eye color or contradictory personality traits.' },
    { icon: Edit3, title: 'Grammar Polish', status: 'Coming Soon', description: 'Smart grammar and clarity suggestions that preserve your unique voice while improving readability.' },
    { icon: FileText, title: 'Scene Summaries', status: 'Ready', description: 'Auto-generate chapter summaries and track plot threads throughout your novel.' }
  ];

  const storyFeatures = [
    { icon: User, title: 'Character Profiles', status: 'Beta', description: 'Create detailed character sheets that auto-link into your manuscript with relationship tracking.' },
    { icon: Pin, title: 'Character Clothesline', status: 'Ready', description: 'Pin and track character development with traits, obstacles, and changes.' },
    { icon: Globe, title: 'World Bible', status: 'Beta', description: 'Build your story world with locations, cultures, magic systems, and timelines that grow as you write.' },
    { icon: Shield, title: 'Continuity Alerts', status: 'Coming Soon', description: 'Get notified when you break continuity rules like changing character details mid-story.' }
  ];

  const workshopFeatures = [
    { icon: Calendar, title: 'Session Schedule', status: 'Ready', description: 'Six-session collaborative writing structure with book study and writing goals.' },
    { icon: Users, title: 'Breakout Pairings', status: 'Ready', description: 'Randomly pair writers for collaborative exercises and peer review sessions.' },
    { icon: Quote, title: 'Quote Flash Writing', status: 'Ready', description: 'Inspirational quotes for 5-minute timed writing exercises and warmups.' }
  ];

  const faithFeatures = [
    { icon: Heart, title: 'Reflection Prompts', status: 'Beta', description: 'Daily spiritual reflection questions to ground your writing in purpose and meaning.' },
    { icon: Star, title: 'Legacy Writing', status: 'Coming Soon', description: 'Write with future generations in mind - tools for creating meaningful, lasting stories.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <TopBanner />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent mb-4">
            The All-in-One Writing Platform
          </h1>
          <p className="text-xl text-cyan-200/80 mb-8">
            Where creativity meets discipline. Blend AI assistance, community support,<br />
            character tracking and faith-based reflection in one seamless writing experience.
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Assistance</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-400/50 text-blue-300 backdrop-blur-sm">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Writing Community</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 backdrop-blur-sm">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Organization Tools</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 backdrop-blur-sm">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Faith Integration</span>
            </div>
          </div>
        </div>

        {/* Chapter Info + Selection */}
        {chapters.length > 0 && (
          <div className="mb-12 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-cyan-300">
                <BookOpen className="w-5 h-5" />
                <span>{chapters.length} chapter{chapters.length > 1 ? 's' : ''} loaded from your story</span>
              </div>
              {chapters.length > 1 && (
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
              )}
            </div>
          </div>
        )}

        {/* Enhanced Lab Sessions */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Left: Workshop Selection & Content */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <SectionHeader 
                icon="🧪"
                title="Lab Sessions"
                subtitle="Interactive workshops that analyze your story to generate personalized insights."
              />
              
              <div className="grid gap-4 md:grid-cols-3 mb-8">
                <button
                  onClick={() => setActiveSection('prompts')}
                  className={`rounded-2xl p-5 border transition-all text-left ${
                    activeSection === 'prompts'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
                  <div className="text-sm text-cyan-200/80">Smart prompts based on your story structure and content.</div>
                </button>

                <button
                  onClick={() => setActiveSection('clothesline')}
                  className={`rounded-2xl p-5 border transition-all text-left ${
                    activeSection === 'clothesline'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">Clothes Pin Workshop</div>
                  <div className="text-sm text-cyan-200/80">Visual cards to summarize characters and roles.</div>
                </button>

                <button
                  onClick={() => setActiveSection('hfl')}
                  className={`rounded-2xl p-5 border transition-all text-left ${
                    activeSection === 'hfl'
                      ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">Hopes, Fears & Legacy</div>
                  <div className="text-sm text-cyan-200/80">Analyze character motivations and themes.</div>
                </button>
              </div>

              {/* Active workshop panel */}
              {activeSection === 'prompts' && (
                <StoryPromptsWorkshop
                  chapters={chapters}
                  characters={workshopCharacters}
                  selectedChapter={selectedChapter}
                  pinned={pinned}
                  onPin={pinPrompt}
                  onUnpin={unpinPrompt}
                  onUse={addToScratch}
                  promptStatuses={promptStatuses}
                  onUpdatePromptStatus={updatePromptStatus}
                />
              )}
              {activeSection === 'clothesline' && (
                <ClotheslineWorkshop characters={workshopCharacters} />
              )}
              {activeSection === 'hfl' && (
                <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
              )}
            </section>
          </div>

          {/* Right: Scratchpad */}
          <div className="space-y-6">
            <Scratchpad
              scratch={scratch}
              setScratch={setScratch}
              pinned={pinned}
              onUnpin={unpinPrompt}
              onUse={addToScratch}
            />
          </div>
        </div>

        {/* AI + Human Balance */}
        <section className="mb-12">
          <SectionHeader 
            icon="✨"
            title="AI + Human Balance"
            subtitle="AI that assists without overtaking your unique voice"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {aiFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </section>

        {/* Story & Character Development */}
        <section className="mb-12">
          <SectionHeader 
            icon="📖"
            title="Story & Character Development"
            subtitle="Character development, world building, and story organization tools"
          />
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {storyFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
          
          {/* Character Manager */}
          <CharacterManager
            seedText={chapters.map(c => c.text).join('\n\n')}
            onChange={setWorkshopCharacters}
          />
        </section>

        {/* Workshop Community */}
        <section className="mb-12">
          <SectionHeader 
            icon="👥"
            title="Workshop Community"
            subtitle="Collaborative writing sessions and community accountability"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {workshopFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </section>

        {/* Faith + Legacy */}
        <section className="mb-24">
          <SectionHeader 
            icon="💝"
            title="Faith + Legacy"
            subtitle="Spiritual grounding and legacy-focused writing"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {faithFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </section>

        {/* Quick Actions Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-slate-900/90 backdrop-blur-xl border-t border-cyan-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg">
                Start Writing Session
              </button>
              <button className="px-4 py-2 bg-white/10 hover:bg-white/20 text-cyan-300 rounded-lg font-medium transition-all backdrop-blur-sm border border-cyan-500/20">
                View Schedule
              </button>
            </div>
            <div className="flex items-center gap-2 text-cyan-300/70">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Next session in 2 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
