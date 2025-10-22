// ManuscriptAI Lambda - Handles all Publishing Module AI requests
// Runtime: nodejs22.x   Handler: index.handler

export const handler = async (event) => {
  // HTTP API handles CORS. We only return content-type.
  const baseHeaders = { "Content-Type": "application/json" };

  // If OPTIONS ever reaches Lambda (rare with HTTP API CORS), answer OK
  const method = getMethod(event);
  if (method === "OPTIONS") {
    return ok({ message: "preflight ok" }, baseHeaders);
  }

  try {
    const body = parseBody(event);
    const endpoint = getEndpoint(event);

    console.log("Method:", method);
    console.log("Path:", getPath(event));
    console.log("Endpoint:", endpoint);
    console.log("Body keys:", body ? Object.keys(body) : []);

    let result;
    switch (endpoint) {
      case "grammar":
        result = await handleGrammar(body);
        break;
      case "style":
        result = await handleStyle(body);
        break;
      case "assistant":
        result = await handleAssistant(body);
        break;
      case "readability":
        result = await handleReadability(body);
        break;
      case "publishing-prep":
        result = await handlePublishingPrep(body);
        break;
      default:
        return notFound({ ok: false, error: `Unknown endpoint: ${endpoint}` }, baseHeaders);
    }

    return ok(result, baseHeaders);
  } catch (err) {
    console.error("Error:", err);
    return serverError({ ok: false, error: err?.message || "Server error" }, baseHeaders);
  }
};

// ---------- Helpers ----------
function ok(payload, headers) {
  return { statusCode: 200, headers, body: JSON.stringify(payload), isBase64Encoded: false };
}
function notFound(payload, headers) {
  return { statusCode: 404, headers, body: JSON.stringify(payload), isBase64Encoded: false };
}
function serverError(payload, headers) {
  return { statusCode: 500, headers, body: JSON.stringify(payload), isBase64Encoded: false };
}
function getMethod(event) {
  // HTTP API v2 / Function URL
  if (event?.requestContext?.http?.method) return event.requestContext.http.method;
  // REST API fallback
  if (event?.httpMethod) return event.httpMethod;
  return "POST";
}
function getPath(event) {
  // rawPath exists on HTTP API; path on REST API
  return (event?.rawPath || event?.path || "/") + (event?.rawQueryString ? `?${event.rawQueryString}` : "");
}
function getEndpoint(event) {
  // strip querystring and trailing slashes, then take the last segment
  const raw = getPath(event).split("?")[0].replace(/\/+$/, "");
  const parts = raw.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}
function parseBody(event) {
  if (!event?.body) return {};
  if (event.isBase64Encoded) {
    try { return JSON.parse(Buffer.from(event.body, "base64").toString("utf8")); } catch { return {}; }
  }
  if (typeof event.body === "string") {
    try { return JSON.parse(event.body); } catch { return {}; }
  }
  return event.body || {};
}

// ============= AI HANDLERS =============
async function handleGrammar(body) {
  const text = body?.text || body?.html || "";
  const suggestions = [];
  if (!text) return { ok: false, error: "No text provided" };

  if (/\bi\b(?![a-zA-Z])/g.test(text)) suggestions.push("Capitalization: The pronoun 'I' should always be capitalized.");
  if (/\s[,.!?;:]/g.test(text)) suggestions.push("Spacing: Remove space before punctuation marks.");
  if (/[.!?]\s+[a-z]/g.test(text)) suggestions.push("Capitalization: Sentences should start with capital letters.");
  if (/\b(their|there|they're)\b/gi.test(text)) suggestions.push("Common confusion: Check usage of their/there/they're.");
  if (/\b(your|you're)\b/gi.test(text)) suggestions.push("Common confusion: Check usage of your/you're.");

  return { ok: true, suggestions, text, improvedHtml: text };
}

async function handleStyle(body) {
  const text = body?.text || body?.html || "";
  const suggestions = [];
  if (!text) return { ok: false, error: "No text provided" };

  if (/\bvery\b/gi.test(text)) suggestions.push("Style: Consider using stronger words instead of 'very'.");
  if (/\breally\b/gi.test(text)) suggestions.push("Style: The word 'really' can often be removed without losing meaning.");
  if (/\bthat\b/gi.test(text)) suggestions.push("Style: Check if 'that' is necessary—often it can be removed.");
  if (/\b(just|actually|basically)\b/gi.test(text)) suggestions.push("Style: Consider trimming filler words (just/actually/basically).");
  if (/\.{3,}/g.test(text)) suggestions.push("Style: Use ellipses sparingly.");
  if (/\b(was|were|been|being)\s+\w+(ed|en)\b/gi.test(text)) suggestions.push("Style: Consider converting passive voice to active voice.");

  return { ok: true, suggestions, text, improvedHtml: text };
}

async function handleAssistant(body) {
  const text = body?.text || body?.html || "";
  const action = body?.action || "improve";
  const instructions = body?.instructions || "";
  if (!text) return { ok: false, error: "No text provided" };

  return {
    ok: true,
    action,
    instructions,
    improvedHtml: text,
    message: `AI Assistant received your text. Action: ${action}. Plug in your model here.`,
  };
}

async function handleReadability(body) {
  const text = body?.text || body?.html || "";
  if (!text) return { ok: false, error: "No text provided" };

  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.trim().length > 0);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  const avgWordsPerSentence = words.length / Math.max(1, sentences.length);
  const avgSyllablesPerWord = syllableCount / Math.max(1, words.length);
  const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);

  let gradeLevel = "Unknown";
  let readingLevel = "Unknown";
  if (fleschScore >= 90) { gradeLevel = "5th grade"; readingLevel = "Very Easy"; }
  else if (fleschScore >= 80) { gradeLevel = "6th grade"; readingLevel = "Easy"; }
  else if (fleschScore >= 70) { gradeLevel = "7th grade"; readingLevel = "Fairly Easy"; }
  else if (fleschScore >= 60) { gradeLevel = "8th-9th grade"; readingLevel = "Standard"; }
  else if (fleschScore >= 50) { gradeLevel = "10th-12th grade"; readingLevel = "Fairly Difficult"; }
  else if (fleschScore >= 30) { gradeLevel = "College"; readingLevel = "Difficult"; }
  else { gradeLevel = "College Graduate"; readingLevel = "Very Difficult"; }

  const suggestions = [];
  if (avgWordsPerSentence > 20) suggestions.push("Consider breaking up long sentences.");
  if (avgWordsPerSentence < 10) suggestions.push("Vary sentence length to improve flow.");

  return {
    ok: true,
    score: Math.round(fleschScore),
    gradeLevel,
    readingLevel,
    metrics: {
      sentences: sentences.length,
      words: words.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSyllablesPerWord: Math.round(avgSyllablesPerWord * 10) / 10,
    },
    suggestions,
  };
}

async function handlePublishingPrep(body) {
  const meta = body?.meta || {};
  const chapters = body?.chapters || [];
  if (!chapters.length) return { ok: false, error: "No chapters provided" };

  return {
    ok: true,
    prep: {
      queryLetter: `[AI-Generated Query Letter for "${meta.title || "Untitled"}"]`,
      synopsis: `[AI-Generated Synopsis]`,
      pitchParagraph: `[AI-Generated Pitch Paragraph]`,
      backCoverCopy: `[AI-Generated Back Cover Copy]`,
    },
    message: "Placeholder—integrate your AI service.",
  };
}

// ============= Utilities =============
function countSyllables(word) {
  let w = String(word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const vowels = "aeiouy";
  let count = 0, prevVowel = false;
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith("e")) count--;
  return Math.max(1, count);
}
