/* =============================================================================
   DahTruth Story Lab - API Client (TypeScript)
   - Works with unified route:  /ai-assistant
   - Timeouts, retries, readable errors
   - Anthropic "credit balance" -> auto fallback to OpenAI once
   - Normalized responses so UI can always read `.result`
   ========================================================================== */

/* ------------------------------- API BASE --------------------------------- */

// src/lib/api.ts (top)
const RAW_API_BASE: string =
  import.meta.env.VITE_API_BASE || "/api"; // <-- must be full invoke URL in prod

export const API_BASE: string = String(RAW_API_BASE).replace(/\/+$/, "");

// Expose in browser console to help diagnose prod issues quickly
if (typeof window !== "undefined") {
  (window as any).__API_BASE__ = API_BASE;
}

// Only complain if API_BASE is empty
if (!API_BASE) {
  console.error("❌ Bad API_BASE value:", API_BASE);
} else if ((import.meta as any).env?.DEV) {
  console.log("API_BASE =", API_BASE);
}

/* ------------------------------- Utilities -------------------------------- */

type Json = Record<string, any> | null;

type Normalized = {
  ok: boolean;
  status: number;
  headers: Headers;
  raw: string | null;
  json: Json;
  result: any;
  message: string | null;
  error: string | null;
};

function withTimeout(ms: number, signal?: AbortSignal) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
  return { signal: controller.signal, clear: () => clearTimeout(t) };
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 20000) {
  const { signal, clear } = withTimeout(ms, (init as any)?.signal);
  try {
    return await fetch(url, { ...init, signal });
  } finally {
    clear();
  }
}

function normalizeResponse(res: Response, bodyText: string | null): Normalized {
  let json: Json = null;
  try {
    json = bodyText ? JSON.parse(bodyText) : null;
  } catch {
    // non-JSON; leave text in raw
  }
  const result =
    (json && (json.result ?? json.reply ?? json.text ?? json.output)) ??
    (json && json.echo && json.echo.message) ??
    (json && json.data) ??
    null;

  const message =
    (json && (json.message || json.error || json.reason)) ||
    (bodyText ? bodyText.slice(0, 400) : null) ||
    null;

  return {
    ok: res.ok,
    status: res.status,
    headers: res.headers,
    raw: bodyText,
    json,
    result,
    message,
    error: res.ok ? null : (message || `HTTP ${res.status}`),
  };
}

const DEBUG = false;
const backoff = (attempts = 2) =>
  Array.from({ length: Math.max(0, attempts) }, (_ , i) => 250 * 2 ** i);

function isAnthropicCreditError(msg?: string) {
  return /credit balance|insufficient funds|billing|purchase|upgrade/i.test(String(msg || ""));
}

/* --------------------------- Core assistant call -------------------------- */
/**
 * callAssistant(operation, payload, provider, opts)
 * Sends to:   POST  {API_BASE}/ai-assistant
 * Adds x-operation header and operation in body (for Lambda convenience)
 * Retries transient errors; falls back Anthropic -> OpenAI on credit error
 */
async function callAssistant(
  operation: string,
  payload: Record<string, any> = {},
  provider: "openai" | "anthropic" = "openai",
  opts: { retries?: number; timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<any> {
  const url = `${API_BASE}${ROUTES.aiAssistant}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-provider": provider,
    "x-operation": operation,
    ...(opts.headers || {}),
  };
  const body = JSON.stringify({ provider, operation, ...payload });

  const attempts = Math.max(1, opts.retries ?? 1);
  const delays = backoff(attempts - 1);

  const attempt = async (prov: "openai" | "anthropic") => {
    const res = await fetchWithTimeout(
      url,
      { method: "POST", headers: { ...headers, "x-provider": prov }, body },
      opts.timeoutMs ?? 30000
    );
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);

    if (!norm.ok) {
      const err = new Error(norm.error || `HTTP ${res.status}`);
      (err as any).status = norm.status;
      (err as any).messageText = norm.message;
      (err as any).provider = prov;
      (err as any).raw = norm.raw;
      throw err;
    }
    return norm.json ?? { result: norm.result, raw: norm.raw };
  };

  const run = async (prov: "openai" | "anthropic") => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await attempt(prov);
      } catch (e: any) {
        const status: number | undefined = e?.status;
        const is5xx = !!status && status >= 500 && status <= 599;
        const is429 = status === 429;
        const isAbort = e?.name === "AbortError";

        // Anthropic credit fallback → one immediate swap to OpenAI
        if (prov === "anthropic" && isAnthropicCreditError(e?.messageText)) {
          if (DEBUG) console.warn("[api] Anthropic credit issue — falling back to OpenAI");
          return await attempt("openai");
        }

        const canRetry = is5xx || is429 || isAbort;
        if (i < delays.length && canRetry) {
          await new Promise((r) => setTimeout(r, delays[i]));
          continue;
        }
        throw e;
      }
    }
  };

  return run(provider);
}

/* --------------------------------- Routes --------------------------------- */

const ROUTES = {
  aiAssistant: "/ai-assistant",
  files: "/files",
} as const;

/* ------------------------------ AI Helpers -------------------------------- */
/** Generic chat/improve endpoint */
export function runAssistant(
  text: string,
  action: "improve" | "proofread" | "clarify" | "rewrite" = "improve",
  instructions = "",
  provider: "anthropic" | "openai" = "openai"
) {
  const op = "chat";
  return callAssistant(
    op,
    { message: text, text, action, instructions },
    provider,
    { retries: 2, timeoutMs: 45000 }  // Changed from 30000
  );
}
export function runRewrite(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callAssistant(
    "rewrite",
    { text },
    provider,
    { retries: 2, timeoutMs: 60000 }  // Changed from 25000
  );
}
export function runGrammar(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callAssistant(
    "grammar",
    { text },
    provider,
    { retries: 2, timeoutMs: 60000 }  // Changed from 25000
  );
}
export function runStyle(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callAssistant(
    "style",
    { text },
    provider,
    { retries: 2, timeoutMs: 60000 }  // Changed from 25000
  );
}
export function runReadability(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callAssistant(
    "readability",
    { text },
    provider,
    { retries: 2, timeoutMs: 60000 }  // Changed from 25000
  );
}
export function runPublishingPrep(
  meta: any,
  chapters: any[],
  options: any = {},
  provider: "anthropic" | "openai" = "openai"
) {
  return callAssistant(
    "publishing-prep",
    { meta, chapters, options },
    provider,
    { retries: 2, timeoutMs: 45000 }  // This one is fine as-is
  );
}
/* ------------------------- Convenience wrappers --------------------------- */
export const proofread = (
  text: string,
  instructions = "",
  provider: "anthropic" | "openai" = "openai"
) => runAssistant(text, "proofread", instructions, provider);

export const clarify = (
  text: string,
  instructions = "",
  provider: "anthropic" | "openai" = "openai"
) => runAssistant(text, "clarify", instructions, provider);

export const rewrite = (
  text: string,
  instructions = "",
  provider: "anthropic" | "openai" = "openai"
) => runAssistant(text, "rewrite", instructions, provider);

/* ------------------------- Publishing tools (REST) ------------------------ */

export type SynopsisRequest = {
  manuscriptText: string;
  title?: string;
  genre?: string;
  tone?: string;
  maxWords?: number;
};

export type SynopsisResponse = {
  synopsis: string;
  // allow extra metadata from Lambda
  [key: string]: any;
};

export async function generateSynopsis(
  input: SynopsisRequest,
  signal?: AbortSignal
): Promise<SynopsisResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/publishing/synopsis`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "synopsis",
        ...input,
      }),
      signal,
    },
    60000 // 60s timeout – synopses can be chunky
  );


   // ---------------------- Query / Logline / Blurb (REST) -----------------------

export type QueryLetterRequest = {
  synopsis: string;
  authorProfile?: string;   // stringified author info
  projectTitle?: string;
  genre?: string;
  tone?: string;
  extraDetails?: string;
};

export type QueryLetterResponse = {
  queryLetter: string;
  [key: string]: any;
};

export async function generateQueryLetter(
  input: QueryLetterRequest,
  signal?: AbortSignal
): Promise<QueryLetterResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/publishing/query-letter`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "query-letter",
        ...input,
      }),
      signal,
    },
    60000
  );

  const text = await res.text().catch(() => null);
  const norm = normalizeResponse(res, text);

  if (!norm.ok) {
    throw new Error(norm.error || `HTTP ${res.status}`);
  }

  if (norm.json && (norm.json as any).queryLetter) {
    return norm.json as QueryLetterResponse;
  }

  return {
    queryLetter:
      (norm.result as string) ||
      (norm.json as any)?.text ||
      "",
    ...(norm.json || {}),
  };
}

export type LoglineRequest = {
  synopsis: string;
  projectTitle?: string;
  genre?: string;
  tone?: string;
};

export type LoglineResponse = {
  logline: string;
  [key: string]: any;
};

export async function generateLogline(
  input: LoglineRequest,
  signal?: AbortSignal
): Promise<LoglineResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/publishing/logline`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "logline",
        ...input,
      }),
      signal,
    },
    45000
  );

  const text = await res.text().catch(() => null);
  const norm = normalizeResponse(res, text);

  if (!norm.ok) {
    throw new Error(norm.error || `HTTP ${res.status}`);
  }

  if (norm.json && (norm.json as any).logline) {
    return norm.json as LoglineResponse;
  }

  return {
    logline:
      (norm.result as string) ||
      (norm.json as any)?.text ||
      "",
    ...(norm.json || {}),
  };
}

export type BackCoverRequest = {
  synopsis: string;
  projectTitle?: string;
  genre?: string;
  tone?: string;
  audience?: string;
};

export type BackCoverResponse = {
  backCover: string;
  [key: string]: any;
};

export async function generateBackCoverBlurb(
  input: BackCoverRequest,
  signal?: AbortSignal
): Promise<BackCoverResponse> {
  const res = await fetchWithTimeout(
    `${API_BASE}/publishing/back-cover`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "back-cover",
        ...input,
      }),
      signal,
    },
    60000
  );

  const text = await res.text().catch(() => null);
  const norm = normalizeResponse(res, text);

  if (!norm.ok) {
    throw new Error(norm.error || `HTTP ${res.status}`);
  }

  if (norm.json && (norm.json as any).backCover) {
    return norm.json as BackCoverResponse;
  }

  return {
    backCover:
      (norm.result as string) ||
      (norm.json as any)?.text ||
      "",
    ...(norm.json || {}),
  };
}

  const text = await res.text().catch(() => null);
  const norm = normalizeResponse(res, text);

  if (!norm.ok) {
    throw new Error(norm.error || `HTTP ${res.status}`);
  }

  // Expecting Lambda to return { synopsis: "..." , ... }
  if (norm.json && (norm.json as any).synopsis) {
    return norm.json as SynopsisResponse;
  }

  // Fallback if Lambda puts text in `result` instead
  return {
    synopsis: (norm.result as string) || "",
    ...(norm.json || {}),
  };
}

/* --------------------------- File helper routes --------------------------- */
// These use the /files endpoint with different operations

export function filesPresignUpload(params: {
  userId: string;
  fileName: string;
  contentType: string;
  keyHint?: string;
}) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.files}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-operation": "presign-upload" },
      body: JSON.stringify({ operation: "presign-upload", ...params }),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${res.status}`);
    return norm.json;
  });
}

export function filesList(params: {
  userId: string;
  manuscriptId?: string;
  prefix?: string;
}) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.files}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${res.status}`);
    return norm.json;
  });
}

export function filesGet(params: { userId: string; key: string; expiresIn?: number }) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.files}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${res.status}`);
    return norm.json;
  });
}

export function filesDelete(params: { userId: string; manuscriptId?: string; fileKey?: string }) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.files}`,
    {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${res.status}`);
    return norm.json;
  });
}

/* --------------------------------- Ping ----------------------------------- */
export async function ping(provider: "openai" | "anthropic" = "openai") {
  try {
    const res = await callAssistant("ping", { ts: Date.now() }, provider, { retries: 0, timeoutMs: 8000 });
    return { ok: true, res };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
