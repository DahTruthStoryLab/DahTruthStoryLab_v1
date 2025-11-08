// src/components/UI/UIComponents.jsx
// Reusable UI components with brand styling

import React from "react";

/**
 * Gold Dashboard Button
 * Uses brand gold color #D4AF37
 */
export function GoldButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={[
        "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1",
        className,
      ].join(" ")}
      style={{ backgroundColor: "#D4AF37" }}
    >
      {children}
    </button>
  );
}

/**
 * Breadcrumb showing current view
 */
export function WritingCrumb({ view }) {
  return (
    <div className="text-[13px] text-slate-600">
      <span className="opacity-80">Writing</span>
      <span className="px-2 opacity-50">▸</span>
      <span className="font-medium">{view === "grid" ? "Chapters" : "Editor"}</span>
    </div>
  );
}

/**
 * Page Number Badge for editor
 */
export function PageNumberBadge({ pageIndex, pageCount }) {
  return (
    <div
      aria-label={`Page ${Math.min(pageIndex + 1, pageCount)} of ${pageCount}`}
      className="pointer-events-none select-none text-[12px] text-slate-600"
      style={{
        position: "absolute",
        bottom: 10,
        right: 16,
        background: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 8,
        padding: "4px 8px",
        boxShadow: "0 2px 8px rgba(2,20,40,0.10)",
        backdropFilter: "blur(2px)",
      }}
    >
      Page {Math.min(pageIndex + 1, pageCount)} / {pageCount}
    </div>
  );
}

/**
 * Save Status Indicator
 */
export function SaveStatus({ saving, lastSaved, hasUnsavedChanges }) {
  if (saving) {
    return (
      <div className="text-[12px] text-slate-500 flex items-center gap-1">
        <span className="animate-spin">⏳</span>
        <span>Saving...</span>
      </div>
    );
  }

  if (hasUnsavedChanges) {
    return (
      <div className="text-[12px] text-amber-600 flex items-center gap-1">
        <span>●</span>
        <span>Unsaved changes</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="text-[12px] text-emerald-600 flex items-center gap-1">
        <span>✓</span>
        <span>Saved {lastSaved}</span>
      </div>
    );
  }

  return null;
}
