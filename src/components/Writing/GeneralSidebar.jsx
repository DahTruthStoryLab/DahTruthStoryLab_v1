// src/components/Writing/GeneralSidebar.jsx
// General sidebar with minimal universal tools for any project type
// Used when genre is undeclared or "General / Undeclared"
// Provides: Outline, Notes, Todo, Logline, Word Targets
//
// ✅ FIX: Chapters in the Outline tab are now clickable.
//    Added onSelectChapter + selectedChapterId props so clicking
//    a chapter navigates to it in the editor without going to the grid.

import React, { useState, useEffect } from 'react';
import {
  FileText,
  StickyNote,
  CheckSquare,
  Target,
  Quote,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
};

/* =============================================================================
   GENERAL SIDEBAR COMPONENT
============================================================================= */

export default function GeneralSidebar({
  chapters = [],
  projectId,
  projectTitle = '',
  wordCount = 0,
  targetWords = 50000,
  onUpdateTarget,
  hasAnyChapters = false,
  selectedChapterId,     // ✅ NEW: which chapter is active in the editor
  onSelectChapter,       // ✅ NEW: callback to navigate to a chapter
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('outline'); // 'outline' | 'notes' | 'todo'

  // Local state for notes and todos (would be persisted via storage in real implementation)
  const [notes, setNotes] = useState('');
  const [todos, setTodos] = useState([]);
  const [logline, setLogline] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [editingLogline, setEditingLogline] = useState(false);
  const [tempLogline, setTempLogline] = useState('');

  // Load saved data
  useEffect(() => {
    if (!projectId) return;
    
    try {
      const savedNotes = localStorage.getItem(`dahtruth-notes-${projectId}`);
      const savedTodos = localStorage.getItem(`dahtruth-todos-${projectId}`);
      const savedLogline = localStorage.getItem(`dahtruth-logline-${projectId}`);
      
      if (savedNotes) setNotes(savedNotes);
      if (savedTodos) setTodos(JSON.parse(savedTodos));
      if (savedLogline) setLogline(savedLogline);
    } catch (e) {
      console.warn('Failed to load sidebar data:', e);
    }
  }, [projectId]);

  // Save notes
  const handleNotesChange = (value) => {
    setNotes(value);
    if (projectId) {
      try {
        localStorage.setItem(`dahtruth-notes-${projectId}`, value);
      } catch (e) {
        console.warn('Failed to save notes:', e);
      }
    }
  };

  // Save logline
  const handleSaveLogline = () => {
    setLogline(tempLogline);
    setEditingLogline(false);
    if (projectId) {
      try {
        localStorage.setItem(`dahtruth-logline-${projectId}`, tempLogline);
      } catch (e) {
        console.warn('Failed to save logline:', e);
      }
    }
  };

  // Todo functions
  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { id: Date.now(), text: newTodo.trim(), done: false }];
    setTodos(updated);
    setNewTodo('');
    if (projectId) {
      try {
        localStorage.setItem(`dahtruth-todos-${projectId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save todos:', e);
      }
    }
  };

  const toggleTodo = (id) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTodos(updated);
    if (projectId) {
      try {
        localStorage.setItem(`dahtruth-todos-${projectId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save todos:', e);
      }
    }
  };

  const deleteTodo = (id) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    if (projectId) {
      try {
        localStorage.setItem(`dahtruth-todos-${projectId}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save todos:', e);
      }
    }
  };

  const progressPercent = targetWords > 0 ? Math.min((wordCount / targetWords) * 100, 100) : 0;

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
            style={{ background: `${BRAND.navy}15` }}
          >
            <BookOpen size={16} style={{ color: BRAND.navy }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Project Tools
            </div>
            <div className="text-xs text-slate-500">
              {chapters.length} chapters • {wordCount.toLocaleString()} words
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
              onClick={() => setActiveTab('outline')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'outline'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={12} />
              Outline
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'notes'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <StickyNote size={12} />
              Notes
            </button>
            <button
              onClick={() => setActiveTab('todo')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'todo'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckSquare size={12} />
              To-Do
            </button>
          </div>

          {/* Outline Tab */}
          {activeTab === 'outline' && (
            <>
              {chapters.length === 0 ? (
                <div className="text-center py-4">
                  <FileText size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">
                    No chapters yet. Add chapters to see your outline.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {chapters.map((chapter, idx) => {
                    const isActive = chapter.id === selectedChapterId;
                    return (
                      <div
                        key={chapter.id}
                        /* ✅ FIX: clicking a chapter now navigates to it */
                        onClick={() => onSelectChapter?.(chapter.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-amber-50 border border-amber-200 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100'
                        }`}
                        title={`Click to open "${chapter.title || 'Untitled'}"`}
                      >
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: isActive ? BRAND.gold : BRAND.navy }}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`text-xs truncate flex-1 ${
                            isActive ? 'font-semibold' : ''
                          }`}
                          style={{ color: isActive ? BRAND.navy : '#334155' }}
                        >
                          {chapter.title || 'Untitled'}
                        </span>
                        {/* ✅ Show active indicator */}
                        {isActive && (
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: BRAND.gold }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Notes Tab */}
          {activeTab === 'notes' && (
            <div>
              <textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Jot down ideas, research, reminders..."
                className="w-full h-40 p-2 text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-saved locally
              </p>
            </div>
          )}

          {/* To-Do Tab */}
          {activeTab === 'todo' && (
            <>
              {/* Add Todo */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a task..."
                  className="flex-1 px-2 py-1.5 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="px-2 py-1.5 rounded bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Todo List */}
              {todos.length === 0 ? (
                <div className="text-center py-4">
                  <CheckSquare size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">
                    No tasks yet. Add your first to-do above.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                        todo.done ? 'bg-green-50' : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          todo.done
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 hover:border-amber-400'
                        }`}
                      >
                        {todo.done && <Check size={10} />}
                      </button>
                      <span
                        className={`text-xs flex-1 ${
                          todo.done ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}
                      >
                        {todo.text}
                      </span>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed count */}
              {todos.length > 0 && (
                <p className="text-[10px] text-slate-400">
                  {todos.filter((t) => t.done).length} of {todos.length} completed
                </p>
              )}
            </>
          )}

          {/* Logline Section */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Quote size={12} />
              Logline / Pitch
            </div>
            {editingLogline ? (
              <div>
                <textarea
                  value={tempLogline}
                  onChange={(e) => setTempLogline(e.target.value)}
                  placeholder="A one-sentence summary of your project..."
                  className="w-full h-16 p-2 text-xs border border-slate-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-amber-200"
                  maxLength={280}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400">
                    {tempLogline.length}/280
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setEditingLogline(false)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleSaveLogline}
                      className="p-1 text-green-500 hover:text-green-600"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTempLogline(logline);
                  setEditingLogline(true);
                }}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors min-h-[40px]"
              >
                {logline ? (
                  <p className="text-xs text-slate-700 italic">"{logline}"</p>
                ) : (
                  <p className="text-xs text-slate-400">Click to add a logline...</p>
                )}
              </div>
            )}
          </div>

          {/* Word Target */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Target size={12} />
              Word Target
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-bold" style={{ color: BRAND.navy }}>
                {wordCount.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">
                / {targetWords.toLocaleString()}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: progressPercent >= 100 ? '#22c55e' : BRAND.gold,
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {progressPercent.toFixed(1)}% complete
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   SIMPLE PROGRESS CARD
   Standalone word count progress display
============================================================================= */

export function ProgressCard({ wordCount = 0, targetWords = 50000 }) {
  const percent = targetWords > 0 ? Math.min((wordCount / targetWords) * 100, 100) : 0;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Target size={14} style={{ color: BRAND.gold }} />
        Progress
      </div>

      <div className="text-center mb-3">
        <div className="text-2xl font-bold" style={{ color: BRAND.navy }}>
          {wordCount.toLocaleString()}
        </div>
        <div className="text-xs text-slate-500">
          of {targetWords.toLocaleString()} words
        </div>
      </div>

      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: percent >= 100 
              ? 'linear-gradient(90deg, #22c55e, #16a34a)' 
              : `linear-gradient(90deg, ${BRAND.gold}, ${BRAND.mauve})`,
          }}
        />
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-slate-500">
        <span>0%</span>
        <span className="font-semibold" style={{ color: percent >= 100 ? '#22c55e' : BRAND.gold }}>
          {percent.toFixed(1)}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
