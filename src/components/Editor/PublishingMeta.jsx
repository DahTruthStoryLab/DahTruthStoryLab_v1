// src/components/Editor/PublishingMeta.jsx
// Publishing metadata - book title, author, publishing prep button

import React from "react";

export default function PublishingMeta({
  bookTitle,
  setBookTitle,
  author,
  setAuthor,
  onPublishingPrep,
  aiBusy,
  aiError,
}) {
  return (
    <div
      className="rounded-xl border bg-white/85 backdrop-blur-sm p-4"
      style={{
        boxShadow: "0 8px 30px rgba(2,20,40,0.10)",
      }}
    >
      <h3 className="font-semibold text-sm mb-3">Publishing Meta</h3>

      {/* Book Title */}
      <div className="mb-3">
        <label className="block text-xs text-slate-600 mb-1">Book Title</label>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          placeholder="Enter book title..."
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Author */}
      <div className="mb-3">
        <label className="block text-xs text-slate-600 mb-1">Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder="Enter author name..."
          className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Publishing Prep Button */}
      <button
        onClick={onPublishingPrep}
        disabled={aiBusy}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: "#D4AF37" }}
        title="Run AI Publishing Preparation"
      >
        🚀 Run Publishing Prep
      </button>

      {/* Error Display */}
      {aiError && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {aiError}
        </div>
      )}
    </div>
  );
}
