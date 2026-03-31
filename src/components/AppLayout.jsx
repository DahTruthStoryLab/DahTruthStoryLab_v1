// src/components/AppLayout.jsx
// Global layout wrapper — renders AppSidebar alongside all protected pages
// Usage: wrap any protected <Route> element with <AppLayout />

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import AppSidebar from "./AppSidebar";
import { storage } from "../lib/storage";

function loadUserNovels() {
  try {
    const userId = storage.getItem("dt_user_id") || "default";
    const projectData =
      storage.getItem(`userProjects_${userId}`) ||
      storage.getItem("userProjects") ||
      storage.getItem("dahtruth-projects-list");
    const novelsData =
      storage.getItem(`userNovels_${userId}`) ||
      storage.getItem("userNovels");

    if (projectData) return JSON.parse(projectData);
    if (novelsData) return JSON.parse(novelsData);

    const storyData = storage.getItem("currentStory");
    if (storyData) {
      const s = JSON.parse(storyData);
      return [
        {
          id: s.id || 1,
          title: s.title || "Untitled Story",
          words: s.wordCount || 0,
          lastModified: s.lastModified || new Date().toISOString(),
          status: s.status || "Draft",
        },
      ];
    }
  } catch { }
  return [];
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userNovels, setUserNovels] = useState([]);

  useEffect(() => {
    setUserNovels(loadUserNovels());

    const refresh = () => setUserNovels(loadUserNovels());
    window.addEventListener("storage", refresh);
    window.addEventListener("project:change", refresh);
    window.addEventListener("profile:updated", refresh);
    window.addEventListener("auth:change", refresh);
    window.addEventListener("storage:ready", refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("project:change", refresh);
      window.removeEventListener("profile:updated", refresh);
      window.removeEventListener("auth:change", refresh);
      window.removeEventListener("storage:ready", refresh);
    };
  }, []);

  return (
    <div className="min-h-screen flex">
      {/* Global sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userNovels={userNovels}
      />

      {/* Main content area — offset by sidebar width on large screens */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-64">
        {/* Mobile hamburger */}
        <div className="lg:hidden p-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/90 shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>

        {/* Page content rendered by React Router */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

