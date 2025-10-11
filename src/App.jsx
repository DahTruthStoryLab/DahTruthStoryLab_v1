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

// ---------------------------
// DnD Multi-backend (desktop + mobile)
import { DndProvider } from "react-dnd";
import { MultiBackend, HTML5toTouch } from "dnd-multi-backend";

import { UserProvider } from "./lib/userStore.jsx";

/* =========================
   Lazy-loaded pages
   ========================= */
const LandingPage          = lazy(() => import("./components/LandingPage"));
const RegistrationPage     = lazy(() => import("./components/RegistrationPage"));
const SignInPage           = lazy(() => import("./components/SignInPage"));
const Dashboard            = lazy(() => import("./components/Dashboard"));
const TOCPage              = lazy(() => import("./components/TOCPage"));
const TOCPage2             = lazy(() => import("./components/TOCPage2"));
const ProjectPage          = lazy(() => import("./components/ProjectPage"));
const WhoAmI               = lazy(() => import("./components/WhoAmI"));
const ComposePage          = lazy(() => import("./components/ComposePage"));
const Calendar             = lazy(() => import("./components/Calendar"));
const StoryLabLanding      = lazy(() => import("./lib/storylab/StoryLabLanding"));
const StoryPromptsWorkshop = lazy(() => import("./lib/storylab/StoryPromptsWorkshop"));
const StoryWorkshop        = lazy(() => import("./components/storylab/StoryWorkshop"));
const PriorityCards        = lazy(() => import("./components/storylab/PriorityCards"));
const CharacterRoadmap     = lazy(() => import("./components/storylab/CharacterRoadmap"));
const Clothesline          = lazy(() => import("./components/storylab/Clothesline"));
const HopesFearsLegacy     = lazy(() => import("./components/storylab/HopesFearsLegacy"));
const WorkshopCohort       = lazy(() => import("./components/storylab/WorkshopCohort.jsx"));
const Publishing           = lazy(() => import("./pages/Publishing.tsx"));
const Profile              = lazy(() => import("./components/Profile"));
const PlansPage            = lazy(() => import("./components/PlansPage"));
const BillingSuccess       = lazy(() => import("./pages/BillingSuccess.jsx"));
const AiTools              = lazy(() => import("./pages/AiTools")); // if present

/* =========================
   Global UI helpers
   ========================= */
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

/* =========================
   Auth gate (toggleable)
   ========================= */
const BYPASS_AUTH = true;
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
  const chosen = paramV || stored || "2";
  if (chosen !== stored) localStorage.setItem(key, chosen);
  return chosen === "1" ? <TOCPage /> : <TOCPage2 />;
}

/* =========================
   App
   ========================= */
export default function App() {
  return (
    <UserProvider>
      {/* ✅ Provide DnD at the app root once, using multi-backend for mouse + touch */}
      <DndProvider backend={MultiBackend} options={HTML5toTouch}>
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

              {/* Writer/Writing (route all to ComposePage) */}
              <Route
                path="/writer"
                element={
                  <ProtectedRoute>
                    <ComposePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/write"
                element={
                  <ProtectedRoute>
                    <ComposePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/writing"
                element={
                  <ProtectedRoute>
                    <ComposePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compose"
                element={
                  <ProtectedRoute>
                    <ComposePage />
                  </ProtectedRoute>
                }
              />

              {/* StoryLab */}
              <Route
                path="/story-lab"
                element={
                  <ProtectedRoute>
                    <StoryLabLanding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/story-lab/prompts"
                element={
                  <ProtectedRoute>
                    <StoryPromptsWorkshop />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/story-lab/community"
                element={
                  <ProtectedRoute>
                    <WorkshopCohort />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/story-lab/workshop"
                element={
                  <ProtectedRoute>
                    <StoryWorkshop />
                  </ProtectedRoute>
                }
              />
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

              {/* Table of Contents */}
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

              {/* Publishing */}
              <Route
                path="/publishing"
                element={
                  <ProtectedRoute>
                    <Publishing />
                  </ProtectedRoute>
                }
              />
              <Route path="/publish" element={<Navigate to="/publishing" replace />} />
              <Route path="/publishing-suite" element={<Navigate to="/publishing" replace />} />
              <Route path="/storylab/publishing" element={<Navigate to="/publishing" replace />} />
              <Route path="/publish/*" element={<Navigate to="/publishing" replace />} />
              <Route path="/publishing-suite/*" element={<Navigate to="/publishing" replace />} />

              {/* Shared AI tools page (optional) */}
              <Route
                path="/ai-tools"
                element={
                  <ProtectedRoute>
                    <AiTools />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </DndProvider>
    </UserProvider>
  );
}
