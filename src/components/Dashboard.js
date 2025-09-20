import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom'; // ADD THIS IMPORT
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Play, Plus, Settings, PencilLine, BookOpen, Calendar, Layers, 
  UploadCloud, Store, User, Info, Home, ChevronRight, Menu, X, Bell, Search 
} from "lucide-react";

// --------- Empty/Default Data (to be populated by user) ---------
const writingActivity = [
  { day: "Mon", words: 0 },
  { day: "Tue", words: 0 },
  { day: "Wed", words: 0 },
  { day: "Thu", words: 0 },
  { day: "Fri", words: 0 },
  { day: "Sat", words: 0 },
  { day: "Sun", words: 0 },
];

const recentChapters = [];
const userNovels = [];

// --------- Utility Components ---------
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl backdrop-blur-sm ${className}`}>
    {children}
  </div>
);

const CardBody = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const StatLabel = ({ children }) => (
  <p className="text-xs uppercase tracking-wide text-slate-300">{children}</p>
);

const StatValue = ({ children }) => (
  <p className="text-3xl font-semibold text-white mt-1">{children}</p>
);

const Progress = ({ value }) => (
  <div className="h-2 w-full rounded-full bg-slate-700">
    <div className="h-2 rounded-full bg-indigo-400 transition-all duration-300" style={{ width: `${value}%` }} />
  </div>
);

// --------- Top Banner Component ---------
const TopBanner = () => (
  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white sticky top-0 z-50">
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
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Search size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
            <Bell size={16} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </button>
          <div className="text-sm">
            <span className="opacity-75">Welcome back!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --------- Sidebar Component ---------
const Sidebar = ({ isOpen, onClose, authorName, navigate }) => { // ADD NAVIGATE PROP
  const menuItems = [
    { icon: Home, label: "Dashboard", active: true, path: "/dashboard" },
    { icon: PencilLine, label: "Write", active: false, path: "/write" }, // ADD PATH
    { icon: BookOpen, label: "Table of Contents", active: false, path: "/contents" },
    { icon: Calendar, label: "Calendar", active: false, path: "/calendar" },
    { icon: Layers, label: "Story Lab", active: false, path: "/storylab" },
    { icon: UploadCloud, label: "Publishing", active: false, path: "/publishing" },
    { icon: Store, label: "Store", active: false, path: "/store" },
    { icon: User, label: "Profile", active: false, path: "/profile" },
    { icon: Info, label: "About", active: false, path: "/about" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Now positioned below banner */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-4rem)]
        flex flex-col
      `}>
        {/* Sidebar Header */}
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
              onClick={onClose}
              className="lg:hidden text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800/50"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Where your story comes to life</p>
        </div>

        {/* Menu Items - Main Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)} // ADD NAVIGATION
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left 
                transition-all duration-200 transform hover:scale-105 hover:shadow-lg
                ${item.active 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white hover:border hover:border-slate-600/30'
                }
                group relative overflow-hidden
              `}
            >
              {/* Floating effect background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
              <item.icon size={18} className="relative z-10 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium relative z-10">{item.label}</span>
              
              {/* Floating indicator */}
              <div className="absolute right-2 w-2 h-2 bg-indigo-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          ))}
        </nav>

        {/* Your Novels Section */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Your Novels ({userNovels.length})
            </h3>
            <button className="text-indigo-400 hover:text-indigo-300 p-1 rounded-lg hover:bg-indigo-500/20 transition-all duration-200">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {userNovels.length === 0 ? (
              <div className="p-3 rounded-lg bg-slate-800/20 border border-dashed border-slate-600 text-center">
                <p className="text-xs text-slate-400">No novels yet</p>
                <p className="text-xs text-slate-500 mt-1">Click + to create your first story</p>
              </div>
            ) : (
              userNovels.map((novel) => (
                <div key={novel.id} className="p-3 rounded-lg bg-slate-800/30 border border-white/5 hover:bg-slate-800/50 hover:border-white/10 transition-all duration-200 cursor-pointer group">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{novel.title}</h4>
                  <p className="text-xs text-slate-400">{novel.words} words</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Author Info - Fixed at bottom */}
        <div className="p-4 border-t border-white/10 flex-shrink-0">
          <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5 hover:bg-slate-800/50 transition-all duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{authorName}</p>
                <p className="text-xs text-slate-400">Author</p>
              </div>
              <button className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-all duration-200">
                <Settings size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200">
                Account Settings
              </button>
              <button 
                onClick={() => navigate('/')} // ADD SIGN OUT NAVIGATION
                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// --------- Main Dashboard Component ---------
export default function Dashboard() {
  const navigate = useNavigate(); // ADD THIS LINE
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [authorName, setAuthorName] = useState("New Author");
  
  // Get user data from localStorage (from registration)
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      setAuthorName(`${user.firstName} ${user.lastName}`);
    } else {
      // If no user data, they might need to sign in
      const mockUser = { firstName: "New", lastName: "Author" };
      setAuthorName(`${mockUser.firstName} ${mockUser.lastName}`);
    }
  }, []);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");  
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const goal = 25000;
  const current = 0;
  const todayTarget = 834;
  const todayWritten = 0;
  const goalPercent = Math.min(100, Math.round((current / goal) * 100));
  const todayPercent = Math.min(100, Math.round((todayWritten / todayTarget) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      
      {/* Top Banner - Fixed at very top */}
      <TopBanner />
      
      {/* Main Layout Container */}
      <div className="flex">
        {/* Sidebar - Positioned below banner */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          authorName={authorName}
          navigate={navigate} // PASS NAVIGATE TO SIDEBAR
        />

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0 min-h-[calc(100vh-4rem)] flex flex-col">
          
          {/* Main Header */}
          <div className="sticky top-16 z-30 backdrop-blur-md supports-[backdrop-filter]:bg-slate-900/80 bg-slate-900/60 border-b border-white/10 shadow-lg">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/50 transition-all duration-200"
                  >
                    <Menu size={24} />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold drop-shadow-sm bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                      {greeting}, Ready to Write?
                    </h1>
                    <div className="mt-1 text-slate-400">
                      <p className="font-medium text-sm">Start your writing journey today</p>
                      <p className="text-xs">Create your first novel and begin tracking your progress</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/write')} // ADD NAVIGATION TO WRITE
                    className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/90 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
                  >
                    <Plus size={16} /> Create Novel
                  </button>
                  <button 
                    onClick={() => navigate('/write')} // ADD NAVIGATION TO WRITE
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    <Play size={16} /> Quick Start
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            
            {/* Welcome Message for New Users */}
            <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-900/20 to-purple-900/20">
              <CardBody>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <PencilLine size={24} className="text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Welcome to DahTruth StoryLab!</h2>
                  <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                    Ready to bring your stories to life? Start by creating your first novel and set your writing goals. 
                    Track your progress, stay motivated, and turn your ideas into compelling narratives.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => navigate('/write')} // ADD NAVIGATION
                      className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 hover:bg-indigo-400 px-6 py-3 font-semibold shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 hover:scale-105"
                    >
                      <Plus size={18} /> Create Your First Novel
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-700 hover:bg-slate-600 px-6 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-105">
                      <BookOpen size={18} /> Learn More
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Overall Progress */}
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Overall Progress</StatLabel>
                  <StatValue>{goalPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={goalPercent} />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Current: {current.toLocaleString()}</span>
                      <span>Goal: {goal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Writing Streak */}
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Writing Streak</StatLabel>
                  <div className="flex items-center gap-2 mt-1">
                    <StatValue>0</StatValue>
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">Start your streak today!</p>
                </CardBody>
              </Card>

              {/* Today's Goal */}
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Today's Goal</StatLabel>
                  <StatValue>{todayPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={todayPercent} />
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Written: {todayWritten}</span>
                      <span>Target: {todayTarget}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Calendar Widget */}
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white">{new Date().getDate()}</div>
                    <div className="text-slate-400 text-sm uppercase tracking-wide">
                      {new Date().toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}
                    </div>
                  </div>
                </CardBody>
              </Card>
              
            </div>

            {/* Charts and Recent Activity */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Writing Activity Chart */}
              <Card className="xl:col-span-2">
                <CardBody>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Writing Activity</h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm hover:bg-indigo-500/30 transition-colors">7 days</button>
                      <button className="px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">30 days</button>
                      <button className="px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm transition-colors">All time</button>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={writingActivity}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-slate-400" />
                        <YAxis axisLine={false} tickLine={false} className="text-slate-400" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1e293b', 
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                          }}
                        />
                        <Bar dataKey="words" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-between text-center mt-6 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-xs text-slate-400 uppercase">This Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-xs text-slate-400 uppercase">Last Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">0</p>
                      <p className="text-xs text-slate-400 uppercase">Average</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Recent Activity</h2>
                    <ChevronRight size={20} className="text-slate-400 hover:text-white transition-colors cursor-pointer" />
                  </div>
                  
                  <div className="space-y-4">
                    {recentChapters.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen size={20} className="text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-400 mb-2">No activity yet</p>
                        <p className="text-xs text-slate-500">Start writing to see your progress here</p>
                      </div>
                    ) : (
                      recentChapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-all duration-200 cursor-pointer group hover:scale-105 hover:shadow-lg">
                          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0 group-hover:bg-indigo-300 transition-colors" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white text-sm truncate group-hover:text-indigo-300 transition-colors">{chapter.title}</h3>
                            <p className="text-xs text-slate-400 mt-1">{chapter.words} words • {chapter.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
