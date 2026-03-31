// src/components/AppSidebar.jsx
// Global navigation sidebar — three studio structure
// Matches Dashboard.jsx aesthetic (EB Garamond, violet/amber, glass)

import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  Home,
  PencilLine,
  BookOpen,
  Layers,
  Calendar,
  UploadCloud,
  User,
  FileText,
  Compass,
  Mic2,
  MessageSquare,
  Feather,
  BookMarked,
  FlaskConical,
  X,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { storage } from "../lib/storage";

// ── Section divider with ALL CAPS label ───────
function StudioLabel({ label }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <div className="h-px w-full mb-3" style={{ background: "rgba(209,213,219,0.7)" }} />
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "#6B7280", fontFamily: "'EB Garamond', Georgia, serif" }}
      >
        {label}
      </p>
    </div>
  );
}

// ── Single nav item (no children) ─────────────
function NavItem({ icon: Icon, label, path, active }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 text-left
        ${active ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
    >
      <Icon
        size={16}
        className={active ? "text-violet-500" : "text-slate-400"}
        style={{ flexShrink: 0 }}
      />
      <span
        className="text-sm font-medium"
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          color: active ? "#111827" : "#6B7280",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ── Collapsible nav group ──────────────────────
function NavGroup({ icon: Icon, label, path, items, pathname }) {
  const navigate = useNavigate();
  const groupActive = pathname.startsWith(path);
  const [open, setOpen] = useState(groupActive);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150
          ${groupActive && !open ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
      >
        <Icon
          size={16}
          className={groupActive ? "text-violet-500" : "text-slate-400"}
          style={{ flexShrink: 0 }}
        />
        <span
          className="text-sm font-medium flex-1 text-left"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            color: groupActive ? "#111827" : "#6B7280",
          }}
        >
          {label}
        </span>
        {open ? (
          <ChevronDown size={12} className="text-slate-400" />
        ) : (
          <ChevronRight size={12} className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {items.map((item) => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={pathname === item.path || pathname.startsWith(item.path + "/")}
            />
          ))}
        </div>
      )}
    </>
  );
}

// ── Main Sidebar ───────────────────────────────
export default function AppSidebar({ isOpen, onClose, userNovels = [] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Author info from storage
  let authorName = "Author";
  let authorAvatar = "";
  try {
    const keys = ["dt_profile", "userProfile", "profile", "dahtruth_project_meta"];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj.avatarUrl && !authorAvatar) authorAvatar = obj.avatarUrl;
      if (obj.author) { authorName = obj.author; break; }
      if (obj.displayName) { authorName = obj.displayName; break; }
      const fn = obj.firstName || obj.given_name;
      const ln = obj.lastName || obj.family_name;
      if (fn || ln) { authorName = [fn, ln].filter(Boolean).join(" "); break; }
    }
  } catch { }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-screen w-64 z-40 flex flex-col overflow-hidden
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          background:
            "linear-gradient(160deg, rgba(249,245,255,0.96), rgba(234,224,252,0.98))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
        }}
      >
        {/* ── Brand header ── */}
        <div className="px-4 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-md border border-amber-300/60">
                <img
                  src="/assets/Story%20Lab_Transparent.jpeg"
                  alt="DahTruth Story Lab"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1
                  className="text-sm font-semibold tracking-wide text-slate-900"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  DAHTRUTH
                </h1>
                <p className="text-[11px] text-slate-500">Your Creative Studio</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">

          {/* Dashboard */}
          <NavItem
            icon={Home}
            label="Dashboard"
            path="/dashboard"
            active={pathname === "/dashboard"}
          />

          {/* ── WRITER'S STUDIO ── */}
          <StudioLabel label="Writer's Studio" />
          <NavItem
            icon={Layers}
            label="Projects"
            path="/project"
            active={pathname === "/project"}
          />
          <NavItem
            icon={BookOpen}
            label="Table of Contents"
            path="/toc"
            active={pathname === "/toc"}
          />
          <NavItem
            icon={PencilLine}
            label="Compose"
            path="/writer"
            active={["/writer", "/write", "/writing", "/compose"].includes(pathname)}
          />

          {/* ── STORY LAB STUDIO ── */}
          <StudioLabel label="Story Lab Studio" />
          <NavItem
            icon={BookMarked}
            label="Fiction"
            path="/story-lab/fiction"
            active={pathname.startsWith("/story-lab/fiction")}
          />
          <NavItem
            icon={FileText}
            label="Nonfiction"
            path="/story-lab/nonfiction"
            active={pathname.startsWith("/story-lab/nonfiction")}
          />
          <NavItem
            icon={Feather}
            label="Poetry"
            path="/story-lab/poetry"
            active={pathname.startsWith("/story-lab/poetry")}
          />
          <NavItem
            icon={Compass}
            label="Hub"
            path="/story-lab/hub"
            active={pathname === "/story-lab/hub" || pathname === "/story-lab/workshop"}
          />
          <NavItem
            icon={Layers}
            label="Narrative Arc"
            path="/story-lab/narrative-arc"
            active={pathname === "/story-lab/narrative-arc"}
          />
          <NavItem
            icon={FlaskConical}
            label="Plot Builder"
            path="/story-lab/plot-builder"
            active={pathname === "/story-lab/plot-builder"}
          />
          <NavItem
            icon={MessageSquare}
            label="Dialogue Lab"
            path="/story-lab/dialogue-lab"
            active={pathname === "/story-lab/dialogue-lab"}
          />
          <NavItem
            icon={Mic2}
            label="Prompts"
            path="/story-lab/prompts"
            active={pathname === "/story-lab/prompts"}
          />
          <NavItem
            icon={Calendar}
            label="Calendar"
            path="/calendar"
            active={pathname === "/calendar"}
          />

          {/* ── AUTHOR STUDIO ── */}
          <StudioLabel label="Author Studio" />
          <NavItem
            icon={User}
            label="Author Page"
            path="/author"
            active={pathname.startsWith("/author")}
          />
          <NavItem
            icon={UploadCloud}
            label="Publishing"
            path="/publishing"
            active={pathname.startsWith("/publishing") || pathname === "/proof" || pathname === "/format" || pathname === "/export" || pathname === "/cover"}
          />
          <NavItem
            icon={Settings}
            label="Profile"
            path="/profile"
            active={pathname === "/profile"}
          />
        </nav>

        {/* ── Projects quick list ── */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3
              className="text-[10px] font-semibold uppercase tracking-[0.16em]"
              style={{ color: "#4B5563", fontFamily: "'EB Garamond', Georgia, serif" }}
            >
              Your Projects ({userNovels.length})
            </h3>
            <button
              onClick={() => navigate("/project")}
              className="text-slate-700 hover:text-slate-900 p-1 rounded-lg hover:bg-white/80 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {userNovels.length === 0 ? (
              <div className="p-2 rounded-lg bg-white/90 text-center border border-slate-200/80">
                <p className="text-[11px] text-slate-700">No projects yet</p>
                <p className="text-[11px] mt-0.5 text-slate-500">Click + to create one</p>
              </div>
            ) : (
              userNovels.map((project, i) => {
                const title = project.title || "Untitled Story";
                const words = project.words || project.wordCount || 0;
                const status = project.status || "Draft";
                const handleOpen = () => {
                  try {
                    const snapshot = {
                      id: project.id || i,
                      title,
                      status,
                      wordCount: words,
                      lastModified: project.lastModified || new Date().toISOString(),
                    };
                    storage.setItem("currentStory", JSON.stringify(snapshot));
                    window.dispatchEvent(new Event("project:change"));
                  } catch (err) {
                    console.error("Failed to set currentStory:", err);
                  }
                  navigate("/writer");
                };
                return (
                  <button
                    key={project.id || i}
                    onClick={handleOpen}
                    className="w-full text-left p-2 rounded-lg bg-white/90 hover:bg-white transition-colors border border-slate-200/70"
                  >
                    <h4 className="text-xs font-medium text-slate-900 truncate">{title}</h4>
                    <p className="text-[10px] mt-0.5 text-slate-600">
                      {words.toLocaleString()} words
                      <span
                        className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wide"
                        style={{
                          background: "rgba(249,250,251,0.95)",
                          border: "1px solid rgba(209,213,219,0.9)",
                          color: "rgba(55,65,71,1)",
                        }}
                      >
                        {status}
                      </span>
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Author info footer ── */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div
            className="p-3 rounded-xl bg-white/90 hover:bg-white transition-colors cursor-pointer border border-slate-200/80"
            onClick={() => navigate("/profile")}
            role="button"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden grid place-items-center border border-violet-300/70 bg-gradient-to-br from-amber-100 to-violet-200 flex-shrink-0">
                {authorAvatar ? (
                  <img
                    src={authorAvatar}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-800">
                    {authorName?.charAt(0)?.toUpperCase?.() || "A"}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{authorName}</p>
                <p className="text-[10px] text-slate-500">Author</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); navigate("/profile"); }}
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
              >
                <Settings size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

