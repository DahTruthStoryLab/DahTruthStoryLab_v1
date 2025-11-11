// src/components/UI/UIComponents.jsx
// Reusable UI components with brand styling + AIInstructionsCard

import React, { useState, useEffect } from "react";

/* ===================== Buttons & Crumbs ===================== */

export function GoldButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1",
        className,
      ].join(" ")}
      style={{ backgroundColor: "#D4AF37" }}
    >
      {children}
    </button>
  );
}

export function WritingCrumb({ view }) {
  return (
    <div className="text-[13px] text-slate-600">
      <span className="opacity-80">Writing</span>
      <span className="px-2 opacity-50">▸</span>
      <span className="font-medium">{view === "grid" ? "Chapters" : "Editor"}</span>
    </div>
  );
}

/* ===================== Editor Badges ===================== */

export function PageNumberBadge({ pageIndex, pageCount }) {
  return (
    <div
      aria-label={`Page ${Math.min(pageIndex + 1, pageCount)} of ${pageCount}`}
      className="pointer-events-none select-none text-[12px] text-slate-600"
      style={{
        position: "absolute",
        bottom: 10,
        right: 16,
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 8,
        padding: "4px 8px",
        boxShadow: "0 2px 8px rgba(2,20,40,0.10)",
        backdropFilter: "blur(2px)",
      }}
    >
      Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
    </div>
  );
}

export function SaveStatus({ saving, lastSaved, hasUnsavedChanges }) {
  if (saving) {
    return (
      <div className="text-[12px] text-slate-500 flex items-center gap-1">
        <span className="animate-spin">⏳</span>
        <span>Saving...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="text-[12px] text-amber-600 flex items-center gap-1">
        <span>●</span>
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="text-[12px] text-emerald-600 flex items-center gap-1">
        <span>✓</span>
        <span>Saved {lastSaved}</span>
      </div>
    );
  }

  return null;
}

/* ===================== AI Instructions Card ===================== */
/**
 * Drop this card on the page in your screenshot (right rail).
 * It generates a forward-moving prompt for the CURRENT chapter,
 * informed by the full outline and neighboring chapters.
 *
 * Props:
 * - styleInstructions: string  (e.g., "Keep ADOS cadence; pastoral but firm.")
 * - chapter: { id, title, html, index }
 * - chapters: [{ id, title, html }, ...]  // whole manuscript
 * - apiUrl: string (defaults to "/ai/prompt")  // your API Gateway route
 * - onGenerated?: (data) => void             // optional callback
 */
export function AIInstructionsCard({
  styleInstructions = "",
  chapter,
  chapters = [],
  apiUrl = "/ai/prompt",
  onGenerated,
}) {
  const [loading, setLoading] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [error, setError] = useState("");

  // Reset output when switching chapters
  useEffect(() => {
    setPromptText("");
    setError("");
  }, [chapter?.id]);

  /* ---------- helpers ---------- */
  const stripHtml = (html = "") => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return (div.textContent || div.innerText || "").trim();
  };

  const summarize = (text = "", max = 800) => {
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    const lastDot = cut.lastIndexOf(".");
    return cut.slice(0, lastDot > 400 ? lastDot + 1 : max) + "…";
  };

  const buildPayload = () => {
    const idx =
      typeof chapter?.index === "number"
        ? chapter.index
        : chapters.findIndex((c) => String(c.id) === String(chapter?.id));

    const prev = idx > 0 ? chapters[idx - 1] : null;
    const next = idx < chapters.length - 1 ? chapters[idx + 1] : null;

    return {
      styleInstructions,
      chapter: {
        id: chapter?.id,
        index: idx,
        title: chapter?.title?.trim() || `Chapter ${idx + 1}`,
        content: stripHtml(chapter?.html || ""),
        summary: summarize(stripHtml(chapter?.html || ""), 1200),
      },
      neighbors: {
        previous: prev
          ? {
              title: prev.title?.trim() || `Chapter ${idx}`,
              summary: summarize(stripHtml(prev.html || ""), 800),
            }
          : null,
        next: next
          ? {
              title: next.title?.trim() || `Chapter ${idx + 2}`,
              summary: summarize(stripHtml(next.html || ""), 800),
            }
          : null,
      },
      outline: chapters.map((c, i) => ({
        index: i,
        title: c?.title?.trim() || `Chapter ${i + 1}`,
      })),
      maxIdeas: 5,
      temperature: 0.7,
    };
  };

  /* ---------- action ---------- */
  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError("");
      const payload = buildPayload();

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-operation": "chapter-prompt",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setPromptText(data?.prompt || "");
      onGenerated?.(data);
    } catch (e) {
      console.error(e);
      setError("Couldn’t generate a prompt. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="text-sm font-semibold">AI Instructions</div>
        <GoldButton onClick={handleGenerate} disabled={loading}>
          {loading ? "Generating…" : "✨ Generate Prompt"}
        </GoldButton>
      </div>

      {styleInstructions ? (
        <div className="px-4 pt-3 text-xs text-slate-600">
          <span className="font-medium">Style: </span>
          {styleInstructions}
        </div>
      ) : null}

      <div className="px-4 py-3">
        {error && <div className="text-xs text-red-600 mb-2">{error}</div>}
        {promptText ? (
          <div className="text-sm whitespace-pre-wrap leading-relaxed">
            {promptText}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            Click <span className="font-medium">Generate Prompt</span> to get a
            focused suggestion that moves this chapter forward.
          </div>
        )}
      </div>

      {/* Optional footer (e.g., show what chapter this relates to) */}
      {chapter?.title || typeof chapter?.index === "number" ? (
        <div className="px-4 pb-3 text-[12px] text-slate-500">
          For: {chapter?.title?.trim() || `Chapter ${(chapter.index ?? 0) + 1}`}
        </div>
      ) : null}
    </div>
  );
}
