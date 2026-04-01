// src/App.jsx
import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";

import { Amplify } from "aws-amplify";
import awsconfig from "./aws-exports";
Amplify.configure(awsconfig);

import { DndProvider } from "react-dnd";
import { MultiBackend, TouchTransition, MouseTransition } from "dnd-multi-backend";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";

import { UserProvider } from "./lib/userStore.jsx";
import "./lib/api";

const BACKENDS = {
  backends: [
    { id: "html5", backend: HTML5Backend, transition: MouseTransition },
    {
      id: "touch",
      backend: TouchBackend,
      options: { enableMouseEvents: true, delayTouchStart: 0, ignoreContextMenu: true },
      transition: TouchTransition,
    },
  ],
};

// =========================
// Lazy-loaded pages
// =========================
const LandingPage        = lazy(() => import("./components/LandingPage"));
const RegistrationPage   = lazy(() => import("./components/RegistrationPage"));
const SignInPage          = lazy(() => import("./components/SignInPage"));

// Global layout (sidebar)
const AppLayout          = lazy(() => import("./components/AppLayout"));

// Protected pages
const Dashboard          = lazy(() => import("./components/Dashboard"));
const ProjectPage        = lazy(() => import("./components/ProjectPage"));
const WhoAmI             = lazy(() => import("./components/WhoAmI"));
const ComposePage        = lazy(() => import("./components/ComposePage"));
const Calendar           = lazy(() => import("./components/Calendar"));

// Story Lab routes
const FictionRoutes      = lazy(() => import("./routes/storylab/FictionRoutes.jsx"));
const NonfictionRoutes   = lazy(() => import("./routes/storylab/NonfictionRoutes.jsx"));
const PoetryRoutes       = lazy(() => import("./routes/storylab/PoetryRoutes.jsx"));

// StoryLab shared
const StoryLabLanding       = lazy(() => import("./lib/storylab/StoryLabLanding"));
const StoryPromptsWorkshop  = lazy(() => import("./lib/storylab/StoryPromptsWorkshop"));
const PriorityCards         = lazy(() => import("./components/storylab/PriorityCards"));
const CharacterRoadmap      = lazy(() => import("./components/storylab/CharacterRoadmap"));
const Clothesline           = lazy(() => import("./components/storylab/Clothesline"));
const HopesFearsLegacy      = lazy(() => import("./components/storylab/HopesFearsLegacy"));
const WorkshopCohort        = lazy(() => import("./components/storylab/WorkshopCohort.jsx"));
const StoryLabLayout        = lazy(() => import("./components/storylab/StoryLabLayout.jsx"));
const NarrativeArc          = lazy(() => import("./components/storylab/NarrativeArc.jsx"));
const WorkshopHub           = lazy(() => import("./components/storylab/WorkshopHub.jsx"));
const PlotBuilder           = lazy(() => import("./components/storylab/PlotBuilder"));
const DialogueLab           = lazy(() => import("./components/storylab/DialogueLab"));

// Publishing
const Publishing     = lazy(() => import("./pages/Publishing.tsx"));
const Proof          = lazy(() => import("./pages/Proof.tsx"));
const Format         = lazy(() => import("./pages/Format.tsx"));
const Export         = lazy(() => import("./pages/Export.tsx"));
const PublishingPrep = lazy(() => import("./pages/PublishingPrep.tsx"));
const Cover          = lazy(() => import("./pages/Cover.tsx"));

// Author Studio
const AuthorPage = lazy(() => import("./pages/AuthorPage.jsx"));
const BookPage   = lazy(() => import("./pages/BookPage.jsx"));

// Other
const Profile        = lazy(() => import("./components/Profile"));
const PlansPage      = lazy(() => import("./components/PlansPage"));
const BillingSuccess = lazy(() => import("./pages/BillingSuccess.jsx"));
const AiTools        = lazy(() => import("./pages/AiTools"));
const AboutPage      = lazy(() => import("./components/AboutPage.jsx"));

// =========================
// Error Boundary
// =========================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("🔴 App crashed:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#fff0f0", minHeight: "100vh" }}>
          <h2 style={{ color: "#c00", marginBottom: 16 }}>⚠️ App crashed — real error below:</h2>
          <pre style={{ background: "#fff", border: "1px solid #f99", borderRadius: 8, padding: 16, color: "#900", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ marginTop: 16, background: "#fff", border: "1px solid #ddd", borderRadius: 8, padding: 16, color: "#333", fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error?.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })}
            style={{ marginTop: 16, padding: "8px 20px", background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// =========================
// Helpers
// =========================
const Fallback = () => (
  <div className="min-h-[60vh] grid place-items-center text-[color:var(--color-ink)]">
    <div className="text-center">
      <div className="animate-pulse text-lg">Loading…</div>
      <p className="text-muted mt-1">Please wait a moment.</p>
    </div>
  </div>
);

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, search, hash]);
  return null;
}

const BYPASS_AUTH = true;

function ProtectedRoute({ children }) {
  if (BYPASS_AUTH) return children;
  const user = localStorage.getItem("dt_auth_user");
  return user ? children : <Navigate to="/signin" replace />;
}

// =========================
// App
// =========================
export default function App() {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("VITE_API_BASE =", import.meta.env.VITE_API_BASE);
    }
  }, []);

  return (
    <ErrorBoundary>
      <UserProvider>
        <DndProvider backend={MultiBackend} options={BACKENDS}>
          <Router>
            <ScrollToTop />
            <Suspense fallback={<Fallback />}>
              <ErrorBoundary>
                <Routes>

                  {/* ── Public (no sidebar) ── */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/signin" element={<SignInPage />} />
                  <Route path="/auth/register" element={<RegistrationPage />} />

                  {/* ══════════════════════════════════════
                      PROTECTED — global sidebar via AppLayout
                      AppLayout renders <Outlet /> so all
                      child routes automatically get the sidebar
                  ══════════════════════════════════════ */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <AppLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard */}
                    <Route path="/dashboard" element={<Dashboard />} />

                    {/* ── Writer's Studio ── */}
                    <Route path="/project" element={<ProjectPage />} />
                    <Route path="/toc" element={<ComposePage />} />
                    {["/writer", "/write", "/writing", "/compose"].map((p) => (
                      <Route key={p} path={p} element={<ComposePage />} />
                    ))}

                    {/* ── Story Lab Studio ── */}
                    <Route path="/storylab" element={<Navigate to="/story-lab" replace />} />
                    <Route path="/story-lab/*" element={<StoryLabLayout />}>
                      <Route index element={<StoryLabLanding />} />
                      <Route path="hub" element={<WorkshopHub />} />
                      <Route path="workshop" element={<WorkshopHub />} />
                      <Route path="narrative-arc" element={<NarrativeArc />} />
                      <Route path="community" element={<WorkshopCohort />} />
                      <Route path="plot-builder" element={<PlotBuilder />} />
                      <Route path="dialogue-lab" element={<DialogueLab />} />
                      <Route path="workshop/priorities" element={<PriorityCards />} />
                      <Route path="workshop/roadmap" element={<CharacterRoadmap />} />
                      <Route path="workshop/clothesline" element={<Clothesline />} />
                      <Route path="workshop/hfl" element={<HopesFearsLegacy />} />
                      <Route path="prompts" element={<StoryPromptsWorkshop />} />
                      <Route path="fiction/*" element={<FictionRoutes />} />
                      <Route path="nonfiction/*" element={<NonfictionRoutes />} />
                      <Route path="poetry/*" element={<PoetryRoutes />} />
                    </Route>

                    {/* Calendar lives under Story Lab Studio */}
                    <Route path="/calendar" element={<Calendar />} />

                    {/* ── Author Studio ── */}
                    <Route path="/author" element={<AuthorPage />} />
                    <Route path="/author/book/:bookId" element={<BookPage />} />
                    <Route path="/publishing" element={<Publishing />} />
                    <Route path="/proof" element={<Proof />} />
                    <Route path="/format" element={<Format />} />
                    <Route path="/export" element={<Export />} />
                    <Route path="/publishing-prep" element={<PublishingPrep />} />
                    <Route path="/cover" element={<Cover />} />
                    <Route path="/profile" element={<Profile />} />

                    {/* ── Other protected ── */}
                    <Route path="/plans" element={<PlansPage />} />
                    <Route path="/billing/success" element={<BillingSuccess />} />
                    <Route path="/ai-tools" element={<AiTools />} />
                    <Route path="/about" element={<AboutPage />} />

                    {/* ── Publishing aliases ── */}
                    <Route path="/publish" element={<Navigate to="/publishing" replace />} />
                    <Route path="/publishing-suite" element={<Navigate to="/publishing" replace />} />
                    <Route path="/publishing/cover" element={<Navigate to="/cover" replace />} />

                    {/* ── Legacy URL redirects ── */}
                    <Route path="/story-lab/publishing" element={<Navigate to="/publishing" replace />} />
                    <Route path="/story-lab/proof" element={<Navigate to="/proof" replace />} />
                    <Route path="/story-lab/format" element={<Navigate to="/format" replace />} />
                    <Route path="/story-lab/export" element={<Navigate to="/export" replace />} />
                    <Route path="/story-lab/publishing-prep" element={<Navigate to="/publishing-prep" replace />} />
                    <Route path="/storylab/publishing" element={<Navigate to="/publishing" replace />} />
                    <Route path="/storylab/format" element={<Navigate to="/format" replace />} />
                    <Route path="/storylab/export" element={<Navigate to="/export" replace />} />
                    <Route path="/storylab/publishing-prep" element={<Navigate to="/publishing-prep" replace />} />
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
              </ErrorBoundary>
            </Suspense>
          </Router>
        </DndProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

