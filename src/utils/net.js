// src/utils/net.js
// Robust fetch with timeout and retry for AI operations

export async function fetchWithTimeout(url, opts = {}, { timeoutMs = 45000, retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP ${res.status}`);
      }
      
      return res;
    } catch (e) {
      clearTimeout(timeoutId);
      const isTimeout = e.name === "AbortError";
      const isRetryable = isTimeout || /429|502|503|504/.test(String(e));
      
      if (attempt < retries && isRetryable) {
        console.log(`⚠️ Attempt ${attempt + 1} failed, retrying...`, e.message);
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); // backoff
        continue;
      }
      
      // Final attempt failed or non-retryable error
      if (isTimeout) {
        throw new Error(`Request timed out after ${timeoutMs}ms. The AI operation may need more time.`);
      }
      throw e;
    }
  }
}
