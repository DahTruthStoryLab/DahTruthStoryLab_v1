// src/lib/storylab/StoryLab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Users, Pin, Sparkles, Calendar, Clock, ChevronRight, Plus,
  Layers, Edit3, Trash2, Globe, Heart, Star, CheckCircle, FileText,
  MessageSquare, User, Menu as MenuIcon
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";

/* -----------------------------
   Helpers: load chapters safely
--------------------------------*/
function loadChaptersFromLocalStorage() {
  const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    const list = parsed?.chapters ?? [];
    return list.map((c, idx) => ({
      id: c?.id ?? idx,
      title: c?.title ?? `Chapter ${idx + 1}`,
      text: c?.text ?? c?.content ?? c?.body ?? "",
    }));
  } catch {
    return [];
  }
}

/* -----------------------------
   Tiny, client-only "NLP-lite"
--------------------------------*/
const splitSentences = (txt) =>
  (txt || "").replace(/\s+/g, " ").match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens = (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach((t) => {
    if (!["I", "The", "A", "And", "But"].includes(t)) names.add(t.trim());
  });
  return Array.from(names).slice(0, 50);
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}

/* =========================================================
   AERO SIDEBAR (glassmorphism; brand serif heading)
========================================================= */
function AeroSidebar({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
  onCloseMobile,
  showMobile
}) {
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem("storylab_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  // Ordered by modules as requested
  const itemsTop = [
    { key: "back", label: "Back to Dashboard", to: "/dashboard", icon: ArrowLeft, type: "link", accent: true },
    { key: "home", label: "Story Lab Home", to: "/story-lab", icon: BookOpen, type: "link" },

    // Sessions overview & modules
    { key: "prompts-link", label: "Story Prompts", to: "/story-lab/prompts", icon: Sparkles, type: "link" },
    { key: "characters-consistency", label: "Character Consistency", icon: CheckCircle, type: "section", section: "overview" },
    { key: "grammar", label: "Grammar Polish", icon: Edit3, type: "section", section: "overview" },
    { key: "summaries", label: "Scene Summaries", icon: FileText, type: "section", section: "overview" },

    // Story & Character
    { key: "profiles", label: "Character Profiles", icon: User, type: "section", section: "story" },
    { key: "clothesline", label: "Character Clothesline", icon: Pin, type: "section", section: "community" },
    { key: "world", label: "World Bible", icon: Globe, type: "section", section: "story" },
    { key: "hfl", label: "Hopes • Fears • Legacy", icon: Heart, type: "section", section: "story" },

    // Workshop Community
    { key: "schedule", label: "Session Schedule", icon: Calendar, type: "section", section: "community" },
    { key: "breakouts", label: "Breakout Pairings", icon: Users, type: "section", section: "community" },
    { key: "critique", label: "Critique Circle", to: "/story-lab/critique", icon: MessageSquare, type: "link", accent: true },

    // Faith (last)
    { key: "reflection", label: "Reflection Prompts", icon: Heart, type: "section", section: "faith" },
    { key: "legacy", label: "Legacy Writing", icon: Star, type: "section", section: "faith" },
  ];

  const isActiveRoute = (to) => location.pathname === to;
  const isActiveSection = (key) => activeSection === key;

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity ${showMobile ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside
        className={[
          "fixed z-50 left-0 top-0 h-screen",
          "backdrop-blur-md bg-white/60 border-r border-white/60",
          "shadow-[0_12px_48px_-10px_rgba(16,24,40,0.25)]",
          "transition-all duration-300 ease-out",
          showMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-20" : "w-72",
          "overflow-hidden"
        ].join(" ")}
        aria-label="StoryLab sidebar"
      >
        {/* Brand row at top */}
        <div className="flex items-center gap-3 px-3 pt-3 pb-2">
          <BrandLogo className={`${collapsed ? "h-7" : "h-8"} w-auto`} />
          {!collapsed && (
            <div className="leading-tight">
              <div className="text-ink font-serif font-bold text-lg">DahTruth</div>
              <div className="text-[11px] text-ink/70 -mt-0.5 font-serif">Story Lab</div>
            </div>
          )}
        </div>

        {/* Collapse (desktop) */}
        <div className="hidden md:flex items-center justify-end p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 bg-white/60 hover:bg-white/70 border border-white/60 text-ink"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>

        {/* Menu */}
        <nav className="px-2 pb-3 overflow-y-auto h-[calc(100%-4.25rem)]">
          <div className="mt-2 space-y-1">
            {itemsTop.map((it) => {
              const Icon = it.icon;
              const active =
                (it.type === "link" && isActiveRoute(it.to)) ||
                (it.type === "section" && isActiveSection(it.section));

              const base =
                "group relative flex items-center gap-3 w-full rounded-xl px-3 py-2 transition-all outline-none focus:ring-2 focus:ring-blue-400/60 hover:translate-x-0.5 hover:scale-[1.01]";
              const activeCls = it.accent
                ? "bg-accent/30 text-ink border border-white/60 shadow"
                : "bg-white/80 text-ink border border-white/60 shadow";
              const inactive = "text-ink bg-white/40 border border-transparent";

              const inner = (
                <>
                  <span className="absolute inset-0 rounded-xl bg-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Icon className={`w-5 h-5 relative z-10 ${active ? "opacity-100" : "opacity-90"}`} />
                  {!collapsed && <span className="truncate relative z-10 font-medium">{it.label}</span>}
                </>
              );

              return it.type === "link" ? (
                <Link
                  key={it.key}
                  to={it.to}
                  className={`${base} ${active ? activeCls : inactive}`}
                  title={collapsed ? it.label : undefined}
                  onClick={onCloseMobile}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={it.key}
                  onClick={() => {
                    setActiveSection(it.section);
                    onCloseMobile?.();
                  }}
                  className={`${base} ${active ? activeCls : inactive}`}
                  title={collapsed ? it.label : undefined}
                >
                  {inner}
                </button>
              );
            })}
          </div>

          <div className="my-4 border-t border-white/60" />
          {!collapsed && (
            <div className="px-3">
              <p className="text-[11px] leading-4 text-ink/70 font-serif">
                • Translucent “Aero” menu • Hover glow • Light brand palette
              </p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

/* =========================================================
   FEATURE CARDS (brand glass)
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusColors = {
    Ready: "bg-emerald-500/15 text-ink border-emerald-300/40",
    Beta: "bg-blue-500/15 text-ink border-blue-300/40",
    "Coming Soon": "bg-slate-400/20 text-ink border-slate-300/50",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/80 transition-colors shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/60 rounded-xl border border-white/60">
            <Icon className="w-6 h-6 text-ink/80" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
            {status && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-ink/60 mt-1" />
      </div>
      <p className="text-ink/80 text-sm leading-relaxed">{description}</p>
    </button>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3 mb-8">
    <div className="p-3 rounded-xl bg-white/70 border border-white/60">
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-1 font-serif">
        {title}
      </h2>
      {subtitle ? <p className="text-ink/70">{subtitle}</p> : null}
    </div>
  </div>
);

/* =========================================================
   WORKSHOP PANELS (brand glass)
========================================================= */
const ClotheslineWorkshop = ({ characters }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow">
    <h3 className="text-xl font-semibold text-ink mb-2">Clothes Pin Workshop</h3>
    <p className="text-ink/70 mb-4">Pin quick synopses for each character.</p>
    <div className="flex items-center gap-4 overflow-x-auto pb-2">
      {(characters?.length ? characters : ["Protagonist", "Antagonist"]).map((name, idx) => (
        <div key={idx} className="min-w-[220px] bg-white/80 border border-white/60 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-4 h-4 text-ink/70" />
            <div className="font-semibold text-ink">{name}</div>
          </div>
          <p className="text-sm text-ink/80">
            {name} plays a key role. Summarize traits, goals, and obstacles here.
          </p>
        </div>
      ))}
    </div>
  </div>
);

const HopesFearsLegacyWorkshop = ({ chapters, characters }) => {
  const text = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);
  const insights = useMemo(() => {
    const result = {};
    (characters || []).forEach((ch) => {
      result[ch] = {
        Hopes: extractKeywordSentences(text, "hope").slice(0, 3),
        Fears: extractKeywordSentences(text, "fear").slice(0, 3),
        Legacy: extractKeywordSentences(text, "legacy").slice(0, 3),
      };
    });
    return result;
  }, [text, characters]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 shadow">
      <h3 className="text-xl font-semibold text-ink mb-4">Hopes, Fears & Legacy Workshop</h3>
      {(!characters || characters.length === 0) && (
        <div className="text-ink/70 mb-3">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-white/60 bg-white/80 p-4">
            <div className="font-semibold text-ink mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["Hopes","Fears","Legacy"].map((key) => (
                <div key={key} className="rounded-lg bg-white p-3 border border-white/60">
                  <div className="text-ink/80 text-sm font-medium mb-2">{key}</div>
                  {data[key]?.length ? (
                    <ul className="space-y-2 text-ink/90 text-sm">
                      {data[key].map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  ) : (
                    <div className="text-ink/60 text-sm">No {key.toLowerCase()} yet.</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================
   MAIN (no top bar; mobile menu button)
========================================================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview"); // "overview" | "story" | "community" | "faith"
  const [chapters, setChapters] = useState([]);
  const [workshopCharacters, setWorkshopCharacters] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storylab_sidebar_collapsed") || "false");
    } catch {
      return false;
    }
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const chs = loadChaptersFromLocalStorage();
    setChapters(chs);
  }, []);

  // Section content groups
  const aiFeatures = [
    { icon: Sparkles, title: "Story Prompts", status: "Ready", description: "AI-generated prompts tailored to your story's theme and chapter." },
    { icon: CheckCircle, title: "Character Consistency", status: "Coming Soon", description: "Detect and flag character contradictions to keep details aligned." },
    { icon: Edit3, title: "Grammar Polish", status: "Coming Soon", description: "Clarity and flow suggestions that keep your voice intact." },
    { icon: FileText, title: "Scene Summaries", status: "Ready", description: "Auto-generate chapter summaries and track plot threads." },
  ];

  const storyFeatures = [
    { icon: User, title: "Character Profiles", status: "Beta", description: "Create detailed character sheets and track relationships." },
    { icon: Globe, title: "World Bible", status: "Beta", description: "Locations, cultures, and timelines that grow as you write." },
    { icon: Heart, title: "Hopes • Fears • Legacy", status: "Beta", description: "Surface motivational drivers and long-view stakes per character." },
  ];

  const workshopFeatures = [
    { icon: Calendar, title: "Session Schedule", status: "Ready", description: "Six-session collaborative writing structure with goals." },
    { icon: Users, title: "Breakout Pairings", status: "Ready", description: "Randomly pair writers for collaborative exercises and peer review." },
    { icon: MessageSquare, title: "Critique Circle", status: "Ready", description: "Share drafts with your cohort, add inline comments, and track revisions securely." },
  ];

  const faithFeatures = [
    { icon: Heart, title: "Reflection Prompts", status: "Beta", description: "Daily questions to ground your writing in purpose and meaning." },
    { icon: Star, title: "Legacy Writing", status: "Coming Soon", description: "Tools for writing with future generations in mind." },
  ];

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      {/* Mobile menu button */}
      <div className="md:hidden sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-white/60 hover:bg-white/80 border border-white/60"
          >
            <MenuIcon size={18} />
            <span className="text-sm font-medium">Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <BrandLogo className="h-7 w-auto" />
            <span className="font-serif font-semibold">DahTruth Story Lab</span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Sidebar */}
      <AeroSidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        showMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Content wrapper (left gutter = sidebar width) */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-72"}`}>
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
          {/* Sessions banner */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/60 shadow">
              <span className="text-sm font-serif font-semibold">Story Lab Sessions</span>
              <span className="text-muted text-xs">overview</span>
            </div>
          </div>

          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-3 font-serif">
              The All-in-One Writing Platform
            </h1>
            <p className="text-ink/80">
              Where creativity meets discipline—blend AI assistance, community, character tracking, and faith-based reflection.
            </p>
          </div>

          {/* Chapter Info */}
          {chapters.length > 0 && (
            <div className="mb-12 p-4 bg-white/70 backdrop-blur-xl rounded-xl border border-white/60 shadow">
              <div className="flex items-center gap-3 text-ink">
                <BookOpen className="w-5 h-5" />
                <span>
                  {chapters.length} chapter{chapters.length > 1 ? "s" : ""} loaded from your story
                </span>
              </div>
            </div>
          )}

          {/* Lab Sessions — OVERVIEW ONLY (4 modules) */}
          <section className="mb-16">
            <SectionHeader
              icon="🧪"
              title="Lab Sessions"
              subtitle="Overview of the interactive modules available in your Story Lab."
            />

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/story-lab/prompts"
                className="rounded-2xl p-5 border text-left bg-white/70 hover:bg-white/80 border-white/60 transition-all block shadow"
              >
                <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
                <div className="text-sm text-ink/70">
                  Smart prompts based on your story structure and content.
                </div>
              </Link>

              <FeatureCard
                icon={Calendar}
                title="Session Schedule"
                status="Ready"
                description="Six-session collaborative writing structure with goals."
              />

              <FeatureCard
                icon={Users}
                title="Breakout Pairings"
                status="Ready"
                description="Randomly pair writers for collaborative exercises and peer review."
              />

              <Link
                to="/story-lab/critique"
                className="rounded-2xl p-5 border text-left bg-white/70 hover:bg-white/80 border-white/60 transition-all block shadow"
              >
                <div className="text-lg font-semibold mb-1">Critique Circle</div>
                <div className="text-sm text-ink/70">
                  Share drafts, add inline comments, control copying, and keep an audit trail.
                </div>
              </Link>
            </div>
          </section>

          {/* Workshop Community — with Clothes Pin panel */}
          <section className="mb-12" id="community">
            <SectionHeader
              icon="👥"
              title="Workshop Community"
              subtitle="Collaborative writing sessions and accountability"
            />
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {[
                { icon: Calendar, title: "Session Schedule", status: "Ready", description: "Plan your cohort sessions and milestones." },
                { icon: Users, title: "Breakout Pairings", status: "Ready", description: "Create dynamic pairs for focused exercises." },
                { icon: MessageSquare, title: "Critique Circle", status: "Ready", description: "Secure sharing with comments and reactions." },
              ].map((feature, idx) => (
                <FeatureCard
                  key={idx}
                  {...feature}
                  onClick={() => {
                    if (feature.title === "Critique Circle") navigate("/story-lab/critique");
                  }}
                />
              ))}
            </div>

            {/* Clothesline moved here */}
            <ClotheslineWorkshop characters={workshopCharacters} />
          </section>

          {/* Story & Character Development — includes HFL panel */}
          <section className="mb-12" id="story">
            <SectionHeader
              icon="📖"
              title="Story & Character Development"
              subtitle="Character development, world building, and organization tools"
            />
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {storyFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>

            {/* Character Manager feeds HFL & Clothesline */}
            <CharacterManager
              seedText={chapters.map((c) => c.text).join("\n\n")}
              onChange={setWorkshopCharacters}
            />

            {/* HFL lives here (replaces continuity alerts) */}
            <div className="mt-8">
              <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
            </div>
          </section>

          {/* AI + Human Balance (second-to-last) */}
          <section className="mb-12">
            <SectionHeader
              icon="✨"
              title="AI + Human Balance"
              subtitle="AI that assists without overtaking your unique voice"
            />
            <div className="grid gap-6 md:grid-cols-2">
              {aiFeatures.map((feature, idx) => (
                <FeatureCard
                  key={idx}
                  {...feature}
                  onClick={() => {
                    if (feature.title === "Story Prompts") navigate("/story-lab/prompts");
                  }}
                />
              ))}
            </div>
          </section>

          {/* Faith + Legacy (very last) */}
          <section className="mb-24" id="faith">
            <SectionHeader
              icon="💝"
              title="Faith + Legacy"
              subtitle="Spiritual grounding and legacy-focused writing"
            />
            <div className="grid gap-6 md:grid-cols-2">
              {faithFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Actions Bar — brand glass */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/story-lab/critique"
              className="px-6 py-3 bg-accent/70 hover:bg-accent text-ink rounded-lg font-medium transition-all shadow"
            >
              Open Critique Circle
            </Link>
            <Link
              to="/story-lab/prompts"
              className="px-4 py-2 bg-white/70 hover:bg-white/90 text-ink rounded-lg font-medium transition-all border border-white/60"
            >
              View Prompts
            </Link>
          </div>
          <div className="flex items-center gap-2 text-ink/70">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Next session in 2 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
