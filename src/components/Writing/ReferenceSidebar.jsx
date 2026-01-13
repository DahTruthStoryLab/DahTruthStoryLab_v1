// src/components/Writing/ReferenceSidebar.jsx
// Reference/Instructional sidebar for devotionals, workbooks, study guides, manuals
// Tracks key terms, learning objectives, prompts, and lesson structure

import React, { useState, useMemo } from 'react';
import {
  Book,
  Target,
  HelpCircle,
  Layers,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  FileQuestion,
  GraduationCap,
  ListChecks,
  Plus,
  Bookmark,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
  teal: '#0d9488',
};

/* =============================================================================
   EXTRACTION FUNCTIONS
============================================================================= */

/**
 * Extract @term: tags (glossary/key terms)
 */
export function extractTermsFromChapters(chapters = []) {
  const termMap = new Map();
  const tagPattern = /@term:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const sectionTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const term = (match[1] || '').trim();
      if (!term) continue;

      const key = term.toLowerCase();
      if (!termMap.has(key)) {
        termMap.set(key, {
          name: term,
          count: 0,
          sections: new Set(),
        });
      }

      const entry = termMap.get(key);
      entry.count++;
      entry.sections.add(sectionTitle);
    }
  });

  const terms = Array.from(termMap.values()).map((t) => ({
    ...t,
    sections: Array.from(t.sections),
  }));

  terms.sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical for glossary
  return terms;
}

/**
 * Extract @objective: tags (learning objectives)
 */
export function extractObjectivesFromChapters(chapters = []) {
  const objectives = [];
  const tagPattern = /@objective:\s*([^@<\n]+)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const sectionTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const objective = (match[1] || '').trim();
      if (objective) {
        objectives.push({
          text: objective,
          section: sectionTitle,
          sectionId: chapter.id,
        });
      }
    }
  });

  return objectives;
}

/**
 * Extract @prompt: tags (workbook prompts/questions)
 */
export function extractPromptsFromChapters(chapters = []) {
  const prompts = [];
  const tagPattern = /@prompt:\s*([^@<\n]+)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const sectionTitle = chapter?.title || 'Untitled';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const prompt = (match[1] || '').trim();
      if (prompt) {
        prompts.push({
          text: prompt,
          section: sectionTitle,
          sectionId: chapter.id,
        });
      }
    }
  });

  return prompts;
}

/**
 * Combined stats for reference genres
 */
export function computeReferenceStats(chapters = []) {
  const terms = extractTermsFromChapters(chapters);
  const objectives = extractObjectivesFromChapters(chapters);
  const prompts = extractPromptsFromChapters(chapters);

  return {
    terms,
    termCount: terms.length,
    objectives,
    objectiveCount: objectives.length,
    prompts,
    promptCount: prompts.length,
    sectionCount: chapters.length,
  };
}

/* =============================================================================
   REFERENCE SIDEBAR COMPONENT
============================================================================= */

export default function ReferenceSidebar({
  chapters = [],
  onRefresh,
  onAddTermTag,
  hasAnyChapters = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('glossary'); // 'glossary' | 'objectives' | 'prompts'

  // Extract all data
  const { terms, termCount, objectives, objectiveCount, prompts, promptCount, sectionCount } = useMemo(
    () => computeReferenceStats(chapters),
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
            style={{ background: `${BRAND.teal}20` }}
          >
            <GraduationCap size={16} style={{ color: BRAND.teal }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Reference Tools
            </div>
            <div className="text-xs text-slate-500">
              {termCount} terms • {objectiveCount} objectives
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
              onClick={() => setActiveTab('glossary')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'glossary'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Book size={12} />
              Glossary
            </button>
            <button
              onClick={() => setActiveTab('objectives')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'objectives'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Target size={12} />
              Objectives
            </button>
            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'prompts'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <HelpCircle size={12} />
              Prompts
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={!hasAnyChapters}
            className="w-full text-[11px] px-2 py-1.5 rounded border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <RefreshCw size={12} />
            Scan Content
          </button>

          {/* Glossary Tab */}
          {activeTab === 'glossary' && (
            <>
              {termCount === 0 ? (
                <div className="text-center py-4">
                  <Book size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No key terms tagged yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tag key terms as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @term: Grace
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {terms.map((term) => (
                    <div
                      key={term.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bookmark size={14} style={{ color: BRAND.teal }} />
                        <span className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                          {term.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {term.sections.length} section{term.sections.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Alphabetical Index */}
              {termCount > 10 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap gap-1">
                    {Array.from(new Set(terms.map(t => t.name[0].toUpperCase()))).sort().map(letter => (
                      <span
                        key={letter}
                        className="text-[10px] w-5 h-5 flex items-center justify-center rounded bg-slate-100 text-slate-600"
                      >
                        {letter}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <>
              {objectiveCount === 0 ? (
                <div className="text-center py-4">
                  <Target size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No learning objectives yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Add objectives as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @objective: Understand God's grace
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {objectives.map((obj, idx) => (
                    <div
                      key={`${obj.section}-${idx}`}
                      className="flex items-start gap-2 p-2 rounded-lg bg-slate-50"
                    >
                      <CheckSquare size={14} className="mt-0.5 flex-shrink-0" style={{ color: BRAND.teal }} />
                      <div className="min-w-0">
                        <div className="text-xs text-slate-700">
                          {obj.text}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {obj.section}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <>
              {promptCount === 0 ? (
                <div className="text-center py-4">
                  <FileQuestion size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No reflection prompts yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Add prompts as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @prompt: How has this changed your view?
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {prompts.map((prompt, idx) => (
                    <div
                      key={`${prompt.section}-${idx}`}
                      className="p-2 rounded-lg border border-dashed border-slate-200 bg-white"
                    >
                      <div className="text-xs text-slate-700 italic">
                        "{prompt.text}"
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {prompt.section}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Prompt Types Hint */}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                  <strong>Prompt types:</strong> Reflection, Application, Discussion, Action Step
                </p>
              </div>
            </>
          )}

          {/* Stats Summary */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Layers size={12} />
              Content Summary
            </div>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{sectionCount}</div>
                <div className="text-slate-500">Sections</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{termCount}</div>
                <div className="text-slate-500">Terms</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{objectiveCount}</div>
                <div className="text-slate-500">Objectives</div>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <div className="font-semibold text-slate-700">{promptCount}</div>
                <div className="text-slate-500">Prompts</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   LESSON PLANNER COMPONENT
============================================================================= */

export function LessonPlanner({ chapters = [] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <ListChecks size={14} style={{ color: BRAND.teal }} />
        Lesson Structure
      </div>

      <div className="space-y-2">
        {chapters.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">
            Add sections to see your lesson structure
          </p>
        ) : (
          chapters.slice(0, 8).map((chapter, idx) => (
            <div
              key={chapter.id}
              className="flex items-center gap-2 p-2 rounded bg-slate-50"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: BRAND.teal }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate" style={{ color: BRAND.navy }}>
                  {chapter.title || `Section ${idx + 1}`}
                </div>
              </div>
            </div>
          ))
        )}
        {chapters.length > 8 && (
          <p className="text-[10px] text-slate-400 text-center">
            +{chapters.length - 8} more sections
          </p>
        )}
      </div>
    </div>
  );
}

