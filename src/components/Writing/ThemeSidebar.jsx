// src/components/Writing/ThemeSidebar.jsx
// Theme tracking sidebar for essays, non-fiction, and argument-driven writing
// Replaces CharacterSidebar when genre is theme-based

import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  Plus,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  FileText,
  Target,
  Quote,
  Trash2,
  Edit3,
  Check,
  X,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
};

/* =============================================================================
   THEME EXTRACTION
============================================================================= */

/**
 * Extract @theme: tags from chapters
 */
export function extractThemesFromChapters(chapters = []) {
  const themeMap = new Map(); // theme -> { count, chapters, contexts }

  const tagPattern = /@theme:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const chapterTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const theme = (match[1] || '').trim();
      if (!theme) continue;

      const key = theme.toLowerCase();
      if (!themeMap.has(key)) {
        themeMap.set(key, {
          name: theme,
          count: 0,
          chapters: new Set(),
          type: 'tagged', // 'tagged' or 'detected'
        });
      }

      const entry = themeMap.get(key);
      entry.count++;
      entry.chapters.add(chapterTitle);
    }
  });

  // Convert to array
  const themes = Array.from(themeMap.values()).map((t) => ({
    ...t,
    chapters: Array.from(t.chapters),
  }));

  // Sort by count
  themes.sort((a, b) => b.count - a.count);

  return themes;
}

/**
 * Count total themes
 */
export function computeThemesFromChapters(chapters = []) {
  const themes = extractThemesFromChapters(chapters);
  return {
    themes: themes.map((t) => t.name),
    themeCount: themes.length,
    themeDetails: themes,
  };
}

/* =============================================================================
   THEME DETECTION (AI-assisted or regex)
============================================================================= */

// Common theme indicators
const THEME_INDICATORS = [
  // Abstract concepts
  'freedom', 'justice', 'equality', 'power', 'corruption', 'redemption',
  'identity', 'belonging', 'isolation', 'community', 'faith', 'doubt',
  'truth', 'deception', 'love', 'loss', 'hope', 'despair', 'change',
  'tradition', 'progress', 'sacrifice', 'survival', 'morality', 'ethics',
  // Non-fiction concepts
  'argument', 'evidence', 'analysis', 'critique', 'perspective', 'theory',
  'impact', 'influence', 'consequence', 'cause', 'effect', 'solution',
  'problem', 'challenge', 'opportunity', 'risk', 'benefit', 'cost',
];

/**
 * Detect potential themes using regex patterns
 */
export function detectPotentialThemes(chapters = []) {
  const candidates = new Map();

  // Get already tagged themes
  const existingThemes = new Set();
  const tagPattern = /@theme:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;
  chapters.forEach((ch) => {
    let match;
    while ((match = tagPattern.exec(ch?.content || '')) !== null) {
      existingThemes.add((match[1] || '').trim().toLowerCase());
    }
  });

  chapters.forEach((chapter) => {
    const content = (chapter?.content || '').toLowerCase();
    const chapterTitle = chapter?.title || 'Untitled';

    // Look for capitalized phrases that might be themes
    const phrasePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    let match;
    const originalContent = chapter?.content || '';
    
    while ((match = phrasePattern.exec(originalContent)) !== null) {
      const phrase = match[1];
      const key = phrase.toLowerCase();
      
      // Skip if already tagged or too short
      if (existingThemes.has(key) || phrase.length < 4) continue;
      
      // Check if it might be a theme
      const isLikelyTheme = THEME_INDICATORS.some((ind) => key.includes(ind));
      
      if (isLikelyTheme) {
        if (!candidates.has(key)) {
          candidates.set(key, {
            name: phrase,
            count: 0,
            chapters: new Set(),
            confidence: 'low',
          });
        }
        const entry = candidates.get(key);
        entry.count++;
        entry.chapters.add(chapterTitle);
      }
    }

    // Also look for repeated capitalized phrases (likely important concepts)
    const conceptPattern = /\b([A-Z][a-z]{3,}(?:\s+[A-Z][a-z]+)?)\b/g;
    while ((match = conceptPattern.exec(originalContent)) !== null) {
      const phrase = match[1];
      const key = phrase.toLowerCase();
      
      if (existingThemes.has(key)) continue;
      
      if (!candidates.has(key)) {
        candidates.set(key, {
          name: phrase,
          count: 0,
          chapters: new Set(),
          confidence: 'low',
        });
      }
      candidates.get(key).count++;
      candidates.get(key).chapters.add(chapterTitle);
    }
  });

  // Filter to those appearing multiple times
  const results = Array.from(candidates.values())
    .filter((c) => c.count >= 2)
    .map((c) => ({
      ...c,
      chapters: Array.from(c.chapters),
      confidence: c.count >= 5 ? 'high' : c.count >= 3 ? 'medium' : 'low',
    }));

  results.sort((a, b) => b.count - a.count);

  return results.slice(0, 20); // Top 20 candidates
}

/* =============================================================================
   THEME SIDEBAR COMPONENT
============================================================================= */

export default function ThemeSidebar({
  chapters = [],
  onRefresh,
  onAddThemeTag,
  hasAnyChapters = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetected, setShowDetected] = useState(false);
  const [editingTheme, setEditingTheme] = useState(null);
  const [newThemeName, setNewThemeName] = useState('');

  // Extract tagged themes
  const { themes, themeCount, themeDetails } = useMemo(
    () => computeThemesFromChapters(chapters),
    [chapters]
  );

  // Detect potential themes
  const detectedThemes = useMemo(
    () => detectPotentialThemes(chapters),
    [chapters]
  );

  const handleAddTheme = (themeName) => {
    if (onAddThemeTag && themeName) {
      onAddThemeTag(themeName);
    }
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
            style={{ background: `${BRAND.mauve}20` }}
          >
            <Lightbulb size={16} style={{ color: BRAND.navy }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Themes & Concepts
            </div>
            <div className="text-xs text-slate-500">
              {themeCount} tagged
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
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={!hasAnyChapters}
              className="text-[11px] px-2 py-1 rounded border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1"
              title="Refresh theme detection"
            >
              <RefreshCw size={12} />
              Scan
            </button>
            <button
              onClick={() => setShowDetected(!showDetected)}
              className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1 ${
                showDetected
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Target size={12} />
              {showDetected ? 'Hide' : 'Show'} Suggestions
            </button>
          </div>

          {/* Tagged Themes */}
          {themeCount === 0 ? (
            <div className="text-center py-4">
              <Lightbulb size={24} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs text-slate-500 mb-2">
                No themes tagged yet.
              </p>
              <p className="text-[11px] text-slate-400 mb-3">
                Tag themes in your writing as{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                  @theme: Your Theme
                </code>
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {themeDetails.map((theme) => (
                <div
                  key={theme.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Lightbulb size={14} style={{ color: BRAND.mauve }} />
                    <span className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                      {theme.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">
                      {theme.count}×
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {theme.chapters.length} ch
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Detected Themes (Suggestions) */}
          {showDetected && detectedThemes.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Target size={12} />
                Suggested Themes
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {detectedThemes.map((theme) => (
                  <div
                    key={theme.name}
                    className="flex items-center justify-between p-2 rounded-lg border border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-slate-600 truncate">
                        {theme.name}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddTheme(theme.name)}
                      className="opacity-0 group-hover:opacity-100 text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all"
                    >
                      + Tag
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Click "+ Tag" to add a theme tag to your content
              </p>
            </div>
          )}

          {/* Theme Roadmap Preview */}
          {themeCount > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <FileText size={12} />
                Theme Coverage
              </div>
              <div className="space-y-1">
                {themeDetails.slice(0, 5).map((theme) => (
                  <div key={theme.name} className="text-[10px]">
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span className="truncate">{theme.name}</span>
                      <span>{theme.chapters.length} chapters</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((theme.chapters.length / chapters.length) * 100, 100)}%`,
                          background: BRAND.mauve,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   ARGUMENT ARC COMPONENT
   For tracking thesis → evidence → conclusion structure
============================================================================= */

export function ArgumentArc({ chapters = [] }) {
  const stages = [
    { id: 'intro', label: 'Introduction', icon: FileText, color: '#93c5fd' },
    { id: 'thesis', label: 'Thesis', icon: Target, color: BRAND.gold },
    { id: 'evidence', label: 'Evidence', icon: Quote, color: BRAND.mauve },
    { id: 'conclusion', label: 'Conclusion', icon: Check, color: '#6ee7b7' },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Target size={14} style={{ color: BRAND.gold }} />
        Argument Structure
      </div>

      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <div key={stage.id} className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: stage.color }}
            >
              {idx + 1}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium" style={{ color: BRAND.navy }}>
                {stage.label}
              </div>
            </div>
            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: '0%', background: stage.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Tag chapters with @stage: intro, @stage: thesis, etc.
      </p>
    </div>
  );
}

