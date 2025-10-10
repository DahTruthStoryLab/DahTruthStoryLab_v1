// src/components/storylab/Clothesline.jsx
import React, { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Pin, Users } from "lucide-react";
import { useDrag, useDrop } from "react-dnd";
import {
  loadProject,
  saveProject,
  ensureWorkshopFields,
  uid,
} from "../../lib/storylab/projectStore";
import BackToLanding, { BackToLandingFab } from "./BackToLanding";

/* ---------------------------
   DnD type
---------------------------- */
const ITEM = "CHAR_CARD";

/* ---------------------------
   Page banner (light/glass)
---------------------------- */
const PageBanner = () => (
  <div className="mx-auto mb-8">
    <div className="relative mx-auto max-w-3xl rounded-2xl border border-border bg-white/80 backdrop-blur-xl px-6 py-6 text-center shadow overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/10 pointer-events-none" />
      <div className="relative z-10">
        <div className="mx-auto mb-3 inline-flex items-center justify-center rounded-xl border border-border bg-white/70 px-4 py-1.5">
          <Pin size={14} className="mr-2 text-muted" />
          <span className="text-xs font-semibold tracking-wide text-muted">
            DahTruth · StoryLab
          </span>
        </div>
        <h1 className="text-3xl font-extrabold text-ink mb-2">Clothesline</h1>
        <p className="mt-1 text-sm text-muted max-w-xl mx-auto">
          Drag cards to reorder characters. Grid shows a 4×4 board; order is saved.
        </p>
      </div>
    </div>
  </div>
);

/* ---------------------------
   Character Card (presentational)
---------------------------- */
function CharacterCard({ c }) {
  return (
    <div className="rounded-xl border border-border bg-white/80 p-3 shadow-sm min-w-[220px]">
      <div className="flex items-center gap-2">
        <div className="rounded-lg border border-border bg-white/70 p-1.5">
          <Users className="h-4 w-4 text-muted" />
        </div>
        <div className="font-semibold text-ink">{c.name || "Unnamed"}</div>
        <span className="ml-auto text-[10px] rounded-full px-2 py-0.5 border border-border bg-white">
          {c.role || "Role"}
        </span>
      </div>
      {c.rel && <div className="text-xs text-muted mt-1">{c.rel}</div>}
      <div className="flex flex-wrap gap-1 mt-2">
        {(c.traits || []).map((t) => (
          <span
            key={t}
            className="text-[10px] px-2 py-0.5 rounded-md border border-border bg-white"
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------
   Draggable + Droppable Card
---------------------------- */
function DraggableCard({ index, c, move, onDropPersist }) {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: ITEM,
    hover(item) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      move(dragIndex, hoverIndex);
      item.index = hoverIndex; // mutate index to avoid jitter
    },
    drop() {
      onDropPersist();
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`transition-opacity ${isDragging ? "opacity-50" : "opacity-100"}`}
    >
      <CharacterCard c={c} />
    </div>
  );
}

/* ------------------------------------------------
   Clothesline (single export — no duplicates)
------------------------------------------------- */
export default function Clothesline() {
  // Load & ensure structure
  const [project, setProject] = useState(() =>
    ensureWorkshopFields(loadProject())
  );

  // Make sure characters array exists
  const characters = useMemo(() => {
    const arr = Array.isArray(project.characters) ? project.characters : [];
    // give ids if missing (helps DnD keys)
    return arr.map((ch) => (ch.id ? ch : { ...ch, id: uid() }));
  }, [project]);

  // Local working order for DnD (doesn't mutate store until drop finishes)
  const [order, setOrder] = useState(characters);

  // Reorder in-memory
  const move = useCallback((from, to) => {
    setOrder((prev) => {
      const next = prev.slice();
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      return next;
    });
  }, []);

  // Persist new order back to shared project
  const persistOrder = useCallback(() => {
    const copy = JSON.parse(JSON.stringify(project));
    copy.characters = order;
    ensureWorkshopFields(copy);
    saveProject(copy);
    setProject(copy);
    try {
      window.dispatchEvent(new Event("project:change"));
    } catch {}
  }, [order, project]);

  // 4×4 grid sizing hint (cards will flow; if >16, it wraps next rows)
  const gridCls =
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start";

  return (
    <div className="min-h-screen bg-base text-ink">
      {/* Global back bar with quick jump to Workshop Hub */}
      <BackToLanding
        title="Clothesline"
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

        {/* Draggable 4×4 Board */}
        <div className="rounded-2xl border border-border bg-white/70 backdrop-blur-xl p-4">
          <div className="mb-3 text-sm text-muted">
            Drag to reorder. Order is saved when you release a card.
          </div>

          <div className={gridCls}>
            {order.map((c, i) => (
              <DraggableCard
                key={c.id || `${c.name}-${i}`}
                index={i}
                c={c}
                move={move}
                onDropPersist={persistOrder}
              />
            ))}
            {order.length === 0 && (
              <div className="text-sm text-muted">
                No characters yet. Add some in your Workshop.
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-muted mt-3">
          (This view reads & writes <code>project.characters</code>.)
        </div>
      </div>

      {/* Mobile “Back to Landing” button */}
      <BackToLandingFab />
    </div>
  );
}

