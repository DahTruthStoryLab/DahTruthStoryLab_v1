// src/pages/storylab/NonfictionLab.jsx
import React from "react";
import { Link } from "react-router-dom";
import {
  FileText, BookOpen, Search, Target, LayoutList,
  ArrowRight, Feather,
} from "lucide-react";

const BRAND = {
  gold: "#d4af37",
  goldDark: "#b8960c",
  goldLight: "#f5e6b3",
  amber: "#b45309",
  amberLight: "#fbbf24",
  brown: "#78350f",
  brownLight: "#92400e",
  cream: "#fffbeb",
  ink: "#0F172A",
};

const MODULES = [
  {
    id: "essay",
    title: "Essay Builder",
    description: "Thesis, claims, evidence, counterargument, conclusion. Build a rigorous argument from the ground up.",
    icon: FileText,
    path: "/story-lab/nonfiction/essay",
    gradient: `linear-gradient(135deg, ${BRAND.brown} 0%, ${BRAND.amber} 100%)`,
    color: BRAND.amber,
  },
  {
    id: "memoir",
    title: "Memoir Scene Map",
    description: "Scene goal, emotional turn, sensory detail, reflection. Map the moments that made you.",
    icon: BookOpen,
    path: "/story-lab/nonfiction/memoir",
    gradient: `linear-gradient(135deg, ${BRAND.brownLight} 0%, ${BRAND.amberLight} 100%)`,
    color: BRAND.brownLight,
  },
  {
    id: "research",
    title: "Research Notes",
    description: "Source, quote, paraphrase, your commentary. Keep your research organized and ready to use.",
    icon: Search,
    path: "/story-lab/nonfiction/research",
    gradient: `linear-gradient(135deg, #92400e 0%, #d97706 100%)`,
    color: "#d97706",
  },
  {
    id: "argument",
    title: "Argument & Thesis",
    description: "Sharpen your central claim, stress-test your argument, and anticipate counterarguments.",
    icon: Target,
    path: "/story-lab/nonfiction/argument",
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    color: BRAND.gold,
    isNew: true,
  },
  {
    id: "chapter",
    title: "Chapter Outliner",
    description: "Structure your nonfiction chapter by chapter — purpose, key points, transitions, and arc.",
    icon: LayoutList,
    path: "/story-lab/nonfiction/chapter",
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, #374151 100%)`,
    color: "#6b7280",
    isNew: true,
  },
];

function ModuleCard({ mod }) {
  const Icon = mod.icon;
  return (
    <Link
      to={mod.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "white", border: `1px solid ${mod.color}20` }}
    >
      {mod.isNew && (
        <div className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white z-10"
          style={{ background: BRAND.gold }}>
          NEW
        </div>
      )}
      <div className="px-6 py-5" style={{ background: mod.gradient }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Icon size={28} className="text-white" />
          </div>
          <h3 className="font-bold text-lg text-white" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            {mod.title}
          </h3>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{mod.description}</p>
        <span className="text-sm font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
          style={{ color: mod.color }}>
          Open Module <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

export default function NonfictionLab() {
  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #fef3c7 100%)` }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown} 0%, ${BRAND.amber} 40%, ${BRAND.gold} 80%, ${BRAND.amberLight} 100%)` }}>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: "#fff", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(100px)" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                <BookOpen size={22} className="text-white" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "rgba(255,255,255,0.25)" }}>
                <FileText size={28} className="text-white" />
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                <Feather size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              Nonfiction Workshop
            </h1>
            <p className="text-white/80 max-w-xl mx-auto text-lg">
              Structure your argument. Honor your story. Protect your voice.
            </p>
          </div>
        </div>

        {/* Module Cards */}
        <div className="mb-10">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: BRAND.brown }}>
            <span>Your Tools</span>
            <span className="text-sm font-normal text-slate-400">({MODULES.length} tools)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
          </div>
        </div>

        {/* Suggested Journey */}
        <div className="p-6 rounded-2xl border bg-white/80 mb-8" style={{ borderColor: `${BRAND.gold}30` }}>
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Feather size={18} style={{ color: BRAND.gold }} />
            Suggested Journey
          </h3>
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            {[
              { n: 1, label: "Argument & Thesis", color: BRAND.gold },
              { n: 2, label: "Chapter Outliner", color: "#6b7280" },
              { n: 3, label: "Essay Builder", color: BRAND.amber },
              { n: 4, label: "Research Notes", color: "#d97706" },
              { n: 5, label: "Memoir Scene Map", color: BRAND.brownLight },
            ].map((step, i) => (
              <div key={step.n} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-300">→</span>}
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: step.color }}>
                  {step.n}
                </span>
                <span className="text-slate-600">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <Link to="/story-lab" className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
            style={{ color: BRAND.brown }}>
            ← Back to StoryLab Modules
          </Link>
        </div>
      </div>
    </div>
  );
}

