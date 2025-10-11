// src/components/MenuItem.jsx
import { useDrag } from "react-dnd";

export default function MenuItem({ id, children }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "MENU_ITEM",            // must match drop zone's accept
    item: { id },
    collect: (m) => ({ isDragging: m.isDragging() }),
  }), [id]);

  return (
    <div
      ref={drag}
      className={isDragging ? "dnd-draggable dnd-dragging" : "dnd-draggable"}
    >
      {children}
    </div>
  );
}
