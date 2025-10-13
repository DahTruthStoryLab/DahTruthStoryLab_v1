// src/components/storylab/StoryLabLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

/* Simple dark mode toggle (safe if SSR ever appears) */
function DarkModeToggle() {
  const initial = typeof document !== "undefined" &&
    document.documentElement.classList.contains("theme-dark");
  const [dark, setDark] = React.useState(initial);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("theme-dark", dark);
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="px-3 py-2 rounded-lg bg-white/60 border border-border hover:bg-white"
      title="Toggle dark mode"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}

export default function StoryLabLayout() {
  const navigate = useNavigate();

  const itemClass = ({ isActive }) =>
    `block px-3 py-2 rounded transition ${
      isActive ? "bg-primary/20 text-ink font-semibold" : "hover:bg-black/5"
    }`;

  return (
    <div className="min-h-screen flex bg-base text-ink">
      {/* StoryLab-only sidebar */}
      <aside className="w-64 p-4 border-r border-border bg-white/70 backdrop-blur-md">
        <nav className="space-y-2">
          <div className="text-xs font-bold text-muted uppercase">StoryLab</div>
          <NavLink to="/story-lab" className={itemClass}>Overview</NavLink>
          <NavLink to="/story-lab/narrative-arc" className={itemClass}>Narrative Arc</NavLink>
          <NavLink to="/story-lab/workshop/priorities" className={itemClass}>Priority Cards</NavLink>
          <NavLink to="/story-lab/workshop/roadmap" className={itemClass}>Character Roadmap</NavLink>
          <NavLink to="/story-lab/workshop/clothesline" className={itemClass}>Clothesline</NavLink>
          <NavLink to="/story-lab/workshop/hfl" className={itemClass}>Hopes • Fears • Legacy</NavLink>
          <NavLink to="/story-lab/community" className={itemClass}>Cohort</NavLink>
        </nav>
      </aside>

      {/* Header + outlet */}
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-xl font-semibold text-ink text-center flex-1">StoryLab</h1>
            <div className="flex-1 flex items-center justify-end gap-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-3 py-2 rounded-lg bg-brand-gold text-white hover:opacity-90"
                title="Back to Dashboard"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => alert("Open StoryLab settings…")}
                className="px-3 py-2 rounded-lg bg-white/60 border border-border hover:bg-white"
                title="Settings"
              >
                Settings
              </button>
              <DarkModeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
