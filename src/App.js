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
import WhoAmI from './components/WhoAmI'; // ← optional debug page

Amplify.configure(awsconfig);

// Robust protected route using bypassCache
function ProtectedRoute({ children }) {
  const [state, setState] = React.useState({ loading: true, authed: false });

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Auth.currentAuthenticatedUser({ bypassCache: true });
        if (mounted) setState({ loading: false, authed: true });
      } catch (e) {
        if (mounted) setState({ loading: false, authed: false });
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (state.loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading…</div>
      </div>
    );
  }

  return state.authed ? children : <Navigate to="/signin" replace />;
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
