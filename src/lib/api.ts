// src/lib/api.ts
// Absolute base to your HTTP API stage, e.g.
//   dev:  https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/dev/ai
//   prod: https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/prod/ai
export const API_BASE: string = 
  import.meta.env.VITE_API_BASE || 
  'https://t9xv0aicog.execute-api.us-east-1.amazonaws.com/prod/ai';

// expose for quick console checks on the live site
// @ts-ignore
(window as any).__API_BASE__ = API_BASE;

// sanity-check the env var at runtime
if (!API_BASE || API_BASE.startsWith("/")) {
  console.error("❌ Bad API_BASE value:", API_BASE);
} else if (import.meta.env.DEV) {
  console.log("API_BASE =", API_BASE);
}

// tiny helper to ensure we always send/expect JSON and show readable errors
async function jsonFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = isJson ? (body as any)?.error ?? JSON.stringify(body) : body.slice(0, 200);
    console.error("❌ HTTP error", res.status, res.statusText, "from", url, "\nBody:", msg);
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${msg}`);
  }
  if (!isJson) {
    console.error("❌ Non-JSON response from:", url, "\nFirst 200 chars:\n", (body as string).slice(0, 200));
    throw new Error(`Expected JSON but got non-JSON from ${url}`);
  }
  return body;
}

// ------- Endpoint helpers (use these everywhere) -------
export function runGrammar(text: string) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runStyle(text: string) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runAssistant(text: string, action = "improve", instructions = "") {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, action, instructions }),
  });
}

export function runReadability(text: string) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/readability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runPublishingPrep(meta: any, chapters: any[], options: any = {}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/publishing-prep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta, chapters, options }),
  });
}
