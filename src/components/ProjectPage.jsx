// src/components/ProjectPage.js
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Upload,
  Image,
  Edit3,
  FileText,
  Layers,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import heic2any from "heic2any";

// -------------------- Storage Keys --------------------
const USER_PROJECTS_KEY = "userProjects";
const CURRENT_STORY_KEY = "currentStory";

// -------------------- Helpers: load/save projects --------------------
function normalizeProjects(rawArr) {
  if (!Array.isArray(rawArr)) return [];
  return rawArr.map((p, idx) => ({
    id: p.id || `${p.title || "project"}-${idx}`,
    title: p.title || "Untitled Project",
    status: p.status || "Draft", // Draft | In Progress | Completed
    pages: p.pages || p.pageCount || 0,
    logline: p.logline || "",
    synopsis: p.synopsis || "",
    cover: p.cover || "",
    source: p.source || "Project",
    updatedAt: p.updatedAt || null,
  }));
}

function loadProjects() {
  try {
    const raw = localStorage.getItem(USER_PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return normalizeProjects(arr);
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

function formatUpdatedAt(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// -------------------- Image helpers (HEIC, downscale) --------------------
async function heicArrayBufferToJpegDataUrl(arrayBuffer, quality = 0.9) {
  const blob = new Blob([arrayBuffer], { type: "image/heic" });
  const jpegBlob = await heic2any({ blob, toType: "image/jpeg", quality });
  const dataUrl = await new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(jpegBlob);
  });
  return dataUrl;
}

async function downscaleDataUrl(dataUrl, maxDim = 2000, quality = 0.9) {
  const img = await new Promise((resolve, reject) => {
    const x = new Image();
    x.onload = () => resolve(x);
    x.onerror = reject;
    x.src = dataUrl;
  });
  let { width, height } = img;
  if (Math.max(width, height) <= maxDim) return dataUrl;
  const scale = maxDim / Math.max(width, height);
  width = Math.round(width * scale);
  height = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

// -------------------- Status badge styling --------------------
function getStatusBadgeClasses(status) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border";
  switch (status) {
    case "Completed":
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    case "In Progress":
      return `${base} bg-amber-50 text-amber-700 border-amber-200`;
    case "Draft":
    default:
      return `${base} bg-slate-50 text-slate-700 border-slate-200`;
  }
}

// -------------------- Main Component --------------------
export default function ProjectPage() {
  const navigate = useNavigate();
  const fileInputRefs = useRef({}); // per-project file inputs
  const [projects, setProjects] = useState(() => loadProjects());
  const [uploadingId, setUploadingId] = useState(null);

  // Sync with other tabs / writer page updates
  useEffect(() => {
    const sync = () => {
      setProjects(loadProjects());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("project:change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
    };
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleAddProject = () => {
    const now = new Date().toISOString();
    const next = [
      ...projects,
      {
        id: `project-${Date.now()}`,
        title: "Untitled Project",
        status: "Draft",
        pages: 0,
        logline: "",
        synopsis: "",
        cover: "",
        source: "Project",
        updatedAt: now,
      },
    ];
    setProjects(next);
    saveProjects(next);
  };

  const updateProject = (id, patch) => {
    setProjects((prev) => {
      const next = prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
      );
      saveProjects(next);
      return next;
    });
  };

  const removeProject = (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      saveProjects(next);
      return next;
    });
  };

  const handleOpenWriter = (project) => {
    try {
      const snapshot = {
        id: project.id,
        title: project.title,
        status: project.status || "Draft",
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(CURRENT_STORY_KEY, JSON.stringify(snapshot));
      window.dispatchEvent(new Event("project:change"));
    } catch (err) {
      console.error("Failed to set currentStory:", err);
    }
    navigate("/compose");
  };

  const triggerUpload = (projectId) => {
    const input = fileInputRefs.current[projectId];
    if (input && !uploadingId) {
      input.click();
    }
  };

  const handleCoverPicked = async (projectId, file) => {
    if (!file) return;
    setUploadingId(projectId);
    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Image is too large. Please choose an image under 10MB.");
        setUploadingId(null);
        return;
      }

      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      let dataUrl;
      if (isHEIC) {
        const ab = await file.arrayBuffer();
        const jpegDataUrl = await heicArrayBufferToJpegDataUrl(ab, 0.9);
        dataUrl = await downscaleDataUrl(jpegDataUrl, 2000, 0.9);
      } else {
        dataUrl = await new Promise((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result || ""));
          fr.onerror = reject;
          fr.readAsDataURL(file);
        });
        dataUrl = await downscaleDataUrl(String(dataUrl), 2000, 0.9);
      }

      updateProject(projectId, { cover: dataUrl });
    } catch (err) {
      console.error("Error uploading cover:", err);
      alert("Failed to upload image. Please try again or use a different image.");
    } finally {
      setUploadingId(null);
      const input = fileInputRefs.current[projectId];
      if (input) input.value = "";
    }
  };

  return (
    <div className="min-h-screen text-[color:var(--color-ink)] bg-[color:var(--color-base)] bg-radial-fade py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Back Button */}
        <button
          onClick={handleGoBack}
          className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[hsl(var(--border))] hover:bg-gray-50 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="glass-panel mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[color:var(--color-primary)] grid place-items-center">
                <BookOpen size={20} className="text-[color:var(--color-ink)]/80" />
              </div>
              <div>
                <h1 className="text-3xl heading-serif">Projects</h1>
                <p className="text-sm text-muted mt-1">
                  Manage all your novels and story projects in one place.
                </p>
              </div>
            </div>
            <button
              onClick={handleAddProject}
              className="btn-gold inline-flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add Project
            </button>
          </div>
        </div>

        {/* Empty state */}
        {projects.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <Layers className="mx-auto mb-3 text-[color:var(--color-ink)]/70" size={36} />
            <div className="text-lg font-medium mb-2">No projects yet</div>
            <div className="text-sm text-muted mb-4">
              Start your first project to track your stories, covers, and summaries.
            </div>
            <button
              onClick={handleAddProject}
              className="btn-primary inline-flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Create Your First Project
            </button>
          </div>
        )}

        {/* Project Cards */}
        <div className="space-y-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="glass-panel p-5 flex flex-col md:flex-row gap-4 md:items-stretch"
            >
              {/* Cover */}
              <div className="w-full md:w-40 flex flex-col items-center">
                <div className="w-32 h-44 rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-[color:var(--color-primary)]/40 flex items-center justify-center relative">
                  {uploadingId === project.id ? (
                    <div className="text-center text-xs text-muted px-2">
                      <div className="animate-pulse mb-1">Processing…</div>
                    </div>
                  ) : project.cover ? (
                    <img
                      src={project.cover}
                      alt={`${project.title} cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-muted">
                      <Image size={24} className="mx-auto mb-1 opacity-60" />
                      <div className="text-xs">Upload cover</div>
                    </div>
                  )}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => triggerUpload(project.id)}
                    disabled={uploadingId === project.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-[hsl(var(--border))] hover:bg-gray-50 text-[11px] disabled:opacity-50"
                  >
                    <Upload size={12} />
                    Cover
                  </button>
                  {project.cover && (
                    <button
                      onClick={() => updateProject(project.id, { cover: "" })}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-[hsl(var(--border))] hover:bg-gray-50 text-[11px]"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  ref={(el) => {
                    fileInputRefs.current[project.id] = el;
                  }}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCoverPicked(project.id, file);
                  }}
                />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-3">
                {/* Title + status row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] text-muted mb-1 block">Project Title</label>
                    <input
                      value={project.title}
                      onChange={(e) =>
                        updateProject(project.id, { title: e.target.value || "Untitled Project" })
                      }
                      className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-sm font-semibold outline-none"
                      placeholder="Name of your book or project..."
                      style={{
                        fontFamily:
                          "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                      }}
                    />
                  </div>
                  <div className="w-full md:w-40">
                    <label className="text-[11px] text-muted mb-1 block">Status</label>
                    <select
                      value={project.status || "Draft"}
                      onChange={(e) =>
                        updateProject(project.id, { status: e.target.value || "Draft" })
                      }
                      className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-xs outline-none"
                    >
                      <option>Draft</option>
                      <option>In Progress</option>
                      <option>Completed</option>
                    </select>
                    <div className="mt-1">{/* status pill */}</div>
                    <div className="mt-1">
                      <span className={getStatusBadgeClasses(project.status)}>
                        {project.status || "Draft"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pages + logline */}
                <div className="grid grid-cols-1 md:grid-cols-[120px,1fr] gap-3">
                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Page Count</label>
                    <input
                      type="number"
                      min={0}
                      value={project.pages || 0}
                      onChange={(e) =>
                        updateProject(project.id, {
                          pages: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                      className="w-full rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none"
                      placeholder="0"
                    />
                    <div className="text-[11px] text-muted mt-1">
                      You can treat this as pages or chapters.
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted mb-1 block">Logline</label>
                    <div className="flex items-start gap-2">
                      <FileText size={14} className="mt-2 text-[color:var(--color-ink)]/60" />
                      <input
                        value={project.logline || ""}
                        onChange={(e) =>
                          updateProject(project.id, { logline: e.target.value || "" })
                        }
                        className="flex-1 rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none"
                        placeholder="One-sentence hook for your story..."
                      />
                    </div>
                  </div>
                </div>

                {/* Synopsis */}
                <div>
                  <label className="text-[11px] text-muted mb-1 block">Synopsis</label>
                  <div className="flex items-start gap-2">
                    <Edit3 size={14} className="mt-2 text-[color:var(--color-ink)]/60" />
                    <textarea
                      value={project.synopsis || ""}
                      onChange={(e) =>
                        updateProject(project.id, { synopsis: e.target.value || "" })
                      }
                      className="flex-1 rounded-lg bg-white border border-[hsl(var(--border))] px-3 py-2 text-sm outline-none resize-vertical min-h-[90px]"
                      placeholder="Brief summary of this project..."
                    />
                  </div>
                </div>

                {/* Footer row: updatedAt + actions */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="text-[11px] text-muted flex items-center gap-1">
                    <Layers size={12} />
                    {project.source && (
                      <span className="mr-2 capitalize">{project.source}</span>
                    )}
                    {project.updatedAt && (
                      <>
                        <span>•</span>
                        <span>Updated {formatUpdatedAt(project.updatedAt)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleOpenWriter(project)}
                      className="btn-primary inline-flex items-center gap-2 text-xs px-3 py-1.5"
                    >
                      <BookOpen size={14} />
                      Open in Writer
                    </button>
                    <button
                      onClick={() => removeProject(project.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-red-200 text-[11px] text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
