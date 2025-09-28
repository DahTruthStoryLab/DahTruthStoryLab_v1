import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
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

// --------- Utility Components ---------
const Card = ({ children, className = "", onClick }) => (
  <div 
    className={`rounded-2xl glass-panel ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const CardBody = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const StatLabel = ({ children }) => (
  <p className="text-xs uppercase tracking-wide text-muted">{children}</p>
);

const StatValue = ({ children }) => (
  <p className="text-3xl font-semibold text-ink mt-1">{children}</p>
);

const Progress = ({ value }) => (
  <div className="h-2 w-full rounded-full bg-primary/50">
    <div
      className="h-2 rounded-full bg-gradient-to-r from-accent to-primary transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

// --------- Logo Component ---------
const Logo = ({ size = "md", showText = true }) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8", 
    lg: "w-10 h-10",
    xl: "w-12 h-12"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl"
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-accent via-primary to-gold flex items-center justify-center shadow-lg relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_rgba(255,255,255,0.35)_0%,_transparent_50%)]"></div>
        <div className="relative z-10 flex items-center justify-center text-ink">
          <svg 
            viewBox="0 0 24 24" 
            className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-6 h-6'}`}
            fill="currentColor"
          >
            <path d="M3 5v14h5.5c3.5 0 6.5-2.5 6.5-6s-2-5-4.5-5.5V7c1.5 0 3 1 3 2.5S12 12 10.5 12H8V5H3z"/>
            <path d="M16 5v2h3v12h2V5z"/>
          </svg>
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold text-transparent bg-gradient-to-r from-accent via-primary to-gold bg-clip-text ${textSizeClasses[size]}`}>
            DahTruth
          </span>
          {(size === 'md' || size === 'lg' || size === 'xl') && (
            <span className="text-xs text-muted -mt-1">StoryLab</span>
          )}
        </div>
      )}
    </div>
  );
};

// --------- Top Banner Component ---------
const TopBanner = () => (
  <div className="bg-white/70 backdrop-blur-xl border-b border-white/60 text-ink sticky top-0 z-50">
    <div className="px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Logo size="md" showText={true} />
          <div className="hidden md:block text-sm text-muted">
            Transform your ideas into compelling stories
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-white/70 hover:text-ink transition-colors">
            <Search size={16} />
          </button>
          <button className="p-2 rounded-lg hover:bg-white/70 hover:text-ink transition-colors relative">
            <Bell size={16} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full"></div>
          </button>
          <div className="text-sm">
            <span className="text-muted">Welcome back!</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// --------- Sidebar Component ---------
const Sidebar = ({ isOpen, onClose, authorName, navigate, userNovels = [] }) => {
  const menuItems = [
    { icon: Home, label: "Dashboard", active: true, path: "/dashboard" },
    { icon: PencilLine, label: "Write", active: false, path: "/writer" },
    { icon: BookOpen, label: "Table of Contents", active: false, path: "/toc" },
    { icon: Calendar, label: "Calendar", active: false, path: "/calendar" },
    { icon: Layers, label: "Story Lab", active: false, path: "/story-lab" },
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
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar - Now positioned below banner */}
      <div className={`
        fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white/70 backdrop-blur-xl border-r border-white/60 z-40
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:h-[calc(100vh-4rem)]
        flex flex-col
      `}>
        {/* Sidebar Header with Logo */}
        <div className="p-6 border-b border-white/60 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo Component - Fixed visibility */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 via-blue-500 to-yellow-500 flex items-center justify-center shadow-lg border-2 border-white/20">
                <div className="text-white font-bold text-lg">
                  DT
                </div>
              </div>
              
              {/* Logo Text - Only show once */}
              <div className="flex flex-col">
                <span className="font-bold text-lg text-ink">
                  DahTruth
                </span>
                <span className="text-xs text-muted -mt-1">StoryLab</span>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="lg:hidden text-muted hover:text-ink transition-colors p-1 rounded-lg hover:bg-white/70"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-muted mt-2">Where your story comes to life</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left 
                transition-all duration-200
                ${item.active 
                  ? 'bg-primary text-ink border border-white/60 shadow'
                  : 'text-ink hover:bg-white/80'
                }
                group relative overflow-hidden
              `}
            >
              <item.icon size={18} className="relative z-10" />
              <span className="font-medium relative z-10">{item.label}</span>
              <div className="absolute right-2 w-2 h-2 bg-gold rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>
          ))}
        </nav>

        {/* Your Novels Section - Now using passed userNovels data */}
        <div className="p-4 border-t border-white/60 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide">
              Your Novels ({userNovels.length})
            </h3>
            <button 
              onClick={() => navigate('/writer')}
              className="text-ink hover:opacity-80 p-1 rounded-lg hover:bg-white/70 transition-all duration-200"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {userNovels.length === 0 ? (
              <div className="p-3 rounded-lg glass-soft border border-white/30 text-center">
                <p className="text-xs text-muted">No novels yet</p>
                <p className="text-xs text-muted mt-1">Click + to create your first story</p>
              </div>
            ) : (
              userNovels.map((novel, index) => (
                <div 
                  key={novel.id || index} 
                  className="p-3 rounded-lg glass-soft border border-white/30 transition-all duration-200 cursor-pointer"
                  onClick={() => navigate('/writer')}
                >
                  <h4 className="text-sm font-medium text-ink truncate">
                    {novel.title || "Untitled Story"}
                  </h4>
                  <p className="text-xs text-muted">
                    {novel.words || novel.wordCount || 0} words
                    {novel.lastModified && (
                      <span className="ml-2 opacity-75">
                        • {new Date(novel.lastModified).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Author Info - Fixed at bottom */}
        <div className="p-4 border-t border-white/60 flex-shrink-0">
          <div className="p-4 glass-soft rounded-xl border border-white/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent via-primary to-gold flex items-center justify-center shadow-md">
                <span className="text-ink font-bold text-xs">
                  {authorName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{authorName}</p>
                <p className="text-xs text-muted">Author</p>
              </div>
              <button 
                onClick={() => navigate('/profile')}
                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-white/70 transition-all duration-200"
              >
                <Settings size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/profile')}
                className="w-full text-left px-3 py-2 text-xs text-muted hover:text-ink hover:bg-white/70 rounded-lg transition-all duration-200"
              >
                Account Settings
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full text-left px-3 py-2 text-xs text-muted hover:text-ink hover:bg-white/70 rounded-lg transition-all duration-200"
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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [authorName, setAuthorName] = useState("New Author");
  const [userNovels, setUserNovels] = useState([]);
  
  // Get user data from localStorage and other sources
  useEffect(() => {
    // Get user profile data
    const userData = localStorage.getItem('currentUser');
    const profileData = localStorage.getItem('userProfile');
    
    if (profileData) {
      const profile = JSON.parse(profileData);
      if (profile.firstName && profile.lastName) {
        setAuthorName(`${profile.firstName} ${profile.lastName}`);
      } else if (profile.displayName) {
        setAuthorName(profile.displayName);
      }
    } else if (userData) {
      const user = JSON.parse(userData);
      setAuthorName(`${user.firstName} ${user.lastName}`);
    } else {
      // If no user data, they might need to sign in
      const mockUser = { firstName: "New", lastName: "Author" };
      setAuthorName(`${mockUser.firstName} ${mockUser.lastName}`);
    }
    
    // Get novel data from project page storage
    const projectData = localStorage.getItem('userProjects');
    const novelsData = localStorage.getItem('userNovels');
    
    if (projectData) {
      const projects = JSON.parse(projectData);
      setUserNovels(projects);
    } else if (novelsData) {
      const novels = JSON.parse(novelsData);
      setUserNovels(novels);
    } else {
      // Check for any story data
      const storyData = localStorage.getItem('currentStory');
      if (storyData) {
        const story = JSON.parse(storyData);
        setUserNovels([{
          id: story.id || 1,
          title: story.title || "Untitled Story",
          words: story.wordCount || 0,
          lastModified: story.lastModified || new Date().toISOString()
        }]);
      }
    }
  }, []);
  
  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const goal = 25000;
  const current = 0;
  const todayTarget = 834;
  const todayWritten = 0;
  const goalPercent = Math.min(100, Math.round((current / goal) * 100));
  const todayPercent = Math.min(100, Math.round((todayWritten / todayTarget) * 100));

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink">
      {/* Top Banner */}
      <TopBanner />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          authorName={authorName}
          userNovels={userNovels}
          navigate={navigate}
        />

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 min-h-[calc(100vh-4rem)] flex flex-col">
          {/* Header */}
          <div className="sticky top-16 z-30 bg-white/70 backdrop-blur-xl border-b border-white/60 shadow">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden text-muted hover:text-ink p-2 rounded-lg hover:bg-white/70 transition-all duration-200"
                  >
                    <Menu size={24} />
                  </button>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-ink">
                      {greeting}, Ready to Write?
                    </h1>
                    <div className="mt-1">
                      <p className="font-medium text-sm text-ink/80">Start your writing journey today</p>
                      <p className="text-xs text-muted">Create your first novel and begin tracking your progress</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/writer')}
                    className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:opacity-90 px-4 py-2 text-sm font-semibold shadow"
                  >
                    <Plus size={16} /> Create Novel
                  </button>
                  <button 
                    onClick={() => navigate('/writer')}
                    className="inline-flex items-center gap-2 rounded-2xl glass-soft border border-white/40 px-4 py-2 text-sm font-semibold"
                  >
                    <Play size={16} /> Quick Start
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 space-y-6 overflow-auto">
            {/* Welcome */}
            <Card>
              <CardBody>
                <div className="text-center py-8">
                  <Logo size="xl" showText={false} />
                  <h2 className="text-2xl font-bold text-ink mb-2 mt-4">Welcome to DahTruth StoryLab!</h2>
                  <p className="text-ink/80 mb-6 max-w-2xl mx-auto">
                    Ready to bring your stories to life? Start by creating your first novel and set your writing goals. 
                    Track your progress, stay motivated, and turn your ideas into compelling narratives.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => navigate('/writer')}
                      className="inline-flex items-center gap-2 rounded-2xl bg-accent hover:opacity-90 px-6 py-3 font-semibold shadow"
                    >
                      <Plus size={18} /> Create Your First Novel
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-2xl glass-soft border border-white/40 px-6 py-3 font-semibold">
                      <BookOpen size={18} /> Learn More
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Overall Progress</StatLabel>
                  <StatValue>{goalPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={goalPercent} />
                    <div className="flex justify-between text-xs text-muted">
                      <span>Current: {current.toLocaleString()}</span>
                      <span>Goal: {goal.toLocaleString()}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Writing Streak</StatLabel>
                  <div className="flex items-center gap-2 mt-1">
                    <StatValue>0</StatValue>
                    <span className="text-2xl">✍️</span>
                  </div>
                  <p className="text-muted text-sm mt-2">Start your streak today!</p>
                </CardBody>
              </Card>

              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody>
                  <StatLabel>Today's Goal</StatLabel>
                  <StatValue>{todayPercent}%</StatValue>
                  <div className="mt-4 space-y-2">
                    <Progress value={todayPercent} />
                    <div className="flex justify-between text-xs text-muted">
                      <span>Written: {todayWritten}</span>
                      <span>Target: {todayTarget}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card className="hover:scale-105 transition-transform duration-200">
                <CardBody className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-bold bg-gradient-to-r from-accent via-primary to-gold bg-clip-text text-transparent">
                      {new Date().getDate()}
                    </div>
                    <div className="text-muted text-sm uppercase tracking-wide">
                      {new Date().toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Quick Access to Writing Tools */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className="hover:scale-105 transition-all cursor-pointer hover:border-primary/50"
                onClick={() => navigate('/toc')}
              >
                <CardBody className="text-center">
                  <BookOpen size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Table of Contents</p>
                  <p className="text-xs text-muted mt-1">Organize chapters</p>
                </CardBody>
              </Card>
              
              <Card 
                className="hover:scale-105 transition-all cursor-pointer hover:border-primary/50"
                onClick={() => navigate('/writer')}
              >
                <CardBody className="text-center">
                  <PencilLine size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Writer</p>
                  <p className="text-xs text-muted mt-1">Start writing</p>
                </CardBody>
              </Card>
              
              <Card 
                className="hover:scale-105 transition-all cursor-pointer hover:border-primary/50"
                onClick={() => navigate('/project')}
              >
                <CardBody className="text-center">
                  <Layers size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Project</p>
                  <p className="text-xs text-muted mt-1">Manage project</p>
                </CardBody>
              </Card>
              
              <Card 
                className="hover:scale-105 transition-all cursor-pointer hover:border-primary/50"
                onClick={() => navigate('/calendar')}
              >
                <CardBody className="text-center">
                  <Calendar size={24} className="mx-auto mb-2 text-primary" />
                  <p className="font-semibold">Calendar</p>
                  <p className="text-xs text-muted mt-1">Track progress</p>
                </CardBody>
              </Card>
            </div>

            {/* Charts & Recent */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="xl:col-span-2">
                <CardBody>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-ink">Writing Activity</h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg bg-primary text-ink text-sm">7 days</button>
                      <button className="px-3 py-1 rounded-lg text-ink/70 hover:bg-white/70 text-sm transition-colors">30 days</button>
                      <button className="px-3 py-1 rounded-lg text-ink/70 hover:bg-white/70 text-sm transition-colors">All time</button>
                    </div>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={writingActivity}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} className="text-ink/70" />
                        <YAxis axisLine={false} tickLine={false} className="text-ink/70" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                            color: '#0F172A'
                          }}
                        />
                        <Bar 
                          dataKey="words" 
                          fill="url(#brandGradient)"
                          radius={[4, 4, 0, 0]} 
                        />
                        <defs>
                          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="hsl(var(--accent))" />
                            <stop offset="100%" stopColor="hsl(var(--base))" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="flex justify-between text-center mt-6 pt-4 border-t border-white/60">
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">This Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">Last Week</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">0</p>
                      <p className="text-xs text-muted uppercase">Average</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-ink">Recent Activity</h2>
                    <ChevronRight size={20} className="text-ink/60 hover:text-ink transition-colors cursor-pointer" />
                  </div>
                  
                  <div className="space-y-4">
                    {recentChapters.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 glass-soft rounded-full flex items-center justify-center mx-auto mb-3">
                          <BookOpen size={20} className="text-ink/70" />
                        </div>
                        <p className="text-sm text-muted mb-2">No activity yet</p>
                        <p className="text-xs text-ink/60">Start writing to see your progress here</p>
                      </div>
                    ) : (
                      recentChapters.map((chapter) => (
                        <div key={chapter.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/70 transition-all duration-200 cursor-pointer group">
                          <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-ink text-sm truncate group-hover:opacity-80 transition-colors">{chapter.title}</h3>
                            <p className="text-xs text-muted mt-1">{chapter.words} words • {chapter.time}</p>
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
