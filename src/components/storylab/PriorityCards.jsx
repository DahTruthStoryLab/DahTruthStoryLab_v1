// src/components/storylab/PriorityCards.jsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, GripVertical, Trash2, Flag, Tag, CheckCircle, ListChecks } from "lucide-react";
import { loadProject, saveProject, ensureWorkshopFields, uid } from "../../lib/storylab/projectStore";
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
          <ListChecks size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">DahTruth · StoryLab</span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Priority Cards</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">Drag to reorder · Inline edit · Autosave</p>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------
   DraggableCard - Internal component for cards
------------------------------------------------- */
const DraggableCard = ({ card, index, isDragging, onEdit, onDelete, moveCard }) => {
  const dragRef = useRef(null);
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  const handleDragStart = (e) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e) => {
    dragOverItem.current = index;
    if (dragItem.current !== null && dragItem.current !== dragOverItem.current) {
      moveCard(dragItem.current, dragOverItem.current);
      dragItem.current = dragOverItem.current;
    }
  };

  const handleDragEnd = (e) => {
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div
      ref={dragRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnter={handleDragEnter}
      onDragEnd={handleDragEnd}
      className={`bg-white/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-sm transition-all ${
        isDragging ? "opacity-50 rotate-[0.5deg] shadow-lg" : "hover:shadow-md"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="cursor-grab active:cursor-grabbing pt-1 text-muted" title="Drag to reorder">
          <GripVertical />
        </div>

        <div className="flex-1">
          <input
            value={card.title}
            onChange={(e) => onEdit(card.id, { title: e.target.value })}
            className="w-full bg-transparent border-b border-border focus:border-primary outline-none text-ink text-base"
            placeholder="Priority title"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <Tag className="h-3 w-3" />
              <select
                value={card.scope}
                onChange={(e) => onEdit(card.id, { scope: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>Character</option>
                <option>Plot</option>
                <option>World</option>
                <option>Craft</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <Flag className="h-3 w-3 text-amber-600" />
              <select
                value={card.priority}
                onChange={(e) => onEdit(card.id, { priority: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </span>

            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs bg-white/70">
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              <select
                value={card.status}
                onChange={(e) => onEdit(card.id, { status: e.target.value })}
                className="bg-transparent outline-none"
              >
                <option>Open</option>
                <option>In Session</option>
                <option>Done</option>
              </select>
            </span>
          </div>
        </div>

        <button
          onClick={() => onDelete(card.id)}
          className="bg-white/70 border border-border p-2 rounded-lg text-muted hover:text-ink transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------
   PriorityCards (single export — no duplicates)
------------------------------------------------- */
export default function PriorityCards() {
  // Initialize project state with workshop fields (memoized)
  const initialProject = useMemo(() => ensureWorkshopFields(loadProject()), []);
  const [project, setProject] = useState(initialProject);
  const [dragging, setDragging] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  
  // Memoized items array
  const items = useMemo(() => 
    Array.isArray(project.priorities) ? project.priorities : [], 
    [project.priorities]
  );

  // Commit changes to project store and trigger updates (memoized callback)
  const commit = useCallback((mutator) => {
    const copy = JSON.parse(JSON.stringify(project));
    mutator(copy);
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try { 
      window.dispatchEvent(new Event("project:change")); 
    } catch {}
  }, [project]);

  // Persist whenever project changes
  useEffect(() => {
    saveProject(project);
  }, [project]);

  // Add new priority card (memoized)
  const add = useCallback(() => {
    commit((p) => {
      p.priorities.push({
        id: uid(),
        title: "New priority",
        scope: "Character",
        priority: "Medium",
        status: "Open",
        done: false,
      });
    });
  }, [commit]);

  // Delete priority card by id (memoized)
  const del = useCallback((id) => {
    commit((p) => { 
      p.priorities = p.priorities.filter((c) => c.id !== id); 
    });
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [commit, selectedId]);

  // Edit priority card fields (memoized)
  const edit = useCallback((id, patch) => {
    commit((p) => {
      const it = p.priorities.find((x) => x.id === id);
      if (it) Object.assign(it, patch);
    });
  }, [commit]);

  // Enhanced moveCard function for drag-and-drop reordering (memoized)
  const moveCard = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    commit((p) => {
      const result = [...p.priorities];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      p.priorities = result;
    });
  }, [commit]);

  // Drag & drop handlers (keeping for compatibility)
  const onDragStart = useCallback((id) => {
    setDragging(id);
    setSelectedId(id);
  }, []);

  const onDragOver = useCallback((e, overId) => {
    e.preventDefault();
    if (!dragging || dragging === overId) return;
    commit((p) => {
      const a = p.priorities.findIndex((c) => c.id === dragging);
      const b = p.priorities.findIndex((c) => c.id === overId);
      if (a !== -1 && b !== -1) {
        const [moved] = p.priorities.splice(a, 1);
        p.priorities.splice(b, 0, moved);
      }
    });
  }, [dragging, commit]);

  const onDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // Select card handler
  const selectCard = useCallback((id) => {
    setSelectedId(id);
  }, []);

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to Workshop Hub */}
      <BackToLanding
        title="Priority Cards"
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

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xl border border-border rounded-2xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl px-3 py-1 border border-border bg-white/60">
                Priority Cards
                {selectedId && <span className="ml-2 text-xs text-muted">• Selected</span>}
              </div>
              <span className="text-sm text-muted">Drag to reorder · Inline edit</span>
            </div>
            <button
              onClick={add}
              className="rounded-lg px-3 py-2 border border-border bg-white hover:bg-white/90 text-sm transition-colors"
              title="Add card"
            >
              <Plus className="h-4 w-4 inline mr-1" /> Add Card
            </button>
          </div>

          {/* Cards Grid - Using DraggableCard component */}
          <div className="grid gap-3">
            {items.map((card, index) => (
              <DraggableCard
                key={card.id}
                card={card}
                index={index}
                isDragging={dragging === card.id}
                onEdit={edit}
                onDelete={del}
                moveCard={moveCard}
              />
            ))}

            {items.length === 0 && (
              <div className="text-sm text-muted p-2">No cards yet. Click "Add Card".</div>
            )}
          </div>

          {/* Stats footer */}
          {items.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl border border-border rounded-2xl px-4 py-3 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>Total Cards: {items.length}</span>
                <span>
                  {items.filter(c => c.status === "Done").length} Done · {" "}
                  {items.filter(c => c.status === "In Session").length} In Session · {" "}
                  {items.filter(c => c.status === "Open").length} Open
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile "Back to Landing" button */}
      <BackToLandingFab />
    </div>
  );
}
