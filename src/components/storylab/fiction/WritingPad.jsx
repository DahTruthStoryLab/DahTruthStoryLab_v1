// src/components/storylab/fiction/WritingPad.jsx
// A shared expandable writing pad used by Character Forge, World Builder,
// and Story Architecture. Click the expand icon on any textarea to open
// a full writing modal. Click Done or press Escape to collapse back.

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, Check } from "lucide-react";

const BRAND = {
  navy: "#1e3a5f",
  gold: "#d4af37",
  goldDark: "#b8960c",
};

// ─── Writing Pad Modal ─────────────────────────────────────────────────────────

function WritingPadModal({ label, value, onChange, onClose, placeholder }) {
  const [draft, setDraft] = useState(value || "");
  const textareaRef = useRef(null);

  // Focus and place cursor at end on open
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  // Escape key closes and saves
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") {
        handleDone();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function handleDone() {
    onChange(draft);
    onClose();
  }

  const wordCount = draft.trim()
    ? draft.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-6"
      style={{ background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-3xl flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ height: "80vh", background: "white" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0 border-b border-slate-100"
          style={{ background: `linear-gradient(135deg, ${BRAND.navy}06, ${BRAND.gold}06)` }}
        >
          <div>
            <div
              className="text-xs font-bold uppercase tracking-widest mb-0.5"
              style={{ color: BRAND.gold }}
            >
              Writing Pad
            </div>
            <div className="font-semibold text-sm" style={{ color: BRAND.navy }}>
              {label}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              {wordCount} word{wordCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Esc to close
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              title="Close without saving"
            >
              <X size={16} className="text-slate-400" />
            </button>
            <button
              onClick={handleDone}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${BRAND.gold}, ${BRAND.goldDark})` }}
              title="Save and close"
            >
              <Check size={15} />
              Done
            </button>
          </div>
        </div>

        {/* Writing Area */}
        <div className="flex-1 flex flex-col min-h-0 p-6">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder || `Write your ${label.toLowerCase()} here...`}
            className="flex-1 w-full resize-none border-0 outline-none text-base text-slate-800 leading-relaxed"
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: "16px",
              lineHeight: "1.8",
              background: "transparent",
            }}
          />
        </div>

        {/* Footer hint */}
        <div
          className="px-6 py-3 flex-shrink-0 border-t border-slate-100 flex items-center justify-between"
          style={{ background: `${BRAND.navy}02` }}
        >
          <p className="text-xs text-slate-400 italic">
            Write freely. Click Done when you are ready to save back to the form.
          </p>
          <p className="text-xs text-slate-300">
            X closes without saving · Done saves
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── ExpandableTextArea ────────────────────────────────────────────────────────
// Drop-in replacement for the TextArea component in all three modules.
// Usage:
//   <ExpandableTextArea
//     label="Core Wound"
//     value={form.coreWound}
//     onChange={(v) => handleChange("coreWound", v)}
//     placeholder="The pain at the center of who they are."
//   />

export function ExpandableTextArea({ label, value, onChange, placeholder = "", rows = 3 }) {
  const [padOpen, setPadOpen] = useState(false);

  return (
    <div className="block">
      <div className="mb-1 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <button
          type="button"
          onClick={() => setPadOpen(true)}
          className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors hover:bg-amber-50"
          style={{
            borderColor: `rgba(212,175,55,0.3)`,
            color: BRAND.goldDark,
          }}
          title="Open writing pad"
        >
          <Maximize2 size={10} />
          Expand
        </button>
      </div>

      <div className="relative">
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white resize-none"
        />
      </div>

      {padOpen && (
        <WritingPadModal
          label={label}
          value={value}
          onChange={onChange}
          onClose={() => setPadOpen(false)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export default ExpandableTextArea;
