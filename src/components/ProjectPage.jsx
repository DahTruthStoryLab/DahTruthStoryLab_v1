// src/components/ProjectPage.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Upload,
  Trash2,
  PencilLine,
  BarChart3,
  Clock,
  Layers,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import heic2any from "heic2any";

// -------------------- Storage helpers --------------------
const PROJECTS_KEY = "userProjects";

function loadProjects() {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects:", err);
  }
}

// -------------------- Image helpers --------------------
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

// -------------------- Misc helpers --------------------
const countWords = (s = "") => s.trim().split(/\s+/).filter(Boolean).length;
const getReadingTime = (wordCount) => Math.ceil(wordCount / 200);
const progressPct = (cur, tgt) =>
  Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);

const getStatusColor = (status) => {
  const pill = (bg, text, border) =>
    `bg-[${bg}] text-[${text}] border ${border} rounded-full`;
  const colors = {
    Idea: pill(
      "color:rgba(202,177,214,0.20)",
      "color:#6B4F7A",
      "border-[hsl(var(--border))]"
    ),
    Outline: pill(
      "color:rgba(234,242,255,0.60)",
      "color:#0F172A",
      "border-[hsl(var(--border))]"
    ),
    Draft: pill(
      "color:rgba(255,213,0,0.15)",
      "color:#7A5E00",
      "border-[hsl(var(--border))]"
    ),
    Revision: pill(
      "color:rgba(255,173,51,0.18)",
      "color:#7A3E00",
      "border-[hsl(var(--border))]"
    ),
    Editing: pill(
      "color:rgba(46,204,113,0.18)",
      "color:#1E6B43",
      "border-[hsl(var(--border))]"
    ),
    Published: pill(
      "color:rgba(212,175,55,0.18)",
      "color:#6B5A1E",
      "border-[hsl(var(--border))]"
    ),
  };
  return colors[status] || colors.Draft;
};

// -------------------- Main Component --------------------
export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [coverUploadId, setCoverUploadId] = useState(null);

  useEffect(() => {
    setProjects(loadProjects());
  }, []);

  // Keep in sync if other tabs / parts of app modify projects
  useEffect(() => {
    const sync = () => setProjects(loadProjects());
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
      navigate("/dashboard");
    }
  };

  const addProject = () => {
    const now = new Date().toISOString();
    setProjects((prev) => {
      const newProject = {
        id: Date.now().toString(),
        title: "Untitled Project",
        logline: "",
        synopsis: "",
        status: "Draft",
        targetWords: 25000,
        wordCount: 0,
        cover: "",
        createdAt: now,
        lastModified: now,
      };
      const updated = [newProject, ...prev];
      saveProjects(updated);
      return updated;
    });
  };

  const updateProject = (id, patch) => {
    setProjects((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...patch, lastModified: now } : p
      );
      saveProjects(updated);
      return updated;
    });
  };

  const deleteProject = (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setProjects((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      saveProjects(updated);
      return updated;
    });
  };

  const openInWriter = (project) => {
    // Lightweight "current story" handoff for Writer page
    const snapshot = {
      id: project.id,
      title: project.title,
      wordCount: project.wordCount || 0,
      lastModified: project.lastModified || new Date().toISOString(),
      status: project.status || "Draft",
      targetWords: project.targetWords || 25000,
    };
    try {
      localStorage.setItem("currentStory", JSON.stringify(snapshot));
      window.dispatchEvent(new Event("project:change"));
    } catch (err) {
      console.error("Failed to set currentStory:", err);
    }
    navigate("/writer");
  };

  // Handle cover upload per project (JPG/PNG/HEIC, including iPhone photos)
  const handleCoverChange = async (projectId, fileInputEvent) => {
    const file = fileInputEvent.target.files?.[0];
    if (!file) return;
    setCoverUploadId(projectId);
    try {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("Image is too large. Please choose an image under 10MB.");
        return;
      }

      const isHEIC =
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif") ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      let dataUrl = "";
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
      setCoverUploadId(null);
      fileInputEvent.target.value = "";
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
        <div className="glass-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[color:var(--color-primary)] grid place-items-center">
                <Layers size={20} className="text-[color:var(--color-ink)]/80" />
              </div>
              <div>
                <h1 className="text-3xl heading-serif flex items-center gap-2">
                  <Layers size={20} className="text-[color:var(--color-ink)]/80" />
                  Projects
                </h1>
                <div className="text-sm text-muted mt-1">
                  Manage all of your novels and writing projects in one place.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={addProject}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} /> New Project
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {projects.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-[color:var(--color-primary)]/60 flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-[color:var(--color-ink)]/80" />
              </div>
              <h2 className="text-xl font-semibold mb-2 heading-serif">
                No projects yet
              </h2>
              <p className="text-sm text-muted mb-4 max-w-md mx-auto">
                Create your first project to start tracking your novels, covers,
                word counts, and story details.
              </p>
              <button
                onClick={addProject}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus size={16} /> Create Your First Project
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {projects.map((project) => {
                const wordCount = project.wordCount || 0;
                const targetWords = project.targetWords || 0;
                const pct = progressPct(wordCount, targetWords || 25000);
                const readTime = getReadingTime(wordCount);
                const lastUpdated = project.lastModified
                  ? new Date(project.lastModified).toLocaleDateString()
                  : "—";

                return (
                  <div key={project.id} className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
                    {/* Top row: cover + main details */}
                    <div className="flex gap-4">
                      {/* Cover */}
                      <div className="w-28 md:w-32 flex-shrink-0">
                        <div className="rounded-xl overflow-hidden border border-[hsl(var(--border))] bg-[color:var(--color-primary)]/40 aspect-[3/4] flex items-center justify-center relative">
                          {coverUploadId === project.id ? (
                            <div className="text-center">
                              <Loader2
                                size={24}
                                className="mx-auto mb-1 animate-spin text-[color:var(--color-ink)]/70"
                              />
                              <div className="text-[10px] text-muted">
                                Processing...
                              </div>
                            </div>
                          ) : project.cover ? (
                            <img
                              src={project.cover}
                              alt={`${project.title} cover`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center text-muted px-2">
                              <ImageIcon
                                size={20}
                                className="mx-auto mb-1 opacity-70"
                              />
                              <div className="text-[11px]">
                                Add a cover image
                              </div>
                            </div>
                          )}
                        </div>
                        <label className="mt-2 block">
                          <span className="inline-flex items-center justify-center gap-1 w-full px-2 py-1.5 rounded-lg bg-white border border-[hsl(var(--border))] text-[11px] text-ink cursor-pointer hover:bg-gray-50 transition-colors">
                            <Upload size={12} />
                            {project.cover ? "Change Cover" : "Upload Cover"}
                          </span>
                          <input
                            type="file"
                            accept="image/*,.heic,.heif"
                            className="hidden"
                            onChange={(e) => handleCoverChange(project.id, e)}
                          />
                        </label>
                      </div>

                      {/* Main info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <input
                              value={project.title || ""}
                              onChange={(e) =>
                                updateProject(project.id, {
                                  title: e.target.value,
                                })
                              }
                              placeholder="Project title..."
                              className="w-full bg-transparent border border-transparent hover:border-[hsl(var(--border))] rounded-lg px-2 py-1 text-base font-semibold outline-none focus:border-[hsl(var(--border))]"
                              style={{
                                fontFamily:
                                  "Playfair Display, ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
                              }}
                            />
                            <input
                              value={project.logline || ""}
                              onChange={(e) =>
                                updateProject(project.id, {
                                  logline: e.target.value,
                                })
                              }
                              placeholder="One-sentence logline..."
                              className="mt-1 w-full bg-transparent border border-transparent hover:border-[hsl(var(--border))] rounded-lg px-2 py-1 text-xs text-muted outline-none focus:border-[hsl(var(--border))]"
                            />
                          </div>

                          <select
                            value={project.status || "Draft"}
                            onChange={(e) =>
                              updateProject(project.id, {
                                status: e.target.value,
                              })
                            }
                            className={`ml-2 px-3 py-1 text-xs font-medium ${getStatusColor(
                              project.status || "Draft"
                            )}`}
                          >
                            {[
                              "Idea",
                              "Outline",
                              "Draft",
                              "Revision",
                              "Editing",
                              "Published",
                            ].map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>

                        <textarea
                          value={project.synopsis || ""}
                          onChange={(e) =>
                            updateProject(project.id, {
                              synopsis: e.target.value,
                            })
                          }
                          placeholder="Short synopsis of this project..."
                          className="mt-2 w-full bg-transparent border border-[hsl(var(--border))] rounded-lg px-2 py-2 text-xs text-ink/80 outline-none min-h-[72px] resize-vertical"
                        />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-3 text-xs text-muted">
                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <BarChart3
                            size={14}
                            className="text-[color:var(--color-ink)]/70"
                          />
                          <span>Word Count</span>
                        </div>
                        <div className="text-sm font-semibold text-ink">
                          {wordCount.toLocaleString()}{" "}
                          {targetWords
                            ? ` / ${targetWords.toLocaleString()}`
                            : ""}
                        </div>
                        {targetWords > 0 && (
                          <div className="mt-1 w-full bg-[color:var(--color-primary)]/40 rounded-full h-1.5">
                            <div
                              className="bg-[color:var(--color-accent)] h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-1">
                          <Clock
                            size={14}
                            className="text-[color:var(--color-ink)]/70"
                          />
                          <span>Est. Read Time</span>
                        </div>
                        <div className="text-sm font-semibold text-ink">
                          {readTime} min
                        </div>
                        <div className="mt-1 text-[11px] text-muted">
                          Last updated: {lastUpdated}
                        </div>
                      </div>
                    </div>

                    {/* Target words + actions */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-3 border-t border-[hsl(var(--border))]">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted">Target words:</span>
                        <input
                          type="number"
                          min="0"
                          step="500"
                          value={targetWords}
                          onChange={(e) =>
                            updateProject(project.id, {
                              targetWords: Number(e.target.value) || 0,
                            })
                          }
                          className="w-24 rounded-lg bg-white border border-[hsl(var(--border))] px-2 py-1 text-xs outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openInWriter(project)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[color:var(--color-accent)] text-xs font-semibold hover:opacity-90"
                        >
                          <PencilLine size={14} /> Open in Writer
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-[hsl(var(--border))] text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
