// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams } from "react-router-dom";

// PAGES
import LandingPage from "./components/LandingPage";
import RegistrationPage from "./components/RegistrationPage";
import SignInPage from "./components/SignInPage";
import Dashboard from "./components/Dashboard";
import TOCPage from "./components/TOCPage";
import TOCPage2 from "./components/TOCPage2";
import ProjectPage from "./components/ProjectPage";
import WhoAmI from "./components/WhoAmI";
import WriteSection from "./components/WriteSection";
import Calendar from "./components/Calendar";

// Simple placeholder
const Placeholder = ({ title = "Coming soon" }) => (
  <div className="min-h-[60vh] flex items-center justify-center text-slate-200">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-1">{title}</h1>
      <p className="text-slate-400">This page hasn’t been built yet.</p>
    </div>
  </div>
);

// (Auth temporarily bypassed)
function ProtectedRoute({ children }) {
  return children;
}

/** Selector for TOC v1/v2. Use /toc?v=1 or /toc?v=2; falls back to last choice in localStorage. */
function TableOfContentsRouter() {
  const [params] = useSearchParams();
  const chosen = params.get("v") || localStorage.getItem("tocVersion") || "2";
  if (chosen !== localStorage.getItem("tocVersion")) {
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

        {/* Table of Contents (selector + direct routes for testing) */}
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

        {/* Misc */}
        <Route path="/whoami" element={<WhoAmI />} />
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
