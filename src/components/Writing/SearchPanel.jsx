// src/components/Writing/SearchPanel.jsx
import React, { useState, useCallback, useMemo } from "react";
import { Search, X, ChevronDown, ChevronUp } from "lucide-react";

/**
 * SearchPanel - Search across all chapters
 * Props:
 *   chapters: array of { id, title, content }
 *   onSelectChapter: (chapterId) => void - navigate to chapter
 *   onHighlightText: (chapterId, searchTerm) => void - highlight in editor
 */
export default function SearchPanel({
  chapters = [],
  onSelectChapter,
  onHighlightText,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  // Strip HTML and get plain text
  const stripHtml = (html = "") => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Search results with context
  const results = useMemo(() => {
    if (!searchTerm.trim() || searchTerm.length < 2) return [];

    const term = searchTerm.toLowerCase();
    const matches = [];

    chapters.forEach((chapter) => {
      const plainText = stripHtml(chapter.content || "");
      const lowerText = plainText.toLowerCase();

      // Find all occurrences
      let startIndex = 0;
      let matchCount = 0;
      const snippets = [];

      while (startIndex < lowerText.length && matchCount < 5) {
        const index = lowerText.indexOf(term, startIndex);
        if (index === -1) break;

        // Extract context around match (50 chars before and after)
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(plainText.length, index + term.length + 50);
        
        let snippet = plainText.slice(contextStart, contextEnd);
        if (contextStart > 0) snippet = "..." + snippet;
        if (contextEnd < plainText.length) snippet = snippet + "...";

        snippets.push({
          text: snippet,
          matchIndex: index,
        });

        startIndex = index + term.length;
        matchCount++;
      }

      if (snippets.length > 0) {
        matches.push({
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          matchCount: lowerText.split(term).length - 1,
          snippets,
        });
      }
    });

    return matches;
  }, [searchTerm, chapters]);

  const totalMatches = useMemo(() => {
    return results.reduce((sum, r) => sum + r.matchCount, 0);
  }, [results]);

  const handleResultClick = (chapterId) => {
    if (onSelectChapter) {
      onSelectChapter(chapterId);
    }
    if (onHighlightText) {
      onHighlightText(chapterId, searchTerm);
    }
  };

  const highlightMatch = (text, term) => {
    if (!term) return text;
    const parts = text.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">
            Search Manuscript
          </span>
          {totalMatches > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {totalMatches} match{totalMatches !== 1 ? "es" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 hover:bg-slate-200 rounded"
              title="Close search"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {/* Search input and results */}
      {isExpanded && (
        <div className="p-3">
          {/* Search input */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search all chapters..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {searchTerm.length >= 2 && results.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No matches found for "{searchTerm}"
              </p>
            )}

            {results.map((result) => (
              <div
                key={result.chapterId}
                className="border border-slate-200 rounded-md overflow-hidden"
              >
                {/* Chapter header */}
                <button
                  onClick={() => handleResultClick(result.chapterId)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left"
                >
                  <span className="text-sm font-medium text-slate-700 truncate">
                    {result.chapterTitle}
                  </span>
                  <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                    {result.matchCount} match{result.matchCount !== 1 ? "es" : ""}
                  </span>
                </button>

                {/* Snippets */}
                <div className="px-3 py-2 space-y-2">
                  {result.snippets.slice(0, 3).map((snippet, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result.chapterId)}
                      className="block w-full text-left text-xs text-slate-600 hover:bg-slate-50 p-1 rounded"
                    >
                      {highlightMatch(snippet.text, searchTerm)}
                    </button>
                  ))}
                  {result.snippets.length > 3 && (
                    <p className="text-xs text-slate-400 italic">
                      +{result.snippets.length - 3} more matches...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Keyboard hint */}
          {searchTerm.length < 2 && (
            <p className="text-xs text-slate-400 text-center mt-2">
              Type at least 2 characters to search
            </p>
          )}
        </div>
      )}
    </div>
  );
}

