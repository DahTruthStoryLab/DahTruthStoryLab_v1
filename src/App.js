// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, useSearchParams, useLocation, Navigate } from "react-router-dom";

/* ===== Direct imports to keep it simple/reliable ===== */
import LandingPage          from "./components/LandingPage";
import RegistrationPage     from "./components/RegistrationPage";
import SignInPage           from "./components/SignInPage";
import Dashboard            from "./components/Dashboard";
import TOCPage              from "./components/TOCPage";
import TOCPage2             from "./components/TOCPage2";
import ProjectPage          from "./components/ProjectPage";
import WhoAmI               from "./components/WhoAmI";
import WriteSection         from "./components/WriteSection";
import StoryLab             from "./lib/storylab/StoryLab";
import StoryPromptsWorkshop from "./lib/storylab/StoryPromptsWorkshop";
import Calendar             from "./components/Calendar";
import Profile              from "./components/Profile";

/* ===== Small helpers ===== */
const Placeholder = ({ title = "Coming soon" }) => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-200">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      <p className="text-slate-400">This page hasn't been built yet.</p>
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

/* ===== Auth gate (toggle on/off) ===== */
const BYPASS_AUTH = true; // set to false when you want to enforce auth

function ProtectedRoute({ children }) {
  if (BYPASS_AUTH) return children;
  const user = localStorage.getItem("dt_auth_user");
  return user ? children : <Navigate to="/signin" replace />;
}

/* ===== TOC version picker ===== */
function TableOfContentsRouter() {
  const [params] = useSearchParams();
  const paramV = params.get("v");
  const key = "tocVersion";
  const stored = localStorage.getItem(key);
  const chosen = paramV || stored || "2";
  if (chosen !== stored) localStorage.setItem(key, chosen);
  return chosen === "1" ? <TOCPage /> : <TOCPage2 />;
}

/* ===== App ===== */
export default function App() {
  useEffect(() => {
    console.log("[App] mounted");
  }, []);

  return (
    <>
      <ScrollToTop />
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

        {/* Story Lab */}
        <Route
          path="/story-lab"
          element={
            <ProtectedRoute>
              <StoryLab />
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

        {/* TOC */}
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

        {/* Health check */}
        <Route path="/__health" element={<div style={{ padding: 24 }}>OK</div>} />

        {/* Fallback */}
        <Route path="*" element={<Placeholder title="Not Found" />} />
      </Routes>
    </>
  );
}
