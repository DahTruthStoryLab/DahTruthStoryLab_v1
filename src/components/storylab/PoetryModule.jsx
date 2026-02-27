// src/components/storylab/PoetryModule.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";

const items = [
  {
    to: "/story-lab/poetry/revision",
    title: "Revision Lab",
    desc: "Tighten diction, sharpen images, and strengthen the turn.",
    tag: "Revise",
  },
  {
    to: "/story-lab/poetry/sequence",
    title: "Sequence Builder",
    desc: "Arrange poems into an arc: openings, hinges, closers.",
    tag: "Structure",
  },
  {
    to: "/story-lab/poetry/craft",
    title: "Craft Lab",
    desc: "Line breaks, sound, metaphor, syntax, tension, clarity.",
    tag: "Craft",
  },
  {
    to: "/story-lab/poetry/remix",
    title: "Remix Lab",
    desc: "Rewrite with constraints: erase, mirror, compress, expand.",
    tag: "Experiment",
  },
  {
    to: "/story-lab/poetry/voice",
    title: "Voice & Identity Lab",
    desc: "Tone, stance, persona, faith lens, and signature language.",
    tag: "Voice",
  },
];

export default function PoetryModule() {
  const location = useLocation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {items.map((it) => {
        const active = location.pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={[
              "rounded-2xl border p-4 transition",
              active
                ? "border-violet-300 bg-violet-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900 truncate">
                  {it.title}
                </div>
                <div className="text-sm text-slate-600 mt-1">{it.desc}</div>
              </div>
              <div className="text-[11px] font-semibold px-2 py-1 rounded-full border border-slate-200 text-slate-700 bg-white">
                {it.tag}
              </div>
            </div>

            <div className="mt-3 text-xs font-semibold text-violet-700">
              Open →
            </div>
          </Link>
        );
      })}
    </div>
  );
}
