// src/utils/storyCharacters.js
// Single source of truth for all character data across StoryLab modules.
// Used by: CharacterForge, ComposePage, HopesFearsLegacy, CharacterRoadmap, Priorities

export const CHARACTERS_KEY = (projectId) => `dahtruth_characters_${projectId}`;

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function getCharacters(projectId) {
  if (!projectId) return [];
  return safeJsonParse(localStorage.getItem(CHARACTERS_KEY(projectId)), []);
}

export function saveCharacters(projectId, characters) {
  if (!projectId) return;
  localStorage.setItem(CHARACTERS_KEY(projectId), JSON.stringify(characters || []));
  window.dispatchEvent(new CustomEvent("characters:change", { detail: { projectId } }));
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
