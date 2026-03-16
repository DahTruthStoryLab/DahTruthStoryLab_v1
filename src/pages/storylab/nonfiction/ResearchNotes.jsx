// src/pages/storylab/nonfiction/ResearchNotes.jsx
import React, { useState } from "react";
import { Search, Plus, Trash2, Sparkles } from "lucide-react";

const BRAND = { brown: "#78350f", amber: "#b45309", gold: "#d4af37", amberLight: "#fbbf24" };

export default function ResearchNotes() {
  const [notes, setNotes] = useState([{ id: 1, source: "", quote: "", paraphrase: "", commentary: "" }]);
  const [synthesis, setSynthesis] = useState("");
  const [loading, setLoading] = useState(false);

  function addNote() {
    setNotes(prev => [...prev, { id: Date.now(), source: "", quote: "", paraphrase: "", commentary: "" }]);
  }

  function removeNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  function updateNote(id, field, value) {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, [field]: value } : n));
  }

  async function synthesize() {
    const filled = notes.filter(n => n.source.trim() || n.quote.trim());
    if (!filled.length) return;
    setLoading(true);
    setSynthesis("");
    const formatted = filled.map((n, i) =>
      `Source ${i + 1}: ${n.source}\nQuote: ${n.quote}\nParaphrase: ${n.paraphrase}\nCommentary: ${n.commentary}`
    ).join("\n\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a research editor. Review these research notes and: (1) identify the strongest evidence, (2) flag any gaps in the argument, (3) suggest how these sources can be woven together into a coherent section. Be specific.\n\nNotes:\n${formatted}`
          }]
        })
      });
      const data = await res.json();
      setSynthesis(data.content?.[0]?.text || "No response received.");
    } catch { setSynthesis("Error connecting to AI. Please try again."); }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(135deg, #92400e, #d97706)` }}>
          <Search size={22} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "26px" }}>Research Notes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Source · Quote · Paraphrase · Your commentary</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {notes.map((note, i) => (
          <div key={note.id} className="rounded-2xl p-5" style={{ background: "#fffbeb", border: `1px solid ${BRAND.gold}25` }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold" style={{ color: BRAND.amber }}>Source {i + 1}</span>
              <button onClick={() => removeNote(note.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            {[
              { field: "source", label: "Source / Author", placeholder: "Book title, article, author..." },
              { field: "quote", label: "Direct Quote", placeholder: "Exact words from the source..." },
              { field: "paraphrase", label: "Paraphrase", placeholder: "In your own words..." },
              { field: "commentary", label: "Your Commentary", placeholder: "What this means for your argument..." },
            ].map(({ field, label, placeholder }) => (
              <div key={field} className="mb-3">
                <label className="text-xs font-semibold text-slate-500 block mb-1">{label}</label>
                <textarea value={note[field]} onChange={e => updateNote(note.id, field, e.target.value)}
                  placeholder={placeholder} rows={2}
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-800 resize-none focus:outline-none"
                  style={{ background: "white", border: `1px solid ${BRAND.gold}20`, fontFamily: "'EB Garamond', Georgia, serif", fontSize: "14px" }} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button onClick={addNote}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all hover:opacity-80"
          style={{ background: `${BRAND.amber}15`, color: BRAND.amber, border: `1px solid ${BRAND.amber}25` }}>
          <Plus size={14} /> Add Source
        </button>
        <button onClick={synthesize} disabled={loading || !notes.some(n => n.source.trim() || n.quote.trim())}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: `linear-gradient(135deg, ${BRAND.brown}, ${BRAND.amber})` }}>
          <Sparkles size={14} /> {loading ? "Analyzing..." : "Synthesize Sources"}
        </button>
      </div>

      {synthesis && (
        <div className="rounded-3xl p-6" style={{ background: "white", border: `1px solid ${BRAND.gold}20` }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} style={{ color: BRAND.gold }} />
            <h3 className="font-bold text-slate-800" style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "17px" }}>Research Synthesis</h3>
          </div>
          <div className="text-slate-700 leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: "15px", lineHeight: "1.8" }}>
            {synthesis}
          </div>
        </div>
      )}
    </div>
  );
}

