// src/contexts/StoryContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Create the context
const StoryContext = createContext(null);

// Hook to use the context
export const useStory = () => {
  const context = useContext(StoryContext);
  if (!context) {
    throw new Error('useStory must be used within a StoryProvider');
  }
  return context;
};

// Provider component
export const StoryProvider = ({ children }) => {
  // ==================== STATE ====================
  
  // Story Metadata
  const [storyMeta, setStoryMeta] = useState({
    title: 'Untitled Story',
    author: '',
    status: 'draft', // draft, revision, final
    genre: '',
    synopsis: '',
    coverImage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Chapters
  const [chapters, setChapters] = useState([]);
  
  // Current active chapter (for writing page)
  const [currentChapterId, setCurrentChapterId] = useState(null);

  // Characters
  const [characters, setCharacters] = useState([]);

  // Writing Goals
  const [goals, setGoals] = useState({
    dailyWordCount: 1000,
    totalWordCountGoal: 50000,
    deadline: null,
  });

  // Activity Log
  const [activityLog, setActivityLog] = useState([]);

  // Statistics
  const [stats, setStats] = useState({
    totalWords: 0,
    todayWords: 0,
    currentStreak: 0,
    lastWriteDate: null,
  });

  // ==================== LOAD FROM LOCALSTORAGE ====================
  
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const loadFromLocalStorage = () => {
    try {
      // Load story meta
      const savedMeta = localStorage.getItem('dt_story_meta');
      if (savedMeta) setStoryMeta(JSON.parse(savedMeta));

      // Load chapters (migrate from old format if needed)
      const savedChapters = localStorage.getItem('dt_chapters_v3');
      if (savedChapters) {
        setChapters(JSON.parse(savedChapters));
      } else {
        // Try to migrate from old TOC format
        const oldChapters = localStorage.getItem('dt_chapters_v2');
        if (oldChapters) {
          const migrated = JSON.parse(oldChapters).map(ch => ({
            id: ch.id,
            title: ch.title || 'Untitled Chapter',
            content: '', // Old format didn't store content here
            wordCount: ch.wordCount || 0,
            order: ch.order,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
          setChapters(migrated);
        }
      }

      // Load characters (migrate from Character Roadmap if needed)
      const savedCharacters = localStorage.getItem('dt_characters');
      if (savedCharacters) {
        setCharacters(JSON.parse(savedCharacters));
      } else {
        // Try to migrate from Character Roadmap
        const roadmapData = localStorage.getItem('characterRoadmap');
        if (roadmapData) {
          const roadmap = JSON.parse(roadmapData);
          const migratedChars = Object.values(roadmap.characters || {}).map(char => ({
            id: char.id,
            name: char.name,
            role: 'character',
            traits: [],
            notes: '',
            appearances: [],
          }));
          setCharacters(migratedChars);
        }
      }

      // Load goals
      const savedGoals = localStorage.getItem('dt_writing_goals');
      if (savedGoals) setGoals(JSON.parse(savedGoals));

      // Load activity log
      const savedActivity = localStorage.getItem('dt_activity_log');
      if (savedActivity) setActivityLog(JSON.parse(savedActivity));

      // Load stats
      const savedStats = localStorage.getItem('dt_writing_stats');
      if (savedStats) setStats(JSON.parse(savedStats));

      // Load current chapter
      const savedCurrentChapter = localStorage.getItem('dt_current_chapter_id');
      if (savedCurrentChapter) setCurrentChapterId(savedCurrentChapter);

    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // ==================== SAVE TO LOCALSTORAGE ====================
  
  useEffect(() => {
    saveToLocalStorage();
  }, [storyMeta, chapters, characters, goals, activityLog, stats, currentChapterId]);

  const saveToLocalStorage = () => {
    try {
      localStorage.setItem('dt_story_meta', JSON.stringify(storyMeta));
      localStorage.setItem('dt_chapters_v3', JSON.stringify(chapters));
      localStorage.setItem('dt_characters', JSON.stringify(characters));
      localStorage.setItem('dt_writing_goals', JSON.stringify(goals));
      localStorage.setItem('dt_activity_log', JSON.stringify(activityLog));
      localStorage.setItem('dt_writing_stats', JSON.stringify(stats));
      if (currentChapterId) {
        localStorage.setItem('dt_current_chapter_id', currentChapterId);
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // ==================== ACTIVITY LOGGING ====================
  
  const logActivity = useCallback((action, details = {}) => {
    const activity = {
      id: Date.now().toString(),
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    
    setActivityLog(prev => [activity, ...prev].slice(0, 50)); // Keep last 50 activities
  }, []);

  // ==================== STORY META FUNCTIONS ====================
  
  const updateStoryMeta = useCallback((updates) => {
    setStoryMeta(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
    logActivity('story_meta_updated', updates);
  }, [logActivity]);

  // ==================== CHAPTER FUNCTIONS ====================
  
  const addChapter = useCallback((title = 'Untitled Chapter', content = '') => {
    const newChapter = {
      id: Date.now().toString(),
      title,
      content,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      order: chapters.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    setChapters(prev => [...prev, newChapter]);
    logActivity('chapter_added', { title, chapterId: newChapter.id });
    return newChapter;
  }, [chapters.length, logActivity]);

  const updateChapter = useCallback((chapterId, updates) => {
    setChapters(prev => prev.map(ch => {
      if (ch.id === chapterId) {
        const updatedContent = updates.content !== undefined ? updates.content : ch.content;
        const wordCount = updatedContent.split(/\s+/).filter(Boolean).length;
        
        return {
          ...ch,
          ...updates,
          wordCount,
          updatedAt: new Date().toISOString(),
        };
      }
      return ch;
    }));
    
    logActivity('chapter_updated', { chapterId, ...updates });
  }, [logActivity]);

  const deleteChapter = useCallback((chapterId) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    setChapters(prev => prev.filter(ch => ch.id !== chapterId));
    logActivity('chapter_deleted', { title: chapter?.title, chapterId });
  }, [chapters, logActivity]);

  const reorderChapters = useCallback((newOrder) => {
    setChapters(newOrder.map((ch, idx) => ({ ...ch, order: idx })));
    logActivity('chapters_reordered');
  }, [logActivity]);

  const getCurrentChapter = useCallback(() => {
    return chapters.find(ch => ch.id === currentChapterId) || null;
  }, [chapters, currentChapterId]);

  const setCurrentChapter = useCallback((chapterId) => {
    setCurrentChapterId(chapterId);
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      logActivity('chapter_opened', { title: chapter.title, chapterId });
    }
  }, [chapters, logActivity]);

  // ==================== CHARACTER FUNCTIONS ====================
  
  const addCharacter = useCallback((name, details = {}) => {
    const newCharacter = {
      id: Date.now().toString(),
      name,
      role: details.role || 'character',
      traits: details.traits || [],
      notes: details.notes || '',
      appearances: details.appearances || [],
      createdAt: new Date().toISOString(),
    };
    
    setCharacters(prev => [...prev, newCharacter]);
    logActivity('character_added', { name, characterId: newCharacter.id });
    return newCharacter;
  }, [logActivity]);

  const updateCharacter = useCallback((characterId, updates) => {
    setCharacters(prev => prev.map(char => 
      char.id === characterId ? { ...char, ...updates } : char
    ));
    logActivity('character_updated', { characterId, ...updates });
  }, [logActivity]);

  const deleteCharacter = useCallback((characterId) => {
    const character = characters.find(ch => ch.id === characterId);
    setCharacters(prev => prev.filter(ch => ch.id !== characterId));
    logActivity('character_deleted', { name: character?.name, characterId });
  }, [characters, logActivity]);

  const extractCharactersFromText = useCallback(async (text) => {
    // This would call your AI API to extract character names
    // For now, a simple regex-based extraction
    const names = new Set();
    const words = text.split(/\s+/);
    
    // Look for capitalized words that might be names
    words.forEach(word => {
      if (/^[A-Z][a-z]+$/.test(word) && word.length > 2) {
        names.add(word);
      }
    });
    
    // Filter out common words
    const commonWords = new Set(['The', 'This', 'That', 'They', 'Then', 'There', 'Their']);
    const potentialNames = Array.from(names).filter(n => !commonWords.has(n));
    
    // Add only new characters
    potentialNames.forEach(name => {
      if (!characters.find(ch => ch.name === name)) {
        addCharacter(name, { role: 'character (auto-detected)' });
      }
    });
    
    return potentialNames;
  }, [characters, addCharacter]);

  // ==================== GOALS & STATS ====================
  
  const updateGoals = useCallback((updates) => {
    setGoals(prev => ({ ...prev, ...updates }));
    logActivity('goals_updated', updates);
  }, [logActivity]);

  const updateStats = useCallback((wordCount) => {
    const today = new Date().toDateString();
    const isToday = stats.lastWriteDate === today;
    
    setStats(prev => ({
      totalWords: prev.totalWords + wordCount,
      todayWords: isToday ? prev.todayWords + wordCount : wordCount,
      currentStreak: isToday ? prev.currentStreak : prev.currentStreak + 1,
      lastWriteDate: today,
    }));
  }, [stats.lastWriteDate]);

  const getTotalWordCount = useCallback(() => {
    return chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  }, [chapters]);

  // ==================== EXPORT FUNCTIONS ====================
  
  const exportStory = useCallback((format = 'json') => {
    const data = {
      meta: storyMeta,
      chapters,
      characters,
      goals,
      exportedAt: new Date().toISOString(),
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${storyMeta.title.replace(/\s+/g, '_')}_export.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    
    logActivity('story_exported', { format });
  }, [storyMeta, chapters, characters, goals, logActivity]);

  const importStory = useCallback((data) => {
    try {
      if (data.meta) setStoryMeta(data.meta);
      if (data.chapters) setChapters(data.chapters);
      if (data.characters) setCharacters(data.characters);
      if (data.goals) setGoals(data.goals);
      
      logActivity('story_imported');
      return true;
    } catch (error) {
      console.error('Error importing story:', error);
      return false;
    }
  }, [logActivity]);

  // ==================== CONTEXT VALUE ====================
  
  const value = {
    // Story Meta
    storyMeta,
    updateStoryMeta,
    
    // Chapters
    chapters,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    currentChapterId,
    getCurrentChapter,
    setCurrentChapter,
    
    // Characters
    characters,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    extractCharactersFromText,
    
    // Goals & Stats
    goals,
    updateGoals,
    stats,
    updateStats,
    getTotalWordCount,
    
    // Activity
    activityLog,
    logActivity,
    
    // Export/Import
    exportStory,
    importStory,
  };

  return (
    <StoryContext.Provider value={value}>
      {children}
    </StoryContext.Provider>
  );
};
 
