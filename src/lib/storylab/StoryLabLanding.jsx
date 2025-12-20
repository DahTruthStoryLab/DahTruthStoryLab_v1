// src/lib/storylab/StoryLabLanding.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map as MapIcon,
  Compass,
  Sparkles,
  BookOpen,
  PenLine,
  Target,
  Heart,
  LayoutGrid,
  Settings,
  Moon,
  Sun,
  Users,
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  BookOpenCheck,
  Home,
  Feather,
  ArrowRight,
  Play,
  Calendar,
} from "lucide-react";

/* ---------------------------
   Brand Colors
---------------------------- */
const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  mauve: "#b8a9c9",
  navyLight: "#2d4a6f",
  goldLight: "#e6c860",
};

const BASE = "/story-lab";

/* ---------------------------
   Story Journey Modules (The 4-Step Path)
---------------------------- */
const JOURNEY_STEPS = [
  {
    step: 1,
    id: "hopes",
    title: "Hopes • Fears • Legacy",
    blurb: "Who is your character at their core? What drives them?",
    icon: Heart,
    color: BRAND.mauve,
    route: `${BASE}/workshop/hfl`,
    weeks: "Weeks 1-2",
  },
  {
    step: 2,
    id: "priorities",
    title: "Priority Cards",
    blurb: "What 4-5 things MUST happen in their arc?",
    icon: Target,
    color: BRAND.gold,
    route: `${BASE}/workshop/priorities`,
    weeks: "Weeks 3-4",
  },
  {
    step: 3,
    id: "roadmap",
    title: "Character Roadmap",
    blurb: "Map milestones to chapters. Plan every scene.",
    icon: MapIcon,
    color: BRAND.navy,
    route: `${BASE}/workshop/roadmap`,
    weeks: "Weeks 5-6",
  },
  {
    step: 4,
    id: "clothesline",
    title: "Clothesline",
    blurb: "Visualize the full journey. See it all at a glance.",
    icon: LayoutGrid,
    color: "#6366f1",
    route: `${BASE}/workshop/clothesline`,
    weeks: "Weeks 7-8",
  },
];

/* ---------------------------
   Story Tools (Secondary)
---------------------------- */
const STORY_TOOLS = [
  {
    id: "narrative-arc",
    title: "Narrative Arc",
    blurb: "Map emotional beats and story structure.",
    icon: Sparkles,
    route: `${BASE}/narrative-arc`,
  },
  {
    id: "prompts",
    title: "Story Prompts",
    blurb: "Context-aware sparks for stuck scenes.",
    icon: Feather,
    route: `${BASE}/prompts`,
  },
  {
    id: "community",
    title: "Workshop Community",
    blurb: "Sessions, pairings, critique hub.",
    icon: Users,
    route: `${BASE}/community`,
  },
];

/* ---------------------------
   Compact Sidebar Nav Items
---------------------------- */
const NAV_ITEMS = [
  { to: `${BASE}`, icon: Home, label: "Landing" },
  { to: `${BASE}/workshop/hfl`, icon: Heart, label: "Hopes & Fears" },
  { to: `${BASE}/workshop/priorities`, icon: Target, label: "Priorities" },
  { to: `${BASE}/workshop/roadmap`, icon: MapIcon, label: "Roadmap" },
  { to: `${BASE}/workshop/clothesline`, icon: LayoutGrid, label: "Clothesline" },
  { divider: true },
  { to: `${BASE}/narrative-arc`, icon: Sparkles, label: "Narrative Arc" },
  { to: `${BASE}/prompts`, icon: Feather, label: "Prompts" },
  { to: `${BASE}/community`, icon: Users, label: "Community" },
];

/* ============ Load Current Story Data ============ */
function useCurrentStory() {
  const [story, setStory] = useState({
    title: "Untitled Story",
    wordCount: 0,
    chapterCount: 0,
    currentChapter: null,
    lastLine: "",
  });

  useEffect(() => {
    const load = () => {
      try {
        // Get story metadata
        const currentRaw = localStorage.getItem("currentStory");
        const current = currentRaw ? JSON.parse(currentRaw) : null;

        // Get chapters
        const chaptersRaw = localStorage.getItem("dahtruth-story-lab-toc-v3");
        const parsed = chaptersRaw ? JSON.parse(chaptersRaw) : null;
        const chapters = parsed?.chapters || [];

        // Calculate word count
        let totalWords = 0;
        chapters.forEach((ch) => {
          const text = ch?.content || ch?.text || ch?.body || "";
          const plainText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          totalWords += plainText.split(/\s+/).filter(Boolean).length;
        });

        // Get a random sentence from chapters
        const allText = chapters
          .map((c) => c?.content || c?.text || c?.body || "")
          .join(" ")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ");
        const sentences = allText.match(/[^.!?]+[.!?]/g) || [];
        const randomLine = sentences.length
          ? sentences[Math.floor(Math.random() * sentences.length)].trim()
          : "";

        // Get current/last chapter
        const lastChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

        setStory({
          title: current?.title || parsed?.book?.title || "Untitled Story",
          wordCount: totalWords,
          chapterCount: chapters.length,
          currentChapter: lastChapter,
          lastLine: randomLine,
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

  const refreshQuote = () => {
    try {
      const chaptersRaw = localStorage.getItem("dahtruth-story-lab-toc-v3");
      const parsed = chaptersRaw ? JSON.parse(chaptersRaw) : null;
      const chapters = parsed?.chapters || [];
      const allText = chapters
        .map((c) => c?.content || c?.text || c?.body || "")
        .join(" ")
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ");
      const sentences = allText.match(/[^.!?]+[.!?]/g) || [];
      const randomLine = sentences.length
        ? sentences[Math.floor(Math.random() * sentences.length)].trim()
        : "";
      setStory((prev) => ({ ...prev, lastLine: randomLine }));
    } catch {}
  };

  return { story, refreshQuote };
}

/* ============ Compact Icon Sidebar ============ */
function CompactSidebar() {
  const { pathname } = useLocation();
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      className={`hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r border-slate-200 bg-white/95 backdrop-blur-md transition-all duration-300 ${
        expanded ? "w-56" : "w-16"
      }`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <div className="flex items-center justify-center py-4 border-b border-slate-100">
        <img
          src="/DahTruthLogo.png"
          alt="DahTruth"
          className={`rounded-lg transition-all duration-300 ${expanded ? "h-12" : "h-8"}`}
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        {expanded && (
          <div className="ml-2 overflow-hidden">
            <div className="font-serif text-lg font-bold" style={{ color: BRAND.navy }}>
              DahTruth
            </div>
            <div className="text-xs text-slate-500">Story Lab</div>
          </div>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item, idx) =>
          item.divider ? (
            <div key={idx} className="my-3 border-t border-slate-100" />
          ) : (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                pathname === item.to
                  ? "bg-gradient-to-r from-slate-100 to-slate-50 shadow-sm"
                  : "hover:bg-slate-50"
              }`}
              style={{
                color: pathname === item.to ? BRAND.navy : "#64748b",
              }}
              title={!expanded ? item.label : undefined}
            >
              <item.icon
                size={20}
                style={{
                  color: pathname === item.to ? BRAND.gold : "#94a3b8",
                }}
              />
              {expanded && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          )
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-100">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-xl p-2.5 text-slate-500 hover:bg-slate-50 transition-all"
          title="Dashboard"
        >
          <Home size={20} />
          {expanded && <span className="text-sm">Dashboard</span>}
        </Link>
      </div>
    </aside>
  );
}

/* ============ Mobile Header & Sidebar ============ */
function MobileHeader({ onMenuClick }) {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth"
            className="h-8 rounded"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
          <span className="font-serif font-bold" style={{ color: BRAND.navy }}>
            Story Lab
          </span>
        </div>
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
      </div>
    </div>
  );
}

function MobileSidebar({ open, setOpen }) {
  const { pathname } = useLocation();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-white p-4"
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <img
                  src="/DahTruthLogo.png"
                  alt="DahTruth"
                  className="h-10 rounded"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <div>
                  <div className="font-serif font-bold" style={{ color: BRAND.navy }}>
                    DahTruth
                  </div>
                  <div className="text-xs text-slate-500">Story Lab</div>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="space-y-1">
              {NAV_ITEMS.map((item, idx) =>
                item.divider ? (
                  <div key={idx} className="my-3 border-t border-slate-100" />
                ) : (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                      pathname === item.to ? "bg-slate-100" : "hover:bg-slate-50"
                    }`}
                  >
                    <item.icon
                      size={20}
                      style={{ color: pathname === item.to ? BRAND.gold : "#94a3b8" }}
                    />
                    <span
                      className="font-medium"
                      style={{ color: pathname === item.to ? BRAND.navy : "#64748b" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                )
              )}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-white font-semibold"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
              >
                <Home size={18} />
                Back to Dashboard
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============ Story Banner ============ */
function StoryBanner({ story, onContinue }) {
  return (
    <div
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 40%, ${BRAND.mauve} 100%)`,
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-white/70 text-sm mb-1">Currently Working On</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {story.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-white/80">
              <span className="text-amber-300 font-semibold">{story.chapterCount}</span> Chapters
            </span>
            <span className="text-white/80">
              <span className="text-amber-300 font-semibold">{story.wordCount.toLocaleString()}</span> Words
            </span>
            {story.currentChapter && (
              <span className="text-white/80">
                Last: <span className="text-white">{story.currentChapter.title || "Untitled"}</span>
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)`,
            color: "#fff",
            boxShadow: `0 4px 15px ${BRAND.gold}50`,
          }}
        >
          <Play size={18} />
          Continue Writing
        </button>
      </div>
    </div>
  );
}

/* ============ Quote from Story ============ */
function StoryQuote({ line, onRefresh }) {
  if (!line) return null;

  return (
    <div
      className="rounded-xl p-4 mb-6 flex items-center justify-between"
      style={{
        background: "rgba(255, 255, 255, 0.8)",
        border: `1px solid ${BRAND.mauve}30`,
      }}
    >
      <p className="italic text-slate-600 flex-1">"{line}"</p>
      <button
        onClick={onRefresh}
        className="ml-4 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
      >
        Refresh
      </button>
    </div>
  );
}

/* ============ Story Journey Section ============ */
function StoryJourneySection({ navigate }) {
  return (
    <section className="mb-10">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: BRAND.navy }}>
          Your Character Development Path
        </h2>
        <p className="text-slate-500 mt-1">
          Follow the journey — each step builds on the last
        </p>
      </div>

      <div className="grid gap-4">
        {JOURNEY_STEPS.map((step, idx) => (
          <motion.button
            key={step.id}
            onClick={() => navigate(step.route)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all hover:shadow-lg"
            style={{
              background: "rgba(255, 255, 255, 0.9)",
              border: `1px solid ${step.color}25`,
            }}
          >
            {/* Step number */}
            <div
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{
                background: `${step.color}15`,
                color: step.color,
              }}
            >
              {step.step}
            </div>

            {/* Decorative gradient blob */}
            <div
              className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-30"
              style={{ background: step.color }}
            />

            <div className="relative flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${step.color}15` }}
              >
                <step.icon size={24} style={{ color: step.color }} />
              </div>

              <div className="flex-1 pr-12">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold" style={{ color: BRAND.navy }}>
                    {step.title}
                  </h3>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: `${step.color}15`, color: step.color }}
                  >
                    {step.weeks}
                  </span>
                </div>
                <p className="text-slate-500 text-sm">{step.blurb}</p>
              </div>

              <ChevronRight
                size={20}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all"
              />
            </div>

            {/* Connection line to next step */}
            {idx < JOURNEY_STEPS.length - 1 && (
              <div
                className="absolute left-10 -bottom-4 w-0.5 h-8 z-10"
                style={{ background: `${BRAND.navy}20` }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </section>
  );
}

/* ============ Story Tools Section ============ */
function StoryToolsSection({ navigate }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold" style={{ color: BRAND.navy }}>
          Story Tools
        </h2>
        <p className="text-slate-500 text-sm">Additional resources for your craft</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {STORY_TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(tool.route)}
            className="group rounded-xl p-4 text-left transition-all hover:shadow-md"
            style={{
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid rgba(30, 58, 95, 0.1)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: `${BRAND.navy}08` }}
              >
                <tool.icon size={20} style={{ color: BRAND.navy }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm" style={{ color: BRAND.navy }}>
                  {tool.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{tool.blurb}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ============ Workshop Info Card ============ */
function WorkshopInfoCard() {
  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: `linear-gradient(135deg, ${BRAND.gold}10 0%, ${BRAND.mauve}15 100%)`,
        border: `1px solid ${BRAND.gold}30`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${BRAND.gold}20` }}
        >
          <Calendar size={24} style={{ color: BRAND.gold }} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold" style={{ color: BRAND.navy }}>
            8-Week Character Workshop
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Follow the Story Journey over 8 weeks — 2 weeks per module. 
            Deep work, feedback sessions, and a complete character arc by the end.
          </p>
          <button
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium"
            style={{ color: BRAND.gold }}
          >
            Learn more <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ Dark Mode Toggle ============ */
function DarkModeToggle() {
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("theme-dark")
  );
  
  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
  }, [dark]);
  
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

/* ============ Main Page ============ */
export default function StoryLabLanding() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { story, refreshQuote } = useCurrentStory();

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <CompactSidebar />
      <MobileSidebar open={mobileOpen} setOpen={setMobileOpen} />
      <MobileHeader onMenuClick={() => setMobileOpen(true)} />

      {/* Main Content */}
      <main className="md:ml-16 transition-all duration-300">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
          {/* Top Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: BRAND.navy }}>
                Story Journey
              </h1>
              <p className="text-slate-500 text-sm">Where Every Story Finds Its Audience</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard"
                className="hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${BRAND.gold}, #B8960C)` }}
              >
                Dashboard
              </Link>
              <button
                onClick={() => navigate("/settings")}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Settings size={20} className="text-slate-500" />
              </button>
              <DarkModeToggle />
            </div>
          </div>

          {/* Story Banner */}
          <StoryBanner story={story} onContinue={() => navigate("/compose")} />

          {/* Quote from story */}
          <StoryQuote line={story.lastLine} onRefresh={refreshQuote} />

          {/* 8-Week Workshop Info */}
          <WorkshopInfoCard />

          {/* Story Journey - The Main Path */}
          <StoryJourneySection navigate={navigate} />

          {/* Story Tools */}
          <StoryToolsSection navigate={navigate} />

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 py-8">
            © {new Date().getFullYear()} DahTruth • Where Truth is Written
          </footer>
        </div>
      </main>
    </div>
  );
}
