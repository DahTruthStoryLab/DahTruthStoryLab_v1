// src/lib/storylab/StoryLab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Users, Pin, Sparkles, Calendar, Clock,
  ChevronRight, Plus, Layers, Edit3, Trash2, Globe, Heart, Star,
  CheckCircle, FileText, MessageSquare, User
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
function extractConflicts(text) {
  const needles = ["conflict","tension","argument","fight","feud","rivalry","obstacle","problem","challenge"];
  return splitSentences(text).filter((s) => needles.some((n) => s.toLowerCase().includes(n)));
}

/* =========================================================
   Top glass bar (brand light scheme)
========================================================= */
const TopBar = ({ navigate, toggleMobileSidebar }) => (
  <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/60 text-ink">
    <div className="max-w-7xl mx-auto px-6">
      <div className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileSidebar}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/50 hover:bg-white/70 border border-white/60"
            aria-label="Toggle menu"
          >
            <span className="text-ink/80">☰</span>
          </button>
          <BrandLogo className="h-7 w-auto" />
          <div className="leading-tight">
            <div className="text-lg font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
              Story Lab
            </div>
            <div className="text-xs text-muted -mt-0.5">Where your writing journey begins</div>
          </div>
        </div>

        {/* Back here AND in sidebar for convenience */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium glass hover:bg-white/70 transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} className="text-ink/80" />
          <span className="text-ink">Back</span>
        </Link>
      </div>
    </div>
  </div>
);

/* =========================================================
   Aero Sidebar (light/glass + bounce + ordered items)
========================================================= */
function AeroSidebar({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
}) {
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem("storylab_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  // Scroll helper for in-page sections
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Ordered by your modules (including Back at bottom)
  const items = [
    // Sessions + AI + Dev + Faith in the requested order
    { key: "promptsLink", label: "Story Prompts", to: "/story-lab/prompts", icon: Sparkles, type: "link" },

    { key: "charConsistency", label: "Character Consistency", icon: CheckCircle, type: "scroll", target: "ai" },
    { key: "grammar",         label: "Grammar Polish",        icon: Edit3,       type: "scroll", target: "ai" },
    { key: "sceneSum",        label: "Scene Summaries",       icon: FileText,    type: "scroll", target: "ai" },

    { key: "profiles",        label: "Character Profiles",    icon: User,        type: "scroll", target: "dev" },
    { key: "clothesline",     label: "Character Clothesline", icon: Pin,         type: "section", section: "clothesline", target: "dev" },
    { key: "world",           label: "World Bible",           icon: Globe,       type: "scroll", target: "dev" },
    { key: "hfl",             label: "Hopes • Fears • Legacy",icon: Heart,       type: "section", section: "hfl", target: "dev" },

    { key: "schedule",        label: "Session Schedule",      icon: Calendar,    type: "scroll", target: "sessions" },
    { key: "breakouts",       label: "Breakout Pairings",     icon: Users,       type: "scroll", target: "sessions" },
    { key: "critique",        label: "Critique Circle",       to: "/story-lab/critique", icon: MessageSquare, type: "link", accent: true },

    { key: "reflection",      label: "Reflection Prompts",    icon: Heart,       type: "scroll", target: "faith" },
    { key: "legacy",          label: "Legacy Writing",        icon: Star,        type: "scroll", target: "faith" },

    { key: "back",            label: "Back to Dashboard",     to: "/dashboard",  icon: ArrowLeft, type: "link" },
  ];

  const isActiveRoute = (to) => location.pathname === to;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />

      <aside
        className={[
          "fixed z-50 md:z-30 left-0 top-16 h-[calc(100vh-4rem)]",
          "bg-white/40 backdrop-blur-xl border-r border-white/60 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.15)]",
          "transition-all duration-300 ease-out overflow-hidden",
          collapsed ? "w-20 -translate-x-0 md:translate-x-0 -left-64 md:left-0 md:w-20" : "w-72 left-0",
          "md:translate-x-0"
        ].join(" ")}
        aria-label="Aero menu sidebar"
      >
        {/* Brand row */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <BrandLogo className={`${collapsed ? "h-6" : "h-7"} w-auto`} />
          {!collapsed && (
            <span className="text-sm font-semibold text-ink font-serif">
              DahTruth Story Lab
            </span>
          )}
        </div>

        {/* Collapse button */}
        <div className="hidden md:flex items-center justify-end p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 bg-white/60 hover:bg-white/70 border border-white/60 text-ink/80"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>

        {/* Menu */}
        <nav className="px-2 pb-3 overflow-y-auto h-[calc(100%-3rem)]">
          <div className="mt-2 space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const active =
                (it.type === "link" && isActiveRoute(it.to)) ||
                (it.type === "section" && activeSection === it.section);

              const base =
                "group flex items-center gap-3 w-full rounded-xl px-3 py-2 outline-none transition-all " +
                "focus:ring-2 focus:ring-primary hover:bg-white/50 hover:shadow-sm hover:translate-x-0.5";
              const activeCls = it.accent
                ? "bg-accent/70 text-ink border border-white/60 shadow"
                : "bg-white/70 text-ink border border-white/60 shadow";
              const inactive = "text-ink/80 border border-transparent";

              const inner = (
                <>
                  <Icon className={`w-5 h-5 ${active ? "text-ink" : "text-ink/80"} transition-transform group-hover:scale-110`} />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                </>
              );

              if (it.type === "link") {
                return (
                  <Link
                    key={it.key}
                    to={it.to}
                    className={`${base} ${active ? activeCls : inactive}`}
                    title={collapsed ? it.label : undefined}
                  >
                    {inner}
                  </Link>
                );
              }

              // scroll/section buttons
              return (
                <button
                  key={it.key}
                  onClick={() => {
                    if (it.section) setActiveSection(it.section);
                    if (it.target) scrollTo(it.target);
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
              <p className="text-[11px] leading-4 text-muted">
                Translucent hover highlights • gentle bounce on hover • ordered by modules
              </p>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}

/* =========================================================
   Reusable Feature Card (light/glass)
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusStyles = {
    Ready: "bg-primary text-ink border-white/60",
    Beta: "bg-accent/40 text-ink border-white/60",
    "Coming Soon": "bg-muted/20 text-ink border-white/60",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60 hover:bg-white/80 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/80 rounded-xl border border-white/60">
            <Icon className="w-6 h-6 text-ink/80" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
            {status && (
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted mt-1" />
      </div>
      <p className="text-ink/80 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle, id }) => (
  <div id={id} className="flex items-start gap-3 mb-8">
    <div className="p-3 rounded-xl bg-white/70 border border-white/60">
      <span className="text-xl">{icon}</span>
    </div>
    <div>
      <h2 className="text-3xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-1">
        {title}
      </h2>
      {subtitle ? <p className="text-muted">{subtitle}</p> : null}
    </div>
  </div>
);

/* =========================================================
   Light/glass Workshop Panels
========================================================= */
const CharacterManager = ({ seedText = "", onChange }) => {
  const [characters, setCharacters] = useState(() => {
    const fromText = guessCharacters(seedText);
    return fromText.length ? fromText.map((n, i) => ({ id: i + 1, name: n })) : [];
  });
  const [newCharacter, setNewCharacter] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    onChange?.(characters.map((c) => c.name));
  }, [characters, onChange]);

  const addCharacter = () => {
    const val = newCharacter.trim();
    if (!val) return;
    setCharacters((prev) => [...prev, { id: Date.now(), name: val }]);
    setNewCharacter("");
  };
  const deleteCharacter = (id) => setCharacters((prev) => prev.filter((c) => c.id !== id));
  const updateCharacter = (id, name) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)));
    setEditingId(null);
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-lg font-semibold text-ink mb-4">Character Manager</h3>

      <div className="space-y-3 mb-4">
        {characters.length === 0 && (
          <div className="text-muted text-sm">No characters yet. Add one.</div>
        )}
        {characters.map((ch) => (
          <div key={ch.id} className="flex items-center gap-3 bg-white/80 rounded-lg p-3 border border-white/60">
            {editingId === ch.id ? (
              <input
                type="text"
                defaultValue={ch.name}
                onBlur={(e) => updateCharacter(ch.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateCharacter(ch.id, e.currentTarget.value)}
                className="flex-1 bg-transparent border-b border-muted text-ink outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingId(ch.id)}
                className="flex-1 text-ink cursor-pointer hover:text-ink/80"
                title="Click to edit"
              >
                {ch.name}
              </span>
            )}
            <button
              onClick={() => deleteCharacter(ch.id)}
              className="text-ink/60 hover:text-ink"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new character…"
          value={newCharacter}
          onChange={(e) => setNewCharacter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCharacter()}
          className="flex-1 px-4 py-2 bg-white border border-white/60 rounded-lg text-ink placeholder-muted focus:border-muted focus:outline-none"
        />
        <button
          onClick={addCharacter}
          className="px-4 py-2 bg-accent/60 hover:bg-accent text-ink rounded-lg border border-white/60 transition-colors"
          title="Add character"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const StoryPromptsWorkshop = ({ chapters, characters }) => {
  const fullText = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);

  const prompts = useMemo(() => {
    const out = [];
    (characters || []).slice(0, 8).forEach((ch) => {
      out.push(`Explore the backstory of ${ch}.`);
      out.push(`What does ${ch} fear the most? Write a scene that reveals it implicitly.`);
    });
    const conflicts = extractConflicts(fullText);
    if (conflicts.length) out.push(`What happens if this conflict escalates further: "${conflicts[0]}".`);
    const hopes = extractKeywordSentences(fullText, "hope");
    const fears = extractKeywordSentences(fullText, "fear");
    const legacy = extractKeywordSentences(fullText, "legacy");
    if (hopes[0])  out.push(`Write a scene where this hope comes true: "${hopes[0]}".`);
    if (fears[0])  out.push(`Force the protagonist to confront this fear: "${fears[0]}".`);
    if (legacy[0]) out.push(`Foreshadow this legacy in a quiet, symbolic moment: "${legacy[0]}".`);
    chapters.forEach((ch, i) => {
      if ((ch.text || "").length > 60) {
        out.push(`Chapter ${i + 1}: raise the stakes in the final third without adding new characters.`);
        out.push(`Chapter ${i + 1}: add a reversal that turns the POV character's goal on its head.`);
      }
    });
    return Array.from(new Set(out)).slice(0, 24);
  }, [chapters, characters, fullText]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-xl font-semibold text-ink mb-2">Story Prompts Workshop</h3>
      <p className="text-ink/70 mb-4">Prompts generated from your chapters and characters.</p>
      {prompts.length === 0 ? (
        <div className="text-muted">No prompts yet. Add chapters first.</div>
      ) : (
        <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {prompts.map((p, i) => (
            <li key={i} className="p-3 rounded-lg bg-white/80 border border-white/60 text-ink">
              • {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ClotheslineWorkshop = ({ characters }) => (
  <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
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
        Hopes:  extractKeywordSentences(text, "hope").slice(0, 3),
        Fears:  extractKeywordSentences(text, "fear").slice(0, 3),
        Legacy: extractKeywordSentences(text, "legacy").slice(0, 3),
      };
    });
    return result;
  }, [text, characters]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-white/60">
      <h3 className="text-xl font-semibold text-ink mb-4">Hopes, Fears & Legacy Workshop</h3>
      {(!characters || characters.length === 0) && (
        <div className="text-muted mb-3">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-white/60 bg-white/80 p-4">
            <div className="font-semibold text-ink mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["Hopes", "Fears", "Legacy"].map((key) => (
                <div key={key} className="rounded-lg bg-white p-3 border border-white/60">
                  <div className="text-ink/80 text-sm font-medium mb-2">{key}</div>
                  {data[key]?.length ? (
                    <ul className="space-y-2 text-ink/90 text-sm">
                      {data[key].map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  ) : (
                    <div className="text-muted text-sm">No {key.toLowerCase()} yet.</div>
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
   MAIN (Sessions → Dev → Faith → AI)
========================================================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview"); // "clothesline" | "hfl"
  const [chapters, setChapters] = useState([]);
  const [workshopCharacters, setWorkshopCharacters] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storylab_sidebar_collapsed") || "false");
    } catch {
      return false;
    }
  });
  const [mobileSidebarHidden, setMobileSidebarHidden] = useState(true);
  const toggleMobileSidebar = () => setMobileSidebarHidden((v) => !v);

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

  // Updated groups per your order (Story Prompts moved out of AI)
  const aiFeatures = [
    { icon: CheckCircle, title: "Character Consistency", status: "Coming Soon", description: "AI checks for inconsistent traits and contradictions." },
    { icon: Edit3,       title: "Grammar Polish",        status: "Coming Soon", description: "Clarity and grammar suggestions that keep your voice." },
    { icon: FileText,    title: "Scene Summaries",       status: "Ready",       description: "Auto-generate chapter summaries and track threads." },
  ];

  const storyFeatures = [
    { icon: User,     title: "Character Profiles",      status: "Beta",  description: "Create detailed character sheets and track relationships." },
    { icon: Pin,      title: "Character Clothesline",   status: "Ready", description: "Pin and track traits, obstacles, and changes." },
    { icon: Globe,    title: "World Bible",             status: "Beta",  description: "Locations, cultures, and timelines that grow with your draft." },
    { icon: Heart,    title: "Hopes • Fears • Legacy",  status: "Ready", description: "Surface motivating hopes, fears, and legacy threads." },
  ];

  const faithFeatures = [
    { icon: Heart, title: "Reflection Prompts", status: "Beta", description: "Daily questions to ground your writing in purpose and meaning." },
    { icon: Star,  title: "Legacy Writing",     status: "Coming Soon", description: "Tools for writing with future generations in mind." },
  ];

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      <TopBar navigate={navigate} toggleMobileSidebar={toggleMobileSidebar} />

      {/* Sidebar */}
      <AeroSidebar
        collapsed={sidebarCollapsed && mobileSidebarHidden}
        setCollapsed={(v) => {
          setSidebarCollapsed(v);
          setMobileSidebarHidden(true);
        }}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      {/* Content wrapper (left margin = sidebar width) */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-72"}`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent mb-3">
              The All-in-One Writing Platform
            </h1>
            <p className="text-ink/80">
              Blend collaborative sessions, organization tools, faith-centered prompts, and smart AI assistance.
            </p>
          </div>

          {/* Chapters info */}
          {chapters.length > 0 && (
            <div className="mb-12 p-4 bg-white/70 backdrop-blur-xl rounded-xl border border-white/60">
              <div className="flex items-center gap-3 text-ink">
                <BookOpen className="w-5 h-5" />
                <span>
                  {chapters.length} chapter{chapters.length > 1 ? "s" : ""} loaded from your story
                </span>
              </div>
            </div>
          )}

          {/* =========== LAB SESSIONS (first) =========== */}
          <section className="mb-16">
            <SectionHeader
              id="sessions"
              icon="🧪"
              title="Story Lab Sessions"
              subtitle="Interactive workshops for collaboration and momentum."
            />

            {/* 4 cards in one line on large screens */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <button
                type="button"
                onClick={() => document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-2xl p-5 text-left bg-white/70 hover:bg-white/80 border border-white/60 transition-colors"
              >
                <div className="text-lg font-semibold mb-1">Session Schedule</div>
                <div className="text-sm text-ink/70">Six-session collaborative structure with goals.</div>
              </button>

              <button
                type="button"
                onClick={() => document.getElementById("sessions")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-2xl p-5 text-left bg-white/70 hover:bg-white/80 border border-white/60 transition-colors"
              >
                <div className="text-lg font-semibold mb-1">Breakout Pairings</div>
                <div className="text-sm text-ink/70">Random pairing for timed exercises and peer review.</div>
              </button>

              <Link
                to="/story-lab/critique"
                className="rounded-2xl p-5 text-left bg-white/70 hover:bg-white/80 border border-white/60 transition-colors block"
              >
                <div className="text-lg font-semibold mb-1">Critique Circle</div>
                <div className="text-sm text-ink/70">Secure sharing, inline comments, reactions & audit log.</div>
              </Link>

              <Link
                to="/story-lab/prompts"
                className="rounded-2xl p-5 text-left bg-white/70 hover:bg-white/80 border border-white/60 transition-colors block"
              >
                <div className="text-lg font-semibold mb-1">Story Prompts</div>
                <div className="text-sm text-ink/70">Context-aware prompts to keep you moving.</div>
              </Link>
            </div>

            {/* Optional: inline workshops if you want them visible here */}
            {activeSection === "clothesline" && (
              <ClotheslineWorkshop characters={workshopCharacters} />
            )}
            {activeSection === "hfl" && (
              <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
            )}
          </section>

          {/* =========== STORY & CHARACTER DEVELOPMENT (second) =========== */}
          <section className="mb-16">
            <SectionHeader
              id="dev"
              icon="📖"
              title="Story & Character Development"
              subtitle="Characters, worlds, and structure—beautifully organized."
            />
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {storyFeatures.map((feature, idx) => (
                <FeatureCard
                  key={idx}
                  {...feature}
                  onClick={() => {
                    if (feature.title.includes("Clothesline")) setActiveSection("clothesline");
                    if (feature.title.includes("Hopes")) setActiveSection("hfl");
                  }}
                />
              ))}
            </div>

            {/* Character manager feeds HFL & prompts */}
            <CharacterManager
              seedText={chapters.map((c) => c.text).join("\n\n")}
              onChange={setWorkshopCharacters}
            />
          </section>

          {/* =========== FAITH + LEGACY (third) =========== */}
          <section className="mb-16">
            <SectionHeader
              id="faith"
              icon="💝"
              title="Faith + Legacy"
              subtitle="Writing with purpose and impact."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {faithFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </section>

          {/* =========== AI + HUMAN BALANCE (last) =========== */}
          <section className="mb-24">
            <SectionHeader
              id="ai"
              icon="✨"
              title="AI + Human Balance"
              subtitle="Subtle assistance that never drowns your voice."
            />
            <div className="grid gap-6 md:grid-cols-2">
              {aiFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Quick Actions glass bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-white/60 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/story-lab/critique"
              className="px-6 py-3 bg-accent hover:bg-accent/90 text-ink rounded-xl font-medium transition-colors shadow"
            >
              Open Critique Circle
            </Link>
            <Link
              to="/story-lab/prompts"
              className="px-4 py-2 glass border border-white/60 hover:bg-white/90 rounded-xl font-medium transition-colors text-ink"
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
