// src/pages/Publishing.tsx

import React, { useEffect, useMemo, useState } from "react";

const PUBLISHING_DRAFT_KEY = "publishingDraft";

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface PublishingDraft {
  book?: {
    title?: string;
    status?: string;
    updatedAt?: string;
  };
  chapters?: Chapter[];
  // Optional: which chapters are included in the publishing set
  includedChapterIds?: string[];
}

// --- helpers ------------------------------------------------------

function stripHtml(html: string = ""): string {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function countWords(text: string = ""): number {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").length;
}

// --- main component -----------------------------------------------

export default function Publishing(): JSX.Element {
  const [draft, setDraft] = useState<PublishingDraft | null>(null);
  const [includedIds, setIncludedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load publishing draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PUBLISHING_DRAFT_KEY);
      if (!raw) {
        setDraft(null);
        setIncludedIds(new Set());
        setLoading(false);
        return;
      }

      const parsed: PublishingDraft = JSON.parse(raw);
      const chapters = Array.isArray(parsed.chapters) ? parsed.chapters : [];

      // If there is a saved includedChapterIds list, use it.
      // Otherwise, default to "all chapters included".
      const initialIncluded = new Set<string>(
        parsed.includedChapterIds && parsed.includedChapterIds.length > 0
          ? parsed.includedChapterIds
          : chapters.map((c) => c.id)
      );

      setDraft({
        ...parsed,
        chapters,
      });
      setIncludedIds(initialIncluded);
    } catch (err) {
      console.error("Failed to load publishingDraft:", err);
      setDraft(null);
      setIncludedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  // Compute simple stats
  const stats = useMemo(() => {
    if (!draft || !Array.isArray(draft.chapters)) {
      return {
        totalChapters: 0,
        includedChapters: 0,
        totalWords: 0,
        includedWords: 0,
      };
    }

    let totalWords = 0;
    let includedWords = 0;

    draft.chapters.forEach((ch) => {
      const w = countWords(stripHtml(ch.content || ""));
      totalWords += w;
      if (includedIds.has(ch.id)) {
        includedWords += w;
      }
    });

    return {
      totalChapters: draft.chapters.length,
      includedChapters: draft.chapters.filter((c) =>
        includedIds.has(c.id)
      ).length,
      totalWords,
      includedWords,
    };
  }, [draft, includedIds]);

  // Persist includedIds back to localStorage whenever they change
  useEffect(() => {
    if (!draft) return;
    try {
      const updated: PublishingDraft = {
        ...draft,
        includedChapterIds: Array.from(includedIds),
      };
      localStorage.setItem(PUBLISHING_DRAFT_KEY, JSON.stringify(updated));
      setDraft(updated);
    } catch (err) {
      console.error("Failed to persist publishingDraft:", err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includedIds]);

  const handleToggleInclude = (id: string) => {
    setIncludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="text-sm text-slate-600">
          Loading publishing data…
        </div>
      </div>
    );
  }

  if (
    !draft ||
    !Array.isArray(draft.chapters) ||
    draft.chapters.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[rgb(244,247,250)] flex items-center justify-center">
        <div className="max-w-md bg-white shadow-md rounded-lg p-6 border border-slate-200">
          <h1 className="text-lg font-semibold text-slate-900 mb-2">
            No manuscript in Publishing yet
          </h1>
          <p className="text-sm text-slate-600 mb-3">
            To begin, open your Writer workspace, finish your edits, and click{" "}
            <span className="font-semibold">
              &ldquo;Send to Publishing&rdquo;
            </span>
            .
          </p>
          <p className="text-xs text-slate-500">
            This page will automatically pick up the latest manuscript you send
            from the Writer grid.
          </p>
        </div>
      </div>
    );
  }

  const bookTitle =
    draft.book?.title?.trim() || "Untitled Book (Publishing Draft)";

  return (
    <div className="min-h-screen bg-[rgb(244,247,250)]">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header / summary */}
        <header className="bg-white rounded-xl shadow-sm border border-slate-200 px-5 py-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">
              Publishing Workspace
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              {bookTitle}
            </h1>
            {draft.book?.updatedAt && (
              <p className="text-xs text-slate-500 mt-1">
                Last updated:{" "}
                {new Date(draft.book.updatedAt).toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex flex-col items-start">
              <span className="text-slate-500">
                Chapters (included / total)
              </span>
              <span className="font-semibold text-slate-900">
                {stats.includedChapters} / {stats.totalChapters}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-slate-500">
                Words (included / total)
              </span>
              <span className="font-semibold text-slate-900">
                {stats.includedWords.toLocaleString()} /{" "}
                {stats.totalWords.toLocaleString()}
              </span>
            </div>
          </div>
        </header>

        {/* Chapter list */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Chapters in this Manuscript
            </h2>
            <p className="text-xs text-slate-500">
              Toggle which chapters will be included in the published
              output.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {draft.chapters!.map((ch, index) => {
              const included = includedIds.has(ch.id);
              const previewText = stripHtml(ch.content || "").slice(0, 180);

              return (
                <div
                  key={ch.id || `chapter-${index}`}
                  className="py-3 flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3"
                >
                  <div className="flex items-start gap-2 flex-1">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-slate-300"
                      checked={included}
                      onChange={() => handleToggleInclude(ch.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">
                          Chapter {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-900">
                          {ch.title || `Untitled Chapter ${index + 1}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {previewText}
                        {previewText.length >= 180 ? "…" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="mt-1 sm:mt-0 text-right text-xs text-slate-500">
                    <span className="inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 bg-slate-50">
                      {countWords(
                        stripHtml(ch.content || "")
                      ).toLocaleString()}{" "}
                      words
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Placeholder for next steps */}
        <section className="bg-white rounded-xl shadow-sm border border-dashed border-slate-300 p-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Next steps (Proof, Format, Export)
          </h3>
          <p className="text-xs text-slate-600 mb-2">
            This draft is now synced to{" "}
            <code>localStorage["publishingDraft"]</code> with your chapter
            selection. The Proof, Format, and Export pages can read the same
            key to build your final files.
          </p>
          <p className="text-xs text-slate-500">
            When you are ready, open the{" "}
            <span className="font-semibold">Proof</span>,{" "}
            <span className="font-semibold">Format</span>, or{" "}
            <span className="font-semibold">Export</span> tabs from your
            navigation to continue your publishing workflow.
          </p>
        </section>
      </div>
    </div>
  );
}
