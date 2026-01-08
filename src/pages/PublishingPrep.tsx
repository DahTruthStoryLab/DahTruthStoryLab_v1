// src/pages/PublishingPrep.tsx
// UPDATED: Uses storage wrapper and project-scoped keys
// Properly tracks project switches via project:change events

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import {
  ArrowLeft,
  Feather,
  FileText,
  ClipboardList,
  Megaphone,
  Save,
  Loader2,
  Check,
  BookOpen,
  Sparkles,
  RefreshCw,
} from "lucide-react";

import {
  generateQueryLetter,
  generateLogline,
  generateBackCoverBlurb,
} from "../lib/api";

// ✅ Import the storage wrapper
import { storage } from "../lib/storage";

/* ---------- Theme ---------- */
const theme = {
  bg: "var(--brand-bg)",
  surface: "var(--brand-surface, var(--brand-white))",
  border: "var(--brand-border)",
  borderStrong: "var(--brand-border-strong)",
  text: "var(--brand-text)",
  subtext: "var(--brand-subtext)",
  accent: "var(--brand-accent)",
  highlight: "var(--brand-highlight)",
  primary: "var(--brand-primary)",
  white: "var(--brand-white)",
} as const;

/* ---------- Styles ---------- */
const styles = {
  outer: {
    maxWidth: 1200,
    margin: "32px auto",
    background: theme.white,
    border: `1px solid ${theme.borderStrong}`,
    borderRadius: 16,
    boxShadow: "0 12px 40px rgba(2,20,40,.08)",
    overflow: "hidden",
  } as React.CSSProperties,
  inner: { padding: "20px 24px" } as React.CSSProperties,
  sectionShell: { maxWidth: 1120, margin: "0 auto" } as React.CSSProperties,
  glassCard: {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 8px 30px rgba(2,20,40,.06)",
  } as React.CSSProperties,
} as const;

/* ---------- Storage Keys ---------- */
const PROFILE_KEY = "profile";
const PROJECTS_KEY = "userProjects";
const CURRENT_PROJECT_ID_KEY = "dahtruth-current-project-id";
const CURRENT_STORY_KEY = "currentStory";

// Project-scoped keys
const publishingPrepKeyForProject = (projectId: string) =>
  `dt_publishing_prep_${projectId}`;

const publishingDraftKeyForProject = (projectId: string) =>
  `publishingDraft_${projectId}`;

const publishingMetaKeyForProject = (projectId: string) =>
  `dt_publishing_meta_${projectId}`;

const projectDataKeyForProject = (projectId: string) =>
  `dahtruth-project-${projectId}`;

/* ---------- Types ---------- */
interface PublishingChecklist {
  [key: string]: boolean;
}

interface Project {
  id: string;
  title?: string;
  author?: string;
  wordCount?: number;
  targetWords?: number;
  status?: string;
  synopsis?: string;
  queryLetter?: string;
  backCover?: string;
  logline?: string;
  publishingChecklist?: PublishingChecklist;
  marketingNotes?: string;
  launchPlan?: string;
  lastModified?: string;
  chapterCount?: number;
}

interface PublishingPrepData {
  synopsis?: string;
  queryLetter?: string;
  backCover?: string;
  logline?: string;
  publishingChecklist?: PublishingChecklist;
  marketingNotes?: string;
  launchPlan?: string;
  lastModified?: string;
}

/* ---------- Helpers ---------- */

// ✅ Use storage wrapper instead of localStorage
function loadProfile() {
  try {
    const raw = storage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadProjects(): Project[] {
  try {
    const raw = storage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  try {
    storage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects from PublishingPrep:", err);
  }
}

function getCurrentProjectId(): string | null {
  try {
    return storage.getItem(CURRENT_PROJECT_ID_KEY) || null;
  } catch {
    return null;
  }
}

function loadCurrentStory() {
  try {
    const raw = storage.getItem(CURRENT_STORY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ✅ Load publishing prep data from project-scoped key
function loadPublishingPrepData(projectId: string): PublishingPrepData | null {
  if (!projectId) return null;
  
  try {
    // First try the dedicated publishing prep key
    const prepRaw = storage.getItem(publishingPrepKeyForProject(projectId));
    if (prepRaw) {
      return JSON.parse(prepRaw);
    }
    
    // Fall back to publishing draft key (from Publishing.tsx)
    const draftRaw = storage.getItem(publishingDraftKeyForProject(projectId));
    if (draftRaw) {
      const draft = JSON.parse(draftRaw);
      // Extract relevant fields
      return {
        synopsis: draft.synopsis,
        queryLetter: draft.queryLetter,
        backCover: draft.backCover,
        logline: draft.logline,
        publishingChecklist: draft.publishingChecklist,
        marketingNotes: draft.marketingNotes,
        launchPlan: draft.launchPlan,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

// ✅ Save publishing prep data to project-scoped key
function savePublishingPrepData(projectId: string, data: PublishingPrepData) {
  if (!projectId) return;
  
  try {
    const toSave = {
      ...data,
      lastModified: new Date().toISOString(),
    };
    storage.setItem(publishingPrepKeyForProject(projectId), JSON.stringify(toSave));
    
    // Also update the main project data if it exists
    const projectsRaw = storage.getItem(PROJECTS_KEY);
    if (projectsRaw) {
      const projects = JSON.parse(projectsRaw);
      const updated = projects.map((p: Project) =>
        p.id === projectId
          ? { ...p, ...data, lastModified: new Date().toISOString() }
          : p
      );
      storage.setItem(PROJECTS_KEY, JSON.stringify(updated));
    }
    
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save publishing prep data:", err);
  }
}

// ✅ Load project metadata (title, author, word count) from project data
function loadProjectMeta(projectId: string): Partial<Project> | null {
  if (!projectId) return null;
  
  try {
    // Try main project data key first
    const dataRaw = storage.getItem(projectDataKeyForProject(projectId));
    if (dataRaw) {
      const data = JSON.parse(dataRaw);
      const totalWords = (data.chapters || []).reduce(
        (sum: number, ch: any) => sum + (ch.wordCount || 0),
        0
      );
      return {
        title: data.book?.title || "Untitled",
        wordCount: totalWords,
        chapterCount: (data.chapters || []).length,
      };
    }
    
    // Try publishing meta key
    const metaRaw = storage.getItem(publishingMetaKeyForProject(projectId));
    if (metaRaw) {
      return JSON.parse(metaRaw);
    }
    
    return null;
  } catch {
    return null;
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DEFAULT_CHECKLIST = [
  { id: "revise-1", label: "Manuscript revised at least once" },
  { id: "beta-readers", label: "Feedback from beta readers applied" },
  { id: "synopsis-done", label: "Clear 1–3 paragraph synopsis drafted" },
  { id: "query-draft", label: "Query letter drafted and proofread" },
  { id: "back-cover", label: "Back cover copy written" },
  {
    id: "metadata",
    label: "Basic metadata defined (genre, audience, comps)",
  },
];

const getWordCount = (str: string = "") =>
  str.trim() ? str.trim().split(/\s+/).length : 0;

/* ---------- Component ---------- */
export default function PublishingPrep(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  // State passed from StoryMaterials → PublishingPrep
  const locationState = (location.state || {}) as {
    from?: string;
    materialType?: string;
    manuscriptMeta?: any;
    manuscriptText?: string;
    generated?: string;
  };

  const initialMaterialType = locationState.materialType || null;
  const initialGenerated = locationState.generated || "";

  const cameFromStoryMaterials = locationState.from === "story-materials";
  const isSynopsisMaterial =
    !!initialMaterialType &&
    initialMaterialType.toString().startsWith("synopsis");

  // ✅ NEW: Track current project ID
  const [projectId, setProjectId] = useState<string>(() => {
    return getCurrentProjectId() || "";
  });

  // Core app state
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentStory, setCurrentStory] = useState<any | null>(null);
  const [projectMeta, setProjectMeta] = useState<Partial<Project> | null>(null);

  const [activeTab, setActiveTab] = useState<
    "synopsis" | "query" | "pitch" | "checklist" | "marketing"
  >("synopsis");

  // Main content states
  const [synopsis, setSynopsis] = useState<string>("");
  const [queryLetter, setQueryLetter] = useState<string>("");
  const [backCover, setBackCover] = useState<string>("");
  const [logline, setLogline] = useState<string>("");

  // AI flags
  const [isGeneratingQuery, setIsGeneratingQuery] = useState(false);
  const [isGeneratingLogline, setIsGeneratingLogline] = useState(false);
  const [isGeneratingBackCover, setIsGeneratingBackCover] = useState(false);

  // Checklist + marketing
  const [checklistState, setChecklistState] =
    useState<PublishingChecklist>({});
  const [marketingNotes, setMarketingNotes] = useState<string>("");
  const [launchPlan, setLaunchPlan] = useState<string>("");

  // Save UI
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // ✅ Load all data for the current project
  const loadAllData = useCallback(() => {
    const currentProjId = getCurrentProjectId() || "";
    setProjectId(currentProjId);
    setProfile(loadProfile());
    setProjects(loadProjects());
    setCurrentStory(loadCurrentStory());
    
    if (currentProjId) {
      setProjectMeta(loadProjectMeta(currentProjId));
      
      // Load publishing prep data for this project
      const prepData = loadPublishingPrepData(currentProjId);
      if (prepData) {
        // Only set if we didn't come from story materials with generated content
        if (!(cameFromStoryMaterials && isSynopsisMaterial && initialGenerated)) {
          setSynopsis(prepData.synopsis || "");
        }
        setQueryLetter(prepData.queryLetter || "");
        setBackCover(prepData.backCover || "");
        setLogline(prepData.logline || "");
        
        const storedChecklist = prepData.publishingChecklist || {};
        const baseState: PublishingChecklist = {};
        DEFAULT_CHECKLIST.forEach((item) => {
          baseState[item.id] = !!storedChecklist[item.id];
        });
        setChecklistState(baseState);
        
        setMarketingNotes(prepData.marketingNotes || "");
        setLaunchPlan(prepData.launchPlan || "");
      } else {
        // Reset fields if no data for this project
        if (!(cameFromStoryMaterials && isSynopsisMaterial && initialGenerated)) {
          setSynopsis("");
        }
        setQueryLetter("");
        setBackCover("");
        setLogline("");
        setChecklistState({});
        setMarketingNotes("");
        setLaunchPlan("");
      }
    }
  }, [cameFromStoryMaterials, isSynopsisMaterial, initialGenerated]);

  // ✅ Initial load + listen for project changes
  useEffect(() => {
    loadAllData();
    
    // If we came from story materials with generated synopsis, set it
    if (cameFromStoryMaterials && isSynopsisMaterial && initialGenerated) {
      setSynopsis(initialGenerated);
    }

    const handleProjectChange = () => {
      console.log("[PublishingPrep] Project changed, reloading data...");
      loadAllData();
    };

    window.addEventListener("storage", handleProjectChange);
    window.addEventListener("project:change", handleProjectChange);
    window.addEventListener("profile:updated", () => setProfile(loadProfile()));

    return () => {
      window.removeEventListener("storage", handleProjectChange);
      window.removeEventListener("project:change", handleProjectChange);
      window.removeEventListener("profile:updated", () => setProfile(loadProfile()));
    };
  }, [loadAllData, cameFromStoryMaterials, isSynopsisMaterial, initialGenerated]);

  // Resolve active project from currentStory or fall back to first
  const activeProject: Project | null = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    
    // First try to find by projectId (most reliable)
    if (projectId) {
      const found = projects.find((p) => p.id === projectId);
      if (found) {
        // Merge with projectMeta for accurate word count
        return {
          ...found,
          title: projectMeta?.title || found.title,
          wordCount: projectMeta?.wordCount ?? found.wordCount,
          chapterCount: projectMeta?.chapterCount ?? found.chapterCount,
        };
      }
    }
    
    // Fall back to currentStory
    if (currentStory?.id) {
      const found = projects.find((p) => p.id === currentStory.id);
      if (found) return found;
    }
    
    return projects[0];
  }, [projects, projectId, currentStory, projectMeta]);

  const authorName =
    activeProject?.author || profile?.displayName || profile?.name || "Author";

  // Bundle author + project metadata into helpful strings for the AI
  const authorProfileText = useMemo(() => {
    if (!profile && !activeProject) return "";
    const parts: string[] = [];

    if (authorName) {
      parts.push(`Author Name: ${authorName}`);
    }
    if (activeProject?.title) {
      parts.push(`Project Title: ${activeProject.title}`);
    }
    if (activeProject?.wordCount) {
      parts.push(`Approx Word Count: ${activeProject.wordCount}`);
    }
    if (profile) {
      parts.push("Author Profile JSON:");
      parts.push(JSON.stringify(profile, null, 2));
    }

    return parts.join("\n");
  }, [profile, activeProject, authorName]);

  const handleBackToPublishing = () => {
    navigate("/publishing");
  };

  // ✅ Refresh data from storage
  const handleRefreshData = () => {
    loadAllData();
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // ✅ Updated save handler - saves to project-scoped key
  const handleSave = async () => {
    if (!projectId) {
      alert("No project selected. Please go back and select a project first.");
      return;
    }
    
    setIsSaving(true);
    try {
      const prepData: PublishingPrepData = {
        synopsis: synopsis || "",
        queryLetter: queryLetter || "",
        backCover: backCover || "",
        logline: logline || "",
        publishingChecklist: checklistState,
        marketingNotes: marketingNotes || "",
        launchPlan: launchPlan || "",
      };
      
      savePublishingPrepData(projectId, prepData);
      
      // Also update the projects array
      const updatedProjects = projects.map((p) =>
        p.id === projectId
          ? {
              ...p,
              ...prepData,
              lastModified: new Date().toISOString(),
            }
          : p
      );
      setProjects(updatedProjects);
      saveProjects(updatedProjects);
      
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (err) {
      console.error("Failed to save Publishing Prep:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const synopsisWords = getWordCount(synopsis);
  const queryWords = getWordCount(queryLetter);
  const loglineWords = getWordCount(logline);
  const backCoverWords = getWordCount(backCover);

  /* ---------- AI Handlers ---------- */

  const handleGenerateQueryLetter = async () => {
    if (!synopsis.trim()) {
      alert(
        "Please add or paste a synopsis first. The query letter is built from it."
      );
      return;
    }
    if (!activeProject) {
      alert("No active project found. Go back and select a manuscript first.");
      return;
    }

    try {
      setIsGeneratingQuery(true);
      const res = await generateQueryLetter({
        synopsis,
        authorProfile: authorProfileText,
        projectTitle: activeProject.title,
        genre: (locationState.manuscriptMeta as any)?.genre,
      });
      const text =
        (res as any).queryLetter ||
        (res as any).result ||
        (res as any).text ||
        "";
      if (!text.trim()) {
        throw new Error("Empty response from query-letter endpoint.");
      }
      setQueryLetter(text.trim());
    } catch (err: any) {
      console.error("Query letter generation failed:", err);
      alert(
        `Query letter generation failed: ${
          err?.message || "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  const handleGenerateLogline = async () => {
    if (!synopsis.trim()) {
      alert("Please add or paste a synopsis first. The logline is built from it.");
      return;
    }
    if (!activeProject) {
      alert("No active project found. Go back and select a manuscript first.");
      return;
    }

    try {
      setIsGeneratingLogline(true);
      const res = await generateLogline({
        synopsis,
        projectTitle: activeProject.title,
        genre: (locationState.manuscriptMeta as any)?.genre,
      });
      const text =
        (res as any).logline ||
        (res as any).result ||
        (res as any).text ||
        "";
      if (!text.trim()) {
        throw new Error("Empty response from logline endpoint.");
      }
      setLogline(text.trim());
    } catch (err: any) {
      console.error("Logline generation failed:", err);
      alert(
        `Logline generation failed: ${
          err?.message || "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingLogline(false);
    }
  };

  const handleGenerateBackCover = async () => {
    if (!synopsis.trim()) {
      alert(
        "Please add or paste a synopsis first. The back cover blurb is built from it."
      );
      return;
    }
    if (!activeProject) {
      alert("No active project found. Go back and select a manuscript first.");
      return;
    }

    try {
      setIsGeneratingBackCover(true);
      const res = await generateBackCoverBlurb({
        synopsis,
        projectTitle: activeProject.title,
        genre: (locationState.manuscriptMeta as any)?.genre,
      });
      const text =
        (res as any).backCover ||
        (res as any).result ||
        (res as any).text ||
        "";
      if (!text.trim()) {
        throw new Error("Empty response from back-cover endpoint.");
      }
      setBackCover(text.trim());
    } catch (err: any) {
      console.error("Back cover blurb generation failed:", err);
      alert(
        `Back cover blurb generation failed: ${
          err?.message || "Unknown error"
        }`
      );
    } finally {
      setIsGeneratingBackCover(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <PageShell
      style={{
        background: theme.bg,
        minHeight: "100vh",
      }}
    >
      <div style={styles.outer}>
        {/* Header */}
        <div
          style={{
            background:
              "linear-gradient(135deg, rgba(236, 72, 153, 0.65), rgba(249, 168, 212, 0.65))",
            backdropFilter: "blur(12px)",
            color: theme.white,
            padding: "20px 24px",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <button
              onClick={handleBackToPublishing}
              style={{
                border: "none",
                background: "rgba(255,255,255,0.2)",
                color: theme.white,
                padding: "10px 18px",
                fontSize: 15,
                borderRadius: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <ArrowLeft size={16} />
              Back to Publishing
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "center",
              }}
            >
              <BookOpen size={22} />
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 600,
                  }}
                >
                  Publishing Preparation
                </h1>
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.9,
                  }}
                >
                  {activeProject ? (
                    <>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {activeProject.title || "Untitled Project"}
                      </span>{" "}
                      by {authorName}
                    </>
                  ) : (
                    <span style={{ color: "#fecaca" }}>
                      ⚠️ No project selected — go back and select one
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* ✅ Refresh button */}
              <button
                onClick={handleRefreshData}
                title="Refresh data from storage"
                style={{
                  border: "none",
                  background: "rgba(255,255,255,0.2)",
                  color: theme.white,
                  padding: "8px",
                  borderRadius: 8,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <RefreshCw size={16} />
              </button>
              
              <div style={{ textAlign: "right", fontSize: 12 }}>
                {activeProject?.wordCount && (
                  <div>
                    {activeProject.wordCount.toLocaleString()} words
                    {activeProject.chapterCount && (
                      <> • {activeProject.chapterCount} chapters</>
                    )}
                  </div>
                )}
                {activeProject?.lastModified && (
                  <div style={{ opacity: 0.8 }}>
                    Updated: {formatDate(activeProject.lastModified)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              {
                id: "synopsis" as const,
                icon: <Feather size={16} />,
                label: "Synopsis",
              },
              {
                id: "query" as const,
                icon: <FileText size={16} />,
                label: "Query Letter",
              },
              {
                id: "pitch" as const,
                icon: <Sparkles size={16} />,
                label: "Logline & Blurb",
              },
              {
                id: "checklist" as const,
                icon: <ClipboardList size={16} />,
                label: "Checklist",
              },
              {
                id: "marketing" as const,
                icon: <Megaphone size={16} />,
                label: "Marketing & Launch",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  border:
                    activeTab === tab.id
                      ? "1px solid rgba(255,255,255,0.0)"
                      : `1px solid ${theme.border}`,
                  background:
                    activeTab === tab.id
                      ? "linear-gradient(135deg, #9b7bc9, #b897d6)"
                      : theme.white,
                  color: activeTab === tab.id ? "#fff" : theme.text,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow:
                    activeTab === tab.id
                      ? "0 6px 18px rgba(155,123,201,0.35)"
                      : "none",
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            <div style={{ marginLeft: "auto" }}>
              <button
                onClick={handleSave}
                disabled={isSaving || !projectId}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 16px",
                  borderRadius: 999,
                  border: "none",
                  background:
                    "linear-gradient(135deg, #D4AF37, #f5e6b3)",
                  color: "#1f2937",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: isSaving || !projectId ? "default" : "pointer",
                  opacity: isSaving || !projectId ? 0.6 : 1,
                  boxShadow:
                    "0 6px 18px rgba(180,142,38,0.35)",
                }}
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {isSaving ? "Saving..." : "Save All"}
              </button>
            </div>
          </div>

          {/* Main two-column layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1.4fr)",
              gap: 20,
              alignItems: "flex-start",
            }}
          >
            {/* Left column: text content */}
            <div style={styles.glassCard}>
              {/* SYNOPSIS TAB */}
              {activeTab === "synopsis" && (
                <>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 18,
                      color: theme.text,
                    }}
                  >
                    Synopsis
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    Draft a clear, compelling summary of your story. Aim for
                    1–3 paragraphs that cover the main arc and stakes.
                  </p>
                  <textarea
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Paste or refine your synopsis here..."
                    style={{
                      width: "100%",
                      minHeight: 220,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "10px 12px",
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: theme.subtext,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{synopsisWords} words</span>
                    {cameFromStoryMaterials && isSynopsisMaterial && (
                      <span>Imported from Story Materials</span>
                    )}
                  </div>
                </>
              )}

              {/* QUERY TAB */}
              {activeTab === "query" && (
                <>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 18,
                      color: theme.text,
                    }}
                  >
                    Query Letter
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    Draft your query letter here. Include a strong hook, brief
                    synopsis, and your author bio.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: 8,
                      gap: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleGenerateQueryLetter}
                      disabled={isGeneratingQuery || !synopsis.trim()}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        border: "none",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: isGeneratingQuery ? "default" : "pointer",
                        background:
                          "linear-gradient(135deg, #6366f1, #a855f7)",
                        color: "#fff",
                      }}
                    >
                      {isGeneratingQuery
                        ? "AI drafting..."
                        : "AI: Draft from synopsis + profile"}
                    </button>
                  </div>

                  <textarea
                    value={queryLetter}
                    onChange={(e) => setQueryLetter(e.target.value)}
                    placeholder="Dear Agent..."
                    style={{
                      width: "100%",
                      minHeight: 220,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "10px 12px",
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      color: theme.subtext,
                      textAlign: "right",
                    }}
                  >
                    {queryWords} words
                  </div>
                </>
              )}

              {/* PITCH TAB: LOGLINE + BLURB */}
              {activeTab === "pitch" && (
                <>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 18,
                      color: theme.text,
                    }}
                  >
                    Logline & Back Cover Copy
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    Use a short logline to pitch the core hook in one sentence,
                    and back cover copy to tease the story for readers or
                    agents.
                  </p>

                  {/* Logline */}
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: theme.text,
                    }}
                  >
                    Logline
                  </label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: theme.subtext,
                      }}
                    >
                      1–2 sentences that capture the main character, goal, and
                      stakes.
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateLogline}
                      disabled={isGeneratingLogline || !synopsis.trim()}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: isGeneratingLogline ? "default" : "pointer",
                        background:
                          "linear-gradient(135deg, #0ea5e9, #22d3ee)",
                        color: "#0f172a",
                      }}
                    >
                      {isGeneratingLogline ? "AI..." : "AI: Logline from synopsis"}
                    </button>
                  </div>
                  <textarea
                    value={logline}
                    onChange={(e) => setLogline(e.target.value)}
                    placeholder="When ________, a ________ must ________ or else ________."
                    style={{
                      width: "100%",
                      minHeight: 70,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "8px 10px",
                      fontSize: 13,
                      resize: "vertical",
                      fontFamily: "inherit",
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 12,
                      color: theme.subtext,
                      textAlign: "right",
                    }}
                  >
                    {loglineWords} words
                  </div>

                  <hr
                    style={{
                      margin: "16px 0",
                      border: "none",
                      borderTop: `1px solid ${theme.border}`,
                      opacity: 0.7,
                    }}
                  />

                  {/* Back Cover */}
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: theme.text,
                    }}
                  >
                    Back Cover / Book Blurb
                  </label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: theme.subtext,
                      }}
                    >
                      The teaser readers will see on the back of the book or
                      online listing.
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerateBackCover}
                      disabled={isGeneratingBackCover || !synopsis.trim()}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: isGeneratingBackCover ? "default" : "pointer",
                        background:
                          "linear-gradient(135deg, #f97316, #fb923c)",
                        color: "#0f172a",
                      }}
                    >
                      {isGeneratingBackCover ? "AI..." : "AI: Blurb from synopsis"}
                    </button>
                  </div>
                  <textarea
                    value={backCover}
                    onChange={(e) => setBackCover(e.target.value)}
                    placeholder="Back cover copy goes here..."
                    style={{
                      width: "100%",
                      minHeight: 140,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "10px 12px",
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: theme.subtext,
                      textAlign: "right",
                    }}
                  >
                    {backCoverWords} words
                  </div>
                </>
              )}

              {/* MARKETING TAB */}
              {activeTab === "marketing" && (
                <>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 18,
                      color: theme.text,
                    }}
                  >
                    Marketing & Launch Plan
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    Sketch out your marketing notes and launch plan. Think about
                    audience, channels, timing, and partnerships.
                  </p>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: theme.text,
                    }}
                  >
                    Notes / Talking Points
                  </label>
                  <textarea
                    value={marketingNotes}
                    onChange={(e) => setMarketingNotes(e.target.value)}
                    placeholder="Who is your reader? Where will you reach them?"
                    style={{
                      width: "100%",
                      minHeight: 140,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "10px 12px",
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "inherit",
                      marginBottom: 16,
                    }}
                  />

                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                      color: theme.text,
                    }}
                  >
                    Launch Plan
                  </label>
                  <textarea
                    value={launchPlan}
                    onChange={(e) => setLaunchPlan(e.target.value)}
                    placeholder="Outline your pre-launch, launch week, and post-launch steps..."
                    style={{
                      width: "100%",
                      minHeight: 160,
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
                      padding: "10px 12px",
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </>
              )}

              {/* CHECKLIST TAB */}
              {activeTab === "checklist" && (
                <>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: 18,
                      color: theme.text,
                    }}
                  >
                    Pre-Publishing Checklist
                  </h3>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    Track your pre-launch tasks. Mark items complete as you go.
                  </p>
                  <ul
                    style={{
                      listStyle: "none",
                      margin: 0,
                      padding: 0,
                    }}
                  >
                    {DEFAULT_CHECKLIST.map((item) => {
                      const checked = !!checklistState[item.id];
                      return (
                        <li
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "8px 0",
                            borderBottom: `1px solid rgba(148,163,184,0.25)`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(item.id)}
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: "999px",
                              border: checked
                                ? "none"
                                : `1px solid ${theme.border}`,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: checked
                                ? "linear-gradient(135deg, #22c55e, #4ade80)"
                                : theme.white,
                              cursor: "pointer",
                            }}
                          >
                            {checked && <Check size={14} color="#fff" />}
                          </button>
                          <span
                            style={{
                              fontSize: 14,
                              color: theme.text,
                            }}
                          >
                            {item.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>

            {/* Right column: summary / context */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Project Summary Card */}
              <div style={styles.glassCard}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: 15,
                    color: theme.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <FileText size={16} />
                  Project Summary
                </h4>
                {activeProject ? (
                  <div
                    style={{
                      fontSize: 13,
                      color: theme.subtext,
                      lineHeight: 1.6,
                    }}
                  >
                    <div>
                      <strong>Title:</strong>{" "}
                      {activeProject.title || "Untitled Project"}
                    </div>
                    <div>
                      <strong>Author:</strong> {authorName}
                    </div>
                    <div>
                      <strong>Status:</strong>{" "}
                      {activeProject.status || "Draft"}
                    </div>
                    {typeof activeProject.wordCount === "number" && (
                      <div>
                        <strong>Words:</strong>{" "}
                        {activeProject.wordCount.toLocaleString()}
                      </div>
                    )}
                    {activeProject.chapterCount && (
                      <div>
                        <strong>Chapters:</strong> {activeProject.chapterCount}
                      </div>
                    )}
                    {activeProject.targetWords && (
                      <div>
                        <strong>Target:</strong>{" "}
                        {activeProject.targetWords.toLocaleString()}
                      </div>
                    )}
                    {activeProject.lastModified && (
                      <div>
                        <strong>Last edit:</strong>{" "}
                        {formatDate(activeProject.lastModified)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 13,
                      color: "#ef4444",
                      padding: "12px",
                      background: "#fef2f2",
                      borderRadius: 8,
                    }}
                  >
                    <strong>⚠️ No project selected</strong>
                    <p style={{ margin: "8px 0 0" }}>
                      Go back to the Dashboard or Projects page and select a
                      manuscript to work on.
                    </p>
                  </div>
                )}
              </div>

              {/* Pro Tips */}
              <div style={{ ...styles.glassCard, background: theme.highlight }}>
                <h4
                  style={{
                    margin: "0 0 10px 0",
                    fontSize: 15,
                    color: theme.text,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Feather size={16} />
                  Pro Tips
                </h4>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 13,
                    color: theme.text,
                    lineHeight: 1.7,
                  }}
                >
                  <li>
                    Keep your synopsis clear and focused; avoid subplots
                    unless essential.
                  </li>
                  <li>
                    Tailor query letters to each agent or publisher whenever
                    possible.
                  </li>
                  <li>
                    Make sure your checklist is fully complete before
                    hitting publish.
                  </li>
                  <li>
                    Start building buzz for your book several weeks before
                    launch.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save toast */}
      {showSaved && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px",
            borderRadius: 999,
            background:
              "linear-gradient(135deg, #22c55e, #4ade80)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 8px 24px rgba(22,163,74,0.4)",
            zIndex: 1000,
          }}
        >
          <Check size={16} />
          Publishing prep saved for "{activeProject?.title || 'project'}"
        </div>
      )}
    </PageShell>
  );
}
