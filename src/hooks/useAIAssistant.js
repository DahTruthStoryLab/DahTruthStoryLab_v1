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
  callAssistant,
} from "../lib/api";
import { htmlToPlain, plainToSimpleHtml } from "../utils/textFormatting";

export function useAIAssistant() {
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [instructions, setInstructions] = useState(
    "Keep ADOS cadence; pastoral but firm."
  );
  const [provider, setProvider] = useState("openai"); // "openai" | "anthropic"

  // Extract content from AI response
  const extractContent = (res) =>
    res?.result ??
    res?.reply ??
    res?.edited ??
    res?.text ??
    res?.output ??
    res?.echo?.message ??
    "";

  // Run AI operation
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
        // Convert AI response back to HTML with proper paragraphs
        const newHtml = plainToSimpleHtml(output);
        return newHtml;
      }

      return html; // No change from AI
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

  // Generate chapter-specific prompt using AI
  const generateChapterPrompt = async (chapter) => {
    if (!chapter) return null;

    setAiBusy(true);
    setAiError(null);

    try {
      const response = await callAssistant(
        "generate-writing-prompt",
        {
          chapterNumber: chapter.id,
          chapterTitle: chapter.title,
          chapterContent: htmlToPlain(chapter.content).slice(0, 500), // First 500 chars
          currentInstructions: instructions,
        },
        provider,
        { retries: 2, timeoutMs: 15000 }
      );

      const generatedPrompt = extractContent(response);
      
      if (generatedPrompt) {
        // Ask user if they want to use it
        const useIt = window.confirm(
          `AI suggests this prompt for "${chapter.title}":\n\n${generatedPrompt}\n\nUse this prompt?`
        );
        
        if (useIt) {
          setInstructions(generatedPrompt);
          return generatedPrompt;
        }
      }

      return null;
    } catch (e) {
      console.error("[AI] generate prompt error:", e);
      setAiError(e?.message || "Failed to generate prompt");
      return null;
    } finally {
      setAiBusy(false);
    }
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
