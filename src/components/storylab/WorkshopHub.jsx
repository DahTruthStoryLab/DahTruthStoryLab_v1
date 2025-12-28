// src/components/storylab/WorkshopHub.jsx
// Workshop Hub - Central dashboard for all StoryLab modules

import React, { useState, useEffect } from "react";
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
  Zap,
  TrendingUp,
  MessageSquare,
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
   MODULE DEFINITIONS
   ============================================ */
const MODULES = [
  {
    id: "hfl",
    title: "Hopes • Fears • Legacy",
    description: "Define what drives your characters - their dreams, obstacles, and what they leave behind.",
    icon: Heart,
    path: "/story-lab/workshop/hfl",
    color: BRAND.rose,
    gradient: `linear-gradient(135deg, ${BRAND.roseDark} 0%, ${BRAND.rose} 100%)`,
    category: "Character",
  },
  {
    id: "priorities",
    title: "Priority Cards",
    description: "Track character wants, fears, needs, and secrets with AI-powered suggestions.",
    icon: Target,
    path: "/story-lab/workshop/priorities",
    color: BRAND.gold,
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    category: "Character",
  },
  {
    id: "roadmap",
    title: "Character Roadmap",
    description: "Plan character milestones and track their journey through your story.",
    icon: Map,
    path: "/story-lab/workshop/roadmap",
    color: "#7c3aed",
    gradient: "linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%)",
    category: "Character",
  },
  {
    id: "plot-builder",
    title: "Plot Builder",
    description: "Build your story's architecture - raise stakes, create obstacles, design turning points.",
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
    description: "Map your story's structure using classic frameworks like Save the Cat or Hero's Journey.",
    icon: TrendingUp,
    path: "/story-lab/narrative-arc",
    color: BRAND.navy,
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 100%)`,
    category: "Structure",
  },
  {
    id: "dialogue-lab",
    title: "Dialogue Lab",
    description: "Write, analyze, and enhance character dialogue with AI-powered feedback.",
    icon: MessageSquare,
    path: "/story-lab/dialogue-lab",
    color: "#0891b2",
    gradient: "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    category: "Writing",
    isNew: true,
  },
  {
    id: "clothesline",
    title: "Clothesline",
    description: "Visualize your complete story - scenes, chapters, and character threads.",
    icon: LayoutGrid,
    path: "/story-lab/workshop/clothesline",
    color: "#6366f1",
    gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
    category: "Structure",
  },
  {
    id: "prompts",
    title: "Story Prompts",
    description: "AI-powered writing prompts to spark creativity and overcome blocks.",
    icon: Sparkles,
    path: "/story-lab/prompts",
    color: BRAND.mauve,
    gradient: `linear-gradient(135deg, ${BRAND.mauve} 0%, #a78bfa 100%)`,
    category: "Writing",
  },
  {
    id: "community",
    title: "Workshop Community",
    description: "Connect with other writers - share work, give feedback, grow together.",
    icon: Users,
    path: "/story-lab/community",
    color: "#059669",
    gradient: "linear-gradient(135deg, #047857 0%, #059669 100%)",
    category: "Community",
  },
];

/* ============================================
   MODULE CARD
   ============================================ */
function ModuleCard({ module }) {
  const Icon = module.icon;
  
  return (
    <Link
      to={module.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ 
        background: "white",
        border: `1px solid ${module.color}20`,
      }}
    >
      {/* New Badge */}
      {module.isNew && (
        <div 
          className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white z-10"
          style={{ background: BRAND.gold }}
        >
          NEW
        </div>
      )}
      
      {/* Header with gradient */}
      <div 
        className="px-6 py-5"
        style={{ background: module.gradient }}
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <Icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">{module.title}</h3>
            <span className="text-xs text-white/70 uppercase tracking-wide">{module.category}</span>
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
            Open Module
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
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
  // Group modules by category
  const categories = [
    { name: "Character Development", modules: MODULES.filter(m => m.category === "Character") },
    { name: "Plot & Structure", modules: MODULES.filter(m => m.category === "Plot" || m.category === "Structure") },
    { name: "Writing & Community", modules: MODULES.filter(m => m.category === "Writing" || m.category === "Community") },
  ];

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)` }}>
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
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10" style={{ background: BRAND.gold, filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: BRAND.rose, filter: 'blur(100px)' }} />
          
          <div className="relative z-10">
            {/* Icon cluster */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.rose}50` }}>
                <Heart size={22} className="text-white" />
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: '#dc262650' }}>
                <Flame size={22} className="text-white" />
              </div>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                <Star size={28} className="text-white" />
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.gold}50` }}>
                <Target size={22} className="text-white" />
              </div>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${BRAND.navy}70` }}>
                <Layers size={22} className="text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-bold mb-3">
              Workshop Hub
            </h1>
            
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
              Your creative toolkit for building unforgettable stories. From character development to plot architecture - everything you need in one place.
            </p>
            
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/60 flex-wrap">
              <div className="flex items-center gap-2">
                <Heart size={14} style={{ color: BRAND.rose }} />
                <span>Characters</span>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-orange-400" />
                <span>Plot</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp size={14} style={{ color: BRAND.gold }} />
                <span>Structure</span>
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

        {/* Module Categories */}
        {categories.map((category) => (
          <div key={category.name} className="mb-10">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-3" style={{ color: BRAND.navy }}>
              <span>{category.name}</span>
              <span className="text-sm font-normal text-slate-400">({category.modules.length} tools)</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        ))}

        {/* Journey Flow */}
        <div className="mt-10 p-6 rounded-2xl border border-slate-200 bg-white/80">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Map size={18} style={{ color: BRAND.gold }} />
            Suggested Journey
          </h3>
          <div className="flex items-center justify-between flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: BRAND.rose }}>1</span>
              <span className="text-slate-600">Hopes • Fears • Legacy</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: BRAND.gold }}>2</span>
              <span className="text-slate-600">Priority Cards</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#dc2626" }}>3</span>
              <span className="text-slate-600">Plot Builder</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: BRAND.navy }}>4</span>
              <span className="text-slate-600">Narrative Arc</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#0891b2" }}>5</span>
              <span className="text-slate-600">Dialogue Lab</span>
            </div>
            <span className="text-slate-300">→</span>
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "#6366f1" }}>6</span>
              <span className="text-slate-600">Clothesline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

