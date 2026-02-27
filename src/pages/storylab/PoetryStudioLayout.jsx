src/pages/storylab/PoetryStudioLayout.jsx
import React from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";

// This is your existing studio component (library + editor)
import PoetryModule from "../../components/storylab/PoetryModule";

export default function PoetryStudioLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const onOpenWorkshop = (path) => {
    navigate(path);
  };

  const onCloseWorkshop = () => {
    navigate("/story-lab/poetry");
  };

  const isWorkshopOpen = location.pathname.startsWith("/story-lab/poetry/");

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Poetry</div>
          <div className="text-sm text-slate-600">
            Studio + Workshops side-by-side
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/story-lab/hub"
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Back to Hub
          </Link>

          {/* Optional: route to your existing AI page */}
          <Link
            to="/ai-tools"
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            AI Tools
          </Link>

          {/* Optional placeholder for Import */}
          <button
            type="button"
            onClick={() => alert("Import: next step")}
            className="px-3 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 text-slate-700"
          >
            Import
          </button>
        </div>
      </div>

      {/* 2-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Left: Poetry Studio always visible */}
        <div className="xl:col-span-8">
          <PoetryModule />
        </div>

        {/* Right: Workshops panel */}
        <div className="xl:col-span-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-slate-800">
                Workshops
              </div>

              {isWorkshopOpen ? (
                <button
                  type="button"
                  onClick={onCloseWorkshop}
                  className="text-xs px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  Close
                </button>
              ) : null}
            </div>

            {/* Workshop links */}
            <div className="grid gap-2">
              <button
                onClick={() => onOpenWorkshop("/story-lab/poetry/revision")}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">Revision Lab</div>
                <div className="text-xs text-slate-500">Tighten, sharpen, clarify.</div>
              </button>

              <button
                onClick={() => onOpenWorkshop("/story-lab/poetry/sequence")}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">Sequence Builder</div>
                <div className="text-xs text-slate-500">Arrange poems into a collection arc.</div>
              </button>

              <button
                onClick={() => onOpenWorkshop("/story-lab/poetry/craft")}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">Craft Lab</div>
                <div className="text-xs text-slate-500">Imagery, sound, line, form.</div>
              </button>

              <button
                onClick={() => onOpenWorkshop("/story-lab/poetry/remix")}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">Remix Lab</div>
                <div className="text-xs text-slate-500">Rework versions and forms.</div>
              </button>

              <button
                onClick={() => onOpenWorkshop("/story-lab/poetry/voice")}
                className="text-left rounded-xl border border-slate-200 p-3 hover:bg-slate-50"
              >
                <div className="text-sm font-semibold text-slate-800">Voice + Identity</div>
                <div className="text-xs text-slate-500">Tone, persona, consistency.</div>
              </button>
            </div>

            <div className="mt-4">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
