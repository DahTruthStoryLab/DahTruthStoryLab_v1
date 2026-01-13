// src/components/Writing/HybridSidebar.jsx
// Hybrid sidebar for memoir, biography, and creative non-fiction
// Tracks both real people AND themes

import React, { useState, useMemo } from 'react';
import {
  User,
  Users,
  Lightbulb,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Clock,
  MapPin,
  Heart,
  Star,
  BookOpen,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
};

/* =============================================================================
   PEOPLE EXTRACTION (Similar to characters but for real people)
============================================================================= */

/**
 * Extract @person: tags from chapters
 */
export function extractPeopleFromChapters(chapters = []) {
  const peopleMap = new Map();

  const tagPattern = /@person:\s*([A-Za-z][A-Za-z\s.'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const chapterTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const person = (match[1] || '').trim();
      if (!person) continue;

      const key = person.toLowerCase();
      if (!peopleMap.has(key)) {
        peopleMap.set(key, {
          name: person,
          count: 0,
          chapters: new Set(),
        });
      }

      const entry = peopleMap.get(key);
      entry.count++;
      entry.chapters.add(chapterTitle);
    }
  });

  const people = Array.from(peopleMap.values()).map((p) => ({
    ...p,
    chapters: Array.from(p.chapters),
  }));

  people.sort((a, b) => b.count - a.count);
  return people;
}

/**
 * Extract @theme: tags from chapters
 */
export function extractThemesFromChapters(chapters = []) {
  const themeMap = new Map();

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
        });
      }

      const entry = themeMap.get(key);
      entry.count++;
      entry.chapters.add(chapterTitle);
    }
  });

  const themes = Array.from(themeMap.values()).map((t) => ({
    ...t,
    chapters: Array.from(t.chapters),
  }));

  themes.sort((a, b) => b.count - a.count);
  return themes;
}

/**
 * Extract @event: or @date: tags for timeline
 */
export function extractTimelineEvents(chapters = []) {
  const events = [];

  // Pattern for @event: or @date:
  const eventPattern = /@(?:event|date):\s*([^@<\n]+)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const chapterTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = eventPattern.exec(content)) !== null) {
      const eventText = (match[1] || '').trim();
      if (eventText) {
        events.push({
          text: eventText,
          chapter: chapterTitle,
          chapterId: chapter.id,
        });
      }
    }
  });

  return events;
}

/**
 * Combined stats for hybrid genres
 */
export function computeHybridStats(chapters = []) {
  const people = extractPeopleFromChapters(chapters);
  const themes = extractThemesFromChapters(chapters);
  const events = extractTimelineEvents(chapters);

  return {
    people,
    personCount: people.length,
    themes,
    themeCount: themes.length,
    events,
    eventCount: events.length,
  };
}

/* =============================================================================
   HYBRID SIDEBAR COMPONENT
============================================================================= */

export default function HybridSidebar({
  chapters = [],
  onRefresh,
  onAddPersonTag,
  onAddThemeTag,
  hasAnyChapters = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('people'); // 'people' | 'themes' | 'timeline'

  // Extract all data
  const { people, personCount, themes, themeCount, events, eventCount } = useMemo(
    () => computeHybridStats(chapters),
    [chapters]
  );

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
            style={{ background: `${BRAND.gold}20` }}
          >
            <BookOpen size={16} style={{ color: BRAND.gold }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Memoir Tools
            </div>
            <div className="text-xs text-slate-500">
              {personCount} people • {themeCount} themes
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
              onClick={() => setActiveTab('people')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'people'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users size={12} />
              People
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'themes'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Lightbulb size={12} />
              Themes
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'timeline'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock size={12} />
              Timeline
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={!hasAnyChapters}
            className="w-full text-[11px] px-2 py-1.5 rounded border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <RefreshCw size={12} />
            Scan for People & Themes
          </button>

          {/* People Tab */}
          {activeTab === 'people' && (
            <>
              {personCount === 0 ? (
                <div className="text-center py-4">
                  <User size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No people tagged yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tag real people as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @person: Mom
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {people.map((person) => (
                    <div
                      key={person.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <User size={14} style={{ color: BRAND.gold }} />
                        <span className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                          {person.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {person.chapters.length} ch
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <>
              {themeCount === 0 ? (
                <div className="text-center py-4">
                  <Lightbulb size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No themes tagged yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tag life themes as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @theme: Resilience
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {themes.map((theme) => (
                    <div
                      key={theme.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Lightbulb size={14} style={{ color: BRAND.mauve }} />
                        <span className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                          {theme.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {theme.chapters.length} ch
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <>
              {eventCount === 0 ? (
                <div className="text-center py-4">
                  <Calendar size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No timeline events yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tag events as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @event: 1985 - Born in Chicago
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {events.map((event, idx) => (
                    <div
                      key={`${event.chapter}-${idx}`}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-50"
                    >
                      <div
                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                        style={{ background: BRAND.gold }}
                      />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-700">
                          {event.text}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {event.chapter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline Tips */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                  <strong>Tip:</strong> Use format like{' '}
                  <code className="bg-slate-100 px-1 rounded">@event: Year - Description</code>
                </p>
              </div>
            </>
          )}

          {/* Cross-reference hint */}
          {(personCount > 0 || themeCount > 0) && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Star size={12} />
                Story Elements
              </div>
              <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-semibold text-slate-700">{personCount}</div>
                  <div className="text-slate-500">People</div>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-semibold text-slate-700">{themeCount}</div>
                  <div className="text-slate-500">Themes</div>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-semibold text-slate-700">{eventCount}</div>
                  <div className="text-slate-500">Events</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   LIFE ARC COMPONENT
   Visual representation of memoir timeline
============================================================================= */

export function LifeArc({ chapters = [], events = [] }) {
  const stages = [
    { id: 'early', label: 'Early Life', color: '#93c5fd' },
    { id: 'growth', label: 'Growth', color: BRAND.gold },
    { id: 'challenge', label: 'Challenges', color: '#f87171' },
    { id: 'transformation', label: 'Transformation', color: BRAND.mauve },
    { id: 'present', label: 'Present', color: '#6ee7b7' },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Clock size={14} style={{ color: BRAND.gold }} />
        Life Journey
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-slate-200" />

        {/* Stages */}
        <div className="space-y-3">
          {stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3 relative">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center z-10"
                style={{ background: stage.color }}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: BRAND.navy }}>
                  {stage.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 mt-3">
        Tag chapters with @stage: early, @stage: growth, etc.
      </p>
    </div>
  );
}

