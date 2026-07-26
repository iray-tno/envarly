import { useEffect, useRef, useState } from "react";

export function clampWidth(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export interface UseResizableWidthOptions {
  storageKey: string;
  defaultWidth: number;
  min: number;
  max: number;
  /** Which edge of the viewport the panel docks to — determines drag direction. */
  side: "left" | "right";
}

function readStoredWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const stored = Number(localStorage.getItem(storageKey));
  const width = Number.isFinite(stored) && stored > 0 ? stored : defaultWidth;
  return clampWidth(width, min, max);
}

const KEYBOARD_STEP = 8;
const KEYBOARD_STEP_LARGE = 32;

export function useResizableWidth({
  storageKey,
  defaultWidth,
  min,
  max,
  side,
}: UseResizableWidthOptions) {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, defaultWidth, min, max));
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(width);

  useEffect(() => {
    if (isDragging) return;
    localStorage.setItem(storageKey, String(width));
  }, [isDragging, width, storageKey]);

  const direction = side === "left" ? 1 : -1;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = width;
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const delta = (e.clientX - dragStartXRef.current) * direction;
    setWidth(clampWidth(dragStartWidthRef.current + delta, min, max));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
    if (e.key === "ArrowLeft") setWidth((w) => clampWidth(w - step * direction, min, max));
    else if (e.key === "ArrowRight") setWidth((w) => clampWidth(w + step * direction, min, max));
    else if (e.key === "Home") setWidth(min);
    else if (e.key === "End") setWidth(max);
    else return;
    e.preventDefault();
  };

  return {
    width,
    isDragging,
    handleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      onKeyDown,
    },
  };
}
