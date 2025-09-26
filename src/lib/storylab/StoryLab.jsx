// src/lib/storylab/StoryLab.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft, BookOpen, Users, Pin, Sparkles, Calendar, Clock, ChevronRight, Plus,
  Layers, Edit3, Trash2, Globe, Shield, Heart, Star, CheckCircle, FileText,
  MessageSquare, User
} from "lucide-react";
import BrandLogo from "../../components/BrandLogo"; // ✅ logo component

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
  (txt || "")
    .replace(/\s+/g, " ")
    .match(/[^.!?]+[.!?]?/g) || [];

function guessCharacters(text) {
  const names = new Set();
  const tokens = (text || "").match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) || [];
  tokens.forEach((t) => {
    if (!["I", "The", "A", "And", "But"].includes(t)) names.add(t.trim());
  });
  return Array.from(names).slice(0, 50);
}

function extractConflicts(text) {
  const hits = [];
  const needles = ["conflict","tension","argument","fight","feud","rivalry","obstacle","problem","challenge"];
  const sentences = splitSentences(text);
  sentences.forEach((s) => {
    if (needles.some((n) => s.toLowerCase().includes(n))) hits.push(s.trim());
  });
  return hits;
}

function extractKeywordSentences(text, keyword) {
  const k = keyword.toLowerCase();
  return splitSentences(text).filter((s) => s.toLowerCase().includes(k));
}

/* =========================================================
   TOP BANNER (navy) — now with BrandLogo in the left block
========================================================= */
const TopBanner = ({ navigate, toggleMobileSidebar }) => {
  return (
    <div className="sticky top-0 z-50 bg-[#0b1220] border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* LEFT: mobile menu + logo + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
              aria-label="Toggle menu"
            >
              <span>☰</span>
            </button>
            <BrandLogo className="h-7 w-auto" />
            <div className="font-extrabold tracking-wide">Story Lab</div>
          </div>

          {/* CENTER: subtitle (hidden on small) */}
          <div className="text-center hidden md:block">
            <div className="text-sm text-slate-300">Creative Workshop</div>
            <div className="text-lg font-semibold text-slate-100">DahTruth Platform</div>
          </div>

          {/* RIGHT: back button */}
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 text-sm font-medium text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   AERO SIDEBAR (glassmorphism)
   - fixed under the TopBanner (top: 4rem)
   - collapsible (stores preference in localStorage)
   - highlights active item
   - now shows small logo row at the top
========================================================= */
function AeroSidebar({
  collapsed,
  setCollapsed,
  activeSection,
  setActiveSection,
}) {
  const location = useLocation();

  // Persist collapsed preference
  useEffect(() => {
    try {
      localStorage.setItem("storylab_sidebar_collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const itemsTop = [
    { key: "home",    label: "Story Lab Home", to: "/story-lab", icon: BookOpen, type: "link" },
    { key: "prompts", label: "Prompts",        to: "/story-lab/prompts", icon: Sparkles, type: "link" },
    // Section toggles on this page:
    { key: "clothesline", label: "Clothesline", icon: Pin, type: "section", section: "clothesline" },
    { key: "hfl",         label: "Hopes • Fears • Legacy", icon: Heart, type: "section", section: "hfl" },
    { key: "critique",    label: "Critique Circle", to: "/story-lab/critique", icon: MessageSquare, type: "link", accent: true },
  ];

  const isActiveRoute = (to) => location.pathname === to;
  const isActiveSection = (key) => activeSection === key;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 md:hidden ${collapsed ? "pointer-events-none opacity-0" : "opacity-100"}`}
        onClick={() => setCollapsed(true)}
        aria-hidden="true"
      />

      <aside
        className={[
          "fixed z-50 md:z-30 left-0 top-16 h-[calc(100vh-4rem)]",
          "backdrop-blur-xl bg-white/10 border-r border-white/10",
          "shadow-[0_8px_40px_-10px_rgba(2,132,199,0.35)]",
          "transition-all duration-300 ease-out",
          collapsed ? "w-20 -translate-x-0 md:translate-x-0 -left-64 md:left-0 md:w-20" : "w-72 left-0",
          "md:translate-x-0",
          "overflow-hidden"
        ].join(" ")}
        aria-label="Aero menu sidebar"
      >
        {/* Small brand row */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <BrandLogo className={`${collapsed ? "h-6" : "h-7"} w-auto`} />
          {!collapsed && <span className="text-sm font-semibold text-white/90">DahTruth</span>}
        </div>

        {/* Collapse/expand trigger (desktop) */}
        <div className="hidden md:flex items-center justify-end p-2">
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg px-2 py-1 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100"
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>

        {/* Menu groups */}
        <nav className="px-2 pb-3 overflow-y-auto h-[calc(100%-3rem)]">
          <div className="mt-2 space-y-1">
            {itemsTop.map((it) => {
              const Icon = it.icon;
              const active =
                (it.type === "link" && isActiveRoute(it.to)) ||
                (it.type === "section" && isActiveSection(it.section));

              const base =
                "group flex items-center gap-3 w-full rounded-xl px-3 py-2 transition-colors outline-none focus:ring-2 focus:ring-sky-500/60";
              const activeCls = it.accent
                ? "bg-sky-600/95 text-white shadow-lg shadow-sky-900/30 border border-sky-500"
                : "bg-white/15 text-white border border-white/20";
              const inactive =
                "text-slate-100/90 hover:text-white hover:bg-white/10 border border-transparent";

              const inner = (
                <>
                  <Icon className={`w-5 h-5 ${active ? "" : "opacity-90"}`} />
                  {!collapsed && <span className="truncate">{it.label}</span>}
                </>
              );

              return it.type === "link" ? (
                <Link
                  key={it.key}
                  to={it.to}
                  className={`${base} ${active ? activeCls : inactive}`}
                  title={collapsed ? it.label : undefined}
                >
                  {inner}
                </Link>
              ) : (
                <button
                  key={it.key}
                  onClick={() => setActiveSection(it.section)}
                  className={`${base} ${active ? activeCls : inactive}`}
                  title={collapsed ? it.label : undefined}
                >
                  {inner}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-4 border-t border-white/10" />

          {/* Bottom tiny legend */}
          <div className={`px-3 ${collapsed ? "hidden" : "block"}`}>
            <p className="text-[11px] leading-4 text-slate-100/70">
              • Glassy “Aero” menu • Blur • Light-blue accents • Collapsible
            </p>
          </div>
        </nav>
      </aside>
    </>
  );
}

/* =========================================================
   FEATURE CARDS (dark)
========================================================= */
const FeatureCard = ({ icon: Icon, title, status, description, onClick }) => {
  const statusColors = {
    Ready: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
    Beta: "bg-sky-500/20 text-sky-200 border-sky-400/30",
    "Coming Soon": "bg-slate-600/30 text-slate-300 border-slate-500/40",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl border border-slate-700">
            <Icon className="w-6 h-6 text-sky-300" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-100 mb-2">{title}</h3>
            {status && (
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}
              >
                {status}
              </span>
            )}
          </div>
        </div>
        {/* fixed typo: text-slate-200 */}
        <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-slate-100 transition-colors mt-1" />
      </div>
      <p className="text-slate-300 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const SectionHeader = ({ icon, title, subtitle }) => {
  return (
    <div className="flex items-start gap-3 mb-8">
      <div className="p-3 bg-sky-600/20 rounded-xl border border-sky-700">
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-slate-100 mb-2">{title}</h2>
        {subtitle && <p className="text-slate-300">{subtitle}</p>}
      </div>
    </div>
  );
};

/* =========================================================
   CHARACTER MANAGER (dark)
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
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Character Manager</h3>

      <div className="space-y-3 mb-4">
        {characters.length === 0 && (
          <div className="text-slate-400 text-sm">No characters found yet. Add them below.</div>
        )}
        {characters.map((character) => (
          <div
            key={character.id}
            className="flex items-center gap-3 bg-slate-900/60 rounded-lg p-3 border border-slate-700"
          >
            {editingId === character.id ? (
              <input
                type="text"
                defaultValue={character.name}
                onBlur={(e) => updateCharacter(character.id, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && updateCharacter(character.id, e.currentTarget.value)}
                className="flex-1 bg-transparent border-b border-sky-500 text-slate-100 outline-none"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setEditingId(character.id)}
                className="flex-1 text-slate-100 cursor-pointer hover:text-sky-300"
                title="Click to edit"
              >
                {character.name}
              </span>
            )}
            <button
              onClick={() => deleteCharacter(character.id)}
              className="text-rose-400/80 hover:text-rose-300 transition-colors"
              title="Delete character"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add new character..."
          value={newCharacter}
          onChange={(e) => setNewCharacter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCharacter()}
          className="flex-1 px-4 py-2 bg-slate-900/60 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-400 focus:border-sky-500 focus:outline-none"
        />
        <button
          onClick={addCharacter}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* =========================================================
   WORKSHOP PANELS (dark)
========================================================= */
const StoryPromptsWorkshop = ({ chapters, characters }) => {
  const fullText = useMemo(() => chapters.map((c) => c.text).join("\n\n"), [chapters]);

  const prompts = useMemo(() => {
    const out = [];
    (characters || []).slice(0, 8).forEach((ch) => {
      out.push(`Explore the backstory of ${ch}.`);
      out.push(`What does ${ch} fear the most? Write a scene that reveals it implicitly.`);
    });
    const conflicts = extractConflicts(fullText);
    if (conflicts.length) {
      out.push(`What happens if this conflict escalates further: "${conflicts[0]}".`);
    }
    const hopes = extractKeywordSentences(fullText, "hope");
    const fears = extractKeywordSentences(fullText, "fear");
    const legacy = extractKeywordSentences(fullText, "legacy");

    if (hopes[0]) out.push(`Write a scene where this hope comes true: "${hopes[0]}".`);
    if (fears[0]) out.push(`Force the protagonist to confront this fear: "${fears[0]}".`);
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
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Story Prompts Workshop</h3>
      <p className="text-slate-400 mb-4">Prompts generated from your story chapters and characters.</p>
      {prompts.length === 0 ? (
        <div className="text-slate-400">No prompts yet. Add chapters first.</div>
      ) : (
        <ul className="grid md:grid-cols-2 gap-3">
          {prompts.map((p, i) => (
            <li key={i} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700 text-slate-100">
              • {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const ClotheslineWorkshop = ({ characters }) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
      <h3 className="text-xl font-semibold text-slate-100 mb-2">Clothes Pin Workshop</h3>
      <p className="text-slate-400 mb-4">Pin quick synopses for each character.</p>
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        {(characters?.length ? characters : ["Protagonist", "Antagonist"]).map((name, idx) => (
          <div key={idx} className="min-w-[220px] bg-slate-900/60 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-sky-300" />
              <div className="font-semibold text-slate-100">{name}</div>
            </div>
            <p className="text-sm text-slate-200/90">
              {name} plays a key role in the story. Summarize traits, goals, and obstacles here.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

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
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-slate-800">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">Hopes, Fears & Legacy Workshop</h3>
      {(!characters || characters.length === 0) && (
        <div className="text-slate-400 mb-3">Add characters above to see targeted insights.</div>
      )}
      <div className="space-y-4">
        {Object.entries(insights).map(([name, data]) => (
          <div key={name} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="font-semibold text-slate-100 mb-2">{name}</div>
            <div className="grid md:grid-cols-3 gap-3">
              {["Hopes","Fears","Legacy"].map((key) => (
                <div key={key} className="rounded-lg bg-black/30 p-3 border border-slate-800">
                  <div className="text-slate-100 text-sm font-medium mb-2">{key}</div>
                  {data[key] && data[key].length ? (
                    <ul className="space-y-2 text-slate-200 text-sm">
                      {data[key].map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  ) : (
                    <div className="text-slate-400 text-sm">No {key.toLowerCase()} found yet.</div>
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
   MAIN COMPONENT (with Aero sidebar)
========================================================= */
export default function StoryLab() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview"); // "overview" | "clothesline" | "hfl"
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

  // Proper mobile toggle (opens/closes overlay sidebar)
  const toggleMobileSidebar = () => setMobileSidebarHidden((v) => !v);

  useEffect(() => {
    setChapters(loadChaptersFromLocalStorage());
  }, []);

  const aiFeatures = [
    { icon: Sparkles, title: "Story Prompts", status: "Ready", description: "Get creative AI-generated prompts tailored to your story's theme and chapter." },
    { icon: CheckCircle, title: "Character Consistency", status: "Coming Soon", description: "AI checks for character inconsistencies like changing eye color or contradictions." },
    { icon: Edit3, title: "Grammar Polish", status: "Coming Soon", description: "Smart grammar and clarity suggestions that preserve your unique voice." },
    { icon: FileText, title: "Scene Summaries", status: "Ready", description: "Auto-generate chapter summaries and track plot threads." },
  ];

  const storyFeatures = [
    { icon: User, title: "Character Profiles", status: "Beta", description: "Create detailed character sheets and track relationships." },
    { icon: Pin, title: "Character Clothesline", status: "Ready", description: "Pin and track traits, obstacles, and changes." },
    { icon: Globe, title: "World Bible", status: "Beta", description: "Locations, cultures, and timelines that grow as you write." },
    { icon: Shield, title: "Continuity Alerts", status: "Coming Soon", description: "Get notified when you break continuity rules mid-story." },
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
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      {/* Top banner with working mobile toggle + logo */}
      <TopBanner navigate={navigate} toggleMobileSidebar={toggleMobileSidebar} />

      {/* Aero Sidebar */}
      <div className="md:block">
        <AeroSidebar
          // If mobile overlay is visible, treat as expanded even if desktop preference is "collapsed"
          collapsed={sidebarCollapsed && mobileSidebarHidden}
          setCollapsed={(v) => {
            setSidebarCollapsed(v);
            setMobileSidebarHidden(true); // closing also hides the mobile overlay
          }}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </div>

      {/* Content wrapper: left margin equals sidebar width on md+ */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-72"}`}>
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              The All-in-One Writing Platform
            </h1>
            <p className="text-lg text-slate-300 mb-8">
              Where creativity meets discipline. Blend AI, community support, character tracking,
              and faith-based reflection in one seamless writing experience.
            </p>

            {/* Feature Pills (light-blue) */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-600 text-white">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Assistance</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-600 text-white">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Writing Community</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-600 text-white">
                <Layers className="w-4 h-4" />
                <span className="text-sm font-medium">Organization Tools</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-sky-600 text-white">
                <Heart className="w-4 h-4" />
                <span className="text-sm font-medium">Faith Integration</span>
              </div>
            </div>
          </div>

          {/* Chapter Info Bar */}
          {chapters.length > 0 && (
            <div className="mb-12 p-4 bg-white/5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3 text-slate-200">
                <BookOpen className="w-5 h-5" />
                <span>
                  {chapters.length} chapter{chapters.length > 1 ? "s" : ""} loaded from your story
                </span>
              </div>
            </div>
          )}

          {/* Lab Sessions */}
          <section className="mb-16">
            <SectionHeader
              icon="🧪"
              title="Lab Sessions"
              subtitle="Interactive workshops that analyze your story and support collaboration."
            />
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              {/* Story Prompts Workshop */}
              <Link
                to="/story-lab/prompts"
                className="rounded-2xl p-5 border text-left bg-sky-600 text-white hover:bg-sky-500 border-sky-500 transition-all block"
              >
                <div className="text-lg font-semibold mb-1">Story Prompts Workshop</div>
                <div className="text-sm opacity-90">
                  Smart prompts based on your story structure and content.
                </div>
              </Link>

              {/* Clothesline */}
              <button
                onClick={() => setActiveSection("clothesline")}
                className={`rounded-2xl p-5 border text-left transition-all ${
                  activeSection === "clothesline"
                    ? "bg-sky-600 text-white border-sky-500"
                    : "bg-white/5 text-slate-100 border-slate-800 hover:bg-white/10"
                }`}
              >
                <div className="text-lg font-semibold mb-1">Clothes Pin Workshop</div>
                <div className="text-sm text-slate-300">Visual cards to summarize characters and roles.</div>
              </button>

              {/* Hopes, Fears & Legacy */}
              <button
                onClick={() => setActiveSection("hfl")}
                className={`rounded-2xl p-5 border text-left transition-all ${
                  activeSection === "hfl"
                    ? "bg-sky-600 text-white border-sky-500"
                    : "bg-white/5 text-slate-100 border-slate-800 hover:bg-white/10"
                }`}
              >
                <div className="text-lg font-semibold mb-1">Hopes, Fears & Legacy</div>
                <div className="text-sm text-slate-300">Pulls sentences that reveal drives and long-term aims.</div>
              </button>
            </div>

            {/* Critique Circle CTA */}
            <div className="mb-8">
              <Link
                to="/story-lab/critique"
                className="block rounded-2xl p-5 border bg-sky-600 text-white hover:bg-sky-500 border-sky-500 transition-all"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 mt-1" />
                  <div>
                    <div className="text-lg font-semibold mb-1">Critique Circle</div>
                    <div className="text-sm opacity-90">
                      Secure peer review with inline comments, reactions, copy-controls, and an audit log.
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Active workshop panels */}
            {activeSection === "clothesline" && (
              <ClotheslineWorkshop characters={workshopCharacters} />
            )}
            {activeSection === "hfl" && (
              <HopesFearsLegacyWorkshop chapters={chapters} characters={workshopCharacters} />
            )}
          </section>

          {/* AI + Human Balance */}
          <section className="mb-12">
            <SectionHeader
              icon="✨"
              title="AI + Human Balance"
              subtitle="AI that assists without overtaking your unique voice"
            />
            <div className="grid gap-6 md:grid-cols-2">
              {aiFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </section>

          {/* Story & Character Development */}
          <section className="mb-12">
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

            {/* Character Manager */}
            <CharacterManager
              seedText={chapters.map((c) => c.text).join("\n\n")}
              onChange={setWorkshopCharacters}
            />
          </section>

          {/* Workshop Community */}
          <section className="mb-12">
            <SectionHeader
              icon="👥"
              title="Workshop Community"
              subtitle="Collaborative writing sessions and accountability"
            />
            <div className="grid gap-6 md:grid-cols-3">
              {workshopFeatures.map((feature, idx) => (
                <FeatureCard key={idx} {...feature} />
              ))}
            </div>
          </section>

          {/* Faith + Legacy */}
          <section className="mb-24">
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

      {/* Quick Actions Bar (dark) */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0b1220]/95 backdrop-blur-xl border-t border-slate-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/story-lab/critique"
              className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-medium transition-all shadow-lg"
            >
              Open Critique Circle
            </Link>
            <Link
              to="/story-lab/prompts"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-100 rounded-lg font-medium transition-all border border-slate-800"
            >
              View Prompts
            </Link>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Next session in 2 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}
