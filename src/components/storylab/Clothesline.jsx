import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Pin, Users } from "lucide-react";

const PageBanner = () => {
  return (
    <div className="mx-auto mb-8">
      <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5">
            <Pin size={14} className="mr-2 text-ink/70" />
            <span className="text-xs font-semibold tracking-wide text-ink/80">
              DahTruth · StoryLab
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-ink mb-2">Clothesline</h1>
          <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">
            Characters as pegged cards along a line — relationships at a glance.
          </p>
        </div>
      </div>
    </div>
  );
};

function CharacterCard({ name, role, rel, traits = [] }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/80 p-3 shadow-sm min-w-[220px]">
      <div className="flex items-center gap-2">
        <div className="rounded-lg border bg-white/70 p-1.5">
          <Users className="h-4 w-4 text-ink/70" />
        </div>
        <div className="font-semibold text-ink">{name}</div>
        <span className="ml-auto text-[10px] rounded-full px-2 py-0.5 border bg-white">{role}</span>
      </div>
      <div className="text-xs text-ink/70 mt-1">{rel}</div>
      <div className="flex flex-wrap gap-1 mt-2">
        {traits.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 rounded-md border bg-white">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Clothesline() {
  // Simple demo data
  const width = 1000;
  const height = 160;
  const pathD = `M 20 ${height/2} C ${width/3} ${height/2 - 40}, ${(2*width)/3} ${height/2 + 40}, ${width-20} ${height/2}`;

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

        <div
          className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-4 overflow-x-auto"
          style={{ background: "linear-gradient(180deg, rgba(124,58,237,0.06), rgba(245,158,11,0.05))" }}
        >
          <div style={{ width }} className="relative">
            <svg width={width} height={height} className="block">
              <path d={pathD} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
              {[0.15, 0.38, 0.62, 0.85].map((t, i) => {
                const x = 20 + t * (width - 40);
                const y = height / 2 + Math.sin(t * Math.PI * 2) * 18;
                return <circle key={i} cx={x} cy={y} r={4} fill="#f59e0b" />;
              })}
            </svg>

            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-[8%] top-[10%] pointer-events-auto">
                <CharacterCard name="Amara" role="Protagonist" rel="Mentored by Tarek" traits={["Steadfast", "Quick"]} />
              </div>
              <div className="absolute left-[32%] top-[52%] pointer-events-auto">
                <CharacterCard name="Tarek" role="Mentor" rel="Mentor to Amara" traits={["Gruff", "Wounded"]} />
              </div>
              <div className="absolute left-[58%] top-[18%] pointer-events-auto">
                <CharacterCard name="Iyra" role="Antagonist" rel="Rival to Amara" traits={["Cunning", "Poised"]} />
              </div>
              <div className="absolute left-[80%] top-[58%] pointer-events-auto">
                <CharacterCard name="Zed" role="Ally" rel="Scout" traits={["Lightfoot", "Witty"]} />
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-ink/70 mt-3">
          (Stub UI) Replace demo characters with your state-driven data later.
        </div>
      </div>
    </div>
  );
}
