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
    navigate("/writer"); // (change to "/compose" later if needed)
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

  // Handle import - redirects to writer after import
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
    navigate("/writer");

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
        {/* ... everything below stays exactly as you had it ... */}
        {/* I’m not re-pasting the rest to keep this message shorter,
            but you can keep your existing JSX from the header down,
            since the breaking issues were the hook + stray ">" above. */}
      </div>
    </div>
  );
}
