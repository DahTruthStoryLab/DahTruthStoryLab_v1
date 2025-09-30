// src/lib/storylab/StoryLab.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Pin,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  Layers,
  Edit3,
  Trash2,
  Globe,
  Heart,
  Star,
  CheckCircle,
  FileText,
  MessageSquare,
  User,
  Send,
  MessageCircle,
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
  const tokens =
    (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
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
   PAGE BANNER
========================================================= */
const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-5 text-center shadow-[0_8px_28px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mb-2 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-3 py-1">
          <span className="text-xs font-semibold tracking-wide text-ink/80">
            DahTruth · StoryLab
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink">Modules & Sessions</h1>
        <p className="mt-1 text-sm text-ink/70">
          Clear, colorful entry points into everything you'll use during the workshop.
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   AT-A-GLANCE (Quote + Priorities)
========================================================= */
const QuoteBar = ({ chapters }) => {
  const [line, setLine] = useState("");
  const pick = () => {
    const text = chapters.map(c => c.text || "").join(" ").replace(/\s+/g, " ");
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    if (!sentences.length) {
      setLine("Start writing, then refresh to surface a line from your story.");
    } else {
      const idx = Math.floor(Math.random() * sentences.length);
      setLine(sentences[idx].trim());
    }
  };
  useEffect(() => { pick(); }, [chapters]);
  return (
    <div className="rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl px-5 py-4 flex items-center justify-between">
      <div className="italic text-ink/90">"{line}"</div>
      <button
        onClick={pick}
        className="ml-4 rounded-lg border border-white/60 bg-white/70 px-3 py-1.5 text-sm text-ink hover:bg-white"
        title="New quote from your story"
      >
        Refresh
      </button>
    </div>
  );
};

const PrioritiesGlance = () => {
  const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
  let counts = { High: 0, Medium: 0, Low: 0 };
  try {
    const proj = raw ? JSON.parse(raw) : null;
    (proj?.priorities || []).forEach(x => {
      counts[x.priority] = (counts[x.priority] || 0) + 1;
    });
  } catch {}
  return (
    <div className="rounded-2xl border border-white/50 bg-white/50 backdrop-blur-xl p-5">
      <div className="mb-3 text-ink font-semibold">Priorities at a Glance</div>
      <div className="grid grid-cols-3 gap-3">
        {["High","Medium","Low"].map(k => (
          <div key={k} className="rounded-lg bg-white/80 border border-white/60 p-3 text-center">
            <div className="text-2xl font-bold text-ink">{counts[k] || 0}</div>
            <div className="text-xs text-ink/60">{k}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <Link
          to="/story-lab/workshop/priorities"
          className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-gradient-to-r from-purple-600 via-violet-500 to-amber-400 px-3 py-1.5 text-sm font-medium text-white shadow hover:shadow-md"
        >
          Open Priority Cards
        </Link>
      </div>
    </div>
  );
};

/* =========================================================
   AERO SIDEBAR
========================================================= */
function AeroSidebar({ collapsed, setCollapsed, activeSection, setActiveSection }) {
  const location = useLocation();

  useEffect(() => {
    try {
      localStorage.setItem("storylab_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const items = [
    { key: "back", label: "Back to Dashboard", to: "/dashboard", icon: ChevronRight, type: "link", accent: true },

    // Workshop Community (your "community ops" items)
    { key: "community", label: "Workshop Community", section: "community", icon: Users, type: "section" },
    { key: "schedule", label: "Session Schedule", section: "schedule", icon: Calendar, type: "section" },
    { key: "pairs", label: "Breakout Pairings", section: "pairs", icon: Users, type: "section" },
    { key: "critique", label: "Critique Circle", to: "/story-lab/critique", icon: MessageSquare, type: "link" },

    // Live Session Modules
    { key: "modules", label: "Live Session Modules", section: "modules", icon: Layers, type: "section" },
    { key: "workshop", label: "Workshop (Characters/Roadmap)", to: "/story-lab/workshop", icon: Layers, type: "link" },
    { key: "prompts", label: "Story Prompts", to: "/story-lab/prompts", icon: Sparkles, type: "link" },

    // Story & Character Dev
    { key: "dev", label: "Story & Character Development", section: "dev", icon: BookOpen, type: "section" },

    // AI / Faith & Legacy
    { key: "ai", label: "AI + Human Balance", section: "ai", icon: CheckCircle, type: "section" },
    { key: "faith", label: "Faith & Legacy", section: "faith", icon: Star, type: "section" },
  ];

  const isActiveRoute = (to) => location.pathname === to;
  const isActiveSection = (key) => activeSection === key;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />
      <aside
        className={[
          "fixed left-0 top-0 z-50 h-screen",
          "border-r border-white/40 bg-white/20 backdrop-blur-2xl",
          "transition-all duration-300 ease-out shadow-[0_10px_40px_rgba(0,0,0,0.15)]",
          collapsed ? "w-20 -translate-x-0 md:translate-x-0 -left-64 md:left-0 md:w-20" : "w-72 left-0",
          "md:translate-x-0 overflow-hidden",
        ].join(" ")}
        aria-label="Aero menu sidebar"
      >
        {/* Brand row */}
        <div className="flex items-center gap-2 px-3 pt-4 pb-3 border-b border-white/40">
          <BrandLogo className={`${collapsed ? "h-6" : "h-8"} w-auto`} />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-ink" style={{ fontFamily: "Playfair Display, ui-serif, Georgia" }}>
                DahTruth
              </div>
              <div className="text-[11px] tracking-wide text-ink/70">StoryLab</div>
            </div>
          )}
        </div>

        {/* Collapse toggle (desktop) */}
        <div className="hidden md:flex items-center justify-end p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/30 px-2 py-1 text-xs font-medium text-ink hover:bg-white/40"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>

        {/* Menu */}
        <nav className="h-[calc(100%-6.25rem)] overflow-y-auto px-2 pb-6 pt-2">
          <div className="space-y-1">
            {items.map((it) => {
              const Icon = it.icon;
              const active =
                (it.type === "link" && isActiveRoute(it.to)) ||
                (it.type === "section" && isActiveSection(it.section));

              const base =
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-ink/20";
              const activeCls = it.accent ? "bg-ink text-white shadow-lg" : "bg-white/40 text-ink shadow";
              const inactive = "text-ink/80 hover:bg-white/30 hover:shadow hover:scale-[1.02] border border-transparent";

              const inner = (
                <>
                  <span
                    className={`absolute left-1 h-2 w-2 rounded-full transition-all duration-200 ${
                      active ? "bg-gold opacity-100" : "bg-ink/30 opacity-0 group-hover:opacity-100"
                    }`}
                  />
                  <Icon className={`h-5 w-5 ${active ? "opacity-100" : "opacity-90"}`} />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                  <span
                    className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                    style={{ background: "radial-gradient(60% 60% at 100% 0%, rgba(255,255,255,0.35), transparent)" }}
                  />
                </>
              );

              return it.type === "link" ? (
                <Link key={it.key} to={it.to} className={`${base} ${active ? activeCls : inactive} border border-white/40`} title={collapsed ? it.label : undefined}>
                  {inner}
                </Link>
              ) : (
                <button
                  key={it.key}
                  onClick={() => setActiveSection(it.section)}
                  className={`${base} ${active ? activeCls : inactive} border border-white/40`}
                  title={collapsed ? it.label : undefined}
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}

/* =========================================================
   FEATURE CARD + SECTION HEADER
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusColors = {
    Ready: "bg-emerald-500/20 text-emerald-800 border-emerald-600/40",
    Beta: "bg-sky-500/20 text-sky-800 border-sky-600/40",
    "Coming Soon": "bg-slate-500/20 text-slate-800 border-slate-600/40",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-white/50 bg-white/50 p-6 backdrop-blur-xl transition hover:shadow-lg hover:scale-[1.01]"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-white/60 bg-white/60 p-3">
            <Icon className="h-6 w-6 text-ink/80" />
          </div>
          <div className="flex-1">
            <h3 className="mb-2 text-lg font-semibold text-ink">{title}</h3>
            {status && (
              <span className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${statusColors[status]}`}>
                {status}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 text-ink/50" />
      </div>
      <p className="text-sm leading-relaxed text-ink/80">{description}</p>
    </button>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => {
  return (
    <div className="mb-8 flex items-start gap-3">
      <div className="rounded-xl border border-white/60 bg-white/50 p-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="mb-1 text-3xl font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-ink/70">{subtitle}</p>}
      </div>
    </div>
  );
};

/* =========================================================
   CHARACTER MANAGER (quick)
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

  const deleteCharacter = (id) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCharacter = (id, name) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)));
    setEditingId(null);
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg border border-white/60 bg-white/60 p-2">
          <User className="h-5 w-5 text-ink/80" />
        </div>
        <h3 className="text-lg font-semibold text-ink">Character Manager</h3>
      </div>

      <div className="mb-4 space-y-3">
        {characters.length === 0 && (
          <div className="text-sm text-ink/70">No characters found yet. Add them below.</div>
        )}
        {characters.map((character) => (
          <div key={character.id} className="flex items-center gap-3 rounded-lg border border-white/60 bg-white/70 p-3">
            {editingId === character.id ? (
              <input
                type="text"
                defaultValue={character.name}
                onBlur={(e) => updateCharacter(character.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateCharacter(character.id, e.currentTarget.value)}
                className="flex-1 border-b border-ink/30 bg-transparent text-ink outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingId(character.id)}
                className="flex-1 cursor-pointer text-ink hover:text-ink/80"
                title="Click to edit"
              >
                {character.name}
              </span>
            )}
            <button onClick={() => deleteCharacter(character.id)} className="text-ink/60 hover:text-ink" title="Delete character">
              <Trash2 className="h-4 w-4" />
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
          className="flex-1 rounded-lg border border-white/60 bg-white px-4 py-2 text-ink placeholder-ink/40 focus:border-ink/40 focus:outline-none"
        />
        <button onClick={addCharacter} className="rounded-lg border border-white/60 bg-accent/60 px-4 py-2 font-medium text-ink hover:bg-accent/70">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   CLOTHESLINE PREVIEW CARD (kept on overview)
========================================================= */
const ClotheslinePreview = ({ characters }) => {
  return (
    <div className="rounded-2xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl">
      <h3 className="mb-2 text-xl font-semibold text-ink">Clothesline</h3>
      <p className="mb-4 text-ink/70">Pin quick synopses for each character (open full module to edit).</p>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(characters?.length ? characters : ["Protagonist", "Antagonist"]).map((name, idx) => (
          <div key={idx} className="min-w-[220px] rounded-xl border border-white/60 bg-white/80 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Pin className="h-4 w-4 text-ink/70" />
              <div className="font-semibold text-ink">{name}</div>
            </div>
            <p className="text-sm text-ink/80">Traits, goals, and obstacles at a glance.</p>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Link
          to="/story-lab/workshop/clothesline"
          className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-3 py-1.5 text-sm text-ink hover:bg-white"
        >
          Open Clothesline
        </Link>
      </div>
    </div>
  );
};

/* =========================================================
   WORKSHOP SESSION CHAT (overview page)
========================================================= */
const WorkshopChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, who: "Facilitator", text: "Welcome! Share a line you're proud of from today." },
  ]);
  const [input, setInput] = useState("");
  const nextId = useRef(2);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setMessages((m) => [...m, { id: nextId.current++, who: "You", text: t }]);
    setInput("");
  };

  return (
    <div className="rounded-2xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg border border-white/60 bg-white/60 p-2">
          <MessageCircle className="h-5 w-5 text-ink/80" />
        </div>
        <h3 className="text-lg font-semibold text-ink">Critique & Collaboration</h3>
      </div>
      <div className="mb-3 max-h-60 overflow-y-auto rounded-lg border border-white/60 bg-white/80 p-3">
        {messages.map((m) => (
          <div key={m.id} className="mb-2">
            <span className="mr-2 text-xs font-semibold text-ink/70">{m.who}:</span>
            <span className="text-ink">{m.text}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-white/60 bg-white px-3 py-2 text-ink placeholder-ink/40 focus:border-ink/40 focus:outline-none"
        />
        <button
          onClick={send}
          className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-accent/60 px-3 py-2 font-medium text-ink hover:bg-accent/70"
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN
========================================================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("community");
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

  useEffect(() => {
    const loaded = loadChaptersFromLocalStorage();
    setChapters(loaded);
    const allText = loaded.map((c) => c.text).join("\n\n");
    setWorkshopCharacters(guessCharacters(allText));
  }, []);

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
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

      {/* Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-72"}`}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <PageBanner />

          {/* At-a-Glance Row */}
          <div className="grid gap-6 md:grid-cols-2 mb-10">
            <QuoteBar chapters={chapters} />
            <PrioritiesGlance />
          </div>

          {/* Workshop Community */}
          <section id="community" className="mb-14">
            <SectionHeader
              icon="👥"
              title="Workshop Community"
              subtitle="Session logistics and collaboration spaces."
            />
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Calendar}
                title="Session Schedule"
                status="Ready"
                description="Plan your six-session arc with goals and homework."
                onClick={() => setActiveSection("schedule")}
              />
              <FeatureCard
                icon={Users}
                title="Breakout Pairings"
                status="Ready"
                description="Pair up for collaborative exercises and peer review."
                onClick={() => setActiveSection("pairs")}
              />
              <FeatureCard
                icon={MessageSquare}
                title="Critique Circle"
                status="Ready"
                description="Inline comments, reactions, audit logs and copy controls."
                onClick={() => navigate("/story-lab/critique")}
              />
            </div>
            {/* Live chat space visible on overview */}
            <div className="grid gap-6 md:grid-cols-2">
              <WorkshopChat />
              <ClotheslinePreview characters={workshopCharacters} />
            </div>
          </section>

          {/* Live Session Modules */}
          <section id="modules" className="mb-14">
            <SectionHeader
              icon="🧪"
              title="Live Session Modules"
              subtitle="Hands-on tools used during sessions."
            />
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <FeatureCard
                icon={Pin}
                title="Clothesline"
                status="Ready"
                description="Org-style character view with relationships at a glance."
                onClick={() => navigate("/story-lab/workshop/clothesline")}
              />
              <FeatureCard
                icon={Sparkles}
                title="Story Prompts"
                status="Ready"
                description="Context-aware prompts pulled from your actual manuscript."
                onClick={() => navigate("/story-lab/prompts")}
              />
              <FeatureCard
                icon={Layers}
                title="Character Roadmap"
                status="Ready"
                description="Milestones and beats that move your cast from A → B."
                onClick={() => navigate("/story-lab/workshop?tab=roadmap")}
              />
              <FeatureCard
                icon={CheckCircle}
                title="Priority Cards"
                status="Ready"
                description="Drag, rank, and track scope/priority/status live."
                onClick={() => navigate("/story-lab/workshop/priorities")}
              />
            </div>
          </section>

          {/* Story & Character Development */}
          <section id="dev" className="mb-14">
            <SectionHeader
              icon="📖"
              title="Story & Character Development"
              subtitle="Organize, explore, and deepen your world and cast."
            />
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={User}
                title="Character Profiles"
                status="Beta"
                description="Create detailed sheets and track relationships."
              />
              <FeatureCard
                icon={Globe}
                title="World Bible"
                status="Beta"
                description="Locations, cultures, and timelines that grow with your draft."
              />
              <FeatureCard
                icon={Heart}
                title="Hopes • Fears • Legacy"
                status="Ready"
                description="Mine your text for motivational drivers and thematic threads."
                onClick={() => setActiveSection("hfl")}
              />
            </div>

            {/* Inline tools */}
            <div className="grid gap-6">
              <CharacterManager
                seedText={chapters.map((c) => c.text).join("\n\n")}
                onChange={() => {}}
              />
              {activeSection === "hfl" && (
                <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
              )}
            </div>
          </section>

          {/* AI + Human Balance */}
          <section id="ai" className="mb-14">
            <SectionHeader icon="✨" title="AI + Human Balance" subtitle="Assistive tools that respect your voice." />
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={CheckCircle}
                title="Character Consistency"
                status="Coming Soon"
                description="Catch contradictions like changing eye color or voice."
              />
              <FeatureCard
                icon={Edit3}
                title="Grammar Polish"
                status="Coming Soon"
                description="Clarity and correctness without flattening your style."
              />
              <FeatureCard
                icon={FileText}
                title="Scene Summaries"
                status="Ready"
                description="Auto-generate summaries and track plot threads."
              />
            </div>
          </section>

          {/* Faith & Legacy */}
          <section id="faith" className="mb-24">
            <SectionHeader
              icon="💝"
              title="Faith & Legacy"
              subtitle="Spiritual grounding and writing with the future in mind."
            />
            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard
                icon={Star}
                title="Reflection Prompts"
                status="Beta"
                description="Daily questions to focus your heart before you write."
              />
              <FeatureCard
                icon={Layers}
                title="Legacy Writing"
                status="Coming Soon"
                description="Shape work that serves readers beyond the moment."
              />
            </div>
          </section>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-white/60 bg-white/80 p-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/story-lab/critique"
              className="rounded-lg bg-accent/70 px-6 py-3 font-medium text-ink shadow hover:bg-accent"
            >
              Open Critique Circle
            </Link>
            <Link
              to="/story-lab/prompts"
              className="rounded-lg border border-white/60 bg-white/60 px-4 py-2 font-medium text-ink hover:bg-white/80"
            >
              View Prompts
            </Link>
            <Link
              to="/story-lab/workshop"
              className="rounded-lg border border-white/60 bg-white/60 px-4 py-2 font-medium text-ink hover:bg-white/80"
            >
              Open Workshop
            </Link>
          </div>
          <div className="flex items-center gap-2 text-ink/70">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Next session in 2 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HFL (inline)
========================================================= */
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
    <div className="rounded-2xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl">
      <h3 className="mb-4 text-xl font-semibold text-ink">Hopes, Fears & Legacy</h3>
      {(!characters || characters.length === 0) && (
        <div className="mb-3 text-ink/70">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-white/60 bg-white/80 p-4">
            <div className="mb-2 font-semibold text-ink">{name}</div>
            <div className="grid gap-3 md:grid-cols-3">
              {["Hopes", "Fears", "Legacy"].map((key) => (
                <div key={key} className="rounded-lg border border-white/60 bg-white p-3">
                  <div className="mb-2 text-sm font-medium text-ink/80">{key}</div>
                  {data[key]?.length ? (
                    <ul className="space-y-2 text-sm text-ink/90">
                      {data[key].map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-ink/60">No {key.toLowerCase()} yet.</div>
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
