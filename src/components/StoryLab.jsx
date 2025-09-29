// src/components/StoryLab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Users, Layers, Heart, BookOpen, Pin, Calendar, Clock,
  ChevronRight, Plus, Trash2, MapPin
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
    return list.map((c, idx) => ({
      id: c.id ?? idx,
      title: c.title ?? `Chapter ${idx + 1}`,
      text: c.text ?? c.content ?? c.body ?? "",
    }));
  } catch {
    return [];
  }
}

/* -----------------------------
   Tiny client "NLP-lite"
--------------------------------*/
const splitSentences = (txt) =>
  (txt || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens =
    (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach((t) => {
    if (!["I", "The", "A", "And", "But"].includes(t)) names.add(t.trim());
  });
  return Array.from(names).slice(0, 50);
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}
function extractConflicts(text) {
  const needles = [
    "conflict",
    "tension",
    "argument",
    "fight",
    "feud",
    "rivalry",
    "obstacle",
    "problem",
    "challenge",
  ];
  return splitSentences(text).filter((s) =>
    needles.some((n) => s.toLowerCase().includes(n))
  );
}

/* =========================================================
   TOP BAR (glass / brand colors)
========================================================= */
const TopBar = () => {
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 text-ink">
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/60 shadow">
              <img
                src="/DahTruthLogo.png"
                className="w-full h-full object-cover"
                alt="DahTruth"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
            <div className="leading-tight">
              <div className="text-lg font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
                Story Lab
              </div>
              <div className="text-xs text-muted -mt-0.5">
                Where your writing journey begins
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl glass-soft border border-white/60 px-3 py-2 text-sm font-medium hover:bg-white/80 transition-colors"
            title="Back to Dashboard"
          >
            <span className="inline-block rotate-180">➜</span> Back
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   FEATURE CARD (brand colors)
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusStyles = {
    Ready:
      "bg-primary text-ink border-white/60",
    Beta:
      "bg-accent/40 text-ink border-white/60",
    "Coming Soon":
      "bg-muted/20 text-ink border-white/60",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/80 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-accent/20 rounded-xl border border-white/60">
            <Icon className="w-6 h-6 text-ink/80" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
            {status && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}
              >
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted mt-1" />
      </div>
      <p className="text-ink/80 text-sm leading-relaxed">{description}</p>
    </button>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-8">
    <div className="p-3 rounded-xl bg-white/70 border border-white/60">
      <span className="text-xl">{icon}</span>
    </div>
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-1">
        {title}
      </h2>
      {subtitle ? <p className="text-muted">{subtitle}</p> : null}
    </div>
  </div>
);

/* =========================================================
   LAB TOOLS (brand styles)
========================================================= */
const CharacterManager = ({ seedText = "", onChange }) => {
  const [characters, setCharacters] = useState(() => {
    const fromText = guessCharacters(seedText);
    return fromText.length
      ? fromText.map((n, i) => ({ id: i + 1, name: n }))
      : [];
  });
  const [newCharacter, setNewCharacter] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    onChange?.(characters.map((c) => c.name));
  }, [characters, onChange]);

  const addCharacter = () => {
    const val = newCharacter.trim();
    if (!val) return;
    setCharacters((prev) => [...prev, { id: Date.now(), name: val }]);
    setNewCharacter("");
  };
  const delCharacter = (id) =>
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  const updateCharacter = (id, name) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c))
    );
    setEditingId(null);
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-lg font-semibold text-ink mb-4">Character Manager</h3>

      <div className="space-y-3 mb-4">
        {characters.length === 0 && (
          <div className="text-muted text-sm">No characters yet. Add one.</div>
        )}
        {characters.map((ch) => (
          <div
            key={ch.id}
            className="flex items-center gap-3 bg-white/70 rounded-lg p-3 border border-white/60"
          >
            {editingId === ch.id ? (
              <input
                type="text"
                defaultValue={ch.name}
                onBlur={(e) => updateCharacter(ch.id, e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && updateCharacter(ch.id, e.currentTarget.value)
                }
                className="flex-1 bg-transparent border-b border-muted text-ink outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingId(ch.id)}
                className="flex-1 text-ink cursor-pointer hover:text-ink/80"
                title="Click to edit"
              >
                {ch.name}
              </span>
            )}
            <button
              onClick={() => delCharacter(ch.id)}
              className="text-ink/60 hover:text-ink"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new character…"
          value={newCharacter}
          onChange={(e) => setNewCharacter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCharacter()}
          className="flex-1 px-4 py-2 bg-white border border-white/60 rounded-lg text-ink placeholder-muted focus:border-muted focus:outline-none"
        />
        <button
          onClick={addCharacter}
          className="px-4 py-2 bg-accent/50 hover:bg-accent/60 text-ink rounded-lg border border-white/60 transition-colors"
          title="Add character"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const StoryPromptsWorkshop = ({ chapters, characters }) => {
  const fullText = useMemo(
    () => chapters.map((c) => c.text).join("\n\n"),
    [chapters]
  );

  const prompts = useMemo(() => {
    const out = [];
    (characters || []).slice(0, 8).forEach((ch) => {
      out.push(`Explore the backstory of ${ch}.`);
      out.push(
        `What does ${ch} fear the most? Write a scene that reveals it implicitly.`
      );
    });
    const conflicts = extractConflicts(fullText);
    if (conflicts.length) {
      out.push(
        `What happens if this conflict escalates further: "${conflicts[0]}".`
      );
    }
    const hopes = extractKeywordSentences(fullText, "hope");
    const fears = extractKeywordSentences(fullText, "fear");
    const legacy = extractKeywordSentences(fullText, "legacy");

    if (hopes[0]) out.push(`Write a scene where this hope comes true: "${hopes[0]}".`);
    if (fears[0]) out.push(`Force the protagonist to confront this fear: "${fears[0]}".`);
    if (legacy[0]) out.push(`Foreshadow this legacy in a symbolic moment: "${legacy[0]}".`);

    chapters.forEach((ch, i) => {
      if ((ch.text || "").length > 60) {
        out.push(
          `Chapter ${i + 1}: raise the stakes in the final third without adding new characters.`
        );
        out.push(
          `Chapter ${i + 1}: add a reversal that flips the POV character's goal.`
        );
      }
    });

    return Array.from(new Set(out)).slice(0, 24);
  }, [chapters, characters, fullText]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-xl font-semibold text-ink mb-2">Story Prompts Workshop</h3>
      <p className="text-ink/70 mb-4">
        Prompts generated from your chapters and characters.
      </p>
      {prompts.length === 0 ? (
        <div className="text-muted">No prompts yet. Add chapters first.</div>
      ) : (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {prompts.map((p, i) => (
            <li
              key={i}
              className="p-3 rounded-lg bg-white/80 border border-white/60 text-ink"
            >
              • {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ClotheslineWorkshop = ({ characters }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
    <h3 className="text-xl font-semibold text-ink mb-2">Clothes Pin Workshop</h3>
    <p className="text-ink/70 mb-4">
      Pin quick synopses for each character.
    </p>
    <div className="flex items-center gap-4 overflow-x-auto pb-2">
      {(characters?.length ? characters : ["Protagonist", "Antagonist"]).map(
        (name, idx) => (
          <div
            key={idx}
            className="min-w-[220px] bg-white/80 border border-white/60 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-ink/70" />
              <div className="font-semibold text-ink">{name}</div>
            </div>
            <p className="text-sm text-ink/80">
              {name} plays a key role. Summarize traits, goals, and obstacles here.
            </p>
          </div>
        )
      )}
    </div>
  </div>
);

const HopesFearsLegacyWorkshop = ({ chapters, characters }) => {
  const text = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);
  const insights = useMemo(() => {
    const result = {};
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
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-xl font-semibold text-ink mb-4">
        Hopes, Fears & Legacy Workshop
      </h3>
      {(!characters || characters.length === 0) && (
        <div className="text-muted mb-3">
          Add characters above to see targeted insights.
        </div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-white/60 bg-white/80 p-4">
            <div className="font-semibold text-ink mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["Hopes", "Fears", "Legacy"].map((key) => (
                <div key={key} className="rounded-lg bg-white p-3 border border-white/60">
                  <div className="text-ink/80 text-sm font-medium mb-2">{key}</div>
                  {data[key]?.length ? (
                    <ul className="space-y-2 text-ink/90 text-sm">
                      {data[key].map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted text-sm">No {key.toLowerCase()} yet.</div>
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
   MAIN
========================================================= */
export default function StoryLab() {
  const [activeSection, setActiveSection] = useState("prompts");
  const [chapters, setChapters] = useState([]);
  const [workshopCharacters, setWorkshopCharacters] = useState([]);

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

  // Brand-themed feature groups (unchanged copy, new colors come from FeatureCard)
  const aiFeatures = [
    {
      icon: Sparkles,
      title: "Story Prompts",
      status: "Ready",
      description:
        "Get creative AI-generated prompts when you're stuck, tailored to your themes and current chapter.",
    },
    {
      icon: Layers,
      title: "Scene Summaries",
      status: "Ready",
      description:
        "Auto-generate chapter summaries and track plot threads throughout your novel.",
    },
  ];

  const storyFeatures = [
    {
      icon: Users,
      title: "Character Profiles",
      status: "Beta",
      description:
        "Create detailed character sheets with relationship tracking.",
    },
    {
      icon: MapPin,
      title: "World Bible",
      status: "Beta",
      description:
        "Build your story world with locations, cultures, and timelines.",
    },
  ];

  const workshopFeatures = [
    {
      icon: Calendar,
      title: "Session Schedule",
      status: "Ready",
      description:
        "Six-session collaborative writing structure with goals.",
    },
    {
      icon: Users,
      title: "Breakout Pairings",
      status: "Ready",
      description:
        "Randomly pair writers for collaborative exercises.",
    },
    {
      icon: BookOpen,
      title: "Quote Flash Writing",
      status: "Ready",
      description:
        "Inspirational quotes for 5-minute timed writing warmups.",
    },
  ];

  const faithFeatures = [
    {
      icon: Heart,
      title: "Reflection Prompts",
      status: "Beta",
      description:
        "Daily spiritual reflection to ground your writing in purpose.",
    },
  ];

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      <TopBar />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-3">
            The All-in-One Writing Platform
          </h1>
          <p className="text-ink/80">
            Where creativity meets discipline—blend AI assistance, community, character tracking, and faith-based reflection.
          </p>
        </div>

        {/* Chapter Info Bar */}
        {chapters.length > 0 && (
          <div className="mb-12 p-4 bg-white/70 backdrop-blur-xl rounded-xl border border-white/60">
            <div className="flex items-center gap-3 text-ink">
              <BookOpen className="w-5 h-5" />
              <span>
                {chapters.length} chapter{chapters.length > 1 ? "s" : ""} loaded from your story
              </span>
            </div>
          </div>
        )}

        {/* Lab Sessions — 4 cards in one line on large screens */}
        <section className="mb-16">
          <SectionHeader
            icon="🧪"
            title="Lab Sessions"
            subtitle="Interactive workshops that analyze your story and generate personalized insights."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <button
              onClick={() => setActiveSection("prompts")}
              className={`rounded-2xl p-5 border transition-colors text-left ${
                activeSection === "prompts"
                  ? "bg-primary border-white/60"
                  : "bg-white/70 border-white/60 hover:bg-white/80"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
              <div className="text-sm text-ink/70">
                Prompts from themes, conflicts, and characters.
              </div>
            </button>

            <button
              onClick={() => setActiveSection("clothesline")}
              className={`rounded-2xl p-5 border transition-colors text-left ${
                activeSection === "clothesline"
                  ? "bg-primary border-white/60"
                  : "bg-white/70 border-white/60 hover:bg-white/80"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Clothes Pin Workshop</div>
              <div className="text-sm text-ink/70">
                Visual cards to summarize characters and roles.
              </div>
            </button>

            <button
              onClick={() => setActiveSection("hfl")}
              className={`rounded-2xl p-5 border transition-colors text-left ${
                activeSection === "hfl"
                  ? "bg-primary border-white/60"
                  : "bg-white/70 border-white/60 hover:bg-white/80"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Hopes, Fears & Legacy</div>
              <div className="text-sm text-ink/70">
                Pulls sentences that reveal drives and long-term aims.
              </div>
            </button>

            <button
              onClick={() => setActiveSection("characters")}
              className={`rounded-2xl p-5 border transition-colors text-left ${
                activeSection === "characters"
                  ? "bg-primary border-white/60"
                  : "bg-white/70 border-white/60 hover:bg-white/80"
              }`}
            >
              <div className="text-lg font-semibold mb-1">Character Manager</div>
              <div className="text-sm text-ink/70">
                Add/edit characters to feed prompts and analysis.
              </div>
            </button>
          </div>

          {/* Active panel */}
          {activeSection === "prompts" && (
            <StoryPromptsWorkshop
              chapters={chapters}
              characters={workshopCharacters}
            />
          )}
          {activeSection === "clothesline" && (
            <ClotheslineWorkshop characters={workshopCharacters} />
          )}
          {activeSection === "hfl" && (
            <HopesFearsLegacyWorkshop
              chapters={chapters}
              characters={workshopCharacters}
            />
          )}
          {activeSection === "characters" && (
            <CharacterManager
              seedText={chapters.map((c) => c.text).join("\n\n")}
              onChange={setWorkshopCharacters}
            />
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
            {aiFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} />
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
          <div className="grid gap-6 md:grid-cols-2">
            {storyFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </section>

        {/* Workshop Community */}
        <section className="mb-12">
          <SectionHeader
            icon="👥"
            title="Workshop Community"
            subtitle="Collaborative writing sessions and community accountability"
          />
          <div className="grid gap-6 md:grid-cols-3">
            {workshopFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} />
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
            {faithFeatures.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </section>

        {/* Quick Actions Bar — brand glass */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-accent/70 hover:bg-accent text-ink rounded-xl font-medium transition-colors shadow">
                Start Writing Session
              </button>
              <button className="px-4 py-2 glass-soft border border-white/60 hover:bg-white/90 rounded-xl font-medium transition-colors">
                View Schedule
              </button>
            </div>
            <div className="flex items-center gap-2 text-ink/70">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Next session in 2 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
