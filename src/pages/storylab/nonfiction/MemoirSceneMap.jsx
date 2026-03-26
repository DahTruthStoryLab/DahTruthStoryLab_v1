// src/pages/storylab/nonfiction/MemoirSceneMap.jsx
import React, { useState } from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { runAssistant } from "../../../lib/api";

const BRAND = { brown: "#78350f", amber: "#b45309", gold: "#d4af37", amberLight: "#fbbf24" };

const SCENE_MODES = [
  { id: "map", label: "Map a Scene", color: "#fbbf24", prompt: "Help me map a memoir scene. Analyze this scene for: scene goal (what the narrator wants), emotional turn (where the feeling shifts), sensory details (what is seen/heard/felt), and reflection (what the narrator understands now that they didn't then). Be specific and point to exact moments." },
  { id: "sensory", label: "Deepen Sensory Detail", color: "#d97706", prompt: "Revise this memoir scene to deepen the sensory detail. Replace abstractions with specific sensory experiences — what is seen, heard, smelled, touched, tasted. The body should be present in every scene. Return the revised scene with a note on what you added." },
  { id: "reflection", label: "Strengthen Reflection", color: "#b45309", prompt: "Strengthen the reflective layer of this memoir scene. The narrator's present-day consciousness should interpret the past event — not just report it. Add depth, complexity, and earned insight. Return the revised scene." },
  { id: "compress", label: "Compress the Scene", color: "#78350f", prompt: "Compress this memoir scene by 25-30%. Cut backstory, repetition, and over-explanation. Keep only the essential action, sensory detail, and reflection. Return the compressed scene." },
];

export default function MemoirSceneMap() {
  const [scene, setScene] = useState("");
  const [mode, setMode] = useState("map");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = SCENE_MODES.find(m => m.id === mode);

  async function analyze() {
    if (!scene.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await runAssistant(scene, "clarify", selected.prompt, "anthropic");
      setResult(res?.result || res?.text || "No response received.");
    } catch {
      setResult("Error connecting to AI. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, #92400e, ${BRAND.amberLight})` }}>
          <BookOpen size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Memoir Scene Map</h1>
          <p className="text-slate-500 text-sm mt-0.5">Scene goal · Emotional turn · Sensory detail · Reflection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {SCENE_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className="rounded-2xl px-4 py-4 text-left transition-all"
            style={{
              background: mode === m.id ? `${m.color}15` : "#fffbeb",
              border: `1px solid ${mode === m.id ? m.color + "50" : "#fde68a"}`,
              boxShadow: mode === m.id ? `0 4px 16px ${m.color}20` : "none",
            }}>
            <div className="w-2 h-2 rounded-full mb-2" style={{ background: m.color }} />
            <span className="font-semibold block" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", color: mode === m.id ? BRAND.brown : "#475569" }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-3xl p-6 mb-6" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}30` }}>
        <textarea value={scene} onChange={e => setScene(e.target.value)}
          placeholder="Paste your memoir scene or draft here..."
          rows={8} className="w-full rounded-2xl px-5 py-4 text-slate-800 resize-none focus:outline-none"
          style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.7", border: `1px solid ${BRAND.gold}25`, background: "white" }} />
        <button onClick={analyze} disabled={loading || !scene.trim()}
          className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, #92400e, ${BRAND.amberLight})` }}>
          {loading ? "Analyzing..." : `Apply — ${selected?.label}`}
        </button>
      </div>

      {result && (
        <div className="rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.gold}20` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Scene Analysis</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "16px", lineHeight: "1.8" }}>
            {result}
          </div>
        </div>
      )}
    </div>
  );
}
