// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Play, Plus, Settings, PencilLine, BookOpen, Calendar, Layers,
  UploadCloud, Store, User, Info, Home, ChevronRight, Menu, X, Bell, Search, FileText
} from "lucide-react";

// --------- Demo/Default Data ---------
const writingActivity = [
  { day: "Mon", words: 0 },
  { day: "Tue", words: 0 },
  { day: "Wed", words: 0 },
  { day: "Thu", words: 0 },
  { day: "Fri", words: 0 },
  { day: "Sat", words: 0 },
  { day: "Sun", words: 0 },
];

const recentChapters = [];

// --------- Small UI helpers ---------
const Card = ({ children, className = "", onClick }) => (
  <div className={`rounded-2xl glass-panel ${className}`} onClick={onClick}>
    {children}
  </div>
);
const CardBody = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);
const StatLabel = ({ children }) => (
  <p className="text-xs uppercase tracking-wide text-muted">{children}</p>
);
const StatValue = ({ children }) => (
  <p className="text-3xl font-semibold text-ink mt-1">{children}</p>
);
const Progress = ({ value }) => (
  <div className="h-2 w-full rounded-full bg-primary/20">
    <div
      className="h-2 rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

// --------- Profile name helper (pull from multiple keys; live-updates) ---------
function readAuthorName() {
  try {
    const keys = ["userProfile", "profile", "dt_profile", "currentUser"];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj.displayName) return obj.displayName;
      const fn = obj.firstName || obj.given_name;
      const ln = obj.lastName || obj.family_name;
      if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
      if (obj.username) return obj.username;
    }
  } catch {}
  return "New Author";
}

// --------- Sidebar ---------
const Sidebar = ({ isOpen, onClose, authorName, navigate, userNovels = [] }) => {
  const { pathname } = useLocation();

  // 🔹 Added Project to the menu, and kept Profile link
  const menuItems = [
    { icon: Home,       label: "Dashboard",         path: "/dashboard" },
    { icon: PencilLine, label: "Write",             path: "/writer" },
    { icon: BookOpen,   label: "Table of Contents", path: "/toc" },
    { icon: Layers,     label: "Project",           path: "/project" }, // ✅ ADDED
    { icon: Calendar,   label: "Calendar",          path: "/calendar" },
    { icon: Layers,     label: "Story Lab",         path: "/story-lab" },
    { icon: UploadCloud,label: "Publishing",        path: "/publishing" },
    { icon: Store,      label: "Store",             path: "/store" },
    { icon: User,       label: "Profile",           path: "/profile" }, // ✅ PROFILE
    { icon: Info,       label: "About",             path: "/about" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar — top-0 + h-screen since top banner is gone */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-80 glass-panel bg-white/70 backdrop-blur-xl border-r border-white/60 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-screen
          flex flex-col overflow-hidden
        `}
      >
        {/* Header with DahTruth logo — pinned at the very top */}
        <div className="px-5 py-3 border-b border-white/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/DahTruthLogo.png"
                alt="DahTruth Logo"
                className="w-12 h-12 rounded-full shadow-lg border-2 border-white/20"
              />
              <div className="leading-tight">
                <span className="block font-bold text-lg text-ink" style={{ fontFamily: "Georgia, serif" }}>
                  DahTruth
                </span>
                <span className="block text-xs text-muted -mt-0.5">StoryLab</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-muted hover:text-ink p-1 rounded-lg hover:bg-white/70 transition-colors"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-muted mt-1">Where your story comes to life</p>
        </div>

        {/* Aerodynamic Menu with translucent hover highlight */}
        <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                role="menuitem"
                aria-current={isActive ? "page" : undefined}
                onClick={() => navigate(item.path)}
                className={`
                  group relative w-full h-11 rounded-xl border
                  flex items-center gap-3 px-4
                  transition-colors duration-150
                  ${isActive
                    ? "bg-white/80 border-white/60"
                    : "bg-transparent border-transparent hover:bg-accent/15 hover:border-white/60"}
                `}
              >
                {/* left accent rail */}
                <span
                  className={`
                    absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full transition-all
                    ${isActive ? "bg-primary" : "bg-transparent group-hover:bg-primary/60"}
                  `}
                />
                {/* translucent hover veil */}
                <span className="absolute inset-0 rounded-xl bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                {/* content */}
                <item.icon size={18} className={`relative z-10 ${isActive ? "text-ink" : "text-ink/80"}`} />
                <span className={`relative z-10 font-medium ${isActive ? "text-ink" : "text-ink/90"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Your Novels */}
        <div className="p-4 border-t border-white/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Your Novels ({userNovels.length})
            </h3>
            <button
              onClick={() => navigate("/writer")}
              className="text-ink hover:opacity-80 p-1 rounded-lg hover:bg-white/70 transition-colors"
              aria-label="Create novel"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto">
            {userNovels.length === 0 ? (
              <div className="p-3 rounded-lg glass-soft text-center">
                <p className="text-xs text-muted">No novels yet</p>
                <p className="text-xs text-muted mt-1">Click + to create your first story</p>
              </div>
            ) : (
              userNovels.map((novel, i) => (
                <button
                  key={novel.id || i}
                  onClick={() => navigate("/writer")}
                  className="w-full text-left p-3 rounded-lg glass-soft hover:bg-white/80 transition-colors"
                >
                  <h4 className="text-sm font-medium text-ink truncate">{novel.title || "Untitled Story"}</h4>
                  <p className="text-xs text-muted">
                    {novel.words || novel.wordCount || 0} words
                    {novel.lastModified && (
                      <span className="ml-2 opacity-75">• {new Date(novel.lastModified).toLocaleDateString()}</span>
                    )}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Author info (now the whole card opens Profile too) */}
        <div className="p-4 border-t border-white/60 flex-shrink-0">
          <div
            className="p-4 glass-soft rounded-xl hover:bg-white/80 transition-colors cursor-pointer"
            onClick={() => navigate("/profile")}
            role="button"
            aria-label="Open profile"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent via-primary to-gold grid place-items-center shadow-md">
                <span className="text-ink font-bold text-xs">{authorName?.charAt(0)?.toUpperCase?.() || "A"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{authorName || "Author"}</p>
                <p className="text-xs text-muted">Author</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-white/70 transition-colors"
                aria-label="Open profile settings"
              >
                <Settings size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                className="w-full text-left px-3 py-2 text-xs text-muted hover:text-ink hover:bg-white/70 rounded-lg transition-colors"
              >
                Account Settings
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/"); }}
                className="w-full text-left px-3 py-2 text-xs text-muted hover:text-ink hover:bg-white/70 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --------- Main Dashboard ---------
export default function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [authorName, setAuthorName] = useState("New Author");
  const [userNovels, setUserNovels] = useState([]);

  // init profile + novels
  useEffect(() => {
    setAuthorName(readAuthorName());
    const projectData = localStorage.getItem("userProjects");
    const novelsData = localStorage.getItem("userNovels");
    if (projectData) setUserNovels(JSON.parse(projectData));
    else if (novelsData) setUserNovels(JSON.parse(novelsData));
    else {
      const storyData = localStorage.getItem("currentStory");
      if (storyData) {
        const s = JSON.parse(storyData);
        setUserNovels([
          {
            id: s.id || 1,
            title: s.title || "Untitled Story",
            words: s.wordCount || 0,
            lastModified: s.lastModified || new Date().toISOString(),
          },
        ]);
      }
    }
  }, []);

  // live refresh name on profile update or storage changes
  useEffect(() => {
    const refresh = () => setAuthorName(readAuthorName());
    window.addEventListener("storage", refresh);
    window.addEventListener("profile:updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("profile:updated", refresh);
    };
  }, []);

  // greeting
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("Good Morning");
    else if (h < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // simple stats
  const goal = 25000, current = 0;
  const todayTarget = 834, todayWritten = 0;
  const goalPercent = Math.min(100, Math.round((current / goal) * 100));
  const todayPercent = Math.min(100, Math.round((todayWritten / todayTarget) * 100));

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          authorName={authorName}
          userNovels={userNovels}
          navigate={navigate}
        />

        {/* Main */}
        <div className="flex-1 min-h-screen flex flex-col">
          {/* Header (no top banner; pulled to top) */}
          <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-muted hover:text-ink p-2 rounded-lg hover:bg-white/70 transition-colors"
                    aria-label="Open sidebar"
                  >
                    <Menu size={24} />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
                      <span className="mr-2">📝</span>
                      {greeting}{authorName ? `, ${authorName}` : ""} — Ready to Write?
                    </h1>
                    <div className="mt-1 flex items-center gap-4">
                      <p className="font-medium text-sm text-ink/80">Start your writing journey today</p>
                      <span className="text-muted">•</span>
                      <p className="text-sm text-muted">Transform your ideas into compelling stories</p>
                    </div>
                    <p className="text-xs text-muted mt-1">Create your first novel and begin tracking your progress</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-3">
                    <button
                      onClick={() => navigate("/writer")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:opacity-90 px-4 py-2 text-sm font-semibold shadow"
                    >
                      <Plus size={16} /> Create Novel
                    </button>
                    <button
                      onClick={() => navigate("/writer")}
                      className="inline-flex items-center gap-2 rounded-2xl glass-soft border border-white/40 px-4 py-2 text-sm font-semibold"
                    >
                      <Play size={16} /> Quick Start
                    </button>
                  </div>
                  {/* Search + Bell moved beneath quick-start buttons */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg glass-soft hover:bg-white/80 transition-colors" title="Search">
                      <Search size={16} />
                    </button>
                    <button className="p-2 rounded-lg glass-soft hover:bg-white/80 transition-colors relative" title="Notifications">
                      <Bell size={16} />
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Welcome */}
            <Card>
              <CardBody>
                <div className="text-center py-6">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <img
                      src="/DahTruthLogo.png"
                      alt="DahTruth Logo"
                      className="w-16 h-16 rounded-full shadow-lg border-2 border-white/20"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  </div>
                  <h2
                    className="text-xl font-bold text-ink mb-3 flex items-center justify-center gap-2"
                    style={{ fontFamily: "Georgia, serif" }}
                  >
                    <span className="text-xl">📝</span>
                    Welcome to DahTruth StoryLab!
                  </h2>
                  <p className="text-ink/80 mb-5 max-w-xl mx-auto text-sm">
                    Ready to bring your stories to life? Start by creating your first novel and set your writing goals.
                    Track your progress, stay motivated, and turn your ideas into compelling narratives.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => navigate("/writer")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:opacity-90 px-5 py-2.5 text-sm font-semibold shadow"
                    >
                      <Plus size={16} /> Create Your First Novel
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl glass-soft border border-white/40 px-5 py-2.5 text-sm font-semibold">
                      <BookOpen size={16} /> Learn More
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <PencilLine size={16} className="text-primary" />
                    <StatLabel>Overall Progress</StatLabel>
                  </div>
                  <StatValue>{goalPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={goalPercent} />
                    <div className="flex justify-between text-xs text-muted">
                      <span>Current: {current.toLocaleString()}</span>
                      <span>Goal: {goal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">✍️</span>
                    <StatLabel>Writing Streak</StatLabel>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StatValue>0</StatValue>
                    <span className="text-2xl">🗓️</span>
                  </div>
                  <p className="text-muted text-sm mt-2">Start your streak today!</p>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🎯</span>
                    <StatLabel>Today's Goal</StatLabel>
                  </div>
                  <StatValue>{todayPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={todayPercent} />
                    <div className="flex justify-between text-xs text-muted">
                      <span>Written: {todayWritten}</span>
                      <span>Target: {todayTarget}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Calendar size={16} className="text-primary" />
                      <span className="text-xs text-muted uppercase tracking-wide">Today</span>
                    </div>
                    <div className="text-5xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
                      {new Date().getDate()}
                    </div>
                    <div className="text-muted text-sm uppercase tracking-wide">
                      {new Date().toLocaleDateString("en-US", { month: "short", weekday: "short" })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Quick Access */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="cursor-pointer hover:border-white/60" onClick={() => navigate("/toc")}>
                <CardBody className="text-center">
                  <BookOpen size={24} className="mx-auto mb-2 text-ink" />
                  <p className="font-semibold">Table of Contents</p>
                  <p className="text-xs text-muted mt-1">Organize chapters</p>
                </CardBody>
              </Card>

              <Card className="cursor-pointer hover:border-white/60" onClick={() => navigate("/writer")}>
                <CardBody className="text-center">
                  <PencilLine size={24} className="mx-auto mb-2 text-ink" />
                  <p className="font-semibold">Writer</p>
                  <p className="text-xs text-muted mt-1">Start writing</p>
                </CardBody>
              </Card>

              <Card className="cursor-pointer hover:border-white/60" onClick={() => navigate("/project")}>
                <CardBody className="text-center">
                  <Layers size={24} className="mx-auto mb-2 text-ink" />
                  <p className="font-semibold">Project</p>
                  <p className="text-xs text-muted mt-1">Manage project</p>
                </CardBody>
              </Card>

              <Card className="cursor-pointer hover:border-white/60" onClick={() => navigate("/calendar")}>
                <CardBody className="text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-ink" />
                  <p className="font-semibold">Calendar</p>
                  <p className="text-xs text-muted mt-1">Track progress</p>
                </CardBody>
              </Card>
            </div>

            {/* Charts & Recent */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2">
                <CardBody>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-ink">Writing Activity</h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg bg-primary text-ink text-sm">7 days</button>
                      <button className="px-3 py-1 rounded-lg text-ink/70 hover:bg-white/70 text-sm transition-colors">
                        30 days
                      </button>
                      <button className="px-3 py-1 rounded-lg text-ink/70 hover:bg-white/70 text-sm transition-colors">
                        All time
                      </button>
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={writingActivity}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-ink/70" />
                        <YAxis axisLine={false} tickLine={false} className="text-ink/70" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.95)",
                            border: "1px solid rgba(0,0,0,0.05)",
                            borderRadius: "12px",
                            boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                            color: "#0F172A",
                          }}
                        />
                        <defs>
                          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#CAB1D6" />
                            <stop offset="100%" stopColor="#EAF2FF" />
                          </linearGradient>
                        </defs>
                        <Bar dataKey="words" fill="url(#brandGradient)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-between text-center mt-6 pt-4 border-t border-white/60">
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">This Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">Last Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">Average</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-ink">Recent Activity</h2>
                    <ChevronRight size={20} className="text-ink/60 hover:text-ink transition-colors cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                    {recentChapters.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 glass-soft rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText size={20} className="text-ink/70" />
                        </div>
                        <p className="text-sm text-muted mb-2">No activity yet</p>
                        <p className="text-xs text-ink/60">Start writing to see your progress here</p>
                      </div>
                    ) : (
                      recentChapters.map((chapter) => (
                        <div
                          key={chapter.id}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/70 transition-colors cursor-pointer group"
                        >
                          <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink text-sm truncate group-hover:opacity-80 transition-colors">
                              {chapter.title}
                            </h3>
                            <p className="text-xs text-muted mt-1">
                              {chapter.words} words • {chapter.time}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
