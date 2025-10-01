// src/components/storylab/CharacterRoadmap.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Map as RouteIcon, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields, uid } from "../../lib/storylab/projectStore";

const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5">
          <RouteIcon size={14} className="mr-2 text-ink/70" />
          <span className="text-xs font-semibold tracking-wide text-ink/80">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Character Roadmap</h1>
        <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">A phased view of your progression. (Stub — extend per character later.)</p>
      </div>
    </div>
  </div>
);

export default function CharacterRoadmap() {
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));
  const items = project.roadmap;

  const commit = (mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
  };

  const add = () => commit(p => { p.roadmap.push({ id: uid(), title: "New Milestone", done: false }); });
  const remove = (id) => commit(p => { p.roadmap = p.roadmap.filter(r => r.id !== id); });
  const update = (id, patch) => commit(p => { const r = p.roadmap.find(x => x.id === id); if (r) Object.assign(r, patch); });
  const move = (id, dir) => commit(p => {
    const i = p.roadmap.findIndex(x => x.id === id);
    const j = i + (dir === "up" ? -1 : 1);
    if (i < 0 || j < 0 || j >= p.roadmap.length) return;
    const [it] = p.roadmap.splice(i, 1);
    p.roadmap.splice(j, 0, it);
  });

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4">
          <Link to="/story-lab/workshop" className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm hover:bg-white backdrop-blur">
            <ArrowLeft className="h-4 w-4" /> Back to Workshop
          </Link>
        </div>

        <PageBanner />

        <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-ink/70">You are here ➜ There (order matters)</div>
            <button onClick={add} className="rounded-lg px-3 py-2 border bg-white hover:bg-white/90 text-sm"><Plus className="h-4 w-4 inline mr-1" /> Add Milestone</button>
          </div>

          {items.map((r, idx) => (
            <div key={r.id} className="grid gap-2 md:grid-cols-[auto_1fr_auto_auto] items-center border border-white/60 bg-white rounded-xl px-3 py-2">
              <div className="flex gap-1">
                <button className="border rounded-md px-2 py-1" onClick={() => move(r.id, "up")} title="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button className="border rounded-md px-2 py-1" onClick={() => move(r.id, "down")} title="Move down"><ArrowDown className="h-4 w-4" /></button>
              </div>
              <input
                value={r.title}
                onChange={(e) => update(r.id, { title: e.target.value })}
                className="w-full border-b border-white/60 focus:border-violet-400 outline-none py-1"
                placeholder={`Milestone ${idx + 1}`}
              />
              <label className="text-sm inline-flex items-center gap-2">
                <input type="checkbox" checked={!!r.done} onChange={(e) => update(r.id, { done: e.target.checked })} />
                Done
              </label>
              <button className="border rounded-md px-2 py-1" onClick={() => remove(r.id)} title="Delete">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <div className="text-sm text-ink/60">No milestones yet. Click “Add Milestone”.</div>}
        </div>
      </div>
    </div>
  );
}
