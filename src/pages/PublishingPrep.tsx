// src/pages/PublishingPrep.tsx
import React, { useEffect, useMemo, useState } from "react";
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

  // Core app state
  const [profile, setProfile] = useState<any | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentStory, setCurrentStory] = useState<any | null>(null);

  const [activeTab, setActiveTab] = useState<
    "synopsis" | "query" | "checklist" | "marketing"
  >("synopsis");

  // Use routed-in generated synopsis if we came from Story Materials
  const [synopsis, setSynopsis] = useState<string>(
    isSynopsisMaterial && initialGenerated ? initialGenerated : ""
  );
  const [queryLetter, setQueryLetter] = useState<string>("");
  const [backCover, setBackCover] = useState<string>("");

  const [checklistState, setChecklistState] =
    useState<PublishingChecklist>({});
  const [marketingNotes, setMarketingNotes] = useState<string>("");
  const [launchPlan, setLaunchPlan] = useState<string>("");

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

    // If we arrived with a freshly generated synopsis, prefer that once
    if (cameFromStoryMaterials && isSynopsisMaterial && initialGenerated) {
      setSynopsis(initialGenerated);
    } else {
      setSynopsis(activeProject.synopsis || "");
    }

    setQueryLetter(activeProject.queryLetter || "");
    setBackCover(activeProject.backCover || "");

    const storedChecklist = activeProject.publishingChecklist || {};
    const baseState: PublishingChecklist = {};
    DEFAULT_CHECKLIST.forEach((item) => {
      baseState[item.id] =
        storedChecklist[item.id] === true ||
        storedChecklist[item.id] === false
          ? storedChecklist[item.id]
          : false;
    });
    setChecklistState(baseState);

    setMarketingNotes(activeProject.marketingNotes || "");
    setLaunchPlan(activeProject.launchPlan || "");
  }, [
    activeProject,
    cameFromStoryMaterials,
    isSynopsisMaterial,
    initialGenerated,
  ]);

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

  const synopsisWords = getWordCount(synopsis);
  const queryWords = getWordCount(queryLetter);

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
              }}
            >
              ← Back to Publishing
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
                      <span style={{ fontWeight: 500 }}>
                        {activeProject.title || "Untitled Project"}
                      </span>{" "}
                      by {authorName}
                    </>
                  ) : (
                    "No active project selected"
                  )}
                </div>
              </div>
            </div>

            <div style={{ width: 150, textAlign: "right", fontSize: 12 }}>
              {activeProject?.lastModified && (
                <span>
                  Last updated: {formatDate(activeProject.lastModified)}
                </span>
              )}
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
                disabled={isSaving || !activeProject}
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
                  cursor: isSaving ? "default" : "pointer",
                  opacity: isSaving ? 0.8 : 1,
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
                  <textarea
                    value={queryLetter}
                    onChange={(e) => setQueryLetter(e.target.value)}
                    placeholder="Dear Agent..."
                    style={{
                      width: "100%",
                      minHeight: 260,
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
                    Track your pre-launch tasks. Mark items complete as you
                    go.
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
                            onClick={() =>
                              handleToggleChecklist(item.id)
                            }
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
                            {checked && (
                              <Check size={14} color="#fff" />
                            )}
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
                  <p
                    style={{
                      fontSize: 13,
                      color: theme.subtext,
                    }}
                  >
                    No active project found. Go back to the Projects page and
                    select a manuscript.
                  </p>
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
          className="fixed bottom-8 right-8"
          style={{
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
          }}
        >
          <Check size={16} />
          Publishing prep saved
        </div>
      )}
    </PageShell>
  );
}
