// src/hooks/useAuthor.ts
// React hook for managing author state

import { useState, useEffect, useCallback } from "react";
import type { AuthorProfile, AuthorPreferences } from "../types/project";
import {
  getLocalAuthorProfile,
  setLocalAuthorProfile,
  completeAuthorSetup,
  isAuthorSetupComplete,
  saveAuthorProfileToCloud,
  loadAuthorProfileFromCloud,
  updateAuthorProfile,
} from "../lib/authorService";

export interface UseAuthorReturn {
  // State
  author: AuthorProfile | null;
  isLoading: boolean;
  isSetupComplete: boolean;
  error: string | null;
  
  // Actions
  setup: (name: string, email?: string, preferences?: Partial<AuthorPreferences>) => Promise<void>;
  update: (updates: Partial<Omit<AuthorProfile, "id" | "createdAt">>) => Promise<void>;
  loginWithEmail: (email: string) => Promise<boolean>;
  logout: () => void;
  syncToCloud: () => Promise<void>;
}

export function useAuthor(): UseAuthorReturn {
  const [author, setAuthor] = useState<AuthorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize on mount
  useEffect(() => {
    const profile = getLocalAuthorProfile();
    setAuthor(profile);
    setIsLoading(false);
  }, []);
  
  // Setup new author
  const setup = useCallback(async (
    name: string,
    email?: string,
    preferences?: Partial<AuthorPreferences>
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if email already exists in cloud
      if (email) {
        const existing = await loadAuthorProfileFromCloud(email);
        if (existing) {
          // Found existing profile - use it
          setLocalAuthorProfile(existing);
          setAuthor(existing);
          setIsLoading(false);
          return;
        }
      }
      
      // Create new profile
      const profile = completeAuthorSetup(name, email, preferences);
      setAuthor(profile);
      
      // Sync to cloud
      try {
        await saveAuthorProfileToCloud(profile);
      } catch (err) {
        console.warn("[useAuthor] Cloud sync failed:", err);
        // Don't throw - local setup succeeded
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Setup failed";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Update existing profile
  const update = useCallback(async (
    updates: Partial<Omit<AuthorProfile, "id" | "createdAt">>
  ) => {
    if (!author) {
      throw new Error("No author profile to update");
    }
    
    setError(null);
    
    try {
      const updated = updateAuthorProfile(author, updates);
      setLocalAuthorProfile(updated);
      setAuthor(updated);
      
      // Sync to cloud
      try {
        await saveAuthorProfileToCloud(updated);
      } catch (err) {
        console.warn("[useAuthor] Cloud sync failed:", err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      setError(message);
      throw err;
    }
  }, [author]);
  
  // Login with existing email
  const loginWithEmail = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const profile = await loadAuthorProfileFromCloud(email);
      
      if (profile) {
        setLocalAuthorProfile(profile);
        setAuthor(profile);
        return true;
      }
      
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Logout (clear local profile)
  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("dahtruth_author_profile");
      localStorage.removeItem("dahtruth_author_id");
    }
    setAuthor(null);
  }, []);
  
  // Manual cloud sync
  const syncToCloud = useCallback(async () => {
    if (!author) return;
    
    setError(null);
    
    try {
      await saveAuthorProfileToCloud(author);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sync failed";
      setError(message);
      throw err;
    }
  }, [author]);
  
  return {
    author,
    isLoading,
    isSetupComplete: author !== null,
    error,
    setup,
    update,
    loginWithEmail,
    logout,
    syncToCloud,
  };
}

export default useAuthor;
