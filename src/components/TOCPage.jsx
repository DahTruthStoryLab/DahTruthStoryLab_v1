// src/components/TOCPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ListTree,
  Edit3,
  Plus,
  ArrowLeft,
} from "lucide-react";

const STORAGE_KEY = "dahtruth_chapters";

export default function TOCPage() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // Load chapters from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setChapters(parsed);
          if (parsed.length > 0) {
            setSelectedId(parsed[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load chapters for TOC:", err);
    }
  }, []);

  // Persist whenever chapters change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chapters));
    } catch (err) {
      console.error("Failed to save chapters from TOC:", err);
    }
  }, [chapters]);

  const sortedChapters = useMemo(() => {
    return [...chapters].sort((a, b) => {
      const ao = a.order ?? 0;
      const bo = b.order ?? 0;
      return ao - bo;
    });
  }, [chapters]);

  const selectedChapter = useMemo(
    () => sortedChapters.find((ch) => ch.id === selectedId) || null,
    [sortedChapters, selectedId]
  );

  const handleAddChapter = () => {
    const now = new Date().toISOString();
    const newChapter = {
      id: `chapter-${Date.now()}`,
      order: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      summary: "",
      content: "",
      wordCount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedId(newChapter.id);
  };

  const handleOutlineChange = (newOutline) => {
    if (!selectedChapter) return;
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === selectedChapter.id
          ? { ...ch, summary: newOutline, updatedAt: new Date().toISOString() }
          : ch
      )
    );
  };

  const handleTitleChange = (newTitle) => {
    if (!selectedChapter) return;
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === selectedChapter.id
          ? { ...ch, title: newTitle, updatedAt: new Date().toISOString() }
          : ch
      )
    );
  };

  const handleGoBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[hsl(var(--border))] hover:bg-gray-50 text-xs"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[color:var(--color-primary)]/80 border border-[hsl(var(--border))]">
                <ListTree className="w-5 h-5 text-[color:var(--color-ink)]/80" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold heading-serif">
                  Table of Contents
                </h1>
                <p className="text-xs text-muted mt-1">
                  View chapters at a glance and keep a small outline for each one.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/writer")}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl glass-soft border border-white/50 px-3 py-2 text-xs font-medium hover:bg-white/80"
            >
              <BookOpen size={14} />
              Open Writer
            </button>
            <button
              onClick={handleAddChapter}
              className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-accent)] px-3 py-2 text-xs font-semibold text-ink shadow hover:opacity-90"
            >
              <Plus size={14} /> New Chapter
            </button>
          </div>
        </div>

        {/* Layout: chapter cards + small outline panel */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,1.2fr)]">
          {/* Left: Chapter Cards */}
          <div className="space-y-3">
            {sortedChapters.length === 0 ? (
              <div className="glass-panel rounded-2xl p-10 text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-[color:var(--color-ink)]/70" />
                <p className="text-sm text-muted mb-3">
                  No chapters yet. Create your first chapter to start your Table of Contents.
                </p>
                <button
                  onClick={handleAddChapter}
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  <Plus size={16} />
                  Add First Chapter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortedChapters.map((ch, idx) => {
                  const isActive = ch.id === selectedId;
                  const orderLabel =
                    ch.order != null ? ch.order : idx + 1;
                  const outlinePreview =
                    (ch.summary || "").trim() || "No outline yet. Click to add one.";

                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setSelectedId(ch.id)}
                      className={`text-left rounded-2xl glass-panel border px-4 py-4 flex flex-col gap-2 transition-colors ${
                        isActive
                          ? "border-[color:var(--color-accent)] bg-white/90"
                          : "border-[hsl(var(--border))] bg-white/70 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted uppercase tracking-wide">
                          Chapter {orderLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[color:var(--color-primary)]/40 text-ink border border-[hsl(var(--border))]">
                          <Edit3 size={10} />
                          Outline
                        </span>
                      </div>
                      <div className="font-semibold text-sm heading-serif line-clamp-1">
                        {ch.title || "Untitled Chapter"}
                      </div>
                      <p className="text-xs text-muted line-clamp-3">
                        {outlinePreview}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Outline Editor for Selected Chapter */}
          <div className="glass-panel rounded-2xl p-5 min-h-[260px] flex flex-col">
            {selectedChapter ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Edit3
                      size={18}
                      className="text-[color:var(--color-ink)]/80"
                    />
                    <div>
                      <p className="text-xs text-muted uppercase tracking-wide">
                        Chapter {selectedChapter.order ?? ""}
                      </p>
                      <input
                        className="mt-0.5 w-full bg-transparent border-0 border-b border-transparent focus:border-[hsl(var(--border))] text-sm font-semibold outline-none"
                        value={selectedChapter.title || ""}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Chapter title..."
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate("/writer")}
                    className="hidden md:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] glass-soft border border-white/60 hover:bg-white/80"
                  >
                    <BookOpen size={12} />
                    Open in Writer
                  </button>
                </div>

                <label className="text-xs text-muted mb-1 block">
                  Small Chapter Outline
                </label>
                <textarea
                  className="flex-1 w-full rounded-xl border border-[hsl(var(--border))] bg-white/80 px-3 py-2 text-sm outline-none resize-none min-h-[160px]"
                  placeholder="Briefly describe what happens in this chapter..."
                  value={selectedChapter.summary || ""}
                  onChange={(e) => handleOutlineChange(e.target.value)}
                />
                <p className="mt-2 text-[11px] text-muted">
                  Keep this outline short and focused. It shows up as a preview on the chapter cards.
                </p>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Edit3
                  size={32}
                  className="text-[color:var(--color-ink)]/60 mb-3"
                />
                <p className="text-sm text-muted mb-1">
                  Select a chapter to add a small outline.
                </p>
                <p className="text-xs text-muted">
                  Your outline helps you remember the core beat of each chapter at a glance.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
