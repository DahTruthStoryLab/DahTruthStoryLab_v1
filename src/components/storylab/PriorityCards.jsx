// src/components/storylab/PriorityCards.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Trash2, GripVertical, Edit3, CheckCircle, Flag, Tag } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields, uid } from "../../lib/storylab/projectStore";

/**
 * Card shape:
 * { id, title, scope: 'Character'|'Plot'|'World'|'Craft',
 *   priority: 'High'|'Medium'|'Low',
 *   status: 'Open'|'In Session'|'Done',
 *   origin?: 'Critique'|'Prompt'|'Manual',
 *   characterIds?: string[], sceneIds?: string[],
 *   dueAt?: string }
 */

export default function PriorityCards() {
  const [project, setProject] = useState(() => ensureWorkshopFields(loadProject()));
  const [filter, setFilter] = useState({ scope: "All", status: "All", priority: "All" });
  const [draggingId, setDraggingId] = useState(null);

  const cards = project?.priorities || [];

  const commit = (mut) => {
    const copy = JSON.parse(JSON.stringify(project || {}));
    mut(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
  };

  const add = () =>
    commit(p => {
      p.priorities.push({
        id: uid(),
        title: "New priority",
        scope: "Character",
        priority: "Medium",
        status: "Open",
        origin: "Manual",
        characterIds: [],
        sceneIds: []
      });
    });

  const update = (id, patch) =>
    commit(p => {
      const it = p.priorities.find(x => x.id === id);
      if (it) Object.assign(it, patch);
    });

  const remove = (id) =>
    commit(p => { p.priorities = p.priorities.filter(x => x.id !== id); });

  // Basic HTML5 drag & drop (no extra deps)
  const onDragStart = (id) => setDraggingId(id);
  const onDragOver = (e, overId) => {
    e.preventDefault();
    if (!draggingId || draggingId === overId) return;
    commit(p => {
      const a = p.priorities.findIndex(x => x.id === draggingId);
      const b = p.priorities.findIndex(x => x.id === overId);
      if (a < 0 || b < 0) return;
      const [moved] = p.priorities.splice(a, 1);
      p.priorities.splice(b, 0, moved);
    });
  };
  const onDragEnd = () => setDraggingId(null);

  const filtered = useMemo(() => {
    return cards.filter(c => {
      if (filter.scope !== "All" && c.scope !== filter.scope) return false;
      if (filter.status !== "All" && c.status !== filter.status) return false;
      if (filter.priority !== "All" && c.priority !== filter.priority) return false;
      return true;
    });
  }, [cards, filter]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">Priority Cards</h2>
        <button onClick={add} className="inline-flex items-center gap-2 rounded-lg border border-white/60 bg-accent/70 px-3 py-2 text-ink hover:bg-accent">
          <Plus size={16}/> Add Card
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2">
        <select
          value={filter.scope}
          onChange={e => setFilter(f => ({ ...f, scope: e.target.value }))}
          className="rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm text-ink"
        >
          {["All","Character","Plot","World","Craft"].map(x => <option key={x}>{x}</option>)}
        </select>
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm text-ink"
        >
          {["All","Open","In Session","Done"].map(x => <option key={x}>{x}</option>)}
        </select>
        <select
          value={filter.priority}
          onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}
          className="rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm text-ink"
        >
          {["All","High","Medium","Low"].map(x => <option key={x}>{x}</option>)}
        </select>
      </div>

      <div className="grid gap-3">
        {filtered.map(card => (
          <div
            key={card.id}
            draggable
            onDragStart={() => onDragStart(card.id)}
            onDragOver={(e) => onDragOver(e, card.id)}
            onDragEnd={onDragEnd}
            className={`rounded-xl border border-white/60 bg-white/80 p-4 backdrop-blur-xl ${draggingId===card.id ? "opacity-70" : ""}`}
          >
            <div className="flex items-start gap-2">
              <div className="cursor-grab mt-1" title="Drag to reorder">
                <GripVertical className="text-ink/50"/>
              </div>
              <div className="flex-1">
                <input
                  value={card.title}
                  onChange={(e)=>update(card.id,{title:e.target.value})}
                  className="w-full bg-transparent border-b border-white/60 focus:border-ink/40 outline-none text-ink text-base"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 py-1">
                    <Tag size={12}/> 
                    <select
                      value={card.scope}
                      onChange={e => update(card.id, { scope: e.target.value })}
                      className="bg-transparent outline-none"
                    >
                      <option>Character</option><option>Plot</option><option>World</option><option>Craft</option>
                    </select>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 py-1">
                    <Flag size={12}/>
                    <select
                      value={card.priority}
                      onChange={e => update(card.id, { priority: e.target.value })}
                      className="bg-transparent outline-none"
                    >
                      <option>High</option><option>Medium</option><option>Low</option>
                    </select>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md border border-white/60 bg-white/70 px-2 py-1">
                    <CheckCircle size={12}/>
                    <select
                      value={card.status}
                      onChange={e => update(card.id, { status: e.target.value })}
                      className="bg-transparent outline-none"
                    >
                      <option>Open</option><option>In Session</option><option>Done</option>
                    </select>
                  </span>

                  {/* origin is helpful to see where card came from */}
                  {card.origin && (
                    <span className="ml-1 rounded-md border border-white/60 bg-white px-2 py-1">from: {card.origin}</span>
                  )}
                </div>
              </div>

              <button
                onClick={()=>remove(card.id)}
                className="rounded-lg border border-white/60 bg-white/70 p-2 text-ink/70 hover:text-ink"
                title="Delete"
              >
                <Trash2 size={16}/>
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-ink/60 text-sm p-3 border border-white/60 bg-white/70 rounded-xl">
            No cards match your filters. Try adding one or changing the filters.
          </div>
        )}
      </div>
    </div>
  );
}
