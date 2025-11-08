// src/hooks/useAIAssistant.js
// Manages AI operations, prompts, and provider selection

import { useState } from "react";
import {
  runGrammar,
  runStyle,
  runReadability,
  proofread,
  clarify,
  rewrite,
} from "../lib/api";
import { htmlToPlain, plainToSimpleHtml } from "../utils/textFormatting";

export function useAIAssistant() {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [instructions, setInstructions] = useState(
    "Keep ADOS cadence; pastoral but firm."
  );
  const [provider, setProvider] = useState("openai");

  const extractContent = (res) =>
    res?.result ??
    res?.reply ??
    res?.edited ??
    res?.text ??
    res?.output ??
    res?.echo?.message ??
    "";

  const runAI = async (mode, html, customInstructions = null, customProvider = null) => {
    setAiError(null);
    setAiBusy(true);

    try {
      const inputPlain = htmlToPlain(html || "");
      const useInstructions = customInstructions || instructions;
      const useProvider = customProvider || provider;

      let res;

      switch (mode) {
        case "clarify":
          res = await clarify(inputPlain, useInstructions, useProvider);
          break;
        case "rewrite":
          res = await rewrite(inputPlain, useInstructions, useProvider);
          break;
        case "grammar":
          res = await runGrammar(inputPlain, useProvider);
          break;
        case "style":
          res = await runStyle(inputPlain, useProvider);
          break;
        case "readability":
          res = await runReadability(inputPlain, useProvider);
          break;
        case "proofread":
        default:
          res = await proofread(inputPlain, useInstructions, useProvider);
          break;
      }

      const output = extractContent(res);

      if (output && output !== inputPlain) {
        const newHtml = plainToSimpleHtml(output);
        return newHtml;
      }

      return html;
    } catch (e) {
      console.error("[AI] error:", e);
      const errorMsg = e?.message || "AI request failed";
      setAiError(errorMsg);
      alert(errorMsg);
      return null;
    } finally {
      setAiBusy(false);
    }
  };

  const generateChapterPrompt = async (chapter) => {
    if (!chapter) return null;

    const simplePrompt = `For "${chapter.title}": Focus on clear narrative flow and character development. Maintain consistent tone and pacing.`;
    
    const useIt = window.confirm(
      `Suggested prompt for "${chapter.title}":\n\n${simplePrompt}\n\nUse this prompt?`
    );
    
    if (useIt) {
      setInstructions(simplePrompt);
      return simplePrompt;
    }

    return null;
  };

  return {
    runAI,
    aiBusy,
    aiError,
    setAiError,
    instructions,
    setInstructions,
    provider,
    setProvider,
    generateChapterPrompt,
  };
}
