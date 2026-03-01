// src/pages/storylab/PoetryLab.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  ensureSelectedProject,
  getSelectedProjectId,
  chaptersKeyForProject,
} from "../../lib/projectsSync";

import { storage } from "../../lib/storage";
import { isPoem } from "../../lib/chapterTypes";

// ✅ This should be your WORKSHOPS nav/cards (Revision/Sequence/Craft/etc)
import PoetryModule from "../../components/storylab/PoetryModule";

function uid() {
  return `poem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

// Per-project “active poem” key (so each book/project remembers its last poem)
const ACTIVE_POEM_KEY_PREFIX = "dt_active_poem_";
function activePoemKey(projectId) {
  const pid = projectId || "unknown";
  return `${ACTIVE_POEM_KEY_PREFIX}${pid}`;
}

export default function PoetryLab() {
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");

  const [chapters, setChapters] = useState([]);
  const poems = useMemo(() => chapters.filter(isPoem), [chapters]);

  const [activeId, setActiveId] = useState("");

  const activePoem = useMemo(() => {
    return poems.find((p) => String(p.id) === String(activeId)) || null;
  }, [poems, activeId]);

  // ---------- load selected project ----------
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      if (!id) return;

      setProjectId(id);
      setProjectTitle(p?.title || p?.name || "Untitled Project");

      // keep global current project
      try {
        storage.setItem("dahtruth-current-project-id", id);
        window.dispatchEvent(new Event("project:change"));
      } catch {}
    } catch (e) {
      console.error("PoetryLab: failed to init selected project:", e);
    }
  }, []);

  // ---------- load chapters ----------
  useEffect(() => {
    if (!projectId) return;

    try {
      const key = chaptersKeyForProject(projectId);
      const raw = storage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const safe = Array.isArray(list) ? list : [];
      setChapters(safe);

      // restore active poem for this project if possible
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

  // ---------- set active poem (and remember per project) ----------
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

  // ---------- create poem (stay in PoetryLab; do NOT navigate) ----------
  const onCreatePoem = useCallback(() => {
    if (!projectId) return;

    const newPoem = {
      id: uid(),
      type: "poem",
      title: "Untitled Poem",
      content: "", // poem text
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

          return {
            ...c,
            ...patch,
            updatedAt: new Date().toISOString(),
          };
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

        // if deleting active poem, pick next available
        if (String(activeId) === String(id)) {
          const nextPoem = next.filter(isPoem)[0];
          setActivePoemId(nextPoem?.id || "");
        }

        return next;
      });
    },
    [activeId, persistChapters, setActivePoemId]
  );

  // Optional: if you still want a button to open current poem in Writer
  const openInWriter = useCallback(() => {
    if (!activeId) return;
    try {
      storage.setItem("dahtruth-selected-chapter-id", String(activeId));
    } catch {}
    navigate("/writer");
  }, [activeId, navigate]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Poetry Studio</h1>
          <p className="text-sm text-slate-600 mt-1">
            {projectTitle} • Write poems here and use workshops alongside your draft.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate("/story-lab/hub")}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Back to Hub
          </button>

          <button
            onClick={() => navigate("/ai-tools")}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            AI Tools
          </button>

          <button
            onClick={onCreatePoem}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
          >
            + New Poem
          </button>

          <button
            onClick={openInWriter}
            className="px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700"
            disabled={!activeId}
            title={!activeId ? "Select a poem first" : "Open in the full Writer editor"}
          >
            Open in Writer
          </button>
        </div>
      </div>

      {/* 3-column studio layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Poem Library */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">Poem Library</div>
            <div className="text-xs text-slate-500">{poems.length}</div>
          </div>

          <div className="mt-3 space-y-2 max-h-[520px] overflow-auto pr-1">
            {poems.length === 0 ? (
              <div className="text-sm text-slate-600">
                No poems yet. Click <span className="font-semibold">+ New Poem</span>.
              </div>
            ) : (
              poems.map((p) => {
                const isActive = String(p.id) === String(activeId);
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 cursor-pointer transition-colors ${
                      isActive
                        ? "border-violet-300 bg-violet-50"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setActivePoemId(p.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {p.title || "Untitled Poem"}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          {p.updatedAt
                            ? `Updated ${new Date(p.updatedAt).toLocaleDateString()}`
                            : ""}
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

        {/* CENTER: Editor */}
        <div className="lg:col-span-6 rounded-2xl bg-white border border-slate-200 p-4">
          {!activePoem ? (
            <div className="text-sm text-slate-600">
              Select a poem in the library or click <span className="font-semibold">+ New Poem</span>.
            </div>
          ) : (
            <>
              <input
                value={activePoem.title || ""}
                onChange={(e) => updateActivePoem({ title: e.target.value })}
                className="w-full text-base font-semibold text-slate-800 outline-none border border-slate-200 rounded-xl px-3 py-2"
                placeholder="Poem title"
              />

              <textarea
                value={activePoem.content || ""}
                onChange={(e) => updateActivePoem({ content: e.target.value })}
                className="mt-3 w-full min-h-[520px] rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-200"
                placeholder="Write your poem here..."
              />

              <div className="mt-3 text-xs text-slate-500">
                Tip: keep line breaks exactly as you want them to appear.
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Workshops sidebar */}
        <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900 mb-2">
            Poetry Workshops
          </div>
          <div className="text-xs text-slate-500 mb-3">
            Open a module while you draft. These should route to your Poetry subroutes.
          </div>

          {/* This should render links/cards to:
              /story-lab/poetry/revision, /sequence, /craft, /remix, /voice */}
          <PoetryModule />
        </div>
      </div>
    </div>
  );
}
