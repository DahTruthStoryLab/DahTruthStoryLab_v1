// src/lib/authorService.ts
// Manages author identity and profile persistence

import type { AuthorProfile, AuthorPreferences } from "../types/project";

/* ============================================================================
   CONSTANTS
   ============================================================================ */

const AUTHOR_PROFILE_KEY = "dahtruth_author_profile";
const AUTHOR_ID_KEY = "dahtruth_author_id";
const LEGACY_PROFILE_KEY = "profile"; // Old ProfilePage key

/* ============================================================================
   HELPERS
   ============================================================================ */

/**
 * Generate a stable ID from email (for S3 key compatibility)
 * Uses a simple hash - no crypto needed for this purpose
 */
function hashEmail(email: string): string {
  const normalized = email.toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string with prefix
  return `author_${Math.abs(hash).toString(16)}`;
}

/**
 * Generate a random ID for authors without email
 */
function generateRandomId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `author_${crypto.randomUUID().split("-")[0]}`;
  }
  return `author_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================================================================
   MIGRATION FROM LEGACY PROFILE
   ============================================================================ */

/**
 * Migrate from old ProfilePage format to new AuthorProfile format
 */
function migrateLegacyProfile(): AuthorProfile | null {
  if (typeof window === "undefined") return null;
  
  try {
    const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (!legacyRaw) return null;
    
    const legacy = JSON.parse(legacyRaw);
    
    // Already have new format profile? Skip migration
    const existingNew = localStorage.getItem(AUTHOR_PROFILE_KEY);
    if (existingNew) return null;
    
    const now = new Date().toISOString();
    
    // Create new profile from legacy data
    const profile: AuthorProfile = {
      id: legacy.email ? hashEmail(legacy.email) : generateRandomId(),
      name: legacy.displayName || "New Author",
      email: legacy.email || "",
      createdAt: legacy.memberSince || now,
      updatedAt: now,
      
      // Profile details
      tagline: legacy.tagline || "",
      bio: legacy.bio || "",
      avatarUrl: legacy.avatarUrl || "",
      genres: Array.isArray(legacy.genres) ? legacy.genres : [],
      
      // Social links
      website: legacy.website || "",
      instagram: legacy.instagram || "",
      twitter: legacy.twitter || "",
      facebook: legacy.facebook || "",
      
      // Default preferences
      preferences: {
        defaultGenre: "fiction",
        defaultTargetWords: 50000,
        theme: "light",
        aiProvider: "openai",
        autoSaveEnabled: true,
        autoSaveIntervalMs: 3000,
      },
    };
    
    // Save migrated profile
    localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(AUTHOR_ID_KEY, profile.id);
    
    console.log("[authorService] Migrated legacy profile to new format");
    return profile;
  } catch (err) {
    console.error("[authorService] Failed to migrate legacy profile:", err);
    return null;
  }
}

/* ============================================================================
   LOCAL STORAGE OPERATIONS
   ============================================================================ */

/**
 * Get author profile from localStorage
 */
export function getLocalAuthorProfile(): AuthorProfile | null {
  if (typeof window === "undefined") return null;
  
  try {
    const raw = localStorage.getItem(AUTHOR_PROFILE_KEY);
    if (!raw) {
      // Try migration from legacy format
      return migrateLegacyProfile();
    }
    
    const profile = JSON.parse(raw) as AuthorProfile;
    
    // Validate required fields
    if (!profile.id || !profile.name) {
      console.warn("[authorService] Invalid profile in localStorage");
      return migrateLegacyProfile();
    }
    
    return profile;
  } catch (err) {
    console.error("[authorService] Failed to parse author profile:", err);
    return migrateLegacyProfile();
  }
}

/**
 * Save author profile to localStorage
 */
export function setLocalAuthorProfile(profile: AuthorProfile): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(AUTHOR_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(AUTHOR_ID_KEY, profile.id);
    
    // Also update legacy format for backward compatibility with other components
    const legacyProfile = {
      displayName: profile.name,
      tagline: profile.tagline || "",
      bio: profile.bio || "",
      avatarUrl: profile.avatarUrl || "",
      genres: profile.genres || [],
      website: profile.website || "",
      instagram: profile.instagram || "",
      twitter: profile.twitter || "",
      facebook: profile.facebook || "",
      email: profile.email || "",
      memberSince: profile.createdAt,
    };
    localStorage.setItem(LEGACY_PROFILE_KEY, JSON.stringify(legacyProfile));
    
    // Dispatch events for listeners
    window.dispatchEvent(new Event("profile:updated"));
  } catch (err) {
    console.error("[authorService] Failed to save author profile:", err);
  }
}

/**
 * Get just the author ID (faster than parsing full profile)
 */
export function getLocalAuthorId(): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    return localStorage.getItem(AUTHOR_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Clear author profile from localStorage
 */
export function clearLocalAuthorProfile(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(AUTHOR_PROFILE_KEY);
    localStorage.removeItem(AUTHOR_ID_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
  } catch (err) {
    console.error("[authorService] Failed to clear author profile:", err);
  }
}

/* ============================================================================
   PROFILE MANAGEMENT
   ============================================================================ */

/**
 * Create a new author profile
 */
export function createAuthorProfile(
  name: string,
  email?: string,
  options?: {
    tagline?: string;
    bio?: string;
    avatarUrl?: string;
    genres?: string[];
    preferences?: Partial<AuthorPreferences>;
  }
): AuthorProfile {
  const now = new Date().toISOString();
  
  // Generate ID based on email or random
  const id = email ? hashEmail(email) : generateRandomId();
  
  const profile: AuthorProfile = {
    id,
    name: name.trim(),
    email: email?.toLowerCase().trim() || "",
    createdAt: now,
    updatedAt: now,
    
    // Optional profile details
    tagline: options?.tagline || "",
    bio: options?.bio || "",
    avatarUrl: options?.avatarUrl || "",
    genres: options?.genres || [],
    
    // Social links (empty by default)
    website: "",
    instagram: "",
    twitter: "",
    facebook: "",
    
    preferences: {
      defaultGenre: "fiction",
      defaultTargetWords: 50000,
      theme: "light",
      aiProvider: "openai",
      autoSaveEnabled: true,
      autoSaveIntervalMs: 3000,
      ...options?.preferences,
    },
  };
  
  return profile;
}

/**
 * Update an existing author profile
 */
export function updateAuthorProfile(
  profile: AuthorProfile,
  updates: Partial<Omit<AuthorProfile, "id" | "createdAt">>
): AuthorProfile {
  return {
    ...profile,
    ...updates,
    updatedAt: new Date().toISOString(),
    preferences: {
      ...profile.preferences,
      ...updates.preferences,
    },
  };
}

/**
 * Initialize or retrieve author profile
 * Returns existing profile if found, null if setup needed
 */
export function initializeAuthor(): AuthorProfile | null {
  const existing = getLocalAuthorProfile();
  
  if (existing) {
    console.log("[authorService] Found existing author:", existing.name);
    return existing;
  }
  
  console.log("[authorService] No author profile found, setup required");
  return null;
}

/**
 * Complete author setup (called after user enters their info)
 */
export function completeAuthorSetup(
  name: string,
  email?: string,
  options?: {
    tagline?: string;
    bio?: string;
    avatarUrl?: string;
    genres?: string[];
    preferences?: Partial<AuthorPreferences>;
  }
): AuthorProfile {
  const profile = createAuthorProfile(name, email, options);
  setLocalAuthorProfile(profile);
  
  console.log("[authorService] Author setup complete:", profile.id);
  return profile;
}

/**
 * Check if author setup is complete
 */
export function isAuthorSetupComplete(): boolean {
  return getLocalAuthorProfile() !== null;
}

/* ============================================================================
   S3 OPERATIONS (for cross-device sync)
   ============================================================================ */

import { API_BASE } from "./api";

/**
 * Save author profile to S3
 */
export async function saveAuthorProfileToCloud(profile: AuthorProfile): Promise<void> {
  const key = `authors/${profile.id}/profile.json`;
  
  try {
    const response = await fetch(`${API_BASE}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-operation": "save-json",
      },
      body: JSON.stringify({
        operation: "save-json",
        key,
        data: profile,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to save profile: ${response.status}`);
    }
    
    console.log("[authorService] Profile saved to cloud");
  } catch (err) {
    console.error("[authorService] Cloud save failed:", err);
    throw err;
  }
}

/**
 * Load author profile from S3 by email
 * Used when author logs in from a new device
 */
export async function loadAuthorProfileFromCloud(email: string): Promise<AuthorProfile | null> {
  const authorId = hashEmail(email);
  const key = `authors/${authorId}/profile.json`;
  
  try {
    const response = await fetch(`${API_BASE}/files?key=${encodeURIComponent(key)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (response.status === 404) {
      console.log("[authorService] No cloud profile found for email");
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load profile: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.profile || data.data) {
      const profile = data.profile || data.data;
      console.log("[authorService] Profile loaded from cloud:", profile.name);
      return profile as AuthorProfile;
    }
    
    return null;
  } catch (err) {
    console.error("[authorService] Cloud load failed:", err);
    return null;
  }
}

/**
 * Check if an email already has a profile in the cloud
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  const profile = await loadAuthorProfileFromCloud(email);
  return profile !== null;
}

/* ============================================================================
   EXPORTS
   ============================================================================ */

export const authorService = {
  // Local operations
  getLocal: getLocalAuthorProfile,
  setLocal: setLocalAuthorProfile,
  getLocalId: getLocalAuthorId,
  clearLocal: clearLocalAuthorProfile,
  
  // Profile management
  create: createAuthorProfile,
  update: updateAuthorProfile,
  initialize: initializeAuthor,
  completeSetup: completeAuthorSetup,
  isSetupComplete: isAuthorSetupComplete,
  
  // Cloud operations
  saveToCloud: saveAuthorProfileToCloud,
  loadFromCloud: loadAuthorProfileFromCloud,
  checkEmailExists,
  
  // Utilities
  hashEmail,
};

export default authorService;
