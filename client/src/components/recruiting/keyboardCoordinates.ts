import type { KeyboardCoordinateGetter } from "@dnd-kit/core";

// One arrow press reaches the adjacent column, including empty columns.
export const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, { context, currentCoordinates }) => {
  if (!["ArrowLeft", "ArrowRight"].includes(event.code)) return;
  event.preventDefault();
  const current = context.collisionRect;
  if (!current) return;
  const candidates = context.droppableContainers.getEnabled()
    .map(c => context.droppableRects.get(c.id)).filter((rect): rect is NonNullable<typeof rect> => !!rect)
    .filter(rect => event.code === "ArrowRight" ? rect.left > current.left + 10 : rect.left < current.left - 10)
    .sort((a, b) => Math.abs(a.left - current.left) - Math.abs(b.left - current.left));
  const target = candidates[0];
  return target ? { x: currentCoordinates.x + target.left - current.left, y: currentCoordinates.y + target.top - current.top } : undefined;
};

