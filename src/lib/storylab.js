import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, Target, Zap, ArrowLeft, BookOpen, Users, Quote, Pin,
  Sparkles, Calendar, Clock, ChevronRight, X, Plus, Shuffle,
  PenTool, Layers, Edit3, Trash2, Save, Globe, Shield, Heart,
  Star, CheckCircle, AlertCircle, FileText, BarChart, MessageSquare,
  Feather, User, MapPin
} from 'lucide-react';

/* -----------------------------
   Helpers: load chapters safely
--------------------------------*/
function loadChaptersFromLocalStorage() {
  const raw = localStorage.getItem('dahtruth-story-lab-toc-v3');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = parsed?.chapters ?? [];
    return list.map((c, idx) => ({
      id: c.id ?? idx,
      title: c.title ?? `Chapter ${idx + 1}`,
      text: c.text ?? c.content ?? c.body ?? '',
    }));
  } catch {
    return [];
  }
}

/* -----------------------------
   Tiny, client-only "NLP-lite"
--------------------------------*/
const splitSentences = (txt) =>
  (txt || '')
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens = (text || '').match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach(t => {
    if (!['I', 'The', 'A', 'And', 'But'].includes(t)) names.add(t.trim());
  });
  return Array.from(names).slice(0, 50);
}

function extractConflicts(text) {
  const hits = [];
  const needles = ['conflict', 'tension', 'argument', 'fight', 'feud', 'rivalry', 'obstacle', 'problem', 'challenge'];
  const sentences = splitSentences(text);
  sentences.forEach(s => {
    if (needles.some(n => s.toLowerCase().includes(n))) hits.push(s.trim());
  });
  return hits;
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter(s => s.toLowerCase().includes(k));
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
   FEATURE CARDS
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
   WORKSHOP COMPONENTS
========================================================= */
const StoryPromptsWorkshop = ({ chapters, characters }) => {
  const fullText = useMemo(() => chapters.map(c => c.text).join('\n\n'), [chapters]);

  const prompts = useMemo(() => {
    const out = [];
    (characters || []).slice(0, 8).forEach(ch => {
      out.push(`Explore the backstory of ${ch}.`);
      out.push(`What does ${ch} fear the most? Write a scene that reveals it implicitly.`);
    });
    const conflicts = extractConflicts(fullText);
    if (conflicts.length) {
      out.push(`What happens if this conflict escalates further: "${conflicts[0]}".`);
    }
    const hopes = extractKeywordSentences(fullText, 'hope');
    const fears = extractKeywordSentences(fullText, 'fear');
    const legacy = extractKeywordSentences(fullText, 'legacy');

    if (hopes[0]) out.push(`Write a scene where this hope comes true: "${hopes[0]}".`);
    if (fears[0]) out.push(`Force the protagonist to confront this fear: "${fears[0]}".`);
    if (legacy[0]) out.push(`Foreshadow this legacy in a quiet, symbolic moment: "${legacy[0]}".`);

    chapters.forEach((ch, i) => {
      if ((ch.text || '').length > 60) {
        out.push(`Chapter ${i + 1}: raise the stakes in the final third without adding new characters.`);
        out.push(`Chapter ${i + 1}: add a reversal that turns the POV character's goal on its head.`);
      }
    });

    return Array.from(new Set(out)).slice(0, 24);
  }, [chapters, characters, fullText]);

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-cyan-500/20">
      <h3 className="text-xl font-semibold text-cyan-300 mb-4">Story Prompts Workshop</h3>
      <p className="text-cyan-200/80 mb-4">
        Prompts generated from your story chapters and characters.
      </p>
      {prompts.length === 0 ? (
        <div className="text-cyan-200/60">No prompts yet. Add chapters first.</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {prompts.map((p, i) => (
            <li key={i} className="p-3 rounded-lg bg-slate-900/40 border border-cyan-500/10 text-cyan-100/90">
              • {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
   MAIN COMPONENT
========================================================= */
export default function StoryLab() {
  const [activeSection, setActiveSection] = useState('overview');
  const [chapters, setChapters] = useState([]);
  const [workshopCharacters, setWorkshopCharacters] = useState([]);

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

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

        {/* Chapter Info Bar */}
        {chapters.length > 0 && (
          <div className="mb-12 p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 backdrop-blur-xl rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-3 text-cyan-300">
              <BookOpen className="w-5 h-5" />
              <span>
                {chapters.length} chapter{chapters.length > 1 ? 's' : ''} loaded from your story
              </span>
            </div>
          </div>
        )}

        {/* Lab Sessions */}
        <section className="mb-16">
          <SectionHeader 
            icon="🧪"
            title="Lab Sessions"
            subtitle="Interactive workshops that analyze your story to generate personalized insights."
          />
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <button
              onClick={() => setActiveSection('prompts')}
              className={`rounded-2xl p-5 border transition-all text-left ${
                activeSection === 'prompts'
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-100'
                  : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
              }`}
            >
              <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
              <div className="text-sm text-cyan-200/80">Generates prompts from themes, conflicts, and your characters.</div>
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
              <div className="text-sm text-cyan-200/80">Pulls sentences that reveal drives and long-term aims.</div>
            </button>
          </div>

          {/* Active workshop panel */}
          {activeSection === 'prompts' && (
            <StoryPromptsWorkshop chapters={chapters} characters={workshopCharacters} />
          )}
          {activeSection === 'clothesline' && (
            <ClotheslineWorkshop characters={workshopCharacters} />
          )}
          {activeSection === 'hfl' && (
            <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
          )}
        </section>

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

