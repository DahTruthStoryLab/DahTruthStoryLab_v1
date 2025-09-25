import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain, Target, Zap, ArrowLeft, BookOpen, Users, /* Quote, */ Pin,
  Sparkles, Calendar, Clock, ChevronRight, X, Plus, Shuffle,
  PenTool, Layers, Edit3, Trash2, Save, Globe, Shield, Heart,
  Star, CheckCircle, AlertCircle, FileText, BarChart, MessageSquare,
  Feather, User, MapPin
} from "lucide-react";

/* -----------------------------
   Helpers: load chapters safely
--------------------------------*/
function loadChaptersFromLocalStorage() {
  const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = parsed?.chapters ?? [];
    return list.map((c: any, idx: number) => ({
      id: c.id ?? idx,
      title: c.title ?? `Chapter ${idx + 1}`,
      text: c.text ?? c.content ?? c.body ?? "",
    }));
  } catch {
    return [];
  }
}

/* -----------------------------
   Tiny, client-only "NLP-lite"
--------------------------------*/
const splitSentences = (txt: string) =>
  (txt || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text: string) {
  const names = new Set<string>();
  const tokens = (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach((t) => {
    if (!["I", "The", "A", "And", "But"].includes(t)) names.add(t.trim());
  });
  return Array.from(names).slice(0, 50);
}

function extractConflicts(text: string) {
  const hits: string[] = [];
  const needles = ["conflict", "tension", "argument", "fight", "feud", "rivalry", "obstacle", "problem", "challenge"];
  const sentences = splitSentences(text);
  sentences.forEach((s) => {
    if (needles.some((n) => s.toLowerCase().includes(n))) hits.push(s.trim());
  });
  return hits;
}

function extractKeywordSentences(text: string, keyword: string) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}

/* =========================================================
   TOP BANNER - UPDATED WITH NAVIGATION
========================================================= */
const TopBanner = ({ navigate }: { navigate: (p: string) => void }) => {
  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="font-extrabold tracking-wide">Story Lab</div>

          <div className="text-center">
            <div className="text-sm opacity-90">Creative Workshop</div>
            <div className="text-lg font-semibold">DahTruth Platform</div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm font-medium border border-white/20"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   FEATURE CARDS  (lightened aesthetic)
========================================================= */
const FeatureCard = ({
  icon: Icon,
  title,
  status,
  description,
  onClick,
}: {
  icon: any;
  title: string;
  status?: "Ready" | "Beta" | "Coming Soon";
  description: string;
  onClick?: () => void;
}) => {
  const statusColors: Record<string, string> = {
    Ready: "bg-green-100 text-green-700 border-green-200",
    Beta: "bg-blue-100 text-blue-700 border-blue-200",
    "Coming Soon": "bg-gray-100 text-gray-700 border-gray-200",
  };

  return (
    <div
      onClick={onClick}
      className="bg-sky-50/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-200 hover:border-sky-300 transition-all cursor-pointer group hover:shadow-md"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-sky-100 rounded-xl group-hover:bg-sky-200 transition-all border border-sky-200">
            <Icon className="w-6 h-6 text-sky-700" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
            {status && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
              >
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors mt-1" />
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const SectionHeader = ({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) => {
  return (
    <div className="flex items-start gap-3 mb-8">
      <div className="p-3 bg-gradient-to-br from-sky-100 to-blue-100 rounded-xl border border-sky-200">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{title}</h2>
        {subtitle && <p className="text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
};

/* =========================================================
   CHARACTER MANAGER
========================================================= */
const CharacterManager = ({
  seedText = "",
  onChange,
}: {
  seedText?: string;
  onChange?: (names: string[]) => void;
}) => {
  const [characters, setCharacters] = useState(() => {
    const fromText = guessCharacters(seedText);
    return fromText.length ? fromText.map((n, i) => ({ id: i + 1, name: n })) : [];
  });
  const [newCharacter, setNewCharacter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    onChange?.(characters.map((c) => c.name));
  }, [characters, onChange]);

  const addCharacter = () => {
    const val = newCharacter.trim();
    if (!val) return;
    setCharacters((prev) => [...prev, { id: Date.now(), name: val }]);
    setNewCharacter("");
  };

  const deleteCharacter = (id: number) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCharacter = (id: number, name: string) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)));
    setEditingId(null);
  };

  return (
    <div className="bg-sky-50/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-200">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Character Manager</h3>

      <div className="space-y-3 mb-4">
        {characters.length === 0 && (
          <div className="text-slate-600 text-sm">No characters found yet. Add them below.</div>
        )}
        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
          >
            {editingId === character.id ? (
              <input
                type="text"
                defaultValue={character.name}
                onBlur={(e) => updateCharacter(character.id, e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && updateCharacter(character.id, (e.currentTarget as HTMLInputElement).value)
                }
                className="flex-1 bg-transparent border-b border-sky-400 text-slate-800 outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingId(character.id)}
                className="flex-1 text-slate-800 cursor-pointer hover:text-sky-700"
                title="Click to edit"
              >
                {character.name}
              </span>
            )}
            <button
              onClick={() => deleteCharacter(character.id)}
              className="text-rose-600 hover:text-rose-700 transition-colors"
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
          onKeyDown={(e) => e.key === "Enter" && addCharacter()}
          className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:border-sky-400 focus:outline-none"
        />
        <button
          onClick={addCharacter}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-all"
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
const StoryPromptsWorkshop = ({
  chapters,
  characters,
}: {
  chapters: any[];
  characters: string[];
}) => {
  const fullText = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);

  const prompts = useMemo(() => {
    const out: string[] = [];
    (characters || []).slice(0, 8).forEach((ch) => {
      out.push(`Explore the backstory of ${ch}.`);
      out.push(`What does ${ch} fear the most? Write a scene that reveals it implicitly.`);
    });
    const conflicts = extractConflicts(fullText);
    if (conflicts.length) {
      out.push(`What happens if this conflict escalates further: "${conflicts[0]}".`);
    }
    const hopes = extractKeywordSentences(fullText, "hope");
    const fears = extractKeywordSentences(fullText, "fear");
    const legacy = extractKeywordSentences(fullText, "legacy");

    if (hopes[0]) out.push(`Write a scene where this hope comes true: "${hopes[0]}".`);
    if (fears[0]) out.push(`Force the protagonist to confront this fear: "${fears[0]}".`);
    if (legacy[0]) out.push(`Foreshadow this legacy in a quiet, symbolic moment: "${legacy[0]}".`);

    chapters.forEach((ch, i) => {
      if ((ch.text || "").length > 60) {
        out.push(`Chapter ${i + 1}: raise the stakes in the final third without adding new characters.`);
        out.push(`Chapter ${i + 1}: add a reversal that turns the POV character's goal on its head.`);
      }
    });

    return Array.from(new Set(out)).slice(0, 24);
  }, [chapters, characters, fullText]);

  return (
    <div className="bg-sky-50/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-200">
      <h3 className="text-xl font-semibold text-slate-800 mb-2">Story Prompts Workshop</h3>
      <p className="text-slate-600 mb-4">Prompts generated from your story chapters and characters.</p>
      {prompts.length === 0 ? (
        <div className="text-slate-600">No prompts yet. Add chapters first.</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {prompts.map((p, i) => (
            <li key={i} className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800">
              • {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ClotheslineWorkshop = ({ characters }: { characters: string[] }) => {
  return (
    <div className="bg-sky-50/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-200">
      <h3 className="text-xl font-semibold text-slate-800 mb-2">Clothes Pin Workshop</h3>
      <p className="text-slate-600 mb-4">Pin quick synopses for each character.</p>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(characters?.length ? characters : ["Protagonist", "Antagonist"]).map((name, idx) => (
          <div key={idx} className="min-w-[220px] bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-sky-700" />
              <div className="font-semibold text-slate-800">{name}</div>
            </div>
            <p className="text-sm text-slate-700">
              {name} plays a key role in the story. Summarize traits, goals, and obstacles here.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const HopesFearsLegacyWorkshop = ({
  chapters,
  characters,
}: {
  chapters: any[];
  characters: string[];
}) => {
  const text = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);

  const insights = useMemo(() => {
    const result: Record<string, { Hopes: string[]; Fears: string[]; Legacy: string[] }> = {};
    (characters || []).forEach((ch) => {
      result[ch] = {
        Hopes: extractKeywordSentences(text, "hope").slice(0, 3),
        Fears: extractKeywordSentences(text, "fear").slice(0, 3),
        Legacy: extractKeywordSentences(text, "legacy").slice(0, 3),
      };
    });
    return result;
  }, [text, characters]);

  return (
    <div className="bg-sky-50/80 backdrop-blur-xl rounded-2xl p-6 border border-sky-200">
      <h3 className="text-xl font-semibold text-slate-800 mb-4">Hopes, Fears & Legacy Workshop</h3>
      {(!characters || characters.length === 0) && (
        <div className="text-slate-600 mb-3">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="font-semibold text-slate-800 mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["Hopes", "Fears", "Legacy"].map((key) => (
                <div key={key} className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="text-slate-800 text-sm font-medium mb-2">{key}</div>
                  {(data as any)[key] && (data as any)[key].length ? (
                    <ul className="space-y-2 text-slate-700 text-sm">
                      {(data as any)[key].map((s: string, i: number) => <li key={i}>• {s}</li>)}
                    </ul>
                  ) : (
                    <div className="text-slate-500 text-sm">No {key.toLowerCase()} found yet.</div>
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
   MAIN COMPONENT - UPDATED WITH NAVIGATION
========================================================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"overview" | "clothesline" | "hfl">("overview");
  const [chapters, setChapters] = useState<any[]>([]);
  const [workshopCharacters, setWorkshopCharacters] = useState<string[]>([]);

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

  const aiFeatures = [
    {
      icon: Sparkles,
      title: "Story Prompts",
      status: "Ready" as const,
      description: "Get creative AI-generated prompts tailored to your story's theme and chapter.",
    },
    {
      icon: CheckCircle,
      title: "Character Consistency",
      status: "Coming Soon" as const,
      description: "AI checks for character inconsistencies like changing eye color or contradictions.",
    },
    {
      icon: Edit3,
      title: "Grammar Polish",
      status: "Coming Soon" as const,
      description: "Smart grammar and clarity suggestions that preserve your unique voice.",
    },
    {
      icon: FileText,
      title: "Scene Summaries",
      status: "Ready" as const,
      description: "Auto-generate chapter summaries and track plot threads.",
    },
  ];

  const storyFeatures = [
    {
      icon: User,
      title: "Character Profiles",
      status: "Beta" as const,
      description: "Create detailed character sheets and track relationships.",
    },
    {
      icon: Pin,
      title: "Character Clothesline",
      status: "Ready" as const,
      description: "Pin and track traits, obstacles, and changes.",
    },
    {
      icon: Globe,
      title: "World Bible",
      status: "Beta" as const,
      description: "Locations, cultures, and timelines that grow as you write.",
    },
    {
      icon: Shield,
      title: "Continuity Alerts",
      status: "Coming Soon" as const,
      description: "Get notified when you break continuity rules mid-story.",
    },
  ];

  // 🔁 UPDATED: replace Quote Flash Writing → Critique Circle
  const workshopFeatures = [
    {
      icon: Calendar,
      title: "Session Schedule",
      status: "Ready" as const,
      description: "Six-session collaborative writing structure with goals.",
    },
    {
      icon: Users,
      title: "Breakout Pairings",
      status: "Ready" as const,
      description: "Randomly pair writers for collaborative exercises and peer review.",
    },
    {
      icon: MessageSquare,
      title: "Critique Circle",
      status: "Ready" as const,
      description: "Share drafts with your cohort, add inline comments, and track revisions securely.",
    },
  ];

  const faithFeatures = [
    {
      icon: Heart,
      title: "Reflection Prompts",
      status: "Beta" as const,
      description: "Daily questions to ground your writing in purpose and meaning.",
    },
    {
      icon: Star,
      title: "Legacy Writing",
      status: "Coming Soon" as const,
      description: "Tools for writing with future generations in mind.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-white">
      <TopBanner navigate={navigate} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            The All-in-One Writing Platform
          </h1>
          <p className="text-lg text-slate-600 mb-8">
            Where creativity meets discipline. Blend AI, community support, character tracking,
            and faith-based reflection in one seamless writing experience.
          </p>

        {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 border border-yellow-200 text-yellow-800">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI-Powered Assistance</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-blue-800">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Writing Community</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800">
              <Layers className="w-4 h-4" />
              <span className="text-sm font-medium">Organization Tools</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 border border-purple-200 text-purple-800">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Faith Integration</span>
            </div>
          </div>
        </div>

        {/* Chapter Info Bar */}
        {chapters.length > 0 && (
          <div className="mb-12 p-4 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 text-slate-800">
              <BookOpen className="w-5 h-5" />
              <span>
                {chapters.length} chapter{chapters.length > 1 ? "s" : ""} loaded from your story
              </span>
            </div>
          </div>
        )}

        {/* Lab Sessions */}
        <section className="mb-16">
          <SectionHeader
            icon="🧪"
            title="Lab Sessions"
            subtitle="Interactive workshops that analyze your story and support collaboration."
          />
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <button
              onClick={() => navigate("/story-lab/prompts")}
              className="rounded-2xl p-5 border transition-all text-left bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
            >
              <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
              <div className="text-sm text-slate-600">
                Smart prompts based on your story structure and content.
              </div>
            </button>

            <button
              onClick={() => setActiveSection("clothesline")}
              className={`rounded-2xl p-5 border transition-all text-left ${
                activeSection === "clothesline"
                  ? "bg-sky-100 border-sky-300 text-slate-800"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Clothes Pin Workshop</div>
              <div className="text-sm text-slate-600">Visual cards to summarize characters and roles.</div>
            </button>

            <button
              onClick={() => setActiveSection("hfl")}
              className={`rounded-2xl p-5 border transition-all text-left ${
                activeSection === "hfl"
                  ? "bg-sky-100 border-sky-300 text-slate-800"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Hopes, Fears & Legacy</div>
              <div className="text-sm text-slate-600">Pulls sentences that reveal drives and long-term aims.</div>
            </button>
          </div>

          {/* NEW: Critique Circle button that routes to the workshop module */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/story-lab/critique")}
              className="w-full rounded-2xl p-5 border transition-all text-left bg-white border-slate-200 text-slate-800 hover:bg-slate-50 flex items-center gap-3"
            >
              <MessageSquare className="w-5 h-5 text-sky-700" />
              <div>
                <div className="text-lg font-semibold mb-1">Critique Circle</div>
                <div className="text-sm text-slate-600">
                  Secure peer review with inline comments, reactions, copy-controls, and an audit log.
                </div>
              </div>
            </button>
          </div>

          {/* Active workshop panels */}
          {activeSection === "clothesline" && (
            <ClotheslineWorkshop characters={workshopCharacters} />
          )}
          {activeSection === "hfl" && (
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
            subtitle="Character development, world building, and organization tools"
          />
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {storyFeatures.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>

          {/* Character Manager */}
          <CharacterManager
            seedText={chapters.map((c) => c.text).join("\n\n")}
            onChange={setWorkshopCharacters}
          />
        </section>

        {/* Workshop Community */}
        <section className="mb-12">
          <SectionHeader
            icon="👥"
            title="Workshop Community"
            subtitle="Collaborative writing sessions and accountability"
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
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-medium transition-all shadow-lg">
                Start Writing Session
              </button>
              <button className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 rounded-lg font-medium transition-all border border-slate-200">
                View Schedule
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Next session in 2 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
