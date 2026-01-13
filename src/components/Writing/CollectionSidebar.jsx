// src/components/Writing/CollectionSidebar.jsx
// Collection sidebar for anthologies, short story collections, poetry, flash fiction
// Tracks individual pieces, shared elements, and publication status

import React, { useState, useMemo } from 'react';
import {
  Files,
  FileText,
  Users,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  Clock,
  Send,
  Award,
  BarChart3,
  Link2,
  Sparkles,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
  purple: '#8b5cf6',
};

/* =============================================================================
   EXTRACTION FUNCTIONS
============================================================================= */

/**
 * Extract piece metadata from chapter content
 * Looks for patterns like:
 * - Status: Draft/Complete/Published
 * - POV: First/Third/Omniscient
 * - Tone: Dark/Light/Humorous
 * - Length: Flash/Short/Novella
 */
export function extractPieceMetadata(content = '') {
  const metadata = {
    status: null,
    pov: null,
    tone: null,
    length: null,
    previouslyPublished: false,
    submittedTo: null,
  };

  // Status
  const statusMatch = content.match(/@status:\s*(draft|complete|published|submitted|accepted|rejected)/i);
  if (statusMatch) {
    metadata.status = statusMatch[1].toLowerCase();
  }

  // POV
  const povMatch = content.match(/@pov:\s*(first|second|third|omniscient)/i);
  if (povMatch) {
    metadata.pov = povMatch[1].toLowerCase();
  }

  // Tone
  const toneMatch = content.match(/@tone:\s*([A-Za-z\s,]+?)(?=[@<\n]|$)/i);
  if (toneMatch) {
    metadata.tone = toneMatch[1].trim();
  }

  // Length category
  const wordCount = (content.match(/\b\w+\b/g) || []).length;
  if (wordCount < 1000) {
    metadata.length = 'flash';
  } else if (wordCount < 7500) {
    metadata.length = 'short';
  } else if (wordCount < 20000) {
    metadata.length = 'novelette';
  } else {
    metadata.length = 'novella';
  }

  // Previously published
  if (/@published/i.test(content)) {
    metadata.previouslyPublished = true;
  }

  return metadata;
}

/**
 * Extract shared characters across pieces
 */
export function extractSharedCharacters(chapters = []) {
  const charMap = new Map();
  const tagPattern = /@char:\s*([A-Za-z][A-Za-z\s.'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const pieceTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const char = (match[1] || '').trim();
      if (!char) continue;

      const key = char.toLowerCase();
      if (!charMap.has(key)) {
        charMap.set(key, {
          name: char,
          pieces: new Set(),
        });
      }
      charMap.get(key).pieces.add(pieceTitle);
    }
  });

  // Only return characters that appear in multiple pieces
  const shared = Array.from(charMap.values())
    .filter((c) => c.pieces.size > 1)
    .map((c) => ({
      ...c,
      pieces: Array.from(c.pieces),
    }));

  shared.sort((a, b) => b.pieces.length - a.pieces.length);
  return shared;
}

/**
 * Extract shared themes across pieces
 */
export function extractSharedThemes(chapters = []) {
  const themeMap = new Map();
  const tagPattern = /@theme:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const pieceTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const theme = (match[1] || '').trim();
      if (!theme) continue;

      const key = theme.toLowerCase();
      if (!themeMap.has(key)) {
        themeMap.set(key, {
          name: theme,
          pieces: new Set(),
        });
      }
      themeMap.get(key).pieces.add(pieceTitle);
    }
  });

  const themes = Array.from(themeMap.values()).map((t) => ({
    ...t,
    pieces: Array.from(t.pieces),
  }));

  themes.sort((a, b) => b.pieces.length - a.pieces.length);
  return themes;
}

/**
 * Combined stats for collections
 */
export function computeCollectionStats(chapters = []) {
  const pieces = chapters.map((ch) => ({
    id: ch.id,
    title: ch.title || 'Untitled',
    wordCount: ((ch.content || '').match(/\b\w+\b/g) || []).length,
    metadata: extractPieceMetadata(ch.content || ''),
  }));

  const sharedCharacters = extractSharedCharacters(chapters);
  const sharedThemes = extractSharedThemes(chapters);

  const statusCounts = {
    draft: pieces.filter((p) => !p.metadata.status || p.metadata.status === 'draft').length,
    complete: pieces.filter((p) => p.metadata.status === 'complete').length,
    submitted: pieces.filter((p) => p.metadata.status === 'submitted').length,
    published: pieces.filter((p) => p.metadata.status === 'published').length,
  };

  const totalWords = pieces.reduce((sum, p) => sum + p.wordCount, 0);

  return {
    pieces,
    pieceCount: pieces.length,
    sharedCharacters,
    sharedThemes,
    statusCounts,
    totalWords,
  };
}

/* =============================================================================
   COLLECTION SIDEBAR COMPONENT
============================================================================= */

export default function CollectionSidebar({
  chapters = [],
  onRefresh,
  onSelectPiece,
  hasAnyChapters = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('pieces'); // 'pieces' | 'shared' | 'status'

  // Extract all data
  const { pieces, pieceCount, sharedCharacters, sharedThemes, statusCounts, totalWords } = useMemo(
    () => computeCollectionStats(chapters),
    [chapters]
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <Award size={12} className="text-green-500" />;
      case 'submitted':
        return <Send size={12} className="text-blue-500" />;
      case 'complete':
        return <CheckCircle size={12} className="text-purple-500" />;
      default:
        return <Circle size={12} className="text-slate-300" />;
    }
  };

  const getLengthBadge = (length) => {
    const colors = {
      flash: 'bg-pink-100 text-pink-700',
      short: 'bg-blue-100 text-blue-700',
      novelette: 'bg-purple-100 text-purple-700',
      novella: 'bg-amber-100 text-amber-700',
    };
    return colors[length] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${BRAND.purple}20` }}
          >
            <Files size={16} style={{ color: BRAND.purple }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Collection
            </div>
            <div className="text-xs text-slate-500">
              {pieceCount} pieces • {totalWords.toLocaleString()} words
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('pieces')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'pieces'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={12} />
              Pieces
            </button>
            <button
              onClick={() => setActiveTab('shared')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'shared'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Link2 size={12} />
              Shared
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'status'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <BarChart3 size={12} />
              Status
            </button>
          </div>

          {/* Pieces Tab */}
          {activeTab === 'pieces' && (
            <>
              {pieceCount === 0 ? (
                <div className="text-center py-4">
                  <Files size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">
                    No pieces yet. Each chapter = one piece.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {pieces.map((piece) => (
                    <div
                      key={piece.id}
                      onClick={() => onSelectPiece?.(piece.id)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {getStatusIcon(piece.metadata.status)}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                          {piece.title}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {piece.wordCount.toLocaleString()} words
                        </div>
                      </div>
                      {piece.metadata.length && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded capitalize ${getLengthBadge(piece.metadata.length)}`}>
                          {piece.metadata.length}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add metadata hint */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                  Add <code className="bg-slate-100 px-1 rounded">@status: complete</code> to track progress
                </p>
              </div>
            </>
          )}

          {/* Shared Elements Tab */}
          {activeTab === 'shared' && (
            <>
              {/* Shared Characters */}
              <div>
                <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                  <Users size={12} />
                  Recurring Characters
                </div>
                {sharedCharacters.length === 0 ? (
                  <p className="text-[10px] text-slate-400 py-2">
                    No characters appear in multiple pieces yet
                  </p>
                ) : (
                  <div className="space-y-1">
                    {sharedCharacters.slice(0, 5).map((char) => (
                      <div
                        key={char.name}
                        className="flex items-center justify-between p-1.5 rounded bg-slate-50"
                      >
                        <span className="text-xs text-slate-700">{char.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {char.pieces.length} pieces
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared Themes */}
              <div className="pt-2 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                  <Lightbulb size={12} />
                  Common Themes
                </div>
                {sharedThemes.length === 0 ? (
                  <p className="text-[10px] text-slate-400 py-2">
                    Tag themes with <code className="bg-slate-100 px-1 rounded">@theme:</code>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {sharedThemes.slice(0, 8).map((theme) => (
                      <span
                        key={theme.name}
                        className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700"
                      >
                        {theme.name} ({theme.pieces.length})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Status Tab */}
          {activeTab === 'status' && (
            <>
              {/* Status Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Circle size={14} className="text-slate-300" />
                    <span className="text-xs text-slate-700">Drafts</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: BRAND.navy }}>
                    {statusCounts.draft}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-purple-500" />
                    <span className="text-xs text-slate-700">Complete</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: BRAND.navy }}>
                    {statusCounts.complete}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2">
                    <Send size={14} className="text-blue-500" />
                    <span className="text-xs text-slate-700">Submitted</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: BRAND.navy }}>
                    {statusCounts.submitted}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2">
                    <Award size={14} className="text-green-500" />
                    <span className="text-xs text-slate-700">Published</span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: BRAND.navy }}>
                    {statusCounts.published}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              {pieceCount > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] text-slate-500 mb-1">
                    Collection Progress
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-green-400"
                      style={{ width: `${(statusCounts.published / pieceCount) * 100}%` }}
                    />
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${(statusCounts.submitted / pieceCount) * 100}%` }}
                    />
                    <div
                      className="h-full bg-purple-400"
                      style={{ width: `${(statusCounts.complete / pieceCount) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Stats */}
          <div className="pt-3 border-t border-slate-100">
            <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{pieceCount}</div>
                <div className="text-slate-500">Pieces</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{totalWords.toLocaleString()}</div>
                <div className="text-slate-500">Words</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{sharedThemes.length}</div>
                <div className="text-slate-500">Themes</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   COLLECTION INDEX COMPONENT
   Table of contents for the collection
============================================================================= */

export function CollectionIndex({ chapters = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Sparkles size={14} style={{ color: BRAND.purple }} />
        Collection Contents
      </div>

      {chapters.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">
          Add pieces to build your collection
        </p>
      ) : (
        <div className="space-y-1">
          {chapters.map((chapter, idx) => (
            <div
              key={chapter.id}
              className="flex items-center gap-2 py-1.5 border-b border-slate-100 last:border-0"
            >
              <span className="text-[10px] text-slate-400 w-4">{idx + 1}.</span>
              <span className="text-xs text-slate-700 flex-1 truncate">
                {chapter.title || 'Untitled'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

