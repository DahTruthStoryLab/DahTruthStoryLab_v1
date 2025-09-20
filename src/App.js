// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify, Auth } from 'aws-amplify';
import awsconfig from './aws-exports';

import LandingPage from './components/LandingPage';
import RegistrationPage from './components/RegistrationPage';
import SignInPage from './components/SignInPage';
import Dashboard from './components/Dashboard';
import WriteSection from './components/WriteSection';
import WhoAmI from './components/WhoAmI'; // optional debug page

Amplify.configure(awsconfig);

// Robust protected route using currentSession()
function ProtectedRoute({ children }) {
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // If this resolves, we have valid tokens (user is signed in)
        await Auth.currentSession();
        if (alive) setAuthed(true);
      } catch {
        if (alive) setAuthed(false);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading…</div>
      </div>
    );
  }

  return authed ? children : <Navigate to="/signin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/register" element={<RegistrationPage />} />
        <Route path="/signin" element={<SignInPage />} />

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
          path="/write"
          element={
            <ProtectedRoute>
              <WriteSection />
            </ProtectedRoute>
          }
        />

        {/* Debug helper (remove later) */}
        <Route path="/whoami" element={<WhoAmI />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
