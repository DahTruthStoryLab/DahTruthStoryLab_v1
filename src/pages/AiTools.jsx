// src/pages/AiTools.jsx
import React, { useState } from "react";
import { useAI } from "../lib/AiProvider";

export default function AiTools() {
  const ai = useAI();
  const [input, setInput] = useState("<p>I cant beleive teh speed.</p>");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");

  const run = async (mode) => {
    try {
      setBusy(true);
      setLog(`Calling AI (${mode})…`);
      const edited = await ai.proofread(input, { mode });
      setOutput(edited || "");
      setLog(`OK (${mode})`);
    } catch (e) {
      setLog(`Error: ${e.message || e}`);
      alert(e.message || "AI request failed");
    } finally {
      setBusy(false);
    }
  };

  // quick health check for GET /api/ai/rewrite
  const checkHealth = async () => {
    try {
      setBusy(true);
      setLog("Health: GET /api/ai/rewrite");
      const res = await fetch("/api/ai/rewrite", { method: "GET" });
      const text = await res.text();
      setLog(`Status: ${res.status} | ${text.slice(0, 200)}…`);
    } catch (e) {
      setLog(`Health error: ${e.message || e}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-3">AI Tools</h1>
      <p className="text-slate-600 mb-4">
        Paste HTML/text below and test AI Proofread/Clarify. This page doesn’t touch chapters or local storage.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <div className="text-sm text-slate-600 mb-1">Input</div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-56 border rounded-lg p-3"
            spellCheck={false}
          />
        </div>
        <div>
          <div className="text-sm text-slate-600 mb-1">Output</div>
          <textarea
            value={output}
            readOnly
            className="w-full h-56 border rounded-lg p-3 bg-slate-50"
            spellCheck={false}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => run("proofread")}
          disabled={busy}
          className="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          AI: Proofread
        </button>
        <button
          onClick={() => run("clarify")}
          disabled={busy}
          className="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          AI: Clarify
        </button>
        <button
          onClick={checkHealth}
          disabled={busy}
          className="px-3 py-2 rounded-md border bg-white hover:bg-slate-50 disabled:opacity-60"
        >
          Health Check
        </button>
      </div>

      <div className="mt-3 text-sm text-slate-600">
        <b>Log:</b> {log}
      </div>
    </div>
  );
}
