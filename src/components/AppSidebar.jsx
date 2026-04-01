// src/components/AppSidebar.jsx
// Global navigation sidebar — three studio structure
//
// WRITER'S STUDIO:   Projects, Table of Contents, Compose
//
// STORY LAB STUDIO:
//   Fiction:         Hopes Fears & Legacy, Priority Cards, Character Roadmap,
//                    Plot Builder, Narrative Arc, Clothesline
//   Nonfiction:      Essay Builder, Memoir Scene Map, Research Notes,
//                    Argument & Theses, Chapter Outliner
//   Poetry:          Craft Lab, Revision Lab, Voice & Identity,
//                    Sequence Builder, Remix Lab, AI Poetry Prompts
//   Workshop Hub:    Dialogue Lab, Writing Prompts, Workshop Community,
//                    Calendar, Export, Publish
//
// AUTHOR STUDIO:     Author Page, Profile

import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home, PencilLine, BookOpen, Layers, Calendar, UploadCloud,
  User, FileText, Compass, Mic2, MessageSquare, Feather,
  BookMarked, FlaskConical, X, Plus, Settings, ChevronDown,
  ChevronRight, Users, Scroll, Map, ClipboardList, GraduationCap,
  Lightbulb, Heart, Wand2, RefreshCw, Fingerprint, AlignJustify,
  Shuffle, Sparkles, Download, BookCopy,
} from "lucide-react";
import { storage } from "../lib/storage";

// ─────────────────────────────────────────────
//  STUDIO LABEL — all caps with divider
//  Optional navPath makes the label itself clickable
// ─────────────────────────────────────────────
function StudioLabel({ label, navPath }) {
  const navigate = useNavigate();
  return (
    <div className="px-3 pt-4 pb-1">
      <div className="h-px w-full mb-3" style={{ background: "rgba(209,213,219,0.7)" }} />
      {navPath ? (
        <button
          type="button"
          onClick={() => navigate(navPath)}
          className="w-full flex items-center justify-between group text-left"
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em] group-hover:text-violet-500 transition-colors"
            style={{ color: "#6B7280", fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            {label}
          </p>
          <ChevronRight size={10} className="text-slate-300 group-hover:text-violet-400 transition-colors" />
        </button>
      ) : (
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: "#6B7280", fontFamily: "'EB Garamond', Georgia, serif" }}
        >
          {label}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  FLAT NAV ITEM
// ─────────────────────────────────────────────
function NavItem({ icon: Icon, label, path, active, indent = false }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(path)}
      className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 text-left
        ${indent ? "px-3 py-1.5" : "px-3 py-2"}
        ${active ? "bg-white/90 shadow-sm" : "hover:bg-white/70"}`}
    >
      <Icon
        size={indent ? 13 : 16}
        style={{ flexShrink: 0, color: active ? "#7C3AED" : indent ? "#94a3b8" : "#64748b" }}
      />
      <span
        className={`font-medium truncate ${indent ? "text-xs" : "text-sm"}`}
        style={{
          fontFamily: "'EB Garamond', Georgia, serif",
          color: active ? "#111827" : indent ? "#6B7280" : "#374151",
        }}
      >
        {label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────
//  COLLAPSIBLE GROUP
// ─────────────────────────────────────────────
function NavGroup({ icon: Icon, label, basePath, items, pathname }) {
  const groupActive = pathname.startsWith(basePath);
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
          style={{ flexShrink: 0, color: groupActive ? "#7C3AED" : "#64748b" }}
        />
        <span
          className="text-sm font-medium flex-1 text-left truncate"
          style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            color: groupActive ? "#111827" : "#374151",
          }}
        >
          {label}
        </span>
        {open
          ? <ChevronDown size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
          : <ChevronRight size={12} style={{ color: "#94a3b8", flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div className="mt-0.5 space-y-0.5 pl-4 border-l border-slate-200/80 ml-5">
          {items.map((item) => {
            const active =
              pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <NavItem
                key={item.path + item.label}
                icon={item.icon}
                label={item.label}
                path={item.path}
                active={active}
                indent={true}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
//  MAIN SIDEBAR
// ─────────────────────────────────────────────
export default function AppSidebar({ isOpen, onClose, userNovels = [] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Read author info from storage
  let authorName = "Author";
  let authorAvatar = "";
  try {
    const keys = ["dt_profile", "userProfile", "profile", "dahtruth_project_meta"];
    for (const key of keys) {
      const raw = storage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj.avatarUrl && !authorAvatar) authorAvatar = obj.avatarUrl;
      if (obj.author)      { authorName = obj.author;      break; }
      if (obj.displayName) { authorName = obj.displayName; break; }
      const fn = obj.firstName || obj.given_name;
      const ln = obj.lastName  || obj.family_name;
      if (fn || ln) { authorName = [fn, ln].filter(Boolean).join(" "); break; }
    }
  } catch { }

  // ── FICTION items ─────────────────────────
  const fictionItems = [
    { icon: Heart,         label: "Hopes, Fears & Legacy", path: "/story-lab/workshop/hfl" },
    { icon: ClipboardList, label: "Priority Cards",         path: "/story-lab/workshop/priorities" },
    { icon: Map,           label: "Character Roadmap",      path: "/story-lab/workshop/roadmap" },
    { icon: FlaskConical,  label: "Plot Builder",           path: "/story-lab/plot-builder" },
    { icon: Layers,        label: "Narrative Arc",          path: "/story-lab/narrative-arc" },
    { icon: Scroll,        label: "Clothesline",            path: "/story-lab/workshop/clothesline" },
  ];

  // ── NONFICTION items ──────────────────────
  const nonfictionItems = [
    { icon: PencilLine,    label: "Essay Builder",          path: "/story-lab/nonfiction/essay-builder" },
    { icon: BookOpen,      label: "Memoir Scene Map",       path: "/story-lab/nonfiction/memoir-scene-map" },
    { icon: FileText,      label: "Research Notes",         path: "/story-lab/nonfiction/research-notes" },
    { icon: GraduationCap, label: "Argument & Theses",      path: "/story-lab/nonfiction/argument-theses" },
    { icon: AlignJustify,  label: "Chapter Outliner",       path: "/story-lab/nonfiction/chapter-outliner" },
  ];

  // ── POETRY items ──────────────────────────
  const poetryItems = [
    { icon: Wand2,         label: "Craft Lab",              path: "/story-lab/poetry/craft-lab" },
    { icon: RefreshCw,     label: "Revision Lab",           path: "/story-lab/poetry/revision-lab" },
    { icon: Fingerprint,   label: "Voice & Identity",       path: "/story-lab/poetry/voice-identity" },
    { icon: BookCopy,      label: "Sequence Builder",       path: "/story-lab/poetry/sequence-builder" },
    { icon: Shuffle,       label: "Remix Lab",              path: "/story-lab/poetry/remix-lab" },
    { icon: Sparkles,      label: "AI Poetry Prompts",      path: "/story-lab/poetry/ai-prompts" },
  ];

  // ── WORKSHOP HUB items ────────────────────
  const hubItems = [
    { icon: MessageSquare, label: "Dialogue Lab",           path: "/story-lab/dialogue-lab" },
    { icon: Lightbulb,     label: "Writing Prompts",        path: "/story-lab/prompts" },
    { icon: Users,         label: "Workshop Community",     path: "/story-lab/community" },
    { icon: Calendar,      label: "Calendar",               path: "/calendar" },
    { icon: Download,      label: "Export",                 path: "/export" },
    { icon: UploadCloud,   label: "Publish",                path: "/publishing" },
  ];

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
          background: "linear-gradient(160deg, rgba(249,245,255,0.96), rgba(234,224,252,0.98))",
          borderRight: "1px solid rgba(209,213,219,0.9)",
        }}
      >
        {/* ── Brand header ── */}
        <div className="px-4 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white shadow-md border border-amber-300/60 flex-shrink-0">
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

          {/* ══ WRITER'S STUDIO ══ */}
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

          {/* ══ STORY LAB STUDIO ══ */}
          <StudioLabel label="Story Lab Studio" navPath="/story-lab" />

          <NavGroup
            icon={BookMarked}
            label="Fiction"
            basePath="/story-lab/fiction"
            items={fictionItems}
            pathname={pathname}
          />

          <NavGroup
            icon={FileText}
            label="Nonfiction"
            basePath="/story-lab/nonfiction"
            items={nonfictionItems}
            pathname={pathname}
          />

          <NavGroup
            icon={Feather}
            label="Poetry"
            basePath="/story-lab/poetry"
            items={poetryItems}
            pathname={pathname}
          />

          <NavGroup
            icon={Compass}
            label="Workshop Hub"
            basePath="/story-lab/hub"
            items={hubItems}
            pathname={pathname}
          />

          {/* ══ AUTHOR STUDIO ══ */}
          <StudioLabel label="Author Studio" />

          <NavItem
            icon={User}
            label="Author Page"
            path="/author"
            active={pathname.startsWith("/author")}
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
                const title  = project.title || "Untitled Story";
                const words  = project.words || project.wordCount || 0;
                const status = project.status || "Draft";

                const handleOpen = () => {
                  try {
                    storage.setItem(
                      "currentStory",
                      JSON.stringify({
                        id: project.id || i,
                        title,
                        status,
                        wordCount: words,
                        lastModified: project.lastModified || new Date().toISOString(),
                      })
                    );
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

        {/* ── Author footer ── */}
        <div className="p-3 border-t border-slate-200 flex-shrink-0">
          <div
            className="p-3 rounded-xl bg-white/90 hover:bg-white transition-colors cursor-pointer border border-slate-200/80"
            onClick={() => navigate("/profile")}
            role="button"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full shadow-sm overflow-hidden flex-shrink-0 grid place-items-center border border-violet-300/70 bg-gradient-to-br from-amber-100 to-violet-200">
                {authorAvatar ? (
                  <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
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
                className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 flex-shrink-0"
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
