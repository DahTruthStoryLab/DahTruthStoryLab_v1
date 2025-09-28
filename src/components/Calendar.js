

// src/components/Calendar.js
import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  PenTool,
  Target,
  Flame,
  TrendingUp,
  ArrowLeft,
} from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  // sample data
  const writingData = useMemo(
    () => ({
      "2025-09-15": { wordCount: 1500, projectId: 1, hasDeadline: false },
      "2025-09-16": { wordCount: 2100, projectId: 1, hasDeadline: false },
      "2025-09-17": { wordCount: 800, projectId: 2, hasDeadline: false },
      "2025-09-18": { wordCount: 1200, projectId: 1, hasDeadline: false },
      "2025-09-19": {
        wordCount: 0,
        projectId: null,
        hasDeadline: true,
        deadlineTitle: "Chapter 5 Due",
      },
      "2025-09-20": { wordCount: 3000, projectId: 1, hasDeadline: false },
      "2025-09-21": { wordCount: 1750, projectId: 1, hasDeadline: false },
      "2025-09-22": { wordCount: 500, projectId: 2, hasDeadline: false },
      "2025-09-25": {
        wordCount: 0,
        projectId: null,
        hasDeadline: true,
        deadlineTitle: "Editor Review",
      },
      "2025-09-28": {
        wordCount: 0,
        projectId: null,
        hasDeadline: true,
        deadlineTitle: "Final Draft",
      },
    }),
    []
  );

  const formatDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;

  const isToday = (date) => date.toDateString() === new Date().toDateString();

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();
    const startDow = first.getDay();

    const days = [];
    // prev
    const prevMonthLast = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
    }
    // current
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // next
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  const navigateMonth = (dir) => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(prev.getMonth() + dir);
      return d;
    });
  };

  const calculateStreak = () => {
    let streak = 0;
    const cur = new Date();
    const check = new Date(cur);
    while (true) {
      const k = formatDateKey(check);
      if ((writingData[k]?.wordCount || 0) > 0) {
        streak++;
        check.setDate(check.getDate() - 1);
      } else break;
    }
    return streak;
  };

  const getMonthStats = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    let totalWords = 0;
    let writingDays = 0;
    let deadlines = 0;

    Object.entries(writingData).forEach(([k, v]) => {
      const d = new Date(k);
      if (d.getFullYear() === y && d.getMonth() === m) {
        const wc = v.wordCount || 0;
        totalWords += wc;
        if (wc > 0) writingDays++;
        if (v.hasDeadline) deadlines++;
      }
    });

    return { totalWords, writingDays, deadlines };
  };

  const stats = getMonthStats();
  const currentStreak = calculateStreak();
  const days = getDaysInMonth(currentMonth);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-indigo-950 to-blue-900 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back to Dashboard */}
        <div className="mb-6">
          <NavLink
            to="/dashboard"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 backdrop-blur"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </NavLink>
        </div>

        {/* header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white font-serif mb-2">Writing Calendar</h1>
          <p className="text-slate-300">Track your writing journey</p>
        </div>

        {/* stats — lighter glass */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/70 text-slate-900 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Current Streak</p>
                <p className="text-2xl font-bold">{currentStreak} days</p>
              </div>
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white/70 text-slate-900 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Words This Month</p>
                <p className="text-2xl font-bold">{stats.totalWords.toLocaleString()}</p>
              </div>
              <PenTool className="h-8 w-8 text-sky-600" />
            </div>
          </div>
          <div className="bg-white/70 text-slate-900 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Writing Days</p>
                <p className="text-2xl font-bold">{stats.writingDays}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white/70 text-slate-900 backdrop-blur-xl rounded-2xl p-4 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-700">Deadlines</p>
                <p className="text-2xl font-bold">{stats.deadlines}</p>
              </div>
              <Target className="h-8 w-8 text-rose-600" />
            </div>
          </div>
        </div>

        {/* calendar card — light sky-ish */}
        <div className="bg-white/80 text-slate-900 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200">
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold font-serif">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* weekdays */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-slate-600 font-semibold text-xs tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* days */}
          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth(currentMonth).map((day, idx) => {
              const key = formatDateKey(day.date);
              const data = writingData[key];
              const hasWriting = (data?.wordCount || 0) > 0;
              const hasDeadline = !!data?.hasDeadline;
              const selected = selectedDate?.toDateString() === day.date.toDateString();

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredDate(key)}
                  onMouseLeave={() => setHoveredDate(null)}
                  onClick={() => setSelectedDate(day.date)}
                  className={[
                    "relative h-20 p-2 rounded-2xl transition-all duration-200 cursor-pointer",
                    day.isCurrentMonth ? "bg-sky-50" : "bg-slate-100/60",
                    "border border-slate-200",
                    "hover:shadow-md hover:bg-sky-100",
                    isToday(day.date) ? "ring-2 ring-sky-400" : "",
                    selected ? "outline outline-2 outline-teal-500/70" : "",
                  ].join(" ")}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div className="flex items-start justify-between">
                      <span
                        className={`text-sm font-medium ${
                          day.isCurrentMonth ? "text-slate-800" : "text-slate-500"
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      {hasDeadline && (
                        <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-rose-100 text-rose-700 border border-rose-200">
                          Due
                        </span>
                      )}
                    </div>

                    {hasWriting && (
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        {data.wordCount.toLocaleString()} w
                      </div>
                    )}

                    {day.isCurrentMonth && (
                      <div className="flex gap-1 justify-end">
                        {hasWriting && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                        {hasDeadline && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                      </div>
                    )}
                  </div>

                  {/* tooltip */}
                  {hoveredDate === key && (hasWriting || hasDeadline) && (
                    <div className="absolute z-20 bottom-full mb-2 left-1/2 -translate-x-1/2 w-56">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xl">
                        <div className="text-slate-900 text-sm font-semibold">
                          {day.date.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                        {hasWriting && (
                          <div className="text-slate-700 text-xs mt-1">
                            <span className="font-semibold">{data.wordCount.toLocaleString()}</span> words written
                          </div>
                        )}
                        {hasDeadline && (
                          <div className="text-rose-700 text-xs mt-1">📅 {data.deadlineTitle}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* legend */}
          <div className="mt-6 flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700">Writing Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-slate-700">Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="ring-2 ring-sky-400 w-4 h-4 rounded" />
              <span className="text-slate-700">Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
