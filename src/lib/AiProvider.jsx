// src/lib/AiProvider.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { aiService } from "./aiService";

const AiCtx = createContext(null);

export function AiProvider({ children }) {
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState(null);

  const api = useMemo(() => ({
    busy,
    lastError,

    async proofread(html, opts = {}) {
      setBusy(true); setLastError(null);
      try {
        const { editedHtml } = await aiService.rewrite({
          mode: opts.mode || "proofread",
          content: html || "",
          constraints: { preserveVoice: true, noEmDashes: true, ...(opts.constraints || {}) },
        });
        return editedHtml;
      } catch (e) {
        setLastError(e);
        throw e;
      } finally {
        setBusy(false);
      }
    },

    // future shared ops
    async summarize(html, opts = {}) {
      setBusy(true); setLastError(null);
      try {
        const { summaryHtml } = await aiService.summarize({ html, ...opts });
        return summaryHtml;
      } catch (e) {
        setLastError(e);
        throw e;
      } finally {
        setBusy(false);
      }
    },

    async classifyTone(html) {
      setBusy(true); setLastError(null);
      try {
        const { tone } = await aiService.classifyTone({ html });
        return tone;
      } catch (e) {
        setLastError(e);
        throw e;
      } finally {
        setBusy(false);
      }
    },
  }), [busy, lastError]);

  return <AiCtx.Provider value={api}>{children}</AiCtx.Provider>;
}

export function useAI() {
  const ctx = useContext(AiCtx);
  if (!ctx) throw new Error("useAI must be used within <AiProvider>");
  return ctx;
}
