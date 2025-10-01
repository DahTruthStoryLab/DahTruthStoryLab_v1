// src/components/storylab/PriorityCards.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, GripVertical, Trash2, Flag, Tag, CheckCircle, ListChecks } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields, uid } from "../../lib/storylab/projectStore";

const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-white/40 bg-white/20 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-amber-500/5 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-white/50 bg-white/40 px-4 py-1.5">
          <ListChecks size={14} className="mr-2 text-ink/70" />
          <span className="text-xs font-semibold tracking-wide text-ink/80">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Priority Cards</h1>
        <p className="mt-1 text-sm text-ink/70 max-w-xl mx-auto">Drag to reorder · Inline edit · Autosave</p>
      </div>
    </div>
  </div>
);

export default function PriorityCards() {
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));
  const [dragging, setDragging] = useState(null);
  const items = project.priorities;

  const commit = (mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
  };

  const add = () =>
    commit(p => { p.priorities.push({ id: uid(), title: "New priority", scope: "Character", priority: "Medium", status: "Open", done: false }); });

  const del = (id) => commit(p => { p.priorities = p.priorities.filter(c => c.id !== id); });

  const edit = (id, patch) =>
    commit(p => {
      const it = p.priorities.find(x => x.id === id);
      if (it) Object.assign(it, patch);
    });

  const onDragStart = (id) => setDragging(id);
  const onDragOver = (e, overId) => {
    e.preventDefault();
    if (!dragging || dragging === overId) return;
    commit(p => {
      const a = p.priorities.findIndex(c => c.id === dragging);
      const b = p.priorities.findIndex(c => c.id === overId);
      const [moved] = p.priorities.splice(a, 1);
      p.priorities.splice(b, 0, moved);
    });
  };
  const onDragEnd = () => setDragging(null);

  return (
    <div className="min-h-screen bg-base text-ink">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4">
          <Link to="/story-lab/workshop" className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm hover:bg-white backdrop-blur">
            <ArrowLeft className="h-4 w-4" /> Back to Workshop
          </Link>
        </div>

        <PageBanner />

        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl px-3 py-1 border bg-white/60">Priority Cards</div>
              <span className="text-sm text-ink/70">Drag to reorder · Inline edit</span>
            </div>
            <button onClick={add} className="rounded-lg px-3 py-2 border bg-gradient-to-r from-purple-600 to-violet-500 text-white text-sm shadow hover:shadow-md">
              <Plus className="h-4 w-4 inline mr-1" /> Add Card
            </button>
          </div>

          <div className="grid gap-3">
            {items.map(card => (
              <div
                key={card.id}
                draggable
                onDragStart={() => onDragStart(card.id)}
                onDragOver={(e) => onDragOver(e, card.id)}
                onDragEnd={onDragEnd}
                className={`bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-sm ${dragging===card.id ? "rotate-[0.5deg] shadow" : "hover:shadow"}`}
              >
                <div className="flex items-start gap-3">
                  <div className="cursor-grab pt-1 text-ink/40" title="Drag">
                    <GripVertical />
                  </div>
                  <div className="flex-1">
                    <input
                      value={card.title}
                      onChange={(e)=>edit(card.id,{ title: e.target.value })}
                      className="w-full bg-transparent border-b border-white/60 focus:border-violet-400 outline-none text-ink text-base"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs bg-white/70">
                        <Tag className="h-3 w-3"/>
                        <select value={card.scope} onChange={(e)=>edit(card.id,{scope:e.target.value})} className="bg-transparent outline-none">
                          <option>Character</option><option>Plot</option><option>World</option><option>Craft</option>
                        </select>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs bg-white/70">
                        <Flag className="h-3 w-3 text-amber-500"/>
                        <select value={card.priority} onChange={(e)=>edit(card.id,{priority:e.target.value})} className="bg-transparent outline-none">
                          <option>High</option><option>Medium</option><option>Low</option>
                        </select>
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs bg-white/70">
                        <CheckCircle className="h-3 w-3 text-emerald-600"/>
                        <select value={card.status} onChange={(e)=>edit(card.id,{status:e.target.value})} className="bg-transparent outline-none">
                          <option>Open</option><option>In Session</option><option>Done</option>
                        </select>
                      </span>
                    </div>
                  </div>
                  <button onClick={()=>del(card.id)} className="bg-white/70 border border-white/60 p-2 rounded-lg text-ink/70 hover:text-ink" title="Delete">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="text-sm text-ink/60 p-2">No cards yet. Click “Add Card”.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
