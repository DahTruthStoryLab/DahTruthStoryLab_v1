// src/utils/storyData.js
// Shared S3 sync utility for StoryArchitecture and WorldBuilder
// Saves to S3 via Lambda with localStorage as fast cache

const CLOUD_TIMEOUT = 8000;

function getApiBase() {
  return String(
    (typeof window !== "undefined" && window.__API_BASE__) ||
    "https://nh462913aa.execute-api.us-east-1.amazonaws.com/prod"
  ).replace(/\/+$/, "");
}

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
    const stored = localStorage.getItem("dt_user_id");
    if (stored) return stored;
  } catch { }
  return "default";
}

function safeJsonParse(value, fallback = null) {
  try { return value ? JSON.parse(value) : fallback; }
  catch { return fallback; }
}

// ── Generic cloud get ─────────────────────────────────
export async function cloudGet(moduleKey) {
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
    if (!data?.draft?.content) return null;
    return safeJsonParse(data.draft.content, null);
  } catch { return null; }
}

// ── Generic cloud save ────────────────────────────────
export async function cloudSave(moduleKey, data) {
  try {
    const userId = getUserId();
    await fetch(`${getApiBase()}/data/module-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        key: moduleKey,
        content: JSON.stringify(data),
        feedback: "",
      }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
  } catch { /* silent — localStorage already saved */ }
}

// ── Architecture helpers ──────────────────────────────
const ARCHITECTURE_LOCAL_KEY = (projectId) => `dahtruth_architecture_${projectId}`;
const ARCHITECTURE_CLOUD_KEY = (projectId) => `architecture-${projectId}`;

export function getArchitecture(projectId) {
  if (!projectId) return null;
  return safeJsonParse(localStorage.getItem(ARCHITECTURE_LOCAL_KEY(projectId)), null);
}

export async function loadArchitectureFromCloud(projectId) {
  if (!projectId) return null;
  const cloudData = await cloudGet(ARCHITECTURE_CLOUD_KEY(projectId));
  if (cloudData) {
    localStorage.setItem(ARCHITECTURE_LOCAL_KEY(projectId), JSON.stringify(cloudData));
    return cloudData;
  }
  return getArchitecture(projectId);
}

export function saveArchitecture(projectId, data) {
  if (!projectId) return;
  localStorage.setItem(ARCHITECTURE_LOCAL_KEY(projectId), JSON.stringify(data));
  window.dispatchEvent(new CustomEvent("architecture:change", { detail: { projectId } }));
  cloudSave(ARCHITECTURE_CLOUD_KEY(projectId), data);
}

// ── World helpers ─────────────────────────────────────
const WORLDS_LOCAL_KEY = (projectId) => `dahtruth_worlds_${projectId}`;
const WORLDS_CLOUD_KEY  = (projectId) => `worlds-${projectId}`;

export function getWorlds(projectId) {
  if (!projectId) return [];
  return safeJsonParse(localStorage.getItem(WORLDS_LOCAL_KEY(projectId)), []);
}

export async function loadWorldsFromCloud(projectId) {
  if (!projectId) return null;
  const cloudData = await cloudGet(WORLDS_CLOUD_KEY(projectId));
  if (cloudData && Array.isArray(cloudData)) {
    localStorage.setItem(WORLDS_LOCAL_KEY(projectId), JSON.stringify(cloudData));
    return cloudData;
  }
  return getWorlds(projectId);
}

export function saveWorlds(projectId, worlds) {
  if (!projectId) return;
  localStorage.setItem(WORLDS_LOCAL_KEY(projectId), JSON.stringify(worlds || []));
  window.dispatchEvent(new CustomEvent("worlds:change", { detail: { projectId } }));
  cloudSave(WORLDS_CLOUD_KEY(projectId), worlds || []);
}

export function createEmptyWorld() {
  return {
    id: `world_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    timePeriod: "",
    locationType: "",
    socialClimate: "",
    sightDetails: "",
    soundDetails: "",
    smellDetails: "",
    feelDetails: "",
    culturalTone: "",
    whatWorldRewards: "",
    whatWorldPunishes: "",
    howWorldTreatsCharacter: "",
    notes: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function upsertWorld(projectId, world) {
  const worlds = getWorlds(projectId);
  const idx = worlds.findIndex((w) => w.id === world.id);
  const next = { ...world, updatedAt: Date.now() };
  const nextWorlds = idx >= 0
    ? worlds.map((w, i) => i === idx ? next : w)
    : [...worlds, next];
  saveWorlds(projectId, nextWorlds);
  return next;
}

export function deleteWorld(projectId, worldId) {
  saveWorlds(projectId, getWorlds(projectId).filter((w) => w.id !== worldId));
}
