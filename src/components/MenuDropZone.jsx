import { useDrop } from "react-dnd";

export default function MenuDropZone({ onDropItem, children }) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "MENU_ITEM",
    drop: (item) => onDropItem?.(item.id),
    collect: (m) => ({ isOver: m.isOver() }),
  }), [onDropItem]);

  return (
    <div ref={drop} className={isOver ? "dnd-drop-hover" : ""}>
      {children}
    </div>
  );
}
