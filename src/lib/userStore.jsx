// src/lib/userStore.jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

// Base key - will be combined with user ID for user-specific storage
const KEY_PREFIX = "dt_user_profile";

// Get the current authenticated user's ID
function getAuthUserId() {
  try {
    // Check for user ID from auth
    const userId = localStorage.getItem("dt_user_id");
    if (userId) return userId;
    
    // Check for auth user object
    const authUser = localStorage.getItem("dt_auth_user");
    if (authUser) {
      const parsed = JSON.parse(authUser);
      return parsed.id || parsed.userId || parsed.sub || parsed.username || null;
    }
    
    return null;
  } catch {
    return null;
  }
}

// Get the storage key for the current user
function getUserKey() {
  const userId = getAuthUserId();
  return userId ? `${KEY_PREFIX}_${userId}` : KEY_PREFIX;
}

export function loadUser() {
  try {
    const key = getUserKey();
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user) {
  try {
    const key = getUserKey();
    localStorage.setItem(key, JSON.stringify(user));
  } catch {}
}

export function clearUser() {
  try {
    const key = getUserKey();
    localStorage.removeItem(key);
  } catch {}
}

// Create the User Context
export const UserContext = createContext(null);

// UserProvider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  // Reload user when auth changes (sign in/out)
  useEffect(() => {
    const handleAuthChange = () => {
      const newUser = loadUser();
      setUser(newUser);
    };

    // Listen for auth changes
    window.addEventListener("auth:change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    
    return () => {
      window.removeEventListener("auth:change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      saveUser(user);
    }
  }, [user]);

  // Function to update user and trigger save
  const updateUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      saveUser(newUser);
    }
  };

  // Function to sign out / clear user
  const signOut = () => {
    clearUser();
    setUser(null);
    window.dispatchEvent(new Event("auth:change"));
  };

  const value = useMemo(() => ({ 
    user, 
    setUser: updateUser,
    signOut,
    isAuthenticated: !!user,
  }), [user]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
