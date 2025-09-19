import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { 
  Play, Plus, Settings, PencilLine, BookOpen, Calendar, Layers, 
  UploadCloud, Store, User, Info, Home, ChevronRight, Menu, X 
} from "lucide-react";

// --------- Mock Data ---------
const writingActivity = [
  { day: "Mon", words: 180 },
  { day: "Tue", words: 225 },
  { day: "Wed", words: 310 },
  { day: "Thu", words: 240 },
  { day: "Fri", words: 210 },
  { day: "Sat", words: 0 },
  { day: "Sun", words: 0 },
];

const recentChapters = [
  { id: 1, title: "Chapter 1: The Beginning", words: 2340, time: "2 hours ago" },
  { id: 2, title: "Chapter 2: Rising Action", words: 1890, time: "Yesterday" },
  { id: 3, title: "Chapter 3: The Plot Thickens", words: 756, time: "2 days ago" },
];

const userNovels = [
  { id: 1, title: "Jacque is a rock star!", words: 0 },
  { id: 2, title: "Tabby", words: 0 },
];

// --------- Utility Components ---------
const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl bg-slate-900/70 border border-white/10 shadow-xl ${className}`}>
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
    <div className="h-2 rounded-full bg-indigo-400" style={{ width: `${value}%` }} />
  </div>
);

// --------- Sidebar Component ---------
const Sidebar = ({ isOpen, onClose, authorName }) => {
  const menuItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: PencilLine, label: "Write" },
    { icon: BookOpen, label: "Table of Contents" },
    { icon: Calendar, label: "Calendar" },
    { icon: Layers, label: "Story Lab" },
    { icon: UploadCloud, label: "Publishing" },
    { icon: Store, label: "Store" },
    { icon: User, label: "Profile" },
    { icon: Info, label: "About" },
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
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
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
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Where your story comes to life</p>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <button
              key={index}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200
                ${item.active 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                }
              `}
            >
              <item.icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Your Novels Section */}
        <div className="p-4 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              Your Novels ({userNovels.length})
            </h3>
            <button className="text-indigo-400 hover:text-indigo-300">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-2">
            {userNovels.map((novel) => (
              <div key={novel.id} className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                <h4 className="text-sm font-medium text-white truncate">{novel.title}</h4>
                <p className="text-xs text-slate-400">{novel.words} words</p>
              </div>
            ))}
          </div>
        </div>

        {/* Author Info */}
        <div className="absolute bottom-4 left-4 right-4 p-4 bg-slate-800/30 rounded-xl border border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Author:</p>
              <p className="text-xs text-slate-400 truncate">{authorName}</p>
              <p className="text-xs text-slate-500">Week 2 of 8</p>
            </div>
            <button className="text-slate-400 hover:text-white">
              <Settings size={16} />
            </button>
          </div>
          <button className="w-full mt-3 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white">
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
};

// --------- Main Dashboard Component ---------
export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [authorName, setAuthorName] = useState("Author Name");
  
  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const user = JSON.parse(userData);
      setAuthorName(`${user.firstName} ${user.lastName}`);
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
  const todayWritten = 425;
  const goalPercent = Math.min(100, Math.round((current / goal) * 100));
  const todayPercent = Math.min(100, Math.round((todayWritten / todayTarget) * 100));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        authorName={authorName}
      />

      {/* Main Content */}
      <div className="lg:ml-80 min-h-screen">
        
        {/* Dynamic Greeting Banner */}
        <div className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 bg-slate-900/40 border-b border-white/10">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden text-slate-400 hover:text-white"
                >
                  <Menu size={24} />
                </button>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">
                    {greeting}, Keep Writing…
                  </h1>
                  <div className="mt-2 text-slate-400">
                    <p className="font-medium">Working on: Jacque is a rock star!</p>
                    <p className="text-sm">You're 0% through your 8-week journey. Keep up the amazing work!</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500/90 hover:bg-indigo-400 px-4 py-2 text-sm font-semibold shadow transition-colors">
                  <Play size={16} /> Start Writing
                </button>
                <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-semibold shadow transition-colors">
                  <Plus size={16} /> New Novel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            
            {/* Overall Progress */}
            <Card>
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
            <Card>
              <CardBody>
                <StatLabel>Writing Streak</StatLabel>
                <div className="flex items-center gap-2 mt-1">
                  <StatValue>🔥</StatValue>
                </div>
                <p className="text-slate-400 text-sm mt-2">consecutive days</p>
              </CardBody>
            </Card>

            {/* Today's Goal */}
            <Card>
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
            <Card>
              <CardBody className="flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white">29</div>
                  <div className="text-slate-400 text-sm uppercase tracking-wide">
                    {new Date().toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}
                  </div>
                </div>
              </CardBody>
            </Card>
            
          </div>

          {/* Charts and Recent Chapters */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Writing Activity Chart */}
            <Card className="xl:col-span-2">
              <CardBody>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Writing Activity</h2>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-sm">7 days</button>
                    <button className="px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-800 text-sm">8 weeks</button>
                    <button className="px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-800 text-sm">All</button>
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
                          borderRadius: '12px'
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

            {/* Recent Chapters */}
            <Card>
              <CardBody>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Recent Chapters</h2>
                  <ChevronRight size={20} className="text-slate-400" />
                </div>
                
                <div className="space-y-4">
                  {recentChapters.map((chapter) => (
                    <div key={chapter.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors cursor-pointer">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white text-sm truncate">{chapter.title}</h3>
                        <p className="text-xs text-slate-400 mt-1">{chapter.words} words • {chapter.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
            
          </div>
        </div>
      </div>
    </div>
  );
}
