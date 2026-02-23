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

function uid() {
  return `poem_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function PoetryLab() {
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("Untitled Project");
  const [chapters, setChapters] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // ✅ load selected project
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
      console.error("PoetryLab: failed to init selected project:", e);
    }
  }, []);

  // ✅ load all chapters from the ONE source of truth
  useEffect(() => {
    if (!projectId) return;
    try {
      const key = chaptersKeyForProject(projectId);
      const raw = storage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      setChapters(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("PoetryLab: failed to load chapters:", e);
      setChapters([]);
    }
  }, [projectId, refreshTick]);

  const poems = useMemo(() => chapters.filter(isPoem), [chapters]);

  const persistChapters = useCallback(
    (next) => {
      try {
        const key = chaptersKeyForProject(projectId);
        storage.setItem(key, JSON.stringify(next));
      } catch (e) {
        console.warn("PoetryLab: persist failed:", e);
      }
    },
    [projectId]
  );

  const onRefresh = useCallback(() => setRefreshTick((n) => n + 1), []);

  // ✅ Create poem = create a chapter-like item with type:"poem"
  const onCreatePoem = useCallback(() => {
    if (!projectId) return;

    const newPoem = {
      id: uid(),
      type: "poem",
      title: "Untitled Poem",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // optional fields you can use later:
      // section: "Section 1",
      // order: poems.length + 1,
    };

    setChapters((prev) => {
      const next = Array.isArray(prev) ? [...prev, newPoem] : [newPoem];
      persistChapters(next);
      return next;
    });

    // set active and jump to Writer
    try {
      storage.setItem("dahtruth-selected-chapter-id", newPoem.id);
    } catch {}
    navigate("/writer");
  }, [projectId, navigate, persistChapters]);

  const openPoem = useCallback(
    (poem) => {
      if (!poem?.id) return;
      try {
        storage.setItem("dahtruth-selected-chapter-id", poem.id);
      } catch {}
      navigate("/writer");
    },
    [navigate]
  );

  return (
    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Poetry Studio</h1>
          <p className="text-sm text-slate-600 mt-1">
            {projectTitle} • Poems are stored in your Chapters system (type: "poem")
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate("/story-lab/hub")}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Back to Hub
          </button>
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Refresh
          </button>
          <button
            onClick={onCreatePoem}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700"
          >
            + New Poem
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        {poems.length === 0 ? (
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div className="font-semibold text-slate-900">No poems yet</div>
            <div className="text-sm text-slate-600 mt-1">
              Click <b>+ New Poem</b> to create one. It will open in the Writer.
            </div>
          </div>
        ) : (
          poems.map((p) => (
            <button
              key={p.id}
              onClick={() => openPoem(p)}
              className="text-left rounded-2xl bg-white border border-slate-200 p-4 hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 truncate">
                    {p.title || "Untitled Poem"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {p.updatedAt ? `Updated ${new Date(p.updatedAt).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="text-xs font-semibold text-violet-600">
                  Open in Writer →
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
