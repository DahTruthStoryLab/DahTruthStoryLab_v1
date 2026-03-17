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
  PenTool,
  Wand2,
  Shuffle,
  Mic2,
  Search,
  LayoutList,
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
  ink: "#0F172A",
  cream: "#fefdfb",
  purple: "#4c1d95",
  purpleLight: "#7c3aed",
};

/* ---------------------------
   Sidebar Tool Data
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
  { icon: FileText, label: "Essay Builder", path: "/story-lab/nonfiction/essay" },
  { icon: BookOpen, label: "Memoir Scene Map", path: "/story-lab/nonfiction/memoir" },
  { icon: Search, label: "Research Notes", path: "/story-lab/nonfiction/research" },
  { icon: Target, label: "Argument & Thesis", path: "/story-lab/nonfiction/argument", isNew: true },
  { icon: LayoutList, label: "Chapter Outliner", path: "/story-lab/nonfiction/chapter", isNew: true },
];

const POETRY_TOOLS = [
  { icon: PenTool, label: "Craft Lab", path: "/story-lab/poetry/craft" },
  { icon: Wand2, label: "Revision Lab", path: "/story-lab/poetry/revision" },
  { icon: Layers, label: "Sequence Builder", path: "/story-lab/poetry/sequence" },
  { icon: Shuffle, label: "Remix Lab", path: "/story-lab/poetry/remix" },
  { icon: Mic2, label: "Voice & Identity", path: "/story-lab/poetry/voice" },
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
        <span className="text-xs font-semibold uppercase tracking-[0.12em] flex-1"
          style={{ color: BRAND.ink }}>
          {title}
        </span>
        {open
          ? <ChevronDown size={14} className="text-slate-400" />
          : <ChevronRight size={14} className="text-slate-400" />}
      </button>

      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {tools.map((tool) => {
            const isActive = pathname === tool.path;
            return (
              <button
                key={tool.label}
                onClick={() => navigate(tool.path)}
                className={`
                  w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-left transition-all
                  hover:bg-white/70 cursor-pointer
                  ${isActive ? "bg-white/90 shadow-sm" : ""}
                `}
              >
                <tool.icon size={14} className={isActive ? "text-violet-500" : "text-slate-400"} />
                <span
                  className="text-xs font-medium flex-1"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif", color: isActive ? BRAND.ink : "#6B7280" }}
                >
                  {tool.label}
                </span>
                {tool.isNew && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#dc2626" }}>
                    NEW
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
                style={{ fontFamily: "'EB Garamond', Georgia, serif", color: BRAND.navy, letterSpacing: "0.1em", textTransform: "uppercase" }}
              >
                StoryLab
              </h1>
              <p className="text-[11px] text-slate-500">StoryLab Modules</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-1">
        {/* Home */}
        <button
          onClick={() => navigate("/story-lab")}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all
            ${pathname === "/story-lab" ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
        >
          <Home size={17} className={pathname === "/story-lab" ? "text-violet-500" : "text-slate-500"} />
          <span className="text-xs font-medium"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", color: pathname === "/story-lab" ? BRAND.ink : "#374151" }}>
            All Modules
          </span>
        </button>

        <div className="my-2 border-t border-slate-200/80" />

        <SidebarSection title="Fiction" icon={BookOpen} iconColor={BRAND.navy} tools={FICTION_TOOLS} defaultOpen={true} />
        <SidebarSection title="Nonfiction" icon={FileText} iconColor={BRAND.goldDark} tools={NONFICTION_TOOLS} defaultOpen={true} />
        <SidebarSection title="Poetry" icon={Feather} iconColor={BRAND.purpleLight} tools={POETRY_TOOLS} defaultOpen={true} />

        <div className="my-2 border-t border-slate-200/80" />

        {SHARED_TOOLS.map((tool) => {
          const isActive = pathname === tool.path;
          return (
            <button
              key={tool.label}
              onClick={() => navigate(tool.path)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all
                ${isActive ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
            >
              <tool.icon size={17} className={isActive ? "text-violet-500" : "text-slate-500"} />
              <span className="text-xs font-medium"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", color: isActive ? BRAND.ink : "#374151" }}>
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
          className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
        >
          <Home size={16} />
          Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside
        className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col"
        style={{
          background: "linear-gradient(160deg, rgba(249,245,255,0.96), rgba(234,224,252,0.98))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div
        className={`fixed left-0 top-0 h-screen w-64 z-50 md:hidden transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        style={{
          background: "linear-gradient(160deg, rgba(249,245,255,0.98), rgba(234,224,252,0.99))",
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

/* ---------------------------
   Genre Cards
---------------------------- */
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
    tools: ["Hopes • Fears • Legacy", "Priority Cards", "Plot Builder", "Narrative Arc", "Dialogue Lab", "Clothesline"],
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
    tools: ["Essay Builder", "Memoir Scene Map", "Research Notes", "Argument & Thesis", "Chapter Outliner"],
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
    tools: ["Craft Lab", "Revision Lab", "Sequence Builder", "Remix Lab", "Voice & Identity"],
  },
];

function GenreCard({ genre }) {
  return (
    <Link
      to={genre.path}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      style={{ background: "white", border: `1px solid ${genre.accentColor}20` }}
    >
      <div className="px-6 py-7 relative overflow-hidden" style={{ background: genre.gradient }}>
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-10" style={{ background: "white" }} />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
            <genre.icon size={28} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              {genre.title}
            </h3>
            <p className="text-white/70 text-xs mt-1">{genre.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{genre.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {genre.tools.slice(0, 4).map((tool) => (
            <span key={tool} className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: `${genre.accentColor}10`, color: genre.accentColor, border: `1px solid ${genre.accentColor}18` }}>
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
          Open {genre.title} Workshop <ArrowRight size={16} />
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
          <img src="/assets/Story%20Lab_Transparent.jpeg" alt="DahTruth"
            className="h-8 rounded-lg" onError={(e) => (e.currentTarget.style.display = "none")} />
          <span className="font-semibold text-sm" style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
            StoryLab Modules
          </span>
        </div>
        <button onClick={onMenuClick} className="p-2 rounded-xl hover:bg-slate-100">
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

      <StoryLabSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <MobileHeader onMenuClick={() => setMobileOpen(true)} />

      <main className="relative z-10 md:ml-56">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">

          {/* ✅ FIX 2: Replaced glass-panel with hardcoded navy-to-rose gradient */}
          <div className="rounded-3xl p-10 mb-10 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 30%, #b8a9c9 70%, #e8b4b8 100%)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.15)"
            }}>
            <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
              style={{ background: BRAND.gold, filter: "blur(80px)" }} />
            <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full opacity-10"
              style={{ background: BRAND.rose, filter: "blur(100px)" }} />
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-6">
                {/* ✅ FIX 3: Replaced bg-primary/15 and text-primary with hardcoded values */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(30,58,95,0.5)" }}>
                  <BookOpen size={22} className="text-white" />
                </div>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}>
                  <Sparkles size={28} className="text-white" />
                </div>
                {/* ✅ FIX 4: Replaced bg-accent/15 and text-accent with hardcoded values */}
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(124,58,237,0.5)" }}>
                  <Feather size={22} className="text-white" />
                </div>
              </div>
              {/* ✅ FIX 5: Changed text color to white */}
              <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white"
                style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                StoryLab Modules
              </h1>
              {/* ✅ FIX 6: Changed text-ink/70 to text-white/80 */}
              <p className="text-white/80 max-w-xl mx-auto text-base md:text-lg mb-6 font-serif">
                Choose your craft. Every genre has its own set of tools, exercises, and pathways built for the way you write.
              </p>
              {story.title && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 border border-white/20">
                  <span className="text-white/70 text-sm">Working on:</span>
                  <span className="text-white text-sm font-semibold">{story.title}</span>
                  {story.wordCount > 0 && (
                    <span className="text-amber-300 text-sm">
                      • {story.wordCount.toLocaleString()} words
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => navigate("/compose")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-serif font-semibold text-sm transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})`, color: BRAND.ink }}>
                  <PenLine size={16} /> Start Writing
                </button>
                <button onClick={() => navigate("/dashboard")}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-serif font-medium text-sm border border-white/40 text-white bg-white/10 transition-all hover:bg-white/20">
                  <Home size={16} /> Dashboard
                </button>
              </div>
            </div>
          </div>

          {/* Genre Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            {GENRES.map((genre) => <GenreCard key={genre.id} genre={genre} />)}
          </div>

          {/* Shared Tools */}
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 font-serif" style={{ color: BRAND.navy, fontFamily: "'EB Garamond', Georgia, serif" }}>
              Shared Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Writing Prompts", desc: "AI-powered prompts to spark creativity and overcome blocks.", icon: Sparkles, color: BRAND.mauve, path: "/story-lab/prompts" },
                { label: "Workshop Community", desc: "Connect with writers — share work, give feedback, grow together.", icon: Users, color: "#059669", path: "/story-lab/community" },
                { label: "Workshop Hub", desc: "Cohort sessions, group breakouts, and collaboration tools.", icon: Layers, color: BRAND.navy, path: "/story-lab/hub" },
              ].map((tool) => (
                <button key={tool.label} onClick={() => navigate(tool.path)}
                  className="group bg-white rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:scale-[1.01] border border-slate-200">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${tool.color}15` }}>
                      <tool.icon size={24} style={{ color: tool.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm font-serif" style={{ color: BRAND.navy }}>{tool.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{tool.desc}</p>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-xs text-slate-400 py-6">
            <p className="italic font-serif" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
              Where Every Story Finds Its Audience
            </p>
            <p className="mt-1">© {new Date().getFullYear()} DahTruth</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
