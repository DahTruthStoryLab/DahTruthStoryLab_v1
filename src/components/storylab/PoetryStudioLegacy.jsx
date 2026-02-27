src/components/storylab/PoetryStudioLegacy.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { storage } from "../../lib/storage";
import { ensureSelectedProject, getSelectedProjectId, poemsKeyForProject } from "../../lib/projectsSync";

function uid() {
  return `poem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function countWords(text = "") {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function countLines(text = "") {
  if (!text) return 0;
  return String(text).split("\n").length;
}

export default function PoetryModule() {
  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");

  const [poems, setPoems] = useState([]);
  const [activeId, setActiveId] = useState("");

  const activePoem = useMemo(
    () => poems.find((p) => String(p.id) === String(activeId)) || null,
    [poems, activeId]
  );

  // Init project
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      if (!id) return;
      setProjectId(id);
      setProjectTitle(p?.title || p?.name || "Untitled Project");
    } catch (e) {
      console.error("PoetryStudio: failed to init project:", e);
    }
  }, []);

  // Load poems for project
  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = storage.getItem(poemsKeyForProject(projectId));
      const list = raw ? JSON.parse(raw) : [];
      const safe = Array.isArray(list) ? list : [];
      setPoems(safe);

      // pick active
      if (safe.length && !activeId) setActiveId(safe[0].id);
      if (!safe.length) setActiveId("");
    } catch (e) {
      console.error("PoetryStudio: failed to load poems:", e);
      setPoems([]);
      setActiveId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const persist = useCallback(
    (next) => {
      if (!projectId) return;
      try {
        storage.setItem(poemsKeyForProject(projectId), JSON.stringify(next));
      } catch (e) {
        console.warn("PoetryStudio: failed to persist poems:", e);
      }
    },
    [projectId]
  );

  const createPoem = useCallback(() => {
    const p = {
      id: uid(),
      title: "Untitled Poem",
      body: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPoems((prev) => {
      const next = [p, ...(Array.isArray(prev) ? prev : [])];
      persist(next);
      return next;
    });
    setActiveId(p.id);
  }, [persist]);

  const deletePoem = useCallback(
    (id) => {
      if (!id) return;
      setPoems((prev) => {
        const next = (Array.isArray(prev) ? prev : []).filter((p) => p.id !== id);
        persist(next);
        // move active if needed
        if (activeId === id) {
          setActiveId(next[0]?.id || "");
        }
        return next;
      });
    },
    [activeId, persist]
  );

  const updateActive = useCallback(
    (patch) => {
      if (!activeId) return;
      setPoems((prev) => {
        const next = (Array.isArray(prev) ? prev : []).map((p) => {
          if (p.id !== activeId) return p;
          return { ...p, ...patch, updatedAt: new Date().toISOString() };
        });
        persist(next);
        return next;
      });
    },
    [activeId, persist]
  );

  const stats = useMemo(() => {
    const text = activePoem?.body || "";
    return { words: countWords(text), lines: countLines(text) };
  }, [activePoem]);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Poetry Studio</h1>
          <p className="text-sm text-slate-600 mt-1">
            {projectTitle ? (
              <>
                Project: <span className="font-semibold text-slate-700">{projectTitle}</span>
              </>
            ) : (
              "Draft poems, shape line breaks, and build your poetry collection."
            )}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={createPoem}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            New Poem
          </button>

          <Link
            to="/story-lab/hub"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Back to Hub
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Library */}
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">Poem Library</div>
            <div className="text-xs text-slate-500">{poems.length}</div>
          </div>

          <div className="mt-3 space-y-2 max-h-[420px] overflow-auto pr-1">
            {poems.length === 0 ? (
              <div className="text-sm text-slate-600">
                No poems yet. Click <span className="font-semibold">New Poem</span>.
              </div>
            ) : (
              poems.map((p) => {
                const isActive = p.id === activeId;
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                      isActive ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setActiveId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {p.title || "Untitled Poem"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {countWords(p.body || "")} words
                        </div>
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

        {/* Editor */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 p-4">
          {!activePoem ? (
            <div className="text-sm text-slate-600">
              Select a poem, or click <span className="font-semibold">New Poem</span> to start.
            </div>
          ) : (
            <>
              <input
                value={activePoem.title || ""}
                onChange={(e) => updateActive({ title: e.target.value })}
                className="w-full text-base font-semibold text-slate-800 outline-none border border-slate-200 rounded-xl px-3 py-2"
                placeholder="Poem title"
              />

              <textarea
                value={activePoem.body || ""}
                onChange={(e) => updateActive({ body: e.target.value })}
                className="mt-3 w-full min-h-[340px] rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-200"
                placeholder="Write your poem here..."
              />

              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Words: <span className="font-semibold text-slate-700">{stats.words}</span>
                </div>
                <div>
                  Lines: <span className="font-semibold text-slate-700">{stats.lines}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
