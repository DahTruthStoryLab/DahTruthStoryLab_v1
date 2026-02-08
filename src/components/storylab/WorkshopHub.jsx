// src/components/storylab/WorkshopHub.jsx
// Workshop Hub - Central dashboard for all StoryLab modules
// UPDATED: Track-aware modules for Fiction / Poetry / Nonfiction (with Coming Soon cards)

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Target,
  Layers,
  LayoutGrid,
  Sparkles,
  BookOpen,
  Users,
  PenLine,
  ArrowRight,
  Flame,
  Map,
  Star,
  TrendingUp,
  MessageSquare,
  Feather,
  NotebookPen,
  Quote,
  ScrollText,
} from "lucide-react";

/* ============================================
   BRAND COLORS
   ============================================ */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldLight: "#f5e6b3",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  roseDark: "#c97b7b",
  ink: "#0F172A",
  cream: "#fefdfb",
};

/* ============================================
   STORY CONTEXT (Step 2: read currentStory)
   ============================================ */
const CURRENT_STORY_KEY = "currentStory";

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// Normalize story genres into broad tracks StoryLab understands
function normalizeGenre(genreRaw) {
  const g = String(genreRaw || "").toLowerCase();

  // Poetry
  if (g.includes("poem") || g.includes("poetry")) return "Poetry";

  // Nonfiction
  if (
    (g.includes("non") && g.includes("fiction")) ||
    g.includes("memoir") ||
    g.includes("essay") ||
    g.includes("biograph") ||
    g.includes("self help") ||
    g.includes("self-help") ||
    g.includes("history") ||
    g.includes("devotional") ||
    g.includes("christian living") ||
    g.includes("how to") ||
    g.includes("how-to")
  ) {
    return "Nonfiction";
  }

  // Default
  return "Fiction";
}

/* ============================================
   MODULE DEFINITIONS
   - We split modules into: COMMON + track-specific
   - For track-specific modules you haven't built yet:
     mark comingSoon: true so we can show a nice disabled card
   ============================================ */
const COMMON_MODULES = [
  {
    id: "dialogue-lab",
    title: "Dialogue Lab",
    description: "Write, analyze, and enhance dialogue with AI-powered feedback.",
    icon: MessageSquare,
    path: "/story-lab/dialogue-lab",
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    category: "Writing",
    isNew: true,
  },
  {
    id: "prompts",
    title: "Writing Prompts",
    description: "AI-powered prompts to spark creativity and overcome blocks.",
    icon: Sparkles,
    path: "/story-lab/prompts",
    color: BRAND.mauve,
    gradient: `linear-gradient(135deg, ${BRAND.mauve} 0%, #a78bfa 100%)`,
    category: "Writing",
  },
  {
    id: "community",
    title: "Workshop Community",
    description: "Connect with other writers—share work, give feedback, grow together.",
    icon: Users,
    path: "/story-lab/community",
    color: "#059669",
    gradient: "linear-gradient(135deg, #047857 0%, #059669 100%)",
    category: "Community",
  },
];

const FICTION_MODULES = [
  {
    id: "hfl",
    title: "Hopes • Fears • Legacy",
    description:
      "Define what drives your characters—their dreams, obstacles, and what they leave behind.",
    icon: Heart,
    path: "/story-lab/workshop/hfl",
    color: BRAND.rose,
    gradient: `linear-gradient(135deg, ${BRAND.roseDark} 0%, ${BRAND.rose} 100%)`,
    category: "Character",
  },
  {
    id: "priorities",
    title: "Priority Cards",
    description: "Track wants, fears, needs, and secrets with AI-powered suggestions.",
    icon: Target,
    path: "/story-lab/workshop/priorities",
    color: BRAND.gold,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    category: "Character",
  },
  {
    id: "roadmap",
    title: "Character Roadmap",
    description: "Plan milestones and track the character journey through your story.",
    icon: Map,
    path: "/story-lab/workshop/roadmap",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
    category: "Character",
  },
  {
    id: "plot-builder",
    title: "Plot Builder",
    description: "Build story architecture—stakes, obstacles, turning points.",
    icon: Layers,
    path: "/story-lab/plot-builder",
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)",
    category: "Plot",
    isNew: true,
  },
  {
    id: "narrative-arc",
    title: "Narrative Arc",
    description: "Map structure using classic frameworks (Save the Cat, Hero’s Journey, etc.).",
    icon: TrendingUp,
    path: "/story-lab/narrative-arc",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
    category: "Structure",
  },
  {
    id: "clothesline",
    title: "Clothesline",
    description: "Visualize your story—scenes, chapters, and character threads.",
    icon: LayoutGrid,
    path: "/story-lab/workshop/clothesline",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    category: "Structure",
  },
];

const POETRY_MODULES = [
  // usable now (re-use existing tools that already exist)
  {
    id: "poetry-collection",
    title: "Collection Builder",
    description: "Organize poems into sections, order flow, and themes for a full collection.",
    icon: BookOpen,
    path: "/story-lab/hub", // safe path until you build the real page
    color: BRAND.gold,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    category: "Poetry",
    comingSoon: true,
  },
  {
    id: "poetry-forms",
    title: "Forms & Craft Lab",
    description: "Work through forms (free verse, sonnet, villanelle) and craft checkpoints.",
    icon: Feather,
    path: "/story-lab/hub",
    color: BRAND.rose,
    gradient: `linear-gradient(135deg, ${BRAND.roseDark} 0%, ${BRAND.rose} 100%)`,
    category: "Poetry",
    comingSoon: true,
  },
  {
    id: "poetry-linebreak",
    title: "Line Break Clinic",
    description: "Refine line breaks, rhythm, repetition, and emotional pacing.",
    icon: Quote,
    path: "/story-lab/hub",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    category: "Poetry",
    comingSoon: true,
  },
  {
    id: "poetry-theme-map",
    title: "Theme Map",
    description: "Tag poems by theme/imagery and track recurring motifs across the collection.",
    icon: NotebookPen,
    path: "/story-lab/hub",
    color: BRAND.mauve,
    gradient: `linear-gradient(135deg, ${BRAND.mauve} 0%, #a78bfa 100%)`,
    category: "Poetry",
    comingSoon: true,
  },
];

const NONFICTION_MODULES = [
  {
    id: "nf-outline",
    title: "Nonfiction Blueprint",
    description: "Build a chapter plan: promise, structure, beats, and reader takeaways.",
    icon: ScrollText,
    path: "/story-lab/hub",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
    category: "Nonfiction",
    comingSoon: true,
  },
  {
    id: "nf-argument",
    title: "Argument & Evidence Map",
    description: "Track claims, support, citations you need, and what to cut or clarify.",
    icon: Target,
    path: "/story-lab/hub",
    color: BRAND.gold,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    category: "Nonfiction",
    comingSoon: true,
  },
  {
    id: "nf-voice",
    title: "Voice & Tone Guardrails",
    description: "Keep your voice consistent while tightening clarity and persuasion.",
    icon: Flame,
    path: "/story-lab/hub",
    color: BRAND.rose,
    gradient: `linear-gradient(135deg, ${BRAND.roseDark} 0%, ${BRAND.rose} 100%)`,
    category: "Nonfiction",
    comingSoon: true,
  },
  {
    id: "nf-structure",
    title: "Narrative Arc (Nonfiction)",
    description: "Use structure frameworks to organize memoir/essay chapters and beats.",
    icon: TrendingUp,
    path: "/story-lab/narrative-arc",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
    category: "Structure",
  },
];

/* ============================================
   MODULE CARD
   ============================================ */
function ModuleCard({ module }) {
  const Icon = module.icon;

  const CardInner = (
    <>
      {/* Badge */}
      {(module.isNew || module.comingSoon) && (
        <div
          className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white z-10"
          style={{ background: module.comingSoon ? BRAND.navy : BRAND.gold }}
        >
          {module.comingSoon ? "COMING SOON" : "NEW"}
        </div>
      )}

      {/* Header with gradient */}
      <div className="px-6 py-5" style={{ background: module.gradient }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{module.title}</h3>
            <span className="text-xs text-white/70 uppercase tracking-wide">
              {module.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {module.description}
        </p>

        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
            style={{ color: module.color }}
          >
            {module.comingSoon ? "Preview (not live yet)" : "Open Module"}
            <ArrowRight size={16} />
          </span>
        </div>
      </div>

      {/* Disabled overlay */}
      {module.comingSoon && (
        <div
          className="absolute inset-0"
          style={{
            background: "rgba(255,255,255,0.45)",
            backdropFilter: "blur(1px)",
          }}
        />
      )}
    </>
  );

  const baseStyle = {
    background: "white",
    border: `1px solid ${module.color}20`,
    opacity: module.comingSoon ? 0.92 : 1,
  };

  // If comingSoon, render a non-clickable card but keep the hover style subtle
  if (module.comingSoon) {
    return (
      <div
        className="group relative rounded-2xl overflow-hidden transition-all duration-300"
        style={baseStyle}
        aria-disabled="true"
      >
        {CardInner}
      </div>
    );
  }

  return (
    <Link
      to={module.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={baseStyle}
    >
      {CardInner}
    </Link>
  );
}

/* ============================================
   QUICK ACCESS BUTTONS
   ============================================ */
function QuickAccess() {
  const quickLinks = [
    { to: "/compose", label: "Writer", icon: PenLine, color: BRAND.navy },
    { to: "/dashboard", label: "Dashboard", icon: BookOpen, color: BRAND.gold },
  ];

  return (
    <div className="flex items-center gap-3">
      {quickLinks.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
          style={{
            background: `${link.color}15`,
            color: link.color,
            border: `1px solid ${link.color}30`,
          }}
        >
          <link.icon size={16} />
          {link.label}
        </Link>
      ))}
    </div>
  );
}

/* ============================================
   MAIN COMPONENT
   ============================================ */
export default function WorkshopHub() {
  const [track, setTrack] = useState("Fiction");
  const [storyTitle, setStoryTitle] = useState("");

  useEffect(() => {
    const load = () => {
      const story = safeJsonParse(localStorage.getItem(CURRENT_STORY_KEY), {});
      const nextTrack = normalizeGenre(story?.primaryGenre || story?.genre);
      setTrack(nextTrack);
      setStoryTitle(story?.title || "");
    };

    load(); // initial

    const onProjectChange = () => load();
    window.addEventListener("project:change", onProjectChange);

    const onStorage = (e) => {
      if (e.key === CURRENT_STORY_KEY) load();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("project:change", onProjectChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Track-aware modules
  const modulesForTrack = useMemo(() => {
    if (track === "Poetry") return [...POETRY_MODULES, ...COMMON_MODULES];
    if (track === "Nonfiction") return [...NONFICTION_MODULES, ...COMMON_MODULES];
    return [...FICTION_MODULES, ...COMMON_MODULES];
  }, [track]);

  // Group modules by category (dynamic)
  const categories = useMemo(() => {
    const byCat = new Map();
    modulesForTrack.forEach((m) => {
      const cat = m.category || "Other";
      if (!byCat.has(cat)) byCat.set(cat, []);
      byCat.get(cat).push(m);
    });

    // Desired ordering depending on track
    const order =
      track === "Fiction"
        ? ["Character", "Plot", "Structure", "Writing", "Community", "Other"]
        : track === "Poetry"
        ? ["Poetry", "Writing", "Community", "Structure", "Other"]
        : ["Nonfiction", "Structure", "Writing", "Community", "Other"];

    const out = [];
    order.forEach((name) => {
      const list = byCat.get(name);
      if (list && list.length) {
        out.push({ name, modules: list });
        byCat.delete(name);
      }
    });

    // Any remaining categories
    for (const [name, list] of byCat.entries()) {
      out.push({ name, modules: list });
    }

    return out;
  }, [modulesForTrack, track]);

  const trackSubtitle =
    track === "Poetry"
      ? "Build a collection with craft, motif, and emotional arc."
      : track === "Nonfiction"
      ? "Structure your argument, strengthen clarity, and protect your voice."
      : "Build unforgettable characters and a powerful narrative arc.";

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)`,
      }}
    >
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/story-lab"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              ← Landing
            </Link>
            <span className="text-slate-300">|</span>
            <span className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Workshop Hub
            </span>
          </div>
          <QuickAccess />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div
          className="rounded-3xl p-10 mb-10 text-white text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 30%, ${BRAND.mauve} 70%, ${BRAND.rose} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: BRAND.rose, filter: "blur(100px)" }}
          />

          <div className="relative z-10">
            {/* Icon cluster */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.rose}50` }}
              >
                <Heart size={22} className="text-white" />
              </div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "#dc262650" }}
              >
                <Flame size={22} className="text-white" />
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
              >
                <Star size={28} className="text-white" />
              </div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.gold}50` }}
              >
                <Target size={22} className="text-white" />
              </div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.navy}70` }}
              >
                <Layers size={22} className="text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">Workshop Hub</h1>

            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              {trackSubtitle}
            </p>

            {/* Track pill */}
            <div className="mt-4 flex items-center justify-center">
              <span
                className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.22)",
                }}
              >
                Track: <span className="font-bold">{track}</span>
                {storyTitle ? (
                  <span className="font-normal text-white/80"> • {storyTitle}</span>
                ) : null}
              </span>
            </div>

            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/60 flex-wrap">
              <div className="flex items-center gap-2">
                <Heart size={14} style={{ color: BRAND.rose }} />
                <span>{track === "Fiction" ? "Characters" : "Craft"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-orange-400" />
                <span>{track === "Poetry" ? "Motif" : "Structure"}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: BRAND.gold }} />
                <span>{track === "Nonfiction" ? "Argument" : "Arc"}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-cyan-400" />
                <span>Dialogue</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={14} style={{ color: BRAND.mauve }} />
                <span>AI Tools</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-emerald-400" />
                <span>Community</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module Categories (dynamic by track) */}
        {categories.map((category) => (
          <div key={category.name} className="mb-10">
            <h2
              className="text-xl font-bold mb-5 flex items-center gap-3"
              style={{ color: BRAND.navy }}
            >
              <span>
                {category.name === "Character"
                  ? "Character Development"
                  : category.name === "Plot"
                  ? "Plot"
                  : category.name === "Structure"
                  ? "Structure"
                  : category.name}
              </span>
              <span className="text-sm font-normal text-slate-400">
                ({category.modules.length} tools)
              </span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ))}

        {/* Journey Flow (changes by track) */}
        <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-white/80">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Map size={18} style={{ color: BRAND.gold }} />
            Suggested Journey ({track})
          </h3>

          {track === "Fiction" ? (
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
              <Step n={1} color={BRAND.rose} label="Hopes • Fears • Legacy" />
              <Arrow />
              <Step n={2} color={BRAND.gold} label="Priority Cards" />
              <Arrow />
              <Step n={3} color="#dc2626" label="Plot Builder" />
              <Arrow />
              <Step n={4} color={BRAND.navy} label="Narrative Arc" />
              <Arrow />
              <Step n={5} color="#0891b2" label="Dialogue Lab" />
              <Arrow />
              <Step n={6} color="#6366f1" label="Clothesline" />
            </div>
          ) : track === "Poetry" ? (
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
              <Step n={1} color={BRAND.mauve} label="Writing Prompts" />
              <Arrow />
              <Step n={2} color={BRAND.rose} label="Forms & Craft Lab (Soon)" />
              <Arrow />
              <Step n={3} color="#6366f1" label="Line Break Clinic (Soon)" />
              <Arrow />
              <Step n={4} color={BRAND.gold} label="Collection Builder (Soon)" />
              <Arrow />
              <Step n={5} color="#0891b2" label="Dialogue Lab" />
            </div>
          ) : (
            <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
              <Step n={1} color={BRAND.gold} label="Argument & Evidence Map (Soon)" />
              <Arrow />
              <Step n={2} color={BRAND.navy} label="Nonfiction Blueprint (Soon)" />
              <Arrow />
              <Step n={3} color={BRAND.rose} label="Voice Guardrails (Soon)" />
              <Arrow />
              <Step n={4} color={BRAND.mauve} label="Writing Prompts" />
              <Arrow />
              <Step n={5} color="#0891b2" label="Dialogue Lab" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================
   Journey helpers
   ============================================ */
function Step({ n, color, label }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ background: color }}
      >
        {n}
      </span>
      <span className="text-slate-600">{label}</span>
    </div>
  );
}

function Arrow() {
  return <span className="text-slate-300">→</span>;
}
