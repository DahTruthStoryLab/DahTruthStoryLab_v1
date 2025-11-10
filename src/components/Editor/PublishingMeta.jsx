// src/components/Editor/PublishingMeta.jsx
// Publishing metadata and page setup controls

import React, { useState } from "react";
import { FileText, Settings } from "lucide-react";

// Common margin presets (in pixels at 96 DPI, 1 inch = 96px)
const MARGIN_PRESETS = {
  normal: { top: 96, bottom: 96, left: 96, right: 96, name: "Normal (1\")" },
  narrow: { top: 48, bottom: 48, left: 48, right: 48, name: "Narrow (0.5\")" },
  wide: { top: 96, bottom: 96, left: 144, right: 144, name: "Wide (1.5\" sides)" },
  moderate: { top: 96, bottom: 96, left: 72, right: 72, name: "Moderate (0.75\" sides)" },
};

export default function PublishingMeta({
  bookTitle,
  setBookTitle,
  author,
  setAuthor,
  margins = MARGIN_PRESETS.normal,
  onMarginsChange,
  onPublishingPrep,
  aiBusy,
  aiError,
}) {
  const [showMarginControls, setShowMarginControls] = useState(false);

  const handlePresetChange = (presetKey) => {
    const preset = MARGIN_PRESETS[presetKey];
    if (preset && onMarginsChange) {
      onMarginsChange({
        top: preset.top,
        bottom: preset.bottom,
        left: preset.left,
        right: preset.right,
      });
    }
  };

  const handleCustomMarginChange = (side, value) => {
    if (onMarginsChange) {
      onMarginsChange({
        ...margins,
        [side]: parseInt(value) || 0,
      });
    }
  };

  // Convert pixels to inches for display
  const pxToInches = (px) => (px / 96).toFixed(2);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={18} className="text-slate-600" />
        <h3 className="font-semibold">Publishing Info</h3>
      </div>

      {/* Book Title */}
      <div className="mb-3">
        <label className="block text-[12px] text-slate-600 mb-1">Book Title</label>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter book title"
        />
      </div>

      {/* Author */}
      <div className="mb-3">
        <label className="block text-[12px] text-slate-600 mb-1">Author</label>
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter author name"
        />
      </div>

      {/* Page Setup Section */}
      <div className="border-t pt-3 mt-3">
        <button
          onClick={() => setShowMarginControls(!showMarginControls)}
          className="flex items-center gap-2 w-full text-left text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          <Settings size={16} />
          <span>Page Margins</span>
          <span className="ml-auto text-xs text-slate-500">
            {showMarginControls ? "▼" : "▶"}
          </span>
        </button>

        {showMarginControls && (
          <div className="mt-3 space-y-3">
            {/* Preset Buttons */}
            <div className="space-y-1">
              <label className="block text-[11px] text-slate-600 mb-1">Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MARGIN_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetChange(key)}
                    className={`px-2 py-1.5 text-[11px] rounded border ${
                      margins.top === preset.top &&
                      margins.bottom === preset.bottom &&
                      margins.left === preset.left &&
                      margins.right === preset.right
                        ? "bg-blue-50 border-blue-300 text-blue-700"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Margin Inputs */}
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-600">Custom Margins</label>
              
              <div className="grid grid-cols-2 gap-2">
                {/* Top */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Top</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={margins.top}
                      onChange={(e) => handleCustomMarginChange("top", e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="288"
                      step="12"
                    />
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {pxToInches(margins.top)}"
                    </span>
                  </div>
                </div>

                {/* Bottom */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Bottom</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={margins.bottom}
                      onChange={(e) => handleCustomMarginChange("bottom", e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="288"
                      step="12"
                    />
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {pxToInches(margins.bottom)}"
                    </span>
                  </div>
                </div>

                {/* Left */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Left</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={margins.left}
                      onChange={(e) => handleCustomMarginChange("left", e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="288"
                      step="12"
                    />
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {pxToInches(margins.left)}"
                    </span>
                  </div>
                </div>

                {/* Right */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Right</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={margins.right}
                      onChange={(e) => handleCustomMarginChange("right", e.target.value)}
                      className="w-full px-2 py-1 text-[11px] border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min="0"
                      max="288"
                      step="12"
                    />
                    <span className="text-[10px] text-slate-500 whitespace-nowrap">
                      {pxToInches(margins.right)}"
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                Values in pixels (96px = 1 inch)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Publishing Prep Button */}
      <button
        onClick={onPublishingPrep}
        disabled={aiBusy}
        className="mt-4 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50"
        title="Prepare for publishing"
      >
        📋 Prepare for Publishing
      </button>

      {/* Error Display */}
      {aiError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700">
          {aiError}
        </div>
      )}
    </div>
  );
}

