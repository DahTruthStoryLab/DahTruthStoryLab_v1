// src/components/Calendar.js
import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  PenTool,
  Target,
  Flame,
  TrendingUp
} from 'lucide-react';

const STORAGE_KEY = "dahtruth-story-lab-toc-v3";
const getDailyGoal = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.daily?.goal || null;
  } catch {
    return null;
  }
};

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  const dailyGoal = getDailyGoal(); // used for mini per-day progress
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  // Sample writing data (replace with real data later)
  const writingData = useMemo(() => ({
    '2025-09-15': { wordCount: 1500, projectId: 1, hasDeadline: false },
    '2025-09-16': { wordCount: 2100, projectId: 1, hasDeadline: false },
    '2025-09-17': { wordCount: 800,  projectId: 2, hasDeadline: false },
    '2025-09-18': { wordCount: 1200, projectId: 1, hasDeadline: false },
    '2025-09-19': { wordCount: 0,    projectId: null, hasDeadline: true,  deadlineTitle: 'Chapter 5 Due' },
    '2025-09-20': { wordCount: 3000, projectId: 1, hasDeadline: false },
    '2025-09-21': { wordCount: 1750, projectId: 1, hasDeadline: false },
    '2025-09-22': { wordCount: 500,  projectId: 2, hasDeadline: false },
    '2025-09-25': { wordCount: 0,    projectId: null, hasDeadline: true,  deadlineTitle: 'Editor Review' },
    '2025-09-28': { wordCount: 0,    projectId: null, hasDeadline: true,  deadlineTitle: 'Final Draft' }
  }), []);

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  const isToday = (date) => (new Date()).toDateString() === date.toDateString();

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + direction);
      return d;
    });
  };

  const jumpToToday = () => {
    const d = new Date();
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setSelectedDate(d);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startDow = first.getDay();

    const days = [];

    // prev month fillers
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
    }
    // this month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // next month fillers
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const calculateStreak = () => {
    let streak = 0;
    const cursor = new Date();
    while (true) {
      const key = formatDateKey(cursor);
      if (writingData[key]?.wordCount > 0) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getMonthStats = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    let totalWords = 0, writingDays = 0, deadlines = 0, maxWords = 0;

    Object.entries(writingData).forEach(([key, data]) => {
      const d = new Date(key);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const wc = data.wordCount || 0;
        totalWords += wc;
        if (wc > 0) writingDays++;
        if (data.hasDeadline) deadlines++;
        maxWords = Math.max(maxWords, wc);
      }
    });

    return { totalWords, writingDays, deadlines, maxWords };
  };

  const stats = getMonthStats();
  const currentStreak = calculateStreak();
  const days = getDaysInMonth(currentMonth);

  // heat amount (0..1) for a given date key
  const heat = (key) => {
    const wc = writingData[key]?.wordCount || 0;
    if (!stats.maxWords) return 0;
    return Math.min(1, wc / stats.maxWords);
  };

  // Mini progress (0..1) vs daily goal
  const dayProgress = (wc) => {
    if (!dailyGoal || !wc) return 0;
    return Math.min(1, wc / dailyGoal);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-8">
      {/* ambient blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-indigo-500/40 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/30 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white font-serif mb-2">Writing Calendar</h1>
          <p className="text-blue-200">Track your writing journey</p>
        </div>

        {/* Stats Row (glassy) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-blue-200 text-xs font-serif">Current Streak</p>
                <p className="text-2xl font-bold text-white">{currentStreak} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-300" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-blue-200 text-xs font-serif">Words This Month</p>
                <p className="text-2xl font-bold text-white">{stats.totalWords.toLocaleString()}</p>
              </div>
              <PenTool className="h-8 w-8 text-blue-300" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-blue-200 text-xs font-serif">Writing Days</p>
                <p className="text-2xl font-bold text-white">{stats.writingDays}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-300" />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-50" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-blue-200 text-xs font-serif">Deadlines</p>
                <p className="text-2xl font-bold text-white">{stats.deadlines}</p>
              </div>
              <Target className="h-8 w-8 text-rose-300" />
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="relative bg-white/5 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 border border-white/10 overflow-hidden">
          {/* sheen */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[120%] h-48 bg-gradient-to-b from-white/10 to-transparent rounded-full blur-2xl" />

          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-100 hover:text-white transition-all duration-300 border border-white/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white font-serif">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </h2>
              <button
                onClick={jumpToToday}
                className="px-3 py-1.5 rounded-full text-xs bg-white/10 hover:bg-white/20 text-white/90 border border-white/20 transition-all"
              >
                Today
              </button>
            </div>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-blue-100 hover:text-white transition-all duration-300 border border-white/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-blue-200/80 font-semibold text-xs tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, index) => {
              const dateKey = formatDateKey(day.date);
              const dayData = writingData[dateKey];
              const hasWriting = (dayData?.wordCount || 0) > 0;
              const hasDeadline = !!dayData?.hasDeadline;
              const selected = selectedDate?.toDateString() === day.date.toDateString();
              const heatAmt = heat(dateKey);         // 0..1
              const prog = dayProgress(dayDat
