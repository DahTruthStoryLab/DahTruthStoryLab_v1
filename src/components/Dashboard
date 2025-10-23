// src/components/Dashboard_Updated.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useStory } from '../contexts/StoryContext';

export default function DashboardUpdated() {
  const {
    storyMeta,
    chapters,
    characters,
    goals,
    stats,
    activityLog,
    getTotalWordCount,
  } = useStory();

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const totalWords = getTotalWordCount();
  const progressPercent = goals.totalWordCountGoal > 0
    ? Math.min(100, (totalWords / goals.totalWordCountGoal) * 100)
    : 0;

  const todayProgress = goals.dailyWordCount > 0
    ? Math.min(100, (stats.todayWords / goals.dailyWordCount) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--color-parchment)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-ink)] mb-2">
            {greeting}, {storyMeta.author || 'Writer'}!
          </h1>
          <p className="text-lg text-[var(--color-ink)]/70">
            Continue crafting your story: <span className="font-semibold">{storyMeta.title}</span>
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Words"
            value={totalWords.toLocaleString()}
            icon="📝"
            color="blue"
          />
          <StatCard
            title="Chapters"
            value={chapters.length}
            icon="📚"
            color="purple"
          />
          <StatCard
            title="Characters"
            value={characters.length}
            icon="👥"
            color="green"
          />
          <StatCard
            title="Current Streak"
            value={`${stats.currentStreak} days`}
            icon="🔥"
            color="orange"
          />
        </div>

        {/* Progress Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Goal */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                Today's Goal
              </h3>
              <span className="text-sm text-gray-600">
                {stats.todayWords} / {goals.dailyWordCount} words
              </span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${todayProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {todayProgress >= 100
                ? '🎉 Goal completed!'
                : `${(goals.dailyWordCount - stats.todayWords)} words to go`}
            </p>
          </div>

          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-ink)]">
                Overall Progress
              </h3>
              <span className="text-sm text-gray-600">
                {totalWords.toLocaleString()} / {goals.totalWordCountGoal.toLocaleString()} words
              </span>
            </div>
            <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {progressPercent >= 100
                ? '🎊 Story goal reached!'
                : `${Math.round(progressPercent)}% complete`}
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionButton
                  to="/writer"
                  icon="✍️"
                  title="Continue Writing"
                  description="Pick up where you left off"
                />
                <QuickActionButton
                  to="/toc"
                  icon="📑"
                  title="Table of Contents"
                  description="Organize your chapters"
                />
                <QuickActionButton
                  to="/calendar"
                  icon="📅"
                  title="Calendar"
                  description="Track deadlines & goals"
                />
                <QuickActionButton
                  to="/story-lab"
                  icon="🧪"
                  title="Story Lab"
                  description="Character & plot tools"
                />
                <QuickActionButton
                  to="/publishing"
                  icon="📤"
                  title="Publishing Suite"
                  description="Prepare for publication"
                />
                <QuickActionButton
                  to="/profile"
                  icon="👤"
                  title="Profile"
                  description="Manage your author profile"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-4">
                Recent Activity
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activityLog.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No recent activity. Start writing to see updates here!
                  </p>
                ) : (
                  activityLog.slice(0, 10).map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Story Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
                Story Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium capitalize">{storyMeta.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Genre:</span>
                  <span className="ml-2 font-medium">{storyMeta.genre || 'Not set'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Started:</span>
                  <span className="ml-2 font-medium">
                    {new Date(storyMeta.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {goals.deadline && (
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <span className="ml-2 font-medium">
                      {new Date(goals.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <Link
                to="/project"
                className="block mt-4 text-center py-2 bg-[var(--color-accent)] text-white rounded hover:opacity-90 transition"
              >
                Edit Project Details
              </Link>
            </div>

            {/* Writing Tip */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
                💡 Writing Tip
              </h3>
              <p className="text-sm text-gray-700">
                {getRandomTip()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function QuickActionButton({ to, icon, title, description }) {
  return (
    <Link
      to={to}
      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-semibold text-[var(--color-ink)] mb-1 group-hover:text-[var(--color-accent)] transition">
        {title}
      </h4>
      <p className="text-xs text-gray-600">{description}</p>
    </Link>
  );
}

function ActivityItem({ activity }) {
  const getActivityIcon = (action) => {
    const icons = {
      chapter_added: '➕',
      chapter_updated: '✏️',
      chapter_deleted: '🗑️',
      character_added: '👤',
      character_updated: '👥',
      ai_grammar_check: '✅',
      ai_style_check: '🎨',
      ai_readability_check: '📊',
      story_exported: '📤',
      story_imported: '📥',
    };
    return icons[action] || '📝';
  };

  const getActivityText = (activity) => {
    const { action, details } = activity;
    
    switch (action) {
      case 'chapter_added':
        return `Added chapter: ${details.title}`;
      case 'chapter_updated':
        return `Updated chapter${details.title ? `: ${details.title}` : ''}`;
      case 'chapter_deleted':
        return `Deleted chapter: ${details.title}`;
      case 'character_added':
        return `Added character: ${details.name}`;
      case 'character_updated':
        return `Updated character${details.name ? `: ${details.name}` : ''}`;
      case 'ai_grammar_check':
        return 'Ran grammar check';
      case 'ai_style_check':
        return 'Ran style check';
      case 'ai_readability_check':
        return 'Checked readability';
      case 'story_exported':
        return 'Exported story';
      case 'story_imported':
        return 'Imported story';
      default:
        return action.replace(/_/g, ' ');
    }
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-xl">{getActivityIcon(activity.action)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-ink)]">{getActivityText(activity)}</p>
        <p className="text-xs text-gray-500 mt-1">{timeAgo(activity.timestamp)}</p>
      </div>
    </div>
  );
}

function getRandomTip() {
  const tips = [
    "Write first, edit later. Let your creativity flow without judgment.",
    "Set a timer for 25 minutes and write without stopping. The Pomodoro technique works wonders!",
    "Read your dialogue out loud. If it sounds unnatural, rewrite it.",
    "Every scene should move the plot forward or develop character. If it doesn't, cut it.",
    "Show, don't tell. Instead of 'she was angry,' write 'she slammed the door.'",
    "Use AI to check your work, but don't let it replace your unique voice.",
    "Stuck? Write the scene you're excited about, even if it's out of order.",
    "Keep a notebook for random ideas. Your best lines often come when you least expect them.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
