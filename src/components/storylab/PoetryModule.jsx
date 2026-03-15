// src/components/storylab/PoetryModule.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Wand2, Layers, PenTool, Shuffle, Mic2 } from "lucide-react";

const items = [
  { to: "/story-lab/poetry/craft", title: "Craft Lab", desc: "Line breaks, sound, metaphor, tension.", tag: "Craft", Icon: PenTool, color: "#a78bfa" },
  { to: "/story-lab/poetry/revision", title: "Revision Lab", desc: "Tighten diction, sharpen images.", tag: "Revise", Icon: Wand2, color: "#f9a8d4" },
  { to: "/story-lab/poetry/voice", title: "Voice & Identity", desc: "Tone, stance, persona, signature.", tag: "Voice", Icon: Mic2, color: "#67e8f9" },
  { to: "/story-lab/poetry/sequence", title: "Sequence Builder", desc: "Arrange poems into an arc.", tag: "Structure", Icon: Layers, color: "#d4af37" },
  { to: "/story-lab/poetry/remix", title: "Remix Lab", desc: "Erase, mirror, compress, expand.", tag: "Experiment", Icon: Shuffle, color: "#6ee7b7" },
];

export default function PoetryModule() {
  const { pathname } = useLocation();

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((it) => {
        const active = pathname === it.to;
        const Icon = it.Icon;
        return (
          <Link
            key={it.to}
            to={it.to}
            className="flex items-start gap-3 rounded-2xl px-3 py-3.5 transition-all duration-200 hover:bg-white/10"
            style={{
              background: active ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
            }}
          >
            <div
              className="mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: active ? `${it.color}25` : "rgba(255,255,255,0.07)",
                border: `1px solid ${active ? it.color + "40" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              <Icon size={15} style={{ color: active ? it.color : "rgba(255,255,255,0.5)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-sm font-semibold truncate" style={{ fontFamily: "'EB Garamond', Georgia, serif", color: active ? "#fff" : "rgba(255,255,255,0.75)" }}>
                  {it.title}
                </span>
                <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: active ? `${it.color}25` : "rgba(255,255,255,0.08)", color: active ? it.color : "rgba(255,255,255,0.4)" }}>
                  {it.tag}
                </span>
              </div>
              <p className="text-xs mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
                {it.desc}
              </p>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
