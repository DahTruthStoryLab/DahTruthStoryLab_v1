// src/lib/storylab/StoryLabLanding.jsx
// StoryLab Modules — All modules on one page
// Internal sidebar removed — global AppSidebar handles all navigation
// Clicking "Story Lab Studio" in the global sidebar brings you here

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen, FileText, Feather, ArrowRight, PenLine,
  Layers, Heart, Target, Sparkles, MessageSquare,
  LayoutGrid, TrendingUp, Users, MapPin, Home,
  ChevronRight, PenTool, Wand2, Shuffle, Mic2,
  Search, LayoutList,
} from "lucide-react";

const BRAND = {
  navy:        "#1e3a5f",
  navyLight:   "#2d4a6f",
  gold:        "#d4af37",
  goldDark:    "#b8960c",
  mauve:       "#b8a9c9",
  rose:        "#e8b4b8",
  ink:         "#0F172A",
  purple:      "#4c1d95",
  purpleLight: "#7c3aed",
};

// ── Story context ─────────────────────────────
function useCurrentStory() {
  const [story, setStory] = useState({ title: "", wordCount: 0 });

  useEffect(() => {
    const load = () => {
      try {
        const currentRaw = localStorage.getItem("currentStory");
        const current = currentRaw ? JSON.parse(currentRaw) : null;
        const chaptersRaw = localStorage.getItem("dahtruth-story-lab-toc-v3");
        const parsed = chaptersRaw ? JSON.parse(chaptersRaw) : null;
        const chapters = parsed?.chapters || [];

        let totalWords = 0;
        chapters.forEach((ch) => {
          const text = ch?.content || ch?.text || ch?.body || "";
          const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          totalWords += plainText.split(/\s+/).filter(Boolean).length;
        });

        setStory({ title: current?.title || parsed?.book?.title || "", wordCount: totalWords });
      } catch (err) {
        console.error("Failed to load story data:", err);
      }
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("project:change", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("project:change", load);
    };
  }, []);

  return story;
}

// ── Genre card data ───────────────────────────
const GENRES = [
  {
    id: "fiction",
    title: "Fiction",
    subtitle: "Characters, plot, scenes, conflict, pacing, dialogue",
    description: "Build unforgettable characters and powerful narrative arcs with tools designed for novelists and short story writers.",
    icon: BookOpen,
    path: "/story-lab/fiction",
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 40%, ${BRAND.navyLight} 100%)`,
    accentColor: BRAND.navy,
    tools: [
      "Hopes • Fears • Legacy",
      "Priority Cards",
      "Plot Builder",
      "Narrative Arc",
      "Clothesline",
      "Character Roadmap",
    ],
  },
  {
    id: "nonfiction",
    title: "Nonfiction",
    subtitle: "Thesis, structure, argument, evidence, clarity, transitions",
    description: "Structure your argument, strengthen clarity, and protect your voice with tools for essays, memoir, devotionals, and commentary.",
    icon: FileText,
    path: "/story-lab/nonfiction",
    gradient: `linear-gradient(135deg, #78350f 0%, ${BRAND.goldDark} 50%, ${BRAND.gold} 100%)`,
    accentColor: BRAND.goldDark,
    tools: [
      "Essay Builder",
      "Memoir Scene Map",
      "Research Notes",
      "Argument & Thesis",
      "Chapter Outliner",
    ],
  },
  {
    id: "poetry",
    title: "Poetry",
    subtitle: "Imagery, sound, line breaks, form, rhythm, compression",
    description: "Craft, revise, and build your collection with tools designed for the way poets actually work.",
    icon: Feather,
    path: "/story-lab/poetry",
    gradient: `linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.purpleLight} 60%, #a78bfa 100%)`,
    accentColor: BRAND.purpleLight,
    tools: [
      "Craft Lab",
      "Revision Lab",
      "Sequence Builder",
      "Remix Lab",
      "Voice & Identity",
      "AI Poetry Prompts",
    ],
  },
];

// ── Genre card ────────────────────────────────
function GenreCard({ genre }) {
  return (
    <Link
      to={genre.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "white", border: `1px solid ${genre.accentColor}20` }}
    >
      {/* Header */}
      <div className="px-6 py-7 relative overflow-hidden" style={{ background: genre.gradient }}>
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <genre.icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              {genre.title}
            </h3>
            <p className="text-white/70 text-xs mt-1">{genre.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{genre.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {genre.tools.slice(0, 4).map((tool) => (
            <span key={tool} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: `${genre.accentColor}10`,
                color: genre.accentColor,
                border: `1px solid ${genre.accentColor}18`,
              }}>
              {tool}
            </span>
          ))}
          {genre.tools.length > 4 && (
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${genre.accentColor}10`, color: genre.accentColor }}>
              +{genre.tools.length - 4} more
            </span>
          )}
        </div>
        <span className="text-sm font-semibold flex items-center gap-1.5 transition-all group-hover:gap-3"
          style={{ color: genre.accentColor }}>
          Open {genre.title} Studio <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────
export default function StoryLabLanding() {
  const navigate = useNavigate();
  const story = useCurrentStory();

  return (
    <div className="min-h-screen relative overflow-hidden"
      style={{ background: "radial-gradient(circle at top left, #fefdfb 0%, #f1f5f9 40%, #ede9fe 100%)" }}>

      {/* Decorative blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full mix-blend-multiply blur-xl animate-pulse"
          style={{ background: "#b8a9c9" }} />
        <div className="absolute top-40 right-10 w-72 h-72 rounded-full mix-blend-multiply blur-xl animate-pulse"
          style={{ background: "#1e3a5f" }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 rounded-full mix-blend-multiply blur-xl animate-pulse"
          style={{ background: `${BRAND.gold}99` }} />
      </div>

      {/* ── No internal sidebar — AppSidebar handles all navigation ── */}

      <main className="relative z-10">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

          {/* Hero banner */}
          <div className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 30%, #b8a9c9 70%, #e8b4b8 100%)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.15)",
            }}>
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: BRAND.gold, filter: "blur(80px)" }} />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
              style={{ background: BRAND.rose, filter: "blur(100px)" }} />

            <div className="relative z-10">
              {/* Icon cluster */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(30,58,95,0.5)" }}>
                  <BookOpen size={22} className="text-white" />
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                  <Sparkles size={28} className="text-white" />
                </div>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.5)" }}>
                  <Feather size={22} className="text-white" />
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                Story Lab Studio
              </h1>
              <p className="text-white/80 max-w-xl mx-auto text-base md:text-lg mb-6 font-serif">
                Choose your craft. Every genre has its own set of tools, exercises, and pathways built for the way you write.
              </p>

              {/* Current project badge */}
              {story.title && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20 mb-6">
                  <span className="text-white/70 text-sm">Working on:</span>
                  <span className="text-white text-sm font-semibold">{story.title}</span>
                  {story.wordCount > 0 && (
                    <span className="text-amber-300 text-sm">
                      · {story.wordCount.toLocaleString()} words
                    </span>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <button onClick={() => navigate("/writer")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`,
                    color: BRAND.ink,
                  }}>
                  <PenLine size={16} /> Start Writing
                </button>
                <button onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm border border-white/40 text-white bg-white/10 transition-all hover:bg-white/20"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                  <Home size={16} /> Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* ── Genre cards ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {GENRES.map((genre) => <GenreCard key={genre.id} genre={genre} />)}
          </div>

          {/* ── Workshop Hub tools ── */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4"
              style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Workshop Hub
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "Dialogue Lab",
                  desc: "Practice and sharpen the way your characters speak.",
                  icon: MessageSquare,
                  color: BRAND.navy,
                  path: "/story-lab/dialogue-lab",
                },
                {
                  label: "Writing Prompts",
                  desc: "AI-powered prompts to spark creativity and overcome blocks.",
                  icon: Sparkles,
                  color: BRAND.mauve,
                  path: "/story-lab/prompts",
                },
                {
                  label: "Workshop Community",
                  desc: "Connect with writers — share work, give feedback, grow together.",
                  icon: Users,
                  color: "#059669",
                  path: "/story-lab/community",
                },
                {
                  label: "Calendar",
                  desc: "Plan your writing schedule and track workshop sessions.",
                  icon: LayoutGrid,
                  color: BRAND.goldDark,
                  path: "/calendar",
                },
                {
                  label: "Export",
                  desc: "Export your manuscript in multiple formats.",
                  icon: TrendingUp,
                  color: "#6366f1",
                  path: "/export",
                },
                {
                  label: "Publish",
                  desc: "Prepare and publish your finished work.",
                  icon: Layers,
                  color: BRAND.purpleLight,
                  path: "/publishing",
                },
              ].map((tool) => (
                <button key={tool.label} onClick={() => navigate(tool.path)}
                  className="group bg-white rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:scale-[1.01] border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: `${tool.color}15` }}>
                      <tool.icon size={24} style={{ color: tool.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm"
                        style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
                        {tool.label}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 py-6">
            <p className="italic" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              Where Every Story Finds Its Audience
            </p>
            <p className="mt-1">© {new Date().getFullYear()} DahTruth</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
