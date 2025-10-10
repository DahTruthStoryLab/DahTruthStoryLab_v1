// src/lib/aiService.js
const BASE = "/api/ai"; // Amplify rewrite -> Lambda

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  // Read raw text for easy debugging
  const raw = await res.text();
  let data = {};
  try { data = JSON.parse(raw); } catch {}

  if (!res.ok) {
    const msg = data?.error || `AI ${path} failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.raw = raw;
    throw err;
  }
  return data;
}

export const aiService = {
  // returns { editedHtml }
  async rewrite({ mode = "proofread", content = "", constraints = {} }) {
    const data = await post("/rewrite", { mode, content, constraints });
    return { editedHtml: data.editedHtml ?? content };
  },

  // placeholders for future features
  async summarize({ html, length = "short" }) {
    const data = await post("/summarize", { html, length });
    return { summaryHtml: data.summaryHtml ?? "" };
  },

  async classifyTone({ html }) {
    const data = await post("/tone", { html });
    return { tone: data.tone ?? "neutral" };
  },
};
