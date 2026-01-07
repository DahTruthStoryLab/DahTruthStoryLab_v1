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
  Key,
  Eye,
  EyeOff,
  Settings,
  Check,
  AlertCircle,
  Cloud,
  CloudOff,
} from "lucide-react";
import heic2any from "heic2any";

// Import the new project system
import {
  getLocalAuthorProfile,
  setLocalAuthorProfile,
  completeAuthorSetup,
  isAuthorSetupComplete,
} from "../lib/authorService";
import {
  listProjects,
  createProject,
  deleteProject as deleteProjectService,
  loadProject,
  saveProject,
  getCurrentProject,
  setCurrentProject,
} from "../lib/projectsService";
import { migrateLegacyData, needsMigration } from "../lib/projectSystem";
import { storage } from "../lib/storage";

// -------------------- Storage helpers --------------------
const PROJECTS_KEY = "userProjects";

function loadLegacyProjects() {
  try {
    const raw = storage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLegacyProjects(projects) {
  try {
    storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects:", err);
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

// -------------------- Title Sync Helper --------------------
// This function propagates a title change to ALL related storage keys
function propagateTitleChange(projectId, newTitle) {
  if (!projectId || !newTitle) return;

  const keysToUpdate = [
    // Project meta keys
    `dahtruth_project_meta_${projectId}`,
    `dt_publishing_meta_${projectId}`,
    
    // Cover settings
    `dahtruth_cover_settings_${projectId}`,
    
    // Publishing draft
    `publishingDraft_${projectId}`,
  ];

  keysToUpdate.forEach((key) => {
    try {
      const raw = storage.getItem(key);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data === "object") {
          // Update title in the object
          if ("title" in data) {
            data.title = newTitle;
          }
          // For publishingDraft, also update book.title
          if (data.book && typeof data.book === "object") {
            data.book.title = newTitle;
          }
          storage.setItem(key, JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error(`Failed to update title in ${key}:`, err);
    }
  });

  // Also update currentStory if it matches this project
  try {
    const currentStoryRaw = storage.getItem("currentStory");
    if (currentStoryRaw) {
      const currentStory = JSON.parse(currentStoryRaw);
      if (currentStory && currentStory.id === projectId) {
        currentStory.title = newTitle;
        storage.setItem("currentStory", JSON.stringify(currentStory));
      }
    }
  } catch (err) {
    console.error("Failed to update currentStory:", err);
  }

  // Update legacy dahtruth_project_meta if it exists
  try {
    const legacyMeta = storage.getItem("dahtruth_project_meta");
    if (legacyMeta) {
      const meta = JSON.parse(legacyMeta);
      // Only update if this appears to be for the same project
      if (meta && typeof meta === "object") {
        meta.title = newTitle;
        storage.setItem("dahtruth_project_meta", JSON.stringify(meta));
      }
    }
  } catch (err) {
    // Ignore
  }

  console.log(`[ProjectPage] Title propagated to all storage keys for project ${projectId}`);
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

// -------------------- API Settings Panel --------------------
function ApiSettingsPanel({ isOpen, onClose }) {
  const [keys, setKeys] = useState({ openai: "", anthropic: "" });
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingOpenAI, setTestingOpenAI] = useState(false);
  const [testingAnthropic, setTestingAnthropic] = useState(false);
  const [openAIStatus, setOpenAIStatus] = useState(null);
  const [anthropicStatus, setAnthropicStatus] = useState(null);

  useEffect(() => {
    setKeys(loadApiKeys());
  }, [isOpen]);

  const handleSave = () => {
    saveApiKeys(keys);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const testOpenAIKey = async () => {
    if (!keys.openai) return;
    setTestingOpenAI(true);
    setOpenAIStatus(null);
    
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${keys.openai}` },
      });
      setOpenAIStatus(res.ok ? "valid" : "invalid");
    } catch {
      setOpenAIStatus("invalid");
    } finally {
      setTestingOpenAI(false);
    }
  };

  const testAnthropicKey = async () => {
    if (!keys.anthropic) return;
    setTestingAnthropic(true);
    setAnthropicStatus(null);
    
    try {
      const isValidFormat = keys.anthropic.startsWith("sk-ant-");
      setAnthropicStatus(isValidFormat ? "valid" : "invalid");
    } catch {
      setAnthropicStatus("invalid");
    } finally {
      setTestingAnthropic(false);
    }
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
        style={{
          background: "#fff",
          boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <Key size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">API Settings</h2>
              <p className="text-xs text-white/70">
                Configure your AI provider keys for writing assistance
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info Banner */}
          <div
            className="p-4 rounded-xl flex items-start gap-3"
            style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}
          >
            <AlertCircle size={18} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-600">
              <strong className="text-gray-800">Your keys are stored locally</strong> on this device only. 
              They are never sent to our servers. You can get API keys from{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                OpenAI
              </a>{" "}
              or{" "}
              <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                Anthropic
              </a>.
            </div>
          </div>

          {/* OpenAI Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              OpenAI API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showOpenAI ? "text" : "password"}
                  value={keys.openai}
                  onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOpenAI ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testOpenAIKey}
                disabled={!keys.openai || testingOpenAI}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: openAIStatus === "valid" ? "rgba(34, 197, 94, 0.1)" : "rgba(99, 102, 241, 0.1)",
                  color: openAIStatus === "valid" ? "#16a34a" : "#6366f1",
                  border: `1px solid ${openAIStatus === "valid" ? "rgba(34, 197, 94, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                {testingOpenAI ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : openAIStatus === "valid" ? (
                  <Check size={16} />
                ) : (
                  "Test"
                )}
              </button>
            </div>
            {openAIStatus === "invalid" && (
              <p className="mt-2 text-xs text-red-600">Invalid API key. Please check and try again.</p>
            )}
            {openAIStatus === "valid" && (
              <p className="mt-2 text-xs text-green-600">✓ Key is valid and working</p>
            )}
          </div>

          {/* Anthropic Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Anthropic (Claude) API Key
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showAnthropic ? "text" : "password"}
                  value={keys.anthropic}
                  onChange={(e) => setKeys({ ...keys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showAnthropic ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                onClick={testAnthropicKey}
                disabled={!keys.anthropic || testingAnthropic}
                className="px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                style={{
                  background: anthropicStatus === "valid" ? "rgba(34, 197, 94, 0.1)" : "rgba(99, 102, 241, 0.1)",
                  color: anthropicStatus === "valid" ? "#16a34a" : "#6366f1",
                  border: `1px solid ${anthropicStatus === "valid" ? "rgba(34, 197, 94, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                {testingAnthropic ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : anthropicStatus === "valid" ? (
                  <Check size={16} />
                ) : (
                  "Test"
                )}
              </button>
            </div>
            {anthropicStatus === "invalid" && (
              <p className="mt-2 text-xs text-red-600">Invalid key format. Claude keys start with "sk-ant-"</p>
            )}
            {anthropicStatus === "valid" && (
              <p className="mt-2 text-xs text-green-600">✓ Key format is valid</p>
            )}
          </div>

          {/* Default Provider */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Preferred AI Provider
            </label>
            <div className="flex gap-3">
              {[
                { id: "openai", label: "OpenAI (GPT-4)", icon: "🤖" },
                { id: "anthropic", label: "Anthropic (Claude)", icon: "🧠" },
              ].map((provider) => {
                const isSelected = loadApiKeys().preferred === provider.id || 
                  (!loadApiKeys().preferred && provider.id === "openai");
                return (
                  <button
                    key={provider.id}
                    onClick={() => {
                      const updated = { ...keys, preferred: provider.id };
                      setKeys(updated);
                      saveApiKeys(updated);
                    }}
                    className="flex-1 p-4 rounded-xl text-left transition-all"
                    style={{
                      background: isSelected ? "rgba(99, 102, 241, 0.1)" : "rgba(248, 250, 252, 0.9)",
                      border: `2px solid ${isSelected ? "#6366f1" : "rgba(148, 163, 184, 0.3)"}`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{provider.icon}</span>
                      <span className="text-sm font-medium text-gray-800">{provider.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ background: "rgba(248, 250, 252, 0.9)", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleSave();
              setTimeout(onClose, 500);
            }}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{
              background: saved ? "linear-gradient(135deg, #22c55e, #16a34a)" : "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            {saved ? (
              <span className="flex items-center gap-2">
                <Check size={16} /> Saved!
              </span>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- Author Setup Modal --------------------
function AuthorSetupModal({ isOpen, onComplete }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      await onComplete(name.trim(), email.trim() || undefined);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-8 text-center"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          }}
        >
          <div className="text-5xl mb-3">✍️</div>
          <h2 className="text-2xl font-semibold text-white">Welcome to DahTruth StoryLab</h2>
          <p className="text-sm text-white/70 mt-2">
            Let's set up your author profile to get started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Your Name / Pen Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How you want to be known as an author"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Email (optional, for cross-device access)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
            />
            <p className="mt-2 text-xs text-gray-500">
              Add your email to access your projects from any device
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3.5 rounded-xl text-base font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.4)",
            }}
          >
            {isLoading ? "Setting up..." : "Start Writing →"}
          </button>
        </form>
      </div>
    </div>
  );
}

// -------------------- Rename Project Modal --------------------
function RenameProjectModal({ isOpen, onClose, project, onSave }) {
  const [title, setTitle] = useState(project?.title || "");

  useEffect(() => {
    if (project) setTitle(project.title || "");
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(project.id, trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          boxShadow: "0 25px 80px rgba(15, 23, 42, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-6 py-4"
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          }}
        >
          <h2 className="text-lg font-semibold text-white">Rename Project</h2>
          <p className="text-xs text-white/70 mt-1">
            This will update the title everywhere in the app
          </p>
        </div>

        <div className="p-6">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") onClose();
            }}
          />
        </div>

        <div
          className="px-6 py-4 flex justify-end gap-3"
          style={{ background: "rgba(248, 250, 252, 0.9)", borderTop: "1px solid rgba(148, 163, 184, 0.2)" }}
        >
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #9b7bc9, #b897d6)",
              boxShadow: "0 4px 14px rgba(155, 123, 201, 0.4)",
            }}
          >
            Save Title
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
  const [authorAvatar, setAuthorAvatar] = useState("");
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [showAuthorSetup, setShowAuthorSetup] = useState(false);
  const [syncStatus, setSyncStatus] = useState("idle");

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [projectToRename, setProjectToRename] = useState(null);

  // Initialize
  useEffect(() => {
    const profile = getLocalAuthorProfile();
    if (!profile) {
      setShowAuthorSetup(true);
    } else {
      setAuthorName(profile.name);
    }

    if (needsMigration()) {
      console.log("[ProjectPage] Migrating legacy data...");
      migrateLegacyData();
    }

    loadProjectsList();
  }, []);

  const loadProjectsList = async () => {
    setSyncStatus("syncing");
    try {
      const entries = await listProjects({ refreshFromCloud: true });
      const legacy = loadLegacyProjects();
      const mergedProjects = [...entries];
      
      for (const lp of legacy) {
        if (!mergedProjects.find((p) => p.id === lp.id)) {
          mergedProjects.push({
            id: lp.id,
            title: lp.title || "Untitled",
            author: lp.author || authorName,
            status: lp.status || "draft",
            wordCount: lp.wordCount || 0,
            chapterCount: lp.chapterCount || 0,
            updatedAt: lp.lastModified || new Date().toISOString(),
            createdAt: lp.createdAt || new Date().toISOString(),
            _legacy: lp,
          });
        }
      }

      setProjects(mergedProjects);
      setSyncStatus("synced");
    } catch (err) {
      console.error("[ProjectPage] Failed to load projects:", err);
      const legacy = loadLegacyProjects();
      setProjects(legacy.map((lp) => ({
        id: lp.id,
        title: lp.title || "Untitled",
        author: lp.author || authorName,
        status: lp.status || "draft",
        wordCount: lp.wordCount || 0,
        chapterCount: lp.chapterCount || 0,
        updatedAt: lp.lastModified || new Date().toISOString(),
        createdAt: lp.createdAt || new Date().toISOString(),
        _legacy: lp,
      })));
      setSyncStatus("error");
    }
  };

  useEffect(() => {
    const sync = () => loadProjectsList();
    window.addEventListener("storage", sync);
    window.addEventListener("project:change", sync);
    window.addEventListener("profile:updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("project:change", sync);
      window.removeEventListener("profile:updated", sync);
    };
  }, [authorName]);

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  const handleAuthorSetupComplete = async (name, email) => {
    const profile = completeAuthorSetup(name, email);
    setAuthorName(profile.name);
    setShowAuthorSetup(false);
  };

  const handleAuthorNameSave = (newName) => {
    const trimmed = (newName || "").trim() || "New Author";
    setAuthorName(trimmed);

    const profile = getLocalAuthorProfile();
    if (profile) {
      profile.name = trimmed;
      profile.updatedAt = new Date().toISOString();
      setLocalAuthorProfile(profile);
    }

    setProjects((prev) => {
      const updated = prev.map((p) => ({
        ...p,
        author: trimmed,
      }));
      saveLegacyProjects(updated.map((p) => p._legacy || p));
      return updated;
    });

    window.dispatchEvent(new Event("profile:updated"));
  };

  const addProject = async () => {
    const now = new Date().toISOString();
    const profile = getLocalAuthorProfile();
    
    try {
      const project = await createProject("Untitled Project", {
        authorName: profile?.name || authorName,
        saveToCloud: true,
      });

      const legacyProject = {
        id: project.id,
        title: project.title,
        author: project.author,
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

      const legacy = loadLegacyProjects();
      saveLegacyProjects([legacyProject, ...legacy]);
      loadProjectsList();
    } catch (err) {
      console.error("[ProjectPage] Failed to create project:", err);
      const legacyProject = {
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
      const legacy = loadLegacyProjects();
      saveLegacyProjects([legacyProject, ...legacy]);
      loadProjectsList();
    }
  };

  // ✅ UPDATED: Now propagates title changes to all storage keys
  const updateProject = (id, patch) => {
    setProjects((prev) => {
      const now = new Date().toISOString();
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: now } : p
      );

      // If title was updated, propagate to all storage keys
      if (patch.title) {
        propagateTitleChange(id, patch.title);
      }

      // Save to legacy
      const legacyUpdated = updated.map((p) => ({
        ...(p._legacy || {}),
        ...p,
        lastModified: p.updatedAt,
      }));
      saveLegacyProjects(legacyUpdated);
      return updated;
    });
  };

  // Open rename modal
  const openRenameModal = (project) => {
    setProjectToRename(project);
    setRenameModalOpen(true);
  };

  // Handle rename from modal
  const handleRenameProject = (projectId, newTitle) => {
    updateProject(projectId, { title: newTitle });
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;

    try {
      await deleteProjectService(id);
    } catch (err) {
      console.error("[ProjectPage] Cloud delete failed:", err);
    }

    const legacy = loadLegacyProjects();
    saveLegacyProjects(legacy.filter((p) => p.id !== id));
    loadProjectsList();
  };

  const openInWriter = async (project) => {
    try {
      const loaded = await loadProject(project.id);
      
      if (loaded) {
        setCurrentProject(loaded);
      } else {
        const snapshot = {
          id: project.id,
          title: project.title || project._legacy?.title || "Untitled",
          wordCount: project.wordCount || project._legacy?.wordCount || 0,
          lastModified: project.updatedAt || new Date().toISOString(),
          status: project.status || "Draft",
          targetWords: project.targetWords || project._legacy?.targetWords || 50000,
        };
        storage.setItem("currentStory", JSON.stringify(snapshot));
      }
      
      window.dispatchEvent(new Event("project:change"));
    } catch (err) {
      console.error("[ProjectPage] Failed to load project:", err);
      const snapshot = {
        id: project.id,
        title: project.title,
        wordCount: project.wordCount || 0,
        lastModified: project.updatedAt || new Date().toISOString(),
        status: project.status || "Draft",
        targetWords: project.targetWords || 50000,
      };
      storage.setItem("currentStory", JSON.stringify(snapshot));
      window.dispatchEvent(new Event("project:change"));
    }

    navigate("/compose");
  };

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

  const totalWords = projects.reduce((sum, p) => sum + (p.wordCount || 0), 0);
  const inProgress = projects.filter(
    (p) => !["Published", "Idea", "published", "completed", "archived"].includes(p.status)
  ).length;
  const published = projects.filter(
    (p) => p.status === "Published" || p.status === "published" || p.status === "completed"
  ).length;

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

  const apiKeys = loadApiKeys();
  const hasApiKeys = !!(apiKeys.openai || apiKeys.anthropic);

  return (
    <div
      className="min-h-screen text-gray-800"
      style={{
        background:
          "linear-gradient(135deg, #fef5ff 0%, #f8e8ff 50%, #fff5f7 100%)",
      }}
    >
      {/* Author Setup Modal */}
      <AuthorSetupModal
        isOpen={showAuthorSetup}
        onComplete={handleAuthorSetupComplete}
      />

      {/* API Settings Modal */}
      <ApiSettingsPanel
        isOpen={showApiSettings}
        onClose={() => setShowApiSettings(false)}
      />

      {/* Rename Project Modal */}
      <RenameProjectModal
        isOpen={renameModalOpen}
        onClose={() => {
          setRenameModalOpen(false);
          setProjectToRename(null);
        }}
        project={projectToRename}
        onSave={handleRenameProject}
      />

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Dashboard Button */}
        <button
          onClick={handleGoBack}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #D4AF37, #f5e6b3)",
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
                  <span className="font-medium text-gray-800">{authorName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = authorName === "New Author" ? "" : authorName;
                      const next = window.prompt("Update author / pen name:", current);
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

                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                  {projects.length} projects • {totalWords.toLocaleString()} total words
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{
                      background:
                        syncStatus === "synced"
                          ? "rgba(34, 197, 94, 0.1)"
                          : syncStatus === "syncing"
                          ? "rgba(59, 130, 246, 0.1)"
                          : syncStatus === "error"
                          ? "rgba(239, 68, 68, 0.1)"
                          : "rgba(148, 163, 184, 0.1)",
                      color:
                        syncStatus === "synced"
                          ? "#16a34a"
                          : syncStatus === "syncing"
                          ? "#3b82f6"
                          : syncStatus === "error"
                          ? "#dc2626"
                          : "#64748b",
                    }}
                  >
                    {syncStatus === "synced" ? (
                      <>
                        <Cloud size={10} /> Synced
                      </>
                    ) : syncStatus === "syncing" ? (
                      <>
                        <Loader2 size={10} className="animate-spin" /> Syncing...
                      </>
                    ) : syncStatus === "error" ? (
                      <>
                        <CloudOff size={10} /> Offline
                      </>
                    ) : (
                      "Ready"
                    )}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* API Settings Button */}
              <button
                onClick={() => setShowApiSettings(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: hasApiKeys
                    ? "rgba(34, 197, 94, 0.08)"
                    : "rgba(251, 191, 36, 0.1)",
                  border: `1px solid ${hasApiKeys ? "rgba(34, 197, 94, 0.3)" : "rgba(251, 191, 36, 0.4)"}`,
                  color: hasApiKeys ? "#16a34a" : "#92400e",
                }}
              >
                <Key size={16} />
                {hasApiKeys ? "API Keys ✓" : "Add API Keys"}
              </button>

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
              <button
                type="button"
                onClick={() => navigate("/compose")}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(148,163,184,0.4)",
                }}
              >
                <Upload size={16} />
                Import Manuscript
              </button>

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

        {/* API Keys Warning Banner */}
        {!hasApiKeys && (
          <div
            className="rounded-2xl p-5 mb-8 flex items-center gap-4"
            style={{
              background: "linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(251, 146, 60, 0.08))",
              border: "1px solid rgba(251, 191, 36, 0.35)",
            }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(251, 191, 36, 0.2)" }}
            >
              <Key size={24} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-1">Set Up AI Features</h3>
              <p className="text-sm text-gray-600">
                Add your OpenAI or Claude API key to enable AI-powered writing assistance, grammar checking, and story analysis.
              </p>
            </div>
            <button
              onClick={() => setShowApiSettings(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0 transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.4)",
              }}
            >
              Add API Keys
            </button>
          </div>
        )}

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
              const legacyData = project._legacy || project;
              const wordCount = project.wordCount || legacyData.wordCount || 0;
              const targetWords = legacyData.targetWords || 50000;
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
                        background: "linear-gradient(135deg, #e8dff5, #f5e6ff)",
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
                      ) : legacyData.cover ? (
                        <img
                          src={legacyData.cover}
                          alt={`${project.title} cover`}
                          className="w-full h-full min-h-[280px] object-cover"
                        />
                      ) : (
                        <div className="w-full h-full min-h-[280px] flex flex-col items-center justify-center p-4">
                          <ImageIcon size={40} className="text-purple-300 mb-3" />
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
                        {legacyData.cover ? "Change" : "Upload"}
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
                          {/* ✅ UPDATED: Title with dedicated rename button */}
                          <div className="flex items-center gap-2">
                            <h3
                              className="text-xl font-semibold truncate cursor-pointer hover:text-purple-700 transition-colors"
                              style={{
                                fontFamily: "'EB Garamond', Georgia, serif",
                                color: "#111827",
                              }}
                              onClick={() => openRenameModal(project)}
                              title="Click to rename"
                            >
                              {project.title || "Untitled"}
                            </h3>
                            <button
                              type="button"
                              onClick={() => openRenameModal(project)}
                              className="text-gray-400 hover:text-purple-600 transition-colors p-1"
                              title="Rename project"
                            >
                              <PencilLine size={14} />
                            </button>
                          </div>
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
                          value={legacyData.status || "Draft"}
                          onChange={(e) =>
                            updateProject(project.id, {
                              status: e.target.value,
                            })
                          }
                          className="ml-3 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-full cursor-pointer outline-none"
                          style={getStatusStyle(legacyData.status || "Draft")}
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
                        value={legacyData.logline || ""}
                        onChange={(e) =>
                          updateProject(project.id, {
                            logline: e.target.value,
                            _legacy: { ...legacyData, logline: e.target.value },
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
                            value: project.chapterCount || legacyData.chapterCount || 0,
                            label: "Chapters",
                          },
                          {
                            icon: <Users size={16} />,
                            value: legacyData.characterCount || 0,
                            label: "Characters",
                          },
                          {
                            icon: <Calendar size={16} />,
                            value: formatDate(project.updatedAt || legacyData.lastModified),
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
                          onClick={() => handleDeleteProject(project.id)}
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
                  background: "linear-gradient(135deg, #9b7bc9, #D4AF37)",
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
              const legacyData = project._legacy || project;
              const wordCount = project.wordCount || legacyData.wordCount || 0;
              const targetWords = legacyData.targetWords || 50000;
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
                      background: "linear-gradient(135deg, #e8dff5, #f5e6ff)",
                    }}
                  >
                    {legacyData.cover ? (
                      <img
                        src={legacyData.cover}
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
                      className="font-semibold flex items-center gap-2 cursor-pointer hover:text-purple-700"
                      style={{
                        fontFamily: "'EB Garamond', Georgia, serif",
                        color: "#111827",
                      }}
                      onClick={() => openRenameModal(project)}
                    >
                      {project.title || "Untitled"}
                      <PencilLine size={12} className="text-gray-400" />
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      by {project.author || authorName}
                    </div>
                  </div>

                  {/* Genre */}
                  <div className="text-sm text-gray-600">
                    {legacyData.genre?.join(", ") || "—"}
                  </div>

                  {/* Words */}
                  <div className="font-semibold text-purple-900">
                    {wordCount.toLocaleString()}
                  </div>

                  {/* Chapters */}
                  <div className="text-gray-600">
                    {project.chapterCount || legacyData.chapterCount || 0}
                  </div>

                  {/* Last Edit */}
                  <div className="text-sm text-gray-500">
                    {formatDate(project.updatedAt || legacyData.lastModified)}
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
                      {Math.round(pct)}% • {legacyData.status || "Draft"}
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

