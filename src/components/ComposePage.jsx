// src/components/ComposePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import { ArrowLeft, Bot, Save, Maximize2, Minimize2 } from "lucide-react";

// ✅ Add this line below your existing imports:
import { useAI } from "../lib/AiProvider";

/* ------- Fonts whitelist (family + size) ------- */
const Font = Quill.import("formats/font");
const FONT_WHITELIST = [
  "sans", "serif", "mono",
  "arial", "calibri", "cambria", "timesnewroman",
  "georgia", "garamond", "verdana", "couriernew",
];
Font.whitelist = FONT_WHITELIST;
Quill.register(Font, true);

const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

/* ------- API + storage ------- */
// Always go through Amplify rewrite (prod + dev)
const AI_URL = "/api/ai/rewrite";
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

/* ------- Small helpers ------- */
const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
};
const ensureFirstChapter = (chapters) => {
  if (Array.isArray(chapters) && chapters.length) return chapters;
  return [
    {
      id: Date.now(),
      title: "Chapter 1: Untitled",
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    },
  ];
};

/* ==============================
   Compose Page (new, isolated)
   ============================== */
export default function ComposePage() {
  const ai = useAI();
  const initial = useMemo(loadState, []);
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(ensureFirstChapter(initial?.chapters || []));
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((c) => c.id === selectedId) || chapters[0];

  const [title, setTitle] = useState(selected.title || "");
  const [html, setHtml] = useState(selected.content || "");
  const [isFS, setIsFS] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const editorRef = useRef(null);

  /* keep local editor state synced with selected chapter */
  useEffect(() => {
    const sel = chapters.find((c) => c.id === selectedId);
    if (!sel) return;
    setTitle(sel.title || "");
    setHtml(sel.content || "");
  }, [selectedId, chapters]);

  /* persist project on change (debounced-ish) */
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
    }, 400);
    return () => clearTimeout(t);
  }, [book, chapters]);

  /* Proper Quill toolbar (wired + fonts) */
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: FONT_WHITELIST }],
        [{ size: Size.whitelist }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  /* SAVE (updates chapters + writes localStorage immediately) */
  const handleSave = () => {
    if (!selected?.id) return;

    const updated = {
      ...selected,
      title: title || selected.title,
      content: html,
      wordCount: countWords(html),
      lastEdited: "Just now",
      status: selected.status || "draft",
    };

    setChapters((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      // write-through persist so refresh sees it right away
      const current = loadState() || {};
      saveState({
        book,
        chapters: next,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
      return next;
    });
  };

  /* AI: proofread/clarify via proxy — apply to editor AND chapter */
  // make sure at the top of the file you have: import { useAI } from "../lib/AiProvider";
const ai = useAI();

/* AI: proofread/clarify via shared layer — apply to editor AND chapter */
const runAI = async (mode = "proofread") => {
    try {
      setAiBusy(true);
      // use shared layer
      const edited = await ai.proofread(html || "", { mode, noEmDashes: true });
      // apply to editor
      setHtml(edited ?? html);
      
   // src/components/ComposePage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import "react-quill/dist/quill.snow.css";
import { ArrowLeft, Bot, Save, Maximize2, Minimize2 } from "lucide-react";
import { useAI } from "../lib/AiProvider";

/* ------- Fonts whitelist (family + size) ------- */
const Font = Quill.import("formats/font");
const FONT_WHITELIST = [
  "sans", "serif", "mono",
  "arial", "calibri", "cambria", "timesnewroman",
  "georgia", "garamond", "verdana", "couriernew",
];
Font.whitelist = FONT_WHITELIST;
Quill.register(Font, true);

const Size = Quill.import("formats/size");
Size.whitelist = ["small", false, "large", "huge"];
Quill.register(Size, true);

/* ------- Storage helpers ------- */
const STORAGE_KEY = "dahtruth-story-lab-toc-v3";

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("project:change"));
  } catch {}
};

/* ------- Small helpers ------- */
const countWords = (html = "") => {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text ? text.split(/\s+/).length : 0;
};
const ensureFirstChapter = (chapters) => {
  if (Array.isArray(chapters) && chapters.length) return chapters;
  return [
    {
      id: Date.now(),
      title: "Chapter 1: Untitled",
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
    },
  ];
};

/* ==============================
   Compose Page (isolated writer)
============================== */
export default function ComposePage() {
  const ai = useAI();

  // Load initial project
  const initial = useMemo(loadState, []);
  const [book, setBook] = useState(initial?.book || { title: "Untitled Book" });
  const [chapters, setChapters] = useState(ensureFirstChapter(initial?.chapters || []));
  const [selectedId, setSelectedId] = useState(chapters[0].id);
  const selected = chapters.find((c) => c.id === selectedId) || chapters[0];

  // Editor state
  const [title, setTitle] = useState(selected.title || "");
  const [html, setHtml] = useState(selected.content || "");
  const [isFS, setIsFS] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const editorRef = useRef(null);

  /* Sync editor when selected chapter changes */
  useEffect(() => {
    const sel = chapters.find((c) => c.id === selectedId);
    if (!sel) return;
    setTitle(sel.title || "");
    setHtml(sel.content || "");
  }, [selectedId, chapters]);

  /* Persist project (debounced-ish) */
  useEffect(() => {
    const t = setTimeout(() => {
      const current = loadState() || {};
      saveState({
        book,
        chapters,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
    }, 400);
    return () => clearTimeout(t);
  }, [book, chapters]);

  /* Quill toolbar modules */
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        [{ font: FONT_WHITELIST }],
        [{ size: Size.whitelist }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  /* Save (write-through persist immediately) */
  const handleSave = () => {
    const updated = {
      ...selected,
      title: title || selected.title,
      content: html,
      wordCount: countWords(html),
      lastEdited: "Just now",
      status: selected.status || "draft",
    };

    setChapters((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      const current = loadState() || {};
      saveState({
        book,
        chapters: next,
        daily: current.daily || { goal: 500, counts: {} },
        settings: current.settings || { theme: "light", focusMode: false },
        tocOutline: current.tocOutline || [],
      });
      return next;
    });
  };

    // Persist into the selected chapter immediately
      if (selected?.id) {
        setChapters((prev) => {
          const next = prev.map((c) =>
            c.id === selected.id
              ? {
                  ...c,
                  title: title || c.title,
                  content: edited,
                  wordCount:
                    (edited.replace(/<[^>]+>/g, " ").trim().match(/\S+/g) || []).length,
                  lastEdited: "Just now",
                }
              : c
          );
          const current = loadState() || {};
          saveState({
            book,
            chapters: next,
            daily: current.daily || { goal: 500, counts: {} },
            settings: current.settings || { theme: "light", focusMode: false },
            tocOutline: current.tocOutline || [],
          });
          return next;
        });
      }
    } catch (e) {
      console.error("[AI] error:", e);
      alert(e.message || "AI request failed");
    } finally {
      setAiBusy(false);
    }
  };

  /* Combo: Proofread then Save (updates lastEdited/timestamps) */
  const handleSaveAndProof = async () => {
    await runAI("proofread");
    handleSave();
  };

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.toLowerCase();
      // Save
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && k === "s") {
        e.preventDefault();
        handleSave();
      }
      // Save + Proofread
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && k === "s") {
        e.preventDefault();
        handleSaveAndProof();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [title, html, selected?.id]);

  /* Add a new chapter */
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

  /* Chapter list item */
  const ChapterItem = ({ ch }) => (
    <button
      type="button"
      onClick={() => setSelectedId(ch.id)}
      className={[
        "w-full text-left px-3 py-2 rounded-lg border",
        selectedId === ch.id
          ? "bg-primary/15 border-primary/40"
          : "bg-white border-white/60 hover:bg-white/80",
      ].join(" ")}
      title={`${(ch.wordCount || 0).toLocaleString()} words`}
    >
      <div className="font-medium truncate">{ch.title}</div>
      <div className="text-xs text-slate-500">
        {(ch.wordCount || 0).toLocaleString()} words • {ch.lastEdited || "—"}
      </div>
    </button>
  );

  /* Back to Writing (route: /writing; adjust if needed) */
  const goBack = () => {
    window.location.href = "/writing";
  };

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)] text-slate-900">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
            title="Back to Writing"
          >
            <ArrowLeft size={16} /> Back
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => runAI("proofread")} …>AI: Proofread</button>
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
              disabled={aiBusy}
              title="AI Proofread"
            >
              <Bot size={16} />
              {aiBusy ? "AI…" : "AI: Proofread"}
            </button>
            <button
              onClick={() => runAI("clarify")} …>AI: Clarify</button>
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
              disabled={aiBusy}
              title="AI Clarify"
            >
              <Bot size={16} />
              {aiBusy ? "AI…" : "AI: Clarify"}
            </button>
            <button
              onClick={handleSaveAndProof} …>Proof + Save</button>
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50 disabled:opacity-60"
              disabled={aiBusy}
              title="Proofread + Save"
            >
              <Bot size={16} />
              Proof + Save
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-1.5 hover:opacity-90"
              title="Save"
            >
              <Save size={16} /> Save
            </button>
            <button
              onClick={() => setIsFS((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 bg-white hover:bg-slate-50"
              title={isFS ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFS ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              {isFS ? "Exit" : "Fullscreen"}
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6">
        {/* Left: Chapters */}
        <aside className="xl:sticky xl:top-16 space-y-2" style={{ zIndex: 10 }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">Chapters</div>
            <button
              onClick={addChapter}
              className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
            >
              + Add
            </button>
          </div>
          <div className="space-y-2">
            {chapters.map((c) => (
              <ChapterItem key={c.id} ch={c} />
            ))}
          </div>
        </aside>

        {/* Center: Editor */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Chapter title"
              className="w-full text-lg font-semibold outline-none bg-transparent"
            />
            <div className="text-sm text-slate-500">
              {(countWords(html) || 0).toLocaleString()} words
            </div>
          </div>

          <div className="p-3">
            <ReactQuill
              ref={editorRef}
              theme="snow"
              value={html}
              onChange={setHtml}
              modules={modules}
              placeholder="Start writing your story here…"
            />
          </div>
        </section>
      </div>

      {/* Fullscreen overlay — keeps chapters visible */}
      {isFS && (
        <div className="fixed inset-0 z-[9999] bg-[#fdecef]">
          <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-end gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-3 py-1.5 hover:opacity-90"
            >
              <Save size={16} /> Save
            </button>
            <button
              onClick={() => setIsFS(false)}
              className="rounded-lg border bg-white px-3 py-1.5 hover:bg-slate-50"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          <div className="pt-14 pb-6 px-6 h-full grid grid-cols-1 xl:grid-cols-[18rem_1fr] gap-6 overflow-auto">
            {/* Chapters stay visible */}
            <aside className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-700">Chapters</div>
                <button
                  onClick={addChapter}
                  className="text-sm px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2">
                {chapters.map((c) => (
                  <ChapterItem key={c.id} ch={c} />
                ))}
              </div>
            </aside>

            {/* Page */}
            <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-[14px] shadow-2xl">
              <div className="px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xl font-semibold bg-transparent outline-none"
                  placeholder="Chapter title"
                />
                <span className="text-sm text-slate-500">
                  {(countWords(html) || 0).toLocaleString()} words
                </span>
              </div>
              <div className="p-3">
                <ReactQuill
                  ref={editorRef}
                  theme="snow"
                  value={html}
                  onChange={setHtml}
                  modules={modules}
                  placeholder="Write in fullscreen…"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
