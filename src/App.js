import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { getCurrentUser } from 'aws-amplify/auth';
import awsconfig from './aws-exports';

// Import your components
import LandingPage from './components/LandingPage';
import RegistrationPage from './components/RegistrationPage';
import Dashboard from './components/Dashboard';
import WriteSection from './components/WriteSection';

Amplify.configure(awsconfig);

// Protected Route Component
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.log('User not authenticated');
      setUser(null);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If no user, redirect to landing page
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // If user exists, show the protected content
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth/register" element={<RegistrationPage />} />
        
        {/* Protected Routes */}
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
        
        {/* Redirect any unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
