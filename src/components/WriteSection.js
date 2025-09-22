// src/pages/Writer.jsx
import React, { useState, useEffect } from "react";
import {
  Plus, Save, Eye, BookOpen, FileText, Edit3, Trash2, ChevronDown,
  Menu, X, Settings, Search, Bell, PencilLine, Home, Calendar, Layers,
  UploadCloud, Store, User, Info, Target, Clock, RotateCcw, Download,
  Sparkles, CheckCircle, AlertCircle, Lightbulb, Zap, Brain, MessageSquare,
  RefreshCw, Wand2
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Auth } from "aws-amplify";

// --------- Mock Story Data (would come from project selection) ---------
const currentStory = {
  id: 1,
  title: "Jacque is a rock star!",
  genre: "Contemporary Fiction",
  targetWords: 50000,
  currentWords: 3247,
  description: "A coming-of-age story about a young musician discovering their voice in the world of rock music.",
  characters: ["Jacque Thompson", "Marcus Rivera", "Sarah Chen"],
  setting: "Modern-day Los Angeles music scene",
  theme: "Finding your authentic voice",
  progress: 6.5,
  lastUpdated: "2 hours ago"
};

const initialChapters = [
  {
    id: 1,
    title: "Chapter 1: First Chord",
    content:
      "Jacque's fingers trembled as they touched the guitar strings for the first time on stage. The lights were blinding, the crowd expectant, and everything they'd worked for came down to this moment. Music had always been their escape, but tonight it would become their destiny.\n\nThe sound check earlier had gone well, but now, standing before hundreds of faces, doubt crept in like a familiar song in a minor key.",
    wordCount: 1205,
    lastEdited: "2 hours ago",
    status: "draft",
    aiSuggestions: [
      "Consider adding more sensory details about the stage environment",
      "Develop Jacque's internal conflict more deeply"
    ],
    grammarIssues: []
  },
  {
    id: 2,
    title: "Chapter 2: Backstage Revelations",
    content:
      "The dressing room smelled of stale coffee and nervous energy. Marcus paced back and forth, his bass guitar slung over his shoulder like a weapon he wasn't sure how to use. Sarah sat quietly in the corner, her drumsticks creating a rhythmic pattern against her knee.\n\n'We've got this,' Jacque whispered, more to convince themselves than the others.",
    wordCount: 892,
    lastEdited: "Yesterday",
    status: "draft",
    aiSuggestions: [
      "Show more character interaction and relationship dynamics",
      "Consider adding dialogue tags for clarity"
    ],
    grammarIssues: [{ type: "suggestion", text: "Consider a comma after 'themselves'" }]
  }
];

/* ---------------- Top Banner with real nav ---------------- */
const TopBanner = () => {
  const navLink =
    ({ isActive }) =>
      `px-3 py-2 rounded-md text-sm transition-colors ${
        isActive ? "bg-indigo-600 text-white" : "text-slate-200 hover:bg-white/10"
      }`;

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white sticky top-0 z-[9999]">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <PencilLine size={16} />
              </div>
              <span className="font-bold text-lg">DahTruth StoryLab</span>
            </div>
            <div className="hidden md:block text-sm opacity-90">
              Transform your ideas into compelling stories
            </div>
          </div>

          {/* NEW: real navigation links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/dashboard" className={navLink} end>Dashboard</NavLink>
            <NavLink to="/writer" className={navLink}>Writer</NavLink>
            <NavLink to="/" className={navLink}>Home</NavLink>
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button type="button" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <Search size={16} />
            </button>
            <button type="button" className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Sidebar with NavLink routes ---------------- */
const Sidebar = ({ isOpen, onClose, authorName }) => {
  const navigate = useNavigate();

  // inside Sidebar
const menuItems = [
  { icon: Home,      label: "Dashboard",             to: "/dashboard" },
  { icon: PencilLine,label: "Writer",                to: "/writer" },
  { icon: BookOpen,  label: "Table of Contents",     to: "/toc" },
  { icon: BookOpen,  label: "Table of Contents (v2)",to: "/toc2" },
  { icon: FileText,  label: "Project",               to: "/projects" },
  { icon: Calendar,  label: "Calendar",              to: "/calendar" },      // placeholder route already in App.js
  { icon: Layers,    label: "Story Lab",             to: "/story-lab" },     // placeholder
  { icon: UploadCloud,label:"Publishing",            to: "/publishing" },    // placeholder
  { icon: Store,     label: "Store",                 to: "/store" },         // placeholder
  { icon: User,      label: "Profile",               to: "/profile" },       // placeholder
  { icon: Info,      label: "About",                 to: "/about" },         // placeholder
];

  const itemClass = ({ isActive }) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg group relative overflow-hidden ${
      isActive
        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
        : "text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border hover:border-slate-600/30"
    }`;

  async function handleSignOut() {
    try { await Auth.signOut(); }
    finally { navigate("/signin"); }
  }

  return (
    <>
      {/* Mobile overlay (click to close). Hidden on lg+. */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 h[calc(100vh-4rem)] w-80 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-40
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-4rem)]
          flex flex-col
        `}
      >
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">DahTruth</h2>
                <p className="text-sm text-slate-400">StoryLab</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/50"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Where your story comes to life</p>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={itemClass}
              onClick={() => onClose?.()} // close drawer on mobile after click
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <item.icon size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium relative z-10">{item.label}</span>
              <div className="absolute right-2 w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{authorName}</p>
                <p className="text-xs text-slate-400">Author</p>
              </div>
              <button type="button" className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-all duration-200">
                <Settings size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button type="button" className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                Account Settings
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

/* ---------------- Story Details Panel ---------------- */
const StoryDetailsPanel = ({ story }) => {
  const progressPercent = (story.currentWords / story.targetWords) * 100;

  return (
    <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-white/10">
      <div className="flex items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-white">{story.title}</h2>
          <p className="text-slate-400 text-sm">{story.genre}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-slate-400">Words: </span>
            <span className="text-white font-medium">
              {story.currentWords.toLocaleString()} / {story.targetWords.toLocaleString()}
            </span>
          </div>
          <div className="w-32 h-2 bg-slate-700 rounded-full">
            <div
              className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-indigo-300 font-medium">{story.progress}%</span>
        </div>
      </div>

      <div className="text-sm text-slate-400">Last updated: {story.lastUpdated}</div>
    </div>
  );
};

/* ---------------- AI Assistant Panel ---------------- */
const AIAssistantPanel = ({ chapter, onApplySuggestion }) => {
  const [activeTab, setActiveTab] = useState("suggestions");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="bg-slate-900/50 border-b border-white/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="text-indigo-400" size={20} />
          AI Writing Assistant
        </h3>
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={isGenerating}
          className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
        >
          {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("suggestions")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "suggestions" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Story Ideas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("grammar")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "grammar" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Grammar Check
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("prompts")}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "prompts" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white"
            }`}
          >
            Writing Prompts
          </button>
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-3 min-w-max">
            {activeTab === "suggestions" && (
              <>
                {chapter?.aiSuggestions?.map((suggestion, index) => (
                  <div key={index} className="flex-shrink-0 w-80 p-3 bg-slate-800/30 rounded-lg border border-white/5">
                    <div className="flex items-start gap-2">
                      <Lightbulb size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{suggestion}</p>
                        <button
                          type="button"
                          onClick={() => onApplySuggestion(suggestion)}
                          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Apply suggestion
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex-shrink-0 w-80 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-300 font-medium">Great character development!</p>
                      <p className="text-xs text-green-400 mt-1">Your character's internal conflict is compelling.</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "grammar" && (
              <>
                {chapter?.grammarIssues?.length > 0 ? (
                  chapter.grammarIssues.map((issue, index) => (
                    <div key={index} className="flex-shrink-0 w-80 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="text-orange-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm text-orange-300">{issue.text}</p>
                          <button type="button" className="mt-2 text-xs text-orange-400 hover:text-orange-300 transition-colors">
                            Fix
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-shrink-0 w-80 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-400" />
                      <p className="text-sm text-green-300">No grammar issues found!</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "prompts" && (
              <>
                <div className="flex-shrink-0 w-80 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-start gap-2">
                    <MessageSquare size={14} className="text-purple-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-purple-300 font-medium">Character Development</p>
                      <p className="text-xs text-purple-400 mt-1">What secret is Jacque hiding about their musical past?</p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-80 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <Zap size={14} className="text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-300 font-medium">Plot Twist</p>
                      <p className="text-xs text-blue-400 mt-1">Consider a conflict between bandmates that tests their friendship.</p>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 w-80 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <div className="flex items-start gap-2">
                    <Brain size={14} className="text-indigo-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-indigo-300 font-medium">Scene Building</p>
                      <p className="text-xs text-indigo-400 mt-1">Describe the sensory experience of being on stage.</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Story Details Floating Menus ---------------- */
const StoryDetailsMenus = ({ story }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const toggleMenu = (menuName) => setOpenMenu(openMenu === menuName ? null : menuName);

  return (
    <div className="p-4 space-y-3">
      {/* Characters */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("characters")}
          className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-white/5 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <User size={16} className="text-indigo-400" />
            <span className="text-sm font-medium text-white">Characters</span>
            <span className="text-xs text-slate-400">({story.characters.length})</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${openMenu === "characters" ? "rotate-180" : ""}`}
          />
        </button>

        {openMenu === "characters" && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl z-10">
            <div className="space-y-2">
              {story.characters.map((character, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{character.charAt(0)}</span>
                  </div>
                  <span className="text-sm text-slate-300">{character}</span>
                </div>
              ))}
              <button
                type="button"
                className="w-full p-2 border border-dashed border-slate-600 rounded-lg hover:border-slate-500 transition-colors"
              >
                <span className="text-xs text-slate-400">+ Add Character</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Setting */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("setting")}
          className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-white/5 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-green-400" />
            <span className="text-sm font-medium text-white">Setting</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${openMenu === "setting" ? "rotate-180" : ""}`}
          />
        </button>

        {openMenu === "setting" && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl z-10">
            <div className="space-y-2">
              <div className="text-sm text-slate-300">{story.setting}</div>
              <textarea
                className="w-full h-20 bg-slate-800/30 border border-white/5 rounded-lg p-2 text-sm text-slate-300 resize-none"
                placeholder="Add more setting details..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("theme")}
          className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-white/5 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={16} className="text-yellow-400" />
            <span className="text-sm font-medium text-white">Theme</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${openMenu === "theme" ? "rotate-180" : ""}`}
          />
        </button>

        {openMenu === "theme" && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl z-10">
            <div className="space-y-2">
              <div className="text-sm text-slate-300">{story.theme}</div>
              <textarea
                className="w-full h-20 bg-slate-800/30 border border-white/5 rounded-lg p-2 text-sm text-slate-300 resize-none"
                placeholder="Explore your theme further..."
              />
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleMenu("description")}
          className="w-full flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg border border-white/5 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-blue-400" />
            <span className="text-sm font-medium text-white">Description</span>
          </div>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${openMenu === "description" ? "rotate-180" : ""}`}
          />
        </button>

        {openMenu === "description" && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-xl rounded-lg border border-white/10 shadow-xl z-10">
            <div className="space-y-2">
              <div className="text-sm text-slate-300">{story.description}</div>
              <textarea
                className="w-full h-24 bg-slate-800/30 border border-white/5 rounded-lg p-2 text-sm text-slate-300 resize-none"
                placeholder="Expand your story description..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ---------------- Chapter List ---------------- */
const ChapterList = ({ chapters, selectedChapter, onSelectChapter, onAddChapter, onDeleteChapter, story }) => {
  return (
    <div className="w-80 h-full border-r border-white/10 bg-slate-900/50 flex flex-col">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Chapters</h2>
          <button
            type="button"
            onClick={onAddChapter}
            className="p-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 transition-colors text-white"
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="text-sm text-slate-400">
          {chapters.length} chapters • {chapters.reduce((total, ch) => total + ch.wordCount, 0)} words total
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            onClick={() => onSelectChapter(chapter)}
            className={`p-4 rounded-xl mb-2 cursor-pointer transition-all duration-200 group ${
              selectedChapter?.id === chapter.id
                ? "bg-indigo-500/20 border border-indigo-500/30 text-indigo-300"
                : "hover:bg-slate-800/50 border border-transparent text-slate-300 hover:text-white"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{chapter.title}</h3>
                <p className="text-xs opacity-75 mt-1">
                  {chapter.wordCount} words • {chapter.lastEdited}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      chapter.status === "published"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {chapter.status}
                  </span>
                  {chapter.aiSuggestions?.length > 0 && (
                    <span className="w-2 h-2 bg-purple-400 rounded-full" title="AI suggestions available" />
                  )}
                  {chapter.grammarIssues?.length > 0 && (
                    <span className="w-2 h-2 bg-orange-400 rounded-full" title="Grammar issues found" />
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChapter(chapter.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all duration-200"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <StoryDetailsMenus story={story} />
      </div>
    </div>
  );
};

/* ---------------- Writing Editor ---------------- */
const WritingEditor = ({ chapter, onSave, onUpdateChapter, onCreateNewChapter }) => {
  const [title, setTitle] = useState(chapter?.title || "");
  const [content, setContent] = useState(chapter?.content || "");
  const [wordCount, setWordCount] = useState(0);
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (chapter) {
      setTitle(chapter.title);
      setContent(chapter.content);
    }
  }, [chapter]);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter((w) => w.length > 0).length;
    setWordCount(words);
  }, [content]);

  const handleSave = () => {
    if (chapter) {
      onUpdateChapter({
        ...chapter,
        title,
        content,
        wordCount,
        lastEdited: "Just now"
      });
    }
    onSave();
  };

  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Edit3 size={24} className="text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Start Writing</h3>
          <p className="text-slate-400 mb-6">Select a chapter or create a new one to begin writing your story.</p>
          <button
            type="button"
            onClick={onCreateNewChapter}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl font-medium transition-colors"
          >
            <Plus size={18} />
            Create New Chapter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold bg-transparent text-white border-none outline-none placeholder-slate-400"
              placeholder="Chapter Title"
            />
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Target size={14} />
              <span>{wordCount} words</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className={`p-2 rounded-lg transition-colors ${
                isPreview ? "bg-indigo-500/20 text-indigo-300" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Eye size={16} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg font-medium transition-colors"
            >
              <Save size={16} />
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {isPreview ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">{title}</h1>
            <div className="prose prose-invert prose-lg max-w-none">
              {content.split("\n").map((paragraph, index) => (
                <p key={index} className="text-slate-200 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-full bg-transparent text-white resize-none border-none outline-none text-lg leading-relaxed placeholder-slate-400"
            placeholder="Start writing your story here..."
          />
        )}
      </div>

      <div className="p-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock size={14} />
              <span>Last saved: {chapter.lastEdited}</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw size={14} />
              <span>Auto-save enabled</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="hover:text-white transition-colors">
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Write Component ---------------- */
export default function WriteSection() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authorName, setAuthorName] = useState("John Doe");
  const [chapters, setChapters] = useState(initialChapters);
  const [selectedChapter, setSelectedChapter] = useState(initialChapters[0]);

  useEffect(() => {
    const mockUser = { firstName: "John", lastName: "Doe" };
    setAuthorName(`${mockUser.firstName} ${mockUser.lastName}`);
  }, []);

  const handleAddChapter = () => {
    const newChapter = {
      id: Date.now(),
      title: `Chapter ${chapters.length + 1}: Untitled`,
      content: "",
      wordCount: 0,
      lastEdited: "Just now",
      status: "draft",
      aiSuggestions: [],
      grammarIssues: []
    };
    setChapters((prev) => [...prev, newChapter]);
    setSelectedChapter(newChapter);
  };

  const handleDeleteChapter = (chapterId) => {
    const updatedChapters = chapters.filter((ch) => ch.id !== chapterId);
    setChapters(updatedChapters);
    if (selectedChapter?.id === chapterId) {
      setSelectedChapter(updatedChapters[0] || null);
    }
  };

  const handleUpdateChapter = (updatedChapter) => {
    setChapters((prev) => prev.map((ch) => (ch.id === updatedChapter.id ? updatedChapter : ch)));
    setSelectedChapter(updatedChapter);
  };

  const handleSave = () => {
    console.log("Chapter saved!");
  };

  const handleApplySuggestion = (suggestion) => {
    console.log("Applying suggestion:", suggestion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <TopBanner />

      <div className="flex">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          authorName={authorName}
        />

        <div className="flex-1 lg:ml-0 h-[calc(100vh-4rem)] flex flex-col">
          {/* Write Header */}
          <div className="sticky top-16 z-30 backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/80 bg-slate-900/60 border-b border-white/10 shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <Menu size={24} />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-sm bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      Write Your Story
                    </h1>
                    <div className="mt-1 text-slate-400">
                      <p className="font-medium text-sm">Craft compelling chapters with AI-powered assistance</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleAddChapter}
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/90 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
                  >
                    <Plus size={16} /> New Chapter
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <FileText size={16} /> Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          <StoryDetailsPanel story={currentStory} />

          <AIAssistantPanel
            chapter={selectedChapter}
            onApplySuggestion={handleApplySuggestion}
          />

          <div className="flex-1 flex overflow-hidden">
            <ChapterList
              chapters={chapters}
              selectedChapter={selectedChapter}
              onSelectChapter={setSelectedChapter}
              onAddChapter={handleAddChapter}
              onDeleteChapter={handleDeleteChapter}
              story={currentStory}
            />

            <WritingEditor
              chapter={selectedChapter}
              onSave={handleSave}
              onUpdateChapter={handleUpdateChapter}
              onCreateNewChapter={handleAddChapter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
