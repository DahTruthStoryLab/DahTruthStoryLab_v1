// src/lib/apiKeys.ts
// Helper for retrieving stored API keys

const API_KEYS_KEY = "dahtruth_api_keys";

export interface ApiKeys {
  openai?: string;
  anthropic?: string;
  preferred?: "openai" | "anthropic";
}

/**
 * Get stored API keys
 */
export function getApiKeys(): ApiKeys {
  if (typeof window === "undefined") return {};
  
  try {
    const raw = localStorage.getItem(API_KEYS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Get OpenAI API key
 */
export function getOpenAIKey(): string | undefined {
  return getApiKeys().openai || undefined;
}

/**
 * Get Anthropic API key
 */
export function getAnthropicKey(): string | undefined {
  return getApiKeys().anthropic || undefined;
}

/**
 * Get preferred provider
 */
export function getPreferredProvider(): "openai" | "anthropic" {
  const keys = getApiKeys();
  
  // If user has a preference, use it
  if (keys.preferred) return keys.preferred;
  
  // Otherwise, use whichever key is available
  if (keys.openai) return "openai";
  if (keys.anthropic) return "anthropic";
  
  // Default to openai
  return "openai";
}

/**
 * Check if any API key is configured
 */
export function hasApiKeys(): boolean {
  const keys = getApiKeys();
  return !!(keys.openai || keys.anthropic);
}

/**
 * Save API keys
 */
export function saveApiKeys(keys: ApiKeys): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(keys));
    window.dispatchEvent(new Event("apikeys:updated"));
  } catch (err) {
    console.error("Failed to save API keys:", err);
  }
}

/**
 * Clear API keys
 */
export function clearApiKeys(): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(API_KEYS_KEY);
    window.dispatchEvent(new Event("apikeys:updated"));
  } catch (err) {
    console.error("Failed to clear API keys:", err);
  }
}

export default {
  get: getApiKeys,
  getOpenAI: getOpenAIKey,
  getAnthropic: getAnthropicKey,
  getPreferred: getPreferredProvider,
  hasKeys: hasApiKeys,
  save: saveApiKeys,
  clear: clearApiKeys,
};
