// src/lib/api.ts

// Base API URL - no /ai or /files suffix
export const API_BASE: string = 
  import.meta.env.VITE_API_BASE || 
  'https://t9xv0aicog.execute-api.us-east-1.amazonaws.com';

// Expose for quick console checks on the live site
(window as any).__API_BASE__ = API_BASE;

// Sanity-check the env var at runtime
if (!API_BASE || API_BASE.startsWith("/")) {
  console.error("❌ Bad API_BASE value:", API_BASE);
} else if (import.meta.env.DEV) {
  console.log("API_BASE =", API_BASE);
}

// Tiny helper to ensure we always send/expect JSON and show readable errors
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

// ------- AI Endpoint Helpers -------

export function runRewrite(text: string, provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/ai/rewrite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'rewrite', provider }),
  });
}

export function runGrammar(text: string, provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/ai/grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'grammar', provider }),
  });
}

export function runStyle(text: string, provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/ai/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'style', provider }),
  });
}

export function runAssistant(text: string, action = "improve", instructions = "", provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/ai/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'assistant', provider }),
  });
}

export function runReadability(text: string, provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/ai/readability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'readability', provider }),
  });
}

export function runPublishingPrep(meta: any, chapters: any[], options: any = {}, provider: 'anthropic' | 'openai' = 'anthropic') {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  const text = JSON.stringify({ meta, chapters, options });
  return jsonFetch(`${API_BASE}/ai/publishing-prep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: 'publishing-prep', provider }),
  });
}

// ------- File Management Endpoint Helpers -------

export function filesPresignUpload(params: {
  userId: string;
  fileName: string;
  contentType: string;
  keyHint?: string;
}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/files/presign-upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function filesList(params: {
  userId: string;
  manuscriptId?: string;
  prefix?: string;
}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/files/list`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function filesGet(params: {
  userId: string;
  key: string;
  expiresIn?: number;
}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/files/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export function filesDelete(params: {
  userId: string;
  manuscriptId?: string;
  fileKey?: string;
}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}/files/delete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
