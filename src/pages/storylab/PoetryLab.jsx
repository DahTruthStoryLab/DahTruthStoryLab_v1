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
  <div className="min-h-[calc(100vh-64px)] bg-[color:var(--brand-bg,#f6faff)]">
    {/* Top bar */}
    <div className="sticky top-0 z-10 border-b bg-white border-slate-200">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 truncate">
            Poetry Studio
          </h1>
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
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            Refresh
          </button>

          <button
            onClick={onCreatePoem}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white bg-[color:var(--brand-navy,#1e3a5f)] hover:opacity-95"
          >
            + New Poem
          </button>
        </div>
      </div>
    </div>

    {/* 3-pane workspace: LEFT workshops menu, MIDDLE library, RIGHT editor */}
    <div className="px-6 py-6">
      <div className="grid grid-cols-12 gap-6">
        {/* LEFT: Workshops menu (vertical) */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-900">
                Poetry Workshops
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Use labs while you write.
              </div>
            </div>

            {/* vertical stack */}
            <div className="p-3 flex flex-col gap-2">
              <WorkshopLink
                to="/story-lab/poetry/revision"
                title="Revision Lab"
                desc="Tighten diction, sharpen images, strengthen the turn."
              />
              <WorkshopLink
                to="/story-lab/poetry/sequence"
                title="Sequence Builder"
                desc="Arrange poems into an arc: openings, hinges, closers."
              />
              <WorkshopLink
                to="/story-lab/poetry/craft"
                title="Craft Lab"
                desc="Sound, rhythm, line breaks, metaphor, clarity."
              />
              <WorkshopLink
                to="/story-lab/poetry/remix"
                title="Remix Lab"
                desc="Generate variants and controlled experiments."
              />
              <WorkshopLink
                to="/story-lab/poetry/voice"
                title="Voice & Identity"
                desc="Tone, persona, stance, signature style."
              />

              <div className="pt-3 mt-2 border-t border-slate-200">
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

        {/* MIDDLE: Library */}
        <aside className="col-span-12 lg:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Poem Library
              </div>
              <div className="text-xs text-slate-500">{poems.length}</div>
            </div>

            <div className="max-h-[70vh] overflow-auto p-3 space-y-2">
              {poems.length === 0 ? (
                <div className="text-sm text-slate-600 p-2">
                  No poems yet. Click <b>New Poem</b>.
                </div>
              ) : (
                poems
                  .slice()
                  .reverse()
                  .map((p) => {
                    const isActiveRow = String(p.id) === String(activeId);
                    const words = countWords(p.content || "");
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPoem(p.id)}
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          isActiveRow
                            ? "border-slate-300 bg-slate-50"
                            : "border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 truncate">
                            {p.title || "Untitled Poem"}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {words} words
                          </div>
                        </div>
                      </button>
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
                  onChange={(e) => updateActive({ title: e.target.value })}
                  className="w-full text-lg font-semibold text-slate-900 outline-none border border-slate-200 rounded-xl px-3 py-2"
                  placeholder="Poem title"
                />

                <textarea
                  value={activePoem.content || ""}
                  onChange={(e) => updateActive({ content: e.target.value })}
                  className="mt-3 w-full min-h-[56vh] rounded-2xl border border-slate-200 p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Write your poem here…"
                />

                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    Words:{" "}
                    <span className="font-semibold text-slate-700">
                      {stats.words}
                    </span>
                  </div>
                  <div>
                    Lines:{" "}
                    <span className="font-semibold text-slate-700">
                      {stats.lines}
                    </span>
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
