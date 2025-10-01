// src/App.jsx
import React, { Suspense, lazy, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useSearchParams,
  useLocation,
  Navigate,
} from "react-router-dom";

// ✅ Keep this direct import (not lazy)
import Profile from "./components/Profile.jsx";

/* =========================
   Lazy-loaded pages (faster)
   ========================= */
const LandingPage          = lazy(() => import("./components/LandingPage"));
const RegistrationPage     = lazy(() => import("./components/RegistrationPage"));
const SignInPage           = lazy(() => import("./components/SignInPage"));
const Dashboard            = lazy(() => import("./components/Dashboard"));
const TOCPage              = lazy(() => import("./components/TOCPage"));
const TOCPage2             = lazy(() => import("./components/TOCPage2"));
const ProjectPage          = lazy(() => import("./components/ProjectPage"));
const WhoAmI               = lazy(() => import("./components/WhoAmI"));
const WriteSection         = lazy(() => import("./components/WriteSection"));
const Calendar             = lazy(() => import("./components/Calendar"));

// StoryLab (overview) + Prompts (workshop prompts page)
const StoryLab             = lazy(() => import("./lib/storylab/StoryLab"));
const StoryPromptsWorkshop = lazy(() => import("./lib/storylab/StoryPromptsWorkshop"));

// NEW: Workshop hub + modules (under /components/storylab)
const StoryWorkshop        = lazy(() => import("./components/storylab/StoryWorkshop"));
const PriorityCards        = lazy(() => import("./components/storylab/PriorityCards"));
const CharacterRoadmap     = lazy(() => import("./components/storylab/CharacterRoadmap"));
const Clothesline          = lazy(() => import("./components/storylab/Clothesline"));
const HopesFearsLegacy     = lazy(() => import("./components/storylab/HopesFearsLegacy"));

// NEW: Workshop Community hub (all-in-one)
const WorkshopCohort = lazy(() => import("./components/storylab/WorkshopCohort"));

/* =========================
   Global UI helpers
   ========================= */
// Minimal loading UI for lazy routes
const Fallback = () => (
  <div className="min-h-[60vh] grid place-items-center text-slate-200">
    <div className="text-center">
      <div className="animate-pulse text-lg">Loading…</div>
      <p className="text-slate-400 mt-1">Please wait a moment.</p>
    </div>
  </div>
);

// Simple placeholder page
const Placeholder = ({ title = "Coming soon" }) => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-200">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      <p className="text-slate-400">This page hasn't been built yet.</p>
    </div>
  </div>
);

// Auto-scroll to top on route change
function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, search, hash]);
  return null;
}

/* =========================
   Auth gate (toggleable)
   ========================= */
// Set to true while Auth is WIP; set to false when ready to enforce auth.
const BYPASS_AUTH = true;

// Very light "session" check that you can swap later for real auth.
// If BYPASS_AUTH is false, we check a localStorage key.
function ProtectedRoute({ children }) {
  if (BYPASS_AUTH) return children;
  const user = localStorage.getItem("dt_auth_user");
  return user ? children : <Navigate to="/signin" replace />;
}

/* =========================
   TOC version selector
   ========================= */
function TableOfContentsRouter() {
  const [params] = useSearchParams();
  const paramV = params.get("v");
  const key = "tocVersion";
  const stored = localStorage.getItem(key);

  // Decide version (URL param wins, then stored, default "2")
  const chosen = paramV || stored || "2";
  if (chosen !== stored) localStorage.setItem(key, chosen);

  return chosen === "1" ? <TOCPage /> : <TOCPage2 />;
}

/* =========================
   App
   ========================= */
export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/auth/register" element={<RegistrationPage />} />

          {/* Protected */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

          {/* Writer */}
            <Route
              path="/writer"
              element={
                <ProtectedRoute>
                  <WriteSection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/write"
              element={
                <ProtectedRoute>
                  <WriteSection />
                </ProtectedRoute>
              }
            />

          {/* StoryLab (overview) */}
            <Route
              path="/story-lab"
              element={
                <ProtectedRoute>
                  <StoryLab />
                </ProtectedRoute>
              }
            />

          {/* Story Prompts (workshop prompts page) */}
            <Route
              path="/story-lab/prompts"
              element={
                <ProtectedRoute>
                  <StoryPromptsWorkshop />
                </ProtectedRoute>
              }
            />

          {/* Workshop hub (tabs/cards) */}
            <Route
              path="/story-lab/workshop"
              element={
                <ProtectedRoute>
                  <StoryWorkshop />
                </ProtectedRoute>
              }
            />

          {/* Workshop modules (direct routes) */}
            <Route
              path="/story-lab/workshop/priorities"
              element={
                <ProtectedRoute>
                  <PriorityCards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/story-lab/workshop/roadmap"
              element={
                <ProtectedRoute>
                  <CharacterRoadmap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/story-lab/workshop/clothesline"
              element={
                <ProtectedRoute>
                  <Clothesline />
                </ProtectedRoute>
              }
            />
            <Route
              path="/story-lab/workshop/hfl"
              element={
                <ProtectedRoute>
                  <HopesFearsLegacy />
                </ProtectedRoute>
              }
            />

          {/* Table of Contents (selector + direct) */}
            <Route
              path="/toc"
              element={
                <ProtectedRoute>
                  <TableOfContentsRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/toc/v1"
              element={
                <ProtectedRoute>
                  <TOCPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/toc/v2"
              element={
                <ProtectedRoute>
                  <TOCPage2 />
                </ProtectedRoute>
              }
            />

          {/* Project */}
            <Route
              path="/project"
              element={
                <ProtectedRoute>
                  <ProjectPage />
                </ProtectedRoute>
              }
            />

          {/* Calendar */}
            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />

          {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

          {/* Misc */}
            <Route path="/whoami" element={<WhoAmI />} />
            <Route
              path="/publishing"
              element={
                <ProtectedRoute>
                  <Placeholder title="Publishing" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/store"
              element={
                <ProtectedRoute>
                  <Placeholder title="Store" />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <Placeholder title="About" />
                </ProtectedRoute>
              }
            />
{/* Workshop Community (Schedule + Breakouts + Critique) */}
          <Route
            path="/story-lab/community"
            element={
              <ProtectedRoute>
                <WorkshopCohort />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback */}
            <Route path="*" element={<Placeholder title="Not Found" />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
