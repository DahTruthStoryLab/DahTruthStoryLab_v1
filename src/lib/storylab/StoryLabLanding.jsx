import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Map as MapIcon, // ✅ alias Map to avoid conflicts
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
  Sun
} from "lucide-react";

/**
 * StoryLab Journey Landing
 * -----------------------------------------------------------
 * Landing page for StoryLab with journey map + modules.
 * Tailwind CSS + Framer Motion required.
 */

const BASE = "/story-lab";

const MODULES = [
  {
    id: "prompts",
    title: "Story Prompts",
    blurb: "Context-aware sparks for stuck scenes.",
    icon: Sparkles,
    tint: "from-indigo-500/20 to-sky-500/20",
    route: `${BASE}/prompts`,
  },
  {
    id: "roadmap",
    title: "Character Roadmap",
    blurb: "Map growth arcs and pivotal beats.",
    icon: MapIcon,
    tint: "from-emerald-500/20 to-teal-500/20",
    route: `${BASE}/workshop/roadmap`,
  },
  {
    id: "hopes",
    title: "Hopes • Fears • Legacy",
    blurb: "Surface motives that drive choices.",
    icon: Heart,
    tint: "from-rose-500/20 to-fuchsia-500/20",
    route: `${BASE}/workshop/hfl`,
  },
  {
    id: "priority",
    title: "Priority Cards",
    blurb: "Organize what matters most next.",
    icon: Target,
    tint: "from-amber-500/20 to-orange-500/20",
    route: `${BASE}/workshop/priorities`,
  },
  {
    id: "clothesline",
    title: "Clothesline",
    blurb: "Org-style cast view at a glance.",
    icon: LayoutGrid,
    tint: "from-cyan-500/20 to-blue-500/20",
    route: `${BASE}/workshop/clothesline`,
  },
];

const DEV_SECTIONS = [
  {
    id: "profiles",
    title: "Character Profiles",
    blurb: "Detailed sheets to track traits, wounds, and wants.",
    icon: Brain,
    route: `${BASE}/characters`,
    tint: "from-purple-500/20 to-indigo-500/20",
  },
  {
    id: "world",
    title: "World Bible",
    blurb: "Lore, locations, culture—organized and searchable.",
    icon: BookOpenCheck,
    route: `${BASE}/world`,
    tint: "from-sky-500/20 to-cyan-500/20",
  },
  {
    id: "manager",
    title: "Character Manager",
    blurb: "Create, link, and reuse your cast.",
    icon: FolderKanban,
    route: `${BASE}/character-manager`,
    tint: "from-emerald-500/20 to-lime-500/20",
  },
];

export default function StoryLabLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#0b1220] via-[#0b1220] to-[#0b1220]/95 dark:from-[#0a0a0a] text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/5 bg-white/0 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="size-5" />
            <span className="font-semibold tracking-wide">DahTruth • StoryLab</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/10"
              onClick={() => navigate("/settings")}
            >
              <Settings className="size-4" /> Settings
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </div>

      {/* Hero / Journey Map */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.25),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 relative">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold tracking-tight"
          >
            Welcome to your <span className="text-sky-300">Story Journey</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.55 }}
            className="mt-3 max-w-2xl text-slate-300"
          >
            Choose a path to begin. Each module is a step—prompts, roadmaps, priorities,
            and character views—designed to move your story forward with clarity and flow.
          </motion.p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate("/journey")}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-sky-500/90 hover:bg-sky-400 text-slate-900 font-semibold shadow-lg shadow-sky-700/20"
            >
              <MapIcon className="size-5" /> Open Journey Map
            </button>
            <button
              onClick={() => navigate(`${BASE}/prompts`)}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/10"
            >
              <PenLine className="size-5" /> Quick Prompt
            </button>
            <CountdownStub />
          </div>
        </div>
      </section>

      {/* Toolbelt: Live Session Modules */}
      <section className="mx-auto max-w-7xl px-4 py-8">
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
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 text-left`}
            >
              <div className={`absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br ${m.tint} blur-2xl`} />
              <div className="flex items-start gap-3 relative">
                <div className="shrink-0 rounded-xl bg-white/10 p-2 border border-white/10">
                  <m.icon className="size-5" />
                </div>
                <div>
                  <div className="font-semibold">{m.title}</div>
                  <div className="text-sm text-slate-300 mt-1">{m.blurb}</div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sky-300 text-sm opacity-0 group-hover:opacity-100 transition">
                Continue <Compass className="size-4" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Development: Character + World */}
      <section className="mx-auto max-w-7xl px-4 pb-10">
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
              className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 text-left`}
            >
              <div className={`absolute -top-10 -right-10 size-36 rounded-full bg-gradient-to-br ${s.tint} blur-2xl`} />
              <div className="flex items-start gap-3 relative">
                <div className="shrink-0 rounded-xl bg-white/10 p-2 border border-white/10">
                  <s.icon className="size-5" />
                </div>
                <div>
                  <div className="font-semibold">{s.title}</div>
                  <div className="text-sm text-slate-300 mt-1">{s.blurb}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Quote Banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/60 to-slate-900/60">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12),transparent_60%)]" />
          <div className="p-6 md:p-8 relative">
            <div className="flex items-center gap-3 text-sky-300">
              <Quote className="size-5" />
              <span className="uppercase tracking-wider text-xs">Today's Spark</span>
            </div>
            <p className="mt-3 text-lg md:text-xl text-slate-200">
              “There is no greater agony than bearing an untold story inside you.”
              <span className="text-slate-400"> — Maya Angelou</span>
            </p>
          </div>
        </div>
      </section>

      {/* Footer note */}
      <footer className="mx-auto max-w-7xl px-4 pb-10 text-xs text-slate-400">
        © {new Date().getFullYear()} DahTruth • Where Truth is Written
      </footer>
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold text-slate-100">{title}</h2>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function CountdownStub() {
  // This is a stylistic stub; wire to real data later.
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl px-3 py-1.5 border border-white/10 bg-white/5 text-slate-200">
      <CalendarClock className="size-4" />
      <span className="text-sm">Next session in 2 days</span>
    </div>
  );
}

function DarkModeToggle() {
  const [dark, setDark] = React.useState(
    typeof window !== "undefined" && document.documentElement.classList.contains("dark")
  );

  React.useEffect(() => {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm bg-white/10 hover:bg-white/15 border border-white/10"
      aria-label="Toggle dark mode"
    >
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />} {dark ? "Light" : "Dark"}
    </button>
  );
}
