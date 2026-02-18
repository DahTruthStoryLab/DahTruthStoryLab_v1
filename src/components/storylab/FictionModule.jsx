// src/components/storylab/FictionModule.jsx
// Fiction Workshop Hub — landing page for all fiction writing tools

import React from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  Target,
  Layers,
  LayoutGrid,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Users,
  ArrowRight,
  MapPin,
  Feather,
} from "lucide-react";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  roseDark: "#c97b7b",
  ink: "#0F172A",
  cream: "#fefdfb",
};

/* ---------------------------
   Fiction Modules
---------------------------- */
const CHARACTER_MODULES = [
  {
    id: "hfl",
    title: "Hopes • Fears • Legacy",
    description:
      "Define what drives your characters — their dreams, obstacles, and what they leave behind.",
    icon: Heart,
    path: "/story-lab/workshop/hfl",
    color: BRAND.rose,
    gradient: `linear-gradient(135deg, ${BRAND.roseDark} 0%, ${BRAND.rose} 100%)`,
  },
  {
    id: "priorities",
    title: "Priority Cards",
    description:
      "Track wants, fears, needs, and secrets with AI-powered suggestions.",
    icon: Target,
    path: "/story-lab/workshop/priorities",
    color: BRAND.gold,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
  },
  {
    id: "roadmap",
    title: "Character Roadmap",
    description:
      "Plan milestones and track the character journey through your story.",
    icon: MapPin,
    path: "/story-lab/workshop/roadmap",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
  },
];

const STRUCTURE_MODULES = [
  {
    id: "plot-builder",
    title: "Plot Builder",
    description:
      "Build story architecture — stakes, obstacles, turning points.",
    icon: Layers,
    path: "/story-lab/plot-builder",
    color: "#dc2626",
    gradient: "linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)",
    isNew: true,
  },
  {
    id: "narrative-arc",
    title: "Narrative Arc",
    description:
      "Map structure using classic frameworks (Save the Cat, Hero's Journey, etc.).",
    icon: TrendingUp,
    path: "/story-lab/narrative-arc",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
  },
  {
    id: "clothesline",
    title: "Clothesline",
    description:
      "Visualize your story — scenes, chapters, and character threads.",
    icon: LayoutGrid,
    path: "/story-lab/workshop/clothesline",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
  },
];

const WRITING_MODULES = [
  {
    id: "dialogue-lab",
    title: "Dialogue Lab",
    description:
      "Write, analyze, and enhance dialogue with AI-powered feedback.",
    icon: MessageSquare,
    path: "/story-lab/dialogue-lab",
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    isNew: true,
  },
  {
    id: "prompts",
    title: "Writing Prompts",
    description:
      "AI-powered prompts to spark creativity and overcome blocks.",
    icon: Sparkles,
    path: "/story-lab/prompts",
    color: BRAND.mauve,
    gradient: `linear-gradient(135deg, ${BRAND.mauve} 0%, #a78bfa 100%)`,
  },
  {
    id: "community",
    title: "Workshop Community",
    description:
      "Connect with other writers — share work, give feedback, grow together.",
    icon: Users,
    path: "/story-lab/community",
    color: "#059669",
    gradient: "linear-gradient(135deg, #047857 0%, #059669 100%)",
  },
];

/* ---------------------------
   Module Card
---------------------------- */
function ModuleCard({ mod }) {
  const Icon = mod.icon;
  return (
    <Link
      to={mod.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: "white",
        border: `1px solid ${mod.color}20`,
      }}
    >
      {/* NEW badge */}
      {mod.isNew && (
        <div
          className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white z-10"
          style={{ background: BRAND.gold }}
        >
          NEW
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5" style={{ background: mod.gradient }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{mod.title}</h3>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
          {mod.description}
        </p>
        <span
          className="text-sm font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
          style={{ color: mod.color }}
        >
          Open Module
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------
   Section Header
---------------------------- */
function SectionHeader({ title, count, color = BRAND.navy }) {
  return (
    <h2
      className="text-xl font-bold mb-5 flex items-center gap-3"
      style={{ color }}
    >
      <span>{title}</span>
      <span className="text-sm font-normal text-slate-400">
        ({count} tools)
      </span>
    </h2>
  );
}

/* ---------------------------
   Main Component
---------------------------- */
export default function FictionModule() {
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero Banner */}
        <div
          className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 30%, ${BRAND.navyLight} 60%, ${BRAND.mauve} 100%)`,
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(80px)" }}
          />
          <div
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
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
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`,
                }}
              >
                <Layers size={28} className="text-white" />
              </div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.navy}70` }}
              >
                <LayoutGrid size={22} className="text-white" />
              </div>
            </div>

            <h1
              className="text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Fiction Workshop
            </h1>
            <p className="text-white/80 max-w-xl mx-auto text-lg">
              Build unforgettable characters and a powerful narrative arc.
            </p>
          </div>
        </div>

        {/* Character Development */}
        <div className="mb-10">
          <SectionHeader title="Character Development" count={CHARACTER_MODULES.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CHARACTER_MODULES.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} />
            ))}
          </div>
        </div>

        {/* Structure & Plot */}
        <div className="mb-10">
          <SectionHeader title="Structure & Plot" count={STRUCTURE_MODULES.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {STRUCTURE_MODULES.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} />
            ))}
          </div>
        </div>

        {/* Writing & Community */}
        <div className="mb-10">
          <SectionHeader title="Writing & Community" count={WRITING_MODULES.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WRITING_MODULES.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} />
            ))}
          </div>
        </div>

        {/* Suggested Journey */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white/80 mb-8">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Feather size={18} style={{ color: BRAND.gold }} />
            Suggested Journey
          </h3>
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            {[
              { n: 1, label: "Hopes • Fears • Legacy", color: BRAND.rose },
              { n: 2, label: "Priority Cards", color: BRAND.gold },
              { n: 3, label: "Plot Builder", color: "#dc2626" },
              { n: 4, label: "Narrative Arc", color: BRAND.navy },
              { n: 5, label: "Dialogue Lab", color: "#0891b2" },
              { n: 6, label: "Clothesline", color: "#6366f1" },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: step.color }}
                >
                  {step.n}
                </span>
                <span className="text-slate-600">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Back to modules link */}
        <div className="text-center">
          <Link
            to="/story-lab"
            className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
            style={{ color: BRAND.navy }}
          >
            ← Back to StoryLab Modules
          </Link>
        </div>
      </div>
    </div>
  );
}

