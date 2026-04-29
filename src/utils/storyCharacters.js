// src/utils/storyCharacters.js
// Single source of truth for all character data across StoryLab modules.
// Used by: CharacterForge, ComposePage, HopesFearsLegacy, CharacterRoadmap, Priorities
// UPDATED: Now syncs to S3 via Lambda for cross-device persistence

export const CHARACTERS_KEY = (projectId) => `dahtruth_characters_${projectId}`;

const CLOUD_TIMEOUT = 8000;

// ── API base ──────────────────────────────────────────
function getApiBase() {
  return String(
    (typeof window !== "undefined" && window.__API_BASE__) ||
    "https://nh462913aa.execute-api.us-east-1.amazonaws.com/prod"
  ).replace(/\/+$/, "");
}

// ── Get userId from Cognito token ─────────────────────
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

// ── JSON helpers ──────────────────────────────────────
function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

// ── S3 cloud key for characters ───────────────────────
// Stores as a module draft with key "characters-{projectId}"
function cloudKey(projectId) {
  return `characters-${projectId}`;
}

// ── Cloud read ────────────────────────────────────────
async function cloudGetCharacters(projectId) {
  try {
    const userId = getUserId();
    const key = cloudKey(projectId);
    const res = await fetch(
      `${getApiBase()}/data/module-draft?userId=${encodeURIComponent(userId)}&key=${encodeURIComponent(key)}`,
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

// ── Cloud write ───────────────────────────────────────
async function cloudSaveCharacters(projectId, characters) {
  try {
    const userId = getUserId();
    const key = cloudKey(projectId);
    await fetch(`${getApiBase()}/data/module-draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": userId },
      body: JSON.stringify({
        key,
        content: JSON.stringify(characters),
        feedback: "",
      }),
      signal: AbortSignal.timeout(CLOUD_TIMEOUT),
    });
  } catch { /* silent — localStorage already saved */ }
}

// ── Public API ────────────────────────────────────────

export function getCharacters(projectId) {
  if (!projectId) return [];
  return safeJsonParse(localStorage.getItem(CHARACTERS_KEY(projectId)), []);
}

// Load from cloud and sync to localStorage
// Call this on component mount
export async function loadCharactersFromCloud(projectId) {
  if (!projectId) return null;
  const cloudData = await cloudGetCharacters(projectId);
  if (cloudData && Array.isArray(cloudData)) {
    // Cloud has data — sync to localStorage
    localStorage.setItem(CHARACTERS_KEY(projectId), JSON.stringify(cloudData));
    window.dispatchEvent(new CustomEvent("characters:change", { detail: { projectId } }));
    return cloudData;
  }
  // No cloud data — return local data
  return getCharacters(projectId);
}

export function saveCharacters(projectId, characters) {
  if (!projectId) return;
  // Save to localStorage immediately
  localStorage.setItem(CHARACTERS_KEY(projectId), JSON.stringify(characters || []));
  window.dispatchEvent(new CustomEvent("characters:change", { detail: { projectId } }));
  // Save to cloud async
  cloudSaveCharacters(projectId, characters || []);
}

export function createEmptyCharacter() {
  return {
    id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: "",
    role: "",
    age: "",
    physicalPresence: "",
    voice: "",
    background: "",
    coreWound: "",
    desire: "",
    lieTheyBelieve: "",
    internalContradiction: "",
    relationships: [],
    notes: "",
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function upsertCharacter(projectId, character) {
  const characters = getCharacters(projectId);
  const existingIndex = characters.findIndex((c) => c.id === character.id);
  const nextCharacter = { ...character, updatedAt: Date.now() };
  let nextCharacters;
  if (existingIndex >= 0) {
    nextCharacters = [...characters];
    nextCharacters[existingIndex] = nextCharacter;
  } else {
    nextCharacters = [...characters, nextCharacter];
  }
  saveCharacters(projectId, nextCharacters);
  return nextCharacter;
}

export function deleteCharacter(projectId, characterId) {
  const characters = getCharacters(projectId);
  saveCharacters(projectId, characters.filter((c) => c.id !== characterId));
}

export function getCharacterById(projectId, characterId) {
  return getCharacters(projectId).find((c) => c.id === characterId) || null;
}
