import React, { createContext, useContext, useState, useMemo } from "react";

const ChaptersContext = createContext(null);

export function ChaptersProvider({ initialChapters = [], children }) {
  const [chapters, setChapters] = useState(initialChapters);
  const [selectedId, setSelectedId] = useState(null);

  const renameChapter = (id, newTitle) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === id ? { ...ch, title: newTitle } : ch
      )
    );
  };

  const addChapter = () => {
    const newId = `chapter-${Date.now()}`;
    const newChapter = { id: newId, title: "New Chapter", wordCount: 0 };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedId(newId);
  };

  const value = useMemo(
    () => ({
      chapters,
      setChapters,
      selectedId,
      setSelectedId,
      renameChapter,
      addChapter,
    }),
    [chapters, selectedId]
  );

  return (
    <ChaptersContext.Provider value={value}>
      {children}
    </ChaptersContext.Provider>
  );
}

export function useChapters() {
  const ctx = useContext(ChaptersContext);
  if (!ctx) {
    throw new Error("useChapters must be used inside a ChaptersProvider");
  }
  return ctx;
}
