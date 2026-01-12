// src/components/ProjectPage.jsx
// FIXED: Uses unified storage system (same as ComposePage/useProjectStore)
// FIXED: Cloud sync disabled check
// FIXED: Proper title editing
// FIXED: Shows Project ID
// FIXED: Import with name prompt
// FIXED: Title truncation for long titles
// NEW: Genre is a first-class project attribute (stored in list + project data)
// NEW: Genre shown + editable in grid and list views
// NEW: Safe default for legacy projects (General / Undeclared)
// FIXED: Genre modal state is inside component (hooks rule)
// FIXED: addProject uses Genre modal (no dead code / undefined vars)

import React, { useEffect, useState, useRef } from "react";
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
  Key,
  Eye,
  EyeOff,
  Settings,
  Check,
  AlertCircle,
  Cloud,
  CloudOff,
  Hash,
  Copy,
} from "lucide-react";
import heic2any from "heic2any";

// Use the SAME storage system as ComposePage
import { storage } from "../lib/storage";
import { documentParser } from "../utils/documentParser";

// -------------------- UNIFIED Storage Keys (same as useProjectStore) --------------------
const PROJECTS_LIST_KEY = "dahtruth-projects-list";
const CURRENT_PROJECT_KEY = "dahtruth-current-project-id";
const PROJECT_DATA_PREFIX = "dahtruth-project-";

// -------------------- Genre helpers --------------------
const GENRES = [
  "General / Undeclared",
  "Literary Fiction",
  "Contemporary Fiction",
  "Historical Fiction",
  "Mystery / Crime",
  "Thriller / Suspense",
  "Romance",
  "Fantasy",
  "Science Fiction",
  "Horror",
  "Young Adult",
  "Children’s",
  "Memoir",
  "Biography",
  "Essays",
  "Cultural Commentary",
  "Self-Help",
  "Christian / Faith-Based",
  "Poetry",
  "Drama / Screenplay",
];

function normalizeGenre(g) {
  const x = (g || "").trim();
  return x || "General / Undeclared";
}

// -------------------- Helper Functions --------------------
function generateId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getProjectDataKey(projectId) {
  return `${PROJECT_DATA_PREFIX}${projectId}`;
}

function loadProjectsList() {
  try {
    const raw = storage.getItem(PROJECTS_LIST_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveProjectsList(projects) {
  try {
    storage.setItem(PROJECTS_LIST_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("projects:change"));
  } catch (err) {
    console.error("Failed to save projects list:", err);
  }
}

function loadProjectData(projectId) {
  try {
    const key = getProjectDataKey(projectId);
    const raw = storage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveProjectData(projectId, data) {
  try {
    const key = getProjectDataKey(projectId);
    storage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save project data:", err);
  }
}

// Check if cloud sync is disabled
function isCloudSyncDisabled() {
  try {
    return localStorage.getItem("dt_cloud_sync_disabled") === "true";
  } catch {
    return true; // Default to disabled if can't read
  }
}

// -------------------- API Key helpers --------------------
const API_KEYS_KEY = "dahtruth_api_keys";

function loadApiKeys() {
  try {
    const raw = storage.getItem(API_KEYS_KEY);
    if (!raw) return { openai: "", anthropic: "" };
    return JSON.parse(raw);
  } catch {
    return { openai: "", anthropic: "" };
  }
}

function saveApiKeys(keys) {
  try {
    storage.setItem(API_KEYS_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event("apikeys:updated"));
  } catch (err) {
    console.error("Failed to save API keys:", err);
  }
}

// -------------------- Author Profile Helpers --------------------
function getAuthorProfile() {
  try {
    const raw = storage.getItem("dahtruth_author_profile");
    if (raw) return JSON.parse(raw);

    // Fallback to other keys
    const keys = ["dt_profile", "userProfile", "profile"];
    for (const key of keys) {
      const data = storage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.name || parsed.author || parsed.displayName) {
          return {
            name: parsed.name || parsed.author || parsed.displayName || "New Author",
            email: parsed.email || "",
          };
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

function saveAuthorProfile(profile) {
  try {
    storage.setItem("dahtruth_author_profile", JSON.stringify(profile));
    window.dispatchEvent(new Event("profile:updated"));
  } catch (err) {
    console.error("Failed to save author profile:", err);
  }
}

// -------------------- Project Cleanup Helper --------------------
function cleanupProjectStorage(projectId) {
  if (!projectId) return;

  console.log(`[ProjectPage] Cleaning up project: ${projectId}`);

  // Remove project data
  try {
    storage.removeItem(getProjectDataKey(projectId));
  } catch {}

  // Remove from projects list
  try {
    const list = loadProjectsList();
    const filtered = list.filter((p) => p.id !== projectId);
    saveProjectsList(filtered);
  } catch {}

  // Clear current project if it's this one
  try {
    if (storage.getItem(CURRENT_PROJECT_KEY) === projectId) {
      storage.removeItem(CURRENT_PROJECT_KEY);
    }
  } catch {}

  // Clear currentStory if it's this project
  try {
    const currentStoryRaw = storage.getItem("currentStory");
    if (currentStoryRaw) {
      const currentStory = JSON.parse(currentStoryRaw);
      if (currentStory?.id === projectId) {
        storage.removeItem("currentStory");
      }
    }
  } catch {}

  // Also clean userProjects (legacy)
  try {
    const userProjectsRaw = storage.getItem("userProjects");
    if (userProjectsRaw) {
      const userProjects = JSON.parse(userProjectsRaw);
      const filtered = userProjects.filter((p) => p.id !== projectId);
      storage.setItem("userProjects", JSON.stringify(filtered));
    }
  } catch {}

  console.log(`[ProjectPage] Cleanup complete for: ${projectId}`);
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
const progressPct = (cur, tgt) => Math.min((cur / Math.max(tgt || 1, 1)) * 100, 100);

const statusColors = {
  Idea: { bg: "linear-gradient(135deg, rgba(202,177,214,0.25), rgba(202,177,214,0.1))", text: "#6B4F7A", border: "rgba(202,177,214,0.4)" },
  Outline: { bg: "linear-gradient(135deg, rgba(147,197,253,0.25), rgba(147,197,253,0.1))", text: "#1e40af", border: "rgba(147,197,253,0.4)" },
  Draft: { bg: "linear-gradient(135deg, rgba(251,191,36,0.25), rgba(251,191,36,0.1))", text: "#92400e", border: "rgba(251,191,36,0.4)" },
  Revision: { bg: "linear-gradient(135deg, rgba(251,146,60,0.25), rgba(251,146,60,0.1))", text: "#9a3412", border: "rgba(251,146,60,0.4)" },
  Editing: { bg: "linear-gradient(135deg, rgba(52,211,153,0.25), rgba(52,211,153,0.1))", text: "#065f46", border: "rgba(52,211,153,0.4)" },
  Published: { bg: "linear-gradient(135deg, rgba(212,175,55,0.25), rgba(212,175,55,0.1))", text: "#78350f", border: "rgba(212,175,55,0.4)" },
};

const getStatusStyle = (status) => {
  const colors = statusColors[status] || statusColors.Draft;
  return { background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` };
};

// -------------------- API Settings Panel --------------------
function ApiSettingsPanel({ isOpen, onClose }) {
  const [keys, setKeys] = useState({ openai: "", anthropic: "" });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setKeys(loadApiKeys());
  }, [isOpen]);

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Key size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API Settings</h2>
              <p className="text-xs text-white/70">Configure your AI provider keys</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
            <AlertCircle size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <strong className="text-gray-800">Your keys are stored locally</strong> on this device only.
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">OpenAI API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showOpenAI ? "text" : "password"}
                  value={keys.openai}
                  onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none text-sm font-mono"
                />
                <button type="button" onClick={() => setShowOpenAI(!showOpenAI)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showOpenAI ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Anthropic (Claude) API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showAnthropic ? "text" : "password"}
                  value={keys.anthropic}
                  onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none text-sm font-mono"
                />
                <button type="button" onClick={() => setShowAnthropic(!showAnthropic)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showAnthropic ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex justify-end gap-3" style={{ background: "rgba(248, 250, 252, 0.9)", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button
            onClick={() => { handleSave(); setTimeout(onClose, 500); }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {saved ? <span className="flex items-center gap-2"><Check size={16} /> Saved!</span> : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- Author Setup Modal --------------------
function AuthorSetupModal({ isOpen, onComplete }) {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onComplete(name.trim());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)" }}>
        <div className="px-6 py-8 text-center" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}>
          <div className="text-5xl mb-3">✍️</div>
          <h2 className="text-2xl font-semibold text-white">Welcome to DahTruth StoryLab</h2>
          <p className="text-sm text-white/70 mt-2">Let's set up your author profile</p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Your Name / Pen Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How you want to be known as an author"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none"
              autoFocus
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3.5 rounded-xl text-base font-semibold text-white disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {isLoading ? "Setting up..." : "Start Writing →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------- Edit Title Modal --------------------
function EditTitleModal({ isOpen, currentTitle, projectId, onSave, onClose }) {
  const [title, setTitle] = useState(currentTitle || "");

  useEffect(() => {
    setTitle(currentTitle || "");
  }, [currentTitle, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (title.trim()) {
      onSave(projectId, title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)" }} onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5" style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}>
          <h2 className="text-lg font-semibold text-white">Edit Project Title</h2>
          <p className="text-xs text-white/70 mt-1">ID: {projectId}</p>
        </div>
        <div className="p-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none text-lg"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>
        <div className="px-6 py-4 flex justify-end gap-3" style={{ background: "rgba(248, 250, 252, 0.9)", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}>
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
          <button onClick={handleSave} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            Save Title
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- Genre Picker Modal (type + pick) --------------------
function GenrePickerModal({ open, initialValue, onCancel, onSave }) {
  const [query, setQuery] = useState(initialValue || "General / Undeclared");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setQuery(initialValue || "General / Undeclared");
    setActiveIndex(0);
  }, [initialValue, open]);

  if (!open) return null;

  const q = (query || "").trim().toLowerCase();
  const filtered = GENRES.filter((g) => g.toLowerCase().includes(q));
  const list = filtered.length ? filtered : GENRES;

  const commit = (value) => {
    const v = (value || "").trim();
    if (!v) return;
    onSave(v);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, list.length - 1));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if ((query || "").trim()) commit(query);
      else commit(list[activeIndex] || "General / Undeclared");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
      // ✅ IMPORTANT: use onClick (NOT onMouseDown) to avoid killing option clicks
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-5"
          style={{ background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)" }}
        >
          <h2 className="text-lg font-semibold text-white">Select Genre</h2>
          <p className="text-xs text-white/70 mt-1">Type to search, or pick from the list.</p>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Primary Genre
          </label>

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to search or enter a custom genre…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 outline-none text-sm"
            autoFocus
          />

          <div
            className="max-h-64 overflow-auto rounded-xl border border-gray-200"
            role="listbox"
            aria-label="Genre options"
          >
            {list.map((g, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  type="button"
                  key={g}
                  className="w-full text-left px-4 py-3 text-sm flex items-center justify-between"
                  style={{
                    background: isActive ? "rgba(99,102,241,0.10)" : "#fff",
                    borderBottom: "1px solid rgba(229,231,235,1)",
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => commit(g)}
                >
                  <span>{g}</span>
                  {normalizeGenre(query) === g ? (
                    <span className="text-xs font-semibold" style={{ color: "#4f46e5" }}>
                      Selected
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-gray-500">
            Tip: press <span className="font-semibold">Enter</span> to save what you typed, or use ↑/↓ then Enter to pick.
          </p>
        </div>

        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ background: "rgba(248, 250, 252, 0.9)", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => commit(query)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            Save Genre
          </button>
        </div>
      </div>
    </div>
  );
}


// -------------------- Main Component --------------------
export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [coverUploadId, setCoverUploadId] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [authorName, setAuthorName] = useState("New Author");
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showAuthorSetup, setShowAuthorSetup] = useState(false);
  const [syncStatus, setSyncStatus] = useState("offline");
  const [editingProject, setEditingProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ FIX: hooks belong inside the component
  const [genreModal, setGenreModal] = useState({
    open: false,
    projectId: null,
    initial: "General / Undeclared",
    context: "new", // "new" | "import" | "edit"
    payload: null,
  });

  const importInputRef = useRef(null);

  // Initialize
  useEffect(() => {
    const profile = getAuthorProfile();
    if (!profile) setShowAuthorSetup(true);
    else setAuthorName(profile.name);

    loadProjectsFromStorage();
  }, []);

  // Load projects from unified storage
  const loadProjectsFromStorage = () => {
    setIsLoading(true);
    try {
      const list = loadProjectsList();
      const enriched = list.map((entry) => {
        const data = loadProjectData(entry.id);
        const wordCount = data?.chapters?.reduce((sum, ch) => sum + (ch.wordCount || 0), 0) || entry.wordCount || 0;
        const chapterCount = data?.chapters?.length || entry.chapterCount || 0;
        const primaryGenre = normalizeGenre(data?.primaryGenre || entry.primaryGenre);

        return {
          ...entry,
          primaryGenre,
          wordCount,
          chapterCount,
          cover: data?.cover || entry.cover || "",
          targetWords: data?.targetWords || entry.targetWords || 50000,
          logline: data?.logline || entry.logline || "",
        };
      });

      setProjects(enriched);
      setSyncStatus(isCloudSyncDisabled() ? "offline" : "synced");
    } catch (err) {
      console.error("[ProjectPage] Failed to load projects:", err);
      setProjects([]);
      setSyncStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for changes
  useEffect(() => {
    const sync = () => loadProjectsFromStorage();
    window.addEventListener("storage", sync);
    window.addEventListener("project:change", sync);
    window.addEventListener("projects:change", sync);
    window.addEventListener("storage:ready", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
      window.removeEventListener("projects:change", sync);
      window.removeEventListener("storage:ready", sync);
    };
  }, []);

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  const handleAuthorSetupComplete = async (name) => {
    saveAuthorProfile({ name, createdAt: new Date().toISOString() });
    setAuthorName(name);
    setShowAuthorSetup(false);
  };

  const handleAuthorNameSave = (newName) => {
    const trimmed = (newName || "").trim() || "New Author";
    setAuthorName(trimmed);
    saveAuthorProfile({ name: trimmed, updatedAt: new Date().toISOString() });
  };

  // Update project genre (list + project data)
  const updateProjectGenre = (projectId, nextGenreRaw) => {
    const primaryGenre = normalizeGenre(nextGenreRaw);
    const now = new Date().toISOString();

    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, primaryGenre, updatedAt: now } : p
    );
    saveProjectsList(updated);
    setProjects(updated);

    const data = loadProjectData(projectId) || {};
    data.primaryGenre = primaryGenre;
    saveProjectData(projectId, data);

    try {
      const currentId = storage.getItem(CURRENT_PROJECT_KEY);
      if (currentId === projectId) {
        const raw = storage.getItem("currentStory");
        if (raw) {
          const cs = JSON.parse(raw);
          cs.primaryGenre = primaryGenre;
          storage.setItem("currentStory", JSON.stringify(cs));
        }
      }
    } catch {}

    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("projects:change"));
  };

  // ✅ FIXED: Create new project -> open Genre modal (no dead code)
  const addProject = () => {
    const title = window.prompt("Enter a title for your new project:", "Untitled Project");
    if (!title) return;

    const projectId = generateId();

    setGenreModal({
      open: true,
      context: "new",
      projectId,
      initial: "General / Undeclared",
      payload: { projectId, title: title.trim() },
    });
  };

  // Update project title
  const updateProjectTitle = (projectId, newTitle) => {
    const updated = projects.map((p) =>
      p.id === projectId ? { ...p, title: newTitle, updatedAt: new Date().toISOString() } : p
    );
    saveProjectsList(updated);
    setProjects(updated);

    const data = loadProjectData(projectId);
    if (data) {
      data.book = { ...data.book, title: newTitle };
      saveProjectData(projectId, data);
    }

    const currentId = storage.getItem(CURRENT_PROJECT_KEY);
    if (currentId === projectId) {
      const currentStoryRaw = storage.getItem("currentStory");
      if (currentStoryRaw) {
        const currentStory = JSON.parse(currentStoryRaw);
        currentStory.title = newTitle;
        storage.setItem("currentStory", JSON.stringify(currentStory));
      }
    }

    try {
      const userProjectsRaw = storage.getItem("userProjects");
      if (userProjectsRaw) {
        const userProjects = JSON.parse(userProjectsRaw);
        const updatedUserProjects = userProjects.map((p) =>
          p.id === projectId ? { ...p, title: newTitle } : p
        );
        storage.setItem("userProjects", JSON.stringify(updatedUserProjects));
      }
    } catch {}

    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("projects:change"));
  };

  // Update project (general)
  const updateProject = (id, patch) => {
    const now = new Date().toISOString();
    const updated = projects.map((p) =>
      p.id === id ? { ...p, ...patch, updatedAt: now } : p
    );
    saveProjectsList(updated);
    setProjects(updated);

    const data = loadProjectData(id) || {};
    if (patch.title) data.book = { ...(data.book || {}), title: patch.title };
    if (patch.cover) data.cover = patch.cover;
    if (patch.logline !== undefined) data.logline = patch.logline;
    if (patch.targetWords) data.targetWords = patch.targetWords;
    if (patch.primaryGenre !== undefined) data.primaryGenre = normalizeGenre(patch.primaryGenre);
    saveProjectData(id, data);

    window.dispatchEvent(new Event("project:change"));
  };

  // Delete project
  const handleDeleteProject = (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    cleanupProjectStorage(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    window.dispatchEvent(new Event("project:change"));
    window.dispatchEvent(new Event("projects:change"));
  };

  // Open project in writer
  const openInWriter = (project) => {
    storage.setItem(CURRENT_PROJECT_KEY, project.id);
    storage.setItem("currentStory", JSON.stringify({
      id: project.id,
      title: project.title,
      wordCount: project.wordCount || 0,
      status: project.status || "Draft",
      primaryGenre: project.primaryGenre || "General / Undeclared",
    }));
    window.dispatchEvent(new Event("project:change"));
    navigate("/writer");
  };

  // Import manuscript
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  // ✅ Uses modal for genre too
  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const defaultName =
        file.name.replace(/\.(docx|doc|txt|html|htm|rtf)$/i, "").trim() ||
        "Imported Project";

      const projectName = window.prompt("Enter a name for this project:", defaultName);
      if (!projectName) {
        e.target.value = "";
        return;
      }

      setIsLoading(true);

      const parsed = await documentParser.parseFile(file);
      const projectId = generateId();

      // open modal and finish import in modal onSave
      setGenreModal({
        open: true,
        context: "import",
        projectId,
        initial: "General / Undeclared",
        payload: {
          projectId,
          title: projectName.trim(),
          parsed,
        },
      });
    } catch (err) {
      console.error("[ProjectPage] Import failed:", err);
      alert("Failed to import file. Please try a different file format.");
      setIsLoading(false);
      e.target.value = "";
    }
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

      const isHEIC = file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");

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
      alert("Failed to upload image.");
    } finally {
      setCoverUploadId(null);
      fileInputEvent.target.value = "";
    }
  };

  // Copy project ID to clipboard
  const copyProjectId = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      alert("Project ID copied to clipboard!");
    }).catch(() => {
      alert(`Project ID: ${id}`);
    });
  };

  // Calculate totals
  const totalWords = projects.reduce((sum, p) => sum + (p.wordCount || 0), 0);
  const inProgress = projects.filter((p) => !["Published", "Idea", "published", "completed", "archived"].includes(p.status)).length;
  const published = projects.filter((p) => p.status === "Published" || p.status === "published" || p.status === "completed").length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const apiKeys = loadApiKeys();
  const hasApiKeys = !!(apiKeys.openai || apiKeys.anthropic);

  return (
    <div className="min-h-screen text-gray-800" style={{ background: "linear-gradient(135deg, #fef5ff 0%, #f8e8ff 50%, #fff5f7 100%)" }}>
      {/* Hidden import input */}
      <input
        ref={importInputRef}
        type="file"
        accept=".docx,.doc,.txt,.html,.htm,.rtf"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Author Setup Modal */}
      <AuthorSetupModal isOpen={showAuthorSetup} onComplete={handleAuthorSetupComplete} />

      {/* API Settings Modal */}
      <ApiSettingsPanel isOpen={showApiSettings} onClose={() => setShowApiSettings(false)} />

      {/* Edit Title Modal */}
      <EditTitleModal
        isOpen={!!editingProject}
        currentTitle={editingProject?.title}
        projectId={editingProject?.id}
        onSave={updateProjectTitle}
        onClose={() => setEditingProject(null)}
      />

      <GenrePickerModal
  open={genreModal.open}
  initialValue={genreModal.initial}
  onCancel={() => {
    // If they cancel import, stop loading + clear file input
    if (genreModal.context === "import") {
      setIsLoading(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
    setGenreModal({
      open: false,
      projectId: null,
      initial: "General / Undeclared",
      context: "new",
      payload: null,
    });
  }}
  onSave={(picked) => {
    const primaryGenre = normalizeGenre(picked);

    // ---------- NEW ----------
    if (genreModal.context === "new") {
      const { projectId, title } = genreModal.payload || {};
      if (!projectId || !title) {
        setIsLoading(false);
        setGenreModal({ open: false, projectId: null, initial: "General / Undeclared", context: "new", payload: null });
        return;
      }

      const now = new Date().toISOString();

      const project = {
        id: projectId,
        title,
        status: "Draft",
        source: "New",
        createdAt: now,
        updatedAt: now,
        wordCount: 0,
        chapterCount: 1,
        primaryGenre,
      };

      const data = {
        book: { title },
        primaryGenre,
        chapters: [
          {
            id: `chapter-${Date.now()}`,
            title: "Chapter 1",
            content: "",
            preview: "",
            wordCount: 0,
            lastEdited: now,
            status: "draft",
            order: 0,
          },
        ],
        daily: { goal: 500, counts: {} },
        settings: { theme: "light", focusMode: false },
        tocOutline: [],
      };

      saveProjectData(projectId, data);
      const updated = [project, ...projects];
      saveProjectsList(updated);
      setProjects(updated);

      storage.setItem(CURRENT_PROJECT_KEY, projectId);
      storage.setItem(
        "currentStory",
        JSON.stringify({ id: projectId, title, wordCount: 0, status: "Draft", primaryGenre })
      );

      window.dispatchEvent(new Event("project:change"));
      window.dispatchEvent(new Event("projects:change"));

      setIsLoading(false);
    }

    // ---------- IMPORT ----------
    if (genreModal.context === "import") {
      const { projectId, title, parsed } = genreModal.payload || {};
      if (!projectId || !title || !parsed?.chapters?.length) {
        setIsLoading(false);
        if (importInputRef.current) importInputRef.current.value = "";
        setGenreModal({ open: false, projectId: null, initial: "General / Undeclared", context: "new", payload: null });
        return;
      }

      const now = new Date().toISOString();
      const totalWords = parsed.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

      const project = {
        id: projectId,
        title,
        status: "Draft",
        source: "Imported",
        createdAt: now,
        updatedAt: now,
        wordCount: totalWords,
        chapterCount: parsed.chapters.length,
        primaryGenre,
      };

      const chapters = parsed.chapters.map((ch, idx) => ({
        id: ch.id || `chapter-${Date.now()}-${idx}`,
        title: ch.title,
        content: ch.content,
        preview: ch.preview || "",
        wordCount: ch.wordCount || 0,
        lastEdited: now,
        status: "draft",
        order: idx,
      }));

      const data = {
        book: { title },
        primaryGenre,
        chapters,
        daily: { goal: 500, counts: {} },
        settings: { theme: "light", focusMode: false },
        tocOutline: parsed.tableOfContents || [],
      };

      saveProjectData(projectId, data);
      const updated = [project, ...projects];
      saveProjectsList(updated);
      setProjects(updated);

      storage.setItem(CURRENT_PROJECT_KEY, projectId);
      storage.setItem(
        "currentStory",
        JSON.stringify({ id: projectId, title, wordCount: totalWords, status: "Draft", primaryGenre })
      );

      window.dispatchEvent(new Event("project:change"));
      window.dispatchEvent(new Event("projects:change"));

      // clear loading BEFORE navigate (safe)
      setIsLoading(false);
      if (importInputRef.current) importInputRef.current.value = "";

      navigate("/writer");
    }

    // ---------- EDIT ----------
    if (genreModal.context === "edit") {
      if (genreModal.projectId) updateProjectGenre(genreModal.projectId, primaryGenre);
      setIsLoading(false);
    }

    // close modal (always)
    setGenreModal({
      open: false,
      projectId: null,
      initial: "General / Undeclared",
      context: "new",
      payload: null,
    });
  }}
/>


      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Dashboard Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: "linear-gradient(135deg, #D4AF37, #f5e6b3)", color: "#1f2937", border: "1px solid rgba(180,142,38,0.9)", boxShadow: "0 6px 18px rgba(180,142,38,0.35)" }}
        >
          <ArrowLeft size={16} />
          Dashboard
        </button>

        {/* Page Header */}
        <div className="rounded-3xl p-8 mb-8" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", border: "1px solid rgba(148,163,184,0.3)", boxShadow: "0 14px 45px rgba(15,23,42,0.08)" }}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "linear-gradient(135deg, #b897d6, #e3c8ff)", boxShadow: "0 10px 30px rgba(155,123,201,0.35)" }}>
                📚
              </div>
              <div>
                <h1 className="text-4xl font-semibold mb-1" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#111827" }}>
                  Projects
                </h1>
                <p className="text-sm text-gray-500">
                  Author <span className="font-medium text-gray-800">{authorName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = window.prompt("Update author / pen name:", authorName === "New Author" ? "" : authorName);
                      if (next !== null) handleAuthorNameSave(next);
                    }}
                    className="inline-flex items-center gap-1 ml-2 text-xs text-purple-600 hover:text-purple-800"
                  >
                    <PencilLine size={14} /> Edit
                  </button>
                </p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  {projects.length} projects • {totalWords.toLocaleString()} total words
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      background: syncStatus === "offline" ? "rgba(148, 163, 184, 0.1)" : syncStatus === "error" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                      color: syncStatus === "offline" ? "#64748b" : syncStatus === "error" ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {syncStatus === "offline" ? <><CloudOff size={10} /> Local</> : syncStatus === "error" ? <><CloudOff size={10} /> Error</> : <><Cloud size={10} /> Synced</>}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setShowApiSettings(true)} className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:scale-105" style={{ background: hasApiKeys ? "rgba(34, 197, 94, 0.08)" : "rgba(251, 191, 36, 0.1)", border: `1px solid ${hasApiKeys ? "rgba(34, 197, 94, 0.3)" : "rgba(251, 191, 36, 0.4)"}`, color: hasApiKeys ? "#16a34a" : "#92400e" }}>
                <Key size={16} />
                {hasApiKeys ? "API Keys ✓" : "Add API Keys"}
              </button>

              <div className="flex rounded-xl p-1" style={{ background: "rgba(248,250,252,0.95)", border: "1px solid rgba(148,163,184,0.4)" }}>
                <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-md text-purple-700" : "text-gray-400 hover:text-gray-600"}`} title="Grid View">
                  <Grid size={18} />
                </button>
                <button onClick={() => setViewMode("list")} className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-md text-purple-700" : "text-gray-400 hover:text-gray-600"}`} title="List View">
                  <List size={18} />
                </button>
              </div>

              <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(148,163,184,0.4)" }}>
                <Upload size={16} />
                Import Manuscript
              </button>

              <button onClick={addProject} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9b7bc9, #b897d6)", boxShadow: "0 8px 24px rgba(155,123,201,0.5)" }}>
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { icon: <BookOpen size={18} />, value: projects.length, label: "Projects" },
            { icon: <FileText size={18} />, value: totalWords.toLocaleString(), label: "Words Written" },
            { icon: <Edit3 size={18} />, value: inProgress, label: "In Progress" },
            { icon: <Trophy size={18} />, value: published, label: "Published" },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:-translate-y-1" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(148,163,184,0.35)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(155,123,201,0.12)" }}>
                <span className="text-purple-700">{stat.icon}</span>
              </div>
              <div>
                <div className="text-2xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#111827" }}>{stat.value}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="rounded-3xl p-16 text-center" style={{ background: "rgba(255,255,255,0.95)", border: "1px solid rgba(148,163,184,0.35)" }}>
            <Loader2 size={40} className="animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl p-16 text-center" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(148,163,184,0.35)" }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4" style={{ background: "rgba(155,123,201,0.12)" }}>📚</div>
            <h2 className="text-3xl font-semibold mb-3" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#111827" }}>No Projects Yet</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">Create your first project or import an existing manuscript to get started.</p>
            <div className="flex gap-4 justify-center">
              <button onClick={handleImportClick} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-semibold transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.9)", border: "1px solid rgba(148,163,184,0.4)" }}>
                <Upload size={18} /> Import Manuscript
              </button>
              <button onClick={addProject} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-base font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9b7bc9, #b897d6)", boxShadow: "0 8px 24px rgba(155,123,201,0.5)" }}>
                <Plus size={18} /> Create New Project
              </button>
            </div>
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
                <div key={project.id} className="rounded-3xl overflow-hidden transition-all hover:-translate-y-2" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(148,163,184,0.35)", boxShadow: "0 8px 24px rgba(15,23,42,0.06)" }}>
                  <div className="flex">
                    {/* Cover */}
                    <div className="w-40 flex-shrink-0 relative" style={{ background: "linear-gradient(135deg, #e8dff5, #f5e6ff)" }}>
                      {coverUploadId === project.id ? (
                        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center">
                          <Loader2 size={24} className="animate-spin text-purple-400 mb-2" />
                          <span className="text-xs text-gray-500">Processing...</span>
                        </div>
                      ) : project.cover ? (
                        <img src={project.cover} alt={`${project.title} cover`} className="w-full h-full min-h-[280px] object-cover" />
                      ) : (
                        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-4">
                          <ImageIcon size={40} className="text-purple-300 mb-3" />
                          <span className="text-xs text-gray-400 text-center">Add book cover</span>
                        </div>
                      )}
                      <label className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all hover:scale-105" style={{ background: "rgba(255,255,255,0.98)", backdropFilter: "blur(10px)", border: "1px solid rgba(148,163,184,0.5)" }}>
                        <Upload size={12} />
                        {project.cover ? "Change" : "Upload"}
                        <input type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(e) => handleCoverChange(project.id, e)} />
                      </label>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 flex flex-col min-w-0 overflow-hidden">
                      <div className="flex justify-between items-start mb-1 gap-3">
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3
                              className="text-xl font-semibold truncate"
                              style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#111827" }}
                              title={project.title || "Untitled"}
                            >
                              {project.title || "Untitled"}
                            </h3>
                            <button onClick={() => setEditingProject(project)} className="text-purple-400 hover:text-purple-600 flex-shrink-0" title="Edit Title">
                              <Edit3 size={14} />
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-white font-semibold flex-shrink-0" style={{ background: "linear-gradient(135deg, #D4AF37, #9b7bc9)" }}>
                              {authorName?.charAt(0)?.toUpperCase() || "A"}
                            </div>
                            <span className="truncate">by {authorName}</span>
                          </div>

                          {/* Genre badge + quick change */}
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className="px-2 py-1 rounded-full text-[10px] font-semibold"
                              style={{ background: "rgba(155,123,201,0.12)", color: "#5b21b6" }}
                              title="Primary Genre"
                            >
                              {project.primaryGenre || "General / Undeclared"}
                            </span>

                            <button
                              type="button"
                              className="text-[10px] text-purple-600 hover:text-purple-800"
                              onClick={() => {
                                const next = window.prompt(
                                  "Update genre:\n\n" + GENRES.join("\n"),
                                  project.primaryGenre || "General / Undeclared"
                                );
                                if (next !== null) updateProjectGenre(project.id, next);
                              }}
                            >
                              Change
                            </button>
                          </div>

                          {/* Project ID */}
                          <button
                            onClick={() => copyProjectId(project.id)}
                            className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 hover:text-gray-600 font-mono"
                            title="Click to copy Project ID"
                          >
                            <Hash size={10} className="flex-shrink-0" />
                            <span className="truncate">{project.id.slice(-12)}</span>
                            <Copy size={10} className="flex-shrink-0" />
                          </button>
                        </div>

                        <select
                          value={project.status || "Draft"}
                          onChange={(e) => updateProject(project.id, { status: e.target.value })}
                          className="ml-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full cursor-pointer outline-none flex-shrink-0"
                          style={getStatusStyle(project.status || "Draft")}
                        >
                          {["Idea", "Outline", "Draft", "Revision", "Editing", "Published"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Logline */}
                      <input
                        value={project.logline || ""}
                        onChange={(e) => updateProject(project.id, { logline: e.target.value })}
                        placeholder="One-sentence logline describing your story..."
                        className="mt-3 w-full bg-transparent text-sm text-gray-600 italic outline-none"
                      />

                      {/* Progress */}
                      <div className="mt-4 p-4 rounded-2xl" style={{ background: "rgba(248,250,252,0.9)" }}>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500 font-medium">Word Count Progress</span>
                          <span className="text-sm font-bold text-purple-900">{wordCount.toLocaleString()} / {targetWords.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.25)" }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #9b7bc9, #D4AF37)" }} />
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-gray-400">
                          <span>{Math.round(pct)}% complete</span>
                          <span>~{readTime} min read</span>
                        </div>
                      </div>

                      {/* Mini Stats */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { icon: <FileText size={16} />, value: project.chapterCount || 0, label: "Chapters" },
                          { icon: <Users size={16} />, value: project.characterCount || 0, label: "Characters" },
                          { icon: <Calendar size={16} />, value: formatDate(project.updatedAt), label: "Last Edit" },
                        ].map((stat, i) => (
                          <div key={i} className="text-center p-3 rounded-xl" style={{ background: "rgba(248,250,252,0.9)" }}>
                            <div className="text-purple-400 flex justify-center mb-1">{stat.icon}</div>
                            <div className="text-base font-bold text-purple-900" style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>{stat.value}</div>
                            <div className="text-[10px] text-gray-400 uppercase">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
                        <button onClick={() => openInWriter(project)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9b7bc9, #b897d6)" }}>
                          <Edit3 size={16} /> Write
                        </button>
                        <button onClick={() => handleDeleteProject(project.id)} className="px-4 py-3 rounded-xl text-sm transition-all hover:scale-105" style={{ background: "rgba(239,68,68,0.06)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.35)" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* New Project Card */}
            <div onClick={addProject} className="rounded-3xl p-10 text-center cursor-pointer transition-all hover:-translate-y-2 flex flex-col items-center justify-center min-h-[320px]" style={{ background: "linear-gradient(135deg, rgba(155,123,201,0.06), rgba(212,175,55,0.04))", border: "1px dashed rgba(155,123,201,0.35)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mb-4" style={{ background: "linear-gradient(135deg, #9b7bc9, #D4AF37)" }}>+</div>
              <div className="text-xl font-semibold" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#4b3b61" }}>Create New Project</div>
              <div className="text-sm text-gray-400 mt-2">Start your next story</div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="rounded-3xl overflow-hidden" style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(20px)", border: "1px solid rgba(148,163,184,0.35)" }}>
            <div className="grid gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ gridTemplateColumns: "60px 2fr 140px 100px 80px 100px 100px 100px", background: "rgba(148,163,184,0.12)", borderBottom: "1px solid rgba(15,23,42,0.06)" }}>
              <span>Cover</span>
              <span>Title / ID</span>
              <span>Genre</span>
              <span>Words</span>
              <span>Chapters</span>
              <span>Last Edit</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {projects.map((project) => {
              const wordCount = project.wordCount || 0;

              return (
                <div key={project.id} className="grid gap-4 px-6 py-4 items-center transition-colors hover:bg-white/60" style={{ gridTemplateColumns: "60px 2fr 140px 100px 80px 100px 100px 100px", borderBottom: "1px solid rgba(15,23,42,0.04)" }}>
                  <div className="w-12 h-16 rounded-lg flex items-center justify-center text-xl overflow-hidden" style={{ background: "linear-gradient(135deg, #e8dff5, #f5e6ff)" }}>
                    {project.cover ? <img src={project.cover} alt="" className="w-full h-full object-cover" /> : "📕"}
                  </div>

                  <div className="min-w-0 overflow-hidden">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="font-semibold truncate"
                        style={{ fontFamily: "'EB Garamond', Georgia, serif", color: "#111827" }}
                        title={project.title || "Untitled"}
                      >
                        {project.title || "Untitled"}
                      </span>
                      <button onClick={() => setEditingProject(project)} className="text-purple-400 hover:text-purple-600 flex-shrink-0"><Edit3 size={12} /></button>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{project.id.slice(-12)}</div>
                  </div>

                  {/* Genre column */}
                  <div className="min-w-0">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-[10px] font-semibold text-left max-w-full truncate"
                      style={{ background: "rgba(155,123,201,0.12)", color: "#5b21b6" }}
                      title="Click to change genre"
                      onClick={() => {
                        const next = window.prompt(
                          "Update genre:\n\n" + GENRES.join("\n"),
                          project.primaryGenre || "General / Undeclared"
                        );
                        if (next !== null) updateProjectGenre(project.id, next);
                      }}
                    >
                      {project.primaryGenre || "General / Undeclared"}
                    </button>
                  </div>

                  <div className="font-semibold text-purple-900">{wordCount.toLocaleString()}</div>
                  <div className="text-gray-600">{project.chapterCount || 0}</div>
                  <div className="text-sm text-gray-500">{formatDate(project.updatedAt)}</div>
                  <div>
                    <span className="px-2 py-1 text-[10px] font-semibold uppercase rounded-full" style={getStatusStyle(project.status || "Draft")}>{project.status || "Draft"}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openInWriter(project)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105" style={{ background: "linear-gradient(135deg, #9b7bc9, #b897d6)" }}>
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
