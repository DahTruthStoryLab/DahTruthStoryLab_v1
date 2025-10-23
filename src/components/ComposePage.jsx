// src/components/ComposePage_Updated.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useStory } from '../contexts/StoryContext';
import { runGrammar, runStyle, runReadability, runAssistant } from '../lib/api';

export default function ComposePageUpdated() {
  const {
    chapters,
    currentChapterId,
    getCurrentChapter,
    setCurrentChapter,
    updateChapter,
    addChapter,
    logActivity,
  } = useStory();

  const [editorContent, setEditorContent] = useState('');
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const quillRef = useRef(null);

  // Load current chapter content
  useEffect(() => {
    const currentChapter = getCurrentChapter();
    if (currentChapter) {
      setEditorContent(currentChapter.content || '');
    } else if (chapters.length > 0) {
      // If no current chapter, select the first one
      setCurrentChapter(chapters[0].id);
    }
  }, [currentChapterId, getCurrentChapter, chapters, setCurrentChapter]);

  // Auto-save every 5 seconds
  useEffect(() => {
    if (!currentChapterId) return;

    const timer = setTimeout(() => {
      saveCurrentChapter();
    }, 5000);

    return () => clearTimeout(timer);
  }, [editorContent, currentChapterId]);

  const saveCurrentChapter = () => {
    if (currentChapterId && editorContent) {
      updateChapter(currentChapterId, { content: editorContent });
    }
  };

  const handleEditorChange = (content) => {
    setEditorContent(content);
  };

  // ==================== AI FUNCTIONS ====================

  const handleGrammarCheck = async () => {
    if (!editorContent) {
      alert('Please write some text first!');
      return;
    }

    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      const result = await runGrammar(editorContent);
      setAiResults({
        type: 'grammar',
        data: result,
      });
      logActivity('ai_grammar_check', { chapterId: currentChapterId });
    } catch (error) {
      console.error('Grammar check error:', error);
      alert('Grammar check failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleStyleCheck = async () => {
    if (!editorContent) {
      alert('Please write some text first!');
      return;
    }

    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      const result = await runStyle(editorContent);
      setAiResults({
        type: 'style',
        data: result,
      });
      logActivity('ai_style_check', { chapterId: currentChapterId });
    } catch (error) {
      console.error('Style check error:', error);
      alert('Style check failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleReadabilityCheck = async () => {
    if (!editorContent) {
      alert('Please write some text first!');
      return;
    }

    setAiLoading(true);
    setShowAiPanel(true);
    
    try {
      const result = await runReadability(editorContent);
      setAiResults({
        type: 'readability',
        data: result,
      });
      logActivity('ai_readability_check', { chapterId: currentChapterId });
    } catch (error) {
      console.error('Readability check error:', error);
      alert('Readability check failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiImprove = async () => {
    if (!editorContent) {
      alert('Please write some text first!');
      return;
    }

    setAiLoading(true);
    
    try {
      const result = await runAssistant(editorContent, 'improve', '');
      if (result.improvedHtml) {
        setEditorContent(result.improvedHtml);
      }
      logActivity('ai_improve', { chapterId: currentChapterId });
      alert('Text improved successfully!');
    } catch (error) {
      console.error('AI improve error:', error);
      alert('AI improve failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // ==================== CHAPTER MANAGEMENT ====================

  const handleNewChapter = () => {
    const title = prompt('Enter chapter title:');
    if (title) {
      const newChapter = addChapter(title);
      setCurrentChapter(newChapter.id);
    }
  };

  const handleChapterSelect = (chapterId) => {
    saveCurrentChapter(); // Save current before switching
    setCurrentChapter(chapterId);
  };

  // ==================== QUILL CONFIG ====================

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      ['blockquote', 'code-block'],
      [{ align: [] }],
      ['clean'],
    ],
  };

  const currentChapter = getCurrentChapter();

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`min-h-screen bg-[var(--color-parchment)] ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="border-b border-[var(--color-ink)]/20 bg-white/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-ink)]">
                {currentChapter?.title || 'No Chapter Selected'}
              </h1>
              <p className="text-sm text-[var(--color-ink)]/60">
                {currentChapter?.wordCount || 0} words
              </p>
            </div>
            
            {/* AI Toolbar */}
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
              </button>
              <button
                onClick={handleGrammarCheck}
                disabled={aiLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Grammar Check
              </button>
              <button
                onClick={handleStyleCheck}
                disabled={aiLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                Style Check
              </button>
              <button
                onClick={handleReadabilityCheck}
                disabled={aiLoading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Readability
              </button>
              <button
                onClick={handleAiImprove}
                disabled={aiLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                AI Improve
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Chapter Sidebar - Hide in fullscreen */}
          {!isFullscreen && (
            <div className="col-span-3 space-y-4">
            <button
              onClick={handleNewChapter}
              className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded hover:opacity-90"
            >
              + New Chapter
            </button>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-[var(--color-ink)]">Chapters</h3>
              {chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => handleChapterSelect(chapter.id)}
                  className={`w-full text-left px-4 py-2 rounded transition ${
                    chapter.id === currentChapterId
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                >
                  <div className="font-medium">{chapter.title}</div>
                  <div className="text-xs opacity-70">{chapter.wordCount} words</div>
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Editor */}
          <div className={isFullscreen ? 'col-span-12' : showAiPanel ? 'col-span-6' : 'col-span-9'}>
            <div className="bg-white rounded-lg shadow-lg">
              <ReactQuill
                ref={quillRef}
                value={editorContent}
                onChange={handleEditorChange}
                modules={modules}
                theme="snow"
                placeholder="Start writing your story..."
                style={{ height: '70vh' }}
              />
            </div>
          </div>

          {/* AI Results Panel */}
          {showAiPanel && !isFullscreen && (
            <div className="col-span-3">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-[var(--color-ink)]">
                    AI Results
                  </h3>
                  <button
                    onClick={() => setShowAiPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                {aiLoading && (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Analyzing...</p>
                  </div>
                )}

                {!aiLoading && aiResults && (
                  <div className="space-y-4">
                    {/* Grammar Results */}
                    {aiResults.type === 'grammar' && (
                      <div>
                        <h4 className="font-medium mb-2">Grammar Suggestions:</h4>
                        {aiResults.data.suggestions?.length > 0 ? (
                          <ul className="space-y-2">
                            {aiResults.data.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm bg-yellow-50 p-2 rounded">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-green-600">No grammar issues found!</p>
                        )}
                      </div>
                    )}

                    {/* Style Results */}
                    {aiResults.type === 'style' && (
                      <div>
                        <h4 className="font-medium mb-2">Style Suggestions:</h4>
                        {aiResults.data.suggestions?.length > 0 ? (
                          <ul className="space-y-2">
                            {aiResults.data.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm bg-blue-50 p-2 rounded">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-green-600">Style looks great!</p>
                        )}
                      </div>
                    )}

                    {/* Readability Results */}
                    {aiResults.type === 'readability' && (
                      <div>
                        <h4 className="font-medium mb-2">Readability Analysis:</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Score:</span>
                            <span className="font-semibold">{aiResults.data.score}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Grade Level:</span>
                            <span className="font-semibold">{aiResults.data.gradeLevel}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Reading Level:</span>
                            <span className="font-semibold">{aiResults.data.readingLevel}</span>
                          </div>
                        </div>
                        {aiResults.data.suggestions?.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-medium mb-2">Suggestions:</h5>
                            <ul className="space-y-1">
                              {aiResults.data.suggestions.map((suggestion, idx) => (
                                <li key={idx} className="text-sm text-gray-700">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
