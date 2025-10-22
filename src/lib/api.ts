// src/lib/api.ts
export const API_BASE = import.meta.env.VITE_API_BASE;

// Log once in dev so we can confirm value at runtime
if (import.meta.env.DEV) {
  console.log("API_BASE =", API_BASE);
}

async function jsonFetch(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${res.statusText} from ${url} — ` +
      (isJson ? (body as any)?.error || "error" : body.slice(0, 200))
    );
  }
  if (!isJson) {
    throw new Error(`Expected JSON from ${url} but got: ${body.slice(0, 200)}`);
  }
  return body;
}

export function runGrammar(text: string) {
  return jsonFetch(`${API_BASE}/grammar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runStyle(text: string) {
  return jsonFetch(`${API_BASE}/style`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runAssistant(text: string, action = "improve", instructions = "") {
  return jsonFetch(`${API_BASE}/assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, action, instructions }),
  });
}

export function runReadability(text: string) {
  return jsonFetch(`${API_BASE}/readability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function runPublishingPrep(meta: any, chapters: any[], options: any = {}) {
  return jsonFetch(`${API_BASE}/publishing-prep`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ meta, chapters, options }),
  });
}
