// src/components/storylab/PoetryModule.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Wand2,
  Layers,
  PenTool,
  Shuffle,
  Mic2,
  Leaf,
  ChevronRight,
} from "lucide-react";

const items = [
  {
    to: "/story-lab/poetry/revision",
    title: "Revision Lab",
    desc: "Tighten diction, sharpen images, strengthen the turn.",
    tag: "Revise",
    Icon: Wand2,
  },
  {
    to: "/story-lab/poetry/sequence",
    title: "Sequence Builder",
    desc: "Arrange poems into an arc: openings, hinges, closers.",
    tag: "Structure",
    Icon: Layers,
  },
  {
    to: "/story-lab/poetry/craft",
    title: "Craft Lab",
    desc: "Line breaks, sound, metaphor, syntax, tension, clarity.",
    tag: "Craft",
    Icon: PenTool,
  },
  {
    to: "/story-lab/poetry/remix",
    title: "Remix Lab",
    desc: "Rewrite with constraints: erase, mirror, compress, expand.",
    tag: "Experiment",
    Icon: Shuffle,
  },
  {
    to: "/story-lab/poetry/voice",
    title: "Voice & Identity",
    desc: "Tone, stance, persona, signature language.",
    tag: "Voice",
    Icon: Mic2,
  },
];

export default function PoetryModule() {
  const location = useLocation();
  return (
    <nav className="flex flex-col gap-2">
      {items.map((it) => {
        const active = location.pathname === it.to;
        const Icon = it.Icon || Leaf;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={[
              "group w-full rounded-2xl border px-3 py-3 transition",
              "flex items-start gap-3",
              active
                ? "border-[color:var(--brand-navy,#1e3a5f)] bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50",
            ].join(" ")}
          >
            <div
              className={[
                "mt-0.5 shrink-0 rounded-xl border p-2",
                active ? "border-slate-300 bg-white" : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <Icon className="h-4 w-4 text-slate-700" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {it.title}
                </div>
                <span className="shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full border border-slate-200 text-slate-700 bg-white">
                  {it.tag}
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                {it.desc}
              </div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[color:var(--brand-navy,#1e3a5f)]">
                Open <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
