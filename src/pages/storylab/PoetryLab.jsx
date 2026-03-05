// src/pages/storylab/PoetryLab.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Sparkles,
  BookOpen,
  RefreshCw,
  Trash2,
  Feather,
} from "lucide-react";

import {
  ensureSelectedProject,
  getSelectedProjectId,
  chaptersKeyForProject,
} from "../../lib/projectsSync";
import { storage } from "../../lib/storage";
import { isPoem } from "../../lib/chapterTypes";

// ✅ Vertical workshops menu (Revision/Sequence/Craft/Remix/Voice)
import PoetryModule from "../../components/storylab/PoetryModule";

// ---------- helpers ----------
function uid() {
  return `poem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function countWords(text = "") {
  const cleaned = String(text || "").trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function countLines(text = "") {
  if (!text) return 0;
  return String(text).split("\n").length;
}

// Per-project active poem key
const ACTIVE_POEM_KEY_PREFIX = "dt_active_poem_";
function activePoemKey(projectId) {
  const pid = projectId || "unknown";
  return `${ACTIVE_POEM_KEY_PREFIX}${pid}`;
}

export default function PoetryLab() {
  const navigate = useNavigate();
  const location = useLocation();

  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");

  const [chapters, setChapters] = useState([]);
  const poems = useMemo(() => chapters.filter(isPoem), [chapters]);

  const [activeId, setActiveId] = useState("");

  const activePoem = useMemo(() => {
    return poems.find((p) => String(p.id) === String(activeId)) || null;
  }, [poems, activeId]);

  // ---------- init selected project ----------
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      if (!id) return;

      setProjectId(id);
      setProjectTitle(p?.title || p?.name || "Untitled Project");

      // keep global current project (optional)
      try {
        storage.setItem("dahtruth-current-project-id", id);
        window.dispatchEvent(new Event("project:change"));
      } catch {}
    } catch (e) {
      console.error("PoetryLab: failed to init selected project:", e);
    }
  }, []);

  // ---------- load chapters ----------
  const loadChapters = useCallback(() => {
    if (!projectId) return;

    try {
      const key = chaptersKeyForProject(projectId);
      const raw = storage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const safe = Array.isArray(list) ? list : [];
      setChapters(safe);

      // restore active poem for this project
      const savedActive = storage.getItem(activePoemKey(projectId)) || "";
      const poemIds = safe.filter(isPoem).map((x) => String(x.id));
      const nextActive =
        savedActive && poemIds.includes(String(savedActive))
          ? savedActive
          : poemIds[0] || "";

      setActiveId(nextActive);
    } catch (e) {
      console.error("PoetryLab: failed to load chapters:", e);
      setChapters([]);
      setActiveId("");
    }
  }, [projectId]);

  useEffect(() => {
    loadChapters();
  }, [loadChapters]);

  // ---------- persist chapters ----------
  const persistChapters = useCallback(
    (next) => {
      if (!projectId) return;
      try {
        storage.setItem(chaptersKeyForProject(projectId), JSON.stringify(next));
      } catch (e) {
        console.warn("PoetryLab: persist failed:", e);
      }
    },
    [projectId]
  );

  // ---------- set active poem ----------
  const setActivePoemId = useCallback(
    (id) => {
      const val = id ? String(id) : "";
      setActiveId(val);
      try {
        storage.setItem(activePoemKey(projectId), val);
      } catch {}
    },
    [projectId]
  );

  // ---------- create poem (STAYS HERE) ----------
  const onCreatePoem = useCallback(() => {
    if (!projectId) return;

    const newPoem = {
      id: uid(),
      type: "poem",
      title: "Untitled Poem",
      content: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setChapters((prev) => {
      const next = Array.isArray(prev) ? [newPoem, ...prev] : [newPoem];
      persistChapters(next);
      return next;
    });

    setActivePoemId(newPoem.id);
  }, [projectId, persistChapters, setActivePoemId]);

  // ---------- update active poem ----------
  const updateActivePoem = useCallback(
    (patch) => {
      if (!activeId) return;

      setChapters((prev) => {
        const next = (Array.isArray(prev) ? prev : []).map((c) => {
          if (String(c.id) !== String(activeId)) return c;
          return { ...c, ...patch, updatedAt: new Date().toISOString() };
        });

        persistChapters(next);
        return next;
      });
    },
    [activeId, persistChapters]
  );

  // ---------- delete poem ----------
  const deletePoem = useCallback(
    (id) => {
      if (!id) return;

      setChapters((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const next = list.filter((c) => String(c.id) !== String(id));
        persistChapters(next);

        if (String(activeId) === String(id)) {
          const nextPoem = next.filter(isPoem)[0];
          setActivePoemId(nextPoem?.id || "");
        }

        return next;
      });
    },
    [activeId, persistChapters, setActivePoemId]
  );

  // ---------- stats ----------
  const stats = useMemo(() => {
    const text = activePoem?.content || "";
    return { words: countWords(text), lines: countLines(text) };
  }, [activePoem]);

  // ---------- AI actions (for now route to AI Tools; later wire to runGrammar/runStyle/etc.) ----------
  const goAiTools = useCallback(() => navigate("/ai-tools"), [navigate]);

  const openInWriter = useCallback(() => {
    if (!activeId) return;
    try {
      storage.setItem("dahtruth-selected-chapter-id", String(activeId));
    } catch {}
    navigate("/writer");
  }, [activeId, navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[color:var(--brand-bg,#f6f7fb)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">
              Poetry
            </h1>
            <p className="text-xs text-slate-600 truncate">
              {projectTitle} • Write poems and use Poetry Studio tools while you draft
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => navigate("/story-lab/hub")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
              type="button"
            >
              <BookOpen className="h-4 w-4" />
              Hub
            </button>

            <button
              onClick={loadChapters}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              onClick={onCreatePoem}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-[color:var(--brand-navy,#1e3a5f)] hover:opacity-95"
              type="button"
            >
              <Plus className="h-4 w-4" />
              New Poem
            </button>

            <button
              onClick={goAiTools}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
              type="button"
            >
              <Sparkles className="h-4 w-4" />
              AI
            </button>

            <button
              onClick={openInWriter}
              disabled={!activeId}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed"
              type="button"
              title={!activeId ? "Select a poem first" : "Open in the full Writer editor"}
            >
              <Feather className="h-4 w-4" />
              Writer
            </button>
          </div>
        </div>
      </div>

      {/* Workspace */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR: Library + Studio */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Poem Library */}
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    Poem Library
                  </div>
                  <div className="text-xs text-slate-500">{poems.length}</div>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Your poems are saved inside Chapters (type: poem)
                </div>
              </div>

              <div className="p-3 space-y-2 max-h-[44vh] overflow-auto">
                {poems.length === 0 ? (
                  <div className="text-sm text-slate-600 p-2">
                    No poems yet. Click <b>New Poem</b>.
                  </div>
                ) : (
                  poems.map((p) => {
                    const isActiveRow = String(p.id) === String(activeId);
                    return (
                      <div
                        key={p.id}
                        className={[
                          "rounded-xl border p-3 transition cursor-pointer",
                          isActiveRow
                            ? "border-slate-300 bg-slate-50"
                            : "border-slate-200 hover:bg-slate-50",
                        ].join(" ")}
                        onClick={() => setActivePoemId(p.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {p.title || "Untitled Poem"}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {countWords(p.content || "")} words
                            </div>
                          </div>

                          <button
                            type="button"
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePoem(p.id);
                            }}
                            title="Delete poem"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Poetry Studio */}
              <div className="border-t border-slate-200">
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-900">
                    Poetry Studio
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Use these craft labs while you draft.
                  </div>
                </div>

                <div className="p-3">
                  <PoetryModule />
                </div>

                <div className="px-4 pb-4">
                  <Link
                    to="/story-lab/hub"
                    className="text-sm font-semibold text-[color:var(--brand-navy,#1e3a5f)] hover:underline"
                  >
                    Back to StoryLab Hub →
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER: Editor */}
          <main className="col-span-12 lg:col-span-9">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {!activePoem ? (
                <div className="p-8 text-sm text-slate-600">
                  Select a poem from the library, or click <b>New Poem</b> to start.
                </div>
              ) : (
                <div className="p-6">
                  {/* Editor header */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="min-w-0 flex-1">
                      <input
                        value={activePoem.title || ""}
                        onChange={(e) => updateActivePoem({ title: e.target.value })}
                        className="w-full text-xl font-semibold text-slate-900 outline-none border border-slate-200 rounded-2xl px-4 py-3"
                        placeholder="Poem title"
                      />
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-4">
                        <span>
                          Words:{" "}
                          <span className="font-semibold text-slate-700">
                            {stats.words}
                          </span>
                        </span>
                        <span>
                          Lines:{" "}
                          <span className="font-semibold text-slate-700">
                            {stats.lines}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Compact AI actions (route to AI tools page for now) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goAiTools}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
                        title="Open AI tools"
                      >
                        <Sparkles className="h-4 w-4" />
                        AI Tools
                      </button>
                    </div>
                  </div>

                  {/* Editor body */}
                  <textarea
                    value={activePoem.content || ""}
                    onChange={(e) => updateActivePoem({ content: e.target.value })}
                    className="w-full min-h-[62vh] rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Write your poem here…"
                  />

                  <div className="mt-3 text-xs text-slate-500">
                    Tip: keep line breaks exactly as you want them to appear.
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* subtle footer spacing */}
      <div className="h-10" />
    </div>
  );
}
