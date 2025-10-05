// src/lib/state/userStore.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const PROFILE_KEY = "dt_profile";

function readProfile() {
  try {
    const raw =
      localStorage.getItem(PROFILE_KEY) ||
      localStorage.getItem("userProfile") ||
      localStorage.getItem("profile") ||
      localStorage.getItem("currentUser");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeProfile(p) {
  try {
    const payload = JSON.stringify(p);
    localStorage.setItem(PROFILE_KEY, payload);
    // Mirror for back-compat (safe to remove later)
    localStorage.setItem("userProfile", payload);
    localStorage.setItem("profile", payload);
    localStorage.setItem("currentUser", payload);
    window.dispatchEvent(new Event("profile:updated"));
  } catch {}
}

const UserContext = createContext({ user: null, setUser: () => {} });

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => readProfile());

  useEffect(() => { if (user) writeProfile(user); }, [user]);

  useEffect(() => {
    const onUpdate = () => {
      const latest = readProfile();
      if (!latest) return;
      setUser(u => (JSON.stringify(u) === JSON.stringify(latest) ? u : latest));
    };
    window.addEventListener("profile:updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("profile:updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const value = useMemo(() => ({ user, setUser }), [user]);
  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
