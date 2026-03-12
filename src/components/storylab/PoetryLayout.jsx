// src/components/storylab/PoetryLayout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import PoetryModule from "./PoetryModule";

export default function PoetryLayout() {
  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside
        className="w-72 shrink-0 border-r border-slate-200 bg-white px-4 py-6 overflow-y-auto"
        style={{ minHeight: "100vh" }}
      >
        <div className="mb-5 px-1">
          <h2
            className="text-lg font-bold text-slate-900"
            style={{ fontFamily: "'EB Garamond', Georgia, serif" }}
          >
            Poetry Workshop
          </h2>
          <p className="text-xs text-slate-500 mt-1">Select a tool to begin</p>
        </div>
        <PoetryModule />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

