// src/lib/storylab/StoryLabLanding.jsx
// StoryLab Modules — Gateway with genre-organized sidebar

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
  Users,
  MapPin,
  Home,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
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
   Sidebar Module Data
---------------------------- */
const FICTION_TOOLS = [
  { icon: Heart, label: "Hopes • Fears • Legacy", path: "/story-lab/workshop/hfl" },
  { icon: Target, label: "Priority Cards", path: "/story-lab/workshop/priorities" },
  { icon: MapPin, label: "Character Roadmap", path: "/story-lab/workshop/roadmap" },
  { icon: Layers, label: "Plot Builder", path: "/story-lab/plot-builder", isNew: true },
  { icon: TrendingUp, label: "Narrative Arc", path: "/story-lab/narrative-arc" },
  { icon: LayoutGrid, label: "Clothesline", path: "/story-lab/workshop/clothesline" },
  { icon: MessageSquare, label: "Dialogue Lab", path: "/story-lab/dialogue-lab", isNew: true },
];

const NONFICTION_TOOLS = [
  { icon: FileText, label: "Essay Builder", path: "/story-lab/nonfiction", comingSoon: true },
  { icon: BookOpen, label: "Memoir Scene Map", path: "/story-lab/nonfiction", comingSoon: true },
  { icon: Sparkles, label: "Research Notes", path: "/story-lab/nonfiction", comingSoon: true },
];

const POETRY_TOOLS = [
  { icon: Feather, label: "Craft Lab", path: "/story-lab/poetry", comingSoon: true },
  { icon: PenLine, label: "Revision Lab", path: "/story-lab/poetry", comingSoon: true },
  { icon: BookOpen, label: "Sequence Builder", path: "/story-lab/poetry", comingSoon: true },
];

const SHARED_TOOLS = [
  { icon: Sparkles, label: "Writing Prompts", path: "/story-lab/prompts" },
  { icon: Users, label: "Workshop Community", path: "/story-lab/community" },
];

/* ---------------------------
   Collapsible Sidebar Section
---------------------------- */
function SidebarSection({ title, icon: Icon, iconColor, tools, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-white/60 transition-colors"
      >
        <Icon size={16} style={{ color: iconColor }} />
        <span
          className="text-xs font-semibold uppercase tracking-[0.12em] flex-1"
          style={{ color: BRAND.ink }}
        >
          {title}
        </span>
        {open ? (
          <ChevronDown size={14} className="text-slate-400" />
        ) : (
          <ChevronRight size={14} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {tools.map((tool) => {
            const isActive = pathname === tool.path;
            return (
              <button
                key={tool.label}
                onClick={() => !tool.comingSoon && navigate(tool.path)}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-left transition-all
                  ${tool.comingSoon ? "opacity-50 cursor-default" : "hover:bg-white/70 cursor-pointer"}
                  ${isActive && !tool.comingSoon ? "bg-white/90 shadow-sm" : ""}
                `}
              >
                <tool.icon
                  size={14}
                  className={isActive ? "text-violet-500" : "text-slate-400"}
                />
                <span
                  className="text-xs font-medium flex-1"
                  style={{
                    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                    color: isActive ? BRAND.ink : "#6B7280",
                  }}
                >
                  {tool.label}
                </span>
                {tool.isNew && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#dc2626" }}
                  >
                    NEW
                  </span>
                )}
                {tool.comingSoon && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${BRAND.navy}15`, color: BRAND.navy }}
                  >
                    SOON
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------------------
   Pinned Sidebar
---------------------------- */
function StoryLabSidebar({ mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-md border border-amber-300/60">
              <img
                src="/assets/Story%20Lab_Transparent.jpeg"
                alt="DahTruth Story Lab"
                className="w-full h-full object-cover"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
            <div>
              <h1
                className="text-sm font-semibold tracking-wide"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: BRAND.navy,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                StoryLab
              </h1>
              <p
                className="text-[11px] text-slate-500"
                style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              >
                Modules
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {/* Home / Landing */}
        <button
          onClick={() => navigate("/story-lab")}
          className={`
            w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all
            ${pathname === "/story-lab" ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}
          `}
        >
          <Home
            size={17}
            className={pathname === "/story-lab" ? "text-violet-500" : "text-slate-500"}
          />
          <span
            className="text-xs font-medium"
            style={{
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              color: pathname === "/story-lab" ? BRAND.ink : "#374151",
            }}
          >
            All Modules
          </span>
        </button>

        <div className="my-2 border-t border-slate-200/80" />

        {/* Fiction Section */}
        <SidebarSection
          title="Fiction"
          icon={BookOpen}
          iconColor={BRAND.navy}
          tools={FICTION_TOOLS}
          defaultOpen={true}
        />

        {/* Nonfiction Section */}
        <SidebarSection
          title="Nonfiction"
          icon={FileText}
          iconColor={BRAND.gold}
          tools={NONFICTION_TOOLS}
          defaultOpen={false}
        />

        {/* Poetry Section */}
        <SidebarSection
          title="Poetry"
          icon={Feather}
          iconColor={BRAND.sage}
          tools={POETRY_TOOLS}
          defaultOpen={false}
        />

        <div className="my-2 border-t border-slate-200/80" />

        {/* Shared Tools */}
        {SHARED_TOOLS.map((tool) => {
          const isActive = pathname === tool.path;
          return (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all
                ${isActive ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}
              `}
            >
              <tool.icon
                size={17}
                className={isActive ? "text-violet-500" : "text-slate-500"}
              />
              <span
                className="text-xs font-medium"
                style={{
                  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                  color: isActive ? BRAND.ink : "#374151",
                }}
              >
                {tool.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 flex-shrink-0">
        <button
          onClick={() => navigate("/dashboard")}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`,
          }}
        >
          <Home size={16} />
          Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col"
        style={{
          background:
            "linear-gradient(160deg, rgba(249,245,255,0.96), rgba(234,224,252,0.98))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`
          fixed left-0 top-0 h-screen w-64 z-50 md:hidden
          transform transition-transform duration-300
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        style={{
          background:
            "linear-gradient(160deg, rgba(249,245,255,0.98), rgba(234,224,252,0.99))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
        }}
      >
        {sidebarContent}
      </div>
    </>
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
   Genre Cards for Gateway
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
    tools: ["Hopes • Fears • Legacy", "Priority Cards", "Plot Builder", "Narrative Arc", "Dialogue Lab", "Clothesline"],
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
    tools: ["Essay Builder", "Memoir Scene Map", "Research Notes"],
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
    tools: ["Craft Lab", "Revision Lab", "Sequence Builder"],
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
        className="px-6 py-7 relative overflow-hidden"
        style={{ background: genre.gradient }}
      >
        <div
          className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg backdrop-blur-sm">
            {genre.iconCustom ? (
              <LeafIcon size={28} color="white" />
            ) : (
              <genre.icon size={28} className="text-white" />
            )}
          </div>
          <div>
            <h3
              className="text-xl font-bold text-white"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              {genre.title}
            </h3>
            <p className="text-white/70 text-xs mt-1">{genre.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5">
        <p className="text-slate-600 text-sm leading-relaxed mb-4">
          {genre.description}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {genre.tools.slice(0, 4).map((tool) => (
            <span
              key={tool}
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: `${genre.accentColor}10`,
                color: genre.accentColor,
                border: `1px solid ${genre.accentColor}18`,
              }}
            >
              {tool}
            </span>
          ))}
          {genre.tools.length > 4 && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: `${genre.accentColor}10`,
                color: genre.accentColor,
              }}
            >
              +{genre.tools.length - 4} more
            </span>
          )}
        </div>

        <span
          className="text-sm font-semibold flex items-center gap-1.5 transition-all group-hover:gap-3"
          style={{ color: genre.accentColor }}
        >
          Open {genre.title} Workshop
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/* ---------------------------
   Mobile Header
---------------------------- */
function MobileHeader({ onMenuClick }) {
  return (
    <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/assets/Story%20Lab_Transparent.jpeg"
            alt="DahTruth"
            className="h-8 rounded-lg"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span
            className="font-semibold text-sm"
            style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            StoryLab Modules
          </span>
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------
   Main Component
---------------------------- */
export default function StoryLabLanding() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const story = useCurrentStory();

  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(180deg, ${BRAND.cream} 0%, #f1f5f9 100%)`,
      }}
    >
      {/* Sidebar */}
      <StoryLabSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <MobileHeader onMenuClick={() => setMobileOpen(true)} />

      {/* Main Content */}
      <main className="md:ml-56">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Hero */}
          <div
            className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 30%, ${BRAND.mauve} 70%, ${BRAND.rose} 100%)`,
            }}
          >
            <div
              className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: BRAND.gold, filter: "blur(80px)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
              style={{ background: BRAND.rose, filter: "blur(100px)" }}
            />

            <div className="relative z-10">
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
                className="text-3xl md:text-4xl font-bold text-white mb-3"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
              >
                StoryLab Modules
              </h1>
              <p className="text-white/80 max-w-xl mx-auto text-base md:text-lg mb-4">
                Choose your craft. Every genre has its own set of tools, exercises,
                and pathways built for the way you write.
              </p>

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

          {/* Shared Tools Section */}
          <div className="mb-8">
            <h2
              className="text-lg font-bold mb-4 flex items-center gap-2"
              style={{ color: BRAND.navy }}
            >
              Shared Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate("/story-lab/prompts")}
                className="group rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:scale-[1.01]"
                style={{
                  background: "white",
                  border: `1px solid ${BRAND.mauve}25`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `${BRAND.mauve}20` }}
                  >
                    <Sparkles size={24} style={{ color: BRAND.mauve }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                      Writing Prompts
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      AI-powered prompts to spark creativity and overcome blocks.
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors"
                  />
                </div>
              </button>

              <button
                onClick={() => navigate("/story-lab/community")}
                className="group rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:scale-[1.01]"
                style={{
                  background: "white",
                  border: `1px solid #05966925`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "#05966920" }}
                  >
                    <Users size={24} style={{ color: "#059669" }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                      Workshop Community
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Connect with writers — share work, give feedback, grow together.
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors"
                  />
                </div>
              </button>

              <button
                onClick={() => navigate("/story-lab/hub")}
                className="group rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:scale-[1.01]"
                style={{
                  background: "white",
                  border: `1px solid ${BRAND.navy}15`,
                }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${BRAND.mauve}30, ${BRAND.navy}20)`,
                    }}
                  >
                    <Layers size={24} style={{ color: BRAND.navy }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                      Workshop Hub
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cohort sessions, group breakouts, and collaboration tools.
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-slate-300 group-hover:text-slate-500 transition-colors"
                  />
                </div>
              </button>
            </div>
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
              <Home size={16} />
              Dashboard
            </button>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 py-6">
            <p
              className="italic"
              style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Where Every Story Finds Its Audience
            </p>
            <p className="mt-1">© {new Date().getFullYear()} DahTruth</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

