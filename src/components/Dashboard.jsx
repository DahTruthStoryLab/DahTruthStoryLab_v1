// src/components/Dashboard.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../lib/userStore";
import { storage } from "../lib/storage";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  Plus,
  Settings,
  PencilLine,
  BookOpen,
  Calendar,
  Layers,
  UploadCloud,
  CreditCard,
  User,
  Home,
  ChevronRight,
  Menu,
  X,
  FileText,
  Info,
  ChevronDown,
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
const Card = ({ children, className = "", onClick, style = {} }) => (
  <div
    className={`rounded-2xl glass-panel border border-slate-200/60 shadow-sm ${className}`}
    onClick={onClick}
    style={style}
  >
    {children}
  </div>
);
 
const CardBody = ({ children, className = "", style = {} }) => (
  <div className={`p-5 ${className}`} style={style}>
    {children}
  </div>
);
 
const StatLabel = ({ children }) => (
  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{children}</p>
);
 
const StatValue = ({ children }) => (
  <p className="text-3xl font-semibold text-slate-900 mt-1">{children}</p>
);
 
const Progress = ({ value }) => (
  <div className="h-1.5 w-full rounded-full bg-slate-200">
    <div
      className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-violet-500 transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);
 
// --------- Profile helper ---------
function readAuthorProfile() {
  let name = "Author";
  let avatarUrl = "";
  try {
    const keys = ["dahtruth_project_meta", "dt_profile", "userProfile", "profile", "currentUser"];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj.avatarUrl && !avatarUrl) avatarUrl = obj.avatarUrl;
      if (obj.author) { name = obj.author; break; }
      if (obj.displayName) { name = obj.displayName; break; }
      const fn = obj.firstName || obj.given_name;
      const ln = obj.lastName || obj.family_name;
      if (fn || ln) { name = [fn, ln].filter(Boolean).join(" "); break; }
      if (obj.username) { name = obj.username; break; }
    }
  } catch { }
  return { name, avatarUrl };
}
 
// --------- Collapsible nav section ---------
function NavSection({ icon: Icon, label, path, subItems, navigate, pathname, isActive }) {
  const [open, setOpen] = useState(pathname.startsWith(path) || false);
 
  return (
    <>
      <button
        type="button"
        onClick={() => subItems ? setOpen(!open) : navigate(path)}
        
        className={`group relative w-full h-12 rounded-xl flex items-center justify-start gap-3 px-3 transition-all duration-150
          ${isActive && !subItems ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
      >
        {/* ✅ Standardized icon size to 20 */}
        <Icon size={20} className={isActive ? "text-violet-500" : "text-slate-500"} />
       <span
  className="font-medium text-base flex-1 text-left"
  style={{ fontFamily: "'EB Garamond', Georgia, serif", color: isActive ? "#111827" : "#374151" }}
  onClick={(e) => { e.stopPropagation(); navigate(path); }}
>
  {label}
</span>
        {subItems && (
          open
            ? <ChevronDown size={14} className="text-slate-400" />
            : <ChevronRight size={14} className="text-slate-400" />
        )}
      </button>
      {subItems && open && (
        <div className="ml-3 space-y-0.5">
          {subItems.map((sub) => {
            const subActive = pathname === sub.path;
            return (
              <button
                key={sub.path}
                onClick={() => navigate(sub.path)}
                className={`w-full h-11 rounded-xl flex items-center justify-start gap-3 px-4 transition-all duration-150
                  ${subActive ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
              >
                {/* ✅ Standardized sub-item icon size to 20 */}
                <sub.icon size={20} className={subActive ? "text-violet-500" : "text-slate-400"} />
                <span className="font-medium text-base"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif", color: subActive ? "#111827" : "#6B7280" }}>
                  {sub.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
 
// --------- Sidebar ---------
const Sidebar = ({ isOpen, onClose, authorName, authorAvatar, navigate, userNovels = [] }) => {
  const { pathname } = useLocation();
 
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Layers, label: "Projects", path: "/project" },
    {
      icon: PencilLine, label: "Writer", path: "/writer",
      subItems: [
        { icon: BookOpen, label: "Table of Contents", path: "/toc" },
        { icon: PencilLine, label: "Compose", path: "/writer" },
        { icon: Calendar, label: "Calendar", path: "/calendar" },
      ]
    },
    {
      icon: Layers, label: "StoryLab", path: "/story-lab",
      subItems: [
        { icon: BookOpen, label: "Fiction", path: "/story-lab/fiction" },
        { icon: FileText, label: "Nonfiction", path: "/story-lab/nonfiction" },
        { icon: BookOpen, label: "Poetry", path: "/story-lab/poetry" },
      ]
    },
    { icon: UploadCloud, label: "Publishing Suite", path: "/publishing" },
    { icon: Info, label: "About", path: "/about" },
    { icon: CreditCard, label: "Plans", path: "/plans" },
  ];
 
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={onClose} />
      )}
 
      <div
        className={`fixed top-0 left-0 h-screen w-64 backdrop-blur-2xl z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 flex flex-col overflow-hidden`}
        style={{
          background: "linear-gradient(160deg, rgba(249,245,255,0.96), rgba(234,224,252,0.98))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-md border border-amber-300/60">
                <img src="/assets/Story%20Lab_Transparent.jpeg" alt="DahTruth Story Lab"
                  className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-wide text-slate-900"
                  style={{ fontFamily: "'EB Garamond', Georgia, serif", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                  DAHTRUTH
                </h1>
                <p className="text-[11px] text-slate-500">Story Lab Dashboard</p>
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white/80 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
 
        {/* Nav */}
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.label === "StoryLab"
              ? pathname.startsWith("/story-lab")
              : item.label === "Writer"
                ? pathname === "/writer" || pathname === "/toc" || pathname === "/calendar"
                : pathname === item.path;
 
            return (
              <NavSection
                key={item.path + item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                subItems={item.subItems}
                navigate={navigate}
                pathname={pathname}
                isActive={isActive}
              />
            );
          })}
        </nav>
 
        {/* Projects */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "#4B5563", fontFamily: "'EB Garamond', Georgia, serif" }}>
              Your Projects ({userNovels.length})
            </h3>
            <button onClick={() => navigate("/project")}
              className="text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-white/80 transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto">
            {userNovels.length === 0 ? (
              <div className="p-2 rounded-lg bg-white/90 text-center border border-slate-200/80">
                <p className="text-[11px] text-slate-700">No projects yet</p>
                <p className="text-[11px] mt-0.5 text-slate-500">Click + to create your first story</p>
              </div>
            ) : (
              userNovels.map((project, i) => {
                const title = project.title || "Untitled Story";
                const words = project.words || project.wordCount || 0;
                const status = project.status || "Draft";
 
                const handleOpen = () => {
                  try {
                    const snapshot = { id: project.id || i, title, status, wordCount: words, lastModified: project.lastModified || new Date().toISOString() };
                    storage.setItem("currentStory", JSON.stringify(snapshot));
                    window.dispatchEvent(new Event("project:change"));
                  } catch (err) { console.error("Failed to set currentStory:", err); }
                  navigate("/writer");
                };
 
                return (
                  <button key={project.id || i} onClick={handleOpen}
                    className="w-full text-left p-2 rounded-lg bg-white/90 hover:bg-white transition-colors border border-slate-200/70">
                    <h4 className="text-xs font-medium text-slate-900 truncate">{title}</h4>
                    <p className="text-[10px] mt-0.5 text-slate-600">
                      {words.toLocaleString()} words
                      {status && (
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide"
                          style={{ background: "rgba(249,250,251,0.95)", border: "1px solid rgba(209,213,219,0.9)", color: "rgba(55,65,71,1)" }}>
                          {status}
                        </span>
                      )}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>
 
        {/* Author info */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="p-3 rounded-xl bg-white/90 hover:bg-white transition-colors cursor-pointer border border-slate-200/80"
            onClick={() => navigate("/profile")} role="button">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden grid place-items-center border border-violet-300/70 bg-gradient-to-br from-amber-100 to-violet-200">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName || "Author avatar"} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold text-slate-800">
                    {authorName?.charAt(0)?.toUpperCase?.() || "A"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{authorName || "Author"}</p>
                <p className="text-[10px] text-slate-500">Author</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                <Settings size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <button onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                className="w-full text-left px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                Account Settings
              </button>
              <button onClick={(e) => { e.stopPropagation(); navigate("/"); }}
                className="w-full text-left px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
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
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [authorName, setAuthorName] = useState("Author");
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [userNovels, setUserNovels] = useState([]);
 
  useEffect(() => {
  if (user) {
    // Try user-specific profile key first
    const profileKey = `dt_user_profile_${user.id || user.sub}`;
    const profileRaw = storage.getItem(profileKey);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const name =
      (profile?.firstName && profile?.lastName
        ? `${profile.firstName} ${profile.lastName}`
        : null) ||
      profile?.firstName ||
      profile?.displayName ||
      user.displayName ||
      user.author ||
      user.firstName ||
      "Author";
    setAuthorName(name);
    setAuthorAvatar(profile?.avatarUrl || user.avatarUrl || "");
  } else {
    const profile = readAuthorProfile();
    setAuthorName(profile.name);
    setAuthorAvatar(profile.avatarUrl);
  }
}, [user]);

useEffect(() => {
  const name = authorName && authorName !== "Author" ? authorName : "";
  const hour = new Date().getHours();
  const firstName = name.split(" ")[0];
  let g;
  if (!name) g = "Welcome to DahTruth Story Lab";
  else if (hour < 12) g = `Good Morning, ${firstName}`;
  else if (hour < 17) g = `Good Afternoon, ${firstName}`;
  else g = `Good Evening, ${firstName}`;
  setGreeting(g);
}, [authorName]);;
 
  useEffect(() => {
    const loadProjects = () => {
      try {
        const userId = storage.getItem("dt_user_id") || "default";
        const projectData =
          storage.getItem(`userProjects_${userId}`) ||
          storage.getItem("userProjects") ||
          storage.getItem("dahtruth-projects-list");
        const novelsData = storage.getItem(`userNovels_${userId}`) || storage.getItem("userNovels");
 
        if (projectData) setUserNovels(JSON.parse(projectData));
        else if (novelsData) setUserNovels(JSON.parse(novelsData));
        else {
          const storyData = storage.getItem("currentStory");
          if (storyData) {
            const s = JSON.parse(storyData);
            setUserNovels([{ id: s.id || 1, title: s.title || "Untitled Story", words: s.wordCount || 0, lastModified: s.lastModified || new Date().toISOString(), status: s.status || "Draft" }]);
          } else setUserNovels([]);
        }
      } catch (err) { setUserNovels([]); }
    };
 
    loadProjects();
    window.addEventListener("storage", loadProjects);
    window.addEventListener("profile:updated", loadProjects);
    window.addEventListener("project:change", loadProjects);
    window.addEventListener("auth:change", loadProjects);
    window.addEventListener("storage:ready", loadProjects);
    return () => {
      window.removeEventListener("storage", loadProjects);
      window.removeEventListener("profile:updated", loadProjects);
      window.removeEventListener("project:change", loadProjects);
      window.removeEventListener("auth:change", loadProjects);
      window.removeEventListener("storage:ready", loadProjects);
    };
  }, [user]);
 
  const goal = 25000, current = 0;
  const todayTarget = 834, todayWritten = 0;
  const goalPercent = Math.min(100, Math.round((current / goal) * 100));
  const todayPercent = Math.min(100, Math.round((todayWritten / todayTarget) * 100));
 
  return (
    <div className="min-h-screen text-slate-900"
      style={{ background: "radial-gradient(circle at top left, #F9FAFB 0, #F3F4F6 40%, #EDE9FE 100%)" }}>
 
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        authorName={authorName}
        authorAvatar={authorAvatar}
        userNovels={userNovels}
        navigate={navigate}
      />
 
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col lg:ml-64">
          <div className="lg:hidden p-4">
            <button onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-white/90 shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              <Menu size={22} />
            </button>
          </div>
 
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Greeting Banner */}
            <Card className="relative overflow-hidden" style={{ background: "linear-gradient(120deg, #4C1D95, #7C3AED, #A855F7)", border: "none" }}>
              <CardBody className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm text-violet-100/80 mb-1 tracking-[0.16em] uppercase">
                    {authorName && authorName !== "Author" ? "Author workspace" : "Welcome"}
                  </p>
                  <h1 className="text-3xl md:text-4xl font-semibold text-white"
                    style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
                    {greeting || "Welcome to DahTruth Story Lab"}
                  </h1>
                  <p className="mt-3 text-violet-100/90 text-sm md:text-base max-w-xl">
                    Pick up where you left off, or open a new manuscript and let DahTruth Story Lab carry the structure while you tell the story.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={() => navigate("/writer")}
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                      style={{ background: "#D4AF37", color: "#111827" }}>
                      <Plus size={18} /> Start Writing
                    </button>
                    <button onClick={() => navigate("/project")}
                      className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium border border-violet-200/80 text-violet-50 hover:bg-white/10 transition-colors">
                      <Layers size={16} /> View Projects
                    </button>
                  </div>
                </div>
                <div className="hidden md:flex items-center justify-center flex-shrink-0">
                  <div className="w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden border border-amber-200/50 bg-violet-900/40 backdrop-blur-xl shadow-[0_0_80px_rgba(76,29,149,0.8)] grid place-items-center">
                    <img src="/assets/Story%20Lab_Transparent.jpeg" alt="DahTruth Story Lab" className="w-full h-full object-contain" />
                  </div>
                </div>
              </CardBody>
            </Card>
 
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <PencilLine size={18} className="text-violet-500" />
                    <StatLabel>Overall Progress</StatLabel>
                  </div>
                  <StatValue>{goalPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={goalPercent} />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Current: {current.toLocaleString()}</span>
                      <span>Goal: {goal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
 
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={18} className="text-emerald-500" />
                    <StatLabel>Writing Streak</StatLabel>
                  </div>
                  <StatValue>0 days</StatValue>
                  <p className="text-slate-500 text-sm mt-3">Begin a daily rhythm and your streak will appear here.</p>
                </CardBody>
              </Card>
 
              <Card>
                <CardBody>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={18} className="text-sky-500" />
                    <StatLabel>Today&apos;s Goal</StatLabel>
                  </div>
                  <StatValue>{todayPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={todayPercent} />
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Written: {todayWritten}</span>
                      <span>Target: {todayTarget}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
 
              <Card>
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-[0.18em] mb-1">Today</div>
                    <div className="text-5xl font-semibold"
                      style={{ background: "linear-gradient(90deg, #FBBF24, #F97316, #6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {new Date().getDate()}
                    </div>
                    <div className="text-xs text-slate-500 uppercase tracking-[0.16em] mt-1">
                      {new Date().toLocaleDateString("en-US", { month: "short", weekday: "short" })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
 
            {/* Writer Section */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"
                style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#1e3a5f" }}>
                <PencilLine size={20} className="text-violet-500" />
                Writer
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: BookOpen, label: "Table of Contents", desc: "Organize your chapters", color: "text-emerald-500", path: "/toc" },
                  { icon: PencilLine, label: "Compose", desc: "Draft your pages", color: "text-violet-500", path: "/writer" },
                  { icon: Calendar, label: "Calendar", desc: "Map your writing time", color: "text-rose-500", path: "/calendar" },
                  { icon: Layers, label: "Projects", desc: "Manage manuscripts", color: "text-indigo-500", path: "/project" },
                ].map((item) => (
                  <Card key={item.path} className="cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                    onClick={() => navigate(item.path)}>
                    <CardBody className="text-center">
                      <item.icon size={22} className={`mx-auto mb-2 ${item.color}`} />
                      <p className="font-semibold text-sm text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{item.desc}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
 
            {/* Charts & Recent */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2">
                <CardBody>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Writing Activity</h2>
                    <div className="flex gap-2 text-[11px]">
                      <button className="px-3 py-1 rounded-lg bg-slate-900 text-slate-50">7 days</button>
                      <button className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">30 days</button>
                      <button className="px-3 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">All time</button>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={writingActivity}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-slate-500" />
                        <YAxis axisLine={false} tickLine={false} className="text-slate-500" />
                        <Tooltip contentStyle={{ backgroundColor: "rgba(255,255,255,0.98)", border: "1px solid rgba(148,163,184,0.4)", borderRadius: "12px", boxShadow: "0 10px 25px rgba(15,23,42,0.10)", color: "#0F172A" }} />
                        <defs>
                          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#6366F1" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                        </defs>
                        <Bar dataKey="words" fill="url(#brandGradient)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between text-center mt-6 pt-4 border-t border-slate-200">
                    {[["This Week", 0], ["Last Week", 0], ["Average", 0]].map(([label, val]) => (
                      <div key={label}>
                        <p className="text-2xl font-semibold text-slate-900">{val}</p>
                        <p className="text-[11px] text-slate-500 uppercase tracking-[0.14em]">{label}</p>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
 
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <ChevronRight size={20} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer" />
                  </div>
                  <div className="space-y-4">
                    {recentChapters.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <FileText size={20} className="text-slate-500" />
                        </div>
                        <p className="text-sm text-slate-500 mb-1">No activity yet</p>
                        <p className="text-[11px] text-slate-400">As you write, your recent chapters will appear here.</p>
                      </div>
                    ) : (
                      recentChapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group">
                          <div className="w-2 h-2 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-slate-900 truncate">{chapter.title}</h3>
                            <p className="text-[11px] text-slate-500 mt-1">{chapter.words} words • {chapter.time}</p>
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
 
