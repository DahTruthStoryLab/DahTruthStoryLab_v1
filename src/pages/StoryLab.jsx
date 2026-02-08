// src/pages/StoryLab.jsx
// Genre-aware StoryLab page (routes tools/modules by project genre)

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

// ✅ Use your existing project helpers (same ones you used in Publishing)
import {
  ensureSelectedProject,
  getSelectedProjectId,
  chaptersKeyForProject,
} from "../lib/projectsSync";

import { storage } from "../lib/storage";

// ✅ Sidebar router you already wired
import SidebarRouter from "../components/Writing/SidebarRouter";

export default function StoryLab() {
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectTitle, setProjectTitle] = useState("");
  const [genre, setGenre] = useState("General / Undeclared");

  const [chapters, setChapters] = useState([]);
  const [refreshTick, setRefreshTick] = useState(0);

  // Optional: if you already have character extraction elsewhere, you can feed it in later
  const [characters, setCharacters] = useState([]);

  // ✅ Load/ensure selected project on mount
  useEffect(() => {
    try {
      const p = ensureSelectedProject();
      const id = p?.id || getSelectedProjectId() || "";
      if (!id) return;

      setProjectId(id);
      setProjectTitle(p?.title || p?.name || "Untitled Project");
      setGenre(p?.primaryGenre || p?.genre || "General / Undeclared");

      // keep a global current-project id for other pages
      try {
        storage.setItem("dahtruth-current-project-id", id);
        window.dispatchEvent(new Event("project:change"));
      } catch {}
    } catch (e) {
      console.error("StoryLab: failed to init selected project:", e);
    }
  }, []);

  // ✅ Load chapters whenever project changes or we refresh
  useEffect(() => {
    if (!projectId) return;

    try {
      const key = chaptersKeyForProject(projectId);
      const raw = storage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      setChapters(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("StoryLab: failed to load chapters:", e);
      setChapters([]);
    }
  }, [projectId, refreshTick]);

  const onRefresh = useCallback(() => {
    setRefreshTick((n) => n + 1);
  }, []);

  // ✅ Chapter selection behavior (optional)
  // If your Writing page uses a different route, update the navigate target.
  const onSelectChapter = useCallback(
    (chapter) => {
      if (!chapter) return;
      try {
        storage.setItem("dahtruth-selected-chapter-id", chapter.id || "");
      } catch {}
      // Jump back to writing page (adjust if your writing route differs)
      navigate("/writing");
    },
    [navigate]
  );

  // ✅ Tag once: keep a SINGLE tag add function
  // This stores tags on the chapter object (if present) and saves chapters back.
  const onAddTag = useCallback(
    (namespace, value) => {
      if (!projectId || !namespace || !value) return;

      const ns = String(namespace).trim().toLowerCase();
      const val = String(value).trim();
      if (!val) return;

      setChapters((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        if (!next.length) return prev;

        // Try to tag the "active" chapter if you store oneI / selected id.
        let activeId = "";
        try {
          activeId = storage.getItem("dahtruth-selected-chapter-id") || "";
        } catch {}

        const idx = activeId
          ? next.findIndex((c) => String(c.id) === String(activeId))
          : 0;

        const i = idx >= 0 ? idx : 0;
        const ch = next[i] || {};

        const tags = Array.isArray(ch.tags) ? [...ch.tags] : [];
        const tagString = `@${ns}:${val}`;

        if (!tags.includes(tagString)) tags.push(tagString);

        next[i] = { ...ch, tags };

        // persist
        try {
          const key = chaptersKeyForProject(projectId);
          storage.setItem(key, JSON.stringify(next));
        } catch (e) {
          console.warn("StoryLab: failed to persist tags:", e);
        }

        return next;
      });
    },
    [projectId]
  );

  const hasAnyChapters = useMemo(() => (chapters?.length || 0) > 0, [chapters]);

  return (
    <div style={{ padding: 16 }}>
      {/* Simple header (swap in your PageShell later if you want) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>StoryLab</div>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {projectTitle || "Untitled"} • {genre || "General"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate("/writing")}>Back to Writing</button>
          <button onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      {/* ✅ The magic: genre-aware sidebar router */}
      <SidebarRouter
        genre={genre}
        chapters={chapters}
        projectId={projectId}
        projectTitle={projectTitle}
        onRefresh={onRefresh}
        onSelectChapter={onSelectChapter}
        onAddTag={onAddTag}
        hasAnyChapters={hasAnyChapters}
        characters={characters}
      />

      {/* Optional: placeholder for main StoryLab canvas area later */}
      <div style={{ marginTop: 16, opacity: 0.75, fontSize: 13 }}>
        StoryLab canvas area can go here next (modules, boards, trackers, etc.).
      </div>
    </div>
  );
}
