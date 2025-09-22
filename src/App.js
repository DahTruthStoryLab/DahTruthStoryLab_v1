// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";

// ⚠️ Do NOT configure Amplify here (it’s already in src/index.js)

// PAGES (using your current components folder)
import LandingPage from "./components/LandingPage";
import RegistrationPage from "./components/RegistrationPage";
import SignInPage from "./components/SignInPage";
import Dashboard from "./components/Dashboard";
import TOCPage from "./components/TOCPage";
import TOCPage2 from "./components/TOCPage2";
import ProjectPage from "./components/ProjectPage";
import WhoAmI from "./components/WhoAmI";

// ✅ Writer is in /components per your file
import WriteSection from "./components/WriteSection";

// Tiny inline placeholder for pages you’ll build later
const Placeholder = ({ title = "Coming soon" }) => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-200">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      <p className="text-slate-400">This page hasn’t been built yet.</p>
    </div>
  </div>
);

// For now: bypass auth while you wire pages. Later you can enforce Auth here.
function ProtectedRoute({ children }) {
  return children;
}

/** ── Wrapper: single /toc route that can render TOCPage or TOCPage2 ──
 *  Use /toc?v=1 for TOCPage  (classic)
 *  Use /toc?v=2 for TOCPage2 (default)
 *  /toc (no query) will remember your last choice in localStorage.
 */
function TableOfContentsRouter() {
  const [params] = useSearchParams();
  const saved = typeof window !== "undefined" ? localStorage.getItem("tocVersion") : null;
  const chosen = params.get("v") || saved || "2";

  if (typeof window !== "undefined" && chosen !== saved) {
    localStorage.setItem("tocVersion", chosen);
  }

  return chosen === "1" ? <TOCPage /> : <TOCPage2 />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/auth/register" element={<RegistrationPage />} />

        {/* Protected (temporarily open via ProtectedRoute) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Writer – support both /writer and /write just in case */}
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

        {/* Table of Contents (single route + wrapper) */}
        <Route
          path="/toc"
          element={
            <ProtectedRoute>
              <TableOfContentsRouter />
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

        <Route path="/whoami" element={<WhoAmI />} />

        {/* NEW: placeholders you’ll build later */}
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Placeholder title="Calendar" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/story-lab"
          element={
            <ProtectedRoute>
              <Placeholder title="Story Lab" />
            </ProtectedRoute>
          }
        />
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
          path="/profile"
          element={
            <ProtectedRoute>
              <Placeholder title="Profile" />
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

        {/* Fallback */}
        <Route path="*" element={<Placeholder title="Not Found" />} />
      </Routes>
    </Router>
  );
}
