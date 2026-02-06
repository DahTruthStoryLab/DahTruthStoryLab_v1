import React, { useEffect, useMemo, useState } from "react";
import { ensureSelectedProject, getSelectedProjectId } from "../../lib/projectsSync";
import { storage } from "../../lib/storage";
import { WORKSHOP_MODULES, normalizeGenre, WorkshopGenre } from "../../lib/workshopModules";

function getProjectGenreSafe(): WorkshopGenre {
  try {
    const p = ensureSelectedProject();
    // If your project shape uses p.genre already, this will work.
    // If it’s stored elsewhere, adjust here ONLY.
    return normalizeGenre((p as any)?.genre);
  } catch {
    return "General";
  }
}

function getCurrentManuscriptMeta(projectId: string) {
  // You can adapt this to your actual manuscript storage.
  // This keeps it safe: if you store chapters, return count; if you store full draft, return length.
  try {
    const chaptersKey = `dahtruth-chapters:${projectId}`;
    const raw = storage.getItem(chaptersKey);
    if (!raw) return { label: "No chapters found yet", detail: "" };

    const chapters = JSON.parse(raw);
    const count = Array.isArray(chapters) ? chapters.length : 0;
    return { label: "Current manuscript", detail: `${count} chapter(s)` };
  } catch {
    return { label: "Current manuscript", detail: "" };
  }
}

export default function WorkshopPanel() {
  const [projectId, setProjectId] = useState<string>("");
  const [genre, setGenre] = useState<WorkshopGenre>("General");

  // Init + listen for project changes
  useEffect(() => {
    const init = () => {
      const p = ensureSelectedProject();
      const id = (p as any)?.id || getSelectedProjectId() || "";
      setProjectId(id);
      setGenre(normalizeGenre((p as any)?.genre));
    };

    try {
      init();
    } catch {}

    const onChange = () => {
      try {
        init();
      } catch {}
    };

    window.addEventListener("project:change", onChange);
    return () => window.removeEventListener("project:change", onChange);
  }, []);

  const module = useMemo(() => WORKSHOP_MODULES[genre] ?? WORKSHOP_MODULES.General, [genre]);
  const manuscriptMeta = useMemo(() => getCurrentManuscriptMeta(projectId), [projectId]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{module.headerTitle}</div>
        <div style={{ opacity: 0.85, marginTop: 6 }}>{module.headerDescription}</div>

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          <strong>Genre:</strong> {genre}
          {projectId ? (
            <>
              {" "}
              <span style={{ opacity: 0.7 }}>•</span>{" "}
              <strong>Project:</strong> {projectId}
              {" "}
              <span style={{ opacity: 0.7 }}>•</span>{" "}
              <strong>{manuscriptMeta.label}:</strong> {manuscriptMeta.detail}
            </>
          ) : null}
        </div>
      </div>

      {module.steps.length === 0 ? (
        <div style={{ padding: 12, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12 }}>
          Select a project with a genre (Fiction, Non-Fiction, or Poetry) to see the matching roadmap and tools.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {module.steps.map((s) => (
            <div
              key={s.id}
              style={{
                padding: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
              }}
            >
              <div style={{ fontWeight: 700 }}>{s.title}</div>
              <div style={{ opacity: 0.85, marginTop: 6 }}>{s.description}</div>
              <div style={{ opacity: 0.75, marginTop: 8, fontSize: 13 }}>
                <strong>Tools:</strong> {s.tools.join(" • ")}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
