// src/lib/storylab/StoryLabLanding.jsx

import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map as MapIcon,
  Compass,
  Sparkles,
  BookOpenCheck,
  PenLine,
  Target,
  Heart,
  Brain,
  FolderKanban,
  LayoutGrid,
  CalendarClock,
  Quote,
  Settings,
  Moon,
  Sun,
  Users,
  MessageSquare,
  ListChecks,
  Menu,
  X,
} from "lucide-react";

const BASE = "/story-lab";

const MODULES = [
  { id: "prompts",     title: "Story Prompts",          blurb: "Context-aware sparks for stuck scenes.",   icon: Sparkles,   tint: "from-indigo-500/20 to-sky-500/20",   route: `${BASE}/prompts` },
  { id: "roadmap",     title: "Character Roadmap",      blurb: "Map growth arcs and pivotal beats.",       icon: MapIcon,    tint: "from-emerald-500/20 to-teal-500/20", route: `${BASE}/workshop/roadmap` },
  { id: "hopes",       title: "Hopes • Fears • Legacy", blurb: "Surface motives that drive choices.",      icon: Heart,      tint: "from-rose-500/20 to-fuchsia-500/20", route: `${BASE}/workshop/hfl` },
  { id: "priority",    title: "Priority Cards",         blurb: "Organize what matters most next.",         icon: Target,     tint: "from-amber-500/20 to-orange-500/20", route: `${BASE}/workshop/priorities` },
  { id: "clothesline", title: "Clothesline",            blurb: "Org-style cast view at a glance.",         icon: LayoutGrid, tint: "from-cyan-500/20 to-blue-500/20",    route: `${BASE}/workshop/clothesline` },
  { id: "narrative-arc", title: "Narrative Arc",        blurb: "Map emotional beats and structure.",       icon: Sparkles,   tint: "from-purple-500/20 to-indigo-500/20", route: `${BASE}/narrative-arc` },
];

const DEV_SECTIONS = [
  { id: "profiles", title: "Character Profiles", blurb: "Detailed sheets to track traits, wounds, and wants.", icon: Brain,        route: `${BASE}/characters`,        tint: "from-purple-500/20 to-indigo-500/20" },
  { id: "world",    title: "World Bible",        blurb: "Lore, locations, culture—organized and searchable.", icon: BookOpenCheck, route: `${BASE}/world`,             tint: "from-sky-500/20 to-cyan-500/20" },
  { id: "manager",  title: "Character Manager",  blurb: "Create, link, and reuse your cast.",                 icon: FolderKanban,  route: `${BASE}/character-manager`, tint: "from-emerald-500/20 to-lime-500/20" },
];

const NAV_LINKS = [
  { to: `${BASE}`,                      icon: Compass,    label: "Landing" },
  { to: `${BASE}/narrative-arc`,       icon: Sparkles,   label: "Narrative Arc" },
  { to: `${BASE}/prompts`,             icon: Sparkles,   label: "Story Prompts" },
  { to: `${BASE}/workshop/roadmap`,    icon: MapIcon,    label: "Character Roadmap" },
  { to: `${BASE}/workshop/hfl`,        icon: Heart,      label: "Hopes • Fears • Legacy" },
  { to: `${BASE}/workshop/priorities`, icon: ListChecks, label: "Priority Cards" },
  { to: `${BASE}/workshop/clothesline`,icon: LayoutGrid, label: "Clothesline" },
  { to: `${BASE}/community`,           icon: Users,      label: "Workshop Community" },
];

/* ============ Dynamic Quote (from saved chapters) ============ */
function useChapterSentences() {
  const [line, setLine] = React.useState("");
  const pick = React.useCallback(() => {
    try {
      const raw = localStorage.getItem("dahtruth-story-lab-toc-v3");
      const parsed = raw ? JSON.parse(raw) : null;
      const chapters = parsed?.chapters || [];
      const text = chapters
        .map((c) => c?.text || c?.content || c?.body || "")
        .join(" ")
        .replace(/\s+/g, " ");
      const sentences = text.match(/[^.!?]+[.!?]/g) || [];
      setLine(
        sentences.length
          ? sentences[Math.floor(Math.random() * sentences.length)].trim()
          : "These will come from your story… start writing and your words will appear here."
      );
    } catch {
      setLine("These will come from your story… start writing and your words will appear here.");
    }
  }, []);

  React.useEffect(() => {
    pick();
    const onStorage = (e) => e.key === "dahtruth-story-lab-toc-v3" && pick();
    window.addEventListener("storage", onStorage);
    window.addEventListener("chapters:updated", pick);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("chapters:updated", pick);
    };
  }, [pick]);

  return { line, refresh: pick };
}

function QuoteBarTop() {
  const { line, refresh } = useChapterSentences();
  return (
    <div className="md:ml-[21rem] px-4 pt-4">
      <div className="glass-soft px-5 py-4 flex items-center justify-between">
        <div className="italic text-ink">"{line}"</div>
        <button
          onClick={refresh}
          className="ml-4 rounded-xl border border-border bg-white px-3 py-1.5 text-sm text-ink hover:shadow"
          title="New quote from your story"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

/* ============ Desktop Sidebar (md+) ============ */
function DesktopSidebar() {
  const { pathname } = useLocation();

  const Item = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2 border transition
        ${pathname === to
          ? "bg-white border-border text-ink shadow"
          : "bg-white/70 border-border text-ink/80 hover:bg-white"}`}
    >
      <Icon className="size-5" />
      <span className="truncate">{label}</span>
    </Link>
  );

  return (
    <aside className="hidden md:block fixed left-0 top-0 z-40 h-screen w-80 p-4 border-r border-border bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-2 py-4">
        <img
          src="/DahTruthLogo.png"
          alt="DahTruth"
          className="h-16 w-auto rounded-md"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
        <div className="leading-tight">
          <div className="font-serif text-2xl font-bold text-ink">DahTruth</div>
          <div className="text-sm tracking-wide text-muted">Story Lab</div>
        </div>
      </div>

      <div className="mt-2 grid gap-2">
        {NAV_LINKS.map((l) => (
          <Item key={l.to} to={l.to} icon={l.icon} label={l.label} />
        ))}
      </div>
    </aside>
  );
}

/* ============ Mobile Sidebar (slide-in sheet) ============ */
function MobileSidebar({ open, setOpen }) {
  const { pathname } = useLocation();

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const Item = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2 border transition mb-1
        ${pathname === to
          ? "bg-white border-border text-ink shadow"
          : "bg-white/80 border-border text-ink/80 hover:bg-white"}`}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </Link>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-base border-r border-border p-3"
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="flex items-center justify-between px-1 py-2">
              <div className="flex items-center gap-2">
                <img
                  src="/DahTruthLogo.png"
                  alt="DahTruth"
                  className="h-7 w-auto rounded-md"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
                <span className="font-serif text-lg font-bold text-ink">DahTruth</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border bg-white px-2 py-1"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-2">
              {NAV_LINKS.map((l) => (
                <Item key={l.to} to={l.to} icon={l.icon} label={l.label} />
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ============ Banner Header ============ */
function DarkModeToggle() {
  const [dark, setDark] = React.useState(() =>
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("theme-dark")
  );
  React.useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border border-border bg-white hover:shadow"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? "Light" : "Dark"}
    </button>
  );
}

function BannerHeader({ onDashboard, onSettings, navigate }) {
  return (
    <div className="md:ml-[21rem] mt-1 sticky top-1 z-40 bg-gradient-to-r from-brand-navy/[.06] via-brand-gold/[.05] to-brand-rose/[.06] backdrop-blur-md rounded-lg ml-2 mr-2">
      {/* Main hero banner */}
      <div className="px-4 pt-8 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold tracking-tight"
        >
          Welcome to your <span className="text-primary">Story Journey</span>
        </motion.h1>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/journey")}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow"
          >
            <MapIcon className="size-5" /> Open Journey Map
          </button>
          <button
            onClick={() => navigate(`${BASE}/prompts`)}
            className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 glass"
          >
            <PenLine className="size-5" /> Quick Prompt
          </button>
          <CountdownStub />
        </div>
      </div>

      {/* Description + Actions row */}
      <div className="px-4 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.55 }}
          className="max-w-2xl text-muted"
        >
          Choose a path to begin. Each module is a step—prompts, roadmaps, priorities,
          and character views—designed to move your story forward with clarity and flow.
        </motion.p>

        {/* Right: actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm bg-brand-gold hover:bg-brand-gold/90 text-white font-semibold shadow"
            onClick={onDashboard}
            title="Back to Dashboard"
          >
            ← Dashboard
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm border border-border bg-white hover:shadow"
            onClick={onSettings}
          >
            <Settings className="size-4" /> Settings
          </button>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}

/* ============ Small bits ============ */
function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-ink">{title}</h2>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  );
}

function CountdownStub() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 border border-border bg-white/80 text-ink">
      <CalendarClock className="size-4" />
      <span className="text-sm">Next session in 2 days</span>
    </div>
  );
}

function CommunityStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Link to={`${BASE}/community`} className="glass-soft p-4 flex items-start gap-3">
        <Users className="size-5 text-primary" />
        <div>
          <div className="font-semibold text-ink">Workshop Community</div>
          <div className="text-sm text-muted">Sessions, pairings, critique hub.</div>
        </div>
      </Link>
      <Link to={`${BASE}/workshop`} className="glass-soft p-4 flex items-start gap-3">
        <Compass className="size-5 text-primary" />
        <div>
          <div className="font-semibold text-ink">Workshop Manager</div>
          <div className="text-sm text-muted">Launch modules & manage flow.</div>
        </div>
      </Link>
      <Link to={`${BASE}/community`} className="glass-soft p-4 flex items-start gap-3">
        <MessageSquare className="size-5 text-primary" />
        <div>
          <div className="font-semibold text-ink">Critique Room</div>
          <div className="text-sm text-muted">Open live critique.</div>
        </div>
      </Link>
    </div>
  );
}

/* ============ Page ============ */
export default function StoryLabLanding() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-[100dvh] bg-base bg-radial-fade text-ink">
      {/* Sidebar */}
      <DesktopSidebar />
      <MobileSidebar open={mobileOpen} setOpen={setMobileOpen} />

      {/* Banner header - NEW DESIGN */}
      <BannerHeader
        onDashboard={() => navigate("/dashboard")}
        onSettings={() => navigate("/settings")}
        navigate={navigate}
      />

      {/* Quote - now comes after the banner */}
      <QuoteBarTop />

      {/* Community strip */}
      <section className="md:ml-[21rem] px-4 pb-4 pt-4">
        <CommunityStrip />
      </section>

      {/* Toolbelt: Live Session Modules */}
      <section className="md:ml-[21rem] px-4 py-6">
        <SectionHeader
          title="Live Session Modules"
          subtitle="Your facilitator toolkit—fast access during sessions."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((m, i) => (
            <motion.button
              key={m.id}
              onClick={() => navigate(m.route)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.04 }}
              className="group relative overflow-hidden glass-panel p-4 text-left"
            >
              <div className={`absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br ${m.tint} blur-2xl`} />
              <div className="flex items-start gap-3 relative">
                <div className="shrink-0 rounded-xl bg-white p-2 border border-border">
                  <m.icon className="size-5 text-ink" />
                </div>
                <div>
                  <div className="font-semibold text-ink">{m.title}</div>
                  <div className="text-sm text-muted mt-1">{m.blurb}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-primary text-sm opacity-0 group-hover:opacity-100 transition">
                Continue <Compass className="size-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Development: Character + World */}
      <section className="md:ml-[21rem] px-4 pb-16">
        <SectionHeader
          title="Character Development"
          subtitle="Deeper craft tools for focused work outside live sessions."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEV_SECTIONS.map((s, i) => (
            <motion.button
              key={s.id}
              onClick={() => navigate(s.route)}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden glass-panel p-4 text-left"
            >
              <div className={`absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br ${s.tint} blur-2xl`} />
              <div className="flex items-start gap-3 relative">
                <div className="shrink-0 rounded-xl bg-white p-2 border border-border">
                  <s.icon className="size-5 text-ink" />
                </div>
                <div>
                  <div className="font-semibold text-ink">{s.title}</div>
                  <div className="text-sm text-muted mt-1">{s.blurb}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="md:ml-[21rem] px-4 pb-16 text-xs text-muted">
        © {new Date().getFullYear()} DahTruth • Where Truth is Written
      </footer>
    </div>
  );
}
