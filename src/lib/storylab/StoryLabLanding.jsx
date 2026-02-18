// src/lib/storylab/StoryLabLanding.jsx
// StoryLab Modules — Gateway page for Fiction, Nonfiction, and Poetry workshops

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  FileText,
  Feather,
  ArrowRight,
  PenLine,
  Layers,
  Heart,
  Target,
  Sparkles,
  MessageSquare,
  LayoutGrid,
  TrendingUp,
} from "lucide-react";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  navyLight: "#2d4a6f",
  gold: "#d4af37",
  goldDark: "#b8960c",
  goldLight: "#f5e6b3",
  mauve: "#b8a9c9",
  rose: "#e8b4b8",
  roseDark: "#c97b7b",
  ink: "#0F172A",
  cream: "#fefdfb",
  sage: "#7C9A82",
  sageDark: "#5C7A62",
  sageLight: "#A8C5AE",
};

/* ---------------------------
   Leaf icon for Poetry
---------------------------- */
function LeafIcon({ size = 20, color = BRAND.sage }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20c4 0 8.68-3.31 12-12H17z" />
      <path d="M6 15l4-4" />
    </svg>
  );
}

/* ---------------------------
   Story context
---------------------------- */
function useCurrentStory() {
  const [story, setStory] = useState({ title: "", wordCount: 0, chapterCount: 0 });

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

        setStory({
          title: current?.title || parsed?.book?.title || "",
          wordCount: totalWords,
          chapterCount: chapters.length,
        });
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

/* ---------------------------
   Genre Card
---------------------------- */
const GENRES = [
  {
    id: "fiction",
    title: "Fiction",
    subtitle: "Characters, plot, scenes, conflict, pacing, dialogue",
    description:
      "Build unforgettable characters and powerful narrative arcs with tools designed for novelists and short story writers.",
    icon: BookOpen,
    path: "/story-lab/fiction",
    gradient: `linear-gradient(135deg, ${BRAND.ink} 0%, ${BRAND.navy} 40%, ${BRAND.navyLight} 100%)`,
    accentColor: BRAND.navy,
    tools: [
      { icon: Heart, label: "Hopes • Fears • Legacy" },
      { icon: Target, label: "Priority Cards" },
      { icon: Layers, label: "Plot Builder" },
      { icon: TrendingUp, label: "Narrative Arc" },
      { icon: MessageSquare, label: "Dialogue Lab" },
      { icon: LayoutGrid, label: "Clothesline" },
    ],
  },
  {
    id: "nonfiction",
    title: "Nonfiction",
    subtitle: "Thesis, structure, argument, evidence, clarity, transitions",
    description:
      "Structure your argument, strengthen clarity, and protect your voice with tools for essays, memoir, devotionals, and commentary.",
    icon: FileText,
    path: "/story-lab/nonfiction",
    gradient: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.gold} 50%, #e6c860 100%)`,
    accentColor: BRAND.gold,
    tools: [
      { icon: FileText, label: "Essay Builder" },
      { icon: BookOpen, label: "Memoir Scene Map" },
      { icon: Sparkles, label: "Research Notes" },
    ],
  },
  {
    id: "poetry",
    title: "Poetry",
    subtitle: "Imagery, sound, line breaks, form, rhythm, compression",
    description:
      "Craft, revise, and build your collection with tools designed for the way poets actually work.",
    iconCustom: true,
    path: "/story-lab/poetry",
    gradient: `linear-gradient(135deg, ${BRAND.sageDark} 0%, ${BRAND.sage} 50%, ${BRAND.sageLight} 100%)`,
    accentColor: BRAND.sage,
    tools: [
      { icon: Feather, label: "Craft Lab" },
      { icon: PenLine, label: "Revision Lab" },
      { icon: BookOpen, label: "Sequence Builder" },
    ],
  },
];

function GenreCard({ genre }) {
  return (
    <Link
      to={genre.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{
        background: "white",
        border: `1px solid ${genre.accentColor}20`,
      }}
    >
      {/* Header */}
      <div
        className="px-7 py-8 relative overflow-hidden"
        style={{ background: genre.gradient }}
      >
        {/* Decorative circle */}
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: "white" }}
        />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            {genre.iconCustom ? (
              <LeafIcon size={32} color="white" />
            ) : (
              <genre.icon size={32} className="text-white" />
            )}
          </div>
          <div>
            <h3
              className="text-2xl font-bold text-white"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {genre.title}
            </h3>
            <p className="text-white/70 text-sm mt-1">{genre.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-7 py-6">
        <p className="text-slate-600 text-sm leading-relaxed mb-5">
          {genre.description}
        </p>

        {/* Tool pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {genre.tools.map((tool) => (
            <span
              key={tool.label}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{
                background: `${genre.accentColor}10`,
                color: genre.accentColor,
                border: `1px solid ${genre.accentColor}20`,
              }}
            >
              <tool.icon size={12} />
              {tool.label}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between">
          <span
            className="text-sm font-semibold flex items-center gap-1.5 transition-all group-hover:gap-3"
            style={{ color: genre.accentColor }}
          >
            Open {genre.title} Workshop
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------------------------
   Main Component
---------------------------- */
export default function StoryLabLanding() {
  const navigate = useNavigate();
  const story = useCurrentStory();

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)`,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <div
          className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
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
            className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: BRAND.rose, filter: "blur(100px)" }}
          />

          <div className="relative z-10">
            {/* Icon cluster */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.navy}60` }}
              >
                <BookOpen size={22} className="text-white" />
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`,
                }}
              >
                <Sparkles size={28} className="text-white" />
              </div>
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: `${BRAND.sage}60` }}
              >
                <LeafIcon size={22} color="white" />
              </div>
            </div>

            <h1
              className="text-4xl font-bold text-white mb-3"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              StoryLab Modules
            </h1>
            <p className="text-white/80 max-w-xl mx-auto text-lg mb-4">
              Choose your craft. Every genre has its own set of tools, exercises,
              and pathways built for the way you write.
            </p>

            {/* Current project pill */}
            {story.title && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20">
                <span className="text-white/70 text-sm">Working on:</span>
                <span className="text-white text-sm font-semibold">
                  {story.title}
                </span>
                {story.wordCount > 0 && (
                  <span className="text-amber-300 text-sm">
                    • {story.wordCount.toLocaleString()} words
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Genre Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {GENRES.map((genre) => (
            <GenreCard key={genre.id} genre={genre} />
          ))}
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => navigate("/compose")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: `${BRAND.navy}10`,
              border: `1px solid ${BRAND.navy}20`,
              color: BRAND.navy,
            }}
          >
            <PenLine size={16} />
            Writer
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
            style={{
              background: `${BRAND.gold}15`,
              border: `1px solid ${BRAND.gold}25`,
              color: BRAND.goldDark,
            }}
          >
            <BookOpen size={16} />
            Dashboard
          </button>
        </div>

        {/* Footer tagline */}
        <div className="text-center pb-8">
          <p
            className="text-slate-400 text-sm italic"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Where Every Story Finds Its Audience
          </p>
        </div>
      </div>
    </div>
  );
}

