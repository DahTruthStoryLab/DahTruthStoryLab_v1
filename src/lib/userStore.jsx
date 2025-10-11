// src/lib/userStore.jsx
import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';

const KEY = "dt_user_profile";

export function loadUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveUser(user) {
  try {
    localStorage.setItem(KEY, JSON.stringify(user));
  } catch {}
}

// Create the User Context
export const UserContext = createContext(null);

// UserProvider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(() => loadUser());

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (user) {
      saveUser(user);
    }
  }, [user]);

  const value = useMemo(() => ({ user, setUser }), [user]);

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
