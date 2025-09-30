import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Route as RouteIcon } from "lucide-react";

const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5">
            <RouteIcon size={14} className="mr-2 text-ink/70" />
            <span className="text-xs font-semibold tracking-wide text-ink/80">
              DahTruth · StoryLab
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">Character Roadmap</h1>
          <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">
            A phased view of each character’s growth across workshop sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function CharacterRoadmap() {
  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Back */}
        <div className="mb-4">
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm hover:bg-white backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workshop
          </Link>
        </div>

        <PageBanner />

        {/* Placeholder timeline */}
        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6">
          <div className="text-sm text-ink/70 mb-4">
            (Stub UI) Add your session phases and character beats here.
          </div>
          <div className="space-y-6">
            {["Protagonist", "Antagonist"].map((name) => (
              <div key={name} className="bg-white rounded-xl border border-white/60 p-4">
                <div className="font-semibold mb-3">{name}</div>
                <div className="grid gap-3 md:grid-cols-4">
                  {["Session 1", "Session 2", "Session 3", "Session 4"].map((phase) => (
                    <div key={phase} className="rounded-lg border border-white/60 bg-white p-3">
                      <div className="text-xs text-ink/60 mb-1">{phase}</div>
                      <div className="text-sm text-ink/80">Beat or change note…</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
