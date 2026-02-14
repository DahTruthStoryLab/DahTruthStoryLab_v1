cat > src/components/storylab/NonFictionModule.jsx << 'EOF'
import React from "react";
import { Link } from "react-router-dom";
export default function NonFictionModule() {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Nonfiction</h1>
          <p className="text-sm text-slate-600 mt-1">
            Tools for essays, memoir, devotionals, history, and commentary.
          </p>
        </div>
        <Link
          to="/story-lab/hub"
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
        >
          Back to Hub
        </Link>
      </div>
      <div className="mt-6 grid gap-3">
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="font-semibold text-slate-800">Essay Builder</div>
          <div className="text-sm text-slate-600">Thesis, claims, evidence, counterargument, conclusion.</div>
          <div className="text-xs text-slate-500 mt-2">Coming next</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="font-semibold text-slate-800">Memoir Scene Map</div>
          <div className="text-sm text-slate-600">Scene goal, emotional turn, sensory detail, reflection.</div>
          <div className="text-xs text-slate-500 mt-2">Coming next</div>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="font-semibold text-slate-800">Research Notes</div>
          <div className="text-sm text-slate-600">Source, quote, paraphrase, your commentary.</div>
          <div className="text-xs text-slate-500 mt-2">Coming next</div>
        </div>
      </div>
    </div>
  );
}
EOF
