// src/lib/aiService.js
// If you're using TS, rename to .ts and add types.

const API_BASE = import.meta.env.VITE_API_BASE;

// Small fetch wrapper that guarantees JSON or throws a readable error
async function jsonFetch(path, payload) {
  const url = `${API_BASE}/${path}`; // path like "assistant" | "grammar" | ...
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = isJson ? (body?.error || JSON.stringify(body)) : body?.slice(0, 300);
    throw new Error(`API ${res.status} ${res.statusText} at ${url}: ${msg}`);
  }
  if (!isJson) throw new Error(`Expected JSON from ${url}, got: ${body?.slice(0, 200)}`);
  return body;
}

/**
 * Your AiProvider calls:
 *  - aiService.rewrite({ mode, content, constraints })
 *  - aiService.summarize({ html, ...opts })
 *  - aiService.classifyTone({ html })
 *
 * Map those to the Lambda endpoints you have:
 *   grammar | style | assistant | readability | publishing-prep
 */
export const aiService = {
  /**
   * Rewrite/proofread content. We’ll route via the "assistant" endpoint
   * and pass an action + instructions. Lambda currently echoes improvedHtml.
   */
  async rewrite({ mode = "proofread", content = "", constraints = {} }) {
    // Build simple instruction text from constraints/mode
    const rules = [];
    if (constraints.preserveVoice) rules.push("preserve the author's voice");
    if (constraints.noEmDashes) rules.push("avoid em dashes");
    if (constraints.trimFiller) rules.push("remove filler words");
    const ruleText = rules.length ? `Please ${rules.join(", ")}.` : "";

    const instructions = {
      proofread:
        "Fix grammar, punctuation, capitalization, spacing, and clarity without changing meaning.",
      tighten:
        "Tighten prose and remove redundancy while preserving core meaning and tone.",
      formal:
        "Rewrite with a more formal tone suitable for professional publication.",
      casual:
        "Rewrite with a friendly, conversational tone without slang.",
    }[mode] || "Improve clarity and correctness without changing meaning.";

    const data = await jsonFetch("assistant", {
      text: content,
      action: "rewrite",
      instructions: `${instructions} ${ruleText}`.trim(),
    });

    // Normalize to what AiProvider expects
    return {
      editedHtml: data.improvedHtml ?? content,
      message: data.message,
      ok: data.ok !== false,
    };
  },

  /** Summarize the given HTML/text using the assistant endpoint */
  async summarize({ html = "", length = "short" }) {
    const data = await jsonFetch("assistant", {
      text: html,
      action: "summarize",
      instructions:
        length === "long"
          ? "Write a detailed summary with key points."
          : "Write a concise summary capturing the main ideas.",
    });

    return {
      summaryHtml: data.improvedHtml ?? html, // placeholder schema
      message: data.message,
      ok: data.ok !== false,
    };
  },

  /** Classify tone; returns a simple string */
  async classifyTone({ html = "" }) {
    const data = await jsonFetch("assistant", {
      text: html,
      action: "classify-tone",
      instructions:
        "Classify the tone in one or two words (e.g., formal, casual, urgent, persuasive). Return only the tone.",
    });

    // If your Lambda later returns {tone}, adapt here:
    const raw = data.improvedHtml || "";
    const tone = (raw || "").trim().split(/\s+/).slice(0, 3).join(" ");
    return { tone: tone || "unknown", ok: data.ok !== false };
  },

  /** Optional: expose the native endpoints if you want them directly */
  grammar(text) {
    return jsonFetch("grammar", { text });
  },
  style(text) {
    return jsonFetch("style", { text });
  },
  readability(text) {
    return jsonFetch("readability", { text });
  },
  publishingPrep(meta, chapters, options = {}) {
    return jsonFetch("publishing-prep", { meta, chapters, options });
  },
};
