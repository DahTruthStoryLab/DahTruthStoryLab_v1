// src/pages/Publishing.tsx
// Publishing workspace wired to data from ComposePage / ComposePage.handleSendToPublishing

import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../components/layout/PageShell.tsx";
import {
  runGrammar,
  runStyle,
  runReadability,
  runPublishingPrep,
  runAssistant,
  generateSynopsis,
} from "../lib/api";

const CHAPTERS_KEY = "dahtruth_chapters";
const PROJECT_META_KEY = "dahtruth_project_meta";
const PUBLISHING_DRAFT_KEY = "publishingDraft";

type PublishingChapter = {
  id: string;
  title: string;
  included?: boolean;
  text?: string;      // plain text for tools
  textHTML?: string;  // formatted HTML (from Compose)
  content?: string;   // older content shape (HTML)
};

type ProjectMeta = {
  title: string;
  author: string;
  year?: string;
  authorLast?: string;
};

type PublishingDraft = {
  book?: {
    title?: string;
    status?: string;
    updatedAt?: string;
  };
  chapters?: {
    id: string;
    title: string;
    content: string;
  }[];
};

// Helper: HTML → plain text
function htmlToPlainText(html: string | undefined | null): string {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
}

// Helper: log + soften failure instead of crashing
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to parse localStorage JSON:", err, raw);
    return fallback;
  }
}

const DEFAULT_META: ProjectMeta = {
  title: "Untitled Book",
  author: "Unknown Author",
};

type ModuleKey = "manuscript" | "frontmatter" | "copyright" | "export";

const PublishingPage: React.FC = () => {
  const navigate = useNavigate();

  const [chapters, setChapters] = useState<PublishingChapter[]>([]);
  const [meta, setMeta] = useState<ProjectMeta>(DEFAULT_META);
  const [draft, setDraft] = useState<PublishingDraft | null>(null);

  const [activeModule, setActiveModule] = useState<ModuleKey>("manuscript");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  // Status / feedback
  const [loadError, setLoadError] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiOutput, setAiOutput] = useState<string>("");

  // FRONT MATTER STATE
  const [subtitle, setSubtitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [backCoverCopy, setBackCoverCopy] = useState("");

  // COPYRIGHT / AUTHOR STATE
  const [publisherName, setPublisherName] = useState("DAHTRUTH, LLC");
  const [imprintName, setImprintName] = useState("DahTruth StoryLab");
  const [isbn, setIsbn] = useState("");
  const [copyrightYear, setCopyrightYear] = useState(
    new Date().getFullYear().toString()
  );
  const [rightsText, setRightsText] = useState(
    "All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the publisher."
  );

  // ─────────────────────────────────────────────
  // 1. Load from localStorage on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const rawDraft = localStorage.getItem(PUBLISHING_DRAFT_KEY);
      const rawChapters = localStorage.getItem(CHAPTERS_KEY);
      const rawMeta = localStorage.getItem(PROJECT_META_KEY);

      const parsedDraft = safeParse<PublishingDraft | null>(rawDraft, null);
      const parsedChapters = safeParse<PublishingChapter[]>(rawChapters, []);
      const parsedMeta = safeParse<ProjectMeta | null>(rawMeta, null);

      // PRIORITY: publishingDraft → dahtruth_chapters
      let mergedChapters: PublishingChapter[] = [];

      if (parsedDraft && Array.isArray(parsedDraft.chapters)) {
        mergedChapters = parsedDraft.chapters.map((ch) => {
          // If dahtruth_chapters already has this id, merge in `included`, `text`, etc.
          const fromList = parsedChapters.find((c) => c.id === ch.id);
          return {
            id: ch.id,
            title: ch.title || fromList?.title || "Untitled Chapter",
            included:
              typeof fromList?.included === "boolean" ? fromList?.included : true,
            content: ch.content,
            text:
              fromList?.text ||
              htmlToPlainText(ch.content) ||
              htmlToPlainText(fromList?.textHTML),
            textHTML: fromList?.textHTML,
          };
        });
      } else if (parsedChapters.length > 0) {
        // Fallback: only dahtruth_chapters is available
        mergedChapters = parsedChapters.map((ch, index) => ({
          id: ch.id || `c_${index + 1}`,
          title: ch.title || `Chapter ${index + 1}`,
          included: typeof ch.included === "boolean" ? ch.included : true,
          text: ch.text || htmlToPlainText(ch.textHTML),
          textHTML: ch.textHTML,
          content: ch.content, // may be undefined in this path
        }));
      }

      if (!mergedChapters.length) {
        setLoadError(
          "No manuscript found for publishing. Go back to Writing, save your chapters, then click 'Send to Publishing' again."
        );
      }

      setChapters(mergedChapters);

      const effectiveMeta: ProjectMeta = {
        ...DEFAULT_META,
        ...(parsedMeta || {}),
        ...(parsedDraft?.book?.title
          ? { title: parsedDraft.book.title }
          : {}),
      };

      setMeta(effectiveMeta);
      setDraft(parsedDraft);

      if (mergedChapters.length > 0) {
        setSelectedChapterId(mergedChapters[0].id);
      }
    } catch (err) {
      console.error("Error loading publishing data:", err);
      setLoadError(
        "There was a problem loading your manuscript for publishing. Please try sending it again from the Writing workspace."
      );
    }
  }, []);

  // ─────────────────────────────────────────────
  // 2. Derived values (selected chapter, manuscript text + HTML, book meta)
  // ─────────────────────────────────────────────
  const selectedChapter = useMemo(
    () =>
      chapters.find((c) => c.id === selectedChapterId) || chapters[0] || null,
    [chapters, selectedChapterId]
  );

  const manuscriptText = useMemo(() => {
    if (!chapters.length) return "";
    return chapters
      .filter((c) => c.included !== false)
      .map((c) => c.text || htmlToPlainText(c.content))
      .filter(Boolean)
      .join("\n\n");
  }, [chapters]);

  // HTML version of the currently selected chapter (for preview-style modules)
  const manuscriptHTML = useMemo(() => {
    if (!selectedChapter) return "";
    return selectedChapter.textHTML || selectedChapter.content || "";
  }, [selectedChapter]);

  const bookTitle = meta?.title || "Untitled Book";
  const authorName = meta?.author || "Unknown Author";

  // ─────────────────────────────────────────────
  // 3. Simple AI wiring (shared across modules)
  // ─────────────────────────────────────────────

  const handleGenerateSynopsis = useCallback(
    async (length: "short" | "long" = "short") => {
      if (!manuscriptText) {
        alert(
          "I could not find any manuscript text. Make sure your chapters are included and try again."
        );
        return;
      }
      try {
        setAiBusy(true);
        setAiOutput("");
        const res = await generateSynopsis(manuscriptText, length);
        const text =
          (res &&
            (res.result || res.text || res.output || res.data || res)) ||
          "";
        setAiOutput(String(text));
        setActiveModule("frontmatter");
      } catch (err) {
        console.error("generateSynopsis error:", err);
        alert("There was an error generating the synopsis. Please try again.");
      } finally {
        setAiBusy(false);
      }
    },
    [manuscriptText]
  );

  const handlePublishingPrep = useCallback(
    async (mode: "blurb" | "backcover" | "toc" | "keywords") => {
      if (!manuscriptText) {
        alert(
          "I could not find any manuscript text. Make sure your chapters are included and try again."
        );
        return;
      }
      try {
        setAiBusy(true);
        const res = await runPublishingPrep(manuscriptText, mode);
        const text =
          (res &&
            (res.result || res.text || res.output || res.data || res)) ||
          "";

        if (mode === "blurb" || mode === "backcover") {
          setBackCoverCopy(String(text));
          setActiveModule("frontmatter");
        } else if (mode === "keywords") {
          setKeywords(String(text));
          setActiveModule("frontmatter");
        }

        setAiOutput(String(text));
      } catch (err) {
        console.error("runPublishingPrep error:", err);
        alert("There was an error running the publishing prep tool.");
      } finally {
        setAiBusy(false);
      }
    },
    [manuscriptText]
  );

  // ─────────────────────────────────────────────
  // 4. UI helpers
  // ─────────────────────────────────────────────
  const goBackToWriting = () => navigate("/compose");
  const goBackToDashboard = () => navigate("/dashboard");

  const toggleChapterIncluded = (id: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id
          ? { ...ch, included: ch.included === false ? true : false }
          : ch
      )
    );
  };

  // ─────────────────────────────────────────────
  // 5. Render
  // ─────────────────────────────────────────────
  if (loadError) {
    return (
      <PageShell title="Publishing">
        <div className="max-w-3xl mx-auto py-10">
          <h1 className="text-2xl font-semibold mb-4">Publishing Workspace</h1>
          <p className="text-red-600 mb-4">{loadError}</p>
          <div className="flex gap-3">
            <button
              onClick={goBackToWriting}
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Go to Writing
            </button>
            <button
              onClick={goBackToDashboard}
              className="px-4 py-2 rounded-md border border-slate-300 text-sm hover:bg-slate-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Publishing">
      <div className="max-w-7xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[260px,minmax(0,1fr)]">
        {/* LEFT: Modules + chapters */}
        <aside className="space-y-6">
          {/* Project summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-800 mb-1">
              {bookTitle}
            </h2>
            <p className="text-xs text-slate-500 mb-2">
              by {authorName}
              {meta.year ? ` · © ${meta.year}` : ""}
            </p>
            <p className="text-[11px] text-slate-500">
              This view is fed from your Writing workspace. To update chapters,
              edit in Writing and click{" "}
              <span className="font-semibold">“Send to Publishing”</span> again.
            </p>
          </div>

          {/* Module navigation */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="text-xs font-semibold text-slate-700 mb-2">
              Publishing Modules
            </div>
            <nav className="space-y-1 text-sm">
              {[
                { key: "manuscript", label: "1. Manuscript" },
                { key: "frontmatter", label: "2. Front Matter" },
                { key: "copyright", label: "3. Copyright & Author" },
                { key: "export", label: "4. Export" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setActiveModule(m.key as ModuleKey)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs ${
                    activeModule === m.key
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Chapter list */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700">
                Chapters
              </div>
              <div className="text-[11px] text-slate-500">
                {chapters.length} total
              </div>
            </div>
            <ul className="space-y-1 max-h-72 overflow-auto text-xs">
              {chapters.map((ch, idx) => (
                <li
                  key={ch.id}
                  className={`flex items-center justify-between gap-2 px-2 py-1 rounded cursor-pointer ${
                    selectedChapterId === ch.id
                      ? "bg-slate-100"
                      : "hover:bg-slate-50"
                  }`}
                  onClick={() => setSelectedChapterId(ch.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-slate-800">
                      {idx + 1}. {ch.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ch.included === false
                        ? "Excluded from export"
                        : "Included"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleChapterIncluded(ch.id);
                    }}
                    className={`text-[10px] px-2 py-0.5 rounded border ${
                      ch.included === false
                        ? "bg-white border-slate-300 text-slate-600"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {ch.included === false ? "Include" : "Include ✓"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* AI status / output preview */}
          {aiOutput && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="text-xs font-semibold text-slate-700 mb-2">
                AI Output
              </div>
              <div className="text-[11px] text-slate-700 whitespace-pre-wrap max-h-40 overflow-auto">
                {aiOutput}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT: Active module content */}
        <main className="space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Publishing Workspace
              </h1>
              <p className="text-xs text-slate-500">
                Shape your final manuscript, front matter, and export-ready files.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={goBackToWriting}
                className="px-3 py-1.5 rounded-md border border-slate-300 text-xs hover:bg-slate-50"
              >
                Back to Writing
              </button>
              <button
                onClick={goBackToDashboard}
                className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs hover:bg-slate-800"
              >
                Dashboard
              </button>
            </div>
          </div>

          {/* ACTIVE MODULE SWITCHER */}
          {activeModule === "manuscript" && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Manuscript Overview
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review the combined text that will feed your front matter,
                    copyright, and export steps.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleGenerateSynopsis("short")}
                  disabled={aiBusy || !manuscriptText}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {aiBusy ? "Thinking…" : "Generate Short Synopsis"}
                </button>
              </div>

              <div className="border border-dashed border-slate-200 rounded-lg p-3 max-h-[420px] overflow-auto bg-slate-50/40">
                {manuscriptText ? (
                  <pre className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {manuscriptText}
                  </pre>
                ) : (
                  <p className="text-xs text-slate-500">
                    No text available. Make sure your chapters are included and
                    re-send from the Writing workspace.
                  </p>
                )}
              </div>
            </section>
          )}

          {activeModule === "frontmatter" && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">
                    Front Matter
                  </h2>
                  <p className="text-xs text-slate-500">
                    Subtitle, tagline, series info, keywords, and back cover copy.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handlePublishingPrep("blurb")}
                    disabled={aiBusy || !manuscriptText}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {aiBusy ? "Thinking…" : "AI Blurb"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePublishingPrep("keywords")}
                    disabled={aiBusy || !manuscriptText}
                    className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-xs hover:bg-slate-800 disabled:opacity-60"
                  >
                    {aiBusy ? "Thinking…" : "AI Keywords"}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Subtitle
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tagline
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Series Name
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={seriesName}
                      onChange={(e) => setSeriesName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Keywords (comma-separated)
                    </label>
                    <textarea
                      rows={3}
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Back Cover Copy
                  </label>
                  <textarea
                    rows={12}
                    className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    value={backCoverCopy}
                    onChange={(e) => setBackCoverCopy(e.target.value)}
                    placeholder="This is where you tease the story and invite readers in..."
                  />
                  <p className="text-[10px] text-slate-500">
                    You can refine this text manually after using the AI tools.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeModule === "copyright" && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">
                Copyright & Author Details
              </h2>
              <p className="text-xs text-slate-500 mb-2">
                These fields will feed your front matter pages and publishing
                templates.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Author Name
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={meta.author}
                      onChange={(e) =>
                        setMeta((prev) => ({ ...prev, author: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Publisher
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={publisherName}
                      onChange={(e) => setPublisherName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Imprint
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={imprintName}
                      onChange={(e) => setImprintName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ISBN (optional)
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={isbn}
                      onChange={(e) => setIsbn(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Copyright Year
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={copyrightYear}
                      onChange={(e) => setCopyrightYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Rights Statement
                </label>
                <textarea
                  rows={5}
                  className="w-full border border-slate-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  value={rightsText}
                  onChange={(e) => setRightsText(e.target.value)}
                />
              </div>
            </section>
          )}

          {activeModule === "export" && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-slate-800">Export</h2>
              <p className="text-xs text-slate-500">
                This is where you will export your manuscript and front matter to
                formats for Kindle, Draft2Digital, and print. For now, you can
                copy-and-paste the combined text and front matter into your
                preferred tool.
              </p>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-700">
                  Quick Copy: Manuscript Only
                </h3>
                <div className="border border-dashed border-slate-200 rounded-lg p-3 max-h-64 overflow-auto bg-slate-50/40">
                  <pre className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {manuscriptText || "No manuscript text available."}
                  </pre>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </PageShell>
  );
};

export default PublishingPage;
