// src/components/storylab/PoetryModule.jsx
import React from "react";
import { useNavigate, Link } from "react-router-dom";

const modules = [
  {
    id: "revision",
    title: "Revision Lab",
    description: "Side-by-side drafts • 10/10/10 sprint • AI compression scoring",
    route: "/story-lab/poetry/revision",
    status: "active",
  },
  {
    id: "sequence",
    title: "Sequence Builder",
    description: "Drag & drop poems • Section mapping • Emotional arc",
    route: "/story-lab/poetry/sequence",
    status: "active",
  },
  {
    id: "craft",
    title: "Craft Lab",
    description: "Line breaks • Imagery • Metaphor • Form templates",
    route: "/story-lab/poetry/craft",
    status: "building",
  },
  {
    id: "remix",
    title: "Remix Lab",
    description: "Blackout editor • Cut-up tool • Constraint generator",
    route: "/story-lab/poetry/remix",
    status: "coming",
  },
  {
    id: "voice",
    title: "Voice & Identity Lab",
    description: "Persona writing • Cultural memory • Rewrite challenge",
    route: "/story-lab/poetry/voice",
    status: "coming",
  },
];

export default function PoetryModule() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-slate-800">
              Poetry Studio
            </h1>
            <p className="text-slate-600 mt-2">
              Craft, revise, and build your collection in a focused, quiet space.
            </p>
          </div>

          <Link
            to="/story-lab/hub"
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm hover:bg-slate-100"
          >
            Back to Hub
          </Link>
        </div>

        {/* Module Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {modules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => mod.status !== "coming" && navigate(mod.route)}
              className={`rounded-2xl border p-6 transition-all ${
                mod.status === "coming"
                  ? "bg-white border-slate-200 opacity-70 cursor-default"
                  : "bg-white border-slate-300 hover:shadow-lg cursor-pointer"
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {mod.title}
              </h3>

              <p className="text-slate-600 text-sm mb-4">
                {mod.description}
              </p>

              <div className="text-xs uppercase tracking-wide">
                {mod.status === "active" && (
                  <span className="text-emerald-600 font-semibold">
                    Available
                  </span>
                )}
                {mod.status === "building" && (
                  <span className="text-amber-600 font-semibold">
                    Building
                  </span>
                )}
                {mod.status === "coming" && (
                  <span className="text-slate-400 font-semibold">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Note */}
        <div className="mt-12 text-center text-slate-500 text-sm italic">
          Sharp craft. Deep roots. Your voice, refined.
        </div>
      </div>
    </div>
  );
}
