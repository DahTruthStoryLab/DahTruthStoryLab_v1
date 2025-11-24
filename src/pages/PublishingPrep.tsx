// src/pages/PublishingPrep.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";

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
const CURRENT_STORY_KEY = "currentStory";

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
  publishingChecklist?: PublishingChecklist;
  marketingNotes?: string;
  launchPlan?: string;
  lastModified?: string;
}

/* ---------- Helpers ---------- */
function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event("project:change"));
  } catch (err) {
    console.error("Failed to save projects from PublishingPrep:", err);
  }
}

function loadCurrentStory() {
  try {
    const raw = localStorage.getItem(CURRENT_STORY_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
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

  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentStory, setCurrentStory] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<"synopsis" | "query" | "checklist" | "marketing">(
    "synopsis"
  );

  const [synopsis, setSynopsis] = useState("");
  const [queryLetter, setQueryLetter] = useState("");
  const [backCover, setBackCover] = useState("");

  const [checklistState, setChecklistState] = useState<PublishingChecklist>({});
  const [marketingNotes, setMarketingNotes] = useState("");
  const [launchPlan, setLaunchPlan] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Load data on mount + keep in sync
  useEffect(() => {
    setProfile(loadProfile());
    setProjects(loadProjects());
    setCurrentStory(loadCurrentStory());

    const sync = () => {
      setProfile(loadProfile());
      setProjects(loadProjects());
      setCurrentStory(loadCurrentStory());
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

  // Resolve active project from currentStory or fall back to first
  const activeProject: Project | null = useMemo(() => {
    if (!projects || projects.length === 0) return null;
    if (currentStory?.id) {
      const found = projects.find((p) => p.id === currentStory.id);
      if (found) return found;
    }
    return projects[0];
  }, [projects, currentStory]);

  // Initialize fields when active project changes
  useEffect(() => {
    if (!activeProject) {
      setSynopsis("");
      setQueryLetter("");
      setBackCover("");
      setChecklistState({});
      setMarketingNotes("");
      setLaunchPlan("");
      return;
    }

    setSynopsis(activeProject.synopsis || "");
    setQueryLetter(activeProject.queryLetter || "");
    setBackCover(activeProject.backCover || "");

    const storedChecklist = activeProject.publishingChecklist || {};
    const baseState: PublishingChecklist = {};
    DEFAULT_CHECKLIST.forEach((item) => {
      baseState[item.id] =
        storedChecklist[item.id] === true || storedChecklist[item.id] === false
          ? storedChecklist[item.id]
          : false;
    });
    setChecklistState(baseState);

    setMarketingNotes(activeProject.marketingNotes || "");
    setLaunchPlan(activeProject.launchPlan || "");
  }, [activeProject]);

  const authorName =
    activeProject?.author || profile?.displayName || "New Author";

  const handleBackToPublishing = () => {
    navigate("/publishing");
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async () => {
    if (!activeProject) return;
    setIsSaving(true);
    try {
      const updatedProjects = projects.map((p) =>
        p.id === activeProject.id
          ? {
              ...p,
              synopsis: synopsis || "",
              queryLetter: queryLetter || "",
              backCover: backCover || "",
              publishingChecklist: checklistState,
              marketingNotes: marketingNotes || "",
              launchPlan: launchPlan || "",
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

  /* ---------- If no project selected ---------- */
  if (!activeProject) {
    return (
      <PageShell
        style={{
          background: theme.bg,
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            maxWidth: 560,
            margin: "80px auto",
            padding: 32,
            borderRadius: 24,
            background: theme.surface,
            border: `1px solid ${theme.borderStrong}`,
            boxShadow: "0 18px 50px rgba(2,20,40,.12)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, rgba(236,72,153,0.75), rgba(249,168,212,0.75))",
              color: "#fff",
            }}
          >
            <BookOpen size={28} />
          </div>
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: 22,
              fontWeight: 600,
              color: theme.text,
            }}
          >
            No Project Selected
          </h2>
          <p
            style={{
              margin: "0 0 24px 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: theme.subtext,
            }}
          >
            To use Publishing Prep, first create a project and open it in the
            Writer. Then come back here to build your synopsis, query letter,
            checklist, and marketing plan.
          </p>
          <button
            onClick={() => navigate("/project")}
            style={{
              border: "none",
              padding: "10px 20px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              color: "#fff",
              background:
                "linear-gradient(135deg, #9b7bc9, #b897d6)",
              boxShadow: "0 4px 16px rgba(155,123,201,0.45)",
            }}
          >
            Go to Projects
          </button>
        </div>
      </PageShell>
    );
  }

  /* ---------- Main UI ---------- */
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
              "linear-gradient(135deg, rgba(236,72,153,0.65), rgba(249,168,212,0.65))",
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
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* Back button – gold for consistency */}
            <button
              onClick={handleBackToPublishing}
              style={{
                border: "none",
                background:
                  "linear-gradient(135deg, #D4AF37, #f5e6b3)",
                color: "#1f2937",
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 999,
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(180,142,38,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <ArrowLeft size={16} />
              Publishing Suite
            </button>

            {/* Title + Project info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "radial-gradient(circle at 0% 0%, #fef3c7, #b897d6)",
                    color: "#fff",
                  }}
                >
                  <Feather size={18} />
                </div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 600,
                  }}
                >
                  Publishing Preparation
                </h1>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  opacity: 0.9,
                }}
              >
                {activeProject.title || "Untitled Project"}{" "}
                <span style={{ opacity: 0.8 }}>by</span>{" "}
                <strong>{authorName}</strong>
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  opacity: 0.8,
                }}
              >
                Last updated: {formatDate(activeProject.lastModified)}
              </p>
            </div>

            {/* Manuscript stats */}
            <div style={{ width: 160, textAlign: "right" }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 0.08,
                  opacity: 0.8,
                }}
              >
                Manuscript
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {(activeProject.wordCount || 0).toLocaleString()} words
              </div>
              <div
                style={{
                  fontSize: 11,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                Target:{" "}
                {(activeProject.targetWords || 50000).toLocaleString()} words
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              maxWidth: 1120,
              margin: "16px auto 0",
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {[
              { id: "synopsis", label: "Synopsis" },
              { id: "query", label: "Query Letter" },
              { id: "checklist", label: "Checklist" },
              { id: "marketing", label: "Marketing Kit" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() =>
                    setActiveTab(tab.id as typeof activeTab)
                  }
                  style={{
                    borderRadius: 999,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.12,
                    cursor: "pointer",
                    border: isActive
                      ? "1px solid transparent"
                      : "1px solid rgba(255,255,255,0.7)",
                    background: isActive
                      ? "rgba(15,23,42,0.18)"
                      : "rgba(255,255,255,0.16)",
                    color: "#fff",
                    boxShadow: isActive
                      ? "0 4px 14px rgba(15,23,42,0.35)"
                      : "none",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ ...styles.inner, ...styles.sectionShell }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
              gap: 20,
            }}
          >
            {/* Main Column */}
            <div
              style={{
                ...styles.glassCard,
                padding: 24,
              }}
            >
              {/* Synopsis Tab */}
              {activeTab === "synopsis" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(155,123,201,0.08)",
                        }}
                      >
                        <FileText size={18} color="#7c3aed" />
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 600,
                            color: theme.text,
                          }}
                        >
                          Synopsis
                        </h3>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: 12,
                            color: theme.subtext,
                          }}
                        >
                          1–3 paragraphs that cover the beginning, middle, and ending of your story.
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.12,
                          color: theme.subtext,
                        }}
                      >
                        Word Count
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        {getWordCount(synopsis).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={synopsis}
                    onChange={(e) => setSynopsis(e.target.value)}
                    placeholder="Summarize your story from beginning to end, including the ending. Focus on your main character, core conflict, and resolution."
                    style={{
                      width: "100%",
                      minHeight: 260,
                      borderRadius: 14,
                      padding: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                      border: `1px solid ${theme.border}`,
                      background: "rgba(248,250,252,0.9)",
                      color: theme.text,
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </>
              )}

              {/* Query Letter Tab */}
              {activeTab === "query" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(155,123,201,0.08)",
                        }}
                      >
                        <Feather size={18} color="#7c3aed" />
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                            fontWeight: 600,
                            color: theme.text,
                          }}
                        >
                          Query Letter
                        </h3>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: 12,
                            color: theme.subtext,
                          }}
                        >
                          Hook, short story pitch, book details, and a brief author bio for agents or publishers.
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 0.12,
                          color: theme.subtext,
                        }}
                      >
                        Word Count
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        {getWordCount(queryLetter).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={queryLetter}
                    onChange={(e) => setQueryLetter(e.target.value)}
                    placeholder="Draft your query letter here. Lead with a strong hook, follow with a brief pitch and details (title, genre, word count), and close with a concise author bio."
                    style={{
                      width: "100%",
                      minHeight: 260,
                      borderRadius: 14,
                      padding: 12,
                      fontSize: 14,
                      lineHeight: 1.6,
                      border: `1px solid ${theme.border}`,
                      background: "rgba(248,250,252,0.9)",
                      color: theme.text,
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </>
              )}

              {/* Checklist Tab */}
              {activeTab === "checklist" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(251,191,36,0.1)",
                      }}
                    >
                      <ClipboardList size={18} color="#b45309" />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        Publishing Checklist
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: 12,
                          color: theme.subtext,
                        }}
                      >
                        Track your progress from finished draft to query-ready manuscript.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {DEFAULT_CHECKLIST.map((item) => {
                      const checked = checklistState[item.id] || false;
                      return (
                        <label
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 10,
                            padding: 10,
                            borderRadius: 12,
                            border: `1px solid ${theme.border}`,
                            cursor: "pointer",
                            background: checked
                              ? "rgba(155,123,201,0.04)"
                              : "rgba(248,250,252,0.8)",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(item.id)}
                            style={{
                              marginTop: 2,
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              border: checked
                                ? "1px solid transparent"
                                : `1px solid ${theme.borderStrong}`,
                              background: checked
                                ? "linear-gradient(135deg, #9b7bc9, #b897d6)"
                                : "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: checked
                                ? "0 2px 8px rgba(155,123,201,0.45)"
                                : "none",
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
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Marketing Tab */}
              {activeTab === "marketing" && (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(56,189,248,0.1)",
                      }}
                    >
                      <Megaphone size={18} color="#0284c7" />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 600,
                          color: theme.text,
                        }}
                      >
                        Marketing Kit
                      </h3>
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: 12,
                          color: theme.subtext,
                        }}
                      >
                        Capture key talking points and a simple launch plan for your book.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.12,
                          color: theme.subtext,
                        }}
                      >
                        Talking Points / Positioning
                      </label>
                      <textarea
                        value={marketingNotes}
                        onChange={(e) => setMarketingNotes(e.target.value)}
                        placeholder="What is this book about? Who is it for? What makes it different? Capture the main beats you want to emphasize when you talk about your story."
                        style={{
                          width: "100%",
                          minHeight: 140,
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          lineHeight: 1.6,
                          border: `1px solid ${theme.border}`,
                          background: "rgba(248,250,252,0.9)",
                          color: theme.text,
                          resize: "vertical",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          marginBottom: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.12,
                          color: theme.subtext,
                        }}
                      >
                        Launch Plan
                      </label>
                      <textarea
                        value={launchPlan}
                        onChange={(e) => setLaunchPlan(e.target.value)}
                        placeholder="Outline a simple launch plan: preorders (if any), social posts, email newsletter, book clubs, events, and any partnerships or early reviewers."
                        style={{
                          width: "100%",
                          minHeight: 140,
                          borderRadius: 14,
                          padding: 12,
                          fontSize: 14,
                          lineHeight: 1.6,
                          border: `1px solid ${theme.border}`,
                          background: "rgba(248,250,252,0.9)",
                          color: theme.text,
                          resize: "vertical",
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Save actions */}
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={handleBackToPublishing}
                  style={{
                    borderRadius: 12,
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    border: `1px solid ${theme.border}`,
                    background: "rgba(255,255,255,0.9)",
                    color: theme.text,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  style={{
                    borderRadius: 12,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    border: "none",
                    background:
                      "linear-gradient(135deg, #9b7bc9, #b897d6)",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    opacity: isSaving ? 0.75 : 1,
                  }}
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {isSaving ? "Saving..." : "Save All"}
                </button>
              </div>
            </div>

            {/* Side Column */}
            <div
              style={{
                ...styles.glassCard,
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {/* Project Snapshot */}
              <div>
                <h4
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  Project Snapshot
                </h4>
                <div
                  style={{
                    fontSize: 13,
                    color: theme.subtext,
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Title</span>
                    <span style={{ fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>
                      {activeProject.title || "Untitled Project"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Author</span>
                    <span style={{ fontWeight: 500 }}>{authorName}</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Status</span>
                    <span style={{ fontWeight: 500 }}>
                      {activeProject.status || "Draft"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Words</span>
                    <span style={{ fontWeight: 500 }}>
                      {(activeProject.wordCount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Last Edit</span>
                    <span style={{ fontWeight: 500 }}>
                      {formatDate(activeProject.lastModified)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Workflow Notes */}
              <div>
                <h4
                  style={{
                    margin: "0 0 6px 0",
                    fontSize: 15,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  Workflow Notes
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: theme.subtext,
                    lineHeight: 1.6,
                  }}
                >
                  Start with your synopsis, then refine your query letter. Use the
                  checklist to decide when the manuscript is ready, and keep a
                  simple marketing kit so you never scramble at launch time.
                </p>
              </div>

              {/* Book Cover placeholder */}
              <div
                style={{
                  borderRadius: 12,
                  padding: 12,
                  background: theme.highlight,
                  border: `1px dashed ${theme.border}`,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  Book Cover (Coming Soon)
                </h4>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: theme.subtext,
                    lineHeight: 1.6,
                  }}
                >
                  This is where your cover builder will live: upload a design or
                  generate concepts that match your story and audience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved toast */}
      {showSaved && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            padding: "10px 16px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #10b981, #34d399)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 8px 24px rgba(16,185,129,0.4)",
          }}
        >
          <span>✓</span> Publishing prep saved
        </div>
      )}
    </PageShell>
  );
}
