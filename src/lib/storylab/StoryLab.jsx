// src/lib/storylab/StoryLab.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  Sparkles,
  Calendar,
  Clock,
  ChevronRight,
  Layers,
  Edit3,
  Globe,
  Heart,
  Star,
  CheckCircle,
  FileText,
  MessageSquare,
  MessageCircle,
  ListChecks,
  User,
  Map as RouteIcon, // ✅ alias Map safely for “Roadmap”
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo";

/* =========================
   Storage helpers
========================= */
function loadChaptersFromLocalStorage() {
  try {
    const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
    if (!raw) return [];
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

/* =========================
   Tiny NLP-lite
========================= */
const splitSentences = (txt) =>
  (txt || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]/g) || [];

/* =========================
   Clothesline icon (safe)
========================= */
const ClotheslineIcon = ({ className = "h-6 w-6" }) => (
  <svg
    viewBox="0 0 64 64"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M6 18 L58 18" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="18" r="2.5" fill="#f59e0b" />
    <circle cx="48" cy="18" r="2.5" fill="#f59e0b" />
    {/* shirt */}
    <path
      d="M27 22 l5 -4 5 4 5 2 v14 a3 3 0 0 1 -3 3 h-14 a3 3 0 0 1 -3 -3 v-14z"
      fill="#ffffff"
      stroke="#c4b5fd"
      strokeWidth="1.5"
    />
  </svg>
);

/* =========================
   Page banner (enhanced)
========================= */
const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow-[0_8px_28px_rgba(0,0,0,0.12)] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5 shadow-sm">
            <BookOpen size={14} className="mr-2 text-ink/70" />
            <span className="text-xs font-semibold tracking-wide text-ink/80">
              DahTruth · StoryLab
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">Modules &amp; Sessions</h1>
          <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">
            Clear, colorful entry points into everything you’ll use during the workshop.
          </p>
        </div>
      </div>
    </div>
  );
};

/* =========================
   Quote (Live Session Modules)
========================= */
const QuoteBar = ({ chapters }) => {
  const [line, setLine] = useState("");
  const pick = () => {
    const text = chapters.map((c) => c.text || "").join(" ").replace(/\s+/g, " ");
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    if (!sentences.length) {
      setLine("Start writing, then refresh to surface a line from your story.");
    } else {
      const idx = Math.floor(Math.random() * sentences.length);
      setLine(sentences[idx].trim());
    }
  };
  useEffect(() => {
    pick();
  }, [chapters]);
  return (
    <div className="mb-8 rounded-2xl border border-white/50 bg-white/40 backdrop-blur-xl px-5 py-4 flex items-center justify-between">
      <div className="italic text-ink/90">“{line}”</div>
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

/* =========================
   Feature card
========================= */
const FeatureCard = ({ icon: Icon, title, description, onClick, RightIcon }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-white/50 bg-white/60 p-5 backdrop-blur-xl transition hover:shadow-lg hover:bg-white/80"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-white/60 bg-white/60 p-3">
            {Icon ? <Icon className="h-6 w-6 text-ink/80" /> : <ClotheslineIcon />}
          </div>
          <div>
            <div className="mb-1 text-lg font-semibold text-ink">{title}</div>
            <p className="text-sm text-ink/70">{description}</p>
          </div>
        </div>
        {RightIcon ? <RightIcon className="mt-1 h-5 w-5 text-ink/40" /> : null}
      </div>
    </button>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => (
  <div className="mb-6 flex items-start gap-3">
    <div className="rounded-xl border border-white/60 bg-white/50 p-3">
      <span className="text-2xl">{icon}</span>
    </div>
    <div>
      <h2 className="mb-1 text-2xl font-bold text-ink">{title}</h2>
      {subtitle && <p className="text-ink/70">{subtitle}</p>}
    </div>
  </div>
);

/* =========================
   Punchy grouped sidebar
========================= */
function GroupedSidebar({ collapsed, setCollapsed, activeKey, onSelect }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoute = (to) => location.pathname === to;

  // Sidebar config with groups and items
  const groups = [
    {
      label: "Workshop Community",
      items: [
        { key: "schedule", label: "Session Schedule", kind: "section", icon: Calendar },
        { key: "pairs", label: "Breakout Pairings", kind: "section", icon: Users },
        { key: "critique", label: "Critique & Collaboration", kind: "link", to: "/story-lab/critique", icon: MessageSquare },
      ],
    },
    {
      label: "Live Session Modules",
      items: [
        { key: "prompts", label: "Story Prompts", kind: "link", to: "/story-lab/prompts", icon: Sparkles },
        { key: "roadmap", label: "Character Roadmap", kind: "link", to: "/story-lab/workshop/roadmap", icon: RouteIcon },
        { key: "hfl", label: "Hopes • Fears • Legacy", kind: "link", to: "/story-lab/workshop/hfl", icon: Heart },
        { key: "priorities", label: "Priority Cards", kind: "link", to: "/story-lab/workshop/priorities", icon: ListChecks },
        { key: "clothesline", label: "Clothesline", kind: "link", to: "/story-lab/workshop/clothesline", icon: null }, // custom
      ],
    },
    {
      label: "Character Development",
      items: [
        { key: "profiles", label: "Character Profiles", kind: "section", icon: User },
        { key: "world", label: "World Bible", kind: "section", icon: Globe },
        { key: "hfl2", label: "Hopes • Fears • Legacy", kind: "link", to: "/story-lab/workshop/hfl", icon: Heart },
        { key: "manager", label: "Character Manager", kind: "section", icon: Users },
      ],
    },
    {
      label: "AI + Human Balance",
      items: [
        { key: "consistency", label: "Character Consistency", kind: "section", icon: CheckCircle },
        { key: "grammar", label: "Grammar Polish", kind: "section", icon: Edit3 },
        { key: "summaries", label: "Scene Summaries", kind: "section", icon: FileText },
      ],
    },
    {
      label: "Faith & Legacy",
      items: [
        { key: "reflection", label: "Reflection Prompts", kind: "section", icon: Star },
        { key: "legacy", label: "Legacy Writing", kind: "section", icon: Layers },
      ],
    },
  ];

  return (
    <>
      {/* Backdrop on mobile */}
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
        aria-label="Grouped sidebar"
      >
        {/* Brand row */}
        <div className="flex items-center gap-2 px-3 pt-4 pb-3 border-b border-white/40">
          <BrandLogo className={`${collapsed ? "h-6" : "h-8"} w-auto`} />
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-serif text-lg font-bold text-ink" style={{ fontFamily: "Playfair Display, ui-serif, Georgia" }}>
                DahTruth
              </div>
              <div className="text-[11px] tracking-wide text-ink/70">Story Lab</div>
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

        {/* Grouped nav */}
        <nav className="h-[calc(100%-6.25rem)] overflow-y-auto px-2 pb-6 pt-2">
          {/* Back to dashboard (accent) */}
          <Link
            to="/dashboard"
            className={[
              "group relative mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-2",
              "border border-white/50 bg-ink text-white shadow",
              "hover:scale-[1.02] transition",
            ].join(" ")}
            title={collapsed ? "Back to Dashboard" : undefined}
          >
            <ChevronRight className="h-5 w-5 opacity-90" />
            {!collapsed && <span className="truncate">Back to Dashboard</span>}
          </Link>

          {/* Groups */}
          <div className="space-y-3">
            {groups.map((g) => (
              <div key={g.label} className="px-1">
                {/* Group header */}
                {!collapsed && (
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink/60">
                    {g.label}
                  </div>
                )}
                {/* Items */}
                <div className="mt-1 space-y-1">
                  {g.items.map((it) => {
                    const Icon = it.icon || null;
                    const active =
                      it.kind === "link"
                        ? isRoute(it.to)
                        : activeKey === it.key;

                    const base =
                      "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 outline-none transition-all duration-200 focus:ring-2 focus:ring-ink/20";
                    const activeCls =
                      "bg-white/50 text-ink shadow border border-white/60";
                    const inactive =
                      "text-ink/80 hover:bg-white/30 hover:shadow hover:scale-[1.02] border border-transparent";

                    const inner = (
                      <>
                        {/* Left dot */}
                        <span
                          className={`absolute left-1 h-2 w-2 rounded-full transition-all duration-200 ${
                            active ? "bg-amber-400 opacity-100" : "bg-ink/30 opacity-0 group-hover:opacity-100"
                          }`}
                        />
                        {Icon ? (
                          <Icon className={`h-5 w-5 ${active ? "opacity-100" : "opacity-90"}`} />
                        ) : (
                          <ClotheslineIcon className="h-5 w-5" />
                        )}
                        {!collapsed && <span className="truncate">{it.label}</span>}
                        {/* Shimmer */}
                        <span
                          className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100"
                          style={{
                            background:
                              "radial-gradient(60% 60% at 100% 0%, rgba(255,255,255,0.35), transparent)",
                          }}
                        />
                      </>
                    );

                    return it.kind === "link" ? (
                      <Link
                        key={it.key}
                        to={it.to}
                        className={`${base} ${active ? activeCls : inactive} border border-white/40`}
                        title={collapsed ? it.label : undefined}
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        key={it.key}
                        onClick={() => onSelect(it.key)}
                        className={`${base} ${active ? activeCls : inactive} border border-white/40`}
                        title={collapsed ? it.label : undefined}
                      >
                        {inner}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}

/* =========================
   Workshop Chat (quick stub)
========================= */
const WorkshopChat = () => {
  const [messages, setMessages] = useState([
    { id: 1, who: "Facilitator", text: "Welcome! Share one win from today’s draft." },
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
          Send
        </button>
      </div>
    </div>
  );
};

/* =========================
   Character Manager (inline)
========================= */
const CharacterManager = () => {
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  const add = () => {
    const v = newName.trim();
    if (!v) return;
    setNames((prev) => [...prev, v]);
    setNewName("");
  };
  const remove = (idx) => setNames((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="rounded-2xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg border border-white/60 bg-white/60 p-2">
          <Users className="h-5 w-5 text-ink/80" />
        </div>
        <h3 className="text-lg font-semibold text-ink">Character Manager</h3>
      </div>
      <div className="mb-3 flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add character name…"
          className="flex-1 rounded-lg border border-white/60 bg-white px-3 py-2 text-ink placeholder-ink/40 focus:border-ink/40 focus:outline-none"
        />
        <button onClick={add} className="rounded-lg border border-white/60 bg-accent/60 px-4 py-2 font-medium text-ink hover:bg-accent/70">
          Add
        </button>
      </div>
      <div className="grid gap-2">
        {names.length === 0 && <div className="text-sm text-ink/60">No characters yet.</div>}
        {names.map((n, i) => (
          <div key={`${n}-${i}`} className="flex items-center justify-between rounded-lg border border-white/60 bg-white/80 p-2">
            <div className="text-ink">{n}</div>
            <button onClick={() => remove(i)} className="rounded-md border border-white/60 bg-white px-2 py-1 text-xs text-ink/70 hover:text-ink">
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================
   MAIN
========================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState("schedule"); // default focus in Workshop Community
  const [chapters, setChapters] = useState([]);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("storylab_sidebar_collapsed") || "false");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      {/* Sidebar */}
      <GroupedSidebar
        collapsed={collapsed}
        setCollapsed={(v) => {
          setCollapsed(v);
          try {
            localStorage.setItem("storylab_sidebar_collapsed", JSON.stringify(v));
          } catch {}
        }}
        activeKey={activeKey}
        onSelect={setActiveKey}
      />

      {/* Content */}
      <div className={`transition-all duration-300 ${collapsed ? "md:ml-20" : "md:ml-72"}`}>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <PageBanner />

          {/* 1) Workshop Community */}
          <section id="workshop-community" className="mb-14">
            <SectionHeader
              icon="👥"
              title="Workshop Community"
              subtitle="Everything you’ll use together during live sessions."
            />
            <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Calendar}
                title="Session Schedule"
                description="Set and track the six-session arc, goals, and homework."
                onClick={() => setActiveKey("schedule")}
              />
              <FeatureCard
                icon={Users}
                title="Breakout Pairings"
                description="Auto/random assignments for partner work."
                onClick={() => setActiveKey("pairs")}
              />
              <FeatureCard
                icon={MessageSquare}
                title="Critique & Collaboration"
                description="Inline comments and real-time discussion."
                onClick={() => navigate("/story-lab/critique")}
              />
            </div>

            {/* Inline stubs for schedule/pairs/chat */}
            {activeKey === "schedule" && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur-xl mb-6">
                <div className="text-sm text-ink/70 mb-2">Session Schedule (stub)</div>
                <div className="grid gap-3 md:grid-cols-3">
                  {["Session 1", "Session 2", "Session 3"].map((s) => (
                    <div key={s} className="rounded-xl border border-white/60 bg-white p-4">
                      <div className="font-semibold text-ink mb-1">{s}</div>
                      <div className="text-sm text-ink/70">Goals, homework, notes…</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {activeKey === "pairs" && (
              <div className="rounded-2xl border border-white/60 bg-white/70 p-6 backdrop-blur-xl mb-6">
                <div className="text-sm text-ink/70 mb-2">Breakout Pairings (stub)</div>
                <div className="text-ink/80 text-sm">Randomize or lock pairs here.</div>
              </div>
            )}
            {activeKey === "chat" && <WorkshopChat />}
          </section>

          {/* 2) Live Session Modules (with quote) */}
          <section id="live-modules" className="mb-14">
            <SectionHeader
              icon="🧪"
              title="Live Session Modules"
              subtitle="Story-facing modules to use during sessions."
            />
            <QuoteBar chapters={chapters} />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              <FeatureCard
                icon={Sparkles}
                title="Story Prompts"
                description="Creative, context-aware prompts when you’re stuck."
                onClick={() => navigate("/story-lab/prompts")}
              />
              <FeatureCard
                icon={RouteIcon}
                title="Character Roadmap"
                description="Map growth of your main characters through sessions."
                onClick={() => navigate("/story-lab/workshop/roadmap")}
              />
              <FeatureCard
                icon={Heart}
                title="Hopes • Fears • Legacy"
                description="Focused columns for MC/Protagonist/Antagonist."
                onClick={() => navigate("/story-lab/workshop/hfl")}
              />
              <FeatureCard
                icon={ListChecks}
                title="Priority Cards"
                description="Brainstorm and organize what matters most."
                onClick={() => navigate("/story-lab/workshop/priorities")}
              />
              <FeatureCard
                icon={null /* custom */}
                title="Clothesline"
                description="Org-style character view along a clothesline."
                onClick={() => navigate("/story-lab/workshop/clothesline")}
              />
            </div>
          </section>

          {/* 3) Character Development (renamed) */}
          <section id="character-dev" className="mb-14">
            <SectionHeader
              icon="📖"
              title="Character Development"
              subtitle="Deeper craft tools outside of session time."
            />
            <div className="mb-8 grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={User}
                title="Character Profiles"
                description="Create detailed sheets and track relationships."
                onClick={() => setActiveKey("profiles")}
              />
              <FeatureCard
                icon={Globe}
                title="World Bible"
                description="Locations, settings, cultures, and timeline."
                onClick={() => setActiveKey("world")}
              />
              <FeatureCard
                icon={Heart}
                title="Hopes • Fears • Legacy"
                description="Keep refining your thematic motivators."
                onClick={() => navigate("/story-lab/workshop/hfl")}
              />
            </div>

            {/* Inline Character Manager panel */}
            <CharacterManager />
          </section>

          {/* 4) AI + Human Balance */}
          <section id="ai" className="mb-14">
            <SectionHeader icon="✨" title="AI + Human Balance" subtitle="Assistive tools that respect your voice." />
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon={CheckCircle}
                title="Character Consistency"
                description="Catch contradictions (e.g., eye color, voice)."
                onClick={() => setActiveKey("consistency")}
              />
              <FeatureCard
                icon={Edit3}
                title="Grammar Polish"
                description="Clarity and correctness without flattening your style."
                onClick={() => setActiveKey("grammar")}
              />
              <FeatureCard
                icon={FileText}
                title="Scene Summaries"
                description="Auto-generate summaries and track plot threads."
                onClick={() => setActiveKey("summaries")}
              />
            </div>
          </section>

          {/* 5) Faith & Legacy */}
          <section id="faith" className="mb-24">
            <SectionHeader icon="💝" title="Faith & Legacy" subtitle="Spiritual grounding and big-picture purpose." />
            <div className="grid gap-6 md:grid-cols-2">
              <FeatureCard
                icon={Star}
                title="Reflection Prompts"
                description="Daily questions to focus your heart before you write."
                onClick={() => setActiveKey("reflection")}
              />
              <FeatureCard
                icon={Layers}
                title="Legacy Writing"
                description="Shape work that serves readers beyond the moment."
                onClick={() => setActiveKey("legacy")}
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
              Open Critique
            </Link>
            <Link
              to="/story-lab/prompts"
              className="rounded-lg border border-white/60 bg-white/60 px-4 py-2 font-medium text-ink hover:bg-white/80"
            >
              Prompts
            </Link>
            <Link
              to="/story-lab/workshop"
              className="rounded-lg border border-white/60 bg-white/60 px-4 py-2 font-medium text-ink hover:bg-white/80"
            >
              Workshop Hub
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
