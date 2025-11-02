// src/lib/api.ts

// ---------- Base API URL (must include API Gateway stage like /prod) ----------
const RAW_API_BASE: string =
  import.meta.env.VITE_API_BASE ||
  "https://ud9loepble.execute-api.us-east-1.amazonaws.com/prod"; // <- use YOUR invoke URL+stage

// Normalize (remove trailing slash if present)
export const API_BASE: string = RAW_API_BASE.replace(/\/+$/, "");

// Expose for quick console checks on the live site
;(window as any).__API_BASE__ = API_BASE;

// Sanity-check the env var at runtime
if (!API_BASE || API_BASE.startsWith("/")) {
  console.error("❌ Bad API_BASE value:", API_BASE);
} else if (import.meta.env.DEV) {
  console.log("API_BASE =", API_BASE);
}

// ---------- Helper functions ----------
function withTimeout(ms: number, signal?: AbortSignal) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  if (signal) signal.addEventListener("abort", () => c.abort(), { once: true });
  return { controller: c, clear: () => clearTimeout(t) };
}

// ---------- Tiny helper to always send/expect JSON and show readable errors ----------
async function jsonFetch(url: string, init: RequestInit) {
  const { controller, clear } = withTimeout(30000, (init as any)?.signal);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");
    const body = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = isJson ? ((body as any)?.error ?? JSON.stringify(body)) : String(body).slice(0, 200);
      console.error("❌ HTTP error", res.status, res.statusText, "from", url, "\nBody:", msg);
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${msg}`);
    }
    if (!isJson) {
      console.error("❌ Non-JSON response from:", url, "\nFirst 200 chars:\n", String(body).slice(0, 200));
      throw new Error(`Expected JSON but got non-JSON from ${url}`);
    }
    return body;
  } finally {
    clear();
  }
}

function jsonHeaders(extra: Record<string,string> = {}) {
  return { "Content-Type": "application/json", ...extra };
}

// -----------------------------------------------------------------------------
// Route constants (FLAT: no /ai prefix) — keep these in sync with API Gateway
// -----------------------------------------------------------------------------
const ROUTES = {
  assistant: "/assistant",
  grammar: "/grammar",
  rewrite: "/rewrite",
  style: "/style",
  publishingPrep: "/publishing-prep",
  readability: "/readability",

  // Files (use these only if you created matching routes in API Gateway)
  filesPresignUpload: "/files/presign-upload",
  filesList: "/files/list",
  filesGet: "/files/get",
  filesDelete: "/files/delete",
} as const;

// -----------------------------------------------------------------------------
// AI Endpoint Helpers
// -----------------------------------------------------------------------------

export function runRewrite(
  text: string,
  provider: "anthropic" | "openai" = "anthropic"
) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}${ROUTES.rewrite}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: "rewrite", provider }),
  });
}

export function runGrammar(
  text: string,
  provider: "anthropic" | "openai" = "anthropic"
) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}${ROUTES.grammar}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: "grammar", provider }),
  });
}

export function runStyle(
  text: string,
  provider: "anthropic" | "openai" = "anthropic"
) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}${ROUTES.style}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: "style", provider }),
  });
}

export function runAssistant(
  text: string,
  action: "improve" | "proofread" | "clarify" | "rewrite" = "improve",
  instructions = "",
  provider: "anthropic" | "openai" = "anthropic"
) {
  const op = "chat";
  const url = `${API_BASE}${ROUTES.assistant}?operation=${encodeURIComponent(op)}`;
  return jsonFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-operation": op },
    body: JSON.stringify({
      operation: op,
      message: text,
      text,
      action,
      instructions,
      provider,
    }),
  });
}

export function runReadability(
  text: string,
  provider: "anthropic" | "openai" = "anthropic"
) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}${ROUTES.readability}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: "readability", provider }),
  });
}

export function runPublishingPrep(
  meta: any,
  chapters: any[],
  options: any = {},
  provider: "anthropic" | "openai" = "anthropic"
) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  const text = JSON.stringify({ meta, chapters, options });
  return jsonFetch(`${API_BASE}${ROUTES.publishingPrep}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, operation: "publishing-prep", provider }),
  });
}

// -----------------------------------------------------------------------------
// File Management Endpoint Helpers (only if your API has these routes)
// -----------------------------------------------------------------------------

export function filesPresignUpload(params: {
  userId: string;
  fileName: string;
  contentType: string;
  keyHint?: string;
}) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set");
  return jsonFetch(`${API_BASE}${ROUTES.filesPresignUpload}`, {
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
  return jsonFetch(`${API_BASE}${ROUTES.filesList}`, {
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
  return jsonFetch(`${API_BASE}${ROUTES.filesGet}`, {
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
  return jsonFetch(`${API_BASE}${ROUTES.filesDelete}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

// -----------------------------------------------------------------------------
// Convenience wrappers
// -----------------------------------------------------------------------------
export const proofread = (text: string, instructions = "", provider: "anthropic" | "openai" = "anthropic") =>
  runAssistant(text, "proofread", instructions, provider);
export const clarify = (text: string, instructions = "", provider: "anthropic" | "openai" = "anthropic") =>
  runAssistant(text, "clarify", instructions, provider);
export const rewrite = (text: string, instructions = "", provider: "anthropic" | "openai" = "anthropic") =>
  runAssistant(text, "rewrite", instructions, provider);
