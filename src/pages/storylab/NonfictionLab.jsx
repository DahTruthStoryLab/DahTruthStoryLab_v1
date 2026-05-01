// src/pages/storylab/NonfictionLab.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FileText,
  BookOpen,
  Search,
  Target,
  LayoutList,
  Feather,
  Sparkles,
  ArrowRight,
  Download,
} from "lucide-react";

const BRAND = {
  navy:     "#1e3a5f",
  navyLight:"#2d4a6f",
  gold:     "#d4af37",
  goldDark: "#b8960c",
  mauve:    "#b8a9c9",
  rose:     "#e8b4b8",
  roseDark: "#c97b7b",
  brown:    "#78350f",
  amber:    "#b45309",
  ink:      "#0F172A",
  cream:    "#fefdfb",
};

const WRITING_MODULES = [
  {
    id: "essay",
    title: "Essay Builder",
    description: "Thesis, claims, evidence, counterargument, conclusion. AI analyzes your draft and gives specific structural feedback.",
    icon: FileText,
    path: "essay",
    color: BRAND.amber,
    gradient: `linear-gradient(135deg, ${BRAND.brown} 0%, ${BRAND.amber} 100%)`,
  },
  {
    id: "memoir",
    title: "Memoir Scene Map",
    description: "Scene goal, emotional turn, sensory detail, reflection. Map and deepen your memoir scenes with AI feedback.",
    icon: BookOpen,
    path: "memoir",
    color: "#d97706",
    gradient: `linear-gradient(135deg, #92400e 0%, #fbbf24 100%)`,
  },
  {
    id: "research",
    title: "Research Notes",
    description: "Source, quote, paraphrase, your commentary. Synthesize your research into a coherent argument.",
    icon: Search,
    path: "research",
    color: "#b45309",
    gradient: `linear-gradient(135deg, #92400e 0%, #d97706 100%)`,
  },
  {
    id: "argument",
    title: "Argument & Thesis",
    description: "Sharpen your thesis, stress test your argument, generate counterarguments, and raise the stakes.",
    icon: Target,
    path: "argument",
    color: BRAND.goldDark,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
  },
  {
    id: "chapter",
    title: "Chapter Outliner",
    description: "Plan chapter purpose, key points, and transitions. Get AI feedback on your book's arc and structure.",
    icon: LayoutList,
    path: "chapter",
    color: "#374151",
    gradient: "linear-gradient(135deg, #374151 0%, #6b7280 100%)",
  },
];

const TOOLS_MODULES = [
  {
    id: "prompts",
    title: "Writing Prompts",
    description: "AI-powered prompts tailored for nonfiction writers — essays, memoir, devotionals, and more.",
    icon: Sparkles,
    path: "/story-lab/prompts",
    color: BRAND.mauve,
    gradient: `linear-gradient(135deg, ${BRAND.mauve} 0%, #a78bfa 100%)`,
    external: true,
  },
  {
    id: "publish",
    title: "Export & Publish",
    description: "Format your manuscript for print or digital publishing — KDP-ready layouts.",
    icon: Download,
    path: "/publishing",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
    external: true,
  },
];

function ModuleCard({ mod, projectId }) {
  const Icon = mod.icon;
  // Build path — internal paths get projectId appended
  const to = mod.external
    ? mod.path
    : projectId
      ? `/story-lab/nonfiction/${mod.path}?projectId=${projectId}`
      : `/story-lab/nonfiction/${mod.path}`;

  return (
    <Link to={to}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "white", border: `1px solid ${mod.color}20` }}>
      <div className="px-6 py-5" style={{ background: mod.gradient }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Icon size={28} className="text-white" />
          </div>
          <h3 className="font-bold text-lg text-white">{mod.title}</h3>
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

function SectionHeader({ title, count }) {
  return (
    <h2 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: BRAND.navy }}>
      <span>{title}</span>
      <span className="text-sm font-normal text-slate-400">({count} tools)</span>
    </h2>
  );
}

export default function NonfictionLab() {
  const { search } = useLocation();
  const projectId = new URLSearchParams(search).get("projectId") || 
    localStorage.getItem("dahtruth-current-project-id") || "";

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Hero Banner */}
        <div className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown} 0%, ${BRAND.amber} 40%, ${BRAND.gold} 80%, ${BRAND.goldDark} 100%)` }}>
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: BRAND.navy, filter: "blur(80px)" }} />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: BRAND.gold, filter: "blur(100px)" }} />
          <div className="relative z-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <FileText size={22} className="text-white" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "rgba(255,255,255,0.25)" }}>
                <Feather size={28} className="text-white" />
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.2)" }}>
                <Target size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              Nonfiction Workshop
            </h1>
            <p className="text-white/90 max-w-xl mx-auto text-lg">
              Essays, memoir, devotionals, history, and commentary. Build arguments that land and stories that endure.
            </p>
            {projectId && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm text-white/80"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <FileText size={13} />
                Working on: {localStorage.getItem("currentStory") ? JSON.parse(localStorage.getItem("currentStory") || "{}").title || "Your Project" : "Your Project"}
              </div>
            )}
          </div>
        </div>

        {/* Writing Modules */}
        <div className="mb-10">
          <SectionHeader title="Writing Tools" count={WRITING_MODULES.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WRITING_MODULES.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} projectId={projectId} />
            ))}
          </div>
        </div>

        {/* AI & Publishing */}
        <div className="mb-10">
          <SectionHeader title="AI Tools & Publishing" count={TOOLS_MODULES.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {TOOLS_MODULES.map((mod) => (
              <ModuleCard key={mod.id} mod={mod} projectId={projectId} />
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
              { n: 1, label: "Argument & Thesis",  color: BRAND.goldDark },
              { n: 2, label: "Chapter Outliner",   color: "#374151" },
              { n: 3, label: "Research Notes",     color: BRAND.amber },
              { n: 4, label: "Essay Builder",      color: BRAND.brown },
              { n: 5, label: "Memoir Scene Map",   color: "#d97706" },
              { n: 6, label: "Export & Publish",   color: BRAND.navy },
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
          <Link to="/story-lab"
            className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all"
            style={{ color: BRAND.navy }}>
            ← Back to StoryLab Modules
          </Link>
        </div>
      </div>
    </div>
  );
}
