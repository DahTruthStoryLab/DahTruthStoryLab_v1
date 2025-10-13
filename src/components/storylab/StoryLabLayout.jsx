// src/components/storylab/StoryLabLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";

function DarkModeToggle() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("theme-dark")
  );
  React.useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="px-3 py-2 rounded-lg bg-white/60 border border-border hover:bg-white"
      title="Toggle dark mode"
    >
      {dark ? "Light" : "Dark"}
    </button>
  );
}

export default function StoryLabLayout() {
  return <Outlet />;
}

  const base =
    "block rounded px-3 py-2 transition hover:bg-black/5 aria-[current=page]:bg-white aria-[current=page]:shadow aria-[current=page]:border aria-[current=page]:border-border";

  return (
    <div className="min-h-screen flex bg-base text-ink">
      {/* Sidebar */}
      <aside className="w-64 p-4 border-r bg-white/70 backdrop-blur-md">
        <nav className="space-y-2">
          <div className="text-xs font-bold text-muted uppercase">StoryLab</div>

          {/* RELATIVE links (no leading /) */}
          <NavLink to="." end className={base}>
            Overview
          </NavLink>
          <NavLink to="narrative-arc" className={base}>
            Narrative Arc
          </NavLink>
          <NavLink to="workshop/priorities" className={base}>
            Priority Cards
          </NavLink>
          <NavLink to="workshop/roadmap" className={base}>
            Character Roadmap
          </NavLink>
          <NavLink to="workshop/clothesline" className={base}>
            Clothesline
          </NavLink>
          <NavLink to="workshop/hfl" className={base}>
            Hopes • Fears • Legacy
          </NavLink>
          <NavLink to="community" className={base}>
            Cohort
          </NavLink>
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-white/80 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex-1" />
            <h1 className="text-xl font-semibold text-ink text-center flex-1">
              StoryLab
            </h1>
            <div className="flex-1 flex items-center justify-end gap-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="px-3 py-2 rounded-lg bg-brand-gold text-white hover:opacity-90"
                title="Back to Dashboard"
              >
                ← Dashboard
              </button>
              <button
                onClick={() => navigate("/settings")}
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
