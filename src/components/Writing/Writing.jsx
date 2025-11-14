import React, { useState, useEffect } from 'react';
import { BookOpen, LayoutGrid, List, Plus } from 'lucide-react';
import ChapterGrid from './ChapterGrid';
import ChapterSidebar from './ChapterSidebar';

const Writing = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Load chapters from localStorage on mount
  useEffect(() => {
    const savedChapters = localStorage.getItem('dahtruth_chapters');
    if (savedChapters) {
      setChapters(JSON.parse(savedChapters));
    }
  }, []);

  // Save chapters to localStorage whenever they change
  useEffect(() => {
    if (chapters.length > 0) {
      localStorage.setItem('dahtruth_chapters', JSON.stringify(chapters));
    }
  }, [chapters]);

  const handleAddChapter = () => {
    const newChapter = {
      id: `chapter-${Date.now()}`,
      order: chapters.length + 1,
      title: `Chapter ${chapters.length + 1}`,
      summary: '',
      content: '',
      wordCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setChapters([...chapters, newChapter]);
    setSelectedChapterId(newChapter.id);
  };

  const handleReorderChapters = (reorderedChapters) => {
    // Update order numbers
    const updatedChapters = reorderedChapters.map((chapter, index) => ({
      ...chapter,
      order: index + 1,
      updatedAt: new Date().toISOString()
    }));
    setChapters(updatedChapters);
  };

  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
    // TODO: Navigate to chapter editor view
    console.log('Selected chapter:', chapterId);
  };

  const handleUpdateChapter = (chapterId, updates) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId 
        ? { ...ch, ...updates, updatedAt: new Date().toISOString() }
        : ch
    ));
  };

  // ✅ NEW: rename handler that keeps everything in sync
  const handleRenameChapter = (chapterId, newTitle) => {
    setChapters(prev =>
      prev.map(ch =>
        ch.id === chapterId
          ? { ...ch, title: newTitle, updatedAt: new Date().toISOString() }
          : ch
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#1a1f3a] to-[#0a0e27]">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-[#1a237e]/80 to-[#0d47a1]/80 border border-[#D4AF37]/30 backdrop-blur-sm">
                <BookOpen className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">My Writing</h1>
                <p className="text-sm text-white/60">Manage your chapters and manuscripts</p>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#D4AF37]/30 text-white transition-all duration-300"
              >
                <List className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-1 bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'grid'
                      ? 'bg-gradient-to-r from-[#1a237e]/80 to-[#0d47a1]/80 text-[#D4AF37]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all duration-300 ${
                    viewMode === 'list'
                      ? 'bg-gradient-to-r from-[#1a237e]/80 to-[#0d47a1]/80 text-[#D4AF37]'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleAddChapter}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#1a237e]/80 to-[#0d47a1]/80 hover:from-[#1a237e] hover:to-[#0d47a1] text-white flex items-center space-x-2 transition-all duration-300 border border-[#D4AF37]/30 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Chapter</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        {showSidebar && (
          <ChapterSidebar
            chapters={chapters}
            onReorder={handleReorderChapters}
            onAddChapter={handleAddChapter}
            selectedId={selectedChapterId}            {/* ⬅ changed name */}
            onSelectChapter={handleSelectChapter}
            onRenameChapter={handleRenameChapter}      {/* ⬅ NEW prop */}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'grid' ? (
            <ChapterGrid
              chapters={chapters}
              onAddChapter={handleAddChapter}
              onSelectChapter={handleSelectChapter}
              onUpdateChapter={handleUpdateChapter}
              onDeleteChapter={handleDeleteChapter}
            />
          ) : (
            <div className="p-6">
              {/* List View - Coming Soon */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-12 text-center">
                <List className="w-16 h-16 text-[#D4AF37] mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">List View</h3>
                <p className="text-white/60">Coming soon! Use grid view for now.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {chapters.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#1a237e]/20 to-[#0d47a1]/20 flex items-center justify-center mx-auto mb-6 border-2 border-[#D4AF37]/20">
              <BookOpen className="w-12 h-12 text-[#D4AF37]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start Your Story</h2>
            <p className="text-white/60 mb-6 max-w-md">
              Create your first chapter and bring your narrative to life
            </p>
            <button
              onClick={handleAddChapter}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#1a237e]/80 to-[#0d47a1]/80 hover:from-[#1a237e] hover:to-[#0d47a1] text-white flex items-center space-x-2 transition-all duration-300 border border-[#D4AF37]/30 backdrop-blur-sm mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Chapter</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Writing;
