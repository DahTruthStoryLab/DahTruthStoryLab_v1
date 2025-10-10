// src/components/storylab/CharacterRoadmap.jsx
import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Map as RouteIcon,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import {
  loadProject,
  saveProject,
  ensureWorkshopFields,
  uid,
} from "../../lib/storylab/projectStore";
import BackToLanding, { BackToLandingFab } from "./BackToLanding";

/* ---------------------------
   Page banner (light/glass)
---------------------------- */
const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-4 py-1.5">
          <RouteIcon size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">
            DahTruth · StoryLab
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">
          Character Roadmap
        </h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          A phased view of your progression. Drag to reorder milestones.
        </p>
      </div>
    </div>
  </div>
);

/* ---------------------------
   DnD type
---------------------------- */
const ItemTypes = {
  MILESTONE: "MILESTONE",
};

/* -------------------------------------------------
   Draggable Milestone Row
-------------------------------------------------- */
function DraggableMilestone({
  item,
  index,
  moveItem, // (from, to) => void
  update,
  remove,
}) {
  const ref = useRef(null);

  // Drop target — accepts other milestones and reorders on hover
  const [, drop] = useDrop({
    accept: ItemTypes.MILESTONE,
    hover(dragItem) {
      if (!ref.current) return;
      if (dragItem.index === index) return;
      moveItem(dragItem.index, index);
      dragItem.index = index; // mutate drag index so it doesn’t thrash
    },
  });

  // Drag source
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MILESTONE,
    item: { id: item.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`grid gap-2 md:grid-cols-[auto_1fr_auto_auto] items-center border border-border bg-white rounded-xl px-3 py-2 transition-shadow ${
        isDragging ? "opacity-60 shadow-inner" : "hover:shadow-sm"
      }`}
    >
      {/* Drag handle */}
      <div
        className="flex items-center justify-center pr-1 cursor-grab active:cursor-grabbing select-none"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5 text-slate-400" />
      </div>

      {/* Title input */}
      <input
        value={item.title}
        onChange={(e) => update(item.id, { title: e.target.value })}
        className="w-full border-b border-border focus:border-primary outline-none py-1"
        placeholder="Milestone title"
      />

      {/* Done checkbox */}
      <label className="text-sm inline-flex items-center gap-2 justify-self-start md:justify-self-center">
        <input
          type="checkbox"
          checked={!!item.done}
          onChange={(e) => update(item.id, { done: e.target.checked })}
        />
        Done
      </label>

      {/* Delete */}
      <button
        className="border border-border rounded-md px-2 py-1 justify-self-end"
        onClick={() => remove(item.id)}
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ------------------------------------------------
   CharacterRoadmap (single export — no duplicates)
------------------------------------------------- */
export default function CharacterRoadmap() {
  const [project, setProject] = useState(() =>
    ensureWorkshopFields(loadProject())
  );
  const items = project.roadmap || [];

  // Persist helper
  const commit = (mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  };

  // CRUD
  const add = () =>
    commit((p) => {
      p.roadmap.push({ id: uid(), title: "New Milestone", done: false });
    });

  const remove = (id) =>
    commit((p) => {
      p.roadmap = p.roadmap.filter((r) => r.id !== id);
    });

  const update = (id, patch) =>
    commit((p) => {
      const r = p.roadmap.find((x) => x.id === id);
      if (r) Object.assign(r, patch);
    });

  // Reorder (DnD)
  const moveItem = (fromIndex, toIndex) =>
    commit((p) => {
      const list = p.roadmap;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= list.length ||
        toIndex >= list.length
      )
        return;
      const [m] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, m);
    });

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with a quick jump to Workshop Hub */}
      <BackToLanding
        title="Character Roadmap"
        rightSlot={
          <Link
            to="/story-lab/workshop"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium bg-white/70 border border-border hover:bg-white"
            title="Open Workshop Hub"
          >
            Workshop Hub
          </Link>
        }
      />

      <div className="mx-auto max-w-6xl px-6 py-8">
        <PageBanner />

        <div className="rounded-2xl border border-border bg-white/70 backdrop-blur-xl p-6 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm text-muted">
              Drag milestones to reorder (top = earlier).
            </div>
            <button
              onClick={add}
              className="rounded-lg px-3 py-2 border border-border bg-white hover:bg-white/90 text-sm"
            >
              <Plus className="h-4 w-4 inline mr-1" /> Add Milestone
            </button>
          </div>

          {items.map((r, idx) => (
            <DraggableMilestone
              key={r.id}
              item={r}
              index={idx}
              moveItem={moveItem}
              update={update}
              remove={remove}
            />
          ))}

          {items.length === 0 && (
            <div className="text-sm text-muted">
              No milestones yet. Click “Add Milestone”.
            </div>
          )}
        </div>
      </div>

      {/* Mobile “Back to Landing” button */}
      <BackToLandingFab />
    </div>
  );
}
