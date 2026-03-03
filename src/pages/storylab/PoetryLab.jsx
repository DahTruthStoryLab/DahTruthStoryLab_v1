// src/pages/storylab/PoetryLab.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ensureSelectedProject,
  getSelectedProjectId,
  chaptersKeyForProject,
} from "../../lib/projectsSync";

import { storage } from "../../lib/storage";
import { isPoem } from "../../lib/chapterTypes";

import PoetryModule from "../../components/storylab/PoetryModule";

function uid() {
  return `poem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function safeParse(raw, fallback) {
  try {
    const parsed = raw ? JSON.parse(raw) : fallback;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function countWords(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function countLines(text = "") {
  if (!text) return 0;
  return String(text).split("\n").length;
}

const ACTIVE_POEM_KEY_PREFIX = "dt_active_poem_";
function activePoemKey(projectId) {
  return `${ACTIVE_POEM_KEY_PREFIX}${projectId || "unknown"}`;
}

export default function PoetryLab() {
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [chapters, setChapters] = useState([]);
  const [activeId, setActiveId] = useState("");

  const poems = useMemo(() => chapters.filter(isPoem), [chapters]);

  const activePoem = useMemo(() => {
    return poems.find((p) => String(p.id) === String(activeId)) || null;
  }, [poems, activeId]);

  const stats = useMemo(() => {
    const text = activePoem?.content || "";
    return { words: countWords(text), lines: countLines(text) };
  }, [activePoem]);

  // init project
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      if (!id) return;

      setProjectId(id);
      setProjectTitle(p?.title || p?.name || "Untitled Project");
      try {
        storage.setItem("dahtruth-current-project-id", id);
        window.dispatchEvent(new Event("project:change"));
      } catch {}
    } catch (e) {
      console.error("PoetryLab init project failed:", e);
    }
  }, []);

  // load chapters + restore active poem
  useEffect(() => {
    if (!projectId) return;

    const key = chaptersKeyForProject(projectId);
    const list = safeParse(storage.getItem(key), []);
    const safeList = Array.isArray(list) ? list : [];
    setChapters(safeList);

    const savedActive = storage.getItem(activePoemKey(projectId)) || "";
    const poemIds = safeList.filter(isPoem).map((x) => String(x.id));
    const nextActive =
      savedActive && poemIds.includes(String(savedActive))
        ? savedActive
        : poemIds[0] || "";
    setActiveId(nextActive);
  }, [projectId]);

  const persistChapters = useCallback(
    (next) => {
      if (!projectId) return;
      try {
        storage.setItem(chaptersKeyForProject(projectId), JSON.stringify(next || []));
      } catch (e) {
        console.warn("PoetryLab persist failed:", e);
      }
    },
    [projectId]
  );

  const setActivePoemId = useCallback(
    (id) => {
      const val = id ? String(id) : "";
      setActiveId(val);
      try {
        storage.setItem(activePoemKey(projectId), val);
        storage.setItem("dahtruth-selected-chapter-id", val);
      } catch {}
    },
    [projectId]
  );

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

  const openInWriter = useCallback(() => {
    if (!activeId) return;
    try {
      storage.setItem("dahtruth-selected-chapter-id", String(activeId));
    } catch {}
    navigate("/writer");
  }, [activeId, navigate]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[color:var(--brand-bg,#f6faff)]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 border-b bg-white border-slate-200">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-900 truncate">Poetry Studio</h1>
            <p className="text-xs text-slate-600 truncate">
              {projectTitle} • poems stored as Chapters (type: "poem")
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => navigate("/story-lab/hub")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              Hub
            </button>

            <button
              onClick={() => navigate("/ai-tools")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              AI Tools
            </button>

            <button
              onClick={onCreatePoem}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-[color:var(--brand-navy,#1e3a5f)] hover:opacity-95"
            >
              + New Poem
            </button>

            <button
              onClick={openInWriter}
              disabled={!activeId}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!activeId ? "Select a poem first" : "Open in Writer"}
            >
              Open in Writer
            </button>
          </div>
        </div>
      </div>

      {/* 3-pane workspace */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT: Workshops */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-900">Poetry Workshops</div>
                <div className="text-xs text-slate-500 mt-0.5">Use labs while you write.</div>
              </div>
              <div className="p-3">
                <PoetryModule />
              </div>
            </div>
          </aside>

          {/* MIDDLE: Library */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Poem Library</div>
                <div className="text-xs text-slate-500">{poems.length}</div>
              </div>

              <div className="max-h-[70vh] overflow-auto p-3 space-y-2">
                {poems.length === 0 ? (
                  <div className="text-sm text-slate-600 p-2">
                    No poems yet. Click <b>New Poem</b>.
                  </div>
                ) : (
                  poems.map((p) => {
                    const isActiveRow = String(p.id) === String(activeId);
                    const words = countWords(p.content || "");
                    return (
                      <div
                        key={p.id}
                        className={`rounded-xl border p-3 transition cursor-pointer ${
                          isActiveRow
                            ? "border-slate-300 bg-slate-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                        onClick={() => setActivePoemId(p.id)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {p.title || "Untitled Poem"}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">{words} words</div>
                          </div>

                          <button
                            type="button"
                            className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 hover:bg-white text-slate-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePoem(p.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* RIGHT: Editor */}
          <main className="col-span-12 lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white">
              {!activePoem ? (
                <div className="p-6 text-sm text-slate-600">
                  Select a poem, or click <b>New Poem</b> to start.
                </div>
              ) : (
                <div className="p-5">
                  <input
                    value={activePoem.title || ""}
                    onChange={(e) => updateActivePoem({ title: e.target.value })}
                    className="w-full text-lg font-semibold text-slate-900 outline-none border border-slate-200 rounded-xl px-3 py-2"
                    placeholder="Poem title"
                  />

                  <textarea
                    value={activePoem.content || ""}
                    onChange={(e) => updateActivePoem({ content: e.target.value })}
                    className="mt-3 w-full min-h-[56vh] rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                    placeholder="Write your poem here…"
                  />

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      Words: <span className="font-semibold text-slate-700">{stats.words}</span>
                    </div>
                    <div>
                      Lines: <span className="font-semibold text-slate-700">{stats.lines}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
