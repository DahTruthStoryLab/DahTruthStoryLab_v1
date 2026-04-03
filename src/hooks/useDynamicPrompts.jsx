// src/hooks/useDynamicPrompts.js
// Shared hook for AI-generated dynamic prompts across all StoryLab modules
//
// Usage:
//   const { prompts, loading, refresh, updateWithText } = useDynamicPrompts({
//     module: "Essay Builder",
//     topics: ["Thesis Statement", "Claims & Evidence", ...],
//     genre: "nonfiction", // or "poetry", "fiction"
//   });
//
// Returns:
//   prompts       — object keyed by topic title with dynamic prompt string
//   loading       — true while AI is generating
//   refresh()     — manually regenerate all prompts
//   updateWithText(text) — regenerate prompts using the writer's actual pasted text

import { useState, useEffect, useCallback, useRef } from "react";
import { runAssistant } from "../lib/api";

// ── Cache so prompts survive re-renders within the same session ──
const promptCache = new Map();

function cacheKey(module, topics) {
  return `${module}::${topics.join("|")}`;
}

export function useDynamicPrompts({ module, topics, genre = "general" }) {
  const [prompts, setPrompts]   = useState({});
  const [loading, setLoading]   = useState(false);
  const mountedRef               = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // ── Generate prompts without writer text ──────────────────
  const generate = useCallback(async (writerText = "") => {
    if (!topics || topics.length === 0) return;

    const key = writerText
      ? `${cacheKey(module, topics)}::text`
      : cacheKey(module, topics);

    // Use cache if available and no writer text (text-based prompts are always fresh)
    if (!writerText && promptCache.has(key)) {
      setPrompts(promptCache.get(key));
      return;
    }

    setLoading(true);

    const textSection = writerText
      ? `\n\nThe writer has shared this work:\n"""\n${writerText.slice(0, 2000)}\n"""\n\nFor each topic, create a prompt that directly engages with specific details, lines, phrases, or patterns in their actual text above. Reference real examples from their work.`
      : `\n\nCreate fresh, varied prompts. Each prompt should be different from the standard textbook advice — surprising, specific, and actionable for a ${genre} writer.`;

    const instruction = `You are an expert ${genre} writing coach inside DahTruth StoryLab.

For the module "${module}", generate one short, specific, actionable writing prompt for each of these topics:
${topics.map((t, i) => `${i + 1}. ${t}`).join("\n")}
${textSection}

Rules:
- Each prompt must be 1-2 sentences maximum
- Be direct and specific — no generic advice
- Vary the style: sometimes a question, sometimes a directive, sometimes a challenge
- Do NOT use phrases like "consider" or "think about" — be more direct
- Reference specific craft moves, not vague concepts

Respond ONLY with valid JSON in this exact format, no other text:
{
  ${topics.map(t => `"${t}": "prompt text here"`).join(",\n  ")}
}`;

    try {
      const res = await runAssistant(instruction, "clarify", "", "anthropic");
      const raw = res?.result || res?.text || res?.output || "";

      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate all topics are present
      const valid = topics.every(t => typeof parsed[t] === "string");
      if (!valid) throw new Error("Missing topics in response");

      if (mountedRef.current) {
        if (!writerText) promptCache.set(key, parsed);
        setPrompts(parsed);
      }
    } catch (err) {
      console.warn("[useDynamicPrompts] Failed to generate prompts:", err);
      // Fail silently — keep existing prompts or empty state
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [module, topics, genre]);

  // ── Auto-generate on mount ────────────────────────────────
  useEffect(() => {
    generate();
  }, [generate]);

  // ── Public API ────────────────────────────────────────────
  const refresh = useCallback(() => {
    // Clear cache for this module so we get fresh prompts
    const key = cacheKey(module, topics);
    promptCache.delete(key);
    generate();
  }, [generate, module, topics]);

  const updateWithText = useCallback((text) => {
    if (!text?.trim()) return;
    generate(text);
  }, [generate]);

  return { prompts, loading, refresh, updateWithText };
}
