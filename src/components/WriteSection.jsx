// src/components/WriteSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  Plus, Save, Eye, FileText, Upload, Download, RotateCcw, Clock,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Bold, Italic, Underline,
  Target, BookOpen, Trash2, Bot, SlidersHorizontal
} from "lucide-react";

/** ─────────────────────────────────────────────────────────────
 *  Config
 *  - AI endpoint: set VITE_AI_URL in env for prod; dev falls back to /api/ai/rewrite
 *  - Storage key: project state in localStorage
 *  ────────────────────────────────────────────────────────────*/
const AI_URL = import.meta.env.VITE_AI_URL || "/api/ai/rewrite";
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

/** ─────────────────────────────────────────────────────────────
 *  Storage helpers
 *  ────────────────────────────────────────────────────────────*/
function loadState() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
}
function initialState() {
  return loadState() || {
    book: { title: "Untitled Book", targetWords: 50000 },
    chapters: [
      {
        id: Date.now(),
        title: "Chapter 1: Untitled",
        content: "",
        wordCount: 0,
        lastEdited: "Just now",
        status: "draft",
      },
    ],
    tocOutline: [],
  };
}

/** ─────────────────────────────────────────────────────────────
 *  Utilities
 *  ────────────────────────────────────────────────────────────*/
const countWords = (html = "") =>
  (html || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\u00A0/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const computeReadability = (html = "") => {
  const text = (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\u00A0/g, " ")
    .trim();
  const words = (text.match(/\b[\w’'-]+\b/g) || []).length;
  const sentences = Math.max(
    1,
    text.split(/[.!?]+["')\]]*\s+/).filter((s) => s.trim().length > 0).length
  );
  const syllables = (text.match(/[aeiouy]{1,2}/gi) || []).length;
  const FRE = Math.round(206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(words, 1)));
  const FKGL = Math.max(1, Math.round(0.39 * (words / sentences) + 11.8 * (syllables / Math.max(words, 1)) - 15.59));
  return { words, sentences, fleschEase: FRE, grade: FKGL };
};

const findHeadings = (html) => {
  const out = [];
  const re = /<(h[1-3])[^>]*>(.*?)<\/\1>/gi;
  let m, i = 0;
  while ((m = re.exec(html || "")) !== null) {
    const level = Number(m[1].slice(1));
    const title = (m[2] || "").replace(/<[^>]+>/g, "").trim();
    out.push({ level, title, line: ++i });
  }
  return out;
};

const escapeHtml = (s = "") =>
  s.replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

/** ─────────────────────────────────────────────────────────────
 *  Component
 *  ────────────────────────────────────────────────────────────*/
export default function WriteSection() {
  const initial = useMemo(initialState, []);
  const [book, setBook] = useState(initial.book);
  const [chapters, setChapters] = useState(initial.chapters);
  const [selectedId, setSelectedId] = useState(initial.chapters[0]?.id || null);
  const [showPreview, setShowPreview] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMode, setAiMode] = useState("Fiction");
  const [stats, setStats] = useState(null);

  const selected = chapters.find((c) => c.id === selectedId) || null;

  // persist (debounced-ish)
  useEffect(() => {
    const t = setTimeout(() => {
      const s = loadState() || {};
      saveState({
        book,
        chapters,
        tocOutline: s.tocOutline || [],
      });
    }, 300);
    return () => clearTimeout(t);
  }, [book, chapters]);

  // live sync across tabs
  useEffect(() => {
    const sync = () => {
      const s = loadState();
      if (!s) return;
      if (s.book) setBook(s.book);
      if (Array.isArray(s.chapters)) {
        setChapters(s.chapters);
        if (!s.chapters.find((c) => c.id === selectedId)) {
          setSelectedId(s.chapters[0]?.id || null);
        }
      }
    };
    window.addEventListener("project:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("project:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, [selectedId]);

  // update stats as content changes
  useEffect(() => {
    if (!selected) return;
    setStats(computeReadability(selected.content || ""));
  }, [selected?.content]);

  const totalWords = chapters.reduce((s, c) => s + (c.wordCount || countWords(c.content || "")), 0);

  /** ---------- Chapter CRUD ---------- */
  const addChapter = () => {
    const id = Date.now();
    const ch = {
      id,
      title: `Chapter ${chapters.length + 1}: Untitled`,
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    };
    setChapters((prev) => [ch, ...prev]);
    setSelectedId(id);
  };
  const deleteChapter = (id) => {
    const next = chapters.filter((c) => c.id !== id);
    setChapters(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
  };
  const updateSelected = (partial) => {
    if (!selected) return;
    const updated = { ...selected, ...partial };
    if ("content" in partial) {
      updated.wordCount = countWords(updated.content || "");
      updated.lastEdited = "Just now";
    }
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };
  const explicitSave = () => {
    if (!selected) return;
    const updated = { ...selected, lastEdited: "Just now", wordCount: countWords(selected.content || "") };
    setChapters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    const s = loadState() || {};
    saveState({ book, chapters: chapters.map((c) => (c.id === updated.id ? updated : c)), tocOutline: s.tocOutline || [] });
  };

  /** ---------- Export ---------- */
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ book, chapters }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "story_export.json"; a.click(); URL.revokeObjectURL(url);
  };

  /** ---------- TOC push (H1–H3 across all chapters) ---------- */
  const pushTOC = () => {
    const outline = [];
    chapters.forEach((ch, idx) => {
      findHeadings(ch.content || "").forEach((h) => {
        outline.push({
          chapterId: ch.id,
          chapterIndex: idx,
          chapterTitle: ch.title,
          level: h.level,
          heading: h.title,
          line: h.line,
        });
      });
    });
    const s = loadState() || {};
    s.tocOutline = outline; saveState(s);
    alert("TOC updated from H1/H2/H3 across chapters. Open the TOC page to view.");
  };

  /** ---------- Imports ---------- */
  const onImportDocx = async (e) => {
    const file = e.target.files?.[0]; if (!file || !selected) return;
    const JSZip = (await import("jszip")).default;
    const buf = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml").async("text");
    const text = xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/\n{3,}/g, "\n\n").trim();
    const html = text.split(/\n{2,}/).map((p) => `<p>${escapeHtml(p)}</p>`).join("\n");
    updateSelected({ content: (selected.content || "") + (selected.content ? "\n" : "") + html });
    e.target.value = "";
  };
  const onImportHtml = async (e) => {
    const file = e.target.files?.[0]; if (!file || !selected) return;
    const txt = await file.text();
    let clean = txt
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, (_m, p1) => `<h1>${p1}</h1>`)
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, (_m, p1) => `<h2>${p1}</h2>`)
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, (_m, p1) => `<h3>${p1}</h3>`)
      .replace(/<li[^>]*>(.*?)<\/li>/gi, (_m, p1) => `<p>• ${p1}</p>`)
      .replace(/<br\s*\/?>/gi, "<br/>")
      .replace(/\u00A0/g, " ");
    updateSelected({ content: (selected.content || "") + (selected.content ? "\n" : "") + clean });
    e.target.value = "";
  };

  /** ---------- AI ---------- */
  async function runAI(mode = "proofread") {
    if (!selected) return;
    try {
      setAiBusy(true);
      const res = await fetch(AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, // "proofread" | "clarify"
          content: selected.content || "",
          constraints: { preserveVoice: true, noEmDashes: true },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `AI error (${res.status})`);
      const edited = data.editedHtml ?? data.html ?? "";
      if (!edited) throw new Error("AI response missing 'editedHtml'.");
      updateSelected({ content: edited });
    } catch (e) {
      alert(e.message || "AI request failed");
    } finally {
      setAiBusy(false);
    }
  }

  /** ---------- Quill config ---------- */
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "code-block"],
      ["link", "image"],
      ["clean"],
    ],
  }), []);

  /** ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-[color:var(--color-base,#f6faff)] text-[color:var(--color-ink,#0a2540)]">
      {/* Top bar */}
      <div className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="font-semibold">Write your story</div>
          <div className="ml-auto flex gap-2">
            <button onClick={addChapter} className="px-3 py-1.5 rounded-lg border bg-white hover:bg-white/90 inline-flex items-center gap-2">
              <Plus size={16} /> New
            </button>
            <button onClick={exportJSON} className="px-3 py-1.5 rounded-lg text-white bg-indigo-600 hover:opacity-90 inline-flex items-center gap-2">
              <FileText size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[18rem_1fr_18rem] gap-6">
        {/* LEFT: chapters */}
        <aside className="space-y-2">
          <div className="rounded-2xl bg-white/80 border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">Chapters</div>
              <button onClick={addChapter} title="New chapter" className="p-1 rounded border bg-white"><Plus size={16} /></button>
            </div>
            <div className="space-y-2">
              {chapters.map((ch) => (
                <div key={ch.id} className={`rounded-lg border p-2 ${selectedId === ch.id ? "bg-indigo-50 border-indigo-200" : "bg-white/70 border-white/60"}`}>
                  <button onClick={() => setSelectedId(ch.id)} className="text-left w-full font-medium">{ch.title}</button>
                  <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                    <span>{(ch.wordCount || countWords(ch.content || "")).toLocaleString()} words</span> • <span>{ch.lastEdited || "—"}</span>
                    <button onClick={() => deleteChapter(ch.id)} title="Delete" className="ml-auto text-rose-600 hover:text-rose-700"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: editor */}
        <section className="space-y-3">
          {/* toolbar row */}
          <div className="rounded-2xl bg-white/80 border p-2 flex flex-wrap items-center gap-2">
            {/* visual helpers only; Quill toolbar handles real formatting */}
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Heading1 size={14}/>H1</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Heading2 size={14}/>H2</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Heading3 size={14}/>H3</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Bold size={14}/>B</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Italic size={14}/>I</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Underline size={14}/>U</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><List size={14}/>•</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><ListOrdered size={14}/>1.</span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded border bg-white"><Quote size={14}/>“”</span>

            <span className="mx-2 w-px h-5 bg-gray-200" />

            {/* AI */}
            <button disabled={aiBusy} onClick={() => runAI("proofread")} className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm">
              {aiBusy ? "AI…working" : "AI: Proofread"}
            </button>
            <button disabled={aiBusy} onClick={() => runAI("clarify")} className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm">
              {aiBusy ? "AI…working" : "AI: Clarify"}
            </button>

            <span className="mx-2 w-px h-5 bg-gray-200" />

            {/* Imports */}
            <label className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm cursor-pointer">
              <Upload size={14}/> DOCX
              <input type="file" accept=".docx" className="hidden" onChange={onImportDocx}/>
            </label>
            <label className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm cursor-pointer">
              <Upload size={14}/> HTML
              <input type="file" accept=".html,.htm,.xhtml" className="hidden" onChange={onImportHtml}/>
            </label>

            <span className="mx-2 w-px h-5 bg-gray-200" />

            <button onClick={pushTOC} className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm"><BookOpen size={14}/> Push TOC</button>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => setShowPreview(v => !v)} className="px-2 py-1 rounded-md border bg-white hover:bg-gray-50 text-sm">
                <Eye size={14}/> {showPreview ? "Editor" : "Preview"}
              </button>
              <button onClick={explicitSave} className="px-3 py-1.5 rounded-md bg-indigo-600 text-white hover:opacity-90 text-sm inline-flex items-center gap-2">
                <Save size={14}/> Save
              </button>
            </div>
          </div>

          {/* chapter header */}
          <div className="rounded-xl border bg-white/80 px-4 py-3 flex items-center justify-between">
            <input
              type="text"
              value={selected?.title || ""}
              onChange={(e) => updateSelected({ title: e.target.value })}
              className="text-lg font-semibold bg-transparent outline-none w-full"
              placeholder="Chapter title"
            />
            <div className="ml-4 text-sm text-gray-600 hidden sm:flex items-center gap-2">
              <Target size={14}/> {(selected?.wordCount || 0).toLocaleString()} words
            </div>
          </div>

          {/* editor */}
          <div className="rounded-2xl border bg-white/80 p-3">
            {showPreview ? (
              <div className="prose max-w-none text-[color:var(--color-ink,#0a2540)]">
                <div dangerouslySetInnerHTML={{__html: `<h1>${selected?.title || ""}</h1>${selected?.content || ""}`}} />
              </div>
            ) : (
              <ReactQuill
                theme="snow"
                value={selected?.content || ""}
                onChange={(v) => updateSelected({ content: v })}
                placeholder="Start writing your story here…"
                modules={quillModules}
              />
            )}
          </div>

          {/* footer bar */}
          <div className="rounded-xl border bg-white/80 px-4 py-2 text-sm text-gray-600 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Clock size={14}/> {selected?.lastEdited || "—"}</span>
              <span className="flex items-center gap-1"><RotateCcw size={14}/> Auto-save on change</span>
            </div>
            {stats && (
              <div className="flex items-center gap-4">
                <span>Sentences: <b>{stats.sentences}</b></span>
                <span>Flesch: <b>{stats.fleschEase}</b></span>
                <span>Grade: <b>{stats.grade}</b></span>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: project stats / AI mode */}
        <aside className="space-y-3">
          <div className="rounded-2xl bg-white/80 border p-4">
            <div className="font-semibold mb-2">Project</div>
            <div className="text-sm text-gray-700">
              <div className="flex justify-between"><span>Total words</span><b>{totalWords.toLocaleString()}</b></div>
              <div className="flex justify-between mt-1"><span>Target</span><b>{(book.targetWords || 0).toLocaleString()}</b></div>
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 border p-4">
            <div className="flex items-center gap-2 font-semibold mb-2"><Bot size={16}/> AI Coach</div>
            <div className="flex items-center gap-2 text-sm"><SlidersHorizontal size={14}/>
              <select value={aiMode} onChange={(e)=>setAiMode(e.target.value)} className="border rounded px-2 py-1 w-full">
                {["Fiction","Poetry","Screenplay","Memoir","Non-fiction"].map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button disabled={aiBusy} onClick={()=>runAI("proofread")} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 text-sm">Grammar</button>
              <button disabled={aiBusy} onClick={()=>runAI("clarify")} className="px-2 py-1 rounded border bg-white hover:bg-gray-50 text-sm">Clarity</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
