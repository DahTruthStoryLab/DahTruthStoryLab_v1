/* =============================================================================
   DahTruth Story Lab - API Client (TypeScript)
   - Works with both legacy flat routes (/grammar, /style, …)
     AND the unified route:  /assistant?operation=<op>
   - Timeouts, retries, readable errors
   - Anthropic "credit balance" -> auto fallback to OpenAI once
   - Normalized responses so UI can always read `.result`
   ========================================================================== */

/* ------------------------------- API BASE --------------------------------- */

// src/lib/api.ts (top)
const RAW_API_BASE: string = import.meta.env.VITE_API_BASE || "/api";

export const API_BASE: string = String(RAW_API_BASE).replace(/\/+$/, "");

if (typeof window !== "undefined") {
  (window as any).__API_BASE__ = API_BASE;
}

// Expose in browser console to help diagnose prod issues quickly
;(window as any).__API_BASE__ = API_BASE;

if (!API_BASE || API_BASE.startsWith("/")) {
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
const backoff = (attempts = 2) => Array.from({ length: Math.max(0, attempts) }, (_ , i) => 250 * 2 ** i);

function isAnthropicCreditError(msg?: string) {
  return /credit balance|insufficient funds|billing|purchase|upgrade/i.test(String(msg || ""));
}

/* --------------------------- Core assistant call -------------------------- */
/**
 * callAssistant(operation, payload, provider, opts)
 * Sends to:   POST  {API_BASE}/assistant?operation=<op>
 * Adds x-provider header and provider in body (for Lambda convenience)
 * Retries transient errors; falls back Anthropic -> OpenAI on credit error
 */
async function callAssistant(
  operation: string,
  payload: Record<string, any> = {},
  provider: "openai" | "anthropic" = "openai",
  opts: { retries?: number; timeoutMs?: number; headers?: Record<string, string> } = {}
): Promise<any> {
  const url = `${API_BASE}/assistant?operation=${encodeURIComponent(operation)}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-provider": provider,
    ...(opts.headers || {}),
  };
  const body = JSON.stringify({ provider, ...payload });

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
      const err = new Error(norm.error || `HTTP ${norm.status}`);
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

/* ---------------------------- Legacy route call --------------------------- */
/** Try a legacy flat route first; if 404/405, fallback to assistant op */
async function callLegacyOrAssistant(
  routePath: string,
  operation: string,
  payload: Record<string, any>,
  provider: "openai" | "anthropic" = "openai",
  opts: { retries?: number; timeoutMs?: number } = {}
) {
  // 1) Try legacy route if it exists in your API
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}${routePath}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-operation": operation, "x-provider": provider },
        body: JSON.stringify({ provider, operation, ...payload }),
      },
      opts.timeoutMs ?? 25000
    );
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);

    // If legacy returns 404/405, transparently fall back to assistant op
    if (!norm.ok && (norm.status === 404 || norm.status === 405)) {
      return await callAssistant(operation, payload, provider, opts);
    }
    if (!norm.ok) {
      const err = new Error(norm.error || `HTTP ${norm.status}`);
      (err as any).status = norm.status;
      (err as any).raw = norm.raw;
      throw err;
    }
    return norm.json ?? { result: norm.result, raw: norm.raw };
  } catch (e: any) {
    // Network/timeout etc → try assistant as a backup
    if (e?.status === 404 || e?.status === 405 || !e?.status) {
      return await callAssistant(operation, payload, provider, opts);
    }
    throw e;
  }
}

/* --------------------------------- Routes --------------------------------- */

const ROUTES = {
  assistant: "/assistant",
  grammar: "/grammar",
  rewrite: "/rewrite",
  style: "/style",
  publishingPrep: "/publishing-prep",
  readability: "/readability",

  // Files (only if you created these routes in API Gateway)
  filesPresignUpload: "/files/presign-upload",
  filesList: "/files/list",
  filesGet: "/files/get",
  filesDelete: "/files/delete",
} as const;

/* ------------------------------ AI Helpers -------------------------------- */
/** Generic chat/improve endpoint (your ComposePage uses these wrappers) */
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
    { retries: 2, timeoutMs: 30000 }
  );
}

export function runRewrite(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callLegacyOrAssistant(
    ROUTES.rewrite,
    "rewrite",
    { text },
    provider,
    { retries: 2, timeoutMs: 25000 }
  );
}

export function runGrammar(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callLegacyOrAssistant(
    ROUTES.grammar,
    "grammar",
    { text },
    provider,
    { retries: 2, timeoutMs: 25000 }
  );
}

export function runStyle(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callLegacyOrAssistant(
    ROUTES.style,
    "style",
    { text },
    provider,
    { retries: 2, timeoutMs: 25000 }
  );
}

export function runReadability(
  text: string,
  provider: "anthropic" | "openai" = "openai"
) {
  return callLegacyOrAssistant(
    ROUTES.readability,
    "readability",
    { text },
    provider,
    { retries: 2, timeoutMs: 25000 }
  );
}

export function runPublishingPrep(
  meta: any,
  chapters: any[],
  options: any = {},
  provider: "anthropic" | "openai" = "openai"
) {
  // Send a compact payload to Lambda (some gateways limit body size)
  return callLegacyOrAssistant(
    ROUTES.publishingPrep,
    "publishing-prep",
    { meta, chapters, options },
    provider,
    { retries: 2, timeoutMs: 45000 }
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

/* --------------------------- File helper routes --------------------------- */
// Only useful if you created these routes on your API.

export function filesPresignUpload(params: {
  userId: string;
  fileName: string;
  contentType: string;
  keyHint?: string;
}) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.filesPresignUpload}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${norm.status}`);
    return norm.json;
  });
}

export function filesList(params: {
  userId: string;
  manuscriptId?: string;
  prefix?: string;
}) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.filesList}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${norm.status}`);
    return norm.json;
  });
}

export function filesGet(params: { userId: string; key: string; expiresIn?: number }) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.filesGet}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${norm.status}`);
    return norm.json;
  });
}

export function filesDelete(params: { userId: string; manuscriptId?: string; fileKey?: string }) {
  return fetchWithTimeout(
    `${API_BASE}${ROUTES.filesDelete}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    },
    25000
  ).then(async (res) => {
    const text = await res.text().catch(() => null);
    const norm = normalizeResponse(res, text);
    if (!norm.ok) throw new Error(norm.error || `HTTP ${norm.status}`);
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
