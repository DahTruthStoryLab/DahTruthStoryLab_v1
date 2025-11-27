// src/components/ProjectPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Upload,
  Trash2,
  PencilLine,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Grid,
  List,
  Users,
  FileText,
  Calendar,
  Trophy,
  Edit3,
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

// -------------------- Profile helper --------------------
function readAuthorProfile() {
  let name = "New Author";
  let avatarUrl = "";

  try {
    const keys = [
      "dahtruth_project_meta",
      "dt_profile",
      "userProfile",
      "profile",
      "currentUser",
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);

      if (obj.avatarUrl && !avatarUrl) {
        avatarUrl = obj.avatarUrl;
      }

      if (obj.author) {
        name = obj.author;
        break;
      }

      if (obj.displayName) {
        name = obj.displayName;
        break;
      }

      const fn = obj.firstName || obj.given_name;
      const ln = obj.lastName || obj.family_name;
      if (fn || ln) {
        name = [fn, ln].filter(Boolean).join(" ");
        break;
      }

      if (obj.username) {
        name = obj.username;
        break;
      }
    }
  } catch {
    // ignore and fall back to defaults
  }

  return { name, avatarUrl };
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
const getReadingTime = (wordCount) => Math.ceil((wordCount || 0) / 200);
const progressPct = (cur, tgt) =>
  Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);

const statusColors = {
  Idea: {
    bg: "linear-gradient(135deg, rgba(202,177,214,0.25), rgba(202,177,214,0.1))",
    text: "#6B4F7A",
    border: "rgba(202,177,214,0.4)",
  },
  Outline: {
    bg: "linear-gradient(135deg, rgba(147,197,253,0.25), rgba(147,197,253,0.1))",
    text: "#1e40af",
    border: "rgba(147,197,253,0.4)",
  },
  Draft: {
    bg: "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))",
    text: "#92400e",
    border: "rgba(251,191,36,0.4)",
  },
  Revision: {
    bg: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(251,146,60,0.1))",
    text: "#9a3412",
    border: "rgba(251,146,60,0.4)",
  },
  Editing: {
    bg: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))",
    text: "#065f46",
    border: "rgba(52,211,153,0.4)",
  },
  Published: {
    bg: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))",
    text: "#78350f",
    border: "rgba(212,175,55,0.4)",
  },
};

const getStatusStyle = (status) => {
  const colors = statusColors[status] || statusColors.Draft;
  return {
    background: colors.bg,
    color: colors.text,
    border: `1px solid ${colors.border}`,
  };
};

// -------------------- Main Component --------------------
export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [coverUploadId, setCoverUploadId] = useState(null);
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [authorName, setAuthorName] = useState("New Author");
  const [authorAvatar, setAuthorAvatar] = useState("");

  useEffect(() => {
    setProjects(loadProjects());
    const profile = readAuthorProfile();
    setAuthorName(profile.name);
    setAuthorAvatar(profile.avatarUrl);
  }, []);

  // Keep in sync if other tabs / parts of app modify projects or profile
  useEffect(() => {
    const sync = () => {
      setProjects(loadProjects());
      const profile = readAuthorProfile();
      setAuthorName(profile.name);
      setAuthorAvatar(profile.avatarUrl);
    };
    window.addEventListener("storage", sync);
    window.addEventListener("project:change", sync);
    window.addEventListener("profile:updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
      window.removeEventListener("profile:updated", sync);
    };
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  // -------- Author name: source of truth here --------
  const handleAuthorNameSave = (newName) => {
    const trimmed = (newName || "").trim() || "New Author";

    setAuthorName(trimmed);

    // 1) Update all projects' author field
    setProjects((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        author: trimmed,
      }));
      saveProjects(updated);
      return updated;
    });

    // 2) Save to a profile object so Dashboard can read it
    try {
      const existingProfileRaw = localStorage.getItem("profile");
      const existingProfile = existingProfileRaw
        ? JSON.parse(existingProfileRaw)
        : {};
      const profileToSave = {
        ...existingProfile,
        displayName: trimmed,
        avatarUrl: authorAvatar || existingProfile.avatarUrl || "",
      };
      localStorage.setItem("profile", JSON.stringify(profileToSave));
      window.dispatchEvent(new Event("profile:updated"));
    } catch (err) {
      console.error("Failed to save profile from ProjectPage:", err);
    }
  };

  const addProject = () => {
    const now = new Date().toISOString();
    setProjects((prev) => {
      const newProject = {
        id: Date.now().toString(),
        title: "Untitled Project",
        author: authorName,
        logline: "",
        synopsis: "",
        genre: [],
        status: "Draft",
        targetWords: 50000,
        wordCount: 0,
        chapterCount: 0,
        characterCount: 0,
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
    const snapshot = {
      id: project.id,
      title: project.title,
      wordCount: project.wordCount || 0,
      lastModified: project.lastModified || new Date().toISOString(),
      status: project.status || "Draft",
      targetWords: project.targetWords || 50000,
    };
    try {
      localStorage.setItem("currentStory", JSON.stringify(snapshot));
      window.dispatchEvent(new Event("project:change"));
    } catch (err) {
      console.error("Failed to set currentStory:", err);
    }
    // 🔹 Use /compose so it lands in your new ComposePage
    navigate("/compose");
  };

  // Handle cover upload
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

  // Handle import - redirects to compose after creating the project
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const now = new Date().toISOString();
    const newProject = {
      id: Date.now().toString(),
      title: file.name.replace(/\.[^/.]+$/, ""),
      author: authorName,
      logline: "",
      synopsis: "",
      genre: [],
      status: "Draft",
      targetWords: 50000,
      wordCount: 0,
      chapterCount: 0,
      characterCount: 0,
      cover: "",
      createdAt: now,
      lastModified: now,
      imported: true,
    };

    const updated = [newProject, ...projects];
    saveProjects(updated);
    setProjects(updated);

    localStorage.setItem(
      "currentStory",
      JSON.stringify({
        id: newProject.id,
        title: newProject.title,
        wordCount: 0,
        lastModified: now,
        status: "Draft",
        targetWords: 50000,
      })
    );
    window.dispatchEvent(new Event("project:change"));
    navigate("/compose");

    e.target.value = "";
  };

  // Calculate totals
  const totalWords = projects.reduce(
    (sum, p) => sum + (p.wordCount || 0),
    0
  );
  const inProgress = projects.filter(
    (p) => !["Published", "Idea"].includes(p.status)
  ).length;
  const published = projects.filter((p) => p.status === "Published").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className="min-h-screen text-gray-800"
      style={{
        background:
          "linear-gradient(135deg, #fef5ff 0%, #f8e8ff 50%, #fff5f7 100%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Dashboard Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #f5e6b3)", // gold gradient
            color: "#1f2937",
            border: "1px solid rgba(180,142,38,0.9)",
            boxShadow: "0 6px 18px rgba(180,142,38,0.35)",
          }}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Page Header */}
        <div
          className="rounded-3xl p-8 mb-8"
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148,163,184,0.3)",
            boxShadow: "0 14px 45px rgba(15,23,42,0.08)",
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: "linear-gradient(135deg, #b897d6, #e3c8ff)",
                  boxShadow: "0 10px 30px rgba(155,123,201,0.35)",
                }}
              >
                📚
              </div>
              <div>
                <h1
                  className="text-4xl font-semibold mb-1"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: "#111827",
                  }}
                >
                  Projects
                </h1>

                <p className="text-sm text-gray-500">
                  Author{" "}
                  <span className="font-medium text-gray-800">
                    {authorName}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const current =
                        authorName === "New Author" ? "" : authorName;
                      const next = window.prompt(
                        "Update author / pen name:",
                        current
                      );
                      if (next !== null) {
                        handleAuthorNameSave(next);
                      }
                    }}
                    className="inline-flex items-center gap-1 ml-2 text-xs text-purple-600 hover:text-purple-800"
                  >
                    <PencilLine size={14} />
                    Edit
                  </button>
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {projects.length} projects •{" "}
                  {totalWords.toLocaleString()} total words
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View Toggle */}
              <div
                className="flex rounded-xl p-1"
                style={{
                  background: "rgba(248,250,252,0.95)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white shadow-md text-purple-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="Grid View"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white shadow-md text-purple-700"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>

              {/* Import Button */}
              <label
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold cursor-pointer transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <Upload size={16} />
                Import Project
                <input
                  type="file"
                  accept=".doc,.docx,.txt,.rtf"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>

              {/* New Project Button */}
              <button
                onClick={addProject}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #9b7bc9, #b897d6)",
                  boxShadow: "0 8px 24px rgba(155,123,201,0.5)",
                }}
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              icon: <BookOpen size={18} />,
              value: projects.length,
              label: "Projects",
            },
            {
              icon: <FileText size={18} />,
              value: totalWords.toLocaleString(),
              label: "Words Written",
            },
            {
              icon: <Edit3 size={18} />,
              value: inProgress,
              label: "In Progress",
            },
            {
              icon: <Trophy size={18} />,
              value: published,
              label: "Published",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.95)",
                border: "1px solid rgba(148,163,184,0.35)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(155,123,201,0.12)" }}
              >
                <span className="text-purple-700">{stat.icon}</span>
              </div>
              <div>
                <div
                  className="text-2xl font-semibold"
                  style={{
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: "#111827",
                  }}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State / Grid / List */}
        {projects.length === 0 ? (
          <div
            className="rounded-3xl p-16 text-center"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: "rgba(155,123,201,0.12)" }}
            >
              📚
            </div>
            <h2
              className="text-3xl font-semibold mb-3"
              style={{
                fontFamily: "'EB Garamond', Georgia, serif",
                color: "#111827",
              }}
            >
              No Projects Yet
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              Create your first project to start tracking your novels, covers,
              word counts, and story details in one place.
            </p>
            <button
              onClick={addProject}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-semibold text-white transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #9b7bc9, #b897d6)",
                boxShadow: "0 8px 24px rgba(155,123,201,0.5)",
              }}
            >
              <Plus size={18} />
              Create Your First Project
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {projects.map((project) => {
              const wordCount = project.wordCount || 0;
              const targetWords = project.targetWords || 50000;
              const pct = progressPct(wordCount, targetWords);
              const readTime = getReadingTime(wordCount);

              return (
                <div
                  key={project.id}
                  className="rounded-3xl overflow-hidden transition-all hover:-translate-y-2"
                  style={{
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(148,163,184,0.35)",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                  }}
                >
                  <div className="flex">
                    {/* Cover */}
                    <div
                      className="w-40 flex-shrink-0 relative"
                      style={{
                        background:
                          "linear-gradient(135deg, #e8dff5, #f5e6ff)",
                      }}
                    >
                      {coverUploadId === project.id ? (
                        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center">
                          <Loader2
                            size={24}
                            className="animate-spin text-purple-400 mb-2"
                          />
                          <span className="text-xs text-gray-500">
                            Processing...
                          </span>
                        </div>
                      ) : project.cover ? (
                        <img
                          src={project.cover}
                          alt={`${project.title} cover`}
                          className="w-full h-full min-h-[280px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-4">
                          <ImageIcon
                            size={40}
                            className="text-purple-300 mb-3"
                          />
                          <span className="text-xs text-gray-400 text-center">
                            Add book cover
                          </span>
                        </div>
                      )}

                      <label
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105"
                        style={{
                          background: "rgba(255,255,255,0.98)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(148,163,184,0.5)",
                        }}
                      >
                        <Upload size={12} />
                        {project.cover ? "Change" : "Upload"}
                        <input
                          type="file"
                          accept="image/*,.heic,.heif"
                          className="hidden"
                          onChange={(e) => handleCoverChange(project.id, e)}
                        />
                      </label>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 flex flex-col">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1 min-w-0">
                          <input
                            value={project.title || ""}
                            onChange={(e) =>
                              updateProject(project.id, {
                                title: e.target.value,
                              })
                            }
                            placeholder="Project title..."
                            className="w-full bg-transparent text-xl font-semibold outline-none border-b-2 border-transparent hover:border-purple-200 focus:border-purple-400 transition-colors pb-1"
                            style={{
                              fontFamily: "'EB Garamond', Georgia, serif",
                              color: "#111827",
                            }}
                          />
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-semibold"
                              style={{
                                background:
                                  "linear-gradient(135deg, #D4AF37, #9b7bc9)",
                              }}
                            >
                              {(project.author || authorName)
                                ?.charAt(0)
                                ?.toUpperCase() || "A"}
                            </div>
                            <span>by {project.author || authorName}</span>
                          </div>
                        </div>
                        <select
                          value={project.status || "Draft"}
                          onChange={(e) =>
                            updateProject(project.id, {
                              status: e.target.value,
                            })
                          }
                          className="ml-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full cursor-pointer outline-none"
                          style={getStatusStyle(project.status || "Draft")}
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

                      {/* Logline */}
                      <input
                        value={project.logline || ""}
                        onChange={(e) =>
                          updateProject(project.id, {
                            logline: e.target.value,
                          })
                        }
                        placeholder="One-sentence logline describing your story..."
                        className="mt-3 w-full bg-transparent text-sm text-gray-600 italic outline-none"
                      />

                      {/* Progress */}
                      <div
                        className="mt-4 p-4 rounded-2xl"
                        style={{
                          background: "rgba(248,250,252,0.9)",
                        }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500 font-medium">
                            Word Count Progress
                          </span>
                          <span className="text-sm font-bold text-purple-900">
                            {wordCount.toLocaleString()} /{" "}
                            {targetWords.toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="h-2 rounded-full overflow-hidden"
                          style={{
                            background: "rgba(148,163,184,0.25)",
                          }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background:
                                "linear-gradient(90deg, #9b7bc9, #D4AF37)",
                            }}
                          />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span>{Math.round(pct)}% complete</span>
                          <span>~{readTime} min read</span>
                        </div>
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          {
                            icon: <FileText size={16} />,
                            value: project.chapterCount || 0,
                            label: "Chapters",
                          },
                          {
                            icon: <Users size={16} />,
                            value: project.characterCount || 0,
                            label: "Characters",
                          },
                          {
                            icon: <Calendar size={16} />,
                            value: formatDate(project.lastModified),
                            label: "Last Edit",
                          },
                        ].map((stat, i) => (
                          <div
                            key={i}
                            className="text-center p-3 rounded-xl"
                            style={{
                              background: "rgba(248,250,252,0.9)",
                            }}
                          >
                            <div className="text-purple-400 flex justify-center mb-1">
                              {stat.icon}
                            </div>
                            <div
                              className="text-base font-bold text-purple-900"
                              style={{
                                fontFamily: "'EB Garamond', Georgia, serif",
                              }}
                            >
                              {stat.value}
                            </div>
                            <div className="text-[10px] text-gray-400 uppercase">
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                        <button
                          onClick={() => openInWriter(project)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
                          style={{
                            background:
                              "linear-gradient(135deg, #9b7bc9, #b897d6)",
                          }}
                        >
                          <Edit3 size={16} /> Write
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="px-4 py-3 rounded-xl text-sm transition-all hover:scale-105"
                          style={{
                            background: "rgba(239,68,68,0.06)",
                            color: "#dc2626",
                            border: "1px solid rgba(239,68,68,0.35)",
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New Project Card */}
            <div
              onClick={addProject}
              className="rounded-3xl p-10 text-center cursor-pointer transition-all hover:-translate-y-2 flex flex-col items-center justify-center min-h-[320px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(155,123,201,0.06), rgba(212,175,55,0.04))",
                border: "1px dashed rgba(155,123,201,0.35)",
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, #9b7bc9, #D4AF37)",
                }}
              >
                +
              </div>
              <div
                className="text-xl font-semibold"
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: "#4b3b61",
                }}
              >
                Create New Project
              </div>
              <div className="text-sm text-gray-400 mt-2">
                Start your next story
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.96)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(148,163,184,0.35)",
            }}
          >
            {/* List Header */}
            <div
              className="grid gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500"
              style={{
                gridTemplateColumns:
                  "60px 2fr 1fr 100px 80px 100px 120px 100px",
                background: "rgba(148,163,184,0.12)",
                borderBottom: "1px solid rgba(15,23,42,0.06)",
              }}
            >
              <span>Cover</span>
              <span>Title / Author</span>
              <span>Genre</span>
              <span>Words</span>
              <span>Chapters</span>
              <span>Last Edit</span>
              <span>Progress</span>
              <span>Actions</span>
            </div>

            {/* List Rows */}
            {projects.map((project) => {
              const wordCount = project.wordCount || 0;
              const targetWords = project.targetWords || 50000;
              const pct = progressPct(wordCount, targetWords);

              return (
                <div
                  key={project.id}
                  className="grid gap-4 px-6 py-4 items-center transition-colors hover:bg-white/60"
                  style={{
                    gridTemplateColumns:
                      "60px 2fr 1fr 100px 80px 100px 120px 100px",
                    borderBottom: "1px solid rgba(15,23,42,0.04)",
                  }}
                >
                  {/* Cover */}
                  <div
                    className="w-12 h-16 rounded-lg flex items-center justify-center text-xl overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, #e8dff5, #f5e6ff)",
                    }}
                  >
                    {project.cover ? (
                      <img
                        src={project.cover}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      "📕"
                    )}
                  </div>

                  {/* Title / Author */}
                  <div>
                    <div
                      className="font-semibold"
                      style={{
                        fontFamily: "'EB Garamond', Georgia, serif",
                        color: "#111827",
                      }}
                    >
                      {project.title || "Untitled"}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      by {project.author || authorName}
                    </div>
                  </div>

                  {/* Genre */}
                  <div className="text-sm text-gray-600">
                    {project.genre?.join(", ") || "—"}
                  </div>

                  {/* Words */}
                  <div className="font-semibold text-purple-900">
                    {wordCount.toLocaleString()}
                  </div>

                  {/* Chapters */}
                  <div className="text-gray-600">
                    {project.chapterCount || 0}
                  </div>

                  {/* Last Edit */}
                  <div className="text-sm text-gray-500">
                    {formatDate(project.lastModified)}
                  </div>

                  {/* Progress */}
                  <div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden mb-1"
                      style={{
                        background: "rgba(148,163,184,0.25)",
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          background:
                            "linear-gradient(90deg, #9b7bc9, #D4AF37)",
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {Math.round(pct)}% • {project.status || "Draft"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button
                      onClick={() => openInWriter(project)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                      style={{
                        background:
                          "linear-gradient(135deg, #9b7bc9, #b897d6)",
                      }}
                    >
                      <Edit3 size={12} /> Write
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
