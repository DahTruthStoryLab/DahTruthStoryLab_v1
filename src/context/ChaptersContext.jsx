import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";

/** ---------------- Types ---------------- */

export type Chapter = {
  id: string;
  title: string;
  /** Optional fields used across the app */
  html?: string;
  content?: string;
  preview?: string;
  wordCount?: number;
  lastEdited?: string;
  status?: string;
  order?: number;
};

export type ChaptersContextValue = {
  chapters: Chapter[];
  setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;

  selectedId: string | null;
  setSelectedId: React.Dispatch<React.SetStateAction<string | null>>;

  /** Common helpers */
  selectChapter: (id: string | null) => void;
  renameChapter: (id: string, newTitle: string) => void;
  updateChapter: (id: string, patch: Partial<Chapter>) => void;
  addChapter: (opts?: { title?: string; afterId?: string | null }) => string;
  removeChapter: (id: string) => void;
};

type ChaptersProviderProps = {
  initialChapters?: Chapter[];
  initialSelectedId?: string | null;
  children: ReactNode;
};

/** ---------------- Context ---------------- */

const ChaptersContext = createContext<ChaptersContextValue | null>(null);

function generateChapterId() {
  // Prefer crypto UUID when available
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ChaptersProvider({
  initialChapters = [],
  initialSelectedId = null,
  children,
}: ChaptersProviderProps) {
  const [chapters, setChapters] = useState<Chapter[]>(() => initialChapters);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    // If caller provided one, use it. Else select first chapter if present.
    if (initialSelectedId !== null) return initialSelectedId;
    return initialChapters[0]?.id ?? null;
  });

  const selectChapter = (id: string | null) => {
    setSelectedId(id);
  };

  const renameChapter = (id: string, newTitle: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, title: newTitle } : ch
      )
    );
  };

  const updateChapter = (id: string, patch: Partial<Chapter>) => {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, ...patch } : ch))
    );
  };

  const addChapter = (opts?: { title?: string; afterId?: string | null }) => {
    const id = generateChapterId();
    const title = opts?.title ?? "New Chapter";

    const newChapter: Chapter = {
      id,
      title,
      wordCount: 0,
      status: "draft",
      order: chapters.length, // best-effort; caller can re-order later
    };

    setChapters((prev) => {
      // Insert after a specific chapter if requested
      const afterId = opts?.afterId ?? null;
      if (!afterId) return [...prev, newChapter];

      const idx = prev.findIndex((c) => c.id === afterId);
      if (idx === -1) return [...prev, newChapter];

      const next = [...prev.slice(0, idx + 1), newChapter, ...prev.slice(idx + 1)];
      // Normalize order (optional but helpful)
      return next.map((c, i) => ({ ...c, order: i }));
    });

    setSelectedId(id);
    return id;
  };

  const removeChapter = (id: string) => {
    setChapters((prev) => {
      const next = prev.filter((c) => c.id !== id).map((c, i) => ({ ...c, order: i }));
      return next;
    });

    setSelectedId((cur) => {
      if (cur !== id) return cur;
      // If we deleted the selected chapter, select the first remaining
      const remaining = chapters.filter((c) => c.id !== id);
      return remaining[0]?.id ?? null;
    });
  };

  const value = useMemo<ChaptersContextValue>(
    () => ({
      chapters,
      setChapters,
      selectedId,
      setSelectedId,
      selectChapter,
      renameChapter,
      updateChapter,
      addChapter,
      removeChapter,
    }),
    [chapters, selectedId]
  );

  return (
    <ChaptersContext.Provider value={value}>
      {children}
    </ChaptersContext.Provider>
  );
}

export function useChapters(): ChaptersContextValue {
  const ctx = useContext(ChaptersContext);
  if (!ctx) {
    throw new Error("useChapters must be used inside a ChaptersProvider");
  }
  return ctx;
}
