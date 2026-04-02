// src/components/storylab/WorkshopHub.jsx
// Workshop Hub — Community and collaboration tools
// Shows: Dialogue Lab, Writing Prompts, Workshop Community, Calendar

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Sparkles,
  Users,
  Calendar,
  ArrowRight,
  BookOpen,
  PenLine,
} from "lucide-react";

const BRAND = {
  navy:      "#1e3a5f",
  navyLight: "#2d4a6f",
  gold:      "#d4af37",
  goldDark:  "#b8960c",
  mauve:     "#b8a9c9",
  rose:      "#e8b4b8",
  ink:       "#0F172A",
};

// ── The four Workshop Hub modules ─────────────
const HUB_MODULES = [
  {
    id:          "dialogue-lab",
    title:       "Dialogue Lab",
    description: "Write, analyze, and enhance dialogue with AI-powered feedback. Practice the way your characters speak.",
    icon:        MessageSquare,
    path:        "/story-lab/dialogue-lab",
    color:       "#0891b2",
    gradient:    "linear-gradient(135deg, #0e7490 0%, #0891b2 50%, #06b6d4 100%)",
    category:    "Writing",
    isNew:       true,
  },
  {
    id:          "prompts",
    title:       "Writing Prompts",
    description: "AI-powered prompts to spark creativity, break through blocks, and discover new directions for your work.",
    icon:        Sparkles,
    path:        "/story-lab/prompts",
    color:       BRAND.mauve,
    gradient:    `linear-gradient(135deg, #9b87c0 0%, #a78bfa 100%)`,
    category:    "Writing",
  },
  {
    id:          "community",
    title:       "Workshop Community",
    description: "Connect with other writers — share your work, give feedback, receive encouragement, and grow together.",
    icon:        Users,
    path:        "/story-lab/community",
    color:       "#059669",
    gradient:    "linear-gradient(135deg, #047857 0%, #059669 100%)",
    category:    "Community",
  },
  {
    id:          "calendar",
    title:       "Calendar",
    description: "Plan your writing schedule, track workshop sessions, and stay accountable to your creative goals.",
    icon:        Calendar,
    path:        "/calendar",
    color:       BRAND.goldDark,
    gradient:    `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 100%)`,
    category:    "Planning",
  },
];

// ── Module card ────────────────────────────────
function ModuleCard({ module }) {
  const Icon = module.icon;
  return (
    <Link
      to={module.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "white", border: `1px solid ${module.color}20` }}
    >
      {module.isNew && (
        <div className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full text-white z-10"
          style={{ background: BRAND.gold }}>
          NEW
        </div>
      )}

      {/* Gradient header */}
      <div className="px-6 py-5" style={{ background: module.gradient }}>
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

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-sm text-slate-600 mb-4 leading-relaxed">{module.description}</p>
        <span className="text-sm font-semibold flex items-center gap-1 transition-all group-hover:gap-2"
          style={{ color: module.color }}>
          Open Module <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

// ── Main component ─────────────────────────────
export default function WorkshopHub() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen"
      style={{ background: "radial-gradient(circle at top left, #fefdfb 0%, #f1f5f9 40%, #ede9fe 100%)" }}>

      {/* ── Hero banner ── */}
      <div className="rounded-3xl p-10 mb-10 text-white text-center relative overflow-hidden mx-4 mt-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 30%, ${BRAND.mauve} 70%, ${BRAND.rose} 100%)` }}>
        <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: BRAND.gold, filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: BRAND.rose, filter: "blur(100px)" }} />

        <div className="relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(8,145,178,0.5)" }}>
              <MessageSquare size={22} className="text-white" />
            </div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
              <Users size={28} className="text-white" />
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(5,150,105,0.5)" }}>
              <Sparkles size={22} className="text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Workshop Hub
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Your writing community. Practice your craft, find inspiration, connect with writers, and plan your creative journey.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate("/writer")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`, color: BRAND.ink,
                fontFamily: "'EB Garamond', Georgia, serif" }}>
              <PenLine size={16} /> Start Writing
            </button>
            <button onClick={() => navigate("/story-lab")}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm border border-white/40 text-white bg-white/10 transition-all hover:bg-white/20"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              <BookOpen size={16} /> All Modules
            </button>
          </div>
        </div>
      </div>

      {/* ── Module grid ── */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-bold mb-6"
          style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
          Hub Tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {HUB_MODULES.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-8">
          <p className="italic" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
            Where Every Story Finds Its Audience
          </p>
          <p className="mt-1">© {new Date().getFullYear()} DahTruth</p>
        </footer>
      </div>
    </div>
  );
}
