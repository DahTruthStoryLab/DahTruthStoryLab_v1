import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom"; 

const StoryLabLayout = lazy(() => import("./components/storylab/StoryLabLayout.jsx"));
const NarrativeArc   = lazy(() => import("./components/storylab/NarrativeArc.jsx"));


function DarkModeToggle() {
  const [dark, setDark] = React.useState(() =>
    document.documentElement.classList.contains("theme-dark")
  );
  React.useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", dark);
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
  return (
    <div className="min-h-screen flex bg-base text-ink">
      {/* StoryLab-only sidebar */}
      <aside className="w-64 p-4 border-r bg-white/70 backdrop-blur-md">
        <nav className="space-y-2">
          <div className="text-xs font-bold text-muted uppercase">StoryLab</div>
          <NavLink to="/story-lab" className="block px-3 py-2 rounded hover:bg-black/5">Overview</NavLink>
          <NavLink to="/story-lab/narrative-arc" className="block px-3 py-2 rounded hover:bg-black/5">Narrative Arc</NavLink>
          <NavLink to="/story-lab/workshop/priorities" className="block px-3 py-2 rounded hover:bg-black/5">Priority Cards</NavLink>
          <NavLink to="/story-lab/workshop/roadmap" className="block px-3 py-2 rounded hover:bg-black/5">Character Roadmap</NavLink>
          <NavLink to="/story-lab/workshop/clothesline" className="block px-3 py-2 rounded hover:bg-black/5">Clothesline</NavLink>
          <NavLink to="/story-lab/workshop/hfl" className="block px-3 py-2 rounded hover:bg-black/5">Hopes • Fears • Legacy</NavLink>
          <NavLink to="/story-lab/community" className="block px-3 py-2 rounded hover:bg-black/5">Cohort</NavLink>
        </nav>
      </aside>

      {/* Header + outlet */}
      <div className="flex-1 flex flex-col">
        <header className="border-b bg-white/80 backdrop-blur-md">
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
