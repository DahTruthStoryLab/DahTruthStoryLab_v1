// src/hooks/usePersistedText.js
// Persists textarea content to S3 via Lambda — with localStorage as fallback
// Auto-saves on every keystroke (debounced 1.5s for cloud, 500ms for local)
// Restores from cloud on mount, falls back to localStorage if offline

import { useState, useEffect, useRef, useCallback } from "react";

const PREFIX        = "storylab_draft_";
const CLOUD_TIMEOUT = 8000;

function getApiBase() {
  return String(
    (typeof window !== "undefined" && window.__API_BASE__) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE) ||
    "/api"
  ).replace(/\/+$/, "");
}

// ── Get userId ────────────────────────────────────────
function getUserId() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key.includes("CognitoIdentityServiceProvider") && key.endsWith(".idToken")) {
        const token = localStorage.getItem(key);
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload?.sub) return payload.sub;
        }
      }
    }
    const userId = localStorage.getItem("dt_user_id");
    if (userId) return userId;
  } catch { }
  return "default";
}

// ── Cloud read ────────────────────────────────────────
async function cloudGet(moduleKey) {
  try {
    const userId = getUserId();
    const res = await fetch(
      `${getApiBase()}/data/module-draft?userId=${encodeURIComponent(userId)}&key=${encodeURIComponent(moduleKey)}`,
      {
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        signal: AbortSignal.timeout(CLOUD_TIMEOUT),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.draft || null;
  } catch { return null; }
}

// ── Cloud write ───────────────────────────────────────
async function cloudSave(moduleKey, content, feedback = "") {
  try {
    const userId = getUserId();
    await fetch(`${getApiBase()}/data/module-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({ key: moduleKey, content, feedback }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
  } catch { /* silent — localStorage already saved */ }
}

// ── Cloud delete ──────────────────────────────────────
async function cloudDelete(moduleKey) {
  try {
    const userId = getUserId();
    await fetch(
      `${getApiBase()}/data/module-draft?userId=${encodeURIComponent(userId)}&key=${encodeURIComponent(moduleKey)}`,
      {
        method: "DELETE",
        headers: { "x-user-id": userId },
        signal: AbortSignal.timeout(CLOUD_TIMEOUT),
      }
    );
  } catch { }
}

// ── Hook ──────────────────────────────────────────────
export function usePersistedText(key, initialValue = "") {
  const storageKey = `${PREFIX}${key}`;

  const [value, setValueState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored !== null ? stored : initialValue;
    } catch { return initialValue; }
  });

  const debounceLocal = useRef(null);
  const debounceCloud = useRef(null);
  const valueRef      = useRef(value);

  useEffect(() => { valueRef.current = value; }, [value]);

  // ── On mount: load from cloud, override localStorage if content exists ──
  useEffect(() => {
    let cancelled = false;
    cloudGet(key).then((draft) => {
      if (cancelled || !draft?.content) return;
      setValueState(draft.content);
      try { localStorage.setItem(storageKey, draft.content); } catch { }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // ── setValue ──────────────────────────────────────────
  const setValue = useCallback((newValue) => {
    const val = typeof newValue === "function" ? newValue(valueRef.current) : newValue;
    setValueState(val);
    valueRef.current = val;

    // localStorage — fast (500ms debounce)
    if (debounceLocal.current) clearTimeout(debounceLocal.current);
    debounceLocal.current = setTimeout(() => {
      try { localStorage.setItem(storageKey, val); } catch { }
    }, 500);

    // Cloud — slower (1.5s debounce to avoid hammering Lambda on every keystroke)
    if (debounceCloud.current) clearTimeout(debounceCloud.current);
    debounceCloud.current = setTimeout(() => {
      cloudSave(key, val);
    }, 1500);
  }, [key, storageKey]);

  // ── Flush on unmount so nothing is lost ──────────────
  useEffect(() => {
    return () => {
      if (debounceLocal.current) {
        clearTimeout(debounceLocal.current);
        try { localStorage.setItem(storageKey, valueRef.current); } catch { }
      }
      if (debounceCloud.current) {
        clearTimeout(debounceCloud.current);
        cloudSave(key, valueRef.current);
      }
    };
  }, [key, storageKey]);

  // ── Clear — removes from both localStorage and cloud ─
  const clear = useCallback(() => {
    setValueState("");
    valueRef.current = "";
    try { localStorage.removeItem(storageKey); } catch { }
    cloudDelete(key);
  }, [key, storageKey]);

  return [value, setValue, clear];
}
