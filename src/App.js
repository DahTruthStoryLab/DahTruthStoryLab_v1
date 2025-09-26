/// src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
  useLocation,
  useInRouterContext,
  Navigate,
} from "react-router-dom";

/* ===== Direct imports ===== */
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

/* ===== Error boundary so we don’t get a blank screen ===== */
class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err){ return { err }; }
  componentDidCatch(err, info){ console.error("[App ErrorBoundary]", err, info); }
  render(){
    if (this.state.err) {
      return (
        <div style={{ padding: 24, minHeight: "100vh", background: "#0b1220", color: "#fff" }}>
          <h1 style={{ fontSize: 20, marginBottom: 12 }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", background: "#111827", padding: 16, borderRadius: 8 }}>
            {String(this.state.err?.message || this.state.err)}
          </pre>
          <p style={{ opacity: .8, marginTop: 8 }}>Check the console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ===== Helpers ===== */
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

/* Probe to confirm Router context exists */
function RouterProbe() {
  const has = useInRouterContext();
  useEffect(() => {
    console.log("[RouterProbe] Router mounted:", has);
  }, [has]);
  return null;
}

/* ===== Auth gate (toggle on/off) ===== */
const BYPASS_AUTH = true;
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
  useEffect(() => console.log("[App] mounted"), []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <RouterProbe />
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/auth/register" element={<RegistrationPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/writer"    element={<ProtectedRoute><WriteSection /></ProtectedRoute>} />
          <Route path="/write"     element={<ProtectedRoute><WriteSection /></ProtectedRoute>} />

          {/* Story Lab */}
          <Route path="/story-lab"          element={<ProtectedRoute><StoryLab /></ProtectedRoute>} />
          <Route path="/story-lab/prompts"  element={<ProtectedRoute><StoryPromptsWorkshop /></ProtectedRoute>} />

          {/* TOC */}
          <Route path="/toc"    element={<ProtectedRoute><TableOfContentsRouter /></ProtectedRoute>} />
          <Route path="/toc/v1" element={<ProtectedRoute><TOCPage /></ProtectedRoute>} />
          <Route path="/toc/v2" element={<ProtectedRoute><TOCPage2 /></ProtectedRoute>} />

          {/* Project */}
          <Route path="/project"  element={<ProtectedRoute><ProjectPage /></ProtectedRoute>} />

          {/* Calendar */}
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />

          {/* Profile */}
          <Route path="/profile"  element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Misc */}
          <Route path="/whoami"     element={<WhoAmI />} />
          <Route path="/publishing" element={<ProtectedRoute><Placeholder title="Publishing" /></ProtectedRoute>} />
          <Route path="/store"      element={<ProtectedRoute><Placeholder title="Store" /></ProtectedRoute>} />
          <Route path="/about"      element={<ProtectedRoute><Placeholder title="About" /></ProtectedRoute>} />

          {/* Health check */}
          <Route path="/__health" element={<div style={{ padding: 24 }}>OK</div>} />

          {/* Fallback */}
          <Route path="*" element={<Placeholder title="Not Found" />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
